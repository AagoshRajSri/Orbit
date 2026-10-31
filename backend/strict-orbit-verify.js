/**
 * strict-orbit-verify.js
 *
 * Strict End-to-End Integration Test for Orbit Feed & Voting Architecture
 *
 * Requirements:
 *  1. No mocks - uses actual MongoDB and actual Redis instances from .env
 *  2. Test 1: Materialized Path Assertion (4-level chain, raw prefix regex query -> exactly 3 descendants)
 *  3. Test 2: Lua Race Condition Stress Test (50 concurrent votes -> score: 0, upvotes: 25, downvotes: 25, ledger: 50)
 *  4. Test 3: Pagination Index (Cursor) Test (15 posts, cursor < 80, limit 5 -> totalDocsExamined === 5)
 *  5. Test 4: Frontend O(N) Tree Flattening Test (raw comments -> flat array length 4, Comment C depth 3)
 *  6. Full teardown: cleans up DB & Redis records, closes connections cleanly.
 */

import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import { connectDB } from "./src/lib/db.js";
import { redisClient, pubClient, subClient, connectRedis, isRedisAvailable } from "./src/lib/redis.js";
import Post from "./src/models/post.model.js";
import Comment from "./src/models/comment.model.js";
import User from "./src/models/user.model.js";
import { castVote, loadVoteScripts, keys, warmPostCache } from "./src/services/vote.service.js";

// Exact frontend tree-flattening algorithm from frontend/src/store/useThreadStore.js
const flattenCommentTree = (comments, collapsedSet = new Set()) => {
  return comments.map((comment) => {
    const raw = comment.toObject ? comment.toObject() : comment;
    const commentId = raw._id?.toString() || raw._id;
    const pathSegments = raw.path ? raw.path.split("/").filter(Boolean) : [];
    const ancestorIds = pathSegments.slice(1);
    const isHidden = ancestorIds.some((id) => collapsedSet.has(id));
    const isCollapsed = collapsedSet.has(commentId);
    return {
      ...raw,
      depth: raw.depth ?? (pathSegments.length - 1),
      isCollapsed,
      isHidden,
    };
  });
};

