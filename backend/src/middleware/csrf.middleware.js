/**
 * CSRF Protection Middleware
 *
 * Implements Double-Submit Cookie pattern:
 *   1. Server generates a cryptographically random token and sets it as a cookie.
 *   2. Client reads the cookie and sends it as a request header (X-CSRF-Token).
 *   3. Server validates that both values match.
 *
 * This guards state-mutating endpoints (POST, PUT, PATCH, DELETE) against
 * cross-site request forgery even when the attacker can read SameSite=Lax cookies.
 *
 * Additionally validates Origin/Referer headers to defend against requests
 * originating from unauthorized domains.
 */

import crypto from "crypto";

// Routes exempt from CSRF validation (public, idempotent, or token-issuing endpoints)
const CSRF_EXEMPT_PATHS = new Set([
  "/api/auth/refresh",      // Token rotation — requires its own cookie-based auth
  "/api/auth/login",        // Credentials-based, not session-riding
  "/api/auth/signup",
  "/api/auth/constellation/login",
  "/api/auth/constellation/signup",
  "/api/auth/constellation/challenge",
  "/api/auth/forgot-password",
  "/api/auth/verify-otp",
  "/api/auth/reset-password",
  "/api/auth/verify-email",
  "/api/auth/resend-verification",
  "/api/admin/login",       // Separate admin auth flow
  "/api/prekeys/bundle",
  "/api/prekeys/replenish",
  "/api/prekeys/hybrid-bundle",
]);

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

const CSRF_COOKIE_NAME = "csrf_token";
const CSRF_HEADER_NAME = "x-csrf-token";
const CSRF_TOKEN_TTL   = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Generate a new CSRF token and set it as a cookie.
 * Called on every GET / initial page load so the client always has a fresh token.
 */
export const issueCSRFToken = (req, res, next) => {
  const isProxySecure = req.header("x-forwarded-proto") === "https" || req.secure;
  const isProduction = process.env.NODE_ENV === "production" || isProxySecure;

  if (!req.cookies?.[CSRF_COOKIE_NAME]) {
    const token = crypto.randomBytes(32).toString("hex");
    res.cookie(CSRF_COOKIE_NAME, token, {
      httpOnly: false,            // Must be readable by JS
      sameSite: isProduction ? "none" : "lax",
      secure: isProduction,
      maxAge: CSRF_TOKEN_TTL,
      path: "/",
    });
  }
  next();
};

/**
 * Validates the CSRF token on state-mutating requests.
 */
export const csrfProtect = (req, res, next) => {
  // Skip safe HTTP methods
  if (SAFE_METHODS.has(req.method)) return next();

  // Skip exempt paths
  if (CSRF_EXEMPT_PATHS.has(req.path)) return next();

  // If the request uses custom header authentication, it is immune to CSRF.
  if (req.headers["x-auth-token"] || req.headers["authorization"]) {
    return next();
  }

  // ── Origin / Referer validation ──────────────────────────────────────────────
  const origin  = req.headers["origin"];
  const referer = req.headers["referer"];
  const host    = req.headers["host"];

  const allowedOrigins = process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(",").map((u) => u.trim().replace(/\/$/, ""))
    : ["http://localhost:5173"];

  if (process.env.NODE_ENV === "production" && (origin || referer)) {
    const requestOrigin = (origin || new URL(referer).origin).replace(/\/$/, "");
    const isAllowed =
      allowedOrigins.some((o) => o === requestOrigin) ||
      requestOrigin.endsWith("orbitnexus.vercel.app") ||
      requestOrigin.endsWith("onrender.com") ||
      requestOrigin.includes("orbit-ajgs");

    if (!isAllowed) {
      console.warn(`[CSRF] Blocked request from disallowed origin: ${requestOrigin}`);
      return res.status(403).json({ success: false, message: "CSRF: Forbidden origin" });
    }
  }

  // ── Double-Submit Cookie Check ────────────────────────────────────────────────
  const cookieToken  = req.cookies?.[CSRF_COOKIE_NAME];
  const headerToken  = req.headers[CSRF_HEADER_NAME];

  if (!cookieToken || !headerToken) {
    return res.status(403).json({ success: false, message: "CSRF token missing" });
  }

  try {
    const cookieBuf = Buffer.from(cookieToken, "hex");
    const headerBuf = Buffer.from(headerToken, "hex");

    if (cookieBuf.length !== headerBuf.length || !crypto.timingSafeEqual(cookieBuf, headerBuf)) {
      console.warn(`[CSRF] Token mismatch from IP: ${req.ip}`);
      return res.status(403).json({ success: false, message: "CSRF token invalid" });
    }
  } catch {
    return res.status(403).json({ success: false, message: "CSRF token malformed" });
  }

  next();
};

/**
 * Combined CSRF Middleware
 * Sequentially issues a token and protects state-mutating requests.
 */
export const csrfMiddleware = [issueCSRFToken, csrfProtect];

