import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./src/models/user.model.js";
import Message from "./src/models/message.model.js";
import Session from "./src/models/session.model.js";
import PrekeyBundle from "./src/models/prekeyBundle.model.js";
import DeviceRegistry from "./src/models/deviceRegistry.model.js";
import ConstellationProfile from "./src/models/constellationProfile.model.js";
import NexusSenderKeyDistribution from "./src/models/nexusSenderKeyDistribution.model.js";
import Nexus from "./src/models/nexus.model.js";
import KeyVault from "./src/models/keyVault.model.js";
import SyncManifest from "./src/models/syncManifest.model.js";

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

    // 3. Delete all prekey bundles
    const prekeyResult = await PrekeyBundle.deleteMany({});
    console.log(`Successfully deleted ${prekeyResult.deletedCount} prekey bundle(s) from database.`);

    // 4. Delete all device registries
    const deviceResult = await DeviceRegistry.deleteMany({});
    console.log(`Successfully deleted ${deviceResult.deletedCount} device registry record(s) from database.`);

    // 5. Delete all constellation authentication profiles
    const constellationResult = await ConstellationProfile.deleteMany({});
    console.log(`Successfully deleted ${constellationResult.deletedCount} constellation profile(s) from database.`);

    // 6. Delete all sessions
    const sessionResult = await Session.deleteMany({});
    console.log(`Successfully deleted ${sessionResult.deletedCount} session(s) from database.`);

    // 7. Delete all users
    const userResult = await User.deleteMany({});
    console.log(`Successfully deleted ${userResult.deletedCount} user(s) from database.`);

    // 8. Delete all group nexuses (to prevent membership and E2E key discrepancies)
    const nexusResult = await Nexus.deleteMany({});
    console.log(`Successfully deleted ${nexusResult.deletedCount} nexus group(s) from database.`);

    // 9. Delete all E2EE key vaults
    const vaultResult = await KeyVault.deleteMany({});
    console.log(`Successfully deleted ${vaultResult.deletedCount} KeyVault(s) from database.`);

    // 10. Delete all sync manifests
    const manifestResult = await SyncManifest.deleteMany({});
    console.log(`Successfully deleted ${manifestResult.deletedCount} SyncManifest(s) from database.`);

    console.log("\nOrbit has been completely cleared of all messages, test users, groups, vaults, and E2EE sessions!");
  } catch (error) {
    console.error("Error purging database:", error);
  } finally {
    await mongoose.disconnect();
  }
};

main();
