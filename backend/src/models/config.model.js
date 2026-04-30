import mongoose from "mongoose";

const configSchema = new mongoose.Schema({
  maintenanceMode: { type: Boolean, default: false },
  registrationEnabled: { type: Boolean, default: true },
  
  // Advanced Control Layer
  maxMessageLength: { type: Number, default: 2000 },
  rateLimitThresholds: {
    login: { type: Number, default: 5 },
    message: { type: Number, default: 60 }, // per minute
  },
  featureFlags: {
    enableSpotifySync: { type: Boolean, default: true },
    enableUploads: { type: Boolean, default: true },
    liveMode: { type: Boolean, default: true },
  },

  // Global Announcement
  globalAnnouncement: {
    enabled: { type: Boolean, default: false },
    message: { type: String, default: "" },
    severity: { type: String, enum: ["info", "warning", "critical"], default: "info" }
  }
});

const AppConfig = mongoose.model("AppConfig", configSchema);
export default AppConfig;
