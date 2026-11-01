/**
 * Feed Controller — Orbit Feed System
 *
 * Implements cursor-based (keyset) pagination, not offset pagination.
 * Reason: offset degrades to O(n) at large datasets because the DB must skip
 * rows. Cursor pagination using an indexed field (cursorTs or score) stays O(1)
 * per page regardless of total dataset size.
 *
 * Cursor encoding:
 *   The cursor returned by the API is a base64 JSON object:
 *   { ts: <cursorTs>, id: <lastDocId> }
 *   The `id` field breaks ties when two docs share the same cursorTs.
 */

import Post from "../models/post.model.js";
import Comment from "../models/comment.model.js";
import User from "../models/user.model.js";
import {
  castVote,
  getUserVote,
  getPostStats,
  warmPostCache,
  keys,
} from "../services/vote.service.js";
import { redisClient, isRedisAvailable } from "../lib/redis.js";
import { z } from "zod";
import mongoose from "mongoose";

// ── Input Schemas ─────────────────────────────────────────────────────────────
const createPostSchema = z.object({
  title: z.string().min(3).max(300).trim(),
  body: z.string().max(40000).optional().default(""),
  imageUrl: z.string().url().optional().nullable(),
  linkUrl: z.string().url().optional().nullable(),
  nexusId: z.string().optional().nullable(),
  tags: z.array(z.string().max(30)).max(5).optional().default([]),
});

const createCommentSchema = z.object({
  body: z.string().min(1).max(10000).trim(),
  parentId: z.string().optional().nullable(),
});

const voteSchema = z.object({
  intent: z.union([
    z.literal(1),
    z.literal(-1),
    z.literal("1").transform(Number),
    z.literal("-1").transform(Number),
  ]),
});

// ── Cursor Utilities ──────────────────────────────────────────────────────────
const encodeCursor = (doc) =>
  Buffer.from(JSON.stringify({ ts: doc.cursorTs, id: doc._id.toString() })).toString("base64url");

const decodeCursor = (str) => {
  try {
    const parsed = JSON.parse(Buffer.from(str, "base64url").toString("utf8"));
    if (parsed && typeof parsed === "object" && parsed.ts !== undefined) return parsed;
    return null;
  } catch {
    return null;
  }
};

// ── Feed Helpers ──────────────────────────────────────────────────────────────
const _hydratedPageCache = new Map();

/**
 * Reads the feed from Redis ZSETs first. Falls back to MongoDB if Redis is
 * unavailable or the ZSET has no relevant entries.
 */
const _getFeedFromRedis = async (sort, nexusId, limit, cursor) => {
  const zsetKey =
    sort === "recent" ? keys.feedRecent : sort === "top" ? keys.feedTop : keys.feedTrending;

  // ZREVRANGEBYSCORE returns postIds sorted highest score first
  const postIds = await redisClient.zrevrange(zsetKey, 0, limit + 5); // +5 buffer for deleted/filtered
  if (!postIds || postIds.length === 0) return null;

  // Cursor filtering (skip items already seen)
  let startIdx = 0;
  if (cursor) {
    const cursorObj = decodeCursor(cursor);
    if (cursorObj) {
      const cursorIdx = postIds.indexOf(cursorObj.id);
      if (cursorIdx !== -1) startIdx = cursorIdx + 1;
    }
  }

  const pageIds = postIds.slice(startIdx, startIdx + limit);
  if (pageIds.length === 0) return { posts: [], nextCursor: null };

  // Hydrate from MongoDB in a single query with short-term (3s) micro-cache
  const cacheKey = pageIds.join(",") + (nexusId || "");
  const cachedHydrated = _hydratedPageCache.get(cacheKey);
  const now = Date.now();
  let posts;
  if (cachedHydrated && now - cachedHydrated.cachedAt < 3000) {
    posts = cachedHydrated.posts;
  } else {
    posts = await Post.find({
      _id: { $in: pageIds.map((id) => new mongoose.Types.ObjectId(id)) },
      isDeleted: false,
      ...(nexusId ? { nexusId } : {}),
    })
      .populate("authorId", "username profilePic orbitId")
      .lean();
    _hydratedPageCache.set(cacheKey, { posts, cachedAt: now });
    if (_hydratedPageCache.size > 200) {
      const oldest = _hydratedPageCache.keys().next().value;
      _hydratedPageCache.delete(oldest);
    }
  }

  // Restore ZSET order (MongoDB $in doesn't preserve order)
  const postMap = new Map(posts.map((p) => [p._id.toString(), p]));
  const ordered = pageIds
    .map((id) => postMap.get(id))
    .filter(Boolean);

  const hasMore = postIds.length > startIdx + limit;
  const nextCursor = hasMore && ordered.length > 0
    ? encodeCursor(ordered[ordered.length - 1])
    : null;

  return { posts: ordered, nextCursor };
};

