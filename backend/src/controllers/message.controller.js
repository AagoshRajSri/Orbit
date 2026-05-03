import Message from "../models/message.model.js";
import User from "../models/user.model.js";
import cloudinary from "../lib/cloudinary.js";
import { getIO } from "../socket/socket.js";
import { getRealId, sanitizeForOrbit } from "../lib/obfuscation.js";

import { systemEmitter } from "../lib/systemEmitter.js";
import { z } from "zod";

const messageSchema = z
  .object({
    text: z.string().max(2000).optional(),
    image: z.string().max(5000000).optional(), // Base64 can be very large
    idempotencyKey: z.string().optional(),
    encryptedContent: z.string().optional(),
    encryptedKeyForReceiver: z.string().optional(),
    encryptedKeyForSender: z.string().optional(),
    iv: z.string().optional(),
  })
  .refine((data) => data.text || data.image || data.encryptedContent, {
    message: "Message must contain text, image, or encrypted content",
  });

export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const { cursor, limit = 50, search } = req.query;

    const parsedLimit = Math.min(Math.max(parseInt(limit) || 50, 1), 100);

    const query = { _id: { $ne: loggedInUserId } };

    if (search && typeof search === "string" && search.trim()) {
      const sanitizedSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { username: { $regex: sanitizedSearch, $options: "i" } },
        { email: { $regex: sanitizedSearch, $options: "i" } },
      ];
    }

    if (cursor) {
      query.createdAt = { $lt: new Date(cursor) };
    }

    const users = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 })
      .limit(parsedLimit + 1);

    const hasMore = users.length > parsedLimit;
    const results = hasMore ? users.slice(0, parsedLimit) : users;
    const nextCursor = hasMore && results.length > 0
      ? results[results.length - 1].createdAt.toISOString()
      : null;

    res.status(200).json({
      data: sanitizeForOrbit(results.map(u => u.toObject())),
      pagination: {
        hasMore,
        nextCursor,
        limit: parsedLimit,
      },
    });
  } catch (error) {
    console.error("error in getUsersForSidebar: ", error.message);
    res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: "Internal server error" },
    });
  }
};

