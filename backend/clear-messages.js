import mongoose from "mongoose";
import dotenv from "dotenv";
import Message from "./src/models/message.model.js";
import NexusSenderKeyDistribution from "./src/models/nexusSenderKeyDistribution.model.js";

dotenv.config();

const main = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB!");

    // 1. Delete all messages
    const msgResult = await Message.deleteMany({});
    console.log(`Successfully deleted ${msgResult.deletedCount} message(s) from database.`);

    // 2. Delete all E2EE sender key distributions
    const keyResult = await NexusSenderKeyDistribution.deleteMany({});
    console.log(`Successfully deleted ${keyResult.deletedCount} E2EE sender key distribution(s) from database.`);

    console.log("\nOrbit has been completely cleared of all messages and real-time session keys!");
  } catch (error) {
    console.error("Error clearing messages:", error);
  } finally {
    await mongoose.disconnect();
  }
};

main();
