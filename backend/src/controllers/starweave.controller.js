/**
 * starweave.controller.js — Biometric gesture auth endpoints
 *
 *  GET  /api/starweave/challenge  → { nonce }
 *  POST /api/starweave/enroll     → register new biometric profile
 *  POST /api/starweave/login      → authenticate and issue session
 */
import crypto from 'crypto';
import bcryptjs from 'bcryptjs';
import User from '../models/user.model.js';
import StarWeaveProfile from '../models/starweave.model.js';
import { z } from 'zod';
import { generateToken } from '../lib/utils.js';
import {
  buildCanonicalPattern,
  generateSalt,
  hashPattern,
  verifyPattern,
  averageBiometrics,
  checkBiometricSimilarity,
  checkLockout,
  applyLockout,
  updateBiometricProfile,
} from '../services/starweave.service.js';
import { issueNonce, consumeNonce } from "../lib/nonceStore.js";

const ITEM_POOL = [
  'Red Planet', 'Blue Planet', 'Green Planet', 'Yellow Planet', 'Purple Planet', 'Ice Planet',
  'Apple', 'Mango', 'Banana', 'Cherries', 'Strawberry', 'Pineapple', 'Grapes', 'Watermelon',
  'Cat', 'Dog', 'Fox', 'Wolf', 'Lion', 'Tiger', 'Bear', 'Panda', 'Koala', 'Rabbit',
  'Sword', 'Shield', 'Bow', 'Axe', 'Staff', 'Dagger', 'Spear', 'Mace',
  'Diamond', 'Ruby', 'Emerald', 'Sapphire', 'Amethyst', 'Topaz', 'Opal', 'Pearl',
  'Fire', 'Water', 'Earth', 'Wind', 'Light', 'Shadow', 'Lightning', 'Ice',
  'Eagle', 'Owl', 'Hawk', 'Falcon', 'Raven', 'Dove', 'Swan', 'Peacock',
  'Rocket', 'Satellite', 'UFO', 'Comet', 'Asteroid', 'Meteor', 'Black Hole', 'Nebula'
];

export const GLYPH_NODES = []; // Replaced by dynamic item pool
export const EMOJI_NODES = [];

function secureHashInt(str) {
  const hash = crypto.createHash('sha256').update(str).digest();
  // Use first 4 bytes as an unsigned 32-bit integer for modulo ops
  return hash.readUInt32BE(0);
}

const STARWEAVE_SECRET = process.env.STARWEAVE_SECRET || 'starweave_fallback_secret_123';

