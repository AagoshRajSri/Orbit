import AppConfig from "../models/config.model.js";
import { logAdminAction } from "../lib/adminLogger.js";
import mongoose from "mongoose";
import { isRedisAvailable, pubClient } from "../lib/redis.js";
import { insightsEngine } from "../services/insights.service.js";

export const getSystemConfig = async (req, res) => {
  try {
    const config = await AppConfig.findOne();
    if (!config) {
      return res.status(404).json({ success: false, message: "Configuration not found" });
    }
    return res.status(200).json({ success: true, config });
  } catch (error) {
    console.error("[AdminSystem] Error fetching config:", error);
    res.status(500).json({ success: false, message: "Server error fetching config" });
  }
};

export const updateSystemConfig = async (req, res) => {
  try {
    const { 
      maintenanceMode, 
      registrationEnabled,
      maxMessageLength,
      rateLimitThresholds,
      featureFlags,
      globalAnnouncement 
    } = req.body;

    const config = await AppConfig.findOne();
    if (!config) {
      return res.status(404).json({ success: false, message: "Configuration not found" });
    }

    let updated = false;
    let actionDetails = {};

    if (typeof maintenanceMode === "boolean" && config.maintenanceMode !== maintenanceMode) {
      config.maintenanceMode = maintenanceMode;
      actionDetails.maintenanceMode = maintenanceMode;
      updated = true;
    }

    if (typeof registrationEnabled === "boolean" && config.registrationEnabled !== registrationEnabled) {
      config.registrationEnabled = registrationEnabled;
      actionDetails.registrationEnabled = registrationEnabled;
      updated = true;
    }

    if (maxMessageLength !== undefined && config.maxMessageLength !== maxMessageLength) {
      config.maxMessageLength = maxMessageLength;
      actionDetails.maxMessageLength = maxMessageLength;
      updated = true;
    }

    if (rateLimitThresholds) {
      config.rateLimitThresholds = { ...config.rateLimitThresholds, ...rateLimitThresholds };
      actionDetails.rateLimitThresholds = config.rateLimitThresholds;
      updated = true;
    }

    if (featureFlags) {
      config.featureFlags = { ...config.featureFlags, ...featureFlags };
      actionDetails.featureFlags = config.featureFlags;
      updated = true;
    }

    if (globalAnnouncement) {
      config.globalAnnouncement = { ...config.globalAnnouncement, ...globalAnnouncement };
      actionDetails.globalAnnouncement = config.globalAnnouncement;
      updated = true;
    }

    if (updated) {
      await config.save();
      await logAdminAction(req, "UPDATE_SYSTEM_CONFIG", "System", "Config", actionDetails);
      
      // Emit event for real-time config updates (if needed later)
      // systemEmitter.emit('config_updated', actionDetails);
    }

    return res.status(200).json({ success: true, config, message: "System configuration updated" });
  } catch (error) {
    console.error("[AdminSystem] Error updating config:", error);
    res.status(500).json({ success: false, message: "Server error updating config" });
  }
};

export const getSystemTelemetry = async (req, res) => {
  try {
    const dbStatus = mongoose.connection.readyState === 1 ? "OPERATIONAL" : "DEGRADED";
    
    let redisStatus = "UNAVAILABLE";
    if (isRedisAvailable && pubClient) {
      try {
        await pubClient.ping();
        redisStatus = "OPERATIONAL";
      } catch (e) {
        redisStatus = "DEGRADED";
      }
    }

    // Since we can't easily ping cloudinary without an API call, we assume operational if env vars exist
    const cloudinaryStatus = (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY) ? "OPERATIONAL" : "UNCONFIGURED";

    return res.status(200).json({
      success: true,
      health: [
        { name: "Database (MongoDB)", status: dbStatus },
        { name: "Redis Cache", status: redisStatus },
        { name: "Cloudinary Media", status: cloudinaryStatus },
        { name: "Socket.IO", status: "OPERATIONAL" }, // Process is running
      ]
    });
  } catch (error) {
    console.error("[AdminSystem] Error fetching telemetry:", error);
    res.status(500).json({ success: false, message: "Server error fetching telemetry" });
  }
};

export const getInsights = async (req, res) => {
  try {
    const insights = insightsEngine.getInsights();
    return res.status(200).json({ success: true, insights });
  } catch (error) {
    console.error("[AdminSystem] Error fetching insights:", error);
    res.status(500).json({ success: false, message: "Server error fetching insights" });
  }
};
