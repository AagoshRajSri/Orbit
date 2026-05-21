import mongoose from "mongoose";

const contactRequestSchema = new mongoose.Schema(
  {
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    receiverId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: { 
      type: String, 
      enum: ['pending', 'accepted', 'declined'], 
      default: 'pending' 
    }
  },
  { timestamps: true }
);

contactRequestSchema.index({ senderId: 1, receiverId: 1 }, { unique: true });
contactRequestSchema.index({ receiverId: 1, status: 1 });

const ContactRequest = mongoose.model("ContactRequest", contactRequestSchema);
export default ContactRequest;
