import argon2 from "argon2";
import crypto from "crypto";
import ConstellationProfile from "../models/constellationProfile.model.js";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

/** Server-side pepper — NEVER stored in DB. Must be set in env. */
const PEPPER = process.env.CONSTELLATION_PEPPER;
if (!PEPPER && process.env.NODE_ENV === "production") {
  console.error(
    "[FATAL] CONSTELLATION_PEPPER env var is not set. Refusing to start.",
  );
  process.exit(1);
}
const EFFECTIVE_PEPPER =
  PEPPER || "dev_only_fallback_pepper_do_not_use_in_prod";

/** Argon2id tuning — OWASP recommended minimums for interactive logins */
const ARGON2_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 65536, // 64 MB
  timeCost: 3, // 3 iterations
  parallelism: 2,
};

/** Lockout schedule: 5 = 30s, 10 = 5m, 15 = 30m, 20+ = 2h */
const LOCKOUT_THRESHOLDS = [
  { attempts: 5, durationMs: 30 * 1000 },
  { attempts: 10, durationMs: 5 * 60 * 1000 },
  { attempts: 15, durationMs: 30 * 60 * 1000 },
  { attempts: 20, durationMs: 2 * 60 * 60 * 1000 },
];

/**
 * Build a canonical, deterministic string from an ordered edge list.
 * Uses only label data (from/to node labels).
 */
export function buildCanonicalPattern(edges) {
  if (!Array.isArray(edges) || edges.length === 0) {
    throw new Error("Pattern must be a non-empty array of edges.");
  }
  return edges
    .map(({ from, to }) => {
      if (!from || !to)
        throw new Error("Each edge must have 'from' and 'to' fields.");
      const f = String(from).trim().toUpperCase();
      const t = String(to).trim().toUpperCase();
      return `${f}>${t}`;
    })
    .join("|");
}

/**
 * Normalize raw screen-coordinate constellation edges onto a 100×100 unit grid.
 *
 * This ensures a pattern drawn on a 1080p screen and the same pattern drawn
 * on a 720p screen produce the identical canonical string after quantisation,
 * enabling resolution-independent authentication.
 *
 * If edges carry no coordinate data (fx/fy/tx/ty), falls back gracefully
 * to the label-only form from buildCanonicalPattern.
 *
 * @param {Array<{from:string, to:string, fx?:number, fy?:number, tx?:number, ty?:number}>} edges
 * @returns {string} canonical pattern string
 */
export function normalizeConstellation(edges) {
  if (!Array.isArray(edges) || edges.length === 0) {
    throw new Error("Pattern must be a non-empty array of edges.");
  }

  // Gather all coordinate values to derive a bounding box
  const allX = [];
  const allY = [];
  for (const e of edges) {
    if (typeof e.fx === "number") allX.push(e.fx);
    if (typeof e.tx === "number") allX.push(e.tx);
    if (typeof e.fy === "number") allY.push(e.fy);
    if (typeof e.ty === "number") allY.push(e.ty);
  }

  // Fall back to label-only form if no coordinate data was provided
  if (allX.length === 0 || allY.length === 0) {
    return buildCanonicalPattern(edges);
  }

  const minX = Math.min(...allX);
  const maxX = Math.max(...allX);
  const minY = Math.min(...allY);
  const maxY = Math.max(...allY);
  // Prevent division by zero for single-point patterns
  const rangeX = maxX - minX || 1;
  const rangeY = maxY - minY || 1;

  // Project value onto [0, 100] integer grid
  const norm = (v, min, range) => Math.round(((v - min) / range) * 100);

  return edges
    .map(({ from, to, fx, fy, tx, ty }) => {
      const f = String(from).trim().toUpperCase();
      const t = String(to).trim().toUpperCase();
      if (
        typeof fx === "number" && typeof fy === "number" &&
        typeof tx === "number" && typeof ty === "number"
      ) {
        const nfx = norm(fx, minX, rangeX);
        const nfy = norm(fy, minY, rangeY);
        const ntx = norm(tx, minX, rangeX);
        const nty = norm(ty, minY, rangeY);
        return `${f}(${nfx},${nfy})>${t}(${ntx},${nty})`;
      }
      // Edge has no coords — use label only
      return `${f}>${t}`;
    })
    .join("|");
}

export function generateSalt() {
  return crypto.randomBytes(32).toString("hex");
}

