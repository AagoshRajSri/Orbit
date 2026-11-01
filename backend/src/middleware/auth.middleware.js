import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import Session from "../models/session.model.js";
import AppConfig from "../models/config.model.js";

const sessionCache = new Map();
const userCache = new Map();
let cachedConfig = null;
let configCacheTime = 0;

export const invalidateAuthCache = (sessionId, userId) => {
  if (sessionId) sessionCache.delete(sessionId);
  if (userId) userCache.delete(userId);
};

export const protectRoute = async (req, res, next) => {
  try {
    let token;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } else if (req.headers["x-auth-token"]) {
      token = req.headers["x-auth-token"];
    } else if (req.cookies?.jwt) {
      token = req.cookies.jwt;
    }

    if (!token) {
      console.warn("[AuthMiddleware] No token found in headers or cookies");
      return res
        .status(401)
        .json({ success: false, error: { code: "NO_TOKEN", message: "Unauthorized - No Token Provided" } });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      console.warn("[AuthMiddleware] JWT Verify Failed:", err.message);
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({ success: false, error: { code: "TOKEN_EXPIRED", message: "Token has expired" } });
      }
      return res.status(401).json({ success: false, error: { code: "INVALID_TOKEN", message: "Invalid token" } });
    }

    if (!decoded || !decoded.sessionId) {
      console.warn("[AuthMiddleware] Token structure invalid (missing sessionId):", decoded);
      return res
        .status(401)
        .json({ success: false, error: { code: "INVALID_TOKEN", message: "Unauthorized - Invalid Token Structure" } });
    }

    const now = Date.now();

    // Fast Session Cache (30s TTL to prevent MongoDB connection pool starvation)
    let activeSession = null;
    const cachedSessionEntry = sessionCache.get(decoded.sessionId);
    if (cachedSessionEntry && now - cachedSessionEntry.cachedAt < 30000) {
      activeSession = cachedSessionEntry.session;
    } else {
      activeSession = await Session.findOne({ _id: decoded.sessionId }).lean();
      if (activeSession) {
        sessionCache.set(decoded.sessionId, { session: activeSession, cachedAt: now });
      }
    }
    
    if (!activeSession) {
      console.warn("[AuthMiddleware] Session not found in DB:", decoded.sessionId);
      return res
        .status(401)
        .json({ success: false, error: { code: "SESSION_INVALID", message: "Unauthorized - Session Expired or Revoked" } });
    }

    if (!activeSession.isValid) {
      sessionCache.delete(decoded.sessionId);
      console.warn("[AuthMiddleware] Session is marked invalid in DB:", decoded.sessionId);
      return res
        .status(401)
        .json({ success: false, error: { code: "SESSION_INVALID", message: "Unauthorized - Session Expired or Revoked" } });
    }

    // Fast AppConfig Cache (30s TTL)
    let config = cachedConfig;
    if (!config || now - configCacheTime > 30000) {
      try {
        config = await AppConfig.findOne().lean();
        cachedConfig = config;
        configCacheTime = now;
      } catch {
        config = cachedConfig;
      }
    }

    if (config && config.maintenanceMode) {
      console.warn("[AuthMiddleware] Blocked user due to Maintenance Mode:", decoded.userId);
      return res.status(503).json({ success: false, error: { code: "MAINTENANCE_MODE", message: "System is currently undergoing maintenance. Please try again later." } });
    }

    // Fast User Cache (30s TTL)
    let user = null;
    const cachedUserEntry = userCache.get(decoded.userId);
    if (cachedUserEntry && now - cachedUserEntry.cachedAt < 30000) {
      user = cachedUserEntry.user;
    } else {
      user = await User.findById(decoded.userId).select("-password").lean();
      if (user) {
        userCache.set(decoded.userId, { user, cachedAt: now });
      }
    }

    if (!user) {
      console.warn("[AuthMiddleware] User not found for ID:", decoded.userId);
      return res.status(404).json({ success: false, error: { code: "USER_NOT_FOUND", message: "User not found" } });
    }

    if (user.isLocked) {
      userCache.delete(decoded.userId);
      console.warn("[AuthMiddleware] User is locked/banned:", decoded.userId);
      return res.status(403).json({ success: false, error: { code: "USER_LOCKED", message: "Account has been suspended by an administrator." } });
    }

    const lastActiveTime = activeSession.lastActive ? new Date(activeSession.lastActive).getTime() : 0;
    if (now - lastActiveTime > 60000) {
      activeSession.lastActive = new Date();
      Session.updateOne({ _id: activeSession._id }, { lastActive: activeSession.lastActive }).catch(() => {});
    }

    req.user = user;
    req.sessionId = activeSession._id.toString();
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, error: { code: "TOKEN_EXPIRED", message: "Token has expired" } });
    }
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ success: false, error: { code: "INVALID_TOKEN", message: "Invalid token" } });
    }
    console.error("Auth middleware error:", error);
    return res.status(401).json({ success: false, error: { code: "AUTH_ERROR", message: "Authentication failed" } });
  }
};

/**
 * optionalAuth — Attaches user identity if a valid token is present,
 * but safely passes through as guest (req.user = null) if unauthenticated or expired.
 */
export const optionalAuth = async (req, res, next) => {
  try {
    let token;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } else if (req.headers["x-auth-token"]) {
      token = req.headers["x-auth-token"];
    } else if (req.cookies?.jwt) {
      token = req.cookies.jwt;
    }

    if (!token) {
      req.user = null;
      req.sessionId = null;
      return next();
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      req.user = null;
      req.sessionId = null;
      return next();
    }

    if (!decoded || !decoded.userId) {
      req.user = null;
      req.sessionId = null;
      return next();
    }

    req.user = { _id: decoded.userId };
    req.sessionId = decoded.sessionId || null;
    return next();
  } catch {
    req.user = null;
    req.sessionId = null;
    return next();
  }
};

