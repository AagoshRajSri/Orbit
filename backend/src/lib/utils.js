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

    // Determine if we should use secure/cross-site cookies
    const isProxySecure = req.header("x-forwarded-proto") === "https" || req.secure;
    const isProduction = process.env.NODE_ENV === "production" || isProxySecure;

    res.cookie("jwt", accessToken, {
      maxAge: 15 * 60 * 1000,
      httpOnly: true,
      sameSite: isProduction ? "none" : "lax",
      secure: isProduction,
    });

    res.cookie("refresh_jwt", refreshToken, {
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      sameSite: isProduction ? "none" : "lax",
      secure: isProduction,
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

    session.isValid = false;
    await session.save();

    const tokens = await generateToken(user._id, req, res);

    return res.status(200).json({
      authToken: tokens.accessToken,
      sessionId: tokens.sessionId,
      message: "Token refreshed",
    });
  } catch (error) {
    console.error("[refreshAccessToken] Error:", error.message);
    return res.status(401).json({ message: "Token refresh failed" });
  }
};
