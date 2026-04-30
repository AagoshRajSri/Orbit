import AdminLog from "../models/adminLog.model.js";
import { systemEmitter } from "./systemEmitter.js";

export const logAdminAction = async (req, action, targetType, targetId, details = {}) => {
  try {
    const adminId = req.admin?.username || "unknown";
    const ip = req.ip || req.headers["x-forwarded-for"] || "unknown";
    const userAgent = req.headers["user-agent"] || "unknown";

    const logEntry = new AdminLog({
      adminId,
      action,
      targetType,
      targetId,
      details,
      ip,
      userAgent,
    });

    const savedLog = await logEntry.save();
    
    // Broadcast the action
    systemEmitter.broadcast('admin_action', {
      adminId,
      action,
      targetType,
      targetId,
      ip,
    }, 'warning');

    return savedLog;
  } catch (error) {
    console.error("[AdminLogger] Failed to log action:", error.message);
  }
};
