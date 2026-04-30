import mongoose from "mongoose";

const adminLogSchema = new mongoose.Schema(
  {
    adminId: { type: String, required: true },
    action: { type: String, required: true },
    targetType: { type: String, required: false }, // e.g., 'User', 'Message', 'Nexus', 'System'
    targetId: { type: String, required: false },
    details: { type: mongoose.Schema.Types.Mixed, default: {} },
    ip: { type: String, required: true },
    userAgent: { type: String, required: true },
  },
  { timestamps: true }
);

adminLogSchema.index({ createdAt: -1 });

const AdminLog = mongoose.model("AdminLog", adminLogSchema);
export default AdminLog;
