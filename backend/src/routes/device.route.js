import express from "express";
import rateLimit from "express-rate-limit";
import {
  registerDevice,
  listDevices,
  revokeDevice,
  trustDevice,
  checkDevice,
} from "../controllers/device.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

import { deviceRegisterLimiter } from "../middleware/rate-limit.middleware.js";

// All device routes require authentication
router.use(protectRoute);

// Register or update device
router.post("/register", deviceRegisterLimiter, registerDevice);

// List all devices for current user
router.get("/", listDevices);

// Check a specific device's trust status
router.get("/check/:deviceId", checkDevice);

// Revoke a device
router.delete("/:deviceId", revokeDevice);

// Trust a device
router.patch("/:deviceId/trust", trustDevice);

export default router;
