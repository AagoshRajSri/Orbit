import express from "express";
import rateLimit from "express-rate-limit";
import {
  createNexus,
  joinNexus,
  getMyNexuses,
  getNexus,
  getNexusMessages,
  sendNexusMessage,
  updateNexus,
  removeNexusMember,
  leaveNexus,
  checkMembership,
  deleteNexus,
  publishSenderKeyDistributions,
  getSenderKeyDistributions,
  getMemberPublicKeys,
} from "../controllers/nexus.controller.js";

import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

const nexusWriteLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: "RATE_LIMIT", message: "Too many nexus write requests. Please slow down." } },
});

const nexusSendLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: "RATE_LIMIT", message: "Too many messages. Please slow down." } },
});

router.use(protectRoute);

router.post("/create", nexusWriteLimiter, createNexus);
router.post("/join", nexusWriteLimiter, joinNexus);
router.get("/my", getMyNexuses);
router.get("/:nexusId/check-membership", checkMembership);
router.get("/:nexusId", getNexus);
router.get("/:nexusId/messages", getNexusMessages);
router.post("/:nexusId/send", nexusSendLimiter, sendNexusMessage);
router.patch("/:nexusId/leave", nexusWriteLimiter, leaveNexus);
router.patch("/:nexusId/remove-member", nexusWriteLimiter, removeNexusMember);
router.patch("/:nexusId", nexusWriteLimiter, updateNexus);
router.delete("/:nexusId", nexusWriteLimiter, deleteNexus);

// ── Sender Key Distribution routes ────────────────────────────────────────────
router.get("/:nexusId/member-keys", getMemberPublicKeys);
router.get("/:nexusId/sender-keys", getSenderKeyDistributions);
router.post("/:nexusId/sender-keys", nexusWriteLimiter, publishSenderKeyDistributions);

export default router;

