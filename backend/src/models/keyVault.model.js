import mongoose from "mongoose";

/**
 * KeyVault — Encrypted key material persisted per user per device.
 *
 * ZERO-KNOWLEDGE GUARANTEE:
 *   The server stores ONLY encrypted blobs and metadata.
 *   It cannot decrypt any field without the user's passphrase (never sent to server).
 *
 * FIELDS:
 *   userId      — owner of this vault
 *   deviceId    — device that created/updated this record (null = cross-device / cloud vault)
 *   epoch       — monotonically increasing key epoch; stale-epoch write attempts are rejected
 *   eMEKEnvelope— the passphrase-wrapped MEK blob (see mekEngine.js)
 *   senderKeys  — map of contextId → VaultPayload (CVK-encrypted sender key states)
 *   manifestHash— SHA-256 hash of the canonical manifest at time of last write (replay protection)
 *   prevHash    — hash of the previous manifest (hash chain for rollback detection)
 *   counter     — monotonic write counter (unsigned 64-bit stored as Number; safe up to 2^53)
 *   syncedAt    — server-side timestamp of last successful sync
 */
const vaultPayloadSchema = new mongoose.Schema(
  {
    version: { type: Number, required: true, default: 1 },
    epoch:   { type: Number, required: true },
    keyId:   { type: String, required: true },
    nonce:   { type: String, required: true }, // Base64 12-byte IV
    ts:      { type: Number, required: true }, // Client unix-ms timestamp
    ct:      { type: String, required: true }, // Base64 AES-GCM ciphertext
  },
  { _id: false }
);

const eMEKEnvelopeSchema = new mongoose.Schema(
  {
    version: { type: Number, required: true, default: 1 },
    epoch:   { type: Number, required: true },
    salt:    { type: String, required: true }, // Base64 32-byte PBKDF2 salt
    eMEK:    { type: String, required: true }, // Base64 AES-KW wrapped MEK
    ts:      { type: Number, required: true }, // Client timestamp (informational)
  },
  { _id: false }
);

const keyVaultSchema = new mongoose.Schema(
  {
    userId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "User",
      required: true,
      index:    true,
    },
    // Device that last wrote this vault record (null = cloud-synced, any device may read)
    deviceId: {
      type:    String,
      default: null,
    },
    // Monotonically increasing key epoch.
    // Writes at epoch < currentEpoch are rejected (rollback protection).
    epoch: {
      type:    Number,
      required: true,
      default: 0,
      min:     0,
    },
    // Passphrase-wrapped MEK blob.
    // Cleared and regenerated on each epoch rotation.
    eMEKEnvelope: {
      type:     eMEKEnvelopeSchema,
      required: true,
    },
    // CVK-encrypted sender key states per context.
    // Key: contextId (nexusId or "dm:<userId>"), Value: VaultPayload
    senderKeys: {
      type:    Map,
      of:      vaultPayloadSchema,
      default: {},
    },
    // ── Replay & Rollback Protection ──────────────────────────────────────────
    // SHA-256 of canonical JSON manifest at time of last write.
    manifestHash: {
      type:    String,
      default: null,
    },
    // Hash of the previous manifest (forms a hash chain).
    // Genesis record has prevHash = null.
    prevHash: {
      type:    String,
      default: null,
    },
    // Monotonic write counter. Every successful write must increment this.
    // Reject writes with counter <= stored counter (replay / stale write protection).
    counter: {
      type:    Number,
      required: true,
      default: 0,
      min:     0,
    },
    // Signature over (userId + epoch + counter + manifestHash) using device identity key.
    // Allows other devices to verify vault integrity without server trust.
    signature: {
      type:    String,
      default: null,
    },
    syncedAt: {
      type:    Date,
      default: null,
    },
  },
  { timestamps: true }
);

// ── Indexes ──────────────────────────────────────────────────────────────────

// Primary lookup: userId → vault (one vault per user, cross-device synced)
keyVaultSchema.index({ userId: 1 }, { unique: true });

// Compound index for device-specific queries
keyVaultSchema.index({ userId: 1, deviceId: 1 });

// ── Optimistic concurrency: reject stale writes ───────────────────────────────
// Enforce via application logic in controller (compare epoch + counter before save).

const KeyVault = mongoose.model("KeyVault", keyVaultSchema);
export default KeyVault;
