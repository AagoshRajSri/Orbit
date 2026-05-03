import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, unique: true, index: true },
    isEmailVerified: { type: Boolean, default: false },
    telegramId: { type: String, default: "" },
    isTelegramVerified: { type: Boolean, default: false },
    password: { type: String, required: true, minlength: 8 },
    profilePic: { type: String, default: "" },
    bio: { type: String, default: "", maxlength: 500 },
    publicKey: { type: String, default: "" }, // For E2E encryption
    isLocked: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    contacts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        index: true,
      },
    ],
    contactAliases: {
      type: Map,
      of: String,
      default: {},
    },
  },
  { timestamps: true },
);

userSchema.index({ createdAt: -1 });

const User = mongoose.model("User", userSchema);
export default User;