export async function hashPattern(canonicalPattern, salt) {
  const input = `${canonicalPattern}:${salt}:${EFFECTIVE_PEPPER}`;
  return argon2.hash(input, ARGON2_OPTIONS);
}

export async function verifyPattern(canonicalPattern, salt, storedHash) {
  const input = `${canonicalPattern}:${salt}:${EFFECTIVE_PEPPER}`;
  try {
    return await argon2.verify(storedHash, input);
  } catch {
    return false;
  }
}

export async function checkLockout(userId) {
  const profile = await ConstellationProfile.findOne({ userId })
    .select("failedAttempts lockedUntil")
    .lean();

  if (!profile) return { locked: false };

  if (profile.lockedUntil && profile.lockedUntil > new Date()) {
    return {
      locked: true,
      retryAfterMs: profile.lockedUntil.getTime() - Date.now(),
    };
  }
  return { locked: false };
}

export async function recordFailure(userId) {
  const profile = await ConstellationProfile.findOne({ userId }).select(
    "failedAttempts lockedUntil lastFailedAt",
  );
  if (!profile) return;

  profile.failedAttempts += 1;
  profile.lastFailedAt = new Date();

  const tier = [...LOCKOUT_THRESHOLDS]
    .reverse()
    .find((t) => profile.failedAttempts >= t.attempts);

  if (tier) {
    profile.lockedUntil = new Date(Date.now() + tier.durationMs);
  }

  await profile.save();
}

export async function recordSuccess(userId) {
  try {
    await ConstellationProfile.findOneAndUpdate(
      { userId },
      { $set: { failedAttempts: 0, lockedUntil: null, lastFailedAt: null } },
    );
  } catch (error) {
    console.error("[recordSuccess] Error resetting failures", error.message);
    throw error;
  }
}

export async function updateBehavioralProfile(
  userId,
  { drawDurationMs, timingVarianceMs },
) {
  const profile = await ConstellationProfile.findOne({ userId }).select(
    "behavioral",
  );
  if (!profile) return;

  const b = profile.behavioral;
  const n = b.sampleCount;

  if (n === 0) {
    b.avgDrawDurationMs = drawDurationMs;
    b.timingVarianceMs = timingVarianceMs;
  } else {
    b.avgDrawDurationMs = (b.avgDrawDurationMs * n + drawDurationMs) / (n + 1);
    b.timingVarianceMs = (b.timingVarianceMs * n + timingVarianceMs) / (n + 1);
  }
  b.sampleCount = n + 1;

  await profile.save();
}

export function isBehaviorAcceptable(
  profile,
  { drawDurationMs, timingVarianceMs },
) {
  const b = profile.behavioral;
  if (!b || b.sampleCount < 3) return true;

  const durationDelta = Math.abs(drawDurationMs - b.avgDrawDurationMs);
  const maxDurationDelta = Math.max(b.timingVarianceMs * 3, 2000);

  return durationDelta <= maxDurationDelta;
}

import { redisClient, isRedisAvailable } from "../lib/redis.js";

// IP-Level Failure Tracking
const _ipFailureMap = new Map();
export const IP_BLOCK_THRESHOLD = 15;
const IP_WINDOW_MS = 15 * 60 * 1000;

export async function recordIpFailure(ip) {
  if (isRedisAvailable) {
    const key = `ip_failure:${ip}`;
    const count = await redisClient.incr(key);
    if (count === 1) {
      await redisClient.pexpire(key, IP_WINDOW_MS);
    }
    return count;
  }

  const now = Date.now();
  const data = _ipFailureMap.get(ip);

  if (!data || data.resetAt < now) {
    _ipFailureMap.set(ip, { count: 1, resetAt: now + IP_WINDOW_MS });
    return 1;
  }

  data.count += 1;
  return data.count;
}

export async function resetIpFailures(ip) {
  if (isRedisAvailable) {
    await redisClient.del(`ip_failure:${ip}`);
  } else {
    _ipFailureMap.delete(ip);
  }
}

export async function getIpFailureCount(ip) {
  if (isRedisAvailable) {
    const count = await redisClient.get(`ip_failure:${ip}`);
    return count ? parseInt(count) : 0;
  }

  const now = Date.now();
  const data = _ipFailureMap.get(ip);
  if (!data || data.resetAt < now) return 0;
  return data.count;
}
