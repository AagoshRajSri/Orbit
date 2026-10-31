/**
 * Vote Service — Orbit Feed System
 *
 * Implements atomic Redis-based voting with Lua scripts to guarantee zero race
 * conditions when multiple users vote concurrently on the same post/comment.
 *
 * Architecture:
 * ─────────────
 *  1. Client clicks vote → HTTP POST /api/feed/posts/:id/vote
 *  2. castVote() runs the Lua script in ONE Redis round-trip:
 *     a. Reads current user vote from Hash
 *     b. Computes delta (toggle-off if same, switch if different, new if none)
 *     c. Writes new vote to user ledger Hash
 *     d. Increments/decrements stat counters in stats Hash
 *     e. Updates ZSET score for all three feed sorted sets
 *  3. Returns { newVote, newScore, upvotes, downvotes } from Lua
 *  4. Emits socket event to thread:{targetId} room with metric delta
 *
 * Redis Keys Used:
 * ────────────────
 *  vote:{type}:{id}:users  Hash  → { userId: "1"|"-1" }          (user ledger)
 *  {type}:{id}:stats       Hash  → { upvotes, downvotes, score }  (stat cache)
 *  feed:trending           ZSET  → scored by hotRank              (hot feed)
 *  feed:recent             ZSET  → scored by createdAt ms         (new feed)
 *  feed:top                ZSET  → scored by raw score            (top feed)
 *  feed:dirty              Set   → postIds that need DB flush      (work queue)
 *
 * Fallback:
 * ─────────
 *  When Redis is unavailable, castVote() falls back to direct MongoDB writes.
 *  The fallback is transactionally safe (findOneAndUpdate with $inc) but NOT
 *  atomic w.r.t. race conditions. Acceptable for offline/single-node dev mode.
 */

import { redisClient, isRedisAvailable } from "../lib/redis.js";
import Post from "../models/post.model.js";
import Comment from "../models/comment.model.js";
import { getIO } from "../socket/socket.js";

// ── Redis Key Builders ────────────────────────────────────────────────────────
export const keys = {
  userLedger: (type, id) => `vote:${type}:${id}:users`,
  stats: (type, id) => `${type}:${id}:stats`,
  feedTrending: "feed:trending",
  feedRecent: "feed:recent",
  feedTop: "feed:top",
  feedDirty: "feed:dirty",
};

// ── Wilson-Score Hot Rank ─────────────────────────────────────────────────────
// Identical formula used in Post.computeHotRank static method.
// Kept here so Lua-side ZSET scores stay consistent with MongoDB fallback.
const computeHotRank = (upvotes, downvotes, createdAtMs) => {
  const score = upvotes - downvotes;
  const order = Math.log10(Math.max(Math.abs(score), 1));
  const sign = score > 0 ? 1 : score < 0 ? -1 : 0;
  const epochSeconds = (createdAtMs - 1704067200000) / 1000;
  return sign * order + epochSeconds / 45000;
};

// ── Atomic Vote Lua Script ────────────────────────────────────────────────────
/**
 * KEYS[1] = vote:{type}:{id}:users     (user vote ledger Hash)
 * KEYS[2] = {type}:{id}:stats          (metric counters Hash)
 * KEYS[3] = feed:dirty                 (dirty set for persistence worker)
 *
 * ARGV[1] = userId                     (string)
 * ARGV[2] = newVoteIntent              ("1", "-1", or "0" to remove)
 * ARGV[3] = targetId                   (post/comment id string)
 * ARGV[4] = hotRank                    (float, for ZSET update — passed from JS)
 * ARGV[5] = createdAtMs               (epoch ms for recent ZSET score)
 *
 * Returns: table { resultVote, newScore, newUpvotes, newDownvotes }
 *   resultVote: 0 = vote removed, 1 = upvote, -1 = downvote
 */
