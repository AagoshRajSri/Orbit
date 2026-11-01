import mongoose from "mongoose";

/**
 * Vote Model — Persistent Ledger for Post and Comment Votes
 *
 * Guarantees mathematical precision for voting when Redis cache is cold,
 * flushing, or when operating in environments without external Redis.
 *
 * Enforces a strict unique compound index on (userId, targetType, targetId)
 * ensuring a user can never cast duplicate votes or inflate vote counts indefinitely.
 */
const voteSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    targetType: {
      type: String,
      enum: ["post", "comment"],
      required: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    vote: {
      type: Number,
      enum: [1, -1],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index: One vote per user per target
voteSchema.index({ userId: 1, targetType: 1, targetId: 1 }, { unique: true });
voteSchema.index({ targetId: 1, targetType: 1 });

const Vote = mongoose.models.Vote || mongoose.model("Vote", voteSchema);
export default Vote;
