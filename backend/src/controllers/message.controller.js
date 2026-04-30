import Message from "../models/message.model.js";
import User from "../models/user.model.js";
import cloudinary from "../lib/cloudinary.js";
import { getIO } from "../socket/socket.js";
import { redisClient } from "../lib/redis.js";
import { systemEmitter } from "../lib/systemEmitter.js";
import { z } from "zod";

const messageSchema = z
  .object({
    text: z.string().max(2000).optional(),
    image: z.string().max(5000).optional(), // Allow URLs and base64
    idempotencyKey: z.string().optional(),
  })
  .refine((data) => data.text || data.image, {
    message: "Message must contain either text or an image",
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
      data: results,
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

    const query = {
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    };

    if (cursor) {
      query.createdAt = { $lt: new Date(cursor) };
    }

    // Fetch chronologically backwards, then reverse for the client
    let messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .populate("senderId", "username profilePic")
      .populate("receiverId", "username profilePic");

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

    const { text, image, idempotencyKey } = parsed.data;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    // Idempotency check: if we already saved this message, return it immediately
    if (idempotencyKey) {
      const existing = await Message.findOne({ idempotencyKey })
        .populate("senderId", "username profilePic")
        .populate("receiverId", "username profilePic");
      
      if (existing) {
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
        const uploadResponse = await cloudinary.uploader.upload(image);
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
      receiverId,
      text,
      image: imageUrl,
      idempotencyKey,
    });

    await newMessage.save();

    // Construct enriched payload manually with req.user (AVOID DB READ/POPULATE ON WRITE PATH)
    const populatedMessage = {
      ...newMessage.toObject(),
      senderId: {
        _id: req.user._id,
        username: req.user.username,
        profilePic: req.user.profilePic,
      },
      receiverId: {
        _id: receiverId,
      }
    };

    // Emit socket event for real-time messaging
    try {
      const io = getIO();
      // Emitting to sender's exact room without ack (optimistic send already handled sender side usually)
      io.to(senderId.toString()).emit("newMessage", populatedMessage);

      // Emitting to receiver with Ack (Delivery Guarantee)
      try {
        const responses = await io
          .to(receiverId.toString())
          .timeout(5000)
          .emitWithAck("newMessage", populatedMessage);

        // If we got a response, message was delivered
        if (responses && responses.length > 0) {
          // Update delivery timestamp in background
          Message.findByIdAndUpdate(populatedMessage._id, { deliveredAt: new Date() }).catch(err => {
            console.warn("Failed to update delivery timestamp:", err.message);
          });
        }
      } catch (ackError) {
        console.log(`[Offline Queue] Receiver ${receiverId} offline or no ack. Queuing message.`);
        const queueKey = `offline_queue:${receiverId}`;
        await redisClient.lpush(queueKey, JSON.stringify(populatedMessage));
        await redisClient.expire(queueKey, 86400); // 24-hour TTL queue limit
      }

    } catch (socketError) {
      console.warn("Socket.IO emission failed globally:", socketError.message);
    }

    systemEmitter.broadcast('message_sent', { messageId: populatedMessage._id, senderId });

    res.status(201).json(populatedMessage);
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
    await Message.findByIdAndDelete(messageId);

    // Emit deletion event via socket
    const io = getIO();
    if (message.receiverId) {
      io.to(userId.toString())
        .to(message.receiverId.toString())
        .emit("messageDeleted", { messageId });
    } else {
      io.to(message.nexusId.toString()).emit("messageDeleted", { messageId });
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

    const populatedMessage = await Message.findById(messageId)
      .populate("senderId", "username profilePic")
      .populate("receiverId", "username profilePic");

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
