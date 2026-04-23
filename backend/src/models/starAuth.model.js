/**
 * Orbit Auth: Star Pattern Model
 *
 * Database schema for storing star identity credentials
 * - Canonical pattern (hashed)
 * - Semantic IDs (encrypted)
 * - Behavioral metrics (anonymized)
 */

// Using your existing user.model.js structure
// Add this to User schema as a subdocument

export const starPatternSchema = {
  // Canonical pattern: hashed for verification
  canonical: {
    type: String,
    required: true,
    description: "Hashed canonical edge sequence A0>F1|F1>C3|C3>B7...",
    index: true, // Index for quick pattern lookup
    minlength: 10,
    maxlength: 500,
  },

  // Pattern hash (Argon2 in production)
  patternHash: {
    type: String,
    required: true,
    description: "Argon2 hash of canonical pattern for additional security",
  },

  // Semantic system IDs (A0, F1, C3, etc.)
  semanticIds: {
    type: [String],
    required: true,
    min: 3,
    max: 10,
    description: "System IDs corresponding to selected stars A0-Z9",
  },

  // Semantic names (banana, dog, book) - encrypted
  semanticNames: {
    type: [String],
    required: true,
    description:
      "User-recognizable star names (should be encrypted in production)",
    select: false, // Don't return in queries by default
  },

  // Pattern metadata
  length: {
    type: Number,
    required: true,
    min: 3,
    max: 10,
    description: "How many stars in the pattern",
  },

  entropy: {
    type: Number,
    required: true,
    description: "Theoretical brute-force entropy in bits",
  },

  // Creation and update tracking
  createdAt: {
    type: Date,
    default: Date.now,
    description: "When pattern was first created",
  },

  updatedAt: {
    type: Date,
    default: Date.now,
    description: "When pattern was last changed",
  },

  // Version tracking (for pattern migrations)
  version: {
    type: Number,
    default: 1,
    description: "Star system version when pattern was created",
  },

  // Status tracking
  isActive: {
    type: Boolean,
    default: true,
    description: "Whether this pattern is currently active for authentication",
  },

  // Fallback patterns (optional)
  fallbackPatterns: {
    type: [
      {
        canonical: String,
        patternHash: String,
        createdAt: Date,
      },
    ],
    description: "Previous patterns for account recovery",
    max: 3,
  },
};

/**
 * BEHAVIORAL METRICS SCHEMA
 * Stores anonymized behavioral data collected during pattern selection
 */
export const behavioralMetricsSchema = {
  // Timing metrics (anonymized)
  drawDurationMs: {
    type: Number,
    description: "Total time to complete star selection in milliseconds",
  },

  avgInterClickMs: {
    type: Number,
    description: "Average time between star selections",
  },

  avgVelocityPixelsPerMs: {
    type: Number,
    description: "Average mouse velocity during interactions",
  },

  radiusVariance: {
    type: Number,
    description: "Variance in distance of clicks from screen center",
  },

  // Consistency metrics
  consistencyScore: {
    type: Number,
    min: 0,
    max: 100,
    description: "How consistent behavioral metrics are across logins (0-100)",
  },

  // First collection time
  firstCollectedAt: {
    type: Date,
    default: Date.now,
  },

  // Sample count
  samples: {
    type: Number,
    default: 1,
    description: "Number of times behavioral data has been recorded",
  },
};

/**
 * STAR AUTH SESSION SCHEMA
 * Temporary session for ongoing authentication
 */
export const starAuthSessionSchema = {
  sessionId: {
    type: String,
    required: true,
    unique: true,
    maxlength: 32,
    description: "Unique session identifier",
  },

  userId: {
    type: String,
    description: "User attempting authentication (optional for signup)",
  },

  mode: {
    type: String,
    enum: ["login", "signup"],
    default: "login",
  },

  challenge: {
    type: {
      stars: [
        {
          semanticName: String,
          emoji: String,
          color: Object,
          systemId: String,
        },
      ],
      fieldSize: Number,
    },
    required: true,
  },

  challenge_hash: {
    type: String,
    description: "SHA256 hash of challenge for integrity verification",
  },

  attempts: {
    type: Number,
    default: 0,
    max: 5,
    description: "Number of verification attempts for this session",
  },

  maxAttempts: {
    type: Number,
    default: 5,
    description: "Maximum allowed attempts before session invalidation",
  },

  verified: {
    type: Boolean,
    default: false,
    description: "Whether the user successfully verified their pattern",
  },

  createdAt: {
    type: Date,
    default: Date.now,
    ttl: 300, // Expire session after 5 minutes
  },

  expiresAt: {
    type: Date,
    description: "Exact expiration time for session",
  },

  clientIP: {
    type: String,
    description: "IP address of client (for security audit)",
  },

  userAgent: {
    type: String,
    description: "User agent string (for security audit)",
  },
};

/**
 * STAR VERIFICATION LOG
 * Audit trail for security monitoring
 */
export const starVerificationLogSchema = {
  userId: {
    type: String,
    indexed: true,
    required: true,
  },

  sessionId: {
    type: String,
    required: true,
  },

  mode: {
    type: String,
    enum: ["login", "signup", "pattern_change"],
  },

  success: {
    type: Boolean,
    required: true,
  },

  reason: {
    type: String,
    description: "Why verification succeeded/failed",
  },

  behavioralConsistency: {
    type: Number,
    min: 0,
    max: 100,
    description: "Match score with typical user behavior",
  },

  anomalyFlags: {
    type: [String],
    description: "Detected anomalies (timing, velocity, location, etc.)",
  },

  clientIP: String,
  userAgent: String,

  timestamp: {
    type: Date,
    default: Date.now,
    indexed: true,
  },
};

/**
 * EXAMPLE: Add to existing User model
 *
 * const userSchema = new Schema({
 *   username: String,
 *   email: String,
 *   // ... other fields
 *
 *   // Add star authentication
 *   starAuth: {
 *     primaryPattern: starPatternSchema,
 *     behavioral: behavioralMetricsSchema,
 *     isEnabled: { type: Boolean, default: false },
 *     lastAuthAt: Date
 *   }
 * });
 */

export default {
  starPatternSchema,
  behavioralMetricsSchema,
  starAuthSessionSchema,
  starVerificationLogSchema,
};
