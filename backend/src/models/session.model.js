import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    refreshTokenHash: { type: String, required: true },
    deviceName: { type: String },
    ipAddress: { type: String },
    userAgent: { type: String },
    lastActive: { type: Date, default: Date.now },
    usedAt: { type: Date, default: null },
    isValid: { type: Boolean, default: true }
  },
  { timestamps: true }
);

sessionSchema.index({ refreshTokenHash: 1 });
sessionSchema.index({ userId: 1 });
sessionSchema.index({ lastActive: 1 }, { expireAfterSeconds: 7 * 24 * 60 * 60 }); // 7 days TTL

const Session = mongoose.model("Session", sessionSchema);
export default Session;
