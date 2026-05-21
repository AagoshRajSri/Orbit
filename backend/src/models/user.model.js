import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, index: true },
    orbitId: { type: String, unique: true, index: true },
    orbitTag: { type: String, required: true },
    normalizedHandle: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, unique: true, index: true },
    isEmailVerified: { type: Boolean, default: false },
    recoveryPassphraseHash: { type: String, default: null },
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
    contactRequests: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        index: true,
      },
    ],
    sentRequests: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    // Timestamps for when each request was sent/received (keyed by userId string)
    sentRequestDates:    { type: Map, of: Date, default: {} },
    contactRequestDates: { type: Map, of: Date, default: {} },
    blockedContacts: [
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
    renameHistory: [
      {
        oldHandle: { type: String, required: true },
        changedAt: { type: Date, default: Date.now }
      }
    ],
    moderationFlags: {
      isBanned: { type: Boolean, default: false },
      banReason: { type: String, default: "" },
      isReported: { type: Boolean, default: false }
    },
    verificationMetadata: {
      isVerified: { type: Boolean, default: false },
      badgeClass: { type: String, default: "standard" }, // 'standard', 'staff', 'vip'
      verifiedAt: { type: Date, default: null }
    },
    similarityMetadata: {
      similarityFlag: { type: Boolean, default: false },
      similarityScore: { type: Number, default: 0 },
      similarTo: { type: String, default: "" }
    }
  },
  { timestamps: true },
);

userSchema.index({ createdAt: -1 });

const User = mongoose.model("User", userSchema);
export default User;
