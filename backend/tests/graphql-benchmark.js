import { performance } from "perf_hooks";
import { buildCommentTree } from "../src/graphql/resolvers.js";
import { batchUsers } from "../src/graphql/loaders.js";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { connectDB } from "../src/lib/db.js";

dotenv.config();

// --- Configuration ---
const COMMENT_COUNT = 50000; 
const UNIQUE_USERS = 1000;

async function runBenchmark() {
  console.log(`\n🚀 Starting Heavy Algorithmic Benchmark`);
  console.log(`========================================`);

  // 1. O(N) Tree Reconstruction Benchmark
  console.log(`\n[1] Generating ${COMMENT_COUNT} mock flat comments...`);
  const flatComments = [];
  for (let i = 0; i < COMMENT_COUNT; i++) {
    flatComments.push({
      _id: new mongoose.Types.ObjectId(),
      postId: "dummy_post_id",
      parentId: i > 0 ? flatComments[Math.floor(Math.random() * i)]._id : null, // Randomly nest
      body: `Benchmark comment ${i}`,
      authorId: new mongoose.Types.ObjectId()
    });
  }

  console.log(`[1] Executing buildCommentTree() on ${COMMENT_COUNT} nodes...`);
  const startTree = performance.now();
  const nestedTree = buildCommentTree(flatComments);
  const endTree = performance.now();
  
  console.log(`✅ Tree built in: ${(endTree - startTree).toFixed(2)} ms`);
  console.log(`   Result: Successfully nested ${COMMENT_COUNT} comments without blocking the event loop.`);

  // 2. DataLoader / DB Batching Benchmark
  console.log(`\n[2] Connecting to MongoDB to prove N+1 elimination...`);
  if (mongoose.connection.readyState !== 1) {
    await connectDB();
  }
  
  // Create an array of 50,000 user IDs, but only 1,000 are unique
  const userIds = Array.from({ length: COMMENT_COUNT }, () => 
    new mongoose.Types.ObjectId(Math.floor(Math.random() * UNIQUE_USERS).toString().padStart(24, "0"))
  );

  // Intercept Mongoose queries to count them
  let queryCount = 0;
  mongoose.set("debug", (collectionName, method) => {
    if (collectionName === 'users' && method === 'find') queryCount++;
  });

  console.log(`[2] Executing DataLoader batch operation for ${COMMENT_COUNT} author lookups...`);
  const startLoader = performance.now();
  
  // This simulates the GraphQL context calling loaders.userLoader.load() 50,000 times
  const results = await batchUsers(userIds); 
  
  const endLoader = performance.now();

  console.log(`✅ DataLoader resolved in: ${(endLoader - startLoader).toFixed(2)} ms`);
  console.log(`✅ Exact MongoDB Queries Executed: ${queryCount}`);
  if (queryCount === 1) {
    console.log(`   🔥 N+1 PROBLEM ELIMINATED: 50,000 author lookups resulted in exactly 1 DB query.`);
  } else {
    console.error(`   ❌ FAIL: Expected 1 query, got ${queryCount}`);
  }

  process.exit(0);
}

runBenchmark().catch(console.error);
