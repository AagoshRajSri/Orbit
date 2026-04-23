#!/usr/bin/env node

import dotenv from "dotenv";
import { connectDB } from "./src/lib/db.js";
import User from "./src/models/user.model.js";
import bcrypt from "bcryptjs";

dotenv.config();

async function createTestUser() {
  try {
    await connectDB();
    console.log("✓ Connected to MongoDB");

    // Create a test user
    const testEmail = "test@example.com";
    const testPassword = "test123456";
    const testUsername = "testuser";

    // Check if user already exists
    const existingUser = await User.findOne({ email: testEmail });
    if (existingUser) {
      console.log(`✓ Test user already exists: ${testEmail}`);
      console.log(`  Use these credentials to login:`);
      console.log(`  Email: ${testEmail}`);
      console.log(`  Password: ${testPassword}`);
      process.exit(0);
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(testPassword, salt);

    // Create and save user
    const newUser = new User({
      username: testUsername,
      email: testEmail,
      password: hashedPassword,
      profilePic: "", // Use empty string, frontend will use /avatar.png fallback
    });

    await newUser.save();
    console.log("✓ Test user created successfully!");
    console.log(`\nUse these credentials to login:`);
    console.log(`  Email: ${testEmail}`);
    console.log(`  Password: ${testPassword}`);
    console.log(`  Username: ${testUsername}`);

    process.exit(0);
  } catch (error) {
    console.error("✗ Error creating test user:", error.message);
    process.exit(1);
  }
}

createTestUser();