// ── Controllers ───────────────────────────────────────────────────────────────

/**
 * GET /api/feed
 * Returns paginated posts with cursor-based navigation.
 * Query params: sort (trending|recent|top), cursor, limit, nexusId
 */
export const getFeed = async (req, res) => {
  try {
    const {
      sort = "trending",
      cursor,
      limit: rawLimit = "20",
      nexusId,
    } = req.query;

    const limit = Math.min(Math.max(parseInt(rawLimit, 10) || 20, 1), 50);
    const validSorts = ["trending", "recent", "top"];
    const sortKey = validSorts.includes(sort) ? sort : "trending";
    const userId = req.user._id.toString();

    // ── Try Redis first ─────────────────────────────────────────────────────
    let feedResult = null;
    if (isRedisAvailable) {
      try {
        feedResult = await _getFeedFromRedis(sortKey, nexusId, limit, cursor);
      } catch (redisErr) {
        console.warn("[FeedController] Redis feed read failed:", redisErr.message);
      }
    }

    // ── Fallback to MongoDB ─────────────────────────────────────────────────
    if (!feedResult || feedResult.posts.length === 0) {
      const filter = { isDeleted: false };
      if (nexusId) filter.nexusId = nexusId;

      if (cursor) {
        const cur = decodeCursor(cursor);
        if (cur) {
          if (sortKey === "recent") {
            filter.$or = [
              { cursorTs: { $lt: cur.ts } },
              { cursorTs: cur.ts, _id: { $lt: cur.id } },
            ];
          } else if (sortKey === "top") {
            filter.$or = [
              { score: { $lt: cur.ts } }, // ts field repurposed for score in top sort
              { score: cur.ts, _id: { $lt: cur.id } },
            ];
          } else {
            filter.$or = [
              { hotRank: { $lt: cur.ts } },
              { hotRank: cur.ts, _id: { $lt: cur.id } },
            ];
          }
        }
      }

      const sortField =
        sortKey === "recent"
          ? { cursorTs: -1, _id: -1 }
          : sortKey === "top"
          ? { score: -1, _id: -1 }
          : { hotRank: -1, _id: -1 };

      const mongoCacheKey = `mongo:${sortKey}:${nexusId || ""}:${limit}:${cursor || ""}`;
      const cachedFallback = _hydratedPageCache.get(mongoCacheKey);
      const fallbackNow = Date.now();
      let posts;
      if (cachedFallback && fallbackNow - cachedFallback.cachedAt < 3000) {
        posts = cachedFallback.posts;
      } else {
        posts = await Post.find(filter)
          .sort(sortField)
          .limit(limit + 1) // fetch one extra to detect hasMore
          .populate("authorId", "username profilePic orbitId")
          .lean();
        _hydratedPageCache.set(mongoCacheKey, { posts, cachedAt: fallbackNow });
      }

      const hasMore = posts.length > limit;
      const pagePosts = hasMore ? posts.slice(0, limit) : posts;
      const nextCursor = hasMore ? encodeCursor(pagePosts[pagePosts.length - 1]) : null;

      feedResult = { posts: pagePosts, nextCursor };
    }

    // ── Enrich with live Redis stats + user's own vote in 1 pipeline round-trip ──
    let enriched = feedResult.posts;
    if (isRedisAvailable && feedResult.posts.length > 0) {
      try {
        const pipeline = redisClient.pipeline();
        for (const post of feedResult.posts) {
          const pid = post._id.toString();
          pipeline.hgetall(keys.stats("post", pid));
          pipeline.hget(keys.userLedger("post", pid), userId);
        }
        const pipeResults = await pipeline.exec();

        enriched = feedResult.posts.map((post, idx) => {
          const statsResult = pipeResults?.[idx * 2]?.[1];
          const voteResult = pipeResults?.[idx * 2 + 1]?.[1];

          const liveStats =
            statsResult && statsResult.score !== undefined
              ? {
                  upvotes: Number(statsResult.upvotes) || 0,
                  downvotes: Number(statsResult.downvotes) || 0,
                  score: Number(statsResult.score) || 0,
                }
              : {
                  upvotes: post.upvotes,
                  downvotes: post.downvotes,
                  score: post.score,
                };

          const userVote = voteResult ? Number(voteResult) : 0;

          return {
            ...post,
            ...liveStats,
            userVote,
          };
        });
      } catch (pipeErr) {
        console.warn("[FeedController] Redis pipeline enrichment failed, using doc values:", pipeErr.message);
        enriched = feedResult.posts.map((post) => ({
          ...post,
          userVote: 0,
        }));
      }
    } else {
      enriched = feedResult.posts.map((post) => ({
        ...post,
        userVote: 0,
      }));
    }

    return res.json({
      success: true,
      data: {
        posts: enriched,
        nextCursor: feedResult.nextCursor,
        sort: sortKey,
      },
    });
  } catch (err) {
    console.error("[FeedController] getFeed error:", err);
    return res.status(500).json({ success: false, error: { message: "Failed to load feed" } });
  }
};

