/**
 * seed-extreme.js — Orbit Extreme Stress Seeder
 *
 * Populates MongoDB with maximum relational density:
 *  - 1,000 User profiles
 *  - 100 Posts
 *  - 50,000 Comments organized via Materialized Paths
 *  - Exactly 11,000 comments (22%) nested at depth 5 through 10
 *
 * Usage:
 *   node scripts/seed-extreme.js
 *   node scripts/seed-extreme.js --clean   # Clears previous seed data first
 */

import mongoose from "mongoose";
import dns from "dns";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { connectDB } from "../src/lib/db.js";
import User from "../src/models/user.model.js";
import Post from "../src/models/post.model.js";
import Comment from "../src/models/comment.model.js";
import { redisClient, isRedisAvailable } from "../src/lib/redis.js";

dotenv.config();

try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch {}

const CHUNK_SIZE = 5000;
const TOTAL_USERS = 1000;
const TOTAL_POSTS = 100;
const TOTAL_COMMENTS = 50000;

// Distribution across depth levels (sum = 50,000):
// Depth 5-10 = 3500 + 2500 + 2000 + 1500 + 1000 + 500 = 11,000 (22%)
const DEPTH_DISTRIBUTION = [
  { depth: 0, count: 5000 },
  { depth: 1, count: 10000 },
  { depth: 2, count: 12000 },
  { depth: 3, count: 7000 },
  { depth: 4, count: 5000 },
  { depth: 5, count: 3500 },
  { depth: 6, count: 2500 },
  { depth: 7, count: 2000 },
  { depth: 8, count: 1500 },
  { depth: 9, count: 1000 },
  { depth: 10, count: 500 },
];