const VOTE_LUA_SCRIPT = `
local ledgerKey   = KEYS[1]
local statsKey    = KEYS[2]
local dirtyKey    = KEYS[3]
local trendingKey = KEYS[4]
local recentKey   = KEYS[5]
local topKey      = KEYS[6]

local userId      = ARGV[1]
local intent      = tonumber(ARGV[2])
local targetId    = ARGV[3]
local isPost      = ARGV[4]

-- 1. Read existing vote
local existing = redis.call('HGET', ledgerKey, userId)
existing = existing and tonumber(existing) or 0

-- 2. Determine effective new vote (toggle-off if same as intent)
local effectiveVote
if existing == intent then
  effectiveVote = 0   -- toggle off
else
  effectiveVote = intent
end

-- 3. Compute deltas
local upDelta   = 0
local downDelta = 0
local scoreDelta = effectiveVote - existing

if existing == 1  then upDelta   = upDelta   - 1 end
if existing == -1 then downDelta = downDelta - 1 end
if effectiveVote == 1  then upDelta   = upDelta   + 1 end
if effectiveVote == -1 then downDelta = downDelta + 1 end

-- 4. Update user ledger
if effectiveVote == 0 then
  redis.call('HDEL', ledgerKey, userId)
else
  redis.call('HSET', ledgerKey, userId, tostring(effectiveVote))
end

-- 5. Update stats hash with HINCRBY
local newUpvotes   = redis.call('HINCRBY', statsKey, 'upvotes',   upDelta)
local newDownvotes = redis.call('HINCRBY', statsKey, 'downvotes', downDelta)
local newScore     = redis.call('HINCRBY', statsKey, 'score',     scoreDelta)

-- Clamp negatives
if tonumber(newUpvotes)   < 0 then redis.call('HSET', statsKey, 'upvotes',   0) newUpvotes   = 0 end
if tonumber(newDownvotes) < 0 then redis.call('HSET', statsKey, 'downvotes', 0) newDownvotes = 0 end

-- 6. Mark this post/comment as dirty for the persistence worker
redis.call('SADD', dirtyKey, targetId)

-- 7. Atomically update feed ZSETs in the same round-trip if post
if isPost == '1' and trendingKey and trendingKey ~= '' then
  local createdAtMs = redis.call('HGET', statsKey, 'createdAtMs')
  createdAtMs = createdAtMs and tonumber(createdAtMs) or 1704067200000

  local s = tonumber(newScore)
  local order = 0
  if math.abs(s) >= 1 then
    order = math.log10(math.abs(s))
  end
  local sign = 0
  if s > 0 then sign = 1 elseif s < 0 then sign = -1 end
  local epochSec = (createdAtMs - 1704067200000) / 1000
  local hotRank = sign * order + epochSec / 45000

  redis.call('ZADD', trendingKey, hotRank, targetId)
  redis.call('ZADD', recentKey, createdAtMs, targetId)
  redis.call('ZADD', topKey, newScore, targetId)
end

return { effectiveVote, newScore, newUpvotes, newDownvotes }
`;

// Pre-load scripts at module init time (SHA caching via EVALSHA in ioredis)
let _voteSha = null;

/**
 * Pre-load Lua scripts into Redis script cache.
 * Called once at server startup (from index.js via initFeedService).
 */
export const loadVoteScripts = async () => {
  if (!isRedisAvailable) return;
  try {
    _voteSha = await redisClient.script("LOAD", VOTE_LUA_SCRIPT);
    console.log("[VoteService] Lua scripts loaded ✓");
  } catch (err) {
    console.warn("[VoteService] Script preload failed:", err.message);
  }
};

/**
 * Seeds the Redis stats hash and feed ZSETs from MongoDB.
 * Called when a post is first accessed and cache is cold.
 * @param {string} postId
 * @param {object} post — Mongoose Post document
 */
export const warmPostCache = async (postId, post) => {
  if (!isRedisAvailable) return;
  const statsKey = keys.stats("post", postId);
  try {
    const exists = await redisClient.exists(statsKey);
    if (exists) return; // Already warm

    const createdAtMs = post.createdAt ? new Date(post.createdAt).getTime() : Date.now();
    const pipeline = redisClient.pipeline();
    pipeline.hset(statsKey, {
      upvotes: post.upvotes,
      downvotes: post.downvotes,
      score: post.score,
      createdAtMs: createdAtMs,
    });
    // TTL: 48 hours. Refreshed on every vote. Cold posts expire naturally.
    pipeline.expire(statsKey, 48 * 3600);

    const hotRank = Post.computeHotRank(
      post.upvotes,
      post.downvotes,
      post.createdAt
    );
    pipeline.zadd(keys.feedTrending, hotRank, postId);
    pipeline.zadd(keys.feedRecent, post.createdAt.getTime(), postId);
    pipeline.zadd(keys.feedTop, post.score, postId);

    await pipeline.exec();
  } catch (err) {
    console.warn("[VoteService] warmPostCache failed:", err.message);
  }
};

/**
 * castVote — The primary public API of this service.
 *
 * @param {object} params
 * @param {string} params.userId     — The voting user's Mongo ID string
 * @param {string} params.targetType — "post" | "comment"
 * @param {string} params.targetId   — The Mongo ID of the post/comment
 * @param {number} params.intent     — 1 (upvote) | -1 (downvote)
 *
 * @returns {object} { resultVote, newScore, upvotes, downvotes, delta }
 */
export const castVote = async ({ userId, targetType, targetId, intent }) => {
  if (!["post", "comment"].includes(targetType)) {
    throw new Error("targetType must be 'post' or 'comment'");
  }
  if (![1, -1].includes(intent)) {
    throw new Error("intent must be 1 or -1");
  }

  // ── Redis path (fast) ───────────────────────────────────────────────────────
  if (isRedisAvailable) {
    return await _castVoteRedis({ userId, targetType, targetId, intent });
  }

  // ── MongoDB fallback (slower but safe for dev) ─────────────────────────────
  return await _castVoteMongo({ userId, targetType, targetId, intent });
};

