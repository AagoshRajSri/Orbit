import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

const clearDB = async () => {
  try {
    const uri = process.env.MONGODB_URI || process.env.DB_URI;
    if (!uri) throw new Error("No MONGODB_URI found");

    console.log("Connecting to MongoDB...");
    await mongoose.connect(uri);
    console.log("Connected.");

    const collections = await mongoose.connection.db.collections();
    
    for (const collection of collections) {
      const name = collection.collectionName;
      // We clear almost everything to ensure a fresh start
      console.log(`Clearing collection: ${name}...`);
      await collection.deleteMany({});
    }

    console.log("\n✓ Database cleared successfully.");
    process.exit(0);
  } catch (error) {
    console.error("Error clearing DB:", error);
    process.exit(1);
  }
};

clearDB();
