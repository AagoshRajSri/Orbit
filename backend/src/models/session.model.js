import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    sessionId: { type: String, required: true, unique: true },
    hashedRefreshToken: { type: String, required: true },
    ip: { type: String, required: true },
    userAgent: { type: String, required: true },
    deviceInfo: { type: String },
    isValid: { type: Boolean, default: true },
    lastActive: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

sessionSchema.index({ userId: 1, isValid: 1 });
sessionSchema.index({ userId: 1, isValid: 1, lastActive: 1 });
sessionSchema.index({ isValid: 1, lastActive: 1 });

const Session = mongoose.model("Session", sessionSchema);
export default Session;
