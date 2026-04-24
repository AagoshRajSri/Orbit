import express from "express";
import { loginLimiter, signupLimiter, apiLimiter } from "../middleware/rate-limit.middleware.js";
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
} from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { validateRequestBody } from "../middleware/validation.middleware.js";
import {
  constellationSignupSchema,
  constellationLoginSchema,
} from "../schemas/constellation.schemas.js";

const router = express.Router();



// Basic Auth
router.post("/signup", signupLimiter, signup);
router.post("/login", loginLimiter, login);
router.post("/logout", logout);

// Email Verification
router.post("/verify-email", loginLimiter, verifyEmail);
router.post("/resend-verification", loginLimiter, resendVerificationEmail);

// Profile & Contacts
router.put("/update-profile", protectRoute, updateProfile);
router.delete("/delete-account", protectRoute, deleteAccount);
router.get("/check", protectRoute, checkAuth);
router.get("/contacts", protectRoute, getContacts);
router.post("/contacts", protectRoute, addContact);
router.delete("/contacts/:contactId", protectRoute, removeContact);
router.put("/contacts/:contactId", protectRoute, renameContact);

// Password Reset
router.post("/forgot-password", loginLimiter, forgotPassword);
router.post("/verify-otp", loginLimiter, verifyPasswordOTP);
router.post("/reset-password", loginLimiter, resetPassword);

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
