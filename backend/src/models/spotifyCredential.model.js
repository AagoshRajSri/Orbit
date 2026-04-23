import mongoose from "mongoose";

const spotifyCredentialSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    spotifyId: {
      type: String,
      required: true,
      unique: true,
    },
    displayName: String,
    email: String,
    profileImage: String,
    accessToken: {
      type: String,
      required: true,
    },
    refreshToken: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    scope: {
      type: String,
      default:
        "user-read-private user-read-email user-modify-playback-state user-read-currently-playing user-read-playback-state user-library-read user-library-modify",
    },
    // Last known active Spotify device
    lastActiveDevice: {
      id: String,
      name: String,
      type: String, // Computer, Smartphone, Speaker, etc.
    },
    // For tracking if user is currently using Spotify
    lastSyncedAt: Date,
  },
  { timestamps: true },
);

// Index for expiresAt TTL (userId and spotifyId already have indexes via unique: true)
spotifyCredentialSchema.index({ expiresAt: 1 });

export const SpotifyCredential = mongoose.model(
  "SpotifyCredential",
  spotifyCredentialSchema,
);