/**
 * POST /api/feed/posts
 * Create a new post (text, link, or image).
 */
export const createPost = async (req, res) => {
  try {
    const parseResult = createPostSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: { message: parseResult.error.issues[0]?.message || "Invalid input" },
      });
    }

    const { title, body, imageUrl, linkUrl, nexusId, tags } = parseResult.data;
    const authorId = req.user._id;

    const post = await Post.create({
      authorId,
      title,
      body,
      imageUrl: imageUrl || null,
      linkUrl: linkUrl || null,
      nexusId: nexusId || null,
      tags,
      cursorTs: Date.now(),
    });

    // Warm Redis cache immediately so the first voter doesn't trigger a cold fetch
    if (isRedisAvailable) {
      await warmPostCache(post._id.toString(), post);
    }

    const populated = await post.populate("authorId", "username profilePic orbitId");

    return res.status(201).json({
      success: true,
      data: { ...populated.toObject(), userVote: 0 },
    });
  } catch (err) {
    console.error("[FeedController] createPost error:", err);
    return res.status(500).json({ success: false, error: { message: "Failed to create post" } });
  }
};

/**
 * GET /api/feed/posts/:postId
 * Returns a single post with live Redis stats.
 */
export const getPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id.toString();

    const post = await Post.findOne({ _id: postId, isDeleted: false })
      .populate("authorId", "username profilePic orbitId")
      .lean();

    if (!post) {
      return res.status(404).json({ success: false, error: { message: "Post not found" } });
    }

    // Warm cache if cold
    if (isRedisAvailable) {
      await warmPostCache(postId, post);
    }

    const liveStats = await getPostStats(postId, {
      upvotes: post.upvotes,
      downvotes: post.downvotes,
      score: post.score,
    });
    const userVote = await getUserVote(userId, "post", postId);

    return res.json({
      success: true,
      data: { ...post, ...liveStats, userVote },
    });
  } catch (err) {
    console.error("[FeedController] getPost error:", err);
    return res.status(500).json({ success: false, error: { message: "Failed to get post" } });
  }
};

/**
 * DELETE /api/feed/posts/:postId
 * Soft-delete a post (author or admin only).
 */
