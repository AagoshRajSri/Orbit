import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import Session from "./src/models/session.model.js";
import User from "./src/models/user.model.js";
import axios from "axios";

dotenv.config();

const main = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB!");

  // Find or create test user
  let user = await User.findOne({ username: "testuser" });
  if (!user) {
    user = await User.create({ username: "testuser", email: "testuser@gmail.com", password: "password123" });
  }
  
  let user2 = await User.findOne({ username: "testuser2" });
  if (!user2) {
    user2 = await User.create({ username: "testuser2", email: "testuser2@gmail.com", password: "password123" });
  }

  // Create session
  const sessionId = "test-session-id-123456";
  await Session.deleteOne({ sessionId });
  await Session.create({
    userId: user._id,
    sessionId,
    hashedRefreshToken: "test-hash",
    ip: "127.0.0.1",
    userAgent: "test",
    isValid: true,
    lastActive: new Date()
  });

  // Generate JWT token
  const token = jwt.sign(
    { userId: user._id.toString(), sessionId },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );

  const payload = {
    idempotencyKey: "123e4567-e89b-12d3-a456-426614174001",
    v: 3,
    dh: "base64encodedpubkey",
    n: 0,
    pn: 0,
    ciphertext: "base64encodedciphertext",
    iv: "base64encodediv",
    x3dh: {
      identityKey: "base64encodedidentitykey",
      ephemeralKey: "base64encodedephemeralkey",
      opkId: null
    }
  };

  const csrfToken = "1234567890123456789012345678901234567890123456789012345678901234";

  // Obfuscate the receiver's ID
  const { obfuscateId } = await import("./src/lib/obfuscation.js");
  const obfuscatedUser2Id = obfuscateId(user2._id.toString());

  try {
    const res = await axios.post(`http://localhost:5001/api/message/send/${obfuscatedUser2Id}`, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Cookie": `jwt=${token}; csrf_token=${csrfToken}`,
        "x-csrf-token": csrfToken
      }
    });
    console.log("Post success!", res.status, res.data);
  } catch (err) {
    console.log("Post failed!");
    if (err.response) {
      console.log("Status:", err.response.status);
      console.log("Data:", JSON.stringify(err.response.data, null, 2));
    } else {
      console.log("Error message:", err.message);
    }
  }

  await mongoose.disconnect();
};

main();
