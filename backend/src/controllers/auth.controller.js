import { generateToken } from "../lib/utils.js";
import User from "../models/user.model.js";
import Session from "../models/session.model.js";
import cloudinary from "../lib/cloudinary.js";
import bcrypt from "bcryptjs";
import { generateOTP, storeOTP, verifyOTP, clearOTP } from "../lib/otp.js";
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
  const { username, email, password } = req.body;
  let savedUser = null;

  try {
    const validation = z.object({
      username: usernameSchema,
      email: emailSchema,
      password: passwordSchema,
    }).safeParse({ username, email, password });

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
    });

    savedUser = await newUser.save();

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

    res.status(201).json({
      success: true,
      data: {
        _id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        profilePic: newUser.profilePic,
        createdAt: newUser.createdAt,
        updatedAt: newUser.updatedAt,
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
      return res.status(401).json({
        success: false,
        error: { code: "INVALID_CREDENTIALS", message: "Invalid credentials" },
      });
    }

    const isPasswordValid = await bcrypt.compare(validation.data.password, user.password);
    if (!isPasswordValid) {
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
        authToken: tokens.accessToken,
        sessionId: tokens.sessionId
      },
      message: "Login successful",
    });
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
    const { profilePic, username, email, bio } = req.body;
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
    const { contactId } = req.body;

    if (!contactId) {
      return res.status(400).json({ message: "Contact ID is required" });
    }

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
    const { alias } = req.body;

    if (typeof alias !== "string") {
      return res.status(400).json({ message: "Alias is required" });
    }

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
        constellationHash,
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
    const { email } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ message: "No account found with this email" });
    }

    // Generate and store OTP
    const otp = generateOTP();
    storeOTP(email, otp);

    // In development, we just log the OTP to console
    // In production, you would send via email
    console.log(`[OTP] Sent to ${email}: ${otp}`);

    res.status(200).json({
      message: "OTP sent to your email",
      // Remove in production
      ...(process.env.NODE_ENV === "development" && { otp }),
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
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    // Verify OTP
    if (!verifyOTP(email, otp)) {
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

    if (!verifyOTP(validation.data.email, validation.data.otp)) {
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

    clearOTP(validation.data.email);

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
    const pwdSalt = await bcrypt.genSalt(10);
    const hashedDummyPassword = await bcrypt.hash(dummyPassword, pwdSalt);

    savedUser = await new User({
      username,
      email,
      password: hashedDummyPassword,
    }).save();

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
      _id: savedUser._id,
      username: savedUser.username,
      email: savedUser.email,
      profilePic: savedUser.profilePic,
      createdAt: savedUser.createdAt,
      authToken: tokens.accessToken,
      constellationHash: patternHash,
      message: "Constellation identity sealed.",
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
      _id: user._id,
      username: user.username,
      email: user.email,
      profilePic: user.profilePic,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      authToken: tokens.accessToken,
      constellationHash: profile.patternHash,
      message: "Constellation identity verified.",
      ...(behaviorWarning && { behaviorWarning: true }),
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