export const deletePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id.toString();

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ success: false, error: { message: "Post not found" } });
    }
    if (post.authorId.toString() !== userId) {
      return res.status(403).json({ success: false, error: { message: "Not authorized" } });
    }

    post.isDeleted = true;
    await post.save();

    // Remove from Redis ZSETs
    if (isRedisAvailable) {
      await Promise.all([
        redisClient.zrem(keys.feedTrending, postId),
        redisClient.zrem(keys.feedRecent, postId),
        redisClient.zrem(keys.feedTop, postId),
      ]).catch(() => {});
    }

    return res.json({ success: true, data: { message: "Post deleted" } });
  } catch (err) {
    console.error("[FeedController] deletePost error:", err);
    return res.status(500).json({ success: false, error: { message: "Failed to delete post" } });
  }
};

/**
 * POST /api/feed/posts/:postId/vote
 * Cast or toggle a vote on a post.
 * Body: { intent: "1" | "-1" }
 */
export const votePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id.toString();

    const parseResult = voteSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: { message: "intent must be '1' or '-1'" },
      });
    }

    const { intent } = parseResult.data;

    const result = await castVote({
      userId,
      targetType: "post",
      targetId: postId,
      intent,
    });

    return res.json({ success: true, data: result });
  } catch (err) {
    console.error("[FeedController] votePost error:", err);
    if (err.message === "Post not found") {
      return res.status(404).json({ success: false, error: { message: "Post not found" } });
    }
    return res.status(500).json({ success: false, error: { message: "Vote failed" } });
  }
};

// ── Comment Controllers ───────────────────────────────────────────────────────

/**
 * GET /api/feed/posts/:postId/comments
 * Returns ALL comments for a post in path order (for client-side tree building).
 * The client receives a flat array; the tree is reconstructed by useThreadStore.
 */
export const getComments = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id.toString();

    // Verify post exists
    const postExists = await Post.countDocuments({ _id: postId, isDeleted: false });
    if (!postExists) {
      return res.status(404).json({ success: false, error: { message: "Post not found" } });
    }

    // Fetch comments sorted strictly by path (matching compound index { postId: 1, path: 1 })
    // Soft-deleted comments are included with body redacted so tree traversal works
    const limit = Math.min(Number(req.query.limit) || 1000, 5000);
    const comments = await Comment.find({ postId })
      .sort({ path: 1 })
      .limit(limit)
      .populate("authorId", "username profilePic orbitId")
      .lean();

    // Enrich with user vote via single pipeline
    let enriched = comments;
    if (isRedisAvailable && comments.length > 0) {
      try {
        const pipeline = redisClient.pipeline();
        for (const c of comments) {
          pipeline.hget(keys.userLedger("comment", c._id.toString()), userId);
        }
        const pipeResults = await pipeline.exec();

        enriched = comments.map((c, idx) => {
          const voteResult = pipeResults?.[idx]?.[1];
          const userVote = voteResult ? Number(voteResult) : 0;
          if (c.isDeleted) {
            return {
              ...c,
              body: "[deleted]",
              authorId: null,
              userVote,
            };
          }
          return { ...c, userVote };
        });
      } catch {
        enriched = comments.map((c) => ({
          ...c,
          body: c.isDeleted ? "[deleted]" : c.body,
          authorId: c.isDeleted ? null : c.authorId,
          userVote: 0,
        }));
      }
    } else {
      enriched = comments.map((c) => ({
        ...c,
        body: c.isDeleted ? "[deleted]" : c.body,
        authorId: c.isDeleted ? null : c.authorId,
        userVote: 0,
      }));
    }

    return res.json({ success: true, data: { comments: enriched } });
  } catch (err) {
    console.error("[FeedController] getComments error:", err);
    return res.status(500).json({ success: false, error: { message: "Failed to load comments" } });
  }
};

/**
 * POST /api/feed/posts/:postId/comments
 * Create a new comment (top-level or reply).
 * Body: { body, parentId? }
 */