async function runStrictVerification() {
  console.log("================================================================================");
  console.log("         ORBIT STRICT END-TO-END PHYSICAL INTEGRATION VERIFICATION");
  console.log("================================================================================\n");

  // Track created IDs for graceful teardown
  const createdPostIds = [];
  const createdCommentIds = [];
  const redisKeysToClean = [];

  try {
    // ── Connect to Real Database & Real Redis ────────────────────────────────────
    console.log("[Setup] Connecting to MongoDB...");
    await connectDB();
    console.log("[Setup] Connected to MongoDB host:", mongoose.connection.host);

    console.log("[Setup] Connecting to Redis...");
    await connectRedis();
    if (!isRedisAvailable) {
      throw new Error("FATAL: Redis connection failed. isRedisAvailable is false!");
    }
    const redisPing = await redisClient.ping();
    console.log("[Setup] Connected to Redis. PING response:", redisPing);

    // Load Redis Lua scripts
    await loadVoteScripts();
    console.log("[Setup] Lua scripts pre-loaded.\n");

    // Ensure we have a valid author User for DB constraints
    let author = await User.findOne();
    if (!author) {
      author = await User.create({
        username: "orbit_tester",
        orbitId: "orbit_test_user",
        orbitTag: "#0001",
        normalizedHandle: "orbit_tester",
        email: "tester@orbit.local",
        password: "Password123Secure!",
      });
    }
    const authorId = author._id;

    // ─────────────────────────────────────────────────────────────────────────
    // TEST 1: THE MATERIALIZED PATH ASSERTION
    // ─────────────────────────────────────────────────────────────────────────
    console.log("--------------------------------------------------------------------------------");
    console.log("TEST 1: THE MATERIALIZED PATH ASSERTION");
    console.log("--------------------------------------------------------------------------------");

    // 1. Create a dummy post
    const dummyPost = await Post.create({
      authorId,
      title: "Materialized Path Stress Test Post",
      body: "Testing multi-level materialized path querying in MongoDB.",
      hotRank: 100,
    });
    createdPostIds.push(dummyPost._id);
    const postIdStr = dummyPost._id.toString();

    // 2. Insert 4-level deep comment chain: Root -> A -> B -> C
    // Root (Depth 0)
    const rootComment = await Comment.create({
      postId: dummyPost._id,
      authorId,
      parentId: null,
      path: `/${postIdStr}`,
      depth: 0,
      body: "Root comment (Depth 0)",
    });
    createdCommentIds.push(rootComment._id);
    const rootIdStr = rootComment._id.toString();

    // Comment A (Depth 1)
    const commentA = await Comment.create({
      postId: dummyPost._id,
      authorId,
      parentId: rootComment._id,
      path: `/${postIdStr}/${rootIdStr}`,
      depth: 1,
      body: "Comment A (Depth 1)",
    });
    createdCommentIds.push(commentA._id);
    const commentAIdStr = commentA._id.toString();

    // Comment B (Depth 2)
    const commentB = await Comment.create({
      postId: dummyPost._id,
      authorId,
      parentId: commentA._id,
      path: `/${postIdStr}/${rootIdStr}/${commentAIdStr}`,
      depth: 2,
      body: "Comment B (Depth 2)",
    });
    createdCommentIds.push(commentB._id);
    const commentBIdStr = commentB._id.toString();

    // Comment C (Depth 3)
    const commentC = await Comment.create({
      postId: dummyPost._id,
      authorId,
      parentId: commentB._id,
      path: `/${postIdStr}/${rootIdStr}/${commentAIdStr}/${commentBIdStr}`,
      depth: 3,
      body: "Comment C (Depth 3)",
    });
    createdCommentIds.push(commentC._id);

    console.log("Created 4-level comment chain:");
    console.log(`  Root: id=${rootComment._id} path="${rootComment.path}" depth=${rootComment.depth}`);
    console.log(`  A:    id=${commentA._id} path="${commentA.path}" depth=${commentA.depth}`);
    console.log(`  B:    id=${commentB._id} path="${commentB.path}" depth=${commentB.depth}`);
    console.log(`  C:    id=${commentC._id} path="${commentC.path}" depth=${commentC.depth}`);

    // 3. Execute raw MongoDB query finding all descendants of Root using regex prefix
    const pathPrefixRegex = new RegExp(`^/${postIdStr}/${rootIdStr}`);
    const mongoQuery = {
      postId: dummyPost._id,
      path: pathPrefixRegex,
    };

    console.log("\nExecuting Raw MongoDB Query:");
    console.log(`  Query Filter: { postId: ObjectId("${postIdStr}"), path: /^\\/${postIdStr}\\/${rootIdStr}/ }`);

    const rawDescendants = await Comment.find(mongoQuery).sort({ path: 1, createdAt: 1 });
    console.log(`  Returned Count: ${rawDescendants.length}`);
    console.log(`  Returned Comments: ${rawDescendants.map(c => `[id=${c._id}, depth=${c.depth}, body="${c.body}"]`).join(", ")}`);

    // ASSERTION
    if (rawDescendants.length !== 3) {
      throw new Error(`ASSERTION FAILED in Test 1: Expected exactly 3 descendants, got ${rawDescendants.length}`);
    }
    console.log(">> ASSERTION PASSED: Exact descendant count is 3 (Comments A, B, and C).\n");

    // ─────────────────────────────────────────────────────────────────────────
    // TEST 2: THE LUA RACE CONDITION STRESS TEST
    // ─────────────────────────────────────────────────────────────────────────
    console.log("--------------------------------------------------------------------------------");
    console.log("TEST 2: THE LUA RACE CONDITION STRESS TEST");
    console.log("--------------------------------------------------------------------------------");

    // Create a dedicated post for voting
    const votePost = await Post.create({
      authorId,
      title: "Concurrent Lua Vote Stress Test Post",
      body: "Post for testing atomic vote toggling under 50 concurrent requests.",
      upvotes: 0,
      downvotes: 0,
      score: 0,
      hotRank: 0,
    });
    createdPostIds.push(votePost._id);
    const votePostIdStr = votePost._id.toString();

    // Prepare Redis keys
    const statsKey = keys.stats("post", votePostIdStr);
    const ledgerKey = keys.userLedger("post", votePostIdStr);
    redisKeysToClean.push(statsKey, ledgerKey, keys.feedDirty);

    // Warm cache in Redis
    await warmPostCache(votePostIdStr, votePost);

    // Create 50 distinct dummy user IDs
    const dummyUserIds = Array.from({ length: 50 }, () => new mongoose.Types.ObjectId().toString());
    console.log(`Generated ${dummyUserIds.length} unique user IDs.`);
    console.log("Firing 50 concurrent vote requests via Promise.all(): (25 UPVOTES [+1], 25 DOWNVOTES [-1])...");

    const votePromises = dummyUserIds.map((userId, index) => {
      const intent = index < 25 ? 1 : -1;
      return castVote({
        userId,
        targetType: "post",
        targetId: votePostIdStr,
        intent,
      });
    });

    const voteResults = await Promise.all(votePromises);
    console.log(`All ${voteResults.length} concurrent vote requests resolved successfully.`);

    // Fetch stats and user ledger from Redis
    const finalStats = await redisClient.hgetall(statsKey);
    const finalLedgerEntries = await redisClient.hgetall(ledgerKey);
    const ledgerCount = await redisClient.hlen(ledgerKey);

    const actualScore = Number(finalStats.score);
    const actualUpvotes = Number(finalStats.upvotes);
    const actualDownvotes = Number(finalStats.downvotes);

    console.log("\nFinal Redis State:");
    console.log(`  Key: ${statsKey}`);
    console.log(`    score:      ${actualScore}`);
    console.log(`    upvotes:    ${actualUpvotes}`);
    console.log(`    downvotes:  ${actualDownvotes}`);
    console.log(`  Key: ${ledgerKey}`);
    console.log(`    ledger entries count: ${ledgerCount}`);

    // Count upvotes and downvotes in ledger
    let ledgerUp = 0;
    let ledgerDown = 0;
    for (const voteVal of Object.values(finalLedgerEntries)) {
      if (voteVal === "1") ledgerUp++;
      if (voteVal === "-1") ledgerDown++;
    }
    console.log(`    ledger breakdown: ${ledgerUp} upvotes (+1), ${ledgerDown} downvotes (-1)`);

    // ASSERTION
    if (actualScore !== 0) {
      throw new Error(`ASSERTION FAILED in Test 2: Expected score === 0, got ${actualScore}`);
    }
    if (actualUpvotes !== 25) {
      throw new Error(`ASSERTION FAILED in Test 2: Expected upvotes === 25, got ${actualUpvotes}`);
    }
    if (actualDownvotes !== 25) {
      throw new Error(`ASSERTION FAILED in Test 2: Expected downvotes === 25, got ${actualDownvotes}`);
    }
    if (ledgerCount !== 50) {
      throw new Error(`ASSERTION FAILED in Test 2: Expected ledger entries === 50, got ${ledgerCount}`);
    }
    console.log(">> ASSERTION PASSED: Redis score is exactly 0, upvotes 25, downvotes 25, ledger 50.\n");

    // ─────────────────────────────────────────────────────────────────────────
    // TEST 3: THE PAGINATION INDEX (CURSOR) TEST
    // ─────────────────────────────────────────────────────────────────────────
    console.log("--------------------------------------------------------------------------------");
    console.log("TEST 3: THE PAGINATION INDEX (CURSOR) TEST");
    console.log("--------------------------------------------------------------------------------");

    // Insert 15 dummy posts with staggered hotRank values
    console.log("Inserting 15 dummy posts with staggered hotRank values (150 down to 10)...");
    const paginationDocs = [];
    for (let i = 0; i < 15; i++) {
      paginationDocs.push({
        authorId,
        title: `Pagination Test Post #${i + 1}`,
        body: `Test post body ${i + 1}`,
        hotRank: 150 - i * 10, // 150, 140, 130, 120, 110, 100, 90, 80, 70, 60, 50, 40, 30, 20, 10
        isDeleted: false,
        cursorTs: Date.now() - i * 1000,
      });
    }

    const insertedPosts = await Post.insertMany(paginationDocs);
    for (const doc of insertedPosts) {
      createdPostIds.push(doc._id);
    }
    console.log(`Inserted ${insertedPosts.length} posts. HotRank range: ${insertedPosts[0].hotRank} -> ${insertedPosts[14].hotRank}`);

    // Query top 5 posts where hotRank < 100 (previous cursor = 100)
    const previousCursor = 100;
    const cursorFilter = {
      isDeleted: false,
      hotRank: { $lt: previousCursor },
    };
    const cursorSort = {
      isDeleted: 1,
      hotRank: -1,
      cursorTs: -1,
    };

    console.log(`\nExecuting Cursor Query with .explain("executionStats"):`);
    console.log(`  Filter: { isDeleted: false, hotRank: { $lt: ${previousCursor} } }`);
    console.log(`  Sort:   { isDeleted: 1, hotRank: -1, cursorTs: -1 }`);
    console.log(`  Limit:  5`);

    const queryExplanation = await Post.find(cursorFilter)
      .sort(cursorSort)
      .limit(5)
      .explain("executionStats");

    const execStats = queryExplanation.executionStats;
    const totalDocsExamined = execStats.totalDocsExamined;
    const totalKeysExamined = execStats.totalKeysExamined;
    const nReturned = execStats.nReturned;

    console.log("\nExecution Plan Statistics:");
    console.log(`  nReturned:          ${nReturned}`);
    console.log(`  totalKeysExamined:  ${totalKeysExamined}`);
    console.log(`  totalDocsExamined:  ${totalDocsExamined}`);
    console.log(`  executionStages:    ${execStats.executionStages?.stage || "N/A"}`);

    // Check if an index was used
    const winningPlan = queryExplanation.queryPlanner?.winningPlan;
    console.log(`  winningPlan stage:  ${winningPlan?.stage || "N/A"}`);

    // ASSERTION
    if (totalDocsExamined !== 5) {
      throw new Error(`ASSERTION FAILED in Test 3: Expected totalDocsExamined === 5, got ${totalDocsExamined} (Table Scan Detected!)`);
    }
    if (nReturned !== 5) {
      throw new Error(`ASSERTION FAILED in Test 3: Expected nReturned === 5, got ${nReturned}`);
    }
    console.log(">> ASSERTION PASSED: totalDocsExamined is EXACTLY 5. Index scan verified with zero table scans.\n");

    // ─────────────────────────────────────────────────────────────────────────
    // TEST 4: THE FRONTEND O(N) FLATTENING TEST
    // ─────────────────────────────────────────────────────────────────────────
    console.log("--------------------------------------------------------------------------------");
    console.log("TEST 4: THE FRONTEND O(N) FLATTENING TEST");
    console.log("--------------------------------------------------------------------------------");

    // Fetch all 4 comments from Test 1 sorted as the server would return them: (path ASC, createdAt ASC)
    const rawAllComments = await Comment.find({ postId: dummyPost._id }).sort({ path: 1, createdAt: 1 });
    console.log(`Fetched ${rawAllComments.length} raw comments for Post ${dummyPost._id}:`);
    rawAllComments.forEach((c) => {
      console.log(`  id=${c._id} path="${c.path}" rawDepth=${c.depth} body="${c.body}"`);
    });

    // Pass through the frontend tree-flattening algorithm
    const flattened = flattenCommentTree(rawAllComments);
    console.log(`\nFlattened Array Output (${flattened.length} items):`);
    flattened.forEach((item, idx) => {
      console.log(`  [${idx}] id=${item._id} depth=${item.depth} isCollapsed=${item.isCollapsed} isHidden=${item.isHidden} body="${item.body}"`);
    });

    const flattenedCommentC = flattened.find((c) => c._id.toString() === commentC._id.toString());

    // ASSERTION
    if (flattened.length !== 4) {
      throw new Error(`ASSERTION FAILED in Test 4: Expected flattened length === 4, got ${flattened.length}`);
    }
    if (!flattenedCommentC) {
      throw new Error("ASSERTION FAILED in Test 4: Comment C not found in flattened array!");
    }
    if (flattenedCommentC.depth !== 3) {
      throw new Error(`ASSERTION FAILED in Test 4: Expected Comment C depth === 3, got ${flattenedCommentC.depth}`);
    }
    console.log(">> ASSERTION PASSED: Flattened length is exactly 4 and Comment C depth is exactly 3.\n");

    console.log("================================================================================");
    console.log("                  ALL 4 STRICT PHYSICAL TESTS PASSED!");
    console.log("================================================================================");
  } finally {
    // ── Graceful Cleanup ─────────────────────────────────────────────────────────
    console.log("\n[Teardown] Cleaning up test records and Redis keys...");

    if (createdCommentIds.length > 0) {
      const delComments = await Comment.deleteMany({ _id: { $in: createdCommentIds } });
      console.log(`  Deleted ${delComments.deletedCount} test comments from MongoDB.`);
    }

    if (createdPostIds.length > 0) {
      const delPosts = await Post.deleteMany({ _id: { $in: createdPostIds } });
      console.log(`  Deleted ${delPosts.deletedCount} test posts from MongoDB.`);
    }

    for (const key of redisKeysToClean) {
      try {
        await redisClient.del(key);
      } catch {}
    }
    console.log("  Cleaned up Redis test keys.");

    // Close connections gracefully
    console.log("[Teardown] Closing database and Redis connections...");
    await mongoose.disconnect();
    console.log("  MongoDB disconnected.");

    await redisClient.quit();
    await pubClient.quit();
    await subClient.quit();
    console.log("  Redis clients disconnected.");
    console.log("[Teardown] Complete. Exiting cleanly.\n");
  }
}

runStrictVerification().catch((err) => {
  console.error("\n❌ TEST SUITE FAILED WITH ERROR:");
  console.error(err);
  process.exit(1);
});
