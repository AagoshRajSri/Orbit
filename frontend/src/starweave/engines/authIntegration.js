/**
 * authIntegration — StarWeave ↔ Orbit Constellation Auth connector.
 *
 * Adapts StarWeave's pattern format to Orbit's edge-based constellation backend.
 *
 * Endpoints used:
 *   GET  /api/auth/constellation/challenge   → { nonce: string }
 *   POST /api/auth/constellation/login       → sets auth cookie, returns user
 *
 * Pattern conversion:
 *   StarWeave canonical: "Solara:Veris:Calix:Deron:Elwyn"
 *   Orbit edges:         [{ from:'Solara', to:'Veris' }, { from:'Veris', to:'Calix' }, …]
 *
 * The conversion is done here; buildCanonicalPattern() in gestureEngine.js
 * is NOT changed — it remains the sacred serialisation the backend hashes.
 *
 * Environment variable:
 *   VITE_CONSTELLATION_API_URL  (defaults to /api/auth in dev, triggering mock mode)
 */

import { axiosInstance } from '../../lib/axios';

// DEV is the canonical Vite boolean — reliably true in dev, false in prod builds
const IS_MOCK  = !import.meta.env.VITE_CONSTELLATION_API_URL && import.meta.env.DEV;

// Dev-only logger — calls are eliminated by Vite tree-shaking in production
const logger = {
  info:  (...args) => { if (import.meta.env.DEV) console.info(...args);  },
  warn:  (...args) => { if (import.meta.env.DEV) console.warn(...args);  },
};

export class AuthError extends Error {
  constructor(message, code, retryAfterMs) {
    super(message);
    this.name        = 'AuthError';
    this.code        = code;
    this.retryAfterMs = retryAfterMs ?? null;
  }
}

export async function fetchChallenge(email, mode = 'constellation', actionType = null) {
  if (IS_MOCK) return {
    nonce: await _mockNonce(),
    emojiConfig: null,
    signatureGlyphs: [],
    configSignature: 'mock-sig'
  };

  const path = mode === 'starweave'
    ? `/starweave/challenge`
    : `/auth/constellation/challenge`;
    
  try {
    const params = {};
    if (email && mode === 'starweave') params.email = email;
    if (actionType) params.type = actionType;

    const res = await axiosInstance.get(path, { params });
    return res.data;
  } catch (err) {
    throw new AuthError(err.response?.data?.message || 'Failed to get challenge data', 'CHALLENGE_FAILED');
  }
}

// ─── Constellation auth submission (unchanged) ────────────────────────────────
/**
 * @param {Object} opts
 * @param {string} opts.userId           — user's email address
 * @param {string} opts.pattern          — canonical pattern string
 * @param {string} opts.nonce
 * @param {Object} opts.behavioralMetrics
 * @returns {Promise<{ user: Object }>}
 */
export async function submitAuth({ userId, pattern, nonce, behavioralMetrics }) {
  if (IS_MOCK) return _mockAuthFlow(userId, pattern);

  // Convert star sequence to edge pairs
  const stars = pattern.split(':');
  const edges = [];
  for (let i = 0; i < stars.length - 1; i++) {
    edges.push({ from: stars[i], to: stars[i + 1] });
  }

  const payload = {
    email: userId,
    edges,
    nonce,
    behavioral: behavioralMetrics
      ? {
          drawDurationMs:   (behavioralMetrics.timingsMs ?? []).reduce((a, b) => a + b, 0),
          timingVarianceMs: _stddev(behavioralMetrics.timingsMs ?? []),
        }
      : undefined,
    behavioral_metrics: behavioralMetrics
      ? {
          score:       behavioralMetrics.score ?? 0,
          timings_ms:  behavioralMetrics.timingsMs ?? [],
          avg_velocity: behavioralMetrics.avgVelocity ?? 0,
          jitter_rms:  behavioralMetrics.jitterRms ?? 0,
          anti_spoof:  {
            liveness:          behavioralMetrics.antiSpoof?.liveness ?? false,
            temporal:          behavioralMetrics.antiSpoof?.temporal ?? false,
            depth:             behavioralMetrics.antiSpoof?.depth ?? true,
            pattern_variation: behavioralMetrics.antiSpoof?.patternVariation ?? false,
            suspicion_level:   behavioralMetrics.antiSpoof?.suspicionLevel ?? 'none',
            recommendation:    behavioralMetrics.antiSpoof?.recommendation ?? 'allow',
          },
          client_version: '3.0.0',
        }
      : undefined,
  };

  const res = await axiosInstance.post('/auth/constellation/login', payload);
  const user = res.data;
  return { user };
}

