/**
 * generate-bench-token.js
 * Utility to generate a valid, active session JWT for k6 / artillery benchmarking.
 *
 * Usage:
 *   node scripts/generate-bench-token.js
 *   k6 run -e AUTH_TOKEN=$(node scripts/generate-bench-token.js --token-only) load-test-feed.js
 */

import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env"), quiet: true });

import mongoose from "mongoose";
import { connectDB } from "../src/lib/db.js";
import User from "../src/models/user.model.js";
import { generateToken } from "../src/lib/utils.js";

async function main() {
  const tokenOnly = process.argv.includes("--token-only");
  const originalLog = console.log;
  const originalWarn = console.warn;
  if (tokenOnly) {
    console.log = () => {};
    console.warn = () => {};
  }
  
  try {
    await connectDB();
    
    let user = await User.findOne();
    if (!user) {
      user = await User.create({
        username: "bench_runner",
        orbitId: "orbit_bench_runner",
        orbitTag: "#0001",
        normalizedHandle: "bench_runner",
        email: "bench@orbit.local",
        password: "BenchmarkPassword123!",
      });
    }

    const mockReq = {
      ip: "127.0.0.1",
      headers: { "user-agent": "k6-load-tester" },
      header: () => "http",
      secure: false,
    };

    const mockRes = {
      cookie: () => {},
    };

    const tokens = await generateToken(user._id, mockReq, mockRes);

    if (tokenOnly) {
      process.stdout.write(tokens.accessToken);
    } else {
      console.log("\n========================================================");
      console.log("   ORBIT BENCHMARK AUTH TOKEN GENERATOR");
      console.log("========================================================");
      console.log("User:", user.username, `(${user._id})`);
      console.log("Session ID:", tokens.sessionId);
      console.log("\nAccess Token (Bearer):");
      console.log(tokens.accessToken);
      console.log("\nRun k6 benchmark with:");
      console.log(`k6 run -e AUTH_TOKEN="${tokens.accessToken}" load-test-feed.js\n`);
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("Token generation failed:", err);
    process.exit(1);
  }
}

main();
