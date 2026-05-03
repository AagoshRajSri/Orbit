import rateLimit from "express-rate-limit";

const standardHeaders = true;
const legacyHeaders = false;

// 1. General API Limiter - 100 requests per minute
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders,
  legacyHeaders,
  message: { success: false, error: { code: "RATE_LIMIT", message: "Too many requests. Please slow down." } },
});

// 2. Strict Login Limiter - 5 attempts per 1 minute
export const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders,
  legacyHeaders,
  message: { success: false, error: { code: "RATE_LIMIT", message: "Too many login attempts. Please try again later." } },
});

// 2.5 Password Reset Limiter - 3 attempts per 15 minutes
export const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  standardHeaders,
  legacyHeaders,
  message: { success: false, error: { code: "RATE_LIMIT", message: "Too many password reset attempts. Please try again later." } },
});


// 3. Account Creation Limiter - 5 accounts per hour
export const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  standardHeaders,
  legacyHeaders,
  message: { success: false, error: { code: "RATE_LIMIT", message: "Too many accounts created from this IP. Please try again later." } },
});

// 4. AI Generation Limiter - 20 requests per hour
export const aiGenerationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  standardHeaders,
  legacyHeaders,
  message: { success: false, error: { code: "RATE_LIMIT", message: "AI generation quota exceeded. Please try again next hour." } },
});

// 5. Bot & Scraping Protection Limiter - Stricter short-window to stop brute force or aggressive crawling
export const botProtectionLimiter = rateLimit({
  windowMs: 10 * 1000, // 10 seconds
  max: 30, // Max 30 requests per 10 seconds
  standardHeaders,
  legacyHeaders,
  message: { success: false, error: { code: "RATE_LIMIT", message: "Suspiciously high request rate detected." } },
});

// 6. Message Limiter - 60 messages per minute
export const messageLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders,
  legacyHeaders,
  message: { success: false, error: { code: "RATE_LIMIT", message: "Sending messages too fast. Please slow down." } },
});
