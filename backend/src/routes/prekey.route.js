import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { prekeyLimiter } from "../middleware/rate-limit.middleware.js";
import {
  publishPrekeyBundle,
  replenishOneTimePrekeys,
  getPrekeyBundle,
  getPrekeyStatus,
  publishHybridBundle,
} from "../controllers/prekey.controller.js";

const router = express.Router();

// All prekey routes require authentication
router.use(protectRoute);

// Apply rate limiting to all bundle generation endpoints
router.use("/bundle", prekeyLimiter);
router.use("/replenish", prekeyLimiter);
router.use("/hybrid-bundle", prekeyLimiter);

// Publish or rotate the caller's full prekey bundle (X3DH)
router.post("/bundle", publishPrekeyBundle);

// Add more one-time prekeys without a full rotation
router.post("/replenish", replenishOneTimePrekeys);

// Fetch another user's prekey bundle to initiate X3DH (pops one OPK)
router.get("/bundle/:userId", getPrekeyBundle);

// Check own OPK count / bundle status (includes hybridKem info)
router.get("/status", getPrekeyStatus);

// Phase 4: Publish hybrid KEM (P-256 + ML-KEM-768) public keys
router.post("/hybrid-bundle", publishHybridBundle);

export default router;
