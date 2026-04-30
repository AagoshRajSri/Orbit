import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  type: { 
    type: String, 
    enum: ["announcement", "warning", "update", "admin_message"], 
    required: true 
  },
  title: { type: String, default: "" },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  severity: { type: String, enum: ["info", "warning", "critical"], default: "info" },
  createdAt: { type: Date, default: Date.now }
});

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;
