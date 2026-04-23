/**
 * starweave.service.js — Biometric hash logic for StarWeave auth
 *
 * Uses the same Argon2id + salt + pepper pattern as the existing
 * Constellation service for consistency and security parity.
 */
import argon2  from 'argon2';
import crypto  from 'crypto';

const PEPPER = process.env.CONSTELLATION_PEPPER;
const EFFECTIVE_PEPPER = PEPPER || 'dev_only_fallback_pepper_do_not_use_in_prod';

const ARGON2_OPTS = {
  type:       argon2.argon2id,
  memoryCost: 65536,
  timeCost:   3,
  parallelism: 2,
};

// ─── Lockout schedule ─────────────────────────────────────────────────────────
const LOCKOUT = [
  { attempts:  5, durationMs: 30 * 1000           },
  { attempts: 10, durationMs:  5 * 60 * 1000      },
  { attempts: 15, durationMs: 30 * 60 * 1000      },
  { attempts: 20, durationMs:  2 * 60 * 60 * 1000 },
];

// ─── Biometric tolerance bands ────────────────────────────────────────────────
// How many std deviations from enrolled profile a login attempt is allowed
const DWELL_TOLERANCE       = 3.5;  // ×σ from enrolled avg dwell
const FLIGHT_TOLERANCE      = 3.5;
const TOTAL_DURATION_FACTOR = 2.5;  // total gesture must be within 2.5× enrolled

export function generateSalt() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Build a canonical pattern string from an ordered node array.
 * e.g. ['Ignis','Luna','Volta','Lyra','Mare'] → "IGNIS>LUNA|LUNA>VOLTA|..."
 */
export function buildCanonicalPattern(nodes) {
  if (!Array.isArray(nodes) || nodes.length < 2) {
    throw new Error('Pattern must have at least 2 nodes.');
  }
  const pairs = [];
  for (let i = 0; i < nodes.length - 1; i++) {
    const a = String(nodes[i]).trim().toUpperCase();
    const b = String(nodes[i + 1]).trim().toUpperCase();
    pairs.push(`${a}>${b}`);
  }
  return pairs.join('|');
}

/** Hash the canonical pattern against salt + pepper via Argon2id. */
export async function hashPattern(canonicalPattern, salt) {
  const input = `${canonicalPattern}:${salt}:${EFFECTIVE_PEPPER}`;
  return argon2.hash(input, ARGON2_OPTS);
}

/** Constant-time verify. Returns true only on exact match. */
export async function verifyPattern(canonicalPattern, salt, storedHash) {
  const input = `${canonicalPattern}:${salt}:${EFFECTIVE_PEPPER}`;
  try {
    return await argon2.verify(storedHash, input);
  } catch {
    return false;
  }
}

/**
 * Compute averaged biometric vector from two enrollment passes.
 * Stored values are statistical summaries — never raw samples.
 */
export function averageBiometrics(pass1, pass2) {
  function avg(a, b) { return (a + b) / 2; }
  function stddev(arr) {
    if (!arr?.length) return 0;
    const mean = arr.reduce((s, v) => s + v, 0) / arr.length;
    return Math.sqrt(arr.reduce((s, v) => s + (v - mean) ** 2, 0) / arr.length);
  }

  const dwell1 = pass1.dwellDurations ?? [];
  const dwell2 = pass2.dwellDurations ?? [];
  const vel1   = pass1.flightVelocities ?? [];
  const vel2   = pass2.flightVelocities ?? [];
  const ang1   = pass1.entryAngles ?? [];
  const ang2   = pass2.entryAngles ?? [];

  const avgDwell1 = dwell1.length ? dwell1.reduce((a,b)=>a+b,0)/dwell1.length : 0;
  const avgDwell2 = dwell2.length ? dwell2.reduce((a,b)=>a+b,0)/dwell2.length : 0;
  const avgVel1   = vel1.length   ? vel1.reduce((a,b)=>a+b,0)/vel1.length     : 0;
  const avgVel2   = vel2.length   ? vel2.reduce((a,b)=>a+b,0)/vel2.length     : 0;
  const avgAng1   = ang1.length   ? ang1.reduce((a,b)=>a+b,0)/ang1.length     : 0;
  const avgAng2   = ang2.length   ? ang2.reduce((a,b)=>a+b,0)/ang2.length     : 0;

  return {
    avgDwellMs:        avg(avgDwell1, avgDwell2),
    dwellVarianceMs:   avg(stddev(dwell1), stddev(dwell2)),
    avgFlightVelocity: avg(avgVel1, avgVel2),
    flightVariance:    avg(stddev(vel1), stddev(vel2)),
    avgCurvature:      avg(pass1.spatialCurvature ?? 0, pass2.spatialCurvature ?? 0),
    avgEntryAngle:     avg(avgAng1, avgAng2),
    totalDurationMs:   avg(pass1.totalDurationMs ?? 0, pass2.totalDurationMs ?? 0),
    sampleCount:       2,
  };
}

