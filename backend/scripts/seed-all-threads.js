/**
 * seed-all-threads.js — Orbit Universal Thread Comment Seeder
 *
 * Populates all posts in the feed (especially benchmark & discussion nodes)
 * with rich, realistic nested comment trees (depths 0 through 3).
 *
 * Demonstrates:
 *  - Materialized Path hierarchy (O(N) single-query tree reconstruction)
 *  - Fast index scans on { postId: 1, path: 1 }
 *  - Rich nested branching with real user authors
 *  - Updated post.commentCount matching real document count
 *
 * Usage:
 *   node backend/scripts/seed-all-threads.js
 */

import mongoose from "mongoose";
import dns from "dns";
import dotenv from "dotenv";
import { connectDB } from "../src/lib/db.js";
import User from "../src/models/user.model.js";
import Post from "../src/models/post.model.js";
import Comment from "../src/models/comment.model.js";

dotenv.config();

try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch {}

const TECHNICAL_COMMENTS = [
  "Validated 1:1 IXSCAN ratio using the compound index { postId: 1, path: 1 }. Zero collection scan overhead.",
  "The materialized path approach completely eliminates recursive CTEs. Subtrees are resolved via prefix match in < 2ms.",
  "Checked the network tab: comment tree loads in a single HTTP round-trip without any N+1 query waterfall.",
  "Virtual windowing on the client renders 50k nodes with a flat 1D projection array. Silky smooth 60fps scrolling.",
  "Atomic voting via Redis Lua script handles concurrent votes without write-skew or race conditions.",
  "Branch collapse/expand uses an O(N) ancestor prefix check. No recursive re-renders needed.",
  "Notice how fast lookups are when opening this thread? That's the power of single index scanning.",
  "Verified zero console errors on guest access. Auth fallback works seamlessly.",
  "Tested upvote toggling under rapid clicks: in-flight request locking prevents duplicate increments.",
  "The DataLoader batching coalesces 50,000 author lookups into a single $in query.",
  "WebSocket fan-out latency is sitting at 0.2ms median across 1,000 active client connections.",
  "Argon2id password hashing parameters are tuned to prevent event-loop starvation while preserving high entropy.",
  "Materialized path depth cap of 10 protects against unbounded DOM recursion attacks.",
  "Client-side optimistic updates reflect immediately with zero perceptible input lag.",
  "Database memory buffer stays well within limits now that sorting leverages the index directly."
];