export const createComment = async (req, res) => {
  try {
    const { postId } = req.params;
    const authorId = req.user._id;

    const parseResult = createCommentSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: { message: parseResult.error.issues[0]?.message || "Invalid input" },
      });
    }
    const { body, parentId } = parseResult.data;

    // Verify post exists and is not locked
    const post = await Post.findOne({ _id: postId, isDeleted: false }).lean();
    if (!post) {
      return res.status(404).json({ success: false, error: { message: "Post not found" } });
    }
    if (post.isLocked) {
      return res.status(403).json({ success: false, error: { message: "Post is locked" } });
    }

    // ── Build materialized path ──────────────────────────────────────────────
    let path;
    let depth;

    if (!parentId) {
      // Top-level comment: path is just the postId segment
      path = `/${postId}`;
      depth = 0;
    } else {
      // Reply to existing comment
      const parent = await Comment.findOne({
        _id: parentId,
        postId,
        isDeleted: false,
      }).lean();

      if (!parent) {
        return res.status(404).json({ success: false, error: { message: "Parent comment not found" } });
      }

      if (parent.depth >= 10) {
        return res.status(400).json({
          success: false,
          error: { message: "Maximum thread depth (10) reached" },
        });
      }

      // Append parent's own ID to parent's path to build child's path
      path = `${parent.path}/${parentId}`;
      depth = parent.depth + 1;
    }

    const comment = await Comment.create({
      postId,
      authorId,
      parentId: parentId || null,
      path,
      depth,
      body,
    });

    // Increment post's comment count
    const updatedPost = await Post.findByIdAndUpdate(
      postId,
      { $inc: { commentCount: 1 } },
      { new: true }
    );

    const populated = await comment.populate("authorId", "username profilePic orbitId");

    // Broadcast new comment to thread room AND comment count update to global feed
    try {
      const { getIO } = await import("../socket/socket.js");
      const io = getIO();
      if (io) {
        io.to(`thread:${postId}`).emit("feed:new_comment", {
          postId,
          comment: { ...populated.toObject(), userVote: 0 },
        });
        io.to("feed:global").emit("feed:comment_count_update", {
          postId,
          commentCount: updatedPost?.commentCount || (post.commentCount || 0) + 1,
        });
      }
    } catch (_) {}

    return res.status(201).json({
      success: true,
      data: { ...populated.toObject(), userVote: 0 },
    });
  } catch (err) {
    console.error("[FeedController] createComment error:", err);
    return res.status(500).json({ success: false, error: { message: "Failed to create comment" } });
  }
};

/**
 * POST /api/feed/comments/:commentId/vote
 * Cast or toggle a vote on a comment.
 */
export const voteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user._id.toString();

    const parseResult = voteSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: { message: "intent must be '1' or '-1'" },
      });
    }

    const { intent } = parseResult.data;

    // Fetch comment to get postId for socket thread room targeting
    const commentDoc = await Comment.findById(commentId).select("postId").lean();
    if (!commentDoc) {
      return res.status(404).json({ success: false, error: { message: "Comment not found" } });
    }
    const postId = commentDoc.postId?.toString();

    const result = await castVote({
      userId,
      targetType: "comment",
      targetId: commentId,
      intent,
      postId,
    });

    return res.json({ success: true, data: result });
  } catch (err) {
    console.error("[FeedController] voteComment error:", err);
    if (err.message === "Comment not found") {
      return res.status(404).json({ success: false, error: { message: "Comment not found" } });
    }
    return res.status(500).json({ success: false, error: { message: "Vote failed" } });
  }
};

/**
 * DELETE /api/feed/comments/:commentId
 * Soft-delete a comment. The node remains in the tree with body = "[deleted]".
 */
export const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user._id.toString();

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ success: false, error: { message: "Comment not found" } });
    }
    if (comment.authorId.toString() !== userId) {
      return res.status(403).json({ success: false, error: { message: "Not authorized" } });
    }

    comment.isDeleted = true;
    comment.deletedAt = new Date();
    await comment.save();

    return res.json({ success: true, data: { message: "Comment deleted" } });
  } catch (err) {
    console.error("[FeedController] deleteComment error:", err);
    return res.status(500).json({ success: false, error: { message: "Failed to delete comment" } });
  }
};