// ─── StarWeave enrollment ─────────────────────────────────────────────────────
/**
 * Submit biometric enrollment to the StarWeave backend.
 * @param {Object} opts
 */
export async function enrollStarWeave({ username, email, password, nodes, pass1Metrics, pass2Metrics, nonce, emojiConfig, signatureGlyphs, configSignature }) {
  if (IS_MOCK) return _mockEnroll(email);

  if (signatureGlyphs?.length > 0) {
    const invalid = nodes.filter(n => !signatureGlyphs.includes(n));
    if (invalid.length > 0) throw new AuthError('Pattern contains volatile decoy stars. Please only use your permanent personal signature stars.', 'INVALID_PATTERN');
  }

  const payload = {
    username, email, password,
    nodes,
    nonce, emojiConfig, signatureGlyphs, configSignature,
    pass1Metrics, pass2Metrics,
  };

  try {
    const res = await axiosInstance.post('/starweave/enroll', payload);
    return res.data;
} catch (err) {
    throw new AuthError(err.response?.data?.message || 'Enrollment failed', err.response?.status === 409 ? 'DUPLICATE' : 'ENROLL_FAILED');
  }
}

// ─── StarWeave login ──────────────────────────────────────────────────────────
export async function submitStarWeaveLogin({ email, nodes, loginMetrics, nonce, emojiConfig, signatureGlyphs, configSignature }) {
  if (IS_MOCK) return _mockAuthFlow(email, nodes?.join(':') ?? '');

  if (signatureGlyphs?.length > 0) {
    const invalid = nodes.filter(n => !signatureGlyphs.includes(n));
    if (invalid.length > 0) throw new AuthError('Pattern contains volatile decoy stars. Please only use your permanent personal signature stars.', 'INVALID_PATTERN');
  }

  try {
    const res = await axiosInstance.post('/starweave/login', {
      email, nodes, nonce, loginMetrics, emojiConfig, signatureGlyphs, configSignature
    });
    return res.data;
  } catch (err) {
    const code = err.response?.status === 429 ? 'RATE_LIMITED' : 'AUTH_FAILED';
    throw new AuthError(err.response?.data?.message || 'Authentication failed', code, err.response?.data?.retryAfterMs);
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function _stddev(arr) {
  if (!arr || arr.length < 2) return 0;
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  return Math.sqrt(arr.reduce((a, v) => a + (v - mean) ** 2, 0) / arr.length);
}

// ─── Mock auth (development — no API URL set) ─────────────────────────────────
async function _mockNonce() {
  await new Promise(r => setTimeout(r, 200));
  return `starweave-dev-nonce-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

async function _mockAuthFlow(userId, pattern) {
  logger.info('[StarWeave Dev] Mock auth — pattern:', pattern);
  await new Promise(r => setTimeout(r, 1200));

  const stars = pattern.split(':');
  if (stars.length < 3) {
    throw new AuthError(
      `Need at least 3 nodes; got ${stars.length}`,
      'PATTERN_TOO_SHORT'
    );
  }

  return {
    user: {
      _id:       'starweave-mock-user',
      email:     userId,
      username:  userId.split('@')[0],
      createdAt: new Date().toISOString(),
    },
  };
}

async function _mockEnroll(email) {
  logger.info('[StarWeave Dev] Mock enroll —', email);
  await new Promise(r => setTimeout(r, 900));
  return {
    message: 'Enrolled (dev mock).',
    user: { _id: 'sw-mock', email, username: email.split('@')[0] },
  };
}
