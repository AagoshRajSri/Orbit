import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import Notification from "../models/notification.model.js";
import { logAdminAction } from "../lib/adminLogger.js";
import { systemEmitter } from "../lib/systemEmitter.js";
import { getIO } from "../socket/socket.js";
import { sendEmail } from "../lib/mailer.js";

/**
 * POST /api/admin/broadcast/notification
 * Sends a persistent in-app notification to one or all users
 */
export const sendNotification = async (req, res) => {
  try {
    const { targetUserId, type, title, message, severity } = req.body;
    if (!message) return res.status(400).json({ success: false, message: "Message is required" });

    const io = getIO();
    let targetUsers;

    if (targetUserId) {
      const user = await User.findById(targetUserId);
      if (!user) return res.status(404).json({ success: false, message: "User not found" });
      targetUsers = [user];
    } else {
      targetUsers = await User.find({ isDeleted: { $ne: true } }).select("_id");
    }

    const notifications = await Notification.insertMany(
      targetUsers.map(u => ({
        userId: u._id,
        type: type || "announcement",
        title: title || "Admin Notification",
        message,
        severity: severity || "info",
      }))
    );

    // Push real-time via socket
    targetUsers.forEach(u => {
      io.to(u._id.toString()).emit("admin_notification", {
        type: type || "announcement",
        title: title || "Admin Notification",
        message,
        severity: severity || "info",
        createdAt: new Date(),
      });
    });

    await logAdminAction(req, "SEND_NOTIFICATION", "Notification", targetUserId || "ALL", { type, severity, message: message.slice(0, 100) });
    systemEmitter.broadcast("admin_action", { action: "notification_sent", target: targetUserId || "ALL" }, "info");

    return res.status(200).json({ success: true, message: `Notification sent to ${targetUsers.length} user(s)`, count: notifications.length });
  } catch (error) {
    console.error("[AdminBroadcast] sendNotification error:", error);
    res.status(500).json({ success: false, message: "Failed to send notification" });
  }
};

/**
 * POST /api/admin/broadcast/system-message
 * Injects a visible system message into a user's DM or a Nexus
 */
export const sendSystemMessage = async (req, res) => {
  try {
    const { targetUserId, nexusId, text } = req.body;
    if (!text) return res.status(400).json({ success: false, message: "Message text required" });
    if (!targetUserId && !nexusId) return res.status(400).json({ success: false, message: "Either targetUserId or nexusId required" });

    const io = getIO();

    if (nexusId) {
      const msg = new Message({ senderId: null, nexusId, text, isSystem: true });
      await msg.save();
      const populated = await Message.findById(msg._id);
      io.to(nexusId).emit("newNexusMessage", populated);
    } else {
      // Inject into DM — senderId = null signals it's a system message 
      const msg = new Message({ senderId: null, receiverId: targetUserId, text, isSystem: true });
      await msg.save();
      const populated = await Message.findById(msg._id);
      io.to(targetUserId).emit("newMessage", populated);
    }

    await logAdminAction(req, "SEND_SYSTEM_MESSAGE", "Message", nexusId || targetUserId, { text: text.slice(0, 100) });
    return res.status(200).json({ success: true, message: "System message sent" });
  } catch (error) {
    console.error("[AdminBroadcast] sendSystemMessage error:", error);
    res.status(500).json({ success: false, message: "Failed to send system message" });
  }
};

/**
 * POST /api/admin/broadcast/email
 * Sends a broadcast email to one user or all users via existing mailer
 */
export const sendEmailBroadcast = async (req, res) => {
  try {
    const { targetUserId, subject, body, type } = req.body;
    if (!subject || !body) return res.status(400).json({ success: false, message: "Subject and body required" });

    let targets;
    if (targetUserId) {
      const user = await User.findById(targetUserId).select("email username");
      if (!user) return res.status(404).json({ success: false, message: "User not found" });
      targets = [user];
    } else {
      targets = await User.find({ isDeleted: { $ne: true } }).select("email username");
    }

    // Fire-and-forget all emails in parallel  
    const results = await Promise.allSettled(
      targets.map(u => sendBroadcastEmail(u.email, subject, body, type || "announcement", u.username))
    );

    const sent = results.filter(r => r.status === "fulfilled").length;
    const failed = results.length - sent;

    await logAdminAction(req, "SEND_EMAIL_BROADCAST", "Email", targetUserId || "ALL", { subject, sent, failed });

    return res.status(200).json({ success: true, message: `Emails sent: ${sent}, Failed: ${failed}` });
  } catch (error) {
    console.error("[AdminBroadcast] sendEmailBroadcast error:", error);
    res.status(500).json({ success: false, message: "Failed to send email broadcast" });
  }
};

// Helper using existing mailer infrastructure
const sendBroadcastEmail = async (email, subject, body, type, username) => {
  return sendEmail(email, subject, buildEmailHtml(subject, body, type, username));
};

const buildEmailHtml = (subject, body, type, username) => {
  const colors = { announcement: "#6366f1", warning: "#f59e0b", update: "#22c55e" };
  const accentColor = colors[type] || "#6366f1";
  return `
    <div style="background:#0f1115;padding:32px;font-family:Inter,sans-serif;color:#e2e8f0;max-width:600px;margin:0 auto;border-radius:12px;">
      <div style="border-bottom:2px solid ${accentColor};padding-bottom:16px;margin-bottom:24px;">
        <span style="font-size:18px;font-weight:700;color:#f1f5f9;">Orbit</span>
        <span style="margin-left:8px;padding:3px 8px;background:${accentColor}20;color:${accentColor};border-radius:12px;font-size:11px;font-weight:600;text-transform:uppercase;">${type}</span>
      </div>
      <p style="color:#94a3b8;margin-bottom:8px;">Hi ${username || "Orbiter"},</p>
      <h2 style="color:#f1f5f9;font-size:20px;margin-bottom:16px;">${subject}</h2>
      <div style="color:#cbd5e1;line-height:1.6;white-space:pre-wrap;">${body}</div>
      <div style="margin-top:32px;padding-top:16px;border-top:1px solid #232730;color:#475569;font-size:12px;">
        This message was sent from Orbit Command Center. Do not reply to this email.
      </div>
    </div>
  `;
};
