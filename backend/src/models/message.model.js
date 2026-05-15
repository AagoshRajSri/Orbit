import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: function() { return !this.nexusId; },
      index: true,
    },
    nexusId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Nexus",
      required: function() { return !this.receiverId; },
      index: true,
    },
    text: {
      type: String, // Kept for legacy/fallback, but will be encrypted client-side
    },
    image: {
      type: String,
    },
    // ── Protocol version ───────────────────────────────────────────────────────
    v: {
      type: Number,
      default: null, // null = legacy, 2 = ECDH, 3 = Double Ratchet
    },
    // ── v3: Double Ratchet fields (flat wire format) ───────────────────────────
    ciphertext: {
      type: String, // Base64 AES-GCM ciphertext of the ratchet-encrypted payload
    },
    dh: {
      type: String, // Sender's current ratchet DH public key (base64 SPKI)
    },
    n: {
      type: Number, // Message number in current sending chain
    },
    pn: {
      type: Number, // Number of messages in previous sending chain (v3)
    },
    // v4 Nexus Sender Key — ECDSA signature over "<n>:<ciphertext>"
    sig: {
      type: String,
    },
    x3dh: {
      identityKey:  { type: String }, // Sender's long-term IK (base64)
      ephemeralKey: { type: String }, // Sender's ephemeral EK (base64)
      opkId:        { type: String }, // ID of consumed one-time prekey (or null)
    },
    // ── v2: ECDH + HKDF + AES-GCM fields (legacy, kept for backward compat) ──
    ephemeralPublicKey: { type: String },
    encryptedContent:   { type: String },
    aad: { type: String },
    iv:  { type: String },
    // ── v1 legacy: RSA-OAEP fields ────────────────────────────────────────────
    encryptedKeyForReceiver: { type: String },
    encryptedKeyForSender:   { type: String },
    isSystem: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    idempotencyKey: {
      type: String,
      sparse: true,
      index: true,
      unique: true,
    },
    deliveredAt: {
      type: Date,
      default: null,
    },
    seenAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Compound index for message history performance
messageSchema.index({ senderId: 1, receiverId: 1, createdAt: -1 });
messageSchema.index({ nexusId: 1, createdAt: -1 });

const Message = mongoose.model("Message", messageSchema);
export default Message;
