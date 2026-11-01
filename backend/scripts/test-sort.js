import dotenv from "dotenv";
import { connectDB } from "../src/lib/db.js";
import Comment from "../src/models/comment.model.js";

dotenv.config();

async function run() {
  await connectDB();
  const t0 = Date.now();
  const comments = await Comment.find({ postId: "6ae73f0740be00d25ceb676e" }).sort({ path: 1 }).lean();
  console.log("Fetched", comments.length, "comments in", Date.now() - t0, "ms without memory limit error!");
  process.exit(0);
}

run().catch(console.error);
