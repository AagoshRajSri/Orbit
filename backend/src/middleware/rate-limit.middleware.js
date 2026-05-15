import rateLimit from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import { redisClient, isRedisAvailable } from "../lib/redis.js";

const standardHeaders = true;
const legacyHeaders = false;

/**
 * Wrapper to dynamically create and apply Redis-backed rate limiters
 * AFTER the Redis connection status is resolved. Gracefully falls back
 * to in-memory limiters if Redis is unavailable.
 */
const createLimiter = (inputOptions) => {
  const { name, ...options } = inputOptions;
  let redisLimiter = null;
  const memoryLimiter = rateLimit(options); // Default in-memory fallback

  return (req, res, next) => {
    if (isRedisAvailable) {
      if (!redisLimiter) {
        redisLimiter = rateLimit({
          ...options,
          store: new RedisStore({
            sendCommand: (...args) => redisClient.call(...args),
            prefix: `rl:${name}:`
          })
        });
      }
      return redisLimiter(req, res, next);
    }
    return memoryLimiter(req, res, next);
  };
};

// 1. General API Limiter - 100 requests per minute
export const apiLimiter = createLimiter({
  name: "api",
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders,
  legacyHeaders,
  message: { success: false, error: { code: "RATE_LIMIT", message: "Too many requests. Please slow down." } },
});

// 2. Strict Login Limiter - 5 attempts per 1 minute
export const loginLimiter = createLimiter({
  name: "login",
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders,
  legacyHeaders,
  message: { success: false, error: { code: "RATE_LIMIT", message: "Too many login attempts. Please try again later." } },
});

// 2.5 Password Reset Limiter - 3 attempts per 15 minutes
export const passwordResetLimiter = createLimiter({
  name: "passwordReset",
  windowMs: 15 * 60 * 1000,
  max: 3,
  standardHeaders,
  legacyHeaders,
  message: { success: false, error: { code: "RATE_LIMIT", message: "Too many password reset attempts. Please try again later." } },
});

// 3. Account Creation Limiter - 5 accounts per hour
export const signupLimiter = createLimiter({
  name: "signup",
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  standardHeaders,
  legacyHeaders,
  message: { success: false, error: { code: "RATE_LIMIT", message: "Too many accounts created from this IP. Please try again later." } },
});

// 4. AI Generation Limiter - 20 requests per hour
export const aiGenerationLimiter = createLimiter({
  name: "aiGen",
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  standardHeaders,
  legacyHeaders,
  message: { success: false, error: { code: "RATE_LIMIT", message: "AI generation quota exceeded. Please try again next hour." } },
});

// 5. Bot & Scraping Protection Limiter - Stricter short-window to stop brute force or aggressive crawling
export const botProtectionLimiter = createLimiter({
  name: "botProtection",
  windowMs: 10 * 1000, // 10 seconds
  max: 30, // Max 30 requests per 10 seconds
  standardHeaders,
  legacyHeaders,
  message: { success: false, error: { code: "RATE_LIMIT", message: "Suspiciously high request rate detected." } },
});

// 6. Message Limiter - 60 messages per minute
export const messageLimiter = createLimiter({
  name: "message",
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders,
  legacyHeaders,
  message: { success: false, error: { code: "RATE_LIMIT", message: "Sending messages too fast. Please slow down." } },
});

// 7. Device Registration Limiter - 10 per 15 minutes
export const deviceRegisterLimiter = createLimiter({
  name: "deviceRegister",
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders,
  legacyHeaders,
  message: { success: false, error: { code: "RATE_LIMIT", message: "Too many device registrations. Try again later." } },
});

// 8. Prekey Limiter - Prevent excessive bundle generation
export const prekeyLimiter = createLimiter({
  name: "prekey",
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders,
  legacyHeaders,
  message: { success: false, error: { code: "RATE_LIMIT", message: "Too many cryptographic operations. Slow down." } },
});
