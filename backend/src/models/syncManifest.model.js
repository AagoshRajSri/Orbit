import mongoose from "mongoose";

/**
 * SyncManifest — Hash-chained synchronization event log.
 *
 * PURPOSE:
 *   Forms a verifiable, append-only chain of synchronization events per user.
 *   Every vault write produces a new SyncManifest entry.
 *   Clients verify the chain on load to detect:
 *     - Replay attacks (duplicate counter / hash)
 *     - Rollback attacks (counter regression)
 *     - Server-forged state (signature mismatch)
 *     - Split-brain (divergent chains)
 *
 * CHAIN STRUCTURE:
 *   genesis:  { counter: 0, prevHash: null,     hash: H(payload_0), sig: device_sig }
 *   entry_1:  { counter: 1, prevHash: hash_0,   hash: H(payload_1), sig: device_sig }
 *   entry_N:  { counter: N, prevHash: hash_N-1, hash: H(payload_N), sig: device_sig }
 *
 * ROLLBACK REJECTION:
 *   Any entry with counter <= max(existing counters for userId) is rejected.
 *
 * REPLAY REJECTION:
 *   Any entry with hash == existing hash for same userId is rejected.
 */
const syncManifestSchema = new mongoose.Schema(
  {
    userId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "User",
      required: true,
      index:    true,
    },
    // Device that produced this manifest entry
    deviceId: {
      type:     String,
      required: true,
    },
    // Monotonically increasing — server rejects any entry <= current max
    counter: {
      type:     Number,
      required: true,
      min:      0,
    },
    // Current epoch of the key vault at time of this manifest
    epoch: {
      type:     Number,
      required: true,
      min:      0,
    },
    // SHA-256 of canonical JSON: { userId, deviceId, counter, epoch, payloadHash, prevHash }
    hash: {
      type:     String,
      required: true,
    },
    // Hash of the previous manifest entry (null for genesis)
    prevHash: {
      type:    String,
      default: null,
    },
    // SHA-256 of the vault payload this manifest covers (senderKeys map + eMEKEnvelope)
    payloadHash: {
      type:     String,
      required: true,
    },
    // Ed25519 / ECDSA P-256 signature by device identity key over `hash`
    // Allows peers to verify without trusting the server
    signature: {
      type:     String,
      required: true,
    },
    // Type of operation that produced this entry
    eventType: {
      type:    String,
      enum:    ["vault-init", "vault-update", "key-rotation", "sender-key-update", "device-link", "device-revoke"],
      default: "vault-update",
    },
    // Compact summary of what changed (for reconciliation, not decryption)
    diffSummary: {
      addedContexts:   [String],
      updatedContexts: [String],
      removedContexts: [String],
      epochChanged:    { type: Boolean, default: false },
    },
    // Server-assigned timestamp (clients cannot forge this)
    serverTs: {
      type:    Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// ── Indexes ──────────────────────────────────────────────────────────────────

// Fast lookup of latest manifest for a user
syncManifestSchema.index({ userId: 1, counter: -1 });

// Uniqueness: one hash per user (replay protection — same hash = replay)
syncManifestSchema.index({ userId: 1, hash: 1 }, { unique: true });

// Uniqueness: one counter per user (rollback protection — duplicate counter = replay)
syncManifestSchema.index({ userId: 1, counter: 1 }, { unique: true });

// Device-specific queries
syncManifestSchema.index({ userId: 1, deviceId: 1, counter: -1 });

const SyncManifest = mongoose.model("SyncManifest", syncManifestSchema);
export default SyncManifest;
