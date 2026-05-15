import mongoose from "mongoose";

/**
 * NexusSenderKeyDistribution
 *
 * Stores encrypted sender key distributions so members can retrieve them.
 * Each document represents one sender's key encrypted for one recipient.
 *
 * FLOW:
 *   1. Alice sends first message in Nexus XYZ
 *   2. Alice fetches all member prekey bundles
 *   3. For each member Bob: Alice X3DH-wraps her SenderKey and POSTs here
 *   4. Bob GETs distributions where recipientId = him, decrypts, stores locally
 */
const nexusSenderKeyDistributionSchema = new mongoose.Schema(
  {
    nexusId: {
      type: mongoose.Schema.Types.ObjectId,
      ref:  "Nexus",
      required: true,
      index: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref:  "User",
      required: true,
    },
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref:  "User",
      required: true,
      index: true,
    },
    // ── X3DH-wrapped sender key distribution ─────────────────────────────────
    ciphertext: {
      type: String, // Base64 AES-GCM encrypted SenderKey distribution payload
      required: true,
    },
    iv: {
      type: String, // Base64 96-bit IV
      required: true,
    },
    x3dh: {
      identityKey:  { type: String, required: true }, // Sender's IK_A
      ephemeralKey: { type: String, required: true }, // Sender's EK_A
      opkId:        { type: String, default: null },  // OPK consumed (or null)
    },
  },
  { timestamps: true }
);

// Compound unique index: only one distribution per (nexus, sender, recipient)
// On key rotation (member join/leave), the old record is replaced.
nexusSenderKeyDistributionSchema.index(
  { nexusId: 1, senderId: 1, recipientId: 1 },
  { unique: true }
);

const NexusSenderKeyDistribution = mongoose.model(
  "NexusSenderKeyDistribution",
  nexusSenderKeyDistributionSchema
);

export default NexusSenderKeyDistribution;
