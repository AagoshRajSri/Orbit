import mongoose from "mongoose";

/**
 * ConstellationProfile — the ONLY thing stored about a user's auth pattern.
 *
 * NEVER stored:
 *   - raw canonical pattern strings
 *   - star positions / screen coordinates
 *   - gesture paths / drawing data
 *   - any reversible representation of the pattern
 *
 * STORED:
 *   - argon2 hash of (pattern + salt + pepper)
 *   - per-user salt (random, never derived from pattern)
 *   - aggregated behavioral stats (no raw samples)
 */
const constellationProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    // Argon2id hash of: canonicalPattern + salt + CONSTELLATION_PEPPER
    patternHash: { type: String, required: true, select: false },

    // Per-user random salt (32-byte hex). NOT derived from the pattern.
    salt: { type: String, required: true, select: false },

    // ── Icon Selection (for login recovery) ─────────────────────────────────────
    // The icon names (e.g., "Apple", "Orange", "Cat") that user selected during signup
    // Used to show during login along with other random icons
    selectedIcons: { type: [String], default: [] },

    // ── Aggregated Behavioral Profile ─────────────────────────────────────────
    // Only statistical summaries. No raw samples, no timestamps, no sequences.
    behavioral: {
      avgDrawDurationMs: { type: Number, default: null }, // mean time to complete pattern
      timingVarianceMs: { type: Number, default: null }, // std-dev of inter-click timing
      sampleCount: { type: Number, default: 0 }, // how many logins trained this
    },

    // ── Lockout / Rate-limiting metadata ─────────────────────────────────────
    failedAttempts: { type: Number, default: 0 },
    lockedUntil: { type: Date, default: null },
    lastFailedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

// Hard limit: never return hash/salt in a query unless explicitly asked
constellationProfileSchema.set("toJSON", {
  transform: (_, ret) => {
    delete ret.patternHash;
    delete ret.salt;
    return ret;
  },
});

const ConstellationProfile = mongoose.model(
  "ConstellationProfile",
  constellationProfileSchema,
);
export default ConstellationProfile;
