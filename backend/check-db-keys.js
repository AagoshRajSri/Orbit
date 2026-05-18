import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./src/models/user.model.js";
import PrekeyBundle from "./src/models/prekeyBundle.model.js";
import NexusSenderKeyDistribution from "./src/models/nexusSenderKeyDistribution.model.js";
import Nexus from "./src/models/nexus.model.js";

dotenv.config();

const main = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB!");

  console.log("\n=== USERS ===");
  const users = await User.find({}, "username email").lean();
  for (const u of users) {
    console.log(`User: ${u.username} | ID: ${u._id}`);
  }

  console.log("\n=== NEXUSES ===");
  const nexuses = await Nexus.find({}, "name members").lean();
  for (const n of nexuses) {
    console.log(`Nexus: ${n.name} | ID: ${n._id} | Members: ${n.members.join(", ")}`);
  }

  console.log("\n=== SENDER KEY DISTRIBUTIONS ===");
  const dists = await NexusSenderKeyDistribution.find({}).lean();
  for (const d of dists) {
    const sender = users.find(u => u._id.toString() === d.senderId.toString())?.username || d.senderId;
    const recipient = users.find(u => u._id.toString() === d.recipientId.toString())?.username || d.recipientId;
    const nexus = nexuses.find(n => n._id.toString() === d.nexusId.toString())?.name || d.nexusId;
    console.log(`Nexus: ${nexus} | Sender: ${sender} | Recipient: ${recipient} | UpdatedAt: ${d.updatedAt}`);
  }

  console.log("\n=== PREKEY BUNDLES ===");
  const bundles = await PrekeyBundle.find({}, "userId oneTimePrekeys").lean();
  for (const b of bundles) {
    const user = users.find(u => u._id.toString() === b.userId.toString())?.username || b.userId;
    console.log(`User: ${user} | OPK Count: ${b.oneTimePrekeys?.length || 0}`);
  }

  await mongoose.disconnect();
};

main();
