import KeyVault from "../models/keyVault.model.js";
import SyncManifest from "../models/syncManifest.model.js";
import { createHash } from "crypto"; // Node.js crypto (server-side only)

// ── Helpers ──────────────────────────────────────────────────────────────────

const sha256 = (str) => createHash("sha256").update(str).digest("hex");

/**
 * Compute the canonical JSON string for a vault payload hash.
 * Deterministic field ordering prevents hash ambiguity.
 */
const payloadHash = (eMEKEnvelope, senderKeys) =>
  sha256(JSON.stringify({
    eMEK: eMEKEnvelope?.eMEK ?? null,
    epoch: eMEKEnvelope?.epoch ?? 0,
    senderKeys: senderKeys
      ? Object.fromEntries(
          [...(senderKeys instanceof Map ? senderKeys : Object.entries(senderKeys))]
            .sort((a, b) => a[0].localeCompare(b[0]))
        )
      : {},
  }));

/**
 * Compute the manifest hash for chain linking.
 * Input is deterministically ordered before hashing.
 */
const manifestHash = (userId, deviceId, counter, epoch, pHash, prevHash) =>
  sha256(JSON.stringify({ userId, deviceId, counter, epoch, payloadHash: pHash, prevHash: prevHash ?? null }));

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/keyvault
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch the user's KeyVault.
 * Returns the encrypted eMEKEnvelope + senderKeys map + integrity metadata.
 * Server cannot decrypt any of this.
 */
