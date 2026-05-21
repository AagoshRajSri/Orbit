import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";


const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const clearDB = async () => {
  try {
    const uri = process.env.MONGODB_URI || process.env.DB_URI;
    if (!uri) {
      throw new Error("MONGODB_URI or DB_URI not found in .env");
    }

    console.log("Connecting to database...");
    await mongoose.connect(uri);
    console.log("Connected successfully.");

    const collections = [
      "users",
      "sessions",
      "messages",
      "nexuses",
      "constellationprofiles",
      "otps",
      "starweaves",
      "spotifycredentials",
      "spotifysessions",
      "auditlogs"
    ];

    for (const collectionName of collections) {
      try {
        const collection = mongoose.connection.collection(collectionName);
        const count = await collection.countDocuments();
        if (count > 0) {
          await collection.deleteMany({});
          console.log(`Wiped ${count} documents from '${collectionName}'`);
        } else {
          console.log(`Collection '${collectionName}' is already empty.`);
        }
      } catch (err) {
        console.warn(`Could not clear collection '${collectionName}': ${err.message}`);
      }
    }

    console.log("\nDatabase wipe complete. All user data has been purged.");
    process.exit(0);
  } catch (error) {
    console.error("Critical error wiping database:", error);
    process.exit(1);
  }
};

clearDB();
