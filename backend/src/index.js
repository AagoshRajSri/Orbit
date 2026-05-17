import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import { Server } from "socket.io";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import hpp from "hpp";
import net from "net";
import compression from "compression";

import { threatDetectionMiddleware } from "./middleware/threat-detection.middleware.js";
import { errorHandler } from "./middleware/error.middleware.js";
import { requestLogger } from "./middleware/logger.middleware.js";

import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import nexusRoutes from "./routes/nexus.route.js";
import spotifyRoutes from "./routes/spotify.route.js";
import spotifySessionRoutes from "./routes/spotifySession.route.js";
import starweaveRoutes from "./routes/starweave.route.js";
import adminRoutes from "./routes/admin.route.js";
import configRoutes from "./routes/config.route.js";
import prekeyRoutes from "./routes/prekey.route.js";
import deviceRoutes from "./routes/device.route.js";
import { connectDB } from "./lib/db.js";
import { initializeConfig } from "./lib/config.init.js";
import { initializeSocketIO } from "./socket/socket.js";
import "./services/insights.service.js"; // Initialize rule engine on startup
import { registerSpotifyEvents } from "./socket/spotify-events.js";
import { pubClient, subClient, connectRedis, isRedisAvailable } from "./lib/redis.js";
import { createAdapter } from "@socket.io/redis-adapter";
import dotenv from "dotenv";

dotenv.config();

// ── Port availability probe ───────────────────────────────────────────────────
const isPortAvailable = (port) =>
  new Promise((resolve) => {
    const server = net.createServer();
    server.unref();
    server.on("error", () => resolve(false));
    server.listen(port, "0.0.0.0", () => {
      server.close(() => resolve(true));
    });
  });

const findAvailablePort = async (startPort, maxAttempts = 10) => {
  for (let i = 0; i < maxAttempts; i++) {
    const port = startPort + i;
    const available = await isPortAvailable(port);
    if (available) {
      if (i > 0) {
        console.warn(`⚠  Port ${startPort} in use — binding to port ${port} instead.`);
      }
      return port;
    }
  }
  throw new Error(
    `No available port found in range ${startPort}–${startPort + maxAttempts - 1}. ` +
    `Kill processes on those ports (e.g. "npx kill-port ${startPort}") and retry.`
  );
};

// ─────────────────────────────────────────────────────────────────────────────

const app = express();

// Trust proxy is required for secure cookies behind Render/Vercel
app.set("trust proxy", 1);

// ── Enforce HTTPS in Production ──────────────────────────────────────────────
if (process.env.NODE_ENV === "production") {
  app.use((req, res, next) => {
    if (req.header("x-forwarded-proto") !== "https") {
      res.redirect(`https://${req.header("host")}${req.url}`);
    } else {
      next();
    }
  });
}

const httpServer = createServer(app);

const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(",").map((url) => url.trim())
  : ["http://localhost:5173"];

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(compression());
app.use(requestLogger);
app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'", 
        "'unsafe-inline'",
        process.env.NODE_ENV === "production" ? "" : "'unsafe-eval'",
      ].filter(Boolean),
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "data:", "https://fonts.gstatic.com"],
      workerSrc: ["'self'", "blob:"],
      childSrc: ["'self'", "blob:"],
      connectSrc: ["'self'", "wss:", "ws:", "https:", "http:", "https://api.spotify.com", "https://accounts.spotify.com"],
      imgSrc: ["'self'", "data:", "blob:", "https://res.cloudinary.com", "https://i.scdn.co", "https://*.spotifycdn.com"],
      mediaSrc: ["'self'", "data:", "blob:", "https://res.cloudinary.com", "https://*.spotifycdn.com"],
      objectSrc: ["'none'"],
      frameAncestors: ["'self'"],
      baseUri: ["'self'"],
      "require-trusted-types-for": ["'script'"],
      "trusted-types": ["default", "'allow-duplicates'"],
    }
  },
  referrerPolicy: {
    policy: "strict-origin-when-cross-origin",
  },
  strictTransportSecurity: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  }
}));

// ── Strict Permissions-Policy Header ──────────────────────────────────────────
app.use((req, res, next) => {
  res.setHeader(
    "Permissions-Policy",
    "camera=(self), microphone=(), geolocation=(), payment=(), usb=(), battery=(), display-capture=()"
  );
  next();
});
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      
      const normalizedOrigin = origin.endsWith('/') ? origin.slice(0, -1) : origin;
      
      const isAllowed = allowedOrigins.some(allowed => {
        const normalizedAllowed = allowed.replace(/\/$/, "");
        return normalizedAllowed === normalizedOrigin;
      });

      const isOrbitSubdomain = normalizedOrigin.endsWith("orbitnexus.vercel.app") || 
                               normalizedOrigin.endsWith("onrender.com") ||
                               normalizedOrigin.includes("orbit-ajgs");

      if (isAllowed || isOrbitSubdomain) {
        callback(null, true);
      } else {
        console.warn(`[Express CORS] Blocked: ${origin}`);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  }),
);

import { apiLimiter, botProtectionLimiter } from "./middleware/rate-limit.middleware.js";

app.use(botProtectionLimiter); // Protects all routes from aggressive bots
app.use("/api", apiLimiter); // General API limiter for authenticated/unauthenticated traffic
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ limit: "5mb", extended: true }));
app.use(hpp());
app.use(cookieParser());
import { csrfMiddleware } from "./middleware/csrf.middleware.js";
app.use(csrfMiddleware);
app.use(threatDetectionMiddleware);

