import crypto from "crypto";
import { redisClient, isRedisAvailable } from "./redis.js";

/**
 * Distributed Nonce Store with TTL cleanup.
 *
 * Provides distributed replay protection.
 * Uses atomic GETDEL to ensure no race-condition replay windows.
 */

const NONCE_TTL_S = 2 * 60; // 2 minutes
const NONCE_TTL_MS = NONCE_TTL_S * 1000;

/** Fallback Map<nonce, { expiresAt, ip, userAgent }> */
const fallbackStore = new Map();

// Sweep expired nonces every 5 minutes for fallback store
setInterval(() => {
  const now = Date.now();
  for (const [nonce, data] of fallbackStore) {
    if (data.expiresAt < now) fallbackStore.delete(nonce);
  }
}, 5 * 60 * 1000);

/**
 * Issue a fresh challenge nonce.
 * @param {string|null} ip - IP address (optional)
 * @param {string|null} userAgent - User Agent (optional)
 */
export async function issueNonce(ip = null, userAgent = null) {
  const nonce = crypto.randomBytes(32).toString("hex");
  const payloadData = { ip, userAgent };
  
  if (isRedisAvailable) {
    const payload = JSON.stringify(payloadData);
    await redisClient.set(`nonce:${nonce}`, payload, 'EX', NONCE_TTL_S);
  } else {
    fallbackStore.set(nonce, {
      expiresAt: Date.now() + NONCE_TTL_MS,
      ...payloadData
    });
  }
  return nonce;
}

/**
 * Consume a nonce — idempotent single-use check.
 * Atomic validation preventing race-condition replays in distributed environments.
 *
 * @param {string} nonce
 * @param {string|null} ip
 * @param {string|null} userAgent
 */
export async function consumeNonce(nonce, ip = null, userAgent = null) {
  if (!nonce) return false;

  if (isRedisAvailable) {
    let payload;
    try {
      // Atomic get-and-delete prevents race conditions
      payload = await redisClient.getdel(`nonce:${nonce}`);
    } catch (err) {
      // Fallback to GET then DEL if GETDEL is not supported by Redis version
      payload = await redisClient.get(`nonce:${nonce}`);
      if (payload) await redisClient.del(`nonce:${nonce}`);
    }

    if (!payload) return false;

    try {
      const data = JSON.parse(payload);
      if (ip && data.ip !== ip) return false;
      if (userAgent && data.userAgent !== userAgent) return false;
      return true;
    } catch {
      return false;
    }
  } else {
    const data = fallbackStore.get(nonce);
    if (!data) return false;
    if (data.expiresAt < Date.now()) {
      fallbackStore.delete(nonce);
      return false;
    }
    if (ip && data.ip !== ip) return false;
    if (userAgent && data.userAgent !== userAgent) return false;
    
    fallbackStore.delete(nonce);
    return true;
  }
}
