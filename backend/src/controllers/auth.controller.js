import { generateToken } from "../lib/utils.js";
import User from "../models/user.model.js";
import Session from "../models/session.model.js";
import cloudinary from "../lib/cloudinary.js";
import bcrypt from "bcryptjs";
import { generateOTP, storeOTP, verifyOTP, clearOTP } from "../lib/otp.js";
import { sendOTP } from "../lib/mailer.js";
import crypto from "crypto";
import { z } from "zod";
import ConstellationProfile from "../models/constellationProfile.model.js";
import {
  buildCanonicalPattern,
  generateSalt,
  hashPattern,
  verifyPattern,
  checkLockout,
  recordFailure,
  recordSuccess,
  updateBehavioralProfile,
  isBehaviorAcceptable,
  recordIpFailure,
  resetIpFailures,
  IP_BLOCK_THRESHOLD,
} from "../services/constellation.service.js";
import { issueNonce, consumeNonce } from "../lib/nonceStore.js";
import securityService from "../services/security.service.js";
import AppConfig from "../models/config.model.js";
import { systemEmitter } from "../lib/systemEmitter.js";

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character");

const emailSchema = z.string().email("Invalid email format");

const usernameSchema = z
  .string()
  .min(3, "Username must be at least 3 characters")
  .max(30, "Username must be at most 30 characters")
  .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores");