// ─── GET /challenge ──────────────────────
export async function challengeHandler(req, res) {
  try {
    const querySchema = z.object({
      email: z.string().email().optional().or(z.literal('')),
      type: z.enum(['signup', 'login']).optional()
    });

    const parsed = querySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid query parameters" });
    }

    const { email, type } = parsed.data;
    const nonce = await issueNonce(null, null);

    const VISIBLE_COUNT = 24;
    let glyphConfig = [];
    let signatureGlyphs = [];

    const generateLayout = (items, coreSet) => {
      const nodes = [];
      const cols = 6;
      const rows = 4;
      let i = 0;
      for (const itemName of items) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const jitterX = (Math.random() - 0.5) * 0.08;
        const jitterY = (Math.random() - 0.5) * 0.08;

        const x = 0.12 + (col / (cols - 1)) * 0.76 + jitterX;
        const y = 0.20 + (row / (rows - 1)) * 0.60 + jitterY;
        const nameHash = secureHashInt(itemName);
        nodes.push({
          label: itemName,
          hue: nameHash % 360,
          baseX: Math.max(0.05, Math.min(0.95, x)),
          baseY: Math.max(0.05, Math.min(0.95, y)),
          isSignature: coreSet ? coreSet.has(itemName) : false
        });
        i++;
      }
      return nodes;
    };

    if (email) {
      const normalizedEmail = email.trim().toLowerCase();

      if (type === 'signup' || type === 'login') {
        const existing = await User.findOne({ email: normalizedEmail });
        if (type === 'signup' && existing) {
          return res.status(409).json({ message: 'Email address is already registered.' });
        }
        if (type === 'login' && !existing) {
          return res.status(404).json({ message: 'No StarWeave profile found for this email.' });
        }
      }

      // Profile-Aware Landmark Selection
      let coreCount = 8;
      let coreSet = new Set();
      let h = secureHashInt(normalizedEmail + STARWEAVE_SECRET);

      // 1. Try to find the user's specific chosen landmarks
      const user = await User.findOne({ email: normalizedEmail });
      let profile = user ? await StarWeaveProfile.findOne({ userId: user._id }) : null;

      if (profile && profile.signatureGlyphs?.length > 0) {
        // High-Fidelity Retrieval: Use the stars they actually picked during signup
        profile.signatureGlyphs.forEach(g => coreSet.add(g));
        coreCount = coreSet.size;
      } else {
        // Enrollment Mode: Generate 8 deterministic core landmarks so signup is stable
        let enrollH = h;
        while (coreSet.size < 8) {
          const idx = enrollH % ITEM_POOL.length;
          coreSet.add(ITEM_POOL[idx]);
          enrollH = secureHashInt(enrollH.toString() + STARWEAVE_SECRET);
        }
        coreCount = 8;
      }

      // 2. Dynamic Decoys: Fill the rest (up to 24) with completely random new stars
      const remainingItems = ITEM_POOL.filter(i => !coreSet.has(i));
      const decoys = [];
      while (decoys.length < (VISIBLE_COUNT - coreCount)) {
        const rnd = Math.floor(Math.random() * remainingItems.length);
        decoys.push(remainingItems.splice(rnd, 1)[0]);
      }

      // 3. Maximum Entropy Shuffle
      let displayItems = [...Array.from(coreSet), ...decoys];
      displayItems.sort(() => Math.random() - 0.5);

      glyphConfig = generateLayout(displayItems, coreSet);
      
      // If we are in enrollment/signup mode, allow all 24 stars to be picked
      // If we are in login mode for an existing user, only allow their stored stars
      if (profile) {
        signatureGlyphs = Array.from(coreSet); 
      } else {
        signatureGlyphs = displayItems; 
      }
    } else {
      // Pick random items for initial view when no email is provided
      let displayItems = [...ITEM_POOL].sort(() => Math.random() - 0.5).slice(0, VISIBLE_COUNT);
      glyphConfig = generateLayout(displayItems, null);
    }

    // Stable signature: we sign the nonce + signature glyphs to verify the challenge wasn't bypassed.
    const configSignature = crypto.createHmac('sha256', STARWEAVE_SECRET)
      .update(signatureGlyphs.join('|') + nonce)
      .digest('hex');

    res.json({ nonce, emojiConfig: glyphConfig, signatureGlyphs, configSignature, poolVersion: 2 });
  } catch (err) {
    res.status(500).json({ message: 'Failed to issue challenge.' });
  }
}

