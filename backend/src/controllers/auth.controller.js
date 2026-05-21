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
import { sanitizeForOrbit } from "../lib/obfuscation.js";

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
  .max(20, "Username must be at most 20 characters")
  .regex(/^[a-z0-9_]+$/, "Username can only contain lowercase letters, numbers, and underscores");

// Homoglyph map for standard lookalike Latin, Cyrillic, Greek and numeric spoofing characters
const homoglyphMap = {
  // Cyrillic
  'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'i', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 'c', 'т': 't', 'у': 'y', 'ф': 'f', 'х': 'x', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'shch', 'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
  // Greek
  'α': 'a', 'β': 'b', 'γ': 'g', 'δ': 'd', 'ε': 'e', 'ζ': 'z', 'η': 'h', 'θ': 'th', 'ι': 'i', 'κ': 'k', 'λ': 'l', 'μ': 'm', 'ν': 'v', 'ξ': 'x', 'ο': 'o', 'π': 'p', 'ρ': 'r', 'σ': 's', 'τ': 't', 'υ': 'y', 'φ': 'ph', 'χ': 'ch', 'ψ': 'ps', 'ω': 'o',
  // Leetspeak / Visual number replacements
  '0': 'o', '1': 'i', 'l': 'i', '3': 'e', '4': 'a', '5': 's', '7': 't', '8': 'b', '9': 'g', '@': 'a', '$': 's'
};

const dehomoglyph = (str) => {
  if (!str) return "";
  return str.normalize("NFC").split('').map(char => homoglyphMap[char] || char.toLowerCase()).join('');
};

// Calculate normalized Jaro-Winkler similarity (highly resilient typographic string comparison)
const getJaroWinklerSimilarity = (s1, s2) => {
  if (s1 === s2) return 1.0;

  const len1 = s1.length;
  const len2 = s2.length;
  if (len1 === 0 || len2 === 0) return 0.0;

  const matchWindow = Math.floor(Math.max(len1, len2) / 2) - 1;
  const match1 = new Array(len1).fill(false);
  const match2 = new Array(len2).fill(false);

  let matches = 0;
  let transpositions = 0;

  for (let i = 0; i < len1; i++) {
    const start = Math.max(0, i - matchWindow);
    const end = Math.min(len2, i + matchWindow + 1);

    for (let j = start; j < end; j++) {
      if (match2[j]) continue;
      if (s1[i] === s2[j]) {
        match1[i] = true;
        match2[j] = true;
        matches++;
        break;
      }
    }
  }

  if (matches === 0) return 0.0;

  let k = 0;
  for (let i = 0; i < len1; i++) {
    if (!match1[i]) continue;
    while (!match2[k]) k++;
    if (s1[i] !== s2[k]) transpositions++;
    k++;
  }

  const jaro = (matches / len1 + matches / len2 + (matches - transpositions / 2) / matches) / 3.0;

  // Winkler modifications
  let prefix = 0;
  for (let i = 0; i < Math.min(4, len1, len2); i++) {
    if (s1[i] === s2[i]) {
      prefix++;
    } else {
      break;
    }
  }

  return jaro + prefix * 0.1 * (1.0 - jaro);
};

/**
 * Normalizes, sanitizes, and verifies that an Orbit Handle conforms to strict premium and anti-spoofing guidelines.
 */
