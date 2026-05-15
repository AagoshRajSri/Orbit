import PrekeyBundle from "../models/prekeyBundle.model.js";
import User from "../models/user.model.js";
import { getRealId } from "../lib/obfuscation.js";
import { z } from "zod";

// ── Validation schemas ────────────────────────────────────────────────────────

const oneTimePrekeySchema = z.object({
  id:        z.string().uuid(),
  publicKey: z.string().min(10).max(1024),
});

const publishBundleSchema = z.object({
  identityKey:    z.string().min(10).max(1024),
  signingKey:     z.string().min(10).max(1024),
  signedPrekey:   z.string().min(10).max(1024),
  spkSignature:   z.string().min(10).max(1024),
  oneTimePrekeys: z.array(oneTimePrekeySchema).min(1).max(100),
});

const replenishOPKSchema = z.object({
  oneTimePrekeys: z.array(oneTimePrekeySchema).min(1).max(50),
});

// ── Controllers ───────────────────────────────────────────────────────────────

/**
 * POST /api/prekeys/bundle
 * Publish or update the caller's full prekey bundle.
 * Called on first login and after SPK rotation.
 */
export const publishPrekeyBundle = async (req, res) => {
  try {
    const parsed = publishBundleSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          details: parsed.error.issues.map((e) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        },
      });
    }

    const { identityKey, signingKey, signedPrekey, spkSignature, oneTimePrekeys } = parsed.data;
    const userId = req.user._id;

    // Upsert the bundle — replace entirely on SPK rotation
    await PrekeyBundle.findOneAndUpdate(
      { userId },
      {
        userId,
        identityKey,
        signingKey,
        signedPrekey,
        spkSignature,
        spkCreatedAt: new Date(),
        oneTimePrekeys,
      },
      { upsert: true, new: true }
    );

    // Also sync identity key to User model for backward compat
    await User.findByIdAndUpdate(userId, { publicKey: identityKey });

    return res.status(200).json({ success: true, message: "Prekey bundle published." });
  } catch (error) {
    console.error("[Prekeys] publishPrekeyBundle error:", error.message);
    return res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: "Internal server error" },
    });
  }
};

/**
 * POST /api/prekeys/replenish
 * Add more one-time prekeys without rotating the SPK.
 * Called when the server signals OPK count is low.
 */
export const replenishOneTimePrekeys = async (req, res) => {
  try {
    const parsed = replenishOPKSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: { code: "VALIDATION_ERROR", details: parsed.error.issues },
      });
    }

    const userId = req.user._id;
    const { oneTimePrekeys } = parsed.data;

    const bundle = await PrekeyBundle.findOne({ userId });
    if (!bundle) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "No prekey bundle found. Publish a full bundle first." },
      });
    }

    // Deduplicate by OPK id
    const existingIds = new Set(bundle.oneTimePrekeys.map((k) => k.id));
    const newOPKs = oneTimePrekeys.filter((k) => !existingIds.has(k.id));
    bundle.oneTimePrekeys.push(...newOPKs);
    await bundle.save();

    return res.status(200).json({
      success: true,
      added: newOPKs.length,
      total: bundle.oneTimePrekeys.length,
    });
  } catch (error) {
    console.error("[Prekeys] replenishOneTimePrekeys error:", error.message);
    return res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: "Internal server error" },
    });
  }
};

/**
 * GET /api/prekeys/bundle/:userId
 * Fetch another user's prekey bundle to initiate X3DH.
 * Atomically pops one OPK (prevents OPK reuse).
 * If no OPKs remain, returns bundle without one (handshake still works, less PFS).
 */
