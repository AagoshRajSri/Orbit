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

// Secure Presence Engine state
const activeGraceTimers = new Map();
const userPresenceStates = new Map(); // Keep in-memory cache of rich presence { state, customText, spotify, lastSeen }
const DISCONNECT_GRACE_PERIOD = 15000; // 15 seconds

export const broadcastPresenceUpdate = async (userId, presenceState, io) => {
  const presenceData = {
    userId,
    state: presenceState.state || "online",
    customText: presenceState.customText || "",
    spotify: presenceState.spotify || null,
    lastSeen: presenceState.lastSeen || "active recently"
  };

  userPresenceStates.set(userId, presenceData);

  if (isRedisAvailable) {
    try {
      await redisClient.hset(`presence:status:${userId}`, {
        state: presenceData.state,
        customText: presenceData.customText,
        spotify: JSON.stringify(presenceData.spotify),
        lastSeen: presenceData.lastSeen
      });
    } catch (e) {
      console.error("[Presence] Redis hset failed:", e);
    }
  }

  // If invisible, map status but broadcast as offline in global online lists
  if (presenceData.state === "invisible") {
    io.emit("presence:broadcast", {
      userId,
      state: "offline",
      lastSeen: "active recently"
    });
    return;
  }

  io.emit("presence:broadcast", presenceData);
};

export const getPublicOnlineUsersList = async () => {
  if (isRedisAvailable) {
    try {
      const allOnline = await redisClient.smembers("global:online_users");
      const filtered = [];
      for (const id of allOnline) {
        const state = await redisClient.hget(`presence:status:${id}`, "state");
        if (state !== "invisible") {
          filtered.push(id);
        }
      }
      return filtered;
    } catch (e) {
      console.error("[Presence] Redis list query failed:", e);
      return [];
    }
  } else {
    const filtered = [];
    for (const id of memOnlineUsers) {
      const presence = userPresenceStates.get(id);
      if (!presence || presence.state !== "invisible") {
        filtered.push(id);
      }
    }
    return filtered;
  }
};

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
      if (error.name === "TokenExpiredError") {
        return next(new Error("Orbit Shield: Token expired"));
      }
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
      // Clear any pending offline grace transition timer
      if (activeGraceTimers.has(socket.userId)) {
        clearTimeout(activeGraceTimers.get(socket.userId));
        activeGraceTimers.delete(socket.userId);
        console.log(`[Presence] Reconnect detected: cancelling offline flap for user ${socket.userId}`);
      }

      if (isRedisAvailable) {
        const activeConns = await redisClient.incr(`online:${socket.userId}`);
        if (activeConns === 1) {
          await redisClient.sadd("global:online_users", socket.userId);
        }

        // Fetch current presence state or default
        const state = await redisClient.hget(`presence:status:${socket.userId}`, "state") || "online";
        const customText = await redisClient.hget(`presence:status:${socket.userId}`, "customText") || "";
        const spotifyStr = await redisClient.hget(`presence:status:${socket.userId}`, "spotify");
        const spotify = spotifyStr ? JSON.parse(spotifyStr) : null;
        
        await broadcastPresenceUpdate(socket.userId, { state, customText, spotify }, io);

        const onlineUsers = await getPublicOnlineUsersList();
        io.emit("getOnlineUsers", onlineUsers);

        const queueKey = `offline_queue:${socket.userId}`;
        let queuedMessageStr = await redisClient.rpop(queueKey);
        while (queuedMessageStr) {
          try {
            const msg = JSON.parse(queuedMessageStr);
            const event = msg._event || "newMessage";
            delete msg._event;
            socket.emit(event, msg);
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

        const current = userPresenceStates.get(socket.userId) || { state: "online" };
        await broadcastPresenceUpdate(socket.userId, current, io);

        const onlineUsers = await getPublicOnlineUsersList();
        io.emit("getOnlineUsers", onlineUsers);
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

    // Immediate join to personal room
    socket.join(socket.userId);

    // Join all nexus rooms for this user immediately upon connection
    const nexuses = await Nexus.find({ members: socket.userId }).lean();
    for (const n of nexuses) {
      socket.join(n._id.toString());
    }

    socket.on("joinNexusRoom", async (nexusId) => {
      try {
        const realNexusId = getRealId(nexusId);
        const nexus = await Nexus.findById(realNexusId);
        if (nexus && nexus.members.some(m => m.toString() === socket.userId)) {
          socket.join(realNexusId.toString());
        } else {
          console.warn(`[Socket Security] User ${socket.userId} tried to join Nexus room ${nexusId} without membership.`);
        }
      } catch (e) {
        console.error("joinNexusRoom error:", e);
      }
    });

    socket.on("request-sender-key-distribution", async ({ nexusId, targetUserId }) => {
      try {
        const realNexusId = getRealId(nexusId);
        const nexus = await Nexus.findById(realNexusId);
        if (!nexus || !nexus.members.some(m => m.toString() === socket.userId)) {
          console.warn(`[Socket] Non-member ${socket.userId} tried to request sender key for ${realNexusId}`);
          return;
        }
        const realTargetUserId = getRealId(targetUserId);
        if (!realTargetUserId || !nexus.members.some(m => m.toString() === realTargetUserId.toString())) {
          return;
        }
        emitToUser(realTargetUserId, "sender-key-distribution-requested", { nexusId });
      } catch (e) {
        console.error("[Socket] sender-key-distribution error:", e);
      }
    });

    socket.on("leaveNexusRoom", async (nexusId) => {
      try {
        const realNexusId = getRealId(nexusId);
        const nexus = await Nexus.findById(realNexusId);
        if (nexus && nexus.members.some(m => m.toString() === socket.userId)) {
          socket.leave(realNexusId.toString());
        } else {
          console.warn(`[Socket Security] User ${socket.userId} tried to leave Nexus room ${nexusId} without membership.`);
        }
      } catch (e) {
        console.error("leaveNexusRoom error:", e);
      }
    });

    socket.on("presence:update", async (payload) => {
      try {
        if (!socket.userId) return;
        const { state, customText, spotify } = payload;
        await broadcastPresenceUpdate(socket.userId, { state, customText, spotify }, io);
        
        const onlineUsers = await getPublicOnlineUsersList();
        io.emit("getOnlineUsers", onlineUsers);
      } catch (e) {
        console.error("[Presence] Update error:", e);
      }
    });

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
        // Enforce secure anti-flap disconnect grace period to avoid leaking connection state
        const timer = setTimeout(async () => {
          activeGraceTimers.delete(socket.userId);
          
          if (isRedisAvailable) {
            const count = await redisClient.decr(`online:${socket.userId}`);
            if (count <= 0) {
              await redisClient.srem("global:online_users", socket.userId);
              await redisClient.del(`online:${socket.userId}`);
              await broadcastPresenceUpdate(socket.userId, { state: "offline", lastSeen: "active recently" }, io);
            }
            const online = await getPublicOnlineUsersList();
            io.emit("getOnlineUsers", online);
          } else {
            const count = (memConnCounts.get(socket.userId) || 1) - 1;
            if (count <= 0) {
              memConnCounts.delete(socket.userId);
              memOnlineUsers.delete(socket.userId);
              await broadcastPresenceUpdate(socket.userId, { state: "offline", lastSeen: "active recently" }, io);
            } else {
              memConnCounts.set(socket.userId, count);
            }
            const online = await getPublicOnlineUsersList();
            io.emit("getOnlineUsers", online);
          }
          console.log(`[Presence] Offline transition buffer completed for user ${socket.userId}`);
        }, DISCONNECT_GRACE_PERIOD);

        activeGraceTimers.set(socket.userId, timer);
      }
    });
  });
};