// ─── POST /enroll ──────────────────────────────────────────────────────────────
export async function enrollHandler(req, res) {
  try {
    const enrollSchema = z.object({
      username: z.string().min(2).max(50),
      email: z.string().email(),
      password: z.string().min(6),
      nodes: z.array(z.string()).min(5).max(9),
      nonce: z.string().min(1),
      pass1Metrics: z.record(z.any()).optional(),
      pass2Metrics: z.record(z.any()).optional(),
      emojiConfig: z.array(z.any()),
      signatureGlyphs: z.array(z.string()),
      configSignature: z.string().min(1)
    });

    const parsed = enrollSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Missing or invalid required fields.', errors: parsed.error.issues });
    }

    const {
      username, email, password,
      nodes,           // ordered array of node labels e.g. ['Ignis','Luna',...]
      nonce,
      pass1Metrics,    // biometric vector from first draw
      pass2Metrics,    // biometric vector from second draw
      emojiConfig,     // Server-provided emoji layout
      signatureGlyphs, // Required signature glyphs from challenge
      configSignature  // HMAC array of the layout
    } = parsed.data;
    if (!(await consumeNonce(nonce, null, null))) {
      console.warn('[Enroll] Nonce rejected — expired or already used:', nonce?.slice(0, 12));
      return res.status(400).json({ message: 'Invalid or expired nonce.' });
    }

    // Validate challenge signature (stable format)
    const glyphs = Array.isArray(signatureGlyphs) ? signatureGlyphs : [];
    const expectedSig = crypto.createHmac('sha256', STARWEAVE_SECRET)
      .update(glyphs.join('|') + nonce)
      .digest('hex');

    if (expectedSig !== configSignature) {
      console.warn('[Enroll] Sig mismatch. Expected:', expectedSig.slice(0, 12), 'Got:', configSignature?.slice(0, 12));
      return res.status(400).json({ message: 'Constellation challenge signature mismatch. Access denied.' });
    }

    // Verify pattern only contains signature glyphs (no decoys)
    if (signatureGlyphs && signatureGlyphs.length > 0) {
      const invalid = nodes.filter(n => !signatureGlyphs.includes(n));
      if (invalid.length > 0) {
        return res.status(400).json({ message: 'Pattern contains invalid stars. Please only use your permanent personal signature stars.' });
      }
    }

    // Check if user already exists
    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) {
      return res.status(409).json({ message: 'Email or username already registered.' });
    }

    // Create user account
    const passwordHash = await bcryptjs.hash(password, 12);
    let newUser;
    try {
      newUser = await User.create({
        username: username.trim(),
        email: email.trim().toLowerCase(),
        password: passwordHash,
      });
    } catch (err) {
      if (err.code === 11000) {
        return res.status(409).json({ message: 'Identity already exists (Username/Email taken).' });
      }
      throw err;
    }

    try {
      // Build and hash the canonical pattern
      const canonical = buildCanonicalPattern(nodes);
      const salt = generateSalt();
      const patternHash = await hashPattern(canonical, salt);

      // Average biometric vectors from both enrollment passes
      const biometric = pass1Metrics && pass2Metrics
        ? averageBiometrics(pass1Metrics, pass2Metrics)
        : {
            avgDwellMs: 0, dwellVarianceMs: 0,
            avgFlightVelocity: 0, flightVariance: 0,
            avgCurvature: 0, avgEntryAngle: 0,
            totalDurationMs: 0, sampleCount: 0
          };

      console.log('[Enroll] Biometric data:', biometric ? 'OK' : 'FALLBACK (no metrics)');

      await StarWeaveProfile.create({
        userId: newUser._id,
        patternHash,
        patternSalt: salt,
        nodeCount: nodes.length,
        biometric,
        signatureGlyphs: nodes || [], // Save the EXACT stars the user chose for their pattern
        emojiPoolVersion: 2,
      });

      // Issue session tokens
      const tokens = await generateToken(newUser._id, req, res);

      res.status(201).json({
        message: 'Enrolled successfully.',
        user: {
          _id: newUser._id,
          username: newUser.username,
          email: newUser.email,
          authToken: tokens.accessToken,
          sessionId: tokens.sessionId
        }
      });
    } catch (profileErr) {
      // ROLLBACK: Delete partially created user if profile fails
      await User.findByIdAndDelete(newUser._id);
      throw profileErr;
    }
  } catch (err) {
    console.error('[StarWeave Enroll]', err);
    res.status(500).json({ message: 'Enrollment failed. Please try again.' });
  }
}

