import mongoose from "mongoose";
import Session from "./src/models/session.model.js";
import dotenv from "dotenv";

dotenv.config();

async function dropIndex() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || process.env.DB_URI);
    console.log("Connected to MongoDB.");
    
    const db = mongoose.connection.db;
    const collection = db.collection("sessions");
    
    // Check if index exists
    const indexes = await collection.indexes();
    console.log("Current indexes:", indexes.map(i => i.name));
    
    if (indexes.some(i => i.name === "sessionId_1")) {
      console.log("Dropping sessionId_1 index...");
      await collection.dropIndex("sessionId_1");
      console.log("Index dropped successfully.");
    } else {
      console.log("Index sessionId_1 does not exist.");
    }
    
    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}
dropIndex();