async function seed() {
  const startTime = Date.now();
  console.log("============================================================");
  console.log("🚀 ORBIT EXTREME RELATIONAL STRESS SEEDER");
  console.log("============================================================");

  await connectDB();
  console.log("✓ Connected to MongoDB Atlas");

  const shouldClean = process.argv.includes("--clean");
  if (shouldClean) {
    console.log("🧹 Cleaning previous extreme benchmark data...");
    await Promise.all([
      User.deleteMany({ email: /^extreme_user_/ }),
      Post.deleteMany({ title: /^\[BENCHMARK\]/ }),
      Comment.deleteMany({ body: /^\[DEPTH-/ }),
    ]);
    console.log("✓ Cleanup complete");
  }

  // ── 1. Seed 1,000 Users ───────────────────────────────────────────────────
  console.log(`\n[1/3] Generating ${TOTAL_USERS} users...`);
  const passwordHash = bcrypt.hashSync("BenchmarkPass123!", 10);
  const userDocs = [];
  const userIds = [];

  for (let i = 0; i < TOTAL_USERS; i++) {
    const id = new mongoose.Types.ObjectId();
    userIds.push(id);
    const tag = `#${String(1000 + i)}`;
    userDocs.push({
      _id: id,
      username: `extreme_user_${i}`,
      orbitId: `orb_ext_${i}`,
      orbitTag: tag,
      normalizedHandle: `extreme_user_${i}${tag}`,
      email: `extreme_user_${i}@orbit.benchmark`,
      password: passwordHash,
      isEmailVerified: true,
      bio: `Simulated high-concurrency benchmark persona #${i}`,
      publicKey: "MCowBQYDK2VwAyEA0GfT8y1Wz2E4N5M6V7B8C9X0Y1Z2A3B4C5D6E7F8G9H=",
      createdAt: new Date(Date.now() - Math.floor(Math.random() * 10000000)),
    });
  }

  for (let i = 0; i < userDocs.length; i += CHUNK_SIZE) {
    await User.insertMany(userDocs.slice(i, i + CHUNK_SIZE), { ordered: false });
  }
  console.log(`✓ Inserted ${TOTAL_USERS} users.`);

  // ── 2. Seed 100 Posts ─────────────────────────────────────────────────────
  console.log(`\n[2/3] Generating ${TOTAL_POSTS} posts...`);
  const postDocs = [];
  const postIds = [];

  // Dedicated megathread post that holds the 50,000-comment tree
  const primaryPostId = new mongoose.Types.ObjectId();
  postIds.push(primaryPostId);
  postDocs.push({
    _id: primaryPostId,
    authorId: userIds[0],
    title: "[BENCHMARK] Extreme Nested Megathread: 50,000 Materialized Path Nodes",
    body: "This post anchors 50,000 deeply nested comments (depths 0 through 10) to physically validate DataLoader batching, O(N) tree reconstruction, and Next.js SSR hydration.",
    tags: ["benchmark", "stress", "graphql", "nextjs", "redis"],
    upvotes: 250,
    downvotes: 12,
    score: 238,
    hotRank: 1845.2,
    commentCount: TOTAL_COMMENTS,
    cursorTs: Date.now(),
    createdAt: new Date(),
  });

  for (let i = 1; i < TOTAL_POSTS; i++) {
    const id = new mongoose.Types.ObjectId();
    postIds.push(id);
    const author = userIds[i % userIds.length];
    const upvotes = Math.floor(Math.random() * 500);
    const downvotes = Math.floor(Math.random() * 50);
    const score = upvotes - downvotes;

    postDocs.push({
      _id: id,
      authorId: author,
      title: `[BENCHMARK] Relational Feed Stream Node #${i}`,
      body: `Automated test post payload #${i} validating distributed Redis ZSET indexing under 500 concurrent HTTP virtual users.`,
      tags: ["benchmark", "architecture", "orbit"],
      upvotes,
      downvotes,
      score,
      hotRank: Math.log10(Math.max(Math.abs(score), 1)) + (Date.now() / 45000000),
      commentCount: 0,
      cursorTs: Date.now() - (i * 60000),
      createdAt: new Date(Date.now() - (i * 60000)),
    });
  }

  await Post.insertMany(postDocs, { ordered: false });
  console.log(`✓ Inserted ${TOTAL_POSTS} posts.`);
  console.log(`🔥 PRIMARY BENCHMARK POST ID: ${primaryPostId.toString()}`);

  // ── 3. Seed 50,000 Comments with Deep Materialized Paths ───────────────────
  console.log(`\n[3/3] Generating ${TOTAL_COMMENTS} comments across depths 0 to 10...`);
  const depthNodes = Array.from({ length: 11 }, () => []);
  const allComments = [];

  for (const { depth, count } of DEPTH_DISTRIBUTION) {
    console.log(`  -> Generating Depth ${depth}: ${count} comments...`);

    for (let c = 0; c < count; c++) {
      const commentId = new mongoose.Types.ObjectId();
      const authorId = userIds[(c + depth) % userIds.length];
      const upvotes = Math.floor(Math.random() * 50);
      const downvotes = Math.floor(Math.random() * 5);
      const score = upvotes - downvotes;

      let parentId = null;
      let path = `/${primaryPostId.toString()}`;

      if (depth > 0) {
        const potentialParents = depthNodes[depth - 1];
        const parent = potentialParents[c % potentialParents.length];
        parentId = parent._id;
        path = `${parent.path}/${parent._id.toString()}`;
      }

      const node = {
        _id: commentId,
        postId: primaryPostId,
        authorId,
        parentId,
        path,
        depth,
        body: `[DEPTH-${depth}] Node ${c + 1} of ${count}. Materialized path: ${path}`,
        upvotes,
        downvotes,
        score,
        isDeleted: false,
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 3600000)),
      };

      depthNodes[depth].push({ _id: commentId, path });
      allComments.push(node);
    }
  }

  console.log(`\nInserting ${allComments.length} comments in chunks of ${CHUNK_SIZE}...`);
  for (let i = 0; i < allComments.length; i += CHUNK_SIZE) {
    const chunk = allComments.slice(i, i + CHUNK_SIZE);
    await Comment.insertMany(chunk, { ordered: false });
    process.stdout.write(`  ✓ Inserted ${Math.min(i + CHUNK_SIZE, allComments.length)} / ${allComments.length}\r`);
  }
  console.log(`\n✓ Inserted all ${TOTAL_COMMENTS} comments successfully!`);

  // ── 4. Sync Redis Rankings if Available ───────────────────────────────────
  if (isRedisAvailable) {
    console.log("\n⚡ Populating Redis feed ZSETs...");
    try {
      const pipeline = redisClient.pipeline();
      for (const p of postDocs) {
        const pid = p._id.toString();
        pipeline.zadd("feed:trending", p.hotRank, pid);
        pipeline.zadd("feed:recent", p.cursorTs, pid);
        pipeline.zadd("feed:top", p.score, pid);
        pipeline.hset(`post:${pid}:stats`, {
          upvotes: p.upvotes,
          downvotes: p.downvotes,
          score: p.score,
        });
      }
      await pipeline.exec();
      console.log("✓ Redis feed ZSETs and stats caches synchronized.");
    } catch (err) {
      console.warn("⚠️ Redis sync non-fatal warning:", err.message);
    }
  }

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log("\n============================================================");
  console.log(`🎉 SEEDING COMPLETE IN ${durationSec}s`);
  console.log(`📌 Export for benchmarks:`);
  console.log(`   $env:BENCH_POST_ID = "${primaryPostId.toString()}"`);
  console.log("============================================================");

  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Fatal Seeding Error:", err);
  process.exit(1);
});
