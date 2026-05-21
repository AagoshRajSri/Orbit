import mongoose from "mongoose";
import { generateToken } from "./src/lib/utils.js";
import User from "./src/models/user.model.js";
import dotenv from "dotenv";

dotenv.config();

async function test() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || process.env.DB_URI);
    const user = await User.findOne({});
    if (!user) {
      console.log("No user found");
      process.exit(1);
    }
    const req = {
      ip: "127.0.0.1",
      headers: { "user-agent": "test" },
      header: (h) => "http",
      secure: false
    };
    const res = {
      cookie: (name, val, opts) => console.log("Set cookie:", name)
    };
    const tokens = await generateToken(user._id, req, res);
    console.log("Tokens generated:", tokens.accessToken.substring(0, 10) + "...");
    process.exit(0);
  } catch (err) {
    console.error("Test failed:", err);
    process.exit(1);
  }
}
test();
