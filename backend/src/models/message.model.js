import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: function() { return !this.nexusId; },
      index: true,
    },
    nexusId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Nexus",
      required: function() { return !this.receiverId; },
      index: true,
    },
    text: {
      type: String,
    },
    image: {
      type: String,
    },
    isSystem: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    idempotencyKey: {
      type: String,
      sparse: true,
      index: true,
    },
    deliveredAt: {
      type: Date,
      default: null,
    },
    seenAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Compound index for message history performance
messageSchema.index({ senderId: 1, receiverId: 1, createdAt: -1 });
messageSchema.index({ nexusId: 1, createdAt: -1 });

const Message = mongoose.model("Message", messageSchema);
export default Message;
