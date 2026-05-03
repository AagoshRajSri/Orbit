import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import { z } from "zod";
import { redisClient, isRedisAvailable } from "../lib/redis.js";
import securityService from "../services/security.service.js";
import { getRealId, sanitizeForOrbit } from "../lib/obfuscation.js";
import Message from "../models/message.model.js";
import Nexus from "../models/nexus.model.js";

// In-memory fallback for when Redis is unavailable (single-node dev)
const memOnlineUsers = new Set();
const memConnCounts  = new Map();

// In-memory rate limiting fallback
const memRateLimit = new Map();

// In-memory typing state tracking (userId -> { conversations: Map, timeoutIds: Map })
const typingState = new Map();

// Stale typing timeout in milliseconds (10 seconds)
const STALE_TYPING_TIMEOUT = 10000;

// Typing state cleanup interval in milliseconds (5 minutes)
const TYPING_CLEANUP_INTERVAL = 5 * 60 * 1000;

// Rate limit settings
const SOCKET_RATE_LIMIT = 50;
const SOCKET_RATE_WINDOW = 10000; // 10s

let ioInstance;

const typingSchema = z.object({
  to: z.string(),
  isTyping: z.boolean(),
});

const nexusTypingSchema = z.object({
  nexusId: z.string(),
  isTyping: z.boolean(),
});

const seenSchema = z.object({
  messageId: z.string(),
  conversationId: z.string(),
  conversationType: z.enum(["direct", "nexus"]),
});

