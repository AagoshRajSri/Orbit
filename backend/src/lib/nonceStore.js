import crypto from "crypto";

/**
 * In-memory nonce store with TTL cleanup.
 *
 * In production with horizontal scaling, replace this with a Redis-backed store:
 *   redis.set(`nonce:${nonce}`, '1', 'EX', 120)
 *   redis.del(`nonce:${nonce}`)
 *
 * Each nonce is a 32-byte random hex string, valid for 2 minutes.
 * It is tied to the client's IP + User-Agent to prevent cross-session replay.
 */

const NONCE_TTL_MS = 2 * 60 * 1000; // 2 minutes

/** Map<nonce, { expiresAt, ip, userAgent }> */
const store = new Map();

// Sweep expired nonces every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [nonce, data] of store) {
    if (data.expiresAt < now) store.delete(nonce);
  }
}, 5 * 60 * 1000);

/**
 * Issue a fresh challenge nonce.
 * @param {string} ip
 * @param {string} userAgent
 */
export function issueNonce(ip, userAgent) {
  const nonce = crypto.randomBytes(32).toString("hex");
  store.set(nonce, {
    expiresAt: Date.now() + NONCE_TTL_MS,
    ip,
    userAgent,
  });
  return nonce;
}

/**
 * Consume a nonce — idempotent single-use check.
 * Returns true if the nonce is valid and has not been used.
 * Deletes it immediately on success (prevents replay).
 *
 * @param {string} nonce
 * @param {string} ip
 * @param {string} userAgent
 */
export function consumeNonce(nonce, ip, userAgent) {
  if (!nonce) return false;
  const data = store.get(nonce);
  if (!data) return false;                       // unknown or already consumed
  if (data.expiresAt < Date.now()) {             // expired
    store.delete(nonce);
    return false;
  }
  if (data.ip !== ip || data.userAgent !== userAgent) { // session-binding check
    return false;
  }
  store.delete(nonce); // single-use: remove immediately
  return true;
}
