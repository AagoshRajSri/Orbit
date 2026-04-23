import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true }, // Optional, as some actions are unauth
    action: { type: String, required: true, index: true },
    ip: { type: String, required: true },
    userAgent: { type: String, required: true },
    details: { type: mongoose.Schema.Types.Mixed }, // Arbitrary JSON
    riskScore: { type: Number, default: 0 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// TTL index to clean up logs after 30 days
auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

const AuditLog = mongoose.model("AuditLog", auditLogSchema);
export default AuditLog;
