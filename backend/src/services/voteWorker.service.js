/**
 * Vote Persistence Worker — Orbit Feed System
 *
 * A background setInterval worker that flushes "dirty" vote counts from Redis
 * into MongoDB every FLUSH_INTERVAL_MS (default: 2 minutes).
 *
 * Design rationale:
 * ─────────────────
 * Redis is the authoritative real-time vote store. MongoDB is durable cold
 * storage. The worker bridges the gap by:
 *
 *  1. SRANDMEMBER / SMEMBERS on `feed:dirty` to get the work queue
 *  2. For each dirty postId: HMGET stats to read current tally
 *  3. Bulk MongoDB update via findByIdAndUpdate ($set — not $inc — because Redis
 *     already holds the final tally, not a delta)
 *  4. SREM the postId from `feed:dirty` after successful write
 *
 * Guarantees:
 * ───────────
 * - Crash between step 3 and step 4 → postId remains dirty → re-flushed next cycle ✓
 * - MongoDB write fails → postId stays dirty → retried next cycle ✓
 * - Redis eviction of stats key before flush → worker detects empty hash, skips ✓
 *
 * This is an at-least-once delivery pattern: MongoDB may occasionally receive
 * a redundant write of the same value (idempotent $set — harmless).
 */

import { redisClient, isRedisAvailable } from "../lib/redis.js";
import Post from "../models/post.model.js";
import Comment from "../models/comment.model.js";
import { keys } from "./vote.service.js";

// How often to flush dirty keys to MongoDB (2 minutes)
const FLUSH_INTERVAL_MS = 2 * 60 * 1000;

// Max posts to flush per cycle (prevents long-running transactions)
const FLUSH_BATCH_SIZE = 100;

// Prevent concurrent flush runs (defensive guard)
let _isFlushing = false;

/**
 * Flushes all dirty post stats from Redis into MongoDB.
 * Runs as a background job — should never throw unhandled.
 */
const flushDirtyVotes = async () => {
  if (!isRedisAvailable) return;
  if (_isFlushing) {
    console.warn("[VoteWorker] Previous flush still running — skipping cycle");
    return;
  }

  _isFlushing = true;
  const flushStart = Date.now();
  let flushed = 0;
  let errors = 0;

  try {
    // 1. Read up to FLUSH_BATCH_SIZE dirty IDs from the set.
    //    SRANDMEMBER does NOT remove entries, allowing crash recovery.
    const dirtyIds = await redisClient.srandmember(
      keys.feedDirty,
      FLUSH_BATCH_SIZE
    );

    if (!dirtyIds || dirtyIds.length === 0) return;

    // 2. For each dirty ID: read stats hash, update MongoDB
    for (const id of dirtyIds) {
      try {
        await _flushSinglePost(id);
        // 3. Remove from dirty set only after successful write
        await redisClient.srem(keys.feedDirty, id);
        flushed++;
      } catch (err) {
        errors++;
        // Non-fatal: ID stays in dirty set and will be retried
        console.error(`[VoteWorker] Failed to flush ${id}:`, err.message);
      }
    }
  } catch (outer) {
    console.error("[VoteWorker] Flush cycle error:", outer.message);
  } finally {
    _isFlushing = false;
    const elapsed = Date.now() - flushStart;
    if (flushed > 0 || errors > 0) {
      console.log(
        `[VoteWorker] Flush complete — ${flushed} flushed, ${errors} errors, ${elapsed}ms`
      );
    }
  }
};

/**
 * Flush a single post's Redis stats into MongoDB.
 * Also recomputes hotRank before writing.
 */
const _flushSinglePost = async (postId) => {
  const statsKey = keys.stats("post", postId);
  const raw = await redisClient.hgetall(statsKey);

  if (!raw || Object.keys(raw).length === 0) {
    // Stats hash expired or was evicted — skip. MongoDB already has last flush.
    return;
  }

  const upvotes = Math.max(Number(raw.upvotes) || 0, 0);
  const downvotes = Math.max(Number(raw.downvotes) || 0, 0);
  const score = Number(raw.score) || 0;

  // Recompute hotRank from current tally
  const post = await Post.findById(postId).select("createdAt").lean();
  if (!post) {
    // Post was deleted — remove from dirty set and ZSETs
    await redisClient.zrem(keys.feedTrending, postId);
    await redisClient.zrem(keys.feedRecent, postId);
    await redisClient.zrem(keys.feedTop, postId);
    return;
  }

  const hotRank = Post.computeHotRank(upvotes, downvotes, post.createdAt);

  await Post.findByIdAndUpdate(
    postId,
    {
      $set: {
        upvotes,
        downvotes,
        score,
        hotRank,
      },
    },
    { timestamps: false } // Preserve original updatedAt
  );
};

/**
 * Comment vote flush — comment stats use the same dirty set but a different
 * stats key prefix. We prefix comment IDs with "c:" in the dirty set to
 * distinguish them from post IDs.
 *
 * NOTE: Currently the vote service adds post IDs only. Comment persistence is
 * lower-priority (comments are smaller read targets). This function is a hook
 * for future extension.
 */
const _flushSingleComment = async (commentId) => {
  const statsKey = keys.stats("comment", commentId);
  const raw = await redisClient.hgetall(statsKey);
  if (!raw || Object.keys(raw).length === 0) return;

  const upvotes = Math.max(Number(raw.upvotes) || 0, 0);
  const downvotes = Math.max(Number(raw.downvotes) || 0, 0);
  const score = Number(raw.score) || 0;

  await Comment.findByIdAndUpdate(
    commentId,
    { $set: { upvotes, downvotes, score } },
    { timestamps: false }
  );
};

/**
 * Starts the background vote persistence worker.
 * Should be called once during server initialization (from index.js).
 *
 * @param {object} [options]
 * @param {number} [options.intervalMs] — Override flush interval (for tests)
 * @returns {{ stop: Function }} — Object with stop() method to cancel the worker
 */
export const startVoteWorker = (options = {}) => {
  const interval = options.intervalMs ?? FLUSH_INTERVAL_MS;

  console.log(
    `[VoteWorker] Starting — flush interval ${interval / 1000}s, batch size ${FLUSH_BATCH_SIZE}`
  );

  const timer = setInterval(flushDirtyVotes, interval);

  // Run an initial flush shortly after startup to sync any state from a previous crash
  const initialTimer = setTimeout(flushDirtyVotes, 15_000);

  return {
    stop: () => {
      clearInterval(timer);
      clearTimeout(initialTimer);
      console.log("[VoteWorker] Stopped.");
    },
    // Expose for testing
    _flush: flushDirtyVotes,
  };
};
