import express from "express";
import { loginLimiter, signupLimiter, apiLimiter, passwordResetLimiter } from "../middleware/rate-limit.middleware.js";
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
  verifyEmail,
  resendVerificationEmail,
  constellationChallenge,
  constellationSignup,
  constellationLogin,
  updatePublicKey,
  validateHandle,
  acceptContact,
  rejectContact,
  blockContact,
  unblockContact,
} from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { validateRequestBody } from "../middleware/validation.middleware.js";
import {
  constellationSignupSchema,
  constellationLoginSchema,
} from "../schemas/constellation.schemas.js";
import { refreshAccessToken } from "../lib/utils.js";

const router = express.Router();



// Basic Auth
router.get("/validate-handle", apiLimiter, validateHandle);
router.post("/signup", signupLimiter, signup);
router.post("/login", loginLimiter, login);
router.post("/logout", logout);
router.post("/refresh", refreshAccessToken);

// Email Verification
router.post("/verify-email", loginLimiter, verifyEmail);
router.post("/resend-verification", loginLimiter, resendVerificationEmail);

// Profile & Contacts
router.put("/update-profile", protectRoute, updateProfile);
router.put("/update-public-key", protectRoute, updatePublicKey);
router.delete("/delete-account", protectRoute, deleteAccount);
router.get("/check", protectRoute, checkAuth);
router.get("/contacts", protectRoute, getContacts);
router.post("/contacts", protectRoute, addContact);
router.post("/contacts/:contactId/accept", protectRoute, acceptContact);
router.post("/contacts/:contactId/reject", protectRoute, rejectContact);
router.post("/contacts/:contactId/block", protectRoute, blockContact);
router.post("/contacts/:contactId/unblock", protectRoute, unblockContact);
router.delete("/contacts/:contactId", protectRoute, removeContact);
router.put("/contacts/:contactId", protectRoute, renameContact);

// Password Reset
router.post("/forgot-password", passwordResetLimiter, forgotPassword);
router.post("/verify-otp", passwordResetLimiter, verifyPasswordOTP);
router.post("/reset-password", passwordResetLimiter, resetPassword);

// Constellation Auth
router.get("/constellation/challenge", apiLimiter, constellationChallenge);
router.post(
  "/constellation/signup",
  signupLimiter,
  validateRequestBody(constellationSignupSchema),
  constellationSignup
);
router.post(
  "/constellation/login",
  loginLimiter,
  validateRequestBody(constellationLoginSchema),
  constellationLogin
);

export default router;
