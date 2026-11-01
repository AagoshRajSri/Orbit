import mongoose from "mongoose";
import dotenv from "dotenv";
import { connectDB } from "../src/lib/db.js";
import Comment from "../src/models/comment.model.js";

dotenv.config();

const benchPostId = process.env.BENCH_POST_ID || "6ae73f0740be00d25ceb676e";

async function runExplain() {
  await connectDB();
  
  const query = Comment.find({
    postId: new mongoose.Types.ObjectId(benchPostId),
    isDeleted: false,
  }).sort({ path: 1, createdAt: 1 });

  const explainResult = await query.explain("executionStats");
  
  console.log("=== EXPLAIN EXECUTION STATS ===");
  console.log(JSON.stringify(explainResult.executionStats, null, 2));
  
  await mongoose.disconnect();
}

runExplain().catch((err) => {
  console.error("Explain error:", err);
  process.exit(1);
});
