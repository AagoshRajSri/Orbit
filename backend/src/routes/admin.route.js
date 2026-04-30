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

const router = express.Router();

// Auth Routes
router.post("/login", adminLogin);
router.post("/logout", adminLogout);
router.get("/check", protectAdminRoute, checkAdminAuth);

// Dashboard Routes
router.get("/dashboard/stats", protectAdminRoute, getDashboardStats);

// User Routes
router.get("/users", protectAdminRoute, getUsers);
router.post("/users/:userId/force-logout", protectAdminRoute, forceLogoutUser);
router.post("/users/:userId/toggle-ban", protectAdminRoute, toggleBanUser);
router.delete("/users/:userId", protectAdminRoute, deleteUser);
router.post("/users/:userId/restore", protectAdminRoute, restoreUser);

// Message Routes
router.get("/messages", protectAdminRoute, getMessages);
router.delete("/messages/:messageId", protectAdminRoute, deleteMessage);
router.post("/messages/:messageId/restore", protectAdminRoute, restoreMessage);

// Nexus Routes
router.get("/nexuses", protectAdminRoute, getNexuses);
router.delete("/nexuses/:nexusId", protectAdminRoute, deleteNexus);
router.post("/nexuses/:nexusId/restore", protectAdminRoute, restoreNexus);

// Security Routes
router.get("/security/logs", protectAdminRoute, getAuditLogs);

// System Routes
router.get("/system/config", protectAdminRoute, getSystemConfig);
router.put("/system/config", protectAdminRoute, updateSystemConfig);
router.get("/system/telemetry", protectAdminRoute, getSystemTelemetry);
router.get("/system/insights", protectAdminRoute, getInsights);

// Broadcast Routes
router.post("/broadcast/notification", protectAdminRoute, sendNotification);
router.post("/broadcast/system-message", protectAdminRoute, sendSystemMessage);
router.post("/broadcast/email", protectAdminRoute, sendEmailBroadcast);

export default router;
