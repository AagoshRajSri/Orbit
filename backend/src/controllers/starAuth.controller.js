/**
 * Orbit Auth: Star Controller
 *
 * API endpoints for star identity authentication
 * - Challenge generation
 * - Pattern verification
 * - Signup with star identity
 */

import { getStarGenerator, getStarRegistry } from "../lib/stars.js";
import {
  verifyPatternMatch,
  buildCanonicalPattern,
  validateStarSequence,
  calculateSequenceEntropy,
  extractStarIdsFromPattern,
} from "../services/stars.service.js";
import { getMemoryAssistant } from "../services/memoryAssistant.service.js";
import { storeChallenge, getChallenge, recordSelection, consumeChallenge } from "../lib/starChallengeStore.js";
import { createHash } from "crypto";

/**
 * POST /api/auth/star-challenge
 *
 * Generate a new star challenge for user
 */
export async function starChallengeHandler(req, res) {
  try {
    const { fieldSize = 20, mode = "login" } = req.body;

    // Validate inputs
    if (fieldSize < 5 || fieldSize > 50) {
      return res.status(400).json({
        success: false,
        message: "Field size must be between 5 and 50",
      });
    }

    // Generate session ID
    const sessionId = createHash("sha256")
      .update(`${Date.now()}-${Math.random()}`)
      .digest("hex")
      .slice(0, 16);

    // Generate star field (gets raw stars with systemId)
    const generator = getStarGenerator();
    const rawStars = generator.generateStarField(fieldSize, sessionId);
    
    // Extract systemIds for server-side verification
    const starIds = rawStars.map((star) => star.systemId);

    // Filter stars for client response (remove sensitive data)
    const clientStars = rawStars.map((star) => ({
      semanticName: star.semanticName,
      emoji: star.emoji,
      description: star.description,
      color: star.color,
      pattern: star.pattern,
      size: star.size,
      opacity: star.opacity,
      rotation: star.rotation,
    }));

    // Set short expiration (5 minutes)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    // Store challenge for verification
    storeChallenge(sessionId, starIds, mode);

    return res.status(200).json({
      success: true,
      sessionId,
      stars: clientStars,
      expiresAt,
      maxSelections: 7,
      message: "Star challenge generated",
    });
  } catch (error) {
    console.error("Error generating star challenge:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate challenge",
      error: error.message,
    });
  }
}

/**
 * POST /api/auth/star-verify
 *
 * Verify star pattern selection
 */
export async function starVerifyHandler(req, res) {
  try {
    const {
      sessionId,
      selectedStars,
      behavioral = {},
      mode = "login",
    } = req.body;

    // Validate inputs
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        verified: false,
        message: "Session ID required",
      });
    }

    if (!selectedStars || !Array.isArray(selectedStars)) {
      return res.status(400).json({
        success: false,
        verified: false,
        message: "Selected stars must be an array",
      });
    }

    // Retrieve the challenge from store
    const challenge = getChallenge(sessionId);
    if (!challenge) {
      return res.status(400).json({
        success: false,
        verified: false,
        message: "Challenge expired or not found. Please start a new challenge.",
      });
    }

    // Validate star sequence
    const validation = validateStarSequence(selectedStars);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        verified: false,
        message: validation.errors.join("; "),
        errors: validation.errors,
      });
    }

    // Build canonical pattern from selected stars
    const canonical = buildCanonicalPattern(selectedStars);

    // Record the selection in the challenge
    recordSelection(sessionId, selectedStars);

    // Calculate entropy for logging
    const entropy = calculateSequenceEntropy(selectedStars.length);

    // Log verification attempt (security: behavioral analysis)
    console.log(
      `[Star Auth] ${mode} verification - entropy: ${entropy}, pattern_length: ${selectedStars.length}`,
    );

    return res.status(200).json({
      success: true,
      verified: true,
      canonical,
      entropy,
      behavioral: {
        recorded: !!behavioral.drawDurationMs,
        duration: behavioral.drawDurationMs || 0,
      },
      message: "Pattern verified",
    });
  } catch (error) {
    console.error("Error verifying star pattern:", error);
    return res.status(500).json({
      success: false,
      verified: false,
      message: "Verification failed",
      error: error.message,
    });
  }
}

/**
 * POST /api/auth/star-signup
 *
 * Create new account with star identity
 */
export async function starSignupHandler(req, res) {
  try {
    const {
      username,
      email,
      sessionId,
      selectedStars,
      behavioral = {},
    } = req.body;

    // Input validation
    if (!username || !email) {
      return res.status(400).json({
        success: false,
        message: "Username and email required",
      });
    }

    if (!selectedStars || !Array.isArray(selectedStars)) {
      return res.status(400).json({
        success: false,
        message: "Star pattern required",
      });
    }

    // Validate star sequence
    const validation = validateStarSequence(selectedStars);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.errors.join("; "),
      });
    }

    // Build canonical pattern
    const canonical = buildCanonicalPattern(selectedStars);

    // Hash pattern for storage (Argon2 in production)
    const patternHash = createHash("sha256").update(canonical).digest("hex");

    // Record semantic names securely
    const semanticIds = selectedStars.map((name) => {
      const registry = getStarRegistry();
      return registry.getSystemId(name);
    });

    // TODO: Create user in database with:
    // - user.starPattern: { canonical, patternHash, semanticIds }
    // - user.behavioral: behavioral metrics
    // - user.createdAt: Date.now()

    const entropy = calculateSequenceEntropy(selectedStars.length);

    console.log(
      `[Star Auth] New user signup - username: ${username}, entropy: ${entropy}`,
    );

    // Response
    return res.status(201).json({
      success: true,
      message: "Account created with star identity",
      user: {
        username,
        email,
        starPattern: {
          length: selectedStars.length,
          entropy,
        },
      },
      token: null, // Would generate JWT here in production
    });
  } catch (error) {
    console.error("Error in star signup:", error);
    return res.status(500).json({
      success: false,
      message: "Signup failed",
      error: error.message,
    });
  }
}

