import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import Session from "../models/session.model.js";

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

    const activeSession = await Session.findOne({
      sessionId: decoded.sessionId,
    });
    
    if (!activeSession) {
      console.warn("[AuthMiddleware] Session not found in DB:", decoded.sessionId);
      return res
        .status(401)
        .json({ success: false, error: { code: "SESSION_INVALID", message: "Unauthorized - Session Expired or Revoked" } });
    }

    if (!activeSession.isValid) {
      console.warn("[AuthMiddleware] Session is marked invalid in DB:", decoded.sessionId);
      return res
        .status(401)
        .json({ success: false, error: { code: "SESSION_INVALID", message: "Unauthorized - Session Expired or Revoked" } });
    }

    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      console.warn("[AuthMiddleware] User not found for ID:", decoded.userId);
      return res.status(404).json({ success: false, error: { code: "USER_NOT_FOUND", message: "User not found" } });
    }

    if (Date.now() - activeSession.lastActive.getTime() > 60000) {
      activeSession.lastActive = new Date();
      await activeSession.save().catch(() => {});
    }

    req.user = user;
    req.sessionId = activeSession.sessionId;
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