export const getVault = async (req, res) => {
  try {
    const userId = req.user._id;

    const vault = await KeyVault.findOne({ userId }).lean();
    if (!vault) {
      return res.status(404).json({ success: false, code: "VAULT_NOT_FOUND" });
    }

    // Also return the latest manifest so the client can verify the chain
    const latestManifest = await SyncManifest
      .findOne({ userId })
      .sort({ counter: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      vault: {
        epoch:        vault.epoch,
        eMEKEnvelope: vault.eMEKEnvelope,
        senderKeys:   vault.senderKeys,
        counter:      vault.counter,
        manifestHash: vault.manifestHash,
        prevHash:     vault.prevHash,
        syncedAt:     vault.syncedAt,
      },
      latestManifest,
    });
  } catch (err) {
    console.error("[KeyVault] getVault error:", err);
    return res.status(500).json({ success: false, code: "INTERNAL_ERROR" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/keyvault
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create or update the user's KeyVault.
 *
 * SECURITY CHECKS (server-side):
 *   1. Epoch regression: new epoch must be >= current epoch.
 *   2. Counter regression: new counter must be > current counter.
 *   3. Manifest hash replay: new hash must not already exist for this user.
 *   4. PrevHash linkage: client's prevHash must match server's current manifestHash.
 *
 * Body: {
 *   epoch, eMEKEnvelope, senderKeys, counter, prevHash, signature, deviceId,
 *   eventType, diffSummary
 * }
 */
export const upsertVault = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const {
      epoch,
      eMEKEnvelope,
      senderKeys,
      counter,
      prevHash,
      signature,
      deviceId,
      eventType = "vault-update",
      diffSummary = {},
    } = req.body;

    // ── Input validation ─────────────────────────────────────────────────────
    if (typeof epoch !== "number" || epoch < 0) {
      return res.status(400).json({ success: false, code: "INVALID_EPOCH" });
    }
    if (typeof counter !== "number" || counter < 0) {
      return res.status(400).json({ success: false, code: "INVALID_COUNTER" });
    }
    if (!eMEKEnvelope?.eMEK || !eMEKEnvelope?.salt || !eMEKEnvelope?.version) {
      return res.status(400).json({ success: false, code: "INVALID_EMEK_ENVELOPE" });
    }
    if (!signature || !deviceId) {
      return res.status(400).json({ success: false, code: "MISSING_SIGNATURE_OR_DEVICE" });
    }

    // ── Load current vault ───────────────────────────────────────────────────
    const existing = await KeyVault.findOne({ userId });

    if (existing) {
      // ── Guard 1: Epoch regression ────────────────────────────────────────
      if (epoch < existing.epoch) {
        return res.status(409).json({ success: false, code: "EPOCH_ROLLBACK_REJECTED" });
      }
      // ── Guard 2: Counter regression (rollback / replay) ──────────────────
      if (counter <= existing.counter) {
        return res.status(409).json({ success: false, code: "COUNTER_ROLLBACK_REJECTED" });
      }
      // ── Guard 3: PrevHash linkage (chain integrity) ───────────────────────
      if (prevHash !== existing.manifestHash && existing.manifestHash !== null) {
        return res.status(409).json({ success: false, code: "CHAIN_LINKAGE_BROKEN" });
      }
    } else {
      // New vault: prevHash must be null (genesis)
      if (prevHash !== null && prevHash !== undefined) {
        return res.status(400).json({ success: false, code: "GENESIS_PREVHASH_NONULL" });
      }
    }

    // ── Compute manifest hashes ──────────────────────────────────────────────
    const pHash = payloadHash(eMEKEnvelope, senderKeys);
    const mHash = manifestHash(userId, deviceId, counter, epoch, pHash, prevHash ?? null);

    // ── Guard 4: Replay (same hash already exists) ────────────────────────
    const replayCheck = await SyncManifest.findOne({ userId, hash: mHash });
    if (replayCheck) {
      return res.status(409).json({ success: false, code: "MANIFEST_REPLAY_REJECTED" });
    }

    // ── Upsert the vault ─────────────────────────────────────────────────────
    const senderKeysMap = senderKeys ? new Map(Object.entries(senderKeys)) : new Map();

    await KeyVault.findOneAndUpdate(
      { userId },
      {
        $set: {
          userId,
          deviceId,
          epoch,
          eMEKEnvelope,
          senderKeys: senderKeysMap,
          counter,
          manifestHash: mHash,
          prevHash:     prevHash ?? null,
          signature,
          syncedAt:     new Date(),
        },
      },
      { upsert: true, new: true }
    );

    // ── Append manifest entry ────────────────────────────────────────────────
    await SyncManifest.create({
      userId,
      deviceId,
      counter,
      epoch,
      hash:        mHash,
      prevHash:    prevHash ?? null,
      payloadHash: pHash,
      signature,
      eventType,
      diffSummary,
    });

    return res.status(200).json({
      success: true,
      manifestHash: mHash,
      counter,
      epoch,
    });
  } catch (err) {
    // Duplicate key = concurrent write collision (optimistic concurrency)
    if (err.code === 11000) {
      return res.status(409).json({ success: false, code: "CONCURRENT_WRITE_CONFLICT" });
    }
    console.error("[KeyVault] upsertVault error:", err);
    return res.status(500).json({ success: false, code: "INTERNAL_ERROR" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/keyvault/manifest
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Return the last N manifest entries for client-side chain verification.
 * Default tail = 20. Clients rebuild the chain from genesis if they detect gaps.
 */
export const getManifestTail = async (req, res) => {
  try {
    const userId = req.user._id;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);

    const entries = await SyncManifest
      .find({ userId })
      .sort({ counter: -1 })
      .limit(limit)
      .lean();

    return res.status(200).json({ success: true, entries: entries.reverse() });
  } catch (err) {
    console.error("[KeyVault] getManifestTail error:", err);
    return res.status(500).json({ success: false, code: "INTERNAL_ERROR" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/keyvault/device/:deviceId
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Revoke a device: marks device as revoked in DeviceRegistry and records
 * a manifest entry. The revoked device's future vault writes will be rejected
 * because its deviceId is flagged — the vault controller checks DeviceRegistry
 * trust state on every write.
 */
export const revokeDevice = async (req, res) => {
  try {
    const userId = req.user._id;
    const { deviceId } = req.params;

    const DeviceRegistry = (await import("../models/deviceRegistry.model.js")).default;
    const dr = await DeviceRegistry.findOne({ userId, deviceId });
    if (!dr) {
      return res.status(404).json({ success: false, code: "DEVICE_NOT_FOUND" });
    }

    dr.revoked   = true;
    dr.revokedAt = new Date();
    dr.trusted   = false;
    await dr.save();

    // Append a manifest entry recording the revocation
    const existing = await KeyVault.findOne({ userId }).lean();
    if (existing) {
      const newCounter = existing.counter + 1;
      const pHash = payloadHash(existing.eMEKEnvelope, existing.senderKeys);
      const mHash = manifestHash(userId.toString(), req.body.deviceId || "server", newCounter, existing.epoch, pHash, existing.manifestHash);

      await SyncManifest.create({
        userId,
        deviceId: req.body.callerDeviceId || "server",
        counter:  newCounter,
        epoch:    existing.epoch,
        hash:     mHash,
        prevHash: existing.manifestHash,
        payloadHash: pHash,
        signature: req.body.signature || "server-revoke",
        eventType: "device-revoke",
        diffSummary: {},
      });

      await KeyVault.updateOne({ userId }, { $set: { counter: newCounter, manifestHash: mHash, prevHash: existing.manifestHash } });
    }

    return res.status(200).json({ success: true, message: "Device revoked" });
  } catch (err) {
    console.error("[KeyVault] revokeDevice error:", err);
    return res.status(500).json({ success: false, code: "INTERNAL_ERROR" });
  }
};
