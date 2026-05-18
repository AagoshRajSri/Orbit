import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  getVault,
  upsertVault,
  getManifestTail,
  revokeDevice,
} from "../controllers/keyVault.controller.js";

const router = express.Router();

// All routes require authentication
router.use(protectRoute);

// ── Vault CRUD ────────────────────────────────────────────────────────────────
router.get("/",                    getVault);
router.put("/",                    upsertVault);

// ── Sync manifest tail (for chain verification) ───────────────────────────────
router.get("/manifest",            getManifestTail);

// ── Device trust management ───────────────────────────────────────────────────
router.delete("/device/:deviceId", revokeDevice);

export default router;
