import mongoose from "mongoose";

const spotifySessionSchema = new mongoose.Schema(
  {
    // Session basics
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    hostId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    hostName: String,
    hostAvatar: String,

    // Mode: solo, shared, or ghost (ghost = shared but presence hidden)
    mode: {
      type: String,
      enum: ["solo", "shared", "ghost"],
      default: "solo",
    },

    // Participants in shared mode
    participants: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        name: String,
        avatar: String,
        isGhost: {
          type: Boolean,
          default: false,
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
        isActive: {
          type: Boolean,
          default: true,
        },
        lastHeartbeat: Date,
      },
    ],

    // Current playback state
    currentTrack: {
      id: String,
      name: String,
      artist: String,
      album: String,
      imageUrl: String,
      durationMs: Number,
      uri: String,
    },
    isPlaying: {
      type: Boolean,
      default: false,
    },
    positionMs: {
      type: Number,
      default: 0,
    },

    // Device info (for syncing across devices)
    hostDevice: {
      id: String,
      name: String,
      type: String,
    },

    // Sync metadata
    lastSyncAt: {
      type: Date,
      default: Date.now,
    },
    syncVersion: {
      type: Number,
      default: 0,
    },

    // Session metadata
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    },

    // For late joiners to catch up
    syncBuffer: [
      {
        action: String, // play, pause, skip, seek
        track: String,
        positionMs: Number,
        timestamp: Date,
      },
    ],
  },
  { timestamps: true },
);

// TTL index to automatically delete expired sessions
spotifySessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const SpotifySession = mongoose.model(
  "SpotifySession",
  spotifySessionSchema,
);