// ─── POST /login ───────────────────────────────────────────────────────────────
export async function loginHandler(req, res) {
  try {
    const loginSchema = z.object({
      email: z.string().email(),
      nodes: z.array(z.string()).min(5).max(9),
      nonce: z.string().min(1),
      loginMetrics: z.record(z.any()).optional(),
      emojiConfig: z.array(z.any()),
      signatureGlyphs: z.array(z.string()),
      configSignature: z.string().min(1)
    });

    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Missing or invalid required fields.', errors: parsed.error.issues });
    }

    const {
      email,
      nodes,           // ordered array of node labels from login attempt
      nonce,
      loginMetrics,    // biometric vector from this login attempt
      emojiConfig,
      signatureGlyphs,
      configSignature
    } = parsed.data;
    if (!(await consumeNonce(nonce, null, null))) {
      return res.status(400).json({ message: 'Invalid or expired nonce.' });
    }

    // Validate challenge signature (stable format)
    const expectedSig = crypto.createHmac('sha256', STARWEAVE_SECRET)
      .update(signatureGlyphs.join('|') + nonce)
      .digest('hex');

    if (expectedSig !== configSignature) {
      return res.status(400).json({ message: 'Invalid or tampered constellation configuration.' });
    }

    // Find user
    const user = await User.findOne({ email: email.trim().toLowerCase() }).select('-password');
    if (!user) {
      return res.status(401).json({ message: 'No StarWeave profile found for this email.' });
    }

    // Find starweave profile
    const profile = await StarWeaveProfile.findOne({ userId: user._id });
    if (!profile) {
      return res.status(401).json({ message: 'No StarWeave enrollment found. Please sign up.' });
    }

    // Check lockout
    const lockStatus = checkLockout(profile);
    if (lockStatus.locked) {
      return res.status(429).json({
        message: 'Account temporarily locked. Please try again later.',
        retryAfterMs: lockStatus.retryAfterMs,
      });
    }

    // Fast fail: check if required signature glyphs are included
    if (profile.signatureGlyphs && profile.signatureGlyphs.length > 0) {
      const missing = profile.signatureGlyphs.filter(g => !nodes.includes(g));
      if (missing.length > 0) {
        applyLockout(profile);
        await profile.save();
        return res.status(401).json({ message: 'Invalid pattern.' });
      }
    }

    // Verify pattern
    const canonical = buildCanonicalPattern(nodes);
    const patternOk = await verifyPattern(canonical, profile.patternSalt, profile.patternHash);

    if (!patternOk) {
      console.warn(`[StarWeave Login] Pattern mismatch for ${email}. Canonical: ${canonical}`);
      applyLockout(profile);
      await profile.save();
      return res.status(401).json({
        message: 'Pattern not recognized.',
        attemptsRemaining: Math.max(0, 5 - (profile.failedAttempts % 5)),
      });
    }

    // Pattern OK — now check biometric rhythm similarity
    const biometricResult = checkBiometricSimilarity(profile, loginMetrics ?? {});
    if (!biometricResult.acceptable) {
      console.warn(`[StarWeave Login] Biometric mismatch for ${email}: ${biometricResult.reason}`);
      applyLockout(profile);
      await profile.save();
      return res.status(401).json({
        message: biometricResult.reason || 'Biometric verification failed.',
        attemptsRemaining: Math.max(0, 5 - (profile.failedAttempts % 5)),
      });
    }

    console.log(`[StarWeave Login] Successful identity match for ${email}`);
    const tokens = await generateToken(user._id, req, res);

    profile.failedAttempts = 0;
    profile.lockedUntil = null;

    if (loginMetrics) {
      updateBiometricProfile(profile, loginMetrics);
    }
    await profile.save();

    res.json({
      message: 'Authenticated.',
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt,
        authToken: tokens.accessToken,
        sessionId: tokens.sessionId
      }
    });
  } catch (err) {
    console.error('[StarWeave Login]', err);
    res.status(500).json({ message: 'Authentication error.' });
  }
}
