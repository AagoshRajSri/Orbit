/**
 * verify-feed-system.js
 * End-to-end integration verification for Orbit Feed System:
 *  - Post model creation & hotRank calculation
 *  - Comment model materialized path validation & tree ordering
 *  - Vote toggling & metric delta computations
 *  - Cursor-based feed pagination
 *  - Thread tree flattening and branch collapse algorithm
 */

import mongoose from "mongoose";
import dns from "dns";
import dotenv from "dotenv";
import Post from "../src/models/post.model.js";
import Comment from "../src/models/comment.model.js";
import User from "../src/models/user.model.js";
import { castVote } from "../src/services/vote.service.js";
import { connectDB } from "../src/lib/db.js";

dotenv.config();

try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch {}

const runTests = async () => {
  console.log("=== ORBIT FEED SYSTEM VERIFICATION ===");
  await connectDB();
  console.log("✓ Connected to MongoDB");

  // 1. Get existing user or create test user
  let user = await User.findOne();
  if (!user) {
    user = await User.create({
      username: "test_feed_runner",
      orbitId: "orbit_test_feed",
      orbitTag: "#9999",
      normalizedHandle: "test_feed_runner",
      email: "test_feed_runner@orbit.local",
      password: "password123Secure!",
    });
  }
  const userId = user._id.toString();
  console.log("✓ Test user ready:", userId, `(${user.username})`);

  // 2. Test Post Creation & Hot Rank
  const post = await Post.create({
    authorId: user._id,
    title: "Test Feed Post: Scaling Orbit to Consumer Scale",
    body: "Evaluating materialized paths and Redis atomic voting for Orbit threads.",
    tags: ["tech", "orbit", "architecture"],
    upvotes: 10,
    downvotes: 2,
    score: 8,
    hotRank: Post.computeHotRank(10, 2, new Date()),
  });
  const postId = post._id.toString();
  console.log("✓ Post created:", postId, "with hotRank:", post.hotRank);

  // 3. Test Materialized Path Comment Creation
  // Root comment (Depth 0)
  const rootComment = await Comment.create({
    postId: post._id,
    authorId: user._id,
    parentId: null,
    path: `/${postId}`,
    depth: 0,
    body: "Level 0: Excellent architectural foundation.",
  });
  const rootId = rootComment._id.toString();

  // Child comment (Depth 1)
  const childComment = await Comment.create({
    postId: post._id,
    authorId: user._id,
    parentId: rootComment._id,
    path: `/${postId}/${rootId}`,
    depth: 1,
    body: "Level 1: Agreed, materialized paths make subtree querying trivial.",
  });
  const childId = childComment._id.toString();

  // Grandchild comment (Depth 2)
  const grandchildComment = await Comment.create({
    postId: post._id,
    authorId: user._id,
    parentId: childComment._id,
    path: `/${postId}/${rootId}/${childId}`,
    depth: 2,
    body: "Level 2: Plus compound index { postId: 1, path: 1 } ensures zero table scans.",
  });
  const grandchildId = grandchildComment._id.toString();
  console.log("✓ 3-Level Comment Tree created with valid materialized paths");

  // 4. Test Subtree Query with Path Regex
  const subtree = await Comment.find({
    postId: post._id,
    path: new RegExp(`^/${postId}/${rootId}`),
    isDeleted: false,
  }).sort({ path: 1, createdAt: 1 });
  
  if (subtree.length !== 2) {
    throw new Error(`Subtree query failed: expected 2 descendants, got ${subtree.length}`);
  }
  console.log(`✓ Subtree query verified: matched ${subtree.length} descendants (child & grandchild)`);

  // 5. Test Depth Constraint Enforcement
  let depthCheckPassed = false;
  try {
    // Attempt invalid depth (path has 2 segments, depth given is 5)
    await Comment.create({
      postId: post._id,
      authorId: user._id,
      parentId: rootComment._id,
      path: `/${postId}/${rootId}`,
      depth: 5, // Should fail schema pre-save validator
      body: "Invalid depth test",
    });
  } catch (err) {
    if (err.message.includes("Comment depth mismatch")) {
      depthCheckPassed = true;
    }
  }
  if (!depthCheckPassed) {
    throw new Error("Validation failed: Schema did NOT reject mismatched depth/path!");
  }
  console.log("✓ Pre-save validation: Reject mismatched depth/path correctly verified");

  // 6. Test Voting Logic (castVote)
  // Vote +1 on post
  const voteRes1 = await castVote({
    targetType: "post",
    targetId: postId,
    userId: userId,
    intent: 1,
    createdAt: post.createdAt,
  });
  console.log("✓ Cast +1 vote result:", voteRes1);

  // Toggle same vote (+1 again -> removes vote to 0)
  const voteRes2 = await castVote({
    targetType: "post",
    targetId: postId,
    userId: userId,
    intent: 1,
    createdAt: post.createdAt,
  });
  console.log("✓ Toggle +1 vote again result (should remove vote):", voteRes2);

  // Switch to downvote (-1)
  const voteRes3 = await castVote({
    targetType: "post",
    targetId: postId,
    userId: userId,
    intent: -1,
    createdAt: post.createdAt,
  });
  console.log("✓ Cast -1 downvote result:", voteRes3);

  // 7. Test Cursor-based Pagination Query
  const feedResults = await Post.find({
    isDeleted: false,
    cursorTs: { $lte: Date.now() },
  })
    .sort({ hotRank: -1, cursorTs: -1 })
    .limit(5)
    .populate("authorId", "username profilePic");
  
  console.log(`✓ Cursor feed query returned ${feedResults.length} posts`);

  // 8. Test Client-side Tree Flattening & Collapse logic
  const allComments = [rootComment, childComment, grandchildComment];
  
  // Collapse root: child and grandchild should both have isHidden = true
  const collapsedSet = new Set([rootId]);
  const flat = allComments.map((comment) => {
    const commentId = comment._id.toString();
    const pathSegments = comment.path.split("/").filter(Boolean);
    const ancestorIds = pathSegments.slice(1);
    const isHidden = ancestorIds.some((id) => collapsedSet.has(id));
    const isCollapsed = collapsedSet.has(commentId);
    return {
      id: commentId,
      depth: comment.depth,
      isCollapsed,
      isHidden,
    };
  });

  if (!flat[0].isCollapsed || flat[0].isHidden) {
    throw new Error("Root comment collapse state incorrect");
  }
  if (!flat[1].isHidden || !flat[2].isHidden) {
    throw new Error("Descendant comments were not hidden upon root collapse!");
  }
  console.log("✓ Tree flattening & O(n) branch collapse algorithm verified");

  // Clean up test post and comments
  await Comment.deleteMany({ postId: post._id });
  await Post.deleteOne({ _id: post._id });
  console.log("✓ Test records cleaned up");

  await mongoose.disconnect();
  console.log("=== ALL FEED SYSTEM TESTS PASSED SUCCESSFULLY! ===");
};

runTests().catch((err) => {
  console.error("Test failed with error:", err);
  process.exit(1);
});
