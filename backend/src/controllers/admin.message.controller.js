import Message from "../models/message.model.js";
import { logAdminAction } from "../lib/adminLogger.js";

// Get all messages with pagination
export const getMessages = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const messages = await Message.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("senderId", "username email profilePic")
      .populate("receiverId", "username email");

    const total = await Message.countDocuments();

    return res.status(200).json({
      success: true,
      messages,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("[AdminMessage] Error fetching messages:", error);
    res.status(500).json({ success: false, message: "Server error fetching messages" });
  }
};

// Soft Delete a message globally
export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: "Message not found" });
    }

    message.isDeleted = true;
    await message.save();

    await logAdminAction(req, "SOFT_DELETE_MESSAGE", "Message", messageId);

    return res.status(200).json({ success: true, message: "Message soft-deleted globally" });
  } catch (error) {
    console.error("[AdminMessage] Error deleting message:", error);
    res.status(500).json({ success: false, message: "Server error deleting message" });
  }
};

// Restore Soft-Deleted Message
export const restoreMessage = async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: "Message not found" });
    }

    message.isDeleted = false;
    await message.save();

    await logAdminAction(req, "RESTORE_MESSAGE", "Message", messageId);

    return res.status(200).json({ success: true, message: "Message successfully restored", message });
  } catch (error) {
    console.error("[AdminMessage] Error restoring message:", error);
    res.status(500).json({ success: false, message: "Server error restoring message" });
  }
};
