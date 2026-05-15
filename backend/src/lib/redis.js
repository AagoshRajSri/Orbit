import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

const redisOpts = {
  lazyConnect: true,
  enableOfflineQueue: false, // Fail fast if disconnected
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => {
    // Exponential backoff with 10s max
    const delay = Math.min(times * 500, 10000);
    if (times % 10 === 0 || isRedisAvailable) {
      console.warn(`[Redis] Reconnecting in ${delay}ms (Attempt ${times})...`);
    }
    return delay;
  },
};

export const redisClient = new Redis(REDIS_URL, redisOpts);
export const pubClient   = new Redis(REDIS_URL, redisOpts);
export const subClient   = new Redis(REDIS_URL, redisOpts);

export let isRedisAvailable = false;

// Health monitoring and failover detection
const handleReady = () => {
  if (!isRedisAvailable) {
    console.log('[Redis] Connection established ✓');
    isRedisAvailable = true;
  }
};

const handleEnd = () => {
  if (isRedisAvailable) {
    console.warn('[Redis] Connection lost! Security systems degrading to fallback mode.');
    isRedisAvailable = false;
  }
};

redisClient.on('ready', handleReady);
redisClient.on('end', handleEnd);
redisClient.on('error', (err) => {
  if (isRedisAvailable) {
    console.error(`[Redis] Error: ${err.message}`);
  }
});

pubClient.on("error", () => {});
subClient.on("error", () => {});

/**
 * Attempts to connect to Redis.
 */
export const connectRedis = async () => {
  try {
    // If running in production with a REDIS_URL, we enforce connection
    await Promise.all([
      redisClient.connect(),
      pubClient.connect(),
      subClient.connect(),
    ]);
    isRedisAvailable = true;
    console.log("[Redis] Connected ✓ — Horizontal scaling active.");
  } catch (err) {
    isRedisAvailable = false;
    if (process.env.NODE_ENV === "production" && process.env.REDIS_URL) {
      console.error("[FATAL] Redis connection failed in production. Security systems require Redis. Exiting.");
      process.exit(1);
    }
    console.warn("[Redis] Not available — single-node mode. Start Redis on port 6379 to enable scaling.");
  }
};
