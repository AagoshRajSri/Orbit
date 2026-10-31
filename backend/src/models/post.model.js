import mongoose from "mongoose";

/**
 * Post Model — Orbit Feed System
 *
 * A Post is the root node of a thread tree. It can be scoped either globally
 * (visible in the public feed) or privately within a Nexus group. Posts have
 * a denormalized `score`, `upvotes`, and `downvotes` counter which are the
 * ground-truth values flushed from Redis. All vote tallies in-flight live in
 * Redis Hashes and are periodically persisted here by the vote worker.
 *
 * Feed ranking keys:
 *   feed:trending  — Redis ZSET scored by Wilson-score-like hot rank
 *   feed:recent    — Redis ZSET scored by createdAt epoch ms
 *   feed:top       — Redis ZSET scored by raw upvote count
 */
const postSchema = new mongoose.Schema(
  {
    // ── Identity ─────────────────────────────────────────────────────────────
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // ── Content ──────────────────────────────────────────────────────────────
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 300,
    },
    body: {
      type: String,
      maxlength: 40000, // ~10k words
      default: "",
    },
    imageUrl: {
      type: String,
      default: null,
    },
    linkUrl: {
      type: String,
      default: null,
    },

    // ── Scoping ───────────────────────────────────────────────────────────────
    // If nexusId is null, the post is in the global/public feed.
    nexusId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Nexus",
      default: null,
      index: true,
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
      default: 0, // upvotes - downvotes
      index: true,
    },

    // ── Comment Counters (denormalized for feed listing performance) ─────────
    commentCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ── Hot Rank Cache (updated by vote worker) ───────────────────────────────
    // Logarithmic hot rank: log10(max(|score|,1)) * sign + epoch_offset
    // Enables MongoDB-side feed sorting as fallback when Redis ZSETs miss.
    hotRank: {
      type: Number,
      default: 0,
      index: true,
    },

    // ── Moderation ────────────────────────────────────────────────────────────
    isDeleted: {
      type: Boolean,
      default: false,
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    isLocked: {
      type: Boolean,
      default: false,
      // When true, new comments are forbidden
    },

    // ── Tagging ───────────────────────────────────────────────────────────────
    tags: {
      type: [String],
      default: [],
      validate: {
        validator: (tags) => tags.length <= 5,
        message: "A post may not have more than 5 tags",
      },
    },

    // ── Pagination Cursor ─────────────────────────────────────────────────────
    // Opaque cursor value for feed cursor-based pagination. Set at creation to
    // allow stable page splits even when score changes over time.
    cursorTs: {
      type: Number,
      default: () => Date.now(),
      index: true,
    },
  },
  { timestamps: true }
);

// ── Compound Indexes ──────────────────────────────────────────────────────────

// Primary feed query: global feed sorted by hot rank, filtering deleted posts
postSchema.index({ isDeleted: 1, hotRank: -1, cursorTs: -1 });

// Nexus-scoped feed
postSchema.index({ nexusId: 1, isDeleted: 1, hotRank: -1 });

// Chronological feed
postSchema.index({ isDeleted: 1, createdAt: -1 });

// Author's posts
postSchema.index({ authorId: 1, isDeleted: 1, createdAt: -1 });

// Tag search
postSchema.index({ tags: 1, isDeleted: 1 });

// ── Virtual ───────────────────────────────────────────────────────────────────
postSchema.virtual("voteRatio").get(function () {
  const total = this.upvotes + this.downvotes;
  return total === 0 ? 0 : this.upvotes / total;
});

// ── Static Helper: Compute Hot Rank ──────────────────────────────────────────
// Wilson lower-bound approximation adapted for Reddit-style ranking.
// See: https://www.evanmiller.org/how-not-to-sort-by-average-rating.html
postSchema.statics.computeHotRank = function (upvotes, downvotes, createdAt) {
  const score = upvotes - downvotes;
  const order = Math.log10(Math.max(Math.abs(score), 1));
  const sign = score > 0 ? 1 : score < 0 ? -1 : 0;
  // epoch_seconds since a base date (Jan 1, 2024) to keep numbers small
  const epochSeconds = (new Date(createdAt || Date.now()).getTime() - 1704067200000) / 1000;
  return sign * order + epochSeconds / 45000;
};

const Post = mongoose.model("Post", postSchema);
export default Post;