async function seedAllThreads() {
  console.log("============================================================");
  console.log("🌱 SEEDING NESTED COMMENTS ACROSS ALL FEED THREADS");
  console.log("============================================================");

  await connectDB();
  console.log("✓ Connected to MongoDB Atlas");

  // Fetch a pool of users to author the comments
  const users = await User.find({}).limit(200).select("_id username");
  if (users.length === 0) {
    console.error("❌ No users found in database to author comments!");
    process.exit(1);
  }
  console.log(`✓ Loaded ${users.length} user personas for comment authorship.`);

  // Find all posts
  const posts = await Post.find({}).sort({ createdAt: -1 });
  console.log(`✓ Found ${posts.length} total posts in the database.`);

  let totalCommentsAdded = 0;
  let postsUpdated = 0;

  for (const post of posts) {
    const postIdStr = post._id.toString();

    // Check if post already has comments
    const existingCount = await Comment.countDocuments({ postId: post._id });
    if (existingCount > 0) {
      // Sync post.commentCount if out of sync
      if (post.commentCount !== existingCount) {
        await Post.updateOne({ _id: post._id }, { $set: { commentCount: existingCount } });
      }
      continue;
    }

    // Generate 12 - 20 nested comments for this thread across depths 0 - 3
    const commentsToInsert = [];
    const depth0Nodes = [];
    const depth1Nodes = [];
    const depth2Nodes = [];

    // Depth 0: 3 to 5 top-level comments
    const numDepth0 = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < numDepth0; i++) {
      const commentId = new mongoose.Types.ObjectId();
      const author = users[Math.floor(Math.random() * users.length)];
      const upvotes = Math.floor(Math.random() * 45);
      const downvotes = Math.floor(Math.random() * 4);
      const body = TECHNICAL_COMMENTS[Math.floor(Math.random() * TECHNICAL_COMMENTS.length)];

      const doc = {
        _id: commentId,
        postId: post._id,
        authorId: author._id,
        parentId: null,
        path: `/${postIdStr}`,
        depth: 0,
        body,
        upvotes,
        downvotes,
        score: upvotes - downvotes,
        isDeleted: false,
        createdAt: new Date(post.createdAt.getTime() + (i + 1) * 45000),
      };
      commentsToInsert.push(doc);
      depth0Nodes.push(doc);
    }

    // Depth 1: 3 to 6 replies to depth 0 comments
    const numDepth1 = 3 + Math.floor(Math.random() * 4);
    for (let i = 0; i < numDepth1 && depth0Nodes.length > 0; i++) {
      const parent = depth0Nodes[i % depth0Nodes.length];
      const commentId = new mongoose.Types.ObjectId();
      const author = users[Math.floor(Math.random() * users.length)];
      const upvotes = Math.floor(Math.random() * 25);
      const downvotes = Math.floor(Math.random() * 2);
      const body = `Agree with @${users.find(u => u._id.equals(parent.authorId))?.username || "dev"}: ` +
        TECHNICAL_COMMENTS[Math.floor(Math.random() * TECHNICAL_COMMENTS.length)];

      const doc = {
        _id: commentId,
        postId: post._id,
        authorId: author._id,
        parentId: parent._id,
        path: `${parent.path}/${parent._id.toString()}`,
        depth: 1,
        body,
        upvotes,
        downvotes,
        score: upvotes - downvotes,
        isDeleted: false,
        createdAt: new Date(parent.createdAt.getTime() + (i + 1) * 30000),
      };
      commentsToInsert.push(doc);
      depth1Nodes.push(doc);
    }

    // Depth 2: 2 to 4 replies to depth 1 comments
    const numDepth2 = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < numDepth2 && depth1Nodes.length > 0; i++) {
      const parent = depth1Nodes[i % depth1Nodes.length];
      const commentId = new mongoose.Types.ObjectId();
      const author = users[Math.floor(Math.random() * users.length)];
      const upvotes = Math.floor(Math.random() * 15);
      const downvotes = Math.floor(Math.random() * 2);
      const body = `Deep nesting test (depth 2): ` +
        TECHNICAL_COMMENTS[Math.floor(Math.random() * TECHNICAL_COMMENTS.length)];

      const doc = {
        _id: commentId,
        postId: post._id,
        authorId: author._id,
        parentId: parent._id,
        path: `${parent.path}/${parent._id.toString()}`,
        depth: 2,
        body,
        upvotes,
        downvotes,
        score: upvotes - downvotes,
        isDeleted: false,
        createdAt: new Date(parent.createdAt.getTime() + (i + 1) * 20000),
      };
      commentsToInsert.push(doc);
      depth2Nodes.push(doc);
    }

    // Depth 3: 1 to 3 replies to depth 2 comments
    const numDepth3 = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < numDepth3 && depth2Nodes.length > 0; i++) {
      const parent = depth2Nodes[i % depth2Nodes.length];
      const commentId = new mongoose.Types.ObjectId();
      const author = users[Math.floor(Math.random() * users.length)];
      const upvotes = Math.floor(Math.random() * 8);
      const downvotes = 0;
      const body = `Leaf reply (depth 3): Subtree branch collapsed smoothly without breaking root layout.`;

      const doc = {
        _id: commentId,
        postId: post._id,
        authorId: author._id,
        parentId: parent._id,
        path: `${parent.path}/${parent._id.toString()}`,
        depth: 3,
        body,
        upvotes,
        downvotes,
        score: upvotes - downvotes,
        isDeleted: false,
        createdAt: new Date(parent.createdAt.getTime() + (i + 1) * 15000),
      };
      commentsToInsert.push(doc);
    }

    if (commentsToInsert.length > 0) {
      await Comment.insertMany(commentsToInsert, { ordered: false });
      await Post.updateOne(
        { _id: post._id },
        { $set: { commentCount: commentsToInsert.length } }
      );
      totalCommentsAdded += commentsToInsert.length;
      postsUpdated++;
    }
  }

  console.log(`\n============================================================`);
  console.log(`🎉 SUCCESS! Seeded ${totalCommentsAdded} nested comments across ${postsUpdated} posts.`);
  console.log(`============================================================`);
  process.exit(0);
}

seedAllThreads().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