import { resolveOrbitIds } from "./lib/idResolver.middleware.js";
app.use("/api", resolveOrbitIds);

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/message", messageRoutes);
app.use("/api/nexus", nexusRoutes);
app.use("/api/spotify", spotifyRoutes);
app.use("/api/spotify/session", spotifySessionRoutes);
app.use("/api/starweave", starweaveRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/config", configRoutes);
app.use("/api/prekeys", prekeyRoutes);
app.use("/api/devices", deviceRoutes);
app.get("/", (req, res) => {
  res.json({ message: "Orbit API is running", version: "1.0.0", security: "zero-trust-v3" });
});

app.get("/health", async (req, res) => {
  const startTime = Date.now();
  const mongoStatus = global.mongoose?.connections?.some(c => c.readyState === 1) ? "connected" : "disconnected";
  const redisStatus = isRedisAvailable ? "connected" : "disconnected";
  const socketStatus = global.io?.sockets?.sockets?.size > 0 ? "active" : "inactive";

  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: { mongodb: mongoStatus, redis: redisStatus, socketio: socketStatus },
    responseTime: Date.now() - startTime,
  });
});

// ── Static Files (Production) ────────────────────────────────────────────────
if (process.env.NODE_ENV === "production") {
  const publicPath = "public";
  app.use(express.static(publicPath));

  // Catch-all for SPA: serve index.html for non-API routes if it exists
  app.get(/^(?!\/api).*/, (req, res, next) => {
    res.sendFile("index.html", { root: publicPath }, (err) => {
      if (err) {
        // If file not found, fall back to 404 handler
        next();
      }
    });
  });
}

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});
app.use(errorHandler);

const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const normalizedOrigin = origin.endsWith('/') ? origin.slice(0, -1) : origin;
      
      const isAllowed = allowedOrigins.some(allowed => {
        const normalizedAllowed = allowed.replace(/\/$/, "");
        return normalizedAllowed === normalizedOrigin;
      });

      const isOrbitSubdomain = normalizedOrigin.endsWith("orbitnexus.vercel.app") || 
                               normalizedOrigin.endsWith("onrender.com") ||
                               normalizedOrigin.includes("orbit-ajgs");

      if (isAllowed || isOrbitSubdomain) {
        callback(null, true);
      } else {
        console.warn(`[Socket.IO CORS] Blocked: ${origin}`);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST"]
  },
  // Enable standard Socket.IO transports (polling -> websocket upgrade)
  transports: ["polling", "websocket"],
  allowUpgrades: true,
  pingInterval: 5000, 
  pingTimeout: 2500,
});

async function initApp() {
  await connectDB();
  await initializeConfig();
  await connectRedis();
  if (isRedisAvailable) {
    io.adapter(createAdapter(pubClient, subClient));
    console.log("[Socket.IO] Redis adapter attached.");
  } else {
    console.log("[Socket.IO] Using default in-memory adapter (single-node).");
  }
  initializeSocketIO(io);
  registerSpotifyEvents(io);
  global.io = io;
}

await initApp();
// startServer() is called at the end of the file; we'll let it handle the listen.

// ── Env validation ────────────────────────────────────────────────────────────
const validateEnv = () => {
  const required = [
    "MONGODB_URI",
    "JWT_SECRET",
    "CLOUDINARY_CLOUD_NAME",
    "CLOUDINARY_API_KEY",
    "CLOUDINARY_SECRET_KEY",
  ];
  const optional = [
    "CONSTELLATION_PEPPER",
    "FRONTEND_URL",
    "NODE_ENV",
    "PORT",
    "OBFUSCATION_SECRET",
    "TOKEN_ENCRYPTION_SECRET",
  ];

  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }

  if (process.env.NODE_ENV === "production") {
    const missingOptional = optional.filter((key) => !process.env[key]);
    
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn("⚠️  Warning: SMTP credentials (SMTP_USER/PASS) are missing. Mail system will not work in production.");
    }

    if (missingOptional.length > 0) {
      console.warn(`Warning: Missing optional env vars in production: ${missingOptional.join(", ")}`);
    }

    if (!process.env.CONSTELLATION_PEPPER) {
      throw new Error("CONSTELLATION_PEPPER is required in production");
    }
  }

  return true;
};

// ── Server startup ────────────────────────────────────────────────────────────
const startServer = async () => {
  try {
    validateEnv();
    console.log("✓ Environment variables validated");

    // We don't call connectDB() here because initApp() handles it.

    const port = process.env.NODE_ENV === "production"
      ? parseInt(process.env.PORT || "3000", 10)
      : await findAvailablePort(parseInt(process.env.PORT || "3000", 10));

    httpServer.listen(port, "0.0.0.0", () => {
      console.log(`✓ Server is running on port ${port}`);
      console.log(`✓ Node environment: ${process.env.NODE_ENV || "development"}`);
      console.log(
        `✓ Socket.IO initialized with CORS origins: ${Array.isArray(allowedOrigins) ? allowedOrigins.join(", ") : allowedOrigins
        }`,
      );
    });

    // Graceful shutdown — prevents zombie processes holding the port
    const gracefulShutdown = (signal) => {
      console.log(`\n${signal} received. Shutting down gracefully...`);
      httpServer.close(() => {
        console.log("✓ HTTP server closed.");
        process.exit(0);
      });
      setTimeout(() => {
        console.error("✗ Forced shutdown after 10s timeout.");
        process.exit(1);
      }, 10_000).unref();
    };
    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));

  } catch (error) {
    console.error("✗ Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();
// nodemon trigger restarted!
