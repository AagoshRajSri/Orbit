import AppConfig from "../models/config.model.js";

// Ensure a config document exists on startup
export const initializeConfig = async () => {
  try {
    const configCount = await AppConfig.countDocuments();
    if (configCount === 0) {
      await AppConfig.create({
        maintenanceMode: false,
        registrationEnabled: true,
      });
      console.log("[Config] Initialized default application configuration");
    }
  } catch (error) {
    console.error("[Config] Error initializing configuration:", error.message);
  }
};