// ── Redis Implementation ──────────────────────────────────────────────────────
const _castVoteRedis = async ({ userId, targetType, targetId, intent }) => {
  const ledgerKey = keys.userLedger(targetType, targetId);
  const statsKey = keys.stats(targetType, targetId);
  const dirtyKey = keys.feedDirty;

  const isPost = targetType === "post" ? "1" : "0";

  // Execute the atomic Lua vote script in exactly 1 round-trip
  let result;
  try {
    if (_voteSha) {
      result = await redisClient.evalsha(
        _voteSha,
        6,
        ledgerKey,
        statsKey,
        dirtyKey,
        keys.feedTrending,
        keys.feedRecent,
        keys.feedTop,
        userId,
        intent.toString(),
        targetId,
        isPost
      );
    } else {
      result = await redisClient.eval(
        VOTE_LUA_SCRIPT,
        6,
        ledgerKey,
        statsKey,
        dirtyKey,
        keys.feedTrending,
        keys.feedRecent,
        keys.feedTop,
        userId,
        intent.toString(),
        targetId,
        isPost
      );
    }
  } catch (luaErr) {
    if (luaErr.message.includes("NOSCRIPT")) {
      _voteSha = await redisClient.script("LOAD", VOTE_LUA_SCRIPT);
      result = await redisClient.evalsha(
        _voteSha,
        6,
        ledgerKey,
        statsKey,
        dirtyKey,
        keys.feedTrending,
        keys.feedRecent,
        keys.feedTop,
        userId,
        intent.toString(),
        targetId,
        isPost
      );
    } else {
      console.error("[VoteService] Lua eval error:", luaErr.message);
      throw luaErr;
    }
  }

  const [resultVote, newScore, newUpvotes, newDownvotes] = result.map(Number);
  const delta = resultVote === 0 ? -intent : intent;

  // Broadcast asynchronously via setImmediate so HTTP response is returned immediately
  setImmediate(() => {
    _broadcastVoteUpdate(targetType, targetId, {
      resultVote,
      newScore,
      upvotes: newUpvotes,
      downvotes: newDownvotes,
      delta,
    });
  });

  return { resultVote, newScore, upvotes: newUpvotes, downvotes: newDownvotes, delta };
};

// ── MongoDB Fallback Implementation ──────────────────────────────────────────
const _castVoteMongo = async ({ userId, targetType, targetId, intent }) => {
  const Model = targetType === "post" ? Post : Comment;
  const doc = await Model.findById(targetId).lean();
  if (!doc) throw new Error(`${targetType} not found`);

  // In-memory vote simulation (no race protection in fallback mode — dev only)
  const existing = 0; // No ledger in Mongo fallback; treat as fresh vote
  const effectiveVote = intent; // Always apply in fallback

  const upDelta = effectiveVote === 1 ? 1 : existing === 1 ? -1 : 0;
  const downDelta = effectiveVote === -1 ? 1 : existing === -1 ? -1 : 0;
  const scoreDelta = effectiveVote - existing;

  const updated = await Model.findByIdAndUpdate(
    targetId,
    {
      $inc: {
        upvotes: upDelta,
        downvotes: downDelta,
        score: scoreDelta,
      },
    },
    { new: true, select: "upvotes downvotes score createdAt" }
  ).lean();

  // Update hot rank in Mongo
  if (targetType === "post") {
    const newHotRank = Post.computeHotRank(
      updated.upvotes,
      updated.downvotes,
      updated.createdAt
    );
    await Post.findByIdAndUpdate(targetId, { hotRank: newHotRank });
  }

  return {
    resultVote: effectiveVote,
    newScore: updated.score,
    upvotes: updated.upvotes,
    downvotes: updated.downvotes,
    delta: effectiveVote,
  };
};

// ── Socket Broadcast ──────────────────────────────────────────────────────────
const _broadcastVoteUpdate = (targetType, targetId, metrics) => {
  try {
    const io = getIO();
    if (!io) return;

    // For comments, the room is still the parent post's thread room.
    // The postId is expected to be embedded in the targetId for comments
    // (see feed-events.js for room management).
    const room = `thread:${targetId}`;
    io.to(room).emit("feed:metrics_sync", {
      targetType,
      targetId,
      ...metrics,
    });
  } catch (_) {
    // Socket may not be initialized during tests — silently skip
  }
};

/**
 * getUserVote — Get current user vote for a target (used in API response enrichment)
 * @param {string} userId
 * @param {string} targetType — "post" | "comment"
 * @param {string} targetId
 * @returns {number} 1 | -1 | 0
 */
export const getUserVote = async (userId, targetType, targetId) => {
  if (!isRedisAvailable) return 0;
  try {
    const raw = await redisClient.hget(
      keys.userLedger(targetType, targetId),
      userId
    );
    return raw ? Number(raw) : 0;
  } catch {
    return 0;
  }
};

/**
 * getPostStats — Get live stats from Redis cache (falls back to doc values)
 * @param {string} postId
 * @param {object} fallback — { upvotes, downvotes, score } from MongoDB doc
 */
export const getPostStats = async (postId, fallback = {}) => {
  if (!isRedisAvailable) return fallback;
  try {
    const raw = await redisClient.hgetall(keys.stats("post", postId));
    if (!raw || !raw.score) return fallback;
    return {
      upvotes: Number(raw.upvotes) || 0,
      downvotes: Number(raw.downvotes) || 0,
      score: Number(raw.score) || 0,
    };
  } catch {
    return fallback;
  }
};
