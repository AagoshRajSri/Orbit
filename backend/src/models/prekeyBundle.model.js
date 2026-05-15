import mongoose from "mongoose";

/**
 * Prekey Bundle Schema
 *
 * Stores per-user X3DH prekey material (public keys only).
 * Private keys NEVER reach the server — only the client holds them.
 *
 * Structure mirrors the Signal prekey bundle format:
 *   - identityKey:    Long-term ECDH public key (same as user.publicKey)
 *   - signingKey:     Long-term ECDSA public key (for SPK signature verification)
 *   - signedPrekey:   Medium-term ECDH public key (rotated ~weekly)
 *   - spkSignature:   ECDSA signature of signedPrekey by signingKey
 *   - oneTimePrekeys: Array of single-use ECDH public keys (consumed on handshake)
 *
 * Phase 4 (Post-Quantum) additions:
 *   - hybridKem.classicalPublicKey: P-256 ECDH public key (classical KEM component)
 *   - hybridKem.kyberPublicKey:     ML-KEM-768 (Kyber) public key (PQ component)
 *   - hybridKem.algorithm:          "hybrid-kem-v1" | "classical-kem-v1"
 */
const prekeyBundleSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    // Long-term ECDH identity key (matches user.publicKey for backward compat)
    identityKey: {
      type: String,
      required: true,
    },
    // Long-term ECDSA signing key (used to verify SPK signature)
    signingKey: {
      type: String,
      required: true,
    },
    // Medium-term signed prekey
    signedPrekey: {
      type: String,
      required: true,
    },
    spkSignature: {
      type: String,
      required: true,
    },
    spkCreatedAt: {
      type: Date,
      default: Date.now,
    },
    // One-time prekeys (each is single-use)
    oneTimePrekeys: [
      {
        id:        { type: String, required: true },
        publicKey: { type: String, required: true },
      },
    ],

    // ── Phase 4: Hybrid KEM bundle (Post-Quantum) ─────────────────────────────
    // Optional — present only if the client supports ML-KEM-768.
    // When absent, the server falls back to serving the classical X3DH bundle only.
    hybridKem: {
      // P-256 ECDH public key (base64 SPKI) — classical component of hybrid KEM
      classicalPublicKey: { type: String, default: null },
      // ML-KEM-768 public key (base64) — post-quantum component
      kyberPublicKey:     { type: String, default: null },
      // "hybrid-kem-v1" when both keys present, "classical-kem-v1" when PQ unavailable
      algorithm:          { type: String, default: null },
      publishedAt:        { type: Date,   default: null },
    },
  },
  { timestamps: true }
);

// Index for OPK lookup by id
prekeyBundleSchema.index({ userId: 1, "oneTimePrekeys.id": 1 });

const PrekeyBundle = mongoose.model("PrekeyBundle", prekeyBundleSchema);
export default PrekeyBundle;