export const verifyAndNormalizeHandle = (rawHandle) => {
  if (!rawHandle) return { isValid: false, errorType: "VALIDATION_ERROR", error: "Handle is required." };

  // 1. NFC normalization and invisible/zero-width/lookalike space character stripping
  const normalizedRaw = rawHandle
    .normalize("NFC")
    .replace(/[\u200B-\u200D\uFEFF\u202E\u00A0\u2000-\u200A\u202F\u205F\u3000]/g, "")
    .trim();

  // Check for raw formatting
  const handleRegex = /^([^#]+)#([^#]+)$/;
  const rawMatch = normalizedRaw.match(handleRegex);
  if (!rawMatch) {
    return {
      isValid: false,
      errorType: "VALIDATION_ERROR",
      error: "Invalid handle format. Must be username#tag"
    };
  }

  const rawUsername = rawMatch[1];
  const rawTag = rawMatch[2];

  // 2. Validate mixed scripts (to prevent Cyrillic/Greek/Latin lookalike attacks)
  const hasLatin = /[a-zA-Z]/.test(rawUsername) || /[a-zA-Z]/.test(rawTag);
  const hasCyrillic = /[\u0400-\u04FF]/.test(rawUsername) || /[\u0400-\u04FF]/.test(rawTag);
  const hasGreek = /[\u0370-\u03FF]/.test(rawUsername) || /[\u0370-\u03FF]/.test(rawTag);
  
  if ((hasLatin && hasCyrillic) || (hasLatin && hasGreek) || (hasCyrillic && hasGreek)) {
    return {
      isValid: false,
      errorType: "UNICODE_SPOOF",
      error: "Unsupported characters detected"
    };
  }

  // 3. Dehomoglyph / Leetspeak normalization to check for sneaky spoofing attempts
  const dehomoUsername = dehomoglyph(rawUsername);
  const dehomoTag = dehomoglyph(rawTag);

  // 4. Fuzzy / Leetspeak Authority Impersonation Check (Only hard-blocks admin terms)
  // We do this BEFORE length checks so any authority spoofs are immediately caught
  const blacklist = ["admin", "support", "staff", "moderator", "official", "orbit", "security", "dev", "owner", "system"];
  
  const isImpersonator = blacklist.some(word => 
    dehomoUsername.includes(word) || dehomoTag.includes(word)
  );

  if (isImpersonator) {
    return {
      isValid: false,
      errorType: "AUTHORITY_PROTECTION",
      error: "Protected keywords cannot be used"
    };
  }

  // 5. Standard Premium format checks on normalized standard letters
  const standardUsernameRegex = /^[a-z0-9_]{3,16}$/;
  const standardTagRegex = /^[a-zA-Z0-9_]{3,9}$/;

  if (!standardUsernameRegex.test(dehomoUsername) || !standardTagRegex.test(dehomoTag)) {
    return {
      isValid: false,
      errorType: "VALIDATION_ERROR",
      error: "Username must be 3-16 chars. Tag must be 3-9 chars. Only alphanumerics and underscores allowed."
    };
  }

  if (!/[a-zA-Z]/.test(dehomoTag)) {
    return {
      isValid: false,
      errorType: "VALIDATION_ERROR",
      error: "Tag must contain at least one letter."
    };
  }

  // Preserve the raw standard characters for standard storage!
  const username = rawUsername.toLowerCase();
  const orbitTag = rawTag;
  const normalizedHandle = `${username}#${orbitTag.toLowerCase()}`;

  return {
    isValid: true,
    username,
    orbitTag,
    normalizedHandle
  };
};

export const signup = async (req, res) => {
  const { handle, email, password } = req.body;
  let savedUser = null;

  try {
    const config = await AppConfig.findOne();
    if (config && !config.registrationEnabled) {
      return res.status(403).json({
        success: false,
        error: { code: "REGISTRATION_DISABLED", message: "Registrations are currently disabled by the administrator." },
      });
    }

    const handleVerification = verifyAndNormalizeHandle(handle);
    if (!handleVerification.isValid) {
      let errCode = "VALIDATION_ERROR";
      if (handleVerification.errorType === "AUTHORITY_PROTECTION") {
        errCode = "AUTHORITY_PROTECTED";
      } else if (handleVerification.errorType === "UNICODE_SPOOF") {
        errCode = "UNICODE_SPOOF";
      }
      return res.status(400).json({
        success: false,
        error: { code: errCode, message: handleVerification.error },
      });
    }

    const validation = z.object({
      email: emailSchema,
      password: passwordSchema,
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

    const { username, orbitTag, normalizedHandle } = handleVerification;

    const existingEmail = await User.findOne({ email: validation.data.email });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        error: { code: "EMAIL_EXISTS", message: "Email already exists" },
      });
    }

    // A. HARD BLOCK: Exact Normalized handle collision check
    const existingHandle = await User.findOne({ normalizedHandle });
    if (existingHandle) {
      return res.status(400).json({
        success: false,
        error: { code: "HANDLE_TAKEN", message: "This Orbit Handle is already taken" },
      });
    }

    // B. SOFT SIMILARITY SYSTEM: Perform soft similarity scoring against candidates
    let similarityMetadata = {
      similarityFlag: false,
      similarityScore: 0,
      similarTo: ""
    };

    const minLength = Math.max(3, username.length - 3);
    const maxLength = username.length + 3;
    const candidates = await User.find({
      $expr: {
        $and: [
          { $gte: [{ $strLenCP: "$username" }, minLength] },
          { $lte: [{ $strLenCP: "$username" }, maxLength] }
        ]
      }
    }).select("username normalizedHandle").lean();

    let highestSimilarity = 0;
    let mostSimilarHandle = "";

    for (const candidate of candidates) {
      const score = getJaroWinklerSimilarity(username, candidate.username);
      if (score > highestSimilarity) {
        highestSimilarity = score;
        mostSimilarHandle = candidate.normalizedHandle;
      }
    }

    if (highestSimilarity >= 0.80) {
      similarityMetadata = {
        similarityFlag: true,
        similarityScore: parseFloat(highestSimilarity.toFixed(2)),
        similarTo: mostSimilarHandle
      };
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(validation.data.password, salt);

    const newUser = new User({
      username,
      orbitTag,
      normalizedHandle,
      email: validation.data.email,
      password: hashedPassword,
      recoveryPassphraseHash: null,
      isEmailVerified: true,
      similarityMetadata, // Attached internally for moderation
    });

    savedUser = await newUser.save();

    /* 
    const otp = generateOTP();
    await storeOTP(validation.data.email, otp);
    
    // Background the email dispatch
    sendOTP(validation.data.email, otp, "verification", "email").then(mailResult => {
      if (!mailResult.success) {
        console.warn(`[Signup] Verification dispatch failed for ${validation.data.email}: ${mailResult.error}. OTP: ${otp}`);
      } else {
        console.log(`[Signup] Verification sent via email to ${validation.data.email}`);
      }
    }).catch(err => console.error("[Signup] Dispatch error:", err.message));
    */

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
      data: sanitizeForOrbit({
        _id: newUser._id,
        username: newUser.username,
        orbitTag: newUser.orbitTag,
        normalizedHandle: newUser.normalizedHandle,
        email: newUser.email,
        profilePic: newUser.profilePic,
        createdAt: newUser.createdAt,
        updatedAt: newUser.updatedAt,
        isEmailVerified: newUser.isEmailVerified,
        authToken: tokens.accessToken,
        sessionId: tokens.sessionId
      }),
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

// Suggestion Utility
// Suggestion Utility
const generateSuggestions = async (username) => {
  const suggestions = new Set();
  const themes = ["Void", "Nova", "Flux", "Neon", "Zero", "Echo", "Apex", "Byte", "Core", "Node", "Rift", "Warp", "Drift", "Pulse", "Ghost", "Aura", "Zen", "Vibe", "Volt", "Glow", "Sync"];
  const maxAttempts = 30;
  let attempts = 0;

  while (suggestions.size < 3 && attempts < maxAttempts) {
    attempts++;
    const theme = themes[Math.floor(Math.random() * themes.length)];
    let suggestedTag = theme;
    if (Math.random() < 0.6) {
      const num = Math.floor(Math.random() * 10);
      suggestedTag = `${theme.substring(0, 5)}${num}`;
    }
    const normalized = `${username}#${suggestedTag}`.toLowerCase();
    const exists = await User.exists({ normalizedHandle: normalized });
    
    if (!exists) {
      suggestions.add(`${username}#${suggestedTag}`);
    }
  }

  // Fallback if attempts exhaustion
  while (suggestions.size < 3) {
    const randomHex = Math.random().toString(36).substring(2, 8).toUpperCase();
    suggestions.add(`${username}#${randomHex}`);
  }

  return Array.from(suggestions);
};

export const validateHandle = async (req, res) => {
  try {
    const { handle } = req.query;
    if (!handle) {
      return res.status(400).json({ success: false, message: "Handle query parameter is required." });
    }

    const handleVerification = verifyAndNormalizeHandle(handle);
    if (!handleVerification.isValid) {
      let errCode = "VALIDATION_ERROR";
      if (handleVerification.errorType === "AUTHORITY_PROTECTION") {
        errCode = "AUTHORITY_PROTECTED";
      } else if (handleVerification.errorType === "UNICODE_SPOOF") {
        errCode = "UNICODE_SPOOF";
      }
      return res.status(400).json({ success: false, code: errCode, message: handleVerification.error });
    }

    const { username, orbitTag, normalizedHandle } = handleVerification;
    const existingUser = await User.findOne({ normalizedHandle }).lean();

    if (existingUser) {
      const suggestions = await generateSuggestions(username);
      return res.status(409).json({
        success: false,
        available: false,
        code: "HANDLE_TAKEN",
        message: "This Orbit Handle is already taken",
        suggestions,
      });
    }

    // Soft similarity warning check (visual and typographic resemblance check)
    const minLength = Math.max(3, username.length - 3);
    const maxLength = username.length + 3;
    const candidates = await User.find({
      $expr: {
        $and: [
          { $gte: [{ $strLenCP: "$username" }, minLength] },
          { $lte: [{ $strLenCP: "$username" }, maxLength] }
        ]
      }
    }).select("username normalizedHandle").lean();

    let highestSimilarity = 0;
    let mostSimilarHandle = "";

    for (const candidate of candidates) {
      const score = getJaroWinklerSimilarity(username, candidate.username);
      if (score > highestSimilarity) {
        highestSimilarity = score;
        mostSimilarHandle = candidate.normalizedHandle;
      }
    }

    if (highestSimilarity >= 0.80) {
      return res.status(200).json({
        success: true,
        available: true,
        message: "This handle is visually similar to another account",
        normalizedHandle,
        orbitTag,
        similarityMetadata: {
          similarityFlag: true,
          similarityScore: parseFloat(highestSimilarity.toFixed(2)),
          similarTo: mostSimilarHandle
        }
      });
    }

    return res.status(200).json({
      success: true,
      available: true,
      message: "Orbit Handle is available.",
      normalizedHandle,
      orbitTag,
    });
  } catch (error) {
    console.error("Error in validateHandle:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const validation = z.object({
      email: z.string().min(1, "Email or Username is required"),
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

    const identifier = validation.data.email.trim();
    const lowerIdentifier = identifier.toLowerCase();
    const cleanHandle = lowerIdentifier.startsWith("@") ? lowerIdentifier.slice(1) : lowerIdentifier;

    const user = await User.findOne({
      $or: [
        { email: identifier },
        { email: lowerIdentifier },
        { username: identifier },
        { username: cleanHandle },
        { normalizedHandle: cleanHandle }
      ]
    });

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
      data: sanitizeForOrbit({
        _id: user._id,
        username: user.username,
        orbitTag: user.orbitTag,
        email: user.email,
        profilePic: user.profilePic,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        isEmailVerified: user.isEmailVerified,
        authToken: tokens.accessToken,
        sessionId: tokens.sessionId
      }),
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
      profilePic: z.string().regex(/^data:image\/.+;base64,/, "Only explicit base64 images are supported").optional(),
      username: z.string().min(2, "Username too short").max(50, "Username too long").trim().optional(),
      email: z.string().email("Invalid email").optional(),
      bio: z.string().max(500, "Bio too long").optional(),
    });

    const parsed = updateProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid input data",
        errors: parsed.error.issues.map(e => ({ field: e.path.join("."), message: e.message })),
      });
    }

    const { profilePic, username, email, bio } = parsed.data;
    const userId = req.user._id;

    const updater = {};

    if (profilePic) {
      try {
        const uploadResponse = await cloudinary.uploader.upload(profilePic);
        updater.profilePic = `${uploadResponse.secure_url}?v=${Date.now()}`;
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

    res.status(200).json(sanitizeForOrbit(updatedUser.toObject()));
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
    const user = await User.findById(req.user._id)
      .populate("contacts", "username normalizedHandle profilePic email")
      .populate("contactRequests", "username normalizedHandle profilePic email")
      .populate("sentRequests", "username normalizedHandle profilePic email")
      .populate("blockedContacts", "username normalizedHandle profilePic email");
      
    if (!user) return res.status(404).json({ message: "User not found" });

    const contactIds = user.contacts.map((contact) => contact._id.toString());
    const aliases = Object.fromEntries(user.contactAliases || []);

    res.status(200).json({ 
      contacts: user.contacts, 
      contactRequests: user.contactRequests || [],
      sentRequests: user.sentRequests || [],
      blockedContacts: user.blockedContacts || [],
      contactIds, 
      aliases 
    });
  } catch (error) {
    console.error("Error in getContacts:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const addContact = async (req, res) => {
  try {
    const userId = req.user._id;

    const contactSchema = z.object({
      contactId: z.string().optional(),
      handle: z.string().optional(),
    }).refine(data => data.contactId || data.handle, {
      message: "Either contactId or handle must be provided",
      path: ["contactId"],
    });

    const parsed = contactSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid input data",
        errors: parsed.error.issues.map(e => ({ field: e.path.join("."), message: e.message })),
      });
    }

    const { contactId, handle } = parsed.data;

    let targetUser = null;
    if (contactId) {
      targetUser = await User.findById(contactId);
    } else if (handle) {
      targetUser = await User.findOne({ normalizedHandle: handle.toLowerCase() });
    }

    if (!targetUser) return res.status(404).json({ message: "User not found" });

    const targetUserIdStr = targetUser._id.toString();
    const userIdStr = userId.toString();

    if (targetUserIdStr === userIdStr) {
      return res.status(400).json({ message: "Cannot add yourself as a contact" });
    }

    if (targetUser.blockedContacts?.includes(userIdStr)) {
      return res.status(403).json({ message: "You cannot add this user" });
    }

    const user = await User.findById(userId);
    
    if (user.blockedContacts?.includes(targetUserIdStr)) {
      return res.status(400).json({ message: "You have blocked this user" });
    }
    
    // Check if already a contact
    if (user.contacts.includes(targetUserIdStr)) {
      return res.status(400).json({ message: "Already in your contacts" });
    }
    
    // Check if request already sent
    if (user.sentRequests?.includes(targetUserIdStr)) {
      return res.status(400).json({ message: "Request already sent" });
    }
    
    // If they already sent US a request, just accept it automatically
    if (user.contactRequests?.includes(targetUserIdStr)) {
      // Remove from requests
      user.contactRequests = user.contactRequests.filter(id => id.toString() !== targetUserIdStr);
      targetUser.sentRequests = targetUser.sentRequests?.filter(id => id.toString() !== userIdStr) || [];
      
      // Add to contacts
      user.contacts.push(targetUserIdStr);
      targetUser.contacts.push(userIdStr);
      
      await targetUser.save();
      await user.save();
      
      // Notify both
      import("../socket/socket.js").then(({ getIO }) => {
        const io = getIO();
        if (io) {
          io.to(targetUserIdStr).emit("contactRequestAccepted", { userId: userIdStr, user: sanitizeForOrbit(user.toObject()) });
          io.to(userIdStr).emit("contactRequestAccepted", { userId: targetUserIdStr, user: sanitizeForOrbit(targetUser.toObject()) });
        }
      }).catch(console.error);
      
      return res.status(200).json({ message: "Request accepted automatically", status: "accepted" });
    }

    // Otherwise, send a request
    if (!user.sentRequests) user.sentRequests = [];
    user.sentRequests.push(targetUserIdStr);
    
    if (!targetUser.contactRequests) targetUser.contactRequests = [];
    targetUser.contactRequests.push(userIdStr);
    
    await user.save();
    await targetUser.save();
    
    // Notify target user
    import("../socket/socket.js").then(({ getIO }) => {
      const io = getIO();
      if (io) {
        io.to(targetUserIdStr).emit("contactRequestReceived", { 
          from: sanitizeForOrbit(user.toObject()) 
        });
      }
    }).catch(console.error);

    res.status(200).json({ message: "Contact request sent", status: "pending" });
  } catch (error) {
    console.error("Error in addContact:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const acceptContact = async (req, res) => {
  try {
    const userId = req.user._id;
    const { contactId } = req.params;
    
    const user = await User.findById(userId);
    const targetUser = await User.findById(contactId);
    
    if (!targetUser) return res.status(404).json({ message: "User not found" });
    
    const targetUserIdStr = targetUser._id.toString();
    const userIdStr = userId.toString();
    
    if (!user.contactRequests?.includes(targetUserIdStr)) {
      return res.status(400).json({ message: "No pending request from this user" });
    }
    
    // Remove from requests
    user.contactRequests = user.contactRequests.filter(id => id.toString() !== targetUserIdStr);
    targetUser.sentRequests = targetUser.sentRequests?.filter(id => id.toString() !== userIdStr) || [];
    
    // Add to contacts
    if (!user.contacts.includes(targetUserIdStr)) user.contacts.push(targetUserIdStr);
    if (!targetUser.contacts.includes(userIdStr)) targetUser.contacts.push(userIdStr);
    
    await user.save();
    await targetUser.save();
    
    import("../socket/socket.js").then(({ getIO }) => {
      const io = getIO();
      if (io) {
        io.to(targetUserIdStr).emit("contactRequestAccepted", { userId: userIdStr, user: sanitizeForOrbit(user.toObject()) });
      }
    }).catch(console.error);
    
    res.status(200).json({ message: "Contact request accepted", success: true });
  } catch (error) {
    console.error("Error in acceptContact:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const rejectContact = async (req, res) => {
  try {
    const userId = req.user._id;
    const { contactId } = req.params;
    
    const user = await User.findById(userId);
    const targetUser = await User.findById(contactId);
    
    if (!targetUser) return res.status(404).json({ message: "User not found" });
    
    const targetUserIdStr = targetUser._id.toString();
    const userIdStr = userId.toString();
    
    // Remove from requests
    user.contactRequests = user.contactRequests?.filter(id => id.toString() !== targetUserIdStr) || [];
    targetUser.sentRequests = targetUser.sentRequests?.filter(id => id.toString() !== userIdStr) || [];
    
    await user.save();
    await targetUser.save();
    
    res.status(200).json({ message: "Contact request rejected", success: true });
  } catch (error) {
    console.error("Error in rejectContact:", error.message);
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

export const blockContact = async (req, res) => {
  try {
    const userId = req.user._id;
    const { contactId } = req.params;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Ensure it's not already blocked
    if (!user.blockedContacts) user.blockedContacts = [];
    if (!user.blockedContacts.includes(contactId.toString())) {
      user.blockedContacts.push(contactId.toString());
    }

    // Remove from contacts if present
    user.contacts = user.contacts.filter((id) => id.toString() !== contactId.toString());
    if (user.contactAliases?.has(contactId.toString())) {
      user.contactAliases.delete(contactId.toString());
    }
    
    // Remove pending requests if any
    user.contactRequests = user.contactRequests?.filter(id => id.toString() !== contactId.toString()) || [];
    user.sentRequests = user.sentRequests?.filter(id => id.toString() !== contactId.toString()) || [];

    await user.save();

    res.status(200).json({ success: true, message: "Contact blocked" });
  } catch (error) {
    console.error("Error in blockContact:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const unblockContact = async (req, res) => {
  try {
    const userId = req.user._id;
    const { contactId } = req.params;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.blockedContacts) {
      user.blockedContacts = user.blockedContacts.filter((id) => id.toString() !== contactId.toString());
    }
    await user.save();

    res.status(200).json({ success: true, message: "Contact unblocked" });
  } catch (error) {
    console.error("Error in unblockContact:", error.message);
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
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ message: "Confirmation is required to delete your account." });
    }

    const user = await User.findById(userId).select("+password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    const isConstellationUser = await ConstellationProfile.findOne({ userId });

    if (!isMatch) {
      if (isConstellationUser && password.trim() === "CONFIRM") {
        // Constellation users don't have conventional password; let them type 'CONFIRM'
      } else {
        return res.status(400).json({ 
          message: isConstellationUser 
            ? "Invalid confirmation. Please type 'CONFIRM' exactly." 
            : "Incorrect password. Please try again." 
        });
      }
    }

    // Dynamically load all related models to perform a complete, deep purge
    const Nexus = (await import("../models/nexus.model.js")).default;
    const Message = (await import("../models/message.model.js")).default;
    const DeviceRegistry = (await import("../models/deviceRegistry.model.js")).default;
    const PrekeyBundle = (await import("../models/prekeyBundle.model.js")).default;
    const SpotifyCredential = (await import("../models/spotifyCredential.model.js")).default;
    const SpotifySession = (await import("../models/spotifySession.model.js")).default;

    // 1. Remove from all Nexus memberships and admin arrays
    await Nexus.updateMany(
      { $or: [{ members: userId }, { admins: userId }] },
      { $pull: { members: userId, admins: userId } }
    );

    // 2. Remove from other users' contacts list
    await User.updateMany(
      { contacts: userId },
      { $pull: { contacts: userId } }
    );

    // 3. Clear all direct and nexus messages sent by the user
    await Message.deleteMany({ senderId: userId });

    // 4. Wipe constellation profiles
    await ConstellationProfile.deleteMany({ userId });

    // 5. Revoke registered devices
    await DeviceRegistry.deleteMany({ userId });

    // 6. Delete cryptographic prekeys
    await PrekeyBundle.deleteMany({ userId });

    // 7. Expire other active session tokens
    await Session.deleteMany({ userId });

    // 8. Wipe third-party integrations
    await SpotifyCredential.deleteMany({ userId });
    await SpotifySession.deleteMany({ $or: [{ hostId: userId }, { guests: userId }] });

    // 9. Wipe the main User record itself
    await User.findByIdAndDelete(userId);

    // 10. Audit log the deletion event
    await securityService.logAuditEvent(
      null,
      "ACCOUNT_DELETED_PERMANENTLY",
      req,
      { userId: userId.toString() },
      0
    );

    res.clearCookie("jwt", {
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      secure: process.env.NODE_ENV === "production",
    });

    res.status(200).json({ message: "Account completely deleted." });
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
      data: sanitizeForOrbit({
        ...userObj,
        hasConstellation: !!constellationHash,
        sessionId: req.sessionId,
        socketToken: req.cookies?.jwt || req.headers["x-auth-token"] || req.headers.authorization?.split(" ")[1],
      }),
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
    const dispatchTo = email;
    const method = "email";
    
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
    sendOTP(email, otp, "verification", "email").then(res => {
      if (!res.success) console.warn(`[Email Verification] Dispatch failed: ${res.error}. OTP: ${otp}`);
    }).catch(err => console.error("[Email Verification] Dispatch error:", err.message));

    res.status(200).json({ 
      success: true, 
      message: "Verification code sent via email"
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
export const constellationChallenge = async (req, res) => {
  const ip = req.ip || req.headers["x-forwarded-for"] || "unknown";
  const ua = req.headers["user-agent"] || "unknown";
  const nonce = await issueNonce(ip, ua);
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
  if (!(await consumeNonce(nonce, ip, ua))) {
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

    const normalizedUsername = username.toLowerCase().replace(/[^a-z0-9_]/g, "");
    const generatedTags = await generateSuggestions(normalizedUsername);
    const chosenHandle = generatedTags[0];
    const match = chosenHandle.match(/^([a-z0-9_]{3,20})#([a-zA-Z0-9]{3,6})$/);
    const orbitTag = match ? match[2] : "orbit";
    const normalizedHandle = chosenHandle.toLowerCase();

    // ── Create user (constellation-only accounts get a dummy unguessable password) ────────
    const dummyPassword = crypto.randomBytes(32).toString("hex");
    const pwdSalt = await bcrypt.genSalt(12);
    const hashedDummyPassword = await bcrypt.hash(dummyPassword, pwdSalt);

    savedUser = await new User({
      username: normalizedUsername,
      orbitTag,
      normalizedHandle,
      email,
      password: hashedDummyPassword,
      isEmailVerified: true,
    }).save();

    /*
    // Generate and store email verification OTP
    const otp = generateOTP();
    await storeOTP(email, otp);
    
    // Background dispatch constellation verification email
    sendOTP(email, otp).then(res => {
      if (!res.success) console.warn(`[Constellation Signup] Email failed: ${res.error}. OTP: ${otp}`);
    }).catch(err => console.error("[Constellation Signup] Email error:", err.message));
    */

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
      data: sanitizeForOrbit({
        _id: savedUser._id,
        username: savedUser.username,
        orbitTag: savedUser.orbitTag,
        email: savedUser.email,
        profilePic: savedUser.profilePic,
        createdAt: savedUser.createdAt,
        updatedAt: savedUser.updatedAt,
        authToken: tokens.accessToken,
        sessionId: tokens.sessionId,
      }),
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
  if (!(await consumeNonce(nonce, ip, ua))) {
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
      const ipCount = await recordIpFailure(ip);
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

    /*
    if (!user.isEmailVerified) {
      return res.status(403).json({ message: "Please verify your email to log in." });
    }
    */

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
      await recordIpFailure(ip);
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
      const ipCount = await recordIpFailure(ip);
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
    await resetIpFailures(ip); // Clear per-IP counter — legitimate user confirmed

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
      data: sanitizeForOrbit({
        _id: user._id,
        username: user.username,
        orbitTag: user.orbitTag,
        email: user.email,
        profilePic: user.profilePic,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        authToken: tokens.accessToken,
        sessionId: tokens.sessionId,
        hasConstellation: true,
        ...(behaviorWarning && { behaviorWarning: true }),
      }),
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

export const updatePublicKey = async (req, res) => {
  try {
    const { publicKey } = req.body;
    if (!publicKey || typeof publicKey !== "string") {
      return res.status(400).json({ message: "Valid public key is required" });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.publicKey = publicKey;
    await user.save();

    res.status(200).json({ message: "Public key updated successfully" });
  } catch (error) {
    console.error("updatePublicKey error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
