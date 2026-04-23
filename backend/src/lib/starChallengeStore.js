/**
 * Star Challenge Store
 *
 * In-memory store for ongoing star authentication challenges.
 * Stores the star field and user's selected stars for verification.
 *
 * In production with horizontal scaling, replace with Redis:
 *   redis.set(`starChallenge:${sessionId}`, JSON.stringify(data), 'EX', 300)
 */

const CHALLENGE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/** Map<sessionId, { starIds, selectedStars, mode, expiresAt }> */
const store = new Map();

// Sweep expired challenges every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [sessionId, data] of store) {
    if (data.expiresAt < now) {
      store.delete(sessionId);
    }
  }
}, 10 * 60 * 1000);

/**
 * Store a new star challenge
 * @param {string} sessionId - Unique challenge session ID
 * @param {string[]} starIds - Array of system IDs in the generated field
 * @param {string} mode - 'login' or 'signup'
 */
export function storeChallenge(sessionId, starIds, mode = 'login') {
  store.set(sessionId, {
    starIds,
    mode,
    selectedStars: null,
    createdAt: Date.now(),
    expiresAt: Date.now() + CHALLENGE_TTL_MS,
  });
}

/**
 * Retrieve a challenge by session ID
 * @param {string} sessionId
 */
export function getChallenge(sessionId) {
  const challenge = store.get(sessionId);
  if (!challenge) return null;

  // Check if expired
  if (challenge.expiresAt < Date.now()) {
    store.delete(sessionId);
    return null;
  }

  return challenge;
}

/**
 * Record user's star selection for a challenge
 * @param {string} sessionId
 * @param {string[]} selectedStars - Semantic names chosen by user
 */
export function recordSelection(sessionId, selectedStars) {
  const challenge = store.get(sessionId);
  if (!challenge) return false;

  if (challenge.expiresAt < Date.now()) {
    store.delete(sessionId);
    return false;
  }

  challenge.selectedStars = selectedStars;
  challenge.verifiedAt = Date.now();
  return true;
}

/**
 * Verify a challenge and clean up
 * @param {string} sessionId
 */
export function verifyChallenge(sessionId) {
  const challenge = store.get(sessionId);
  if (!challenge || challenge.expiresAt < Date.now()) {
    store.delete(sessionId);
    return null;
  }
  return challenge;
}

/**
 * Consume a challenge (delete after verification)
 * @param {string} sessionId
 */
export function consumeChallenge(sessionId) {
  const challenge = store.get(sessionId);
  store.delete(sessionId);
  return challenge;
}

/**
 * Clear all challenges (mainly for testing/cleanup)
 */
export function clearAll() {
  store.clear();
}
