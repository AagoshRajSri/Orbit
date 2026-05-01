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
