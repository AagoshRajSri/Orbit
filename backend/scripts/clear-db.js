import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../src/models/user.model.js";
import Message from "../src/models/message.model.js";
import Nexus from "../src/models/nexus.model.js";
import Session from "../src/models/session.model.js";
import OTP from "../src/models/otp.model.js";

dotenv.config();

const clearDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || process.env.DB_URI);
    console.log("Connected to MongoDB");

    console.log("Clearing Users...");
    await User.deleteMany({});
    
    console.log("Clearing Messages...");
    await Message.deleteMany({});
    
    console.log("Clearing Nexuses...");
    await Nexus.deleteMany({});
    
    console.log("Clearing Sessions...");
    await Session.deleteMany({});

    console.log("Clearing OTPs...");
    await OTP.deleteMany({});

    console.log("Database cleared successfully ✦");
    process.exit(0);
  } catch (error) {
    console.error("Error clearing database:", error);
    process.exit(1);
  }
};

clearDB();
