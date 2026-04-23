import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

const redisOpts = {
  lazyConnect: true,
  enableOfflineQueue: false,
  maxRetriesPerRequest: 1,
  retryStrategy: () => null, // No automatic reconnect loop
};

export const redisClient = new Redis(REDIS_URL, redisOpts);
export const pubClient   = new Redis(REDIS_URL, redisOpts);
export const subClient   = new Redis(REDIS_URL, redisOpts);

// Silence error events — startup errors are handled in connectRedis()
redisClient.on("error", () => {});
pubClient.on("error",   () => {});
subClient.on("error",   () => {});

export let isRedisAvailable = false;

/**
 * Attempts to connect to Redis. If unavailable, sets isRedisAvailable = false
 * so the rest of the system can degrade gracefully to single-node mode.
 */
export const connectRedis = async () => {
  try {
    await Promise.all([
      redisClient.connect(),
      pubClient.connect(),
      subClient.connect(),
    ]);
    isRedisAvailable = true;
    console.log("[Redis] Connected ✓ — Horizontal scaling & offline queue active.");
  } catch {
    isRedisAvailable = false;
    console.warn("[Redis] Not available — single-node mode. Start Redis on port 6379 to enable scaling.");
  }
};