/**
 * Check biometric similarity between login attempt and enrolled profile.
 * Returns { acceptable: bool, reason?: string }
 */
export function checkBiometricSimilarity(profile, loginMetrics) {
  const enr = profile.biometric;
  if (!enr || enr.sampleCount < 2) {
    // Not enough data yet — be permissive during initial logins
    return { acceptable: true };
  }

  const dwellDelta = Math.abs((loginMetrics.avgDwellMs ?? 0) - enr.avgDwellMs);
  const maxDwell   = Math.max(enr.dwellVarianceMs * DWELL_TOLERANCE, 400);
  if (dwellDelta > maxDwell) {
    return { acceptable: false, reason: 'Rhythm mismatch — dwell timing anomaly.' };
  }

  const velDelta = Math.abs((loginMetrics.avgFlightVelocity ?? 0) - enr.avgFlightVelocity);
  const maxVel   = Math.max(enr.flightVariance * FLIGHT_TOLERANCE, 0.02);
  if (velDelta > maxVel) {
    return { acceptable: false, reason: 'Rhythm mismatch — movement velocity anomaly.' };
  }

  const durDelta = (loginMetrics.totalDurationMs ?? 0);
  if (durDelta > 0 && enr.totalDurationMs > 0) {
    const ratio = durDelta / enr.totalDurationMs;
    if (ratio > TOTAL_DURATION_FACTOR || ratio < 1 / TOTAL_DURATION_FACTOR) {
      return { acceptable: false, reason: 'Rhythm mismatch — gesture timing anomaly.' };
    }
  }

  return { acceptable: true };
}

/** Check if profile is currently locked out. */
export function checkLockout(profile) {
  if (profile.lockedUntil && profile.lockedUntil > new Date()) {
    return { locked: true, retryAfterMs: profile.lockedUntil.getTime() - Date.now() };
  }
  return { locked: false };
}

/** Apply progressive lockout after a failed attempt. */
export function applyLockout(profile) {
  profile.failedAttempts += 1;
  const tier = [...LOCKOUT].reverse().find(t => profile.failedAttempts >= t.attempts);
  if (tier) profile.lockedUntil = new Date(Date.now() + tier.durationMs);
}

/** Update rolling biometric average with running Welford mean. */
export function updateBiometricProfile(profile, loginMetrics) {
  const b = profile.biometric;
  const n = b.sampleCount;
  const m = (prev, next) => n === 0 ? next : (prev * n + next) / (n + 1);

  b.avgDwellMs        = m(b.avgDwellMs,        loginMetrics.avgDwellMs        ?? 0);
  b.dwellVarianceMs   = m(b.dwellVarianceMs,    loginMetrics.dwellVarianceMs   ?? 0);
  b.avgFlightVelocity = m(b.avgFlightVelocity,  loginMetrics.avgFlightVelocity ?? 0);
  b.flightVariance    = m(b.flightVariance,      loginMetrics.flightVariance    ?? 0);
  b.avgCurvature      = m(b.avgCurvature,        loginMetrics.avgCurvature      ?? loginMetrics.spatialCurvature ?? 0);
  b.avgEntryAngle     = m(b.avgEntryAngle,       loginMetrics.avgEntryAngle     ?? 0);
  b.totalDurationMs   = m(b.totalDurationMs,     loginMetrics.totalDurationMs   ?? 0);
  b.sampleCount       = n + 1;
}