export const getMessage = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const { cursor, limit = 50 } = req.query;
    const myId = req.user._id;

    const parsedLimit = Math.min(Math.max(parseInt(limit) || 50, 1), 100);

    const realUserToChatId = getRealId(userToChatId);
    
    const query = {
      $or: [
        { senderId: myId, receiverId: realUserToChatId },
        { senderId: realUserToChatId, receiverId: myId },
      ],
    };

    if (cursor) {
      query.createdAt = { $lt: new Date(cursor) };
    }

    // Fetch chronologically backwards, then reverse for the client
    let messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(parsedLimit)
      .populate("senderId", "username profilePic")
      .populate("receiverId", "username profilePic")
      .lean();

    messages = messages.reverse();

    res.status(200).json(messages);
  } catch (error) {
    console.error("error in getMessages controller: ", error.message);
    res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: "Internal server error" },
    });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const parsed = messageSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid input data",
          details: parsed.error.issues.map(e => ({ field: e.path.join("."), message: e.message })),
        },
      });
    }

    const { text, image, idempotencyKey, encryptedContent, encryptedKeyForReceiver, encryptedKeyForSender, iv } = parsed.data;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;
    const realReceiverId = getRealId(receiverId);

    // Idempotency check: if we already saved this message, return it immediately
    if (idempotencyKey) {
      const existing = await Message.findOne({ idempotencyKey })
        .populate("senderId", "username profilePic")
        .populate("receiverId", "username profilePic")
        .lean();
      
      if (existing) {
        // Re-emit for reliability: ensure receiver gets it even if first emit failed
        try {
          const io = getIO();
          io.to(senderId.toString()).emit("newMessage", existing);
          io.to(realReceiverId.toString()).emit("newMessage", existing);
        } catch (e) {}
        return res.status(200).json(existing);
      }
    }

    let imageUrl = image;
    if (image && image.startsWith("data:")) {
      // Validate MIME type strictly
      if (!image.match(/^data:image\/(jpeg|png|webp);base64,/)) {
        return res.status(400).json({ message: "Invalid image type. Only JPEG, PNG, or WEBP allowed." });
      }

      try {
        const uploadResponse = await cloudinary.uploader.upload(image, {
          folder: "orbit_chats",
          transformation: [
            { width: 1200, crop: "limit" },
            { quality: "auto" },
            { fetch_format: "auto" }
          ]
        });
        imageUrl = uploadResponse.secure_url;
      } catch (uploadError) {
        console.error("Cloudinary upload failed:", uploadError.message);
        return res.status(400).json({
          message:
            "Failed to upload image. Please try again with a smaller image.",
          error:
            process.env.NODE_ENV === "development"
              ? uploadError.message
              : undefined,
        });
      }
    }

    const newMessage = new Message({
      senderId,
      receiverId: realReceiverId,
      text,
      image: imageUrl,
      idempotencyKey,
      encryptedContent,
      encryptedKeyForReceiver,
      encryptedKeyForSender,
      iv,
    });

    await newMessage.save();

    const populatedMessage = {
      ...newMessage.toObject(),
      _id: newMessage._id.toString(),
      senderId: {
        _id: req.user._id.toString(),
        username: req.user.username,
        profilePic: req.user.profilePic,
      },
      receiverId: {
        _id: realReceiverId.toString(), // Use the real ID here; sanitizeForOrbit will obfuscate it once
      },
      createdAt: newMessage.createdAt.toISOString(),
      updatedAt: newMessage.updatedAt.toISOString()
    };

    // Emit socket event for real-time messaging
    try {
      const io = getIO();
      const sanitizedMessage = sanitizeForOrbit(populatedMessage);
      // Emit to sender using their real ID (which is their room name)
      io.to(senderId.toString()).emit("newMessage", sanitizedMessage);
      // Emit to receiver using their real ID
      io.to(realReceiverId.toString()).emit("newMessage", sanitizedMessage);
    } catch (socketError) {
      console.warn("Socket.IO emission failed:", socketError.message);
    }

    systemEmitter.broadcast('message_sent', { messageId: populatedMessage._id, senderId });

    res.status(201).json(sanitizeForOrbit(populatedMessage));
  } catch (error) {
    console.error("error in sendMessage controller: ", error.message);
    res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: "Internal server error" },
    });
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Message not found" } });
    }

    if (message.senderId.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, error: { code: "FORBIDDEN", message: "Unauthorized" } });
    }

    const receiverId = message.receiverId || message.nexusId;

    // Delete image from Cloudinary if it exists
    if (message.image) {
      try {
        // Extract public_id from secure_url
        // URL format: .../upload/v12345/orbit_chats/abcde.jpg
        const parts = message.image.split("/");
        const folderIndex = parts.indexOf("orbit_chats");
        if (folderIndex !== -1) {
          const publicIdWithExt = parts.slice(folderIndex).join("/");
          const publicId = publicIdWithExt.split(".")[0];
          await cloudinary.uploader.destroy(publicId);
          console.info(`[Cloudinary] Deleted asset: ${publicId}`);
        }
      } catch (cloudinaryErr) {
        console.warn("[Cloudinary] Asset deletion failed:", cloudinaryErr.message);
      }
    }

    await Message.findByIdAndDelete(messageId);

    // Emit deletion event via socket
    try {
      const io = getIO();
      if (message.receiverId) {
        io.to(userId.toString())
          .to(message.receiverId.toString())
          .emit("messageDeleted", { messageId });
      } else {
        io.to(message.nexusId.toString()).emit("messageDeleted", { messageId });
      }
    } catch (socketErr) {
      console.warn("[Message Delete] Socket emission failed:", socketErr.message);
    }

    res.status(200).json({ success: true, message: "Message deleted successfully" });
  } catch (error) {
    console.error("error in deleteMessage controller: ", error.message);
    res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: "Internal server error" },
    });
  }
};

export const updateMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { text } = req.body;
    const userId = req.user._id;

    const updateSchema = z.object({
      text: z.string().min(1, "Text cannot be empty").max(2000, "Text too long").trim()
    });

    const parsed = updateSchema.safeParse({ text });
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: { code: "VALIDATION_ERROR", message: parsed.error.issues[0].message },
      });
    }

    const sanitizedText = parsed.data.text;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Message not found" } });
    }

    if (message.senderId.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, error: { code: "FORBIDDEN", message: "Unauthorized" } });
    }

    message.text = sanitizedText;
    await message.save();

    // Construct populated message for socket emission without re-fetching
    const populatedMessage = {
      ...message.toObject(),
      _id: message._id.toString(),
      senderId: {
        _id: req.user._id.toString(),
        username: req.user.username,
        profilePic: req.user.profilePic,
      },
      receiverId: message.receiverId ? { _id: message.receiverId.toString() } : undefined,
      nexusId: message.nexusId ? { _id: message.nexusId.toString() } : undefined,
      createdAt: message.createdAt ? message.createdAt.toISOString() : undefined,
      updatedAt: message.updatedAt ? message.updatedAt.toISOString() : undefined,
    };

    // Emit update event via socket
    const io = getIO();
    if (message.receiverId) {
      io.to(userId.toString())
        .to(message.receiverId.toString())
        .emit("messageUpdated", populatedMessage);
    } else {
      io.to(message.nexusId.toString()).emit(
        "messageUpdated",
        populatedMessage,
      );
    }

    res.status(200).json(populatedMessage);
  } catch (error) {
    console.error("error in updateMessage controller: ", error.message);
    res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: "Internal server error" },
    });
  }
};
