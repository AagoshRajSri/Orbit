import express from "express";
import rateLimit from "express-rate-limit";
import {
  login,
  logout,
  signup,
  updateProfile,
  deleteAccount,
  checkAuth,
  getContacts,
  addContact,
  removeContact,
  renameContact,
  forgotPassword,
  verifyPasswordOTP,
  resetPassword,
  constellationChallenge,
  constellationSignup,
  constellationLogin,
} from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { validateRequestBody } from "../middleware/validation.middleware.js";
import {
  constellationSignupSchema,
  constellationLoginSchema,
} from "../schemas/constellation.schemas.js";

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: "Too many attempts, please try again later",
});

// Basic Auth
router.post("/signup", authLimiter, signup);
router.post("/login", authLimiter, login);
router.post("/logout", logout);

// Profile & Contacts
router.put("/update-profile", protectRoute, updateProfile);
router.delete("/delete-account", protectRoute, deleteAccount);
router.get("/check", protectRoute, checkAuth);
router.get("/contacts", protectRoute, getContacts);
router.post("/contacts", protectRoute, addContact);
router.delete("/contacts/:contactId", protectRoute, removeContact);
router.put("/contacts/:contactId", protectRoute, renameContact);

// Password Reset
router.post("/forgot-password", authLimiter, forgotPassword);
router.post("/verify-otp", authLimiter, verifyPasswordOTP);
router.post("/reset-password", authLimiter, resetPassword);

// Constellation Auth (Legacy/Experimental)
router.get("/constellation/challenge", constellationChallenge);
router.post(
  "/constellation/signup",
  validateRequestBody(constellationSignupSchema),
  constellationSignup
);
router.post(
  "/constellation/login",
  validateRequestBody(constellationLoginSchema),
  constellationLogin
);

export default router;
