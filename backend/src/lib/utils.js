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

    const refreshToken = crypto.randomBytes(32).toString("hex");
    const refreshTokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");

    const ipAddress = req.ip || req.headers["x-forwarded-for"] || "unknown";
    const userAgent = req.headers["user-agent"] || "unknown";
    const deviceName = "Unknown Device"; // Could parse user agent here

    const session = await Session.create({
      userId,
      refreshTokenHash,
      ipAddress,
      userAgent,
      deviceName,
      lastActive: new Date(),
    });

    const accessToken = jwt.sign(
      { userId, sessionId: session._id },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

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
      path: "/api/auth/refresh",
    });

    return { accessToken, refreshToken };
  } catch (error) {
    console.error("Error generating dual tokens:", error.message);
    throw error;
  }
};

export const refreshAccessToken = async (req, res) => {
  const refreshToken = req.cookies?.refresh_jwt;

  if (!refreshToken) {
    return res.status(401).json({ code: "INVALID_SESSION", message: "No refresh token provided" });
  }

  try {
    const hashedToken = crypto.createHash("sha256").update(refreshToken).digest("hex");
    const session = await Session.findOne({ refreshTokenHash: hashedToken });

    if (!session) {
      return res.status(401).json({ code: "INVALID_SESSION" });
    }

    if (session.usedAt) {
      // Replay attack detected!
      await Session.deleteMany({ userId: session.userId });
      
      // Emit security alert via Socket.IO
      import("../socket/socket.js").then(({ getIO }) => {
        const io = getIO();
        if (io) {
          io.to(session.userId.toString()).emit("security:alert", {
            type: "replay_attack_detected",
            message: "Suspicious login detected. All sessions have been terminated."
          });
        }
      }).catch(err => console.error("Error importing socket for replay alert:", err));

      return res.status(401).json({ code: "REPLAY_ATTACK" });
    }

    // Mark as used to detect future replay attempts
    session.usedAt = new Date();
    await session.save();

    const user = await User.findById(session.userId).select("-password");
    if (!user) {
      return res.status(401).json({ code: "INVALID_SESSION", message: "User not found" });
    }

    // Generate new tokens for rotation
    const newRefreshToken = crypto.randomBytes(32).toString("hex");
    const newHashedToken = crypto.createHash("sha256").update(newRefreshToken).digest("hex");

    session.refreshTokenHash = newHashedToken;
    session.usedAt = null;
    session.lastActive = new Date();
    await session.save();

    const newAccessToken = jwt.sign(
      { userId: user._id, sessionId: session._id },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    const isProxySecure = req.header("x-forwarded-proto") === "https" || req.secure;
    const isProduction = process.env.NODE_ENV === "production" || isProxySecure;

    res.cookie("jwt", newAccessToken, {
      maxAge: 15 * 60 * 1000,
      httpOnly: true,
      sameSite: isProduction ? "none" : "lax",
      secure: isProduction,
    });

    res.cookie("refresh_jwt", newRefreshToken, {
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      sameSite: isProduction ? "none" : "lax",
      secure: isProduction,
      path: "/api/auth/refresh",
    });

    return res.status(200).json({ success: true, message: "Token refreshed" });
  } catch (error) {
    console.error("[refreshAccessToken] Error:", error.message);
    return res.status(401).json({ code: "INVALID_SESSION" });
  }
};