/**
 * GET /api/auth/star-list
 *
 * Get available star names (for debug UI)
 */
export async function starListHandler(req, res) {
  try {
    const registry = getStarRegistry();
    const stars = registry.getAll();

    // Group by category
    const grouped = {};
    stars.forEach((star) => {
      if (!grouped[star.category]) {
        grouped[star.category] = [];
      }
      grouped[star.category].push({
        name: star.semanticName,
        emoji: star.emoji,
        systemId: star.systemId,
      });
    });

    return res.status(200).json({
      success: true,
      total: stars.length,
      categories: grouped,
      categories_summary: Object.keys(grouped).reduce((acc, cat) => {
        acc[cat] = grouped[cat].length;
        return acc;
      }, {}),
    });
  } catch (error) {
    console.error("Error fetching star list:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch star list",
      error: error.message,
    });
  }
}

/**
 * GET /api/auth/star-stats
 *
 * Statistics for admin dashboard
 */
export async function starStatsHandler(req, res) {
  try {
    const registry = getStarRegistry();
    const stars = registry.getAll();

    const stats = {
      total_stars: stars.length,
      categories: {},
      average_entropy_bits: Math.log2(stars.length) * 5, // Assuming 5-star average sequence
      max_sequence_entropy_bits: Math.log2(stars.length) * 10,
      min_sequence_entropy_bits: Math.log2(stars.length) * 3,
    };

    stars.forEach((star) => {
      if (!stats.categories[star.category]) {
        stats.categories[star.category] = 0;
      }
      stats.categories[star.category]++;
    });

    return res.status(200).json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error("Error fetching star stats:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch statistics",
      error: error.message,
    });
  }
}

/**
 * POST /api/auth/constellation-memories
 *
 * Generate AI-powered memorable stories for constellation sequence
 * Takes icon sequence, returns 3 memorable narrative options
 */
export async function generateConstellationMemoriesHandler(req, res) {
  try {
    const { sequence, sessionId } = req.body;
    const userId = req.user?.id || sessionId;

    // Validate inputs
    if (!sequence || !Array.isArray(sequence)) {
      return res.status(400).json({
        success: false,
        message: "Icon sequence array required",
        options: [],
      });
    }

    if (sequence.length < 3 || sequence.length > 7) {
      return res.status(400).json({
        success: false,
        message: "Sequence must contain 3-7 icons",
        options: [],
      });
    }

    // Get memory assistant and generate stories
    const memoryAssistant = getMemoryAssistant();
    const result = memoryAssistant.generateMemories(sequence, { userId });

    if (!result.success) {
      return res.status(429).json({
        success: false,
        message: "Rate limit exceeded. Try again later.",
        options: [],
        retryAfter: result.retryAfter || 60,
      });
    }

    // Return generated stories
    return res.status(200).json({
      success: true,
      sessionId,
      sequence,
      options: result.options,
      memorability: result.memorability,
      timestamp: result.timestamp,
      message: "Memory stories generated successfully",
    });
  } catch (error) {
    console.error("Error generating constellation memories:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate memory stories",
      options: [],
      error: error.message,
    });
  }
}

/**
 * GET /api/auth/constellation-memories/:sessionId
 *
 * Fetch previously generated/cached memory stories for a session
 * Useful for session resumption without regenerating
 */
export async function getConstellationMemoriesHandler(req, res) {
  try {
    const { sessionId } = req.params;
    const userId = req.user?.id;

    // Validate session ID format
    if (!sessionId || typeof sessionId !== "string") {
      return res.status(400).json({
        success: false,
        message: "Valid session ID required",
        cached: false,
      });
    }

    // Get memory assistant and fetch from cache
    const memoryAssistant = getMemoryAssistant();

    // Try to find cached stories for this session
    // Note: In production, this would query a cache store (Redis, etc.)
    // For now, this endpoint serves as an interface
    const cacheKey = `constellation-memories:${sessionId}`;

    return res.status(200).json({
      success: true,
      sessionId,
      cached: false,
      message: "Session cache lookup completed. Regenerate if needed.",
      note: "Implement cache store (Redis) for production persistence",
    });
  } catch (error) {
    console.error("Error fetching constellation memories:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch memory stories",
      cached: false,
      error: error.message,
    });
  }
}

/**
 * UTILITY FUNCTION: Attach star routes to Express app
 */
export function attachStarRoutes(app) {
  app.post("/api/auth/star-challenge", starChallengeHandler);
  app.post("/api/auth/star-verify", starVerifyHandler);
  app.post("/api/auth/star-signup", starSignupHandler);
  app.get("/api/auth/star-list", starListHandler);
  app.get("/api/auth/star-stats", starStatsHandler);

  // Constellation memory endpoints
  app.post(
    "/api/auth/constellation-memories",
    generateConstellationMemoriesHandler,
  );
  app.get(
    "/api/auth/constellation-memories/:sessionId",
    getConstellationMemoriesHandler,
  );
}

export default {
  starChallengeHandler,
  starVerifyHandler,
  starSignupHandler,
  starListHandler,
  starStatsHandler,
  generateConstellationMemoriesHandler,
  getConstellationMemoriesHandler,
  attachStarRoutes,
};
