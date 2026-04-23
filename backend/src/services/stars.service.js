/**
 * Orbit Auth: Star Service
 *
 * Backend service for star identity operations
 * - Pattern building from star selections
 * - Star verification
 * - Behavioral metrics collection
 */

import crypto from "crypto";
import {
  getStarRegistry,
  getStarGenerator,
  SeededRandom,
} from "../lib/stars.js";

/**
 * BUILD CANONICAL PATTERN
 *
 * Convert user's semantic star sequence to canonical form
 * Format: "A2>F1|F1>C3|C3>B7" (directed edges between stars)
 *
 * This is deterministic and doesn't leak which stars were selected
 * Only the hidden IDs are used
 */
export function buildCanonicalPattern(semanticLabels) {
  const registry = getStarRegistry();

  // Convert semantic labels → system IDs
  const systemIds = semanticLabels.map((label) => {
    const star = registry.getBySemantic(label);
    return star.systemId;
  });

  // Build edge sequence (star1 > star2 | star2 > star3 | ...)
  const edges = [];
  for (let i = 0; i < systemIds.length - 1; i++) {
    edges.push(`${systemIds[i]}>${systemIds[i + 1]}`);
  }

  return edges.join("|");
}

/**
 * VERIFY PATTERN MATCH
 *
 * Check if two sequences produce the same canonical pattern
 * Constant-time comparison to prevent timing attacks
 */
export function verifyPatternMatch(userSemanticLabels, storedCanonical) {
  const userCanonical = buildCanonicalPattern(userSemanticLabels);

  // Constant-time string comparison
  return constantTimeEquals(userCanonical, storedCanonical);
}

/**
 * CONSTANT-TIME STRING COMPARISON
 * Prevents timing attacks on pattern verification
 */
function constantTimeEquals(a, b) {
  // Ensure equal length
  const len = Math.max(a.length, b.length);
  const aBuffer = Buffer.alloc(len);
  const bBuffer = Buffer.alloc(len);

  aBuffer.write(a);
  bBuffer.write(b);

  let result = 0;
  for (let i = 0; i < len; i++) {
    result |= aBuffer[i] ^ bBuffer[i];
  }

  return result === 0;
}

/**
 * EXTRACT STARS FROM PATTERN
 * Reverse operation: canonical pattern → system IDs
 */
export function extractStarIdsFromPattern(canonical) {
  // Pattern format: "A2>F1|F1>C3|C3>B7"
  const edges = canonical.split("|");
  const ids = new Set();

  edges.forEach((edge) => {
    const [from, to] = edge.split(">");
    ids.add(from);
    ids.add(to);
  });

  // Return ordered sequence (first ID from first edge, then follow chain)
  const result = [];
  let current = edges[0].split(">")[0];
  result.push(current);

  for (let i = 0; i < edges.length; i++) {
    const [from, to] = edges[i].split(">");
    if (from === current) {
      current = to;
      result.push(current);
    }
  }

  return result;
}

/**
 * GENERATE STAR CHALLENGE
 * Create a star field for login/signup
 */
export function generateStarChallenge(sessionId, fieldSize = 20) {
  const generator = getStarGenerator();

  // Generate star field with session seed
  const stars = generator.generateStarField(fieldSize, sessionId);

  return {
    sessionId,
    stars: stars.map((star) => ({
      semanticName: star.semanticName,
      emoji: star.emoji,
      description: star.description,
      color: star.color,
      pattern: star.pattern,
      size: star.size,
      opacity: star.opacity,
      rotation: star.rotation,
      // NOTE: systemId and hash hidden from client
    })),
    timestamp: new Date(),
    expiresAt: new Date(Date.now() + 2 * 60 * 1000), // 2-minute expiry
  };
}

/**
 * VERIFY STAR RECOGNITION
 * Check if selected stars exist and are valid
 */
export function verifyStarRecognition(semanticLabels) {
  const registry = getStarRegistry();

  try {
    semanticLabels.forEach((label) => {
      registry.getBySemantic(label);
    });
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * GET SEMANTIC NAMES FOR UI
 * Provide dropdown/selection list
 */
export function getAvailableStarNames() {
  const registry = getStarRegistry();
  return registry.getAllSemanticNames();
}

/**
 * GET STAR STATS
 * Return system information
 */
export function getStarSystemStats() {
  const registry = getStarRegistry();

  return {
    totalStars: registry.count(),
    idFormat: "A0–Z9 (260 possible)",
    colorCount: 30,
    patternTypes: 5,
    combinatorialSpace: "100,000+ unique variations per star",
  };
}

/**
 * MAP SEMANTIC TO SYSTEM ID
 * Internal: map user-friendly names to hidden IDs (bidirectional)
 */
export function mapSemanticToSystemId(semanticLabel) {
  const registry = getStarRegistry();
  const star = registry.getBySemantic(semanticLabel);
  return star.systemId;
}

export function mapSystemIdToSemantic(systemId) {
  const registry = getStarRegistry();
  const star = registry.getById(systemId);
  return star.semanticName;
}

/**
 * CALCULATE SEQUENCE ENTROPY
 * Measure predictability of a star sequence
 */
export function calculateSequenceEntropy(semanticLabels) {
  // Simple entropy: log2(choices per position) * position count
  const totalStars = getStarRegistry().count();
  const positions = semanticLabels.length;

  // Theoretical entropy: each position has ~totalStars choices
  const theoreticalBits = Math.log2(totalStars) * positions;

  return {
    theoreticalBits: theoreticalBits,
    estimatedAttempts: Math.pow(2, theoreticalBits),
    description: `~${Math.pow(2, theoreticalBits).toExponential(2)} possible sequences`,
  };
}

/**
 * VALIDATE STAR SEQUENCE
 * Check if sequence meets requirements
 */
export function validateStarSequence(semanticLabels) {
  const errors = [];

  // Length check
  if (semanticLabels.length < 4) {
    errors.push("Sequence too short (minimum 4 stars)");
  }
  if (semanticLabels.length > 7) {
    errors.push("Sequence too long (maximum 7 stars)");
  }

  // No duplicates
  const unique = new Set(semanticLabels);
  if (unique.size !== semanticLabels.length) {
    errors.push("Cannot repeat stars in sequence");
  }

  // All stars valid
  if (!verifyStarRecognition(semanticLabels)) {
    errors.push("One or more stars not recognized");
  }

  return {
    valid: errors.length === 0,
    errors: errors,
  };
}

/**
 * NORMALIZE STAR LABELS
 * Handle user input variations (case, whitespace)
 */
export function normalizeStarLabel(label) {
  return label
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_") // spaces → underscores
    .replace(/[^\w_]/g, ""); // remove special chars
}

/**
 * EXPORT FOR TESTING/DEBUGGING
 */
export const STAR_SERVICE_DEBUG = {
  getRegistry: () => getStarRegistry(),
  getGenerator: () => getStarGenerator(),
  buildCanonical: buildCanonicalPattern,
  extractIds: extractStarIdsFromPattern,
};