export const emitToUser = async (userId, event, data) => {
  if (!ioInstance) return;
  const userIdStr = userId.toString();
  
  // 1. Emit IMMEDIATELY (non-blocking)
  // This pushes the packet into the polling buffer without waiting for any checks.
  ioInstance.to(userIdStr).emit(event, data);

  let delivered = false;
  try {
    // 2. In parallel, check if the user is actually connected to decide on queuing
    const sockets = await ioInstance.in(userIdStr).fetchSockets();
    if (sockets && sockets.length > 0) {
      delivered = true;
    }
  } catch (e) {
    // If the check fails, we assume non-delivery to be safe (will be deduplicated on client anyway)
    console.debug(`[Socket] Snappy delivery check failed for ${userIdStr}`);
  }

  // If no real-time delivery was acknowledged, and Redis is available, queue it
  if (!delivered && isRedisAvailable) {
    try {
      await redisClient.lpush(`offline_queue:${userIdStr}`, JSON.stringify({ ...data, _event: event }));
      console.debug(`[Socket] Message queued for offline user: ${userIdStr}`);
    } catch (e) {
      console.error("Reliable emit queuing error:", e);
    }
  }
};

// Cache for Nexus memberships to avoid DB hit on every message
// Key: nexusId, Value: { members: string[], expires: number }
const nexusMembersCache = new Map();
const NEXUS_CACHE_TTL = 30000; // 30 seconds

export const emitToNexus = async (nexusId, event, data) => {
  if (!ioInstance) return;
  const nexusIdStr = nexusId.toString();
  
  // For critical events like "newNexusMessage", use reliable per-user delivery
  // This ensures everyone gets it even if they're in a polling cycle or offline
  if (event === "newNexusMessage") {
    try {
      let members = null;
      const cached = nexusMembersCache.get(nexusIdStr);
      
      if (cached && cached.expires > Date.now()) {
        members = cached.members;
      } else {
        const nexus = await Nexus.findById(nexusIdStr).select("members").lean();
        if (nexus && nexus.members) {
          members = nexus.members.map(m => m.toString());
          nexusMembersCache.set(nexusIdStr, {
            members,
            expires: Date.now() + NEXUS_CACHE_TTL
          });
        }
      }

      if (members) {
        const promises = members.map(memberId => emitToUser(memberId, event, data));
        await Promise.allSettled(promises);
        return;
      }
    } catch (e) {
      console.error("[Socket] Reliable Nexus emit failed:", e.message);
    }
  }

  // Fallback for non-critical events (typing indicators, etc)
  ioInstance.to(nexusIdStr).emit(event, data);
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