export const initializeSocketIO = (io) => {
  ioInstance = io;

  // Use a strictly focused middleware for authentication
  io.use(async (socket, next) => {
    try {
      // 1. Risk Evaluation via Security Service
      const ip = socket.handshake.address || socket.handshake.headers["x-forwarded-for"] || "unknown";
      const userAgent = socket.handshake.headers["user-agent"] || "unknown";
      const isBlocked = await securityService.isIpBlocked(ip);
      
      if (isBlocked) {
        return next(new Error("Security Policy: Your connection is restricted"));
      }

      const riskScore = securityService.evaluateRisk(ip, userAgent);
      if (riskScore >= 90) {
        await securityService.blockIp(ip, "Socket level threat detected", 60);
        return next(new Error("Security Policy: Critical risk factor detected"));
      }

      // 2. Auth Negotiation
      let token = socket.handshake.auth?.token;

      if (token === "null" || token === "undefined" || token === "") {
        token = null;
      }

      // Check for admin cookie first to prioritize admin room access
      if (socket.handshake.headers.cookie) {
        const cookies = socket.handshake.headers.cookie.split(";");
        const adminJwtCookie = cookies.find((c) => c.trim().startsWith("admin_jwt="));
        if (adminJwtCookie) {
          token = adminJwtCookie.split("=")[1];
          socket.isAdmin = true;
        } else if (!token) {
          // If no admin cookie and no auth token, check for regular user jwt cookie
          const jwtCookie = cookies.find((c) => c.trim().startsWith("jwt="));
          if (jwtCookie) {
            token = jwtCookie.split("=")[1];
          }
        }
      }

      if (!token) {
        const tetherId = socket.handshake.auth?.tetherId;
        if (tetherId) {
          socket.tetherId = tetherId;
          return next();
        }
        return next(new Error("Access Denied: No identity established"));
      }

      // 3. Token Verification
      const decoded = jwt.verify(token, process.env.JWT_SECRET || (socket.isAdmin ? "fallback_secret" : process.env.JWT_SECRET));
      
      if (socket.isAdmin && decoded.role === "admin") {
        socket.userId = "admin";
        return next();
      }

      // Resolve real ID if it was obfuscated at the client layer
      const realUserId = getRealId(decoded.userId);
      const user = await User.findById(realUserId).select("-password");

      if (!user) {
        return next(new Error("Identity Mismatch: User record purged or invalid"));
      }

      // Attach context
      socket.userId = user._id.toString();
      socket.user = user;
      socket.riskScore = riskScore;
      socket.fingerprint = securityService.generateFingerprint(socket.handshake);

      // Log success at high security level
      if (riskScore > 50) {
        await securityService.logAuditEvent(socket.userId, "SOCKET_AUTH_HIGH_RISK", socket.handshake, { riskScore }, riskScore);
      }

      next();
    } catch (error) {
      console.error("Orbit Secure Handshake Failed:", error.message);
      next(new Error("Orbit Shield: Authentication rejected"));
    }
  });

  io.on("connection", async (socket) => {
    if (socket.isAdmin) {
      console.log("Admin connected to socket");
      socket.join("admin_room");
      return; // Admins don't need the standard user presence tracking
    }

    console.log(`User connected: ${socket.userId || 'Guest(Tether)'}`);
    
    if (socket.userId) {
      if (isRedisAvailable) {
        const activeConns = await redisClient.incr(`online:${socket.userId}`);
        if (activeConns === 1) {
          await redisClient.sadd("global:online_users", socket.userId);
        }
        const onlineUsers = await redisClient.smembers("global:online_users");
        io.emit("getOnlineUsers", onlineUsers);

        const queueKey = `offline_queue:${socket.userId}`;
        let queuedMessageStr = await redisClient.rpop(queueKey);
        while (queuedMessageStr) {
          try {
            const msg = JSON.parse(queuedMessageStr);
            socket.emit("newMessage", msg);
            // Note: In production, consider implementing ack-based delivery
            // to re-queue messages that fail to deliver
          } catch (e) {
            console.error("Failed to parse queued message", e);
            // Re-queue the message if parsing fails
            try {
              await redisClient.lpush(queueKey, queuedMessageStr);
            } catch (requeueErr) {
              console.error("Failed to re-queue message:", requeueErr);
            }
          }
          queuedMessageStr = await redisClient.rpop(queueKey);
        }
      } else {
        // In-memory fallback
        const count = (memConnCounts.get(socket.userId) || 0) + 1;
        memConnCounts.set(socket.userId, count);
        memOnlineUsers.add(socket.userId);
        io.emit("getOnlineUsers", Array.from(memOnlineUsers));
      }
    }
    
    if (socket.tetherId) {
      socket.join(socket.tetherId);
      console.log(`Socket joined tether room: ${socket.tetherId}`);
    }

    // Middleware for individual socket events (Distributed Rate Limiting)
    socket.use(async ([event, ...args], next) => {
      const clientKey = socket.userId || socket.id;
      const rateLimitKey = `rateLimiter:socket:${clientKey}`;

      try {
        if (isRedisAvailable) {
          const count = await redisClient.incr(rateLimitKey);
          if (count === 1) {
            await redisClient.pexpire(rateLimitKey, SOCKET_RATE_WINDOW);
          }

          if (count > SOCKET_RATE_LIMIT) {
            console.warn(`Disconnecting abusive socket: ${clientKey}`);
            socket.disconnect(true);
            return next(new Error("Rate limit exceeded"));
          }
          next();
        } else {
          // In-memory fallback
          const now = Date.now();
          const record = memRateLimit.get(clientKey) || { count: 0, windowStart: now };

          if (now - record.windowStart > SOCKET_RATE_WINDOW) {
            record.count = 1;
            record.windowStart = now;
          } else {
            record.count++;
          }

          memRateLimit.set(clientKey, record);

          if (record.count > SOCKET_RATE_LIMIT) {
            console.warn(`Disconnecting abusive socket (mem): ${clientKey}`);
            socket.disconnect(true);
            return next(new Error("Rate limit exceeded"));
          }
          next();
        }
      } catch (err) {
        console.error("Rate limit error:", err);
        next();
      }
    });

    // Handle typing status
    socket.on("typing", (payload) => {
      try {
        const parsed = typingSchema.safeParse(payload);
        if (!parsed.success) return;
        const { to, isTyping } = parsed.data;

        if (!typingState.has(socket.userId)) {
          typingState.set(socket.userId, { conversations: new Map(), timeoutIds: new Map() });
        }
        const state = typingState.get(socket.userId);

        if (isTyping) {
          const oldT = state.timeoutIds.get(to);
          if (oldT) clearTimeout(oldT);

          const tId = setTimeout(() => {
            state.conversations.delete(to);
            state.timeoutIds.delete(to);
            io.to(to).emit("userTyping", { from: socket.userId, isTyping: false });
          }, STALE_TYPING_TIMEOUT);

          state.conversations.set(to, true);
          state.timeoutIds.set(to, tId);
        } else {
          const oldT = state.timeoutIds.get(to);
          if (oldT) clearTimeout(oldT);
          state.conversations.delete(to);
          state.timeoutIds.delete(to);
        }

        io.to(to).emit("userTyping", { from: socket.userId, isTyping });
      } catch (e) {
        console.error("Typing error:", e);
      }
    });

    socket.on("nexusTyping", (payload) => {
      try {
        const parsed = nexusTypingSchema.safeParse(payload);
        if (!parsed.success) return;
        const { nexusId, isTyping } = parsed.data;

        const key = `nexus:${nexusId}`;
        if (!typingState.has(socket.userId)) {
          typingState.set(socket.userId, { conversations: new Map(), timeoutIds: new Map() });
        }
        const state = typingState.get(socket.userId);

        if (isTyping) {
          const oldT = state.timeoutIds.get(key);
          if (oldT) clearTimeout(oldT);

          const tId = setTimeout(() => {
            state.conversations.delete(key);
            state.timeoutIds.delete(key);
            socket.to(nexusId).emit("nexusTyping", { nexusId, userId: socket.userId, username: socket.user?.username, isTyping: false });
          }, STALE_TYPING_TIMEOUT);

          state.conversations.set(key, nexusId);
          state.timeoutIds.set(key, tId);
        } else {
          const oldT = state.timeoutIds.get(key);
          if (oldT) clearTimeout(oldT);
          state.conversations.delete(key);
          state.timeoutIds.delete(key);
        }

        socket.to(nexusId).emit("nexusTyping", { nexusId, userId: socket.userId, username: socket.user?.username, isTyping });
      } catch (e) {
        console.error("Nexus typing error:", e);
      }
    });

    socket.on("seen", async (payload) => {
      try {
        const parsed = seenSchema.safeParse(payload);
        if (!parsed.success) {
          console.warn(`[Socket Seen] Invalid payload from ${socket.userId}:`, parsed.error.issues);
          return;
        }
        const { messageId, conversationId, conversationType } = parsed.data;
        const realConversationId = getRealId(conversationId);
        const myUserId = socket.userId;

        // Security: Find the message and verify participation
        const message = await Message.findById(messageId);
        if (!message) return;

        // Check if user is recipient or nexus member
        if (conversationType === "direct") {
          const isParticipant = 
            message.senderId.toString() === myUserId || 
            message.receiverId.toString() === myUserId;
          if (!isParticipant) return;

          // Bulk update all messages in this conversation UP TO this messageId that were sent to me
          await Message.updateMany(
            { 
              _id: { $lte: messageId }, 
              receiverId: myUserId, 
              senderId: message.senderId,
              seenAt: null 
            }, 
            { seenAt: new Date() }
          );
        } else {
          // Verify nexus membership
          const nexus = await Nexus.findById(realConversationId);
          if (!nexus || !nexus.members.includes(myUserId)) return;
          
          // For Nexus, we just update this specific message for now 
          // (full membership seen tracking requires a model change)
          await Message.findByIdAndUpdate(messageId, { seenAt: new Date() });
        }

        if (conversationType === "direct") {
          io.to(realConversationId.toString()).emit("messageSeen", { 
            messageId, 
            seenBy: myUserId, 
            seenAt: new Date().toISOString() 
          });
        } else {
          io.to(realConversationId.toString()).emit("nexusMessageSeen", { 
            messageId, 
            nexusId: conversationId, 
            seenBy: myUserId, 
            username: socket.user?.username, 
            seenAt: new Date().toISOString() 
          });
        }
        
        console.info(`[Socket Seen] Message ${messageId} marked seen by ${myUserId}`);
      } catch (e) {
        console.error("[Socket Seen] Error:", e.message);
      }
    });

    socket.join(socket.userId);

    const joinUserNexuses = async () => {
      try {
        const Nexus = (await import("../models/nexus.model.js")).default;
        const nexuses = await Nexus.find({ members: socket.userId });
        nexuses.forEach((n) => socket.join(n._id.toString()));
      } catch (e) {
        console.error("Nexus join error:", e);
      }
    };
    joinUserNexuses();

    socket.on("joinNexusRoom", async (nexusId) => {
      try {
        const Nexus = (await import("../models/nexus.model.js")).default;
        const nexus = await Nexus.findById(nexusId);
        if (nexus && nexus.members.some(m => m.toString() === socket.userId)) {
          socket.join(nexusId);
        } else {
          console.warn(`[Socket Security] User ${socket.userId} tried to join Nexus room ${nexusId} without membership.`);
        }
      } catch (e) {
        console.error("joinNexusRoom error:", e);
      }
    });
    socket.on("leaveNexusRoom", (nexusId) => socket.leave(nexusId));

    socket.on("disconnect", async (reason) => {
      console.log(`User disconnected: ${socket.userId} | ${reason}`);
      const state = typingState.get(socket.userId);
      if (state) {
        state.timeoutIds.forEach(t => clearTimeout(t));
        state.conversations.forEach((targetId, key) => {
          if (key.startsWith("nexus:")) {
            io.to(targetId).emit("nexusTyping", { nexusId: targetId, userId: socket.userId, username: socket.user?.username, isTyping: false });
          } else {
            io.to(targetId).emit("userTyping", { from: socket.userId, isTyping: false });
          }
        });
        typingState.delete(socket.userId);
      }

      if (socket.userId) {
        if (isRedisAvailable) {
          const count = await redisClient.decr(`online:${socket.userId}`);
          if (count <= 0) {
            await redisClient.srem("global:online_users", socket.userId);
            await redisClient.del(`online:${socket.userId}`);
          }
          const online = await redisClient.smembers("global:online_users");
          io.emit("getOnlineUsers", online);
        } else {
          const count = (memConnCounts.get(socket.userId) || 1) - 1;
          if (count <= 0) {
            memConnCounts.delete(socket.userId);
            memOnlineUsers.delete(socket.userId);
          } else {
            memConnCounts.set(socket.userId, count);
          }
          io.emit("getOnlineUsers", Array.from(memOnlineUsers));
        }
      }
    });
  });
};

export const getIO = () => {
  if (!ioInstance) throw new Error("Socket.IO not initialized");
  return ioInstance;
};

export const getOnlineUsersCount = async () => {
  if (isRedisAvailable) {
    return await redisClient.scard("global:online_users");
  }
  return memOnlineUsers.size;
};
