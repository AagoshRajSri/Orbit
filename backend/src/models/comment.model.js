import mongoose from "mongoose";

/**
 * Comment Model — Materialized Path Strategy
 *
 * Each comment stores a `path` string that encodes its full ancestry chain.
 * Format: "/rootPostId/parentCommentId/thisCommentId"
 *
 * This allows:
 * - Subtree fetch via regex prefix: { path: /^\/rootPostId\/parentCommentId/ }
 * - Direct children: { postId, depth: parentDepth + 1 }
 * - Instant branch deletion: deleteMany({ path: { $regex: `/${commentId}/` } })
 *
 * No recursive CTE or $graphLookup required at any depth. Compound index on
 * (postId, path) keeps all queries O(log n) or O(k) where k = result count.
 *
 * Votes on comments follow the same Redis pattern as posts using the Redis key:
 *   vote:comment:{commentId}:users  → Hash of userId → 1|-1
 *   comment:{commentId}:stats       → Hash of upvotes, downvotes, score
 */
const commentSchema = new mongoose.Schema(
  {
    // ── Identity ─────────────────────────────────────────────────────────────
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true,
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // ── Materialized Path Hierarchy ──────────────────────────────────────────
    /**
     * Parent comment ID. Null for top-level comments (depth 0).
     * This is the immediate parent — used for display grouping.
     */
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
      index: true,
    },

    /**
     * Full materialized ancestry path.
     * Example (depth 0): "/postId"
     * Example (depth 1): "/postId/parentCommentId"
     * Example (depth 2): "/postId/grandparentId/parentCommentId"
     *
     * Stored WITHOUT the trailing own-ID so prefix matching on parent's path
     * correctly finds all descendants. The comment's own _id is appended when
     * querying children.
     */
    path: {
      type: String,
      required: true,
      // Max depth guardrail: 7 path segments × 25 chars avg = ~175 bytes
    },

    /**
     * Zero-indexed nesting depth.
     * Depth 0 = direct reply to post.
     * Stored to enable simple depth-gated rendering limits on client.
     */
    depth: {
      type: Number,
      required: true,
      min: 0,
      max: 10, // Hard cap — comment chains > 10 deep fold into a "continue thread" link
    },

    // ── Content ──────────────────────────────────────────────────────────────
    body: {
      type: String,
      required: true,
      maxlength: 10000,
      trim: true,
    },

    // ── Vote Counters (ground-truth after Redis flush) ───────────────────────
    upvotes: {
      type: Number,
      default: 0,
      min: 0,
    },
    downvotes: {
      type: Number,
      default: 0,
      min: 0,
    },
    score: {
      type: Number,
      default: 0,
    },

    // ── Moderation ────────────────────────────────────────────────────────────
    isDeleted: {
      type: Boolean,
      default: false,
    },
    // When deleted, keep the node in the tree (shows "[deleted]") so that child
    // comments remain traversable. True deletion is cascade via path prefix wipe.
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// ── Compound Indexes (the core performance guarantee) ─────────────────────────

/**
 * PRIMARY: Fetch all comments for a post, ordered by path for tree reconstruction.
 * Query: { postId, isDeleted: false }  sort: { path: 1, createdAt: 1 }
 */
commentSchema.index({ postId: 1, path: 1 });

/**
 * SUBTREE: Fetch all descendants of a specific comment.
 * Query: { postId, path: /^\/postId\/commentId/ }
 */
commentSchema.index({ postId: 1, path: 1, depth: 1 });

/**
 * TOP-LEVEL: Fetch only depth-0 comments sorted by score for collapsed view.
 * Query: { postId, depth: 0, isDeleted: false }  sort: { score: -1 }
 */
commentSchema.index({ postId: 1, depth: 1, score: -1 });

/**
 * CHRONOLOGICAL: For "new" sort on a given post.
 * Query: { postId, isDeleted: false } sort: { createdAt: -1 }
 */
commentSchema.index({ postId: 1, isDeleted: 1, createdAt: -1 });

/**
 * AUTHOR: Show a user's comment history.
 */
commentSchema.index({ authorId: 1, createdAt: -1 });

// ── Pre-save: Validate path depth matches depth field ─────────────────────────
commentSchema.pre("save", function (next) {
  const pathSegments = this.path.split("/").filter(Boolean).length;
  // path "/postId" has 1 segment → depth 0
  // path "/postId/parentId" has 2 segments → depth 1
  const expectedDepth = pathSegments - 1;
  if (this.depth !== expectedDepth) {
    return next(
      new Error(
        `Comment depth mismatch: path implies depth ${expectedDepth}, got ${this.depth}`
      )
    );
  }
  next();
});

const Comment = mongoose.model("Comment", commentSchema);
export default Comment;