export const signup = async (req, res) => {
  const { username, email, password, telegramId } = req.body;
  let savedUser = null;

  try {
    const config = await AppConfig.findOne();
    if (config && !config.registrationEnabled) {
      return res.status(403).json({
        success: false,
        error: { code: "REGISTRATION_DISABLED", message: "Registrations are currently disabled by the administrator." },
      });
    }

    const validation = z.object({
      username: usernameSchema,
      email: emailSchema,
      password: passwordSchema,
      telegramId: z.string().optional(),
    }).safeParse({ username, email, password, telegramId });

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Validation failed",
          details: validation.error.issues.map(e => ({ field: e.path.join("."), message: e.message })),
        },
      });
    }

    const existingEmail = await User.findOne({ email: validation.data.email });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        error: { code: "EMAIL_EXISTS", message: "Email already exists" },
      });
    }

    const existingUser = await User.findOne({ username: validation.data.username });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: { code: "USERNAME_TAKEN", message: "Username already taken" },
      });
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(validation.data.password, salt);

    const newUser = new User({
      username: validation.data.username,
      email: validation.data.email,
      password: hashedPassword,
      telegramId: validation.data.telegramId || "",
    });

    savedUser = await newUser.save();

    const otp = generateOTP();
    await storeOTP(validation.data.email, otp);
    
    // Background the email/telegram dispatch
    const dispatchTo = validation.data.telegramId || validation.data.email;
    const method = validation.data.telegramId ? "telegram" : "email";
    
    sendOTP(dispatchTo, otp, "verification", method).then(mailResult => {
      if (!mailResult.success) {
        console.warn(`[Signup] Verification dispatch failed for ${dispatchTo}: ${mailResult.error}. OTP: ${otp}`);
      } else {
        console.log(`[Signup] Verification sent via ${method} to ${dispatchTo}`);
      }
    }).catch(err => console.error("[Signup] Dispatch error:", err.message));

    let tokens;
    try {
      tokens = await generateToken(newUser._id, req, res);
    } catch (tokenError) {
      console.error("Error generating token:", tokenError.message);
      if (savedUser) {
        await User.findByIdAndDelete(savedUser._id);
      }
      return res.status(500).json({
        success: false,
        error: { code: "TOKEN_ERROR", message: "Error generating authentication token" },
      });
    }

    systemEmitter.broadcast('user_signup', { username: newUser.username, email: newUser.email });

    res.status(201).json({
      success: true,
      data: {
        _id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        profilePic: newUser.profilePic,
        createdAt: newUser.createdAt,
        updatedAt: newUser.updatedAt,
        isEmailVerified: newUser.isEmailVerified,
        authToken: tokens.accessToken,
        sessionId: tokens.sessionId
      },
      message: "User registered successfully",
    });
  } catch (error) {
    console.error("Error in signup controller:", error.message);

    if (savedUser) {
      try {
        await User.findByIdAndDelete(savedUser._id);
      } catch (deleteError) {
        console.error("Error deleting user after signup failure:", deleteError.message);
      }
    }

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        error: { code: "DUPLICATE_KEY", message: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists` },
      });
    }

    res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: "Server error" },
    });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const validation = z.object({
      email: emailSchema,
      password: z.string().min(1, "Password is required"),
    }).safeParse({ email, password });

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Validation failed",
          details: validation.error.issues.map(e => ({ field: e.path.join("."), message: e.message })),
        },
      });
    }

    const user = await User.findOne({ email: validation.data.email });
    if (!user || !user.password) {
      systemEmitter.broadcast('login_failed', { email, reason: "invalid_user" }, "warning");
      return res.status(401).json({
        success: false,
        error: { code: "INVALID_CREDENTIALS", message: "Invalid credentials" },
      });
    }

    const isPasswordValid = await bcrypt.compare(validation.data.password, user.password);
    if (!isPasswordValid) {
      systemEmitter.broadcast('login_failed', { email, reason: "invalid_password" }, "warning");
      return res.status(401).json({
        success: false,
        error: { code: "INVALID_CREDENTIALS", message: "Invalid credentials" },
      });
    }

    let tokens;
    try {
      tokens = await generateToken(user._id, req, res);
    } catch (tokenError) {
      console.error("Error generating token:", tokenError.message);
      return res.status(500).json({
        success: false,
        error: { code: "TOKEN_ERROR", message: "Error generating authentication token" },
      });
    }

    res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        username: user.username,
        email: user.email,
        profilePic: user.profilePic,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        isEmailVerified: user.isEmailVerified,
        authToken: tokens.accessToken,
        sessionId: tokens.sessionId
      },
      message: "Login successful",
    });

    systemEmitter.broadcast('user_login', { userId: user._id, username: user.username, email: user.email });
  } catch (error) {
    console.error("Error in login controller:", error.message);
    res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: "Server error" },
    });
  }
};

export const logout = async (req, res) => {
  try {
    if (req.sessionId) {
      await Session.findOneAndUpdate(
        { sessionId: req.sessionId },
        { isValid: false }
      ).catch(() => {});
    }
  } catch (error) {
    console.error("Error invalidating session:", error);
  }

  res.clearCookie("jwt", {
    httpOnly: true,
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    secure: process.env.NODE_ENV === "production",
  });
  res.clearCookie("refresh_jwt", {
    httpOnly: true,
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/api/auth/refresh",
  });
  res.status(200).json({ success: true, message: "Logout successful" });
};

export const updateProfile = async (req, res) => {
  try {
    const updateProfileSchema = z.object({
      profilePic: z.string().regex(/^data:image\/(png|jpeg|jpg|webp);base64,/, "Only explicit PNG, JPEG, or WEBP base64 images are supported").optional(),
      username: z.string().min(2, "Username too short").max(50, "Username too long").trim().optional(),
      email: z.string().email("Invalid email").optional(),
      bio: z.string().max(500, "Bio too long").optional(),
      telegramId: z.string().optional(),
    });

    const parsed = updateProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid input data",
        errors: parsed.error.issues.map(e => ({ field: e.path.join("."), message: e.message })),
      });
    }

    const { profilePic, username, email, bio, telegramId } = parsed.data;
    const userId = req.user._id;

    const updater = {};

    if (profilePic) {
      try {
        const uploadResponse = await cloudinary.uploader.upload(profilePic);
        updater.profilePic = uploadResponse.secure_url;
      } catch (uploadError) {
        console.error(
          "Cloudinary upload failed in updateProfile:",
          uploadError.message,
        );
        return res.status(400).json({
          message:
            "Failed to upload profile picture. Please try again with a smaller image.",
          error:
            process.env.NODE_ENV === "development"
              ? uploadError.message
              : undefined,
        });
      }
    }

    if (username) updater.username = username;
    if (email) updater.email = email;
    if (typeof bio === "string") updater.bio = bio;
    if (typeof telegramId === "string") updater.telegramId = telegramId;

    if (Object.keys(updater).length === 0) {
      return res.status(400).json({ message: "No profile fields provided" });
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updater, {
      new: true,
      runValidators: true,
    });

    res.status(200).json(updatedUser);
  } catch (error) {
    console.error("error in update profile:", error);
    res.status(500).json({
      message: "internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

export const getContacts = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate(
      "contacts",
      "username profilePic email",
    );
    if (!user) return res.status(404).json({ message: "User not found" });

    const contactIds = user.contacts.map((contact) => contact._id.toString());
    const aliases = Object.fromEntries(user.contactAliases || []);

    res.status(200).json({ contacts: user.contacts, contactIds, aliases });
  } catch (error) {
    console.error("Error in getContacts:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const addContact = async (req, res) => {
  try {
    const userId = req.user._id;

    const contactSchema = z.object({
      contactId: z.string().min(1, "Contact ID is required"),
    });

    const parsed = contactSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid input data",
        errors: parsed.error.issues.map(e => ({ field: e.path.join("."), message: e.message })),
      });
    }

    const { contactId } = parsed.data;

    if (contactId === userId.toString()) {
      return res
        .status(400)
        .json({ message: "Cannot add yourself as a contact" });
    }

    const targetUser = await User.findById(contactId);
    if (!targetUser) return res.status(404).json({ message: "User not found" });

    const user = await User.findById(userId);
    if (!user.contacts.includes(contactId)) {
      user.contacts.push(contactId);
      await user.save();
    }

    const updated = await User.findById(userId).populate(
      "contacts",
      "username profilePic email",
    );
    res.status(200).json({
      contacts: updated.contacts,
      aliases: Object.fromEntries(updated.contactAliases || []),
    });
  } catch (error) {
    console.error("Error in addContact:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const removeContact = async (req, res) => {
  try {
    const userId = req.user._id;
    const { contactId } = req.params;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.contacts = user.contacts.filter(
      (id) => id.toString() !== contactId.toString(),
    );
    if (user.contactAliases?.has(contactId.toString())) {
      user.contactAliases.delete(contactId.toString());
    }
    await user.save();

    const updated = await User.findById(userId).populate(
      "contacts",
      "username profilePic email",
    );
    res.status(200).json({
      contacts: updated.contacts,
      aliases: Object.fromEntries(updated.contactAliases || []),
    });
  } catch (error) {
    console.error("Error in removeContact:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const renameContact = async (req, res) => {
  try {
    const userId = req.user._id;
    const { contactId } = req.params;

    const aliasSchema = z.object({
      alias: z.string().min(1, "Alias is required").max(50, "Alias too long").trim(),
    });

    const parsed = aliasSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid input data",
        errors: parsed.error.issues.map(e => ({ field: e.path.join("."), message: e.message })),
      });
    }

    const { alias } = parsed.data;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.contacts.includes(contactId)) {
      return res.status(400).json({ message: "Contact not in your list" });
    }

    user.contactAliases.set(contactId.toString(), alias);
    await user.save();

    const updated = await User.findById(userId).populate(
      "contacts",
      "username profilePic email",
    );
    res.status(200).json({
      contacts: updated.contacts,
      aliases: Object.fromEntries(updated.contactAliases || []),
    });
  } catch (error) {
    console.error("Error in renameContact:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteAccount = async (req, res) => {
  try {
    const userId = req.user._id;
    await User.findByIdAndDelete(userId);

    res.clearCookie("jwt", {
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      secure: process.env.NODE_ENV === "production",
    });
    res.status(200).json({ message: "Account deleted successfully" });
  } catch (error) {
    console.error("Error in deleteAccount controller:", error);
    res.status(500).json({
      message: "Could not delete account",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

export const checkAuth = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      console.warn("[checkAuth] req.user is missing or has no _id:", req.user);
      return res.status(401).json({ success: false, error: { code: "NOT_AUTHENTICATED", message: "User not authenticated" } });
    }

    const userObj = req.user.toObject ? req.user.toObject() : req.user;

    let constellationHash;
    try {
      const profile = await ConstellationProfile.findOne({ userId: req.user._id }).lean().select("+patternHash");
      constellationHash = profile ? profile.patternHash : undefined;
    } catch (profileError) {
      console.warn("[checkAuth] Could not fetch constellation profile:", profileError.message);
      constellationHash = undefined;
    }

    res.status(200).json({
      success: true,
      data: {
        ...userObj,
        hasConstellation: !!constellationHash,
        sessionId: req.sessionId,
      },
    });
  } catch (error) {
    console.error("Error in checkAuth controller:", {
      message: error.message,
      stack: error.stack,
      userId: req.user?._id,
    });
    res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: "Internal Server Error" },
    });
  }
};

// Forgot Password - Send OTP
export const forgotPassword = async (req, res) => {
  try {
    const emailSchemaObj = z.object({
      email: emailSchema, // Reusing global emailSchema from auth controller imports
    });

    const parsed = emailSchemaObj.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Valid email is required",
        errors: parsed.error.issues.map(e => ({ field: e.path.join("."), message: e.message })),
      });
    }

    const { email } = parsed.data;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ message: "No account found with this email" });
    }

    // Generate and store OTP
    const otp = generateOTP();
    await storeOTP(email, otp);

    // Background the dispatch
    const dispatchTo = user.telegramId || email;
    const method = user.telegramId ? "telegram" : "email";
    
    sendOTP(dispatchTo, otp, "reset", method).then(res => {
      if (!res.success) console.warn(`[Forgot Password] Dispatch failed: ${res.error}. OTP: ${otp}`);
    }).catch(err => console.error("[Forgot Password] Dispatch error:", err.message));

    res.status(200).json({
      success: true,
      message: `OTP sent to your ${method}`
    });
  } catch (error) {
    console.error("Error in forgotPassword controller:", error);
    res.status(500).json({
      message: "Failed to send OTP",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Verify OTP
export const verifyPasswordOTP = async (req, res) => {
  try {
    const otpSchema = z.object({
      email: emailSchema,
      otp: z.string().length(6, "OTP must be exactly 6 digits"),
    });

    const parsed = otpSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid input data",
        errors: parsed.error.issues.map(e => ({ field: e.path.join("."), message: e.message })),
      });
    }

    const { email, otp } = parsed.data;

    // Verify OTP
    if (!(await verifyOTP(email, otp))) {
      return res.status(401).json({ message: "Invalid or expired OTP" });
    }

    res.status(200).json({ message: "OTP verified successfully" });
  } catch (error) {
    console.error("Error in verifyPasswordOTP controller:", error);
    res.status(500).json({
      message: "Failed to verify OTP",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    const validation = z.object({
      email: emailSchema,
      otp: z.string().length(6, "OTP must be 6 digits"),
      newPassword: passwordSchema,
    }).safeParse({ email, otp, newPassword });

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Validation failed",
          details: validation.error.issues.map(e => ({ field: e.path.join("."), message: e.message })),
        },
      });
    }

    if (!(await verifyOTP(validation.data.email, validation.data.otp))) {
      return res.status(401).json({
        success: false,
        error: { code: "INVALID_OTP", message: "Invalid or expired OTP" },
      });
    }

    const user = await User.findOne({ email: validation.data.email });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: "USER_NOT_FOUND", message: "User not found" },
      });
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(validation.data.newPassword, salt);

    user.password = hashedPassword;
    await user.save();

    await Session.updateMany(
      { userId: user._id, isValid: true },
      { isValid: false }
    );

    await clearOTP(validation.data.email);

    res.status(200).json({
      success: true,
      message: "Password reset successfully. Please login with your new password.",
    });
  } catch (error) {
    console.error("Error in resetPassword controller:", error);
    res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: "Failed to reset password" },
    });
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    if (!(await verifyOTP(email, otp))) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.isEmailVerified = true;
    await user.save();

    res.status(200).json({ success: true, message: "Email verified successfully" });
  } catch (error) {
    console.error("Error in verifyEmail:", error);
    res.status(500).json({ message: "Failed to verify email" });
  }
};

export const resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ message: "Email is already verified" });
    }

    const otp = generateOTP();
    await storeOTP(email, otp);
    
    // Background dispatch
    const dispatchTo = user.telegramId || email;
    const method = user.telegramId ? "telegram" : "email";

    sendOTP(dispatchTo, otp, "verification", method).then(res => {
      if (!res.success) console.warn(`[Email Verification] Dispatch failed: ${res.error}. OTP: ${otp}`);
    }).catch(err => console.error("[Email Verification] Dispatch error:", err.message));

    res.status(200).json({ 
      success: true, 
      message: `Verification code sent via ${method}`
    });
  } catch (error) {
    console.error("Error in resendVerificationEmail:", error);
    res.status(500).json({ message: "Failed to send verification email" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Constellation Auth — Challenge / Signup / Login
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/auth/constellation/challenge
 * Issues a session-bound nonce that must be included in every
 * constellation signup or login request. Single-use, 2-min TTL.
 * Prevents replay attacks.
 */
export const constellationChallenge = (req, res) => {
  const ip = req.ip || req.headers["x-forwarded-for"] || "unknown";
  const ua = req.headers["user-agent"] || "unknown";
  const nonce = issueNonce(ip, ua);
  // TTL in ms returned so client can inform the user before it expires
  res.json({ nonce, expiresInMs: 120_000 });
};

/**
 * POST /api/auth/constellation/signup
 * Body: { username, email, edges, nonce }
 *   edges — ordered array of { from: "A2", to: "F1" } (label strings only, no coords)
 *   nonce — single-use challenge token from /challenge
 *
 * Stores: hashed_pattern, salt
 * Never stores: canonical string, edges, coordinates
 */
export const constellationSignup = async (req, res) => {
  const ip = req.ip || req.headers["x-forwarded-for"] || "unknown";
  const ua = req.headers["user-agent"] || "unknown";

  // Use Zod-validated data when available (set by validateRequestBody middleware)
  // Fallback to req.body for the legacy /constellation route.
  const { username, email, edges, nonce, selectedIcons } = req.validated ?? req.body;

  // ── IP block check ───────────────────────────────────────────────────────
  if (await securityService.isIpBlocked(ip)) {
    await securityService.logAuditEvent(
      null,
      "CONSTELLATION_SIGNUP_BLOCKED_IP",
      req,
      { ip },
    );
    return res.status(403).json({ message: "Access denied." });
  }

  // ── Validate nonce (replay protection) ──────────────────────────────────
  if (!consumeNonce(nonce, ip, ua)) {
    return res.status(400).json({
      message: "Invalid or expired challenge. Request a new one.",
    });
  }

  // ── Semantic edge validation (structural format guaranteed by Zod) ───────
  if (!Array.isArray(edges) || edges.length < 1) {
    return res.status(400).json({ message: "Pattern edges are required." });
  }

  let canonicalPattern;
  try {
    canonicalPattern = buildCanonicalPattern(edges);
  } catch (e) {
    return res.status(400).json({ message: `Invalid pattern: ${e.message}` });
  }

  let savedUser = null;
  try {
    // ── Duplicate checks ─────────────────────────────────────────────────
    if (await User.findOne({ email })) {
      return res.status(400).json({ message: "Email already exists." });
    }
    if (await User.findOne({ username })) {
      return res.status(400).json({ message: "Username already taken." });
    }

    // ── Create user (constellation-only accounts get a dummy unguessable password) ────────
    const dummyPassword = crypto.randomBytes(32).toString("hex");
    const pwdSalt = await bcrypt.genSalt(12);
    const hashedDummyPassword = await bcrypt.hash(dummyPassword, pwdSalt);

    savedUser = await new User({
      username,
      email,
      password: hashedDummyPassword,
    }).save();

    // Generate and store email verification OTP
    const otp = generateOTP();
    await storeOTP(email, otp);
    
    // Background dispatch constellation verification email
    sendOTP(email, otp).then(res => {
      if (!res.success) console.warn(`[Constellation Signup] Email failed: ${res.error}. OTP: ${otp}`);
    }).catch(err => console.error("[Constellation Signup] Email error:", err.message));

    // ── Hash pattern with Argon2id + salt + pepper ───────────────────────
    const salt = generateSalt();
    const patternHash = await hashPattern(canonicalPattern, salt);

    // ── Validate selectedIcons (should be an array of icon names) ─────────
    const iconsToStore = Array.isArray(selectedIcons) ? selectedIcons : [];

    // ── Persist profile (NEVER the raw pattern or canonical string) ──────
    await ConstellationProfile.create({
      userId: savedUser._id,
      patternHash,
      salt,
      selectedIcons: iconsToStore,
    });

    // ── Issue JWT ────────────────────────────────────────────────────────
    let tokens;
    try {
      tokens = await generateToken(savedUser._id, req, res);
    } catch (tokenError) {
      await User.findByIdAndDelete(savedUser._id);
      await ConstellationProfile.deleteOne({ userId: savedUser._id });
      return res.status(500).json({ message: "Token generation failed." });
    }

    // ── Audit log success ────────────────────────────────────────────────
    await securityService.logAuditEvent(
      savedUser._id,
      "CONSTELLATION_SIGNUP_SUCCESS",
      req,
      { username },
      0,
    );

    return res.status(201).json({
      success: true,
      data: {
        _id: savedUser._id,
        username: savedUser.username,
        email: savedUser.email,
        profilePic: savedUser.profilePic,
        createdAt: savedUser.createdAt,
        updatedAt: savedUser.updatedAt,
        authToken: tokens.accessToken,
        sessionId: tokens.sessionId,
      },
      message: "Constellation identity sealed ✦",
    });
  } catch (error) {
    // Clean up on any failure
    if (savedUser) {
      await User.findByIdAndDelete(savedUser._id).catch(() => {});
      await ConstellationProfile.deleteOne({ userId: savedUser._id }).catch(
        () => {},
      );
    }
    await securityService.logAuditEvent(
      null,
      "CONSTELLATION_SIGNUP_ERROR",
      req,
      {
        error: error.message,
      },
      20,
    );
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0] || "field";
      return res.status(400).json({
        message: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists.`,
      });
    }
    console.error("[constellationSignup]", error.message);
    return res.status(500).json({
      message: "Signup failed.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};


/**
 * POST /api/auth/constellation/login
 * Body: { email, edges, nonce, behavioral? }
 *   edges      — same ordered edge list the user drew
 *   nonce      — single-use challenge token
 *   behavioral — optional { drawDurationMs, timingVarianceMs }
 *
 * Verification:
 *  1. Consume nonce (replay protection)
 *  2. Check per-user lockout
 *  3. Rebuild canonical pattern from edges
 *  4. Re-apply salt + pepper, run Argon2id verify (constant-time)
 *  5. Check behavioral profile deviation
 *  6. Issue JWT on success, record failure + lockout on failure
 */
export const constellationLogin = async (req, res) => {
  const ip = req.ip || req.headers["x-forwarded-for"] || "unknown";
  const ua = req.headers["user-agent"] || "unknown";

  // Use Zod-validated (and normalised) data when available
  const { email, username, edges, nonce, behavioral } = req.validated ?? req.body;

  // ── IP block check ───────────────────────────────────────────────────────
  if (await securityService.isIpBlocked(ip)) {
    await securityService.logAuditEvent(
      null,
      "CONSTELLATION_LOGIN_BLOCKED_IP",
      req,
      { ip },
    );
    return res.status(403).json({ message: "Access denied." });
  }

  // ── Validate nonce (replay protection) ───────────────────────────────────
  if (!consumeNonce(nonce, ip, ua)) {
    return res.status(400).json({
      message: "Invalid or expired challenge. Request a new one.",
    });
  }

  if ((!email && !username) || !Array.isArray(edges) || edges.length < 1) {
    return res
      .status(400)
      .json({ message: "Email or username and pattern edges are required." });
  }

  try {
    // ── Find user by email or username ─────────────────────────────────────
    let user;
    if (username) {
      // Search by username (case-insensitive)
      user = await User.findOne({
        username: { $regex: `^${username}$`, $options: "i" },
      });
    } else {
      // Search by email (for backwards compatibility)
      user = await User.findOne({ email });
    }

    if (!user) {
      // Record IP failure even on unknown user — prevents user-enumeration via timing
      const ipCount = recordIpFailure(ip);
      if (ipCount >= IP_BLOCK_THRESHOLD) {
        await securityService.blockIp(
          ip,
          "Excessive constellation auth failures",
          60,
        );
      }
      // Generic message — do not leak whether the account exists
      return res.status(401).json({ message: "Authentication failed." });
    }

    if (!user.isEmailVerified) {
      return res.status(403).json({ message: "Please verify your email to log in." });
    }

    // ── Per-user lockout check ────────────────────────────────────────────
    const lockout = await checkLockout(user._id);
    if (lockout.locked) {
      const retryInSec = Math.ceil(lockout.retryAfterMs / 1000);
      return res.status(429).json({
        message: `Account locked. Try again in ${retryInSec}s.`,
        retryAfterMs: lockout.retryAfterMs,
      });
    }

    // ── Load profile (select secret fields explicitly) ────────────────────
    const profile = await ConstellationProfile.findOne({
      userId: user._id,
    }).select("+patternHash +salt behavioral failedAttempts lockedUntil");
    if (!profile) {
      return res.status(401).json({ message: "Authentication failed." });
    }

    // ── Build canonical pattern from this login attempt ───────────────────
    let canonicalPattern;
    try {
      canonicalPattern = buildCanonicalPattern(edges);
    } catch {
      await recordFailure(user._id);
      recordIpFailure(ip);
      return res.status(400).json({ message: "Invalid pattern format." });
    }

    // ── Constant-time Argon2id verification ──────────────────────────────
    const patternOk = await verifyPattern(
      canonicalPattern,
      profile.salt,
      profile.patternHash,
    );

    if (!patternOk) {
      await recordFailure(user._id);

      // ── IP-level failure tracking & auto-block ──────────────────────────
      const ipCount = recordIpFailure(ip);
      const riskScore = securityService.evaluateRisk(ip, ua, ipCount);

      if (ipCount >= IP_BLOCK_THRESHOLD) {
        await securityService.blockIp(
          ip,
          "Excessive constellation auth failures",
          60,
        );
        console.warn(
          `[constellation] Auto-blocked IP ${ip} after ${ipCount} failures`,
        );
      }

      // Audit log the failure (no pattern data logged)
      await securityService.logAuditEvent(
        user._id,
        "CONSTELLATION_LOGIN_FAILED",
        req,
        { ipFailureCount: ipCount },
        riskScore,
      );

      const newLockout = await checkLockout(user._id);
      if (newLockout.locked) {
        return res.status(429).json({
          message: `Too many failed attempts. Locked for ${Math.ceil(newLockout.retryAfterMs / 1000)}s.`,
          retryAfterMs: newLockout.retryAfterMs,
        });
      }
      return res.status(401).json({ message: "Authentication failed." });
    }

    // ── Behavioral deviation check (advisory — does not hard-block) ───────
    let behaviorWarning = false;
    if (behavioral && typeof behavioral.drawDurationMs === "number") {
      if (!isBehaviorAcceptable(profile, behavioral)) {
        behaviorWarning = true;
        console.warn(`[constellation] Behavioral anomaly for user ${user._id}`);
      }
      // Update the running behavioral profile (no raw data stored)
      await updateBehavioralProfile(user._id, behavioral);
    }

    // ── Reset counters on success ─────────────────────────────────────────
    await recordSuccess(user._id);
    resetIpFailures(ip); // Clear per-IP counter — legitimate user confirmed

    // ── Audit log success ─────────────────────────────────────────────────
    await securityService.logAuditEvent(
      user._id,
      "CONSTELLATION_LOGIN_SUCCESS",
      req,
      { behaviorWarning },
      0,
    );

    // ── Issue JWT ─────────────────────────────────────────────────────────
    let tokens;
    try {
      tokens = await generateToken(user._id, req, res);
    } catch (tokenError) {
      console.error("Error generating token:", tokenError.message);
      return res.status(500).json({ message: "Token generation failed." });
    }

    return res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        username: user.username,
        email: user.email,
        profilePic: user.profilePic,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        authToken: tokens.accessToken,
        sessionId: tokens.sessionId,
        hasConstellation: true,
        ...(behaviorWarning && { behaviorWarning: true }),
      },
      message: "Constellation identity verified.",
    });
  } catch (error) {
    console.error("[constellationLogin]", error.message);
    await securityService.logAuditEvent(
      null,
      "CONSTELLATION_LOGIN_ERROR",
      req,
      {
        error: error.message,
      },
      30,
    );
    return res.status(500).json({
      message: "Login failed.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Keep legacy export name for any consumer that hasn't migrated yet
export const constellationAuth = constellationLogin;
