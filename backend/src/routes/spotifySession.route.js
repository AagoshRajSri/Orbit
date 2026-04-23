import express from "express";
import {
  createSession,
  getSession,
  joinSession,
  leaveSession,
  getUserSessions,
  transferHost,
  toggleGhostMode,
} from "../controllers/spotifySession.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

// Session management
router.post("/create", protectRoute, createSession);
router.get("/:sessionId", getSession);
router.post("/join", protectRoute, joinSession);
router.post("/leave", protectRoute, leaveSession);
router.get("/user/sessions", protectRoute, getUserSessions);

// Host & mode control
router.post("/transfer-host", protectRoute, transferHost);
router.post("/toggle-ghost", protectRoute, toggleGhostMode);

export default router;
