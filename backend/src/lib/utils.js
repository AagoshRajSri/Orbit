import jwt from "jsonwebtoken";
import crypto from "crypto";
import Session from "../models/session.model.js";
import User from "../models/user.model.js";

export const generateToken = async (userId, req, res) => {
  try {
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET environment variable is missing");
    }
    if (!req || !res) {
      throw new Error("Request and response objects are required");
    }

    const sessionId = crypto.randomBytes(16).toString("hex");
    const refreshToken = crypto.randomBytes(32).toString("hex");

    // Hash refresh token for DB
    const hashedRefreshToken = crypto
      .createHash("sha256")
      .update(refreshToken)
      .digest("hex");

    // Capture device/IP
    const ip = req.ip || req.headers["x-forwarded-for"] || "unknown";
    const userAgent = req.headers["user-agent"] || "unknown";

    // Enforce max 5 sessions
    const activeSessions = await Session.find({ userId, isValid: true }).sort({
      lastActive: 1,
    });
    if (activeSessions.length >= 5) {
      // kill the oldest
      await Session.findByIdAndUpdate(activeSessions[0]._id, {
        isValid: false,
      });
    }

    // Save session
    await Session.create({
      userId,
      sessionId,
      hashedRefreshToken,
      ip,
      userAgent,
      isValid: true,
      lastActive: new Date(),
    });

    // Short-lived access token (15 min)
    const accessToken = jwt.sign(
      { userId, sessionId },
      process.env.JWT_SECRET,
      { expiresIn: "15m" },
    );

    res.cookie("jwt", accessToken, {
      maxAge: 15 * 60 * 1000,
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      secure: process.env.NODE_ENV === "production",
    });

    res.cookie("refresh_jwt", refreshToken, {
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/api/auth/refresh", // Only sent on refresh endpoint
    });

    return { accessToken, refreshToken, sessionId };
  } catch (error) {
    console.error("Error generating dual tokens:", error.message);
    throw error;
  }
};

/**
 * POST /api/auth/refresh
 * Silently renews the short-lived access token using the long-lived refresh cookie.
 * Rotates the refresh token on every call (prevents token replay).
 */
export const refreshAccessToken = async (req, res) => {
  const refreshToken = req.body.refreshToken || req.cookies?.refresh_jwt;
  const { sessionId } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ message: "No refresh token provided" });
  }

  try {
    const hashedRefreshToken = crypto
      .createHash("sha256")
      .update(refreshToken)
      .digest("hex");

    // Strict Tab Isolation: 
    // Ensure the refresh token belongs to the specific sessionId requested by this tab.
    // If another tab logged in, the cookie might mismatch the tab's store session.
    const query = { hashedRefreshToken, isValid: true };
    if (sessionId) {
      query.sessionId = sessionId;
    }

    const session = await Session.findOne(query);

    if (!session) {
      console.warn(`[Refresh] Potential session mismatch or poisoned cookie for session: ${sessionId}`);
      return res.status(401).json({ message: "Session mismatch or expired" });
    }

    const user = await User.findById(session.userId).select("-password");
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // Invalidate old session (token rotation — prevents reuse)
    session.isValid = false;
    await session.save();

    // Issue a fresh token pair
    const tokens = await generateToken(user._id, req, res);

    return res.status(200).json({
      authToken: tokens.accessToken,
      message: "Token refreshed",
    });
  } catch (error) {
    console.error("[refreshAccessToken] Error:", error.message);
    return res.status(401).json({ message: "Token refresh failed" });
  }
};
