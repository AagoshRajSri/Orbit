import express from "express";
import AppConfig from "../models/config.model.js";

const router = express.Router();

router.get("/public", async (req, res) => {
  try {
    const config = await AppConfig.findOne().select("maintenanceMode registrationEnabled globalAnnouncement maxMessageLength featureFlags");
    if (!config) {
      return res.status(404).json({ success: false, message: "Config not found" });
    }
    return res.status(200).json({ success: true, config });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error fetching public config" });
  }
});

export default router;
