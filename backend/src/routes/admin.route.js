import express from "express";
import { adminLogin, adminLogout, checkAdminAuth } from "../controllers/admin.auth.controller.js";
import { getDashboardStats } from "../controllers/admin.dashboard.controller.js";
import { getUsers, forceLogoutUser, toggleBanUser, deleteUser, restoreUser } from "../controllers/admin.user.controller.js";
import { getMessages, deleteMessage, restoreMessage } from "../controllers/admin.message.controller.js";
import { getNexuses, deleteNexus, restoreNexus } from "../controllers/admin.nexus.controller.js";
import { getAuditLogs } from "../controllers/admin.security.controller.js";
import { getSystemConfig, updateSystemConfig, getSystemTelemetry, getInsights } from "../controllers/admin.system.controller.js";
import { sendNotification, sendSystemMessage, sendEmailBroadcast } from "../controllers/admin.broadcast.controller.js";
import { protectAdminRoute } from "../middleware/admin.middleware.js";
import { loginLimiter, apiLimiter } from "../middleware/rate-limit.middleware.js";

const router = express.Router();

// Auth Routes (Public or specific limiting)
router.post("/login", loginLimiter, adminLogin);
router.post("/logout", adminLogout);

// Secure Admin Route Consolidation (Zero-Trust + Rate-Limited)
router.use(protectAdminRoute);
router.use(apiLimiter);

// Auth check
router.get("/check", checkAdminAuth);

// Dashboard Routes
router.get("/dashboard/stats", getDashboardStats);

// User Routes
router.get("/users", getUsers);
router.post("/users/:userId/force-logout", forceLogoutUser);
router.post("/users/:userId/toggle-ban", toggleBanUser);
router.delete("/users/:userId", deleteUser);
router.post("/users/:userId/restore", restoreUser);

// Message Routes
router.get("/messages", getMessages);
router.delete("/messages/:messageId", deleteMessage);
router.post("/messages/:messageId/restore", restoreMessage);

// Nexus Routes
router.get("/nexuses", getNexuses);
router.delete("/nexuses/:nexusId", deleteNexus);
router.post("/nexuses/:nexusId/restore", restoreNexus);

// Security Routes
router.get("/security/logs", getAuditLogs);

// System Routes
router.get("/system/config", getSystemConfig);
router.put("/system/config", updateSystemConfig);
router.get("/system/telemetry", getSystemTelemetry);
router.get("/system/insights", getInsights);

// Broadcast Routes
router.post("/broadcast/notification", sendNotification);
router.post("/broadcast/system-message", sendSystemMessage);
router.post("/broadcast/email", sendEmailBroadcast);

export default router;

