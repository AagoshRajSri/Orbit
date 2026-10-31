/**
 * Feed Routes — Orbit Feed System
 *
 * All routes require authentication (protectRoute middleware).
 * Rate limits are intentionally asymmetric:
 *  - Reads are lenient (60/min) — feeds are cached so reads are cheap
 *  - Writes are strict (10/min for posts, 30/min for comments)
 *  - Votes are strictly throttled (20/min) — prevents vote farming automation
 */

import express from "express";
import rateLimit from "express-rate-limit";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  getFeed,
  createPost,
  getPost,
  deletePost,
  votePost,
  getComments,
  createComment,
  voteComment,
  deleteComment,
} from "../controllers/feed.controller.js";

const router = express.Router();

const isDev = process.env.NODE_ENV === "development" || !process.env.NODE_ENV;
const devMax = 10000;

// ── Rate Limiters ─────────────────────────────────────────────────────────────

const feedReadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: isDev ? devMax : 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: "RATE_LIMIT", message: "Too many feed reads. Please slow down." } },
  handler: (req, res, next, options) =>
    res.status(429).json({ message: options.message?.error?.message }),
});

const postWriteLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: isDev ? devMax : 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: "RATE_LIMIT", message: "Posting too fast. Please slow down." } },
  handler: (req, res, next, options) =>
    res.status(429).json({ message: options.message?.error?.message }),
});

const commentWriteLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: isDev ? devMax : 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: "RATE_LIMIT", message: "Commenting too fast. Please slow down." } },
  handler: (req, res, next, options) =>
    res.status(429).json({ message: options.message?.error?.message }),
});

const voteLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: isDev ? devMax : 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: "RATE_LIMIT", message: "Voting too fast. Please slow down." } },
  handler: (req, res, next, options) =>
    res.status(429).json({ message: options.message?.error?.message }),
});

// ── Apply Auth ────────────────────────────────────────────────────────────────
router.use(protectRoute);

// ── Feed Endpoints ────────────────────────────────────────────────────────────
// GET  /api/feed               — Paginated feed (trending|recent|top)
router.get("/", feedReadLimiter, getFeed);

// ── Post Endpoints ────────────────────────────────────────────────────────────
// POST   /api/feed/posts                — Create a new post
router.post("/posts", postWriteLimiter, createPost);
// GET    /api/feed/posts/:postId        — Get single post
router.get("/posts/:postId", feedReadLimiter, getPost);
// DELETE /api/feed/posts/:postId        — Soft-delete a post (author only)
router.delete("/posts/:postId", postWriteLimiter, deletePost);
// POST   /api/feed/posts/:postId/vote   — Vote on a post
router.post("/posts/:postId/vote", voteLimiter, votePost);

// ── Comment Endpoints ─────────────────────────────────────────────────────────
// GET    /api/feed/posts/:postId/comments         — Get all comments for a post
router.get("/posts/:postId/comments", feedReadLimiter, getComments);
// POST   /api/feed/posts/:postId/comments         — Create a comment or reply
router.post("/posts/:postId/comments", commentWriteLimiter, createComment);
// POST   /api/feed/comments/:commentId/vote       — Vote on a comment
router.post("/comments/:commentId/vote", voteLimiter, voteComment);
// DELETE /api/feed/comments/:commentId            — Soft-delete a comment
router.delete("/comments/:commentId", commentWriteLimiter, deleteComment);

export default router;
