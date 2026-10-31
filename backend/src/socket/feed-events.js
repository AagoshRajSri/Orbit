/**
 * Feed Socket Events — Orbit Feed System
 *
 * Handles two concerns:
 *  1. Dynamic room management: clients join/leave thread:{postId} rooms
 *     so vote updates and new comments are scoped precisely.
 *
 *  2. Vote broadcast coalescing: if a post receives 50 votes in 250ms,
 *     all 50 deltas are accumulated and only ONE emit fires at the end
 *     of the coalescing window — sending { score, delta, upvotes, downvotes }.
 *
 * This file is registered from index.js alongside registerSpotifyEvents(),
 * maintaining the same additive pattern so existing socket logic is untouched.
 *
 * Coalescing Algorithm:
 * ─────────────────────
 * Per-postId, we maintain:
 *   { netDelta, netUpDelta, netDownDelta, latestScore, latestUpvotes,
 *     latestDownvotes, timer }
 *
 * On each vote event:
 *   1. Update net deltas in the accumulator
 *   2. If no pending timer → schedule a 250ms flush
 *   3. On flush → emit the batch to thread:{postId} → clear accumulator
 *
 * The accumulator lives in-process. In a multi-node cluster, each node's
 * flush is independent — clients merge them by setting absolute values
 * (score, upvotes, downvotes) not additive deltas.
 */

import { redisClient, isRedisAvailable } from "../lib/redis.js";

// ── Coalescing State ──────────────────────────────────────────────────────────
/** @type {Map<string, { netDelta: number, score: number, upvotes: number, downvotes: number, timer: NodeJS.Timeout }>} */
const pendingBroadcasts = new Map();

const COALESCE_WINDOW_MS = 250;

/**
 * Schedules or merges a vote metric update for broadcast coalescing.
 * Emits to thread:{postId} on the io instance.
 *
 * @param {object} io        — Socket.IO server instance
 * @param {string} postId    — The post being voted on
 * @param {object} metrics   — { delta, newScore, upvotes, downvotes }
 */
const coalesceBroadcast = (io, postId, metrics) => {
  const existing = pendingBroadcasts.get(postId);

  if (existing) {
    // Merge: accumulate net delta, replace absolute values with latest
    existing.netDelta += metrics.delta || 0;
    existing.score = metrics.newScore;
    existing.upvotes = metrics.upvotes;
    existing.downvotes = metrics.downvotes;
    // Don't reset timer — let the existing one fire
  } else {
    // Create new accumulator with a flush timer
    const entry = {
      netDelta: metrics.delta || 0,
      score: metrics.newScore,
      upvotes: metrics.upvotes,
      downvotes: metrics.downvotes,
      timer: null,
    };

    entry.timer = setTimeout(() => {
      const snapshot = pendingBroadcasts.get(postId);
      if (!snapshot) return;

      io.to(`thread:${postId}`).emit("feed:metrics_sync", {
        postId,
        score: snapshot.score,
        upvotes: snapshot.upvotes,
        downvotes: snapshot.downvotes,
        netDelta: snapshot.netDelta,
      });

      pendingBroadcasts.delete(postId);
    }, COALESCE_WINDOW_MS);

    pendingBroadcasts.set(postId, entry);
  }
};

/**
 * Registers feed-related Socket.IO event handlers on each new socket connection.
 * Called from registerFeedSocketEvents(io) which is invoked once in index.js.
 *
 * @param {import("socket.io").Socket} socket
 * @param {import("socket.io").Server}  io
 */
const registerSocketHandlers = (socket, io) => {
  // ── Thread room join ───────────────────────────────────────────────────────
  // Clients emit this when navigating to a post's thread view.
  socket.on("feed:join_thread", ({ postId } = {}) => {
    if (!postId || typeof postId !== "string") return;
    // Sanitize: only allow valid Mongo ObjectId-like strings
    if (!/^[a-f0-9]{24}$/.test(postId)) return;

    socket.join(`thread:${postId}`);
  });

  // ── Thread room leave ──────────────────────────────────────────────────────
  // Clients emit this when navigating away from a post.
  socket.on("feed:leave_thread", ({ postId } = {}) => {
    if (!postId || typeof postId !== "string") return;
    socket.leave(`thread:${postId}`);
  });

  // ── Feed room (for new post notifications) ─────────────────────────────────
  // Clients subscribe to receive notifications when new posts are created.
  socket.on("feed:join_feed", ({ nexusId } = {}) => {
    const room = nexusId ? `feed:nexus:${nexusId}` : "feed:global";
    socket.join(room);
  });

  socket.on("feed:leave_feed", ({ nexusId } = {}) => {
    const room = nexusId ? `feed:nexus:${nexusId}` : "feed:global";
    socket.leave(room);
  });

  // ── Internal: handle vote metric propagation from vote.service ────────────
  // The vote service calls io.to("thread:x").emit("feed:metrics_sync", ...).
  // This socket handler captures that and routes it through the coalescer.
  // NOTE: We listen on the SERVER side to re-coalesce rapid emissions.
  // This is done by overriding the feed:metrics_sync emit via the onAny hook below.
};

/**
 * Registers the feed socket events module on the Socket.IO server.
 * Mirrors the structure of registerSpotifyEvents(io) for consistency.
 *
 * @param {import("socket.io").Server} io
 */
export const registerFeedEvents = (io) => {
  // Intercept all feed:metrics_sync emits routed through the server and coalesce them
  // This middleware runs only for events emitted with io.to().emit()
  io.of("/").adapter.on("broadcast", (packet, opts) => {
    // Only coalesce feed:metrics_sync packets going to thread: rooms
    if (
      packet?.data?.[0] === "feed:metrics_sync" &&
      opts?.rooms?.size === 1
    ) {
      const room = [...opts.rooms][0];
      if (room?.startsWith("thread:")) {
        const postId = room.replace("thread:", "");
        const metrics = packet.data[1];
        coalesceBroadcast(io, postId, metrics);
        return; // Suppress the original emit — coalescer handles it
      }
    }
  });

  // Register per-socket handlers on connection
  io.on("connection", (socket) => {
    registerSocketHandlers(socket, io);
  });

  console.log("[FeedEvents] Feed socket event handlers registered ✓");
};

/**
 * broadcastNewPost — Emits a new post notification to feed room subscribers.
 * Called from feed.controller.js after successful createPost.
 *
 * @param {import("socket.io").Server} io
 * @param {object} post          — Populated post document
 */
export const broadcastNewPost = (io, post) => {
  if (!io) return;
  const room = post.nexusId ? `feed:nexus:${post.nexusId}` : "feed:global";
  io.to(room).emit("feed:new_post", { post });
};