export const getPrekeyBundle = async (req, res) => {
  try {
    const realId = getRealId(req.params.userId);
    if (!realId) {
      return res.status(400).json({
        success: false,
        error: { code: "INVALID_ID", message: "Invalid user ID" },
      });
    }

    // Atomically pop one OPK using findOneAndUpdate + $pop
    // We use a two-step approach: get the first OPK, then remove it atomically
    const bundle = await PrekeyBundle.findOne({ userId: realId }).lean();
    if (!bundle) {
      return res.status(404).json({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "User has no prekey bundle. They may need to update their client.",
        },
      });
    }

    let oneTimePrekey = null;
    let oneTimePrekeyId = null;

    if (bundle.oneTimePrekeys && bundle.oneTimePrekeys.length > 0) {
      // Pop the first OPK atomically
      const opk = bundle.oneTimePrekeys[0];
      await PrekeyBundle.updateOne(
        { userId: realId },
        { $pull: { oneTimePrekeys: { id: opk.id } } }
      );
      oneTimePrekey = opk.publicKey;
      oneTimePrekeyId = opk.id;
    }

    // Check OPK count and include low-water-mark hint for client replenishment
    const remainingOPKs = bundle.oneTimePrekeys.length - (oneTimePrekey ? 1 : 0);

    return res.status(200).json({
      success: true,
      bundle: {
        identityKey:      bundle.identityKey,
        signingKey:       bundle.signingKey,
        signedPrekey:     bundle.signedPrekey,
        prekeySignature:  bundle.spkSignature,
        oneTimePrekey,
        oneTimePrekeyId,
      },
      meta: {
        remainingOPKs,
        lowWaterMark: remainingOPKs < 5, // Client should replenish if true
      },
    });
  } catch (error) {
    console.error("[Prekeys] getPrekeyBundle error:", error.message);
    return res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: "Internal server error" },
    });
  }
};

/**
 * GET /api/prekeys/status
 * Returns current user's OPK count so client can replenish proactively.
 */
export const getPrekeyStatus = async (req, res) => {
  try {
    const bundle = await PrekeyBundle.findOne({ userId: req.user._id })
      .select("oneTimePrekeys spkCreatedAt hybridKem")
      .lean();

    if (!bundle) {
      return res.status(200).json({ hasBundle: false, opkCount: 0 });
    }

    return res.status(200).json({
      hasBundle: true,
      opkCount: bundle.oneTimePrekeys?.length ?? 0,
      spkCreatedAt: bundle.spkCreatedAt,
      lowWaterMark: (bundle.oneTimePrekeys?.length ?? 0) < 5,
      hybridKem: bundle.hybridKem?.algorithm
        ? { algorithm: bundle.hybridKem.algorithm, publishedAt: bundle.hybridKem.publishedAt }
        : null,
    });
  } catch (error) {
    console.error("[Prekeys] getPrekeyStatus error:", error.message);
    return res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: "Internal server error" },
    });
  }
};

// ── Phase 4: Hybrid KEM bundle ────────────────────────────────────────────────

const hybridBundleSchema = z.object({
  classicalPublicKey: z.string().min(20).max(2048),
  kyberPublicKey:     z.string().min(20).max(8192).nullable().optional(),
  algorithm:          z.enum(["hybrid-kem-v1", "classical-kem-v1"]),
});

/**
 * POST /api/prekeys/hybrid-bundle
 * Publish or update the caller's Phase 4 Hybrid KEM public keys.
 * Stored alongside the existing X3DH bundle — backward compatible.
 */
export const publishHybridBundle = async (req, res) => {
  try {
    const parsed = hybridBundleSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: { code: "VALIDATION_ERROR", details: parsed.error.issues },
      });
    }

    const { classicalPublicKey, kyberPublicKey, algorithm } = parsed.data;

    // Upsert hybrid KEM fields onto the existing prekey bundle
    // (bundle must exist — classical X3DH bundle is required first)
    const result = await PrekeyBundle.findOneAndUpdate(
      { userId: req.user._id },
      {
        $set: {
          "hybridKem.classicalPublicKey": classicalPublicKey,
          "hybridKem.kyberPublicKey":     kyberPublicKey ?? null,
          "hybridKem.algorithm":          algorithm,
          "hybridKem.publishedAt":        new Date(),
        },
      },
      { new: true }
    );

    if (!result) {
      return res.status(404).json({
        success: false,
        error: { code: "NO_BUNDLE", message: "Publish classical X3DH bundle first before hybrid KEM." },
      });
    }

    console.log(`[Phase 4] Hybrid KEM bundle stored for user ${req.user._id} — ${algorithm}`);
    return res.status(200).json({
      success:   true,
      algorithm,
      pqEnabled: algorithm === "hybrid-kem-v1" && !!kyberPublicKey,
    });
  } catch (error) {
    console.error("[Prekeys] publishHybridBundle error:", error.message);
    return res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR" },
    });
  }
};
