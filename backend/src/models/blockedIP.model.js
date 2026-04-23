import mongoose from "mongoose";

const blockedIPSchema = new mongoose.Schema(
  {
    ip: { type: String, required: true, unique: true, index: true },
    reason: { type: String, required: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

// TTL index to automatically lift blocks
blockedIPSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const BlockedIP = mongoose.model("BlockedIP", blockedIPSchema);
export default BlockedIP;
