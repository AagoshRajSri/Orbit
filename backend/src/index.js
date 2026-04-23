import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import { Server } from "socket.io";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import hpp from "hpp";
import net from "net";

import { threatDetectionMiddleware } from "./middleware/threat-detection.middleware.js";
import { errorHandler } from "./middleware/error.middleware.js";
import { requestLogger } from "./middleware/logger.middleware.js";

import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import nexusRoutes from "./routes/nexus.route.js";
import spotifyRoutes from "./routes/spotify.route.js";
import spotifySessionRoutes from "./routes/spotifySession.route.js";
import starweaveRoutes from "./routes/starweave.route.js";

import { connectDB } from "./lib/db.js";
import { initializeSocketIO } from "./socket/socket.js";
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
const httpServer = createServer(app);

const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(",").map((url) => url.trim())
  : ["http://localhost:5173"];

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(requestLogger);
app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (process.env.NODE_ENV !== "production") return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  }),
);

const limiter = rateLimit({
  max: 1000,
  windowMs: 15 * 60 * 1000,
  message: "Too many requests from this IP, please try again in 15 minutes!",
});

app.use("/api", limiter);
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ limit: "5mb", extended: true }));
app.use(hpp());
app.use(cookieParser());
app.use(threatDetectionMiddleware);

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/message", messageRoutes);
app.use("/api/nexus", nexusRoutes);
app.use("/api/spotify", spotifyRoutes);
app.use("/api/spotify/session", spotifySessionRoutes);
app.use("/api/starweave", starweaveRoutes);

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
  app.use(express.static("public"));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) return next();
    res.sendFile("index.html", { root: "public" });
  });
}

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});
app.use(errorHandler);

// ── Socket.IO ────────────────────────────────────────────────────────────────
const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (process.env.NODE_ENV !== "production") return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  },
});

async function initApp() {
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

initApp();

// ── Env validation ────────────────────────────────────────────────────────────
const validateEnv = () => {
  const required = [
    "MONGODB_URI",
    "JWT_SECRET",
    "CLOUDINARY_CLOUD_NAME",
    "CLOUDINARY_API_KEY",
    "CLOUDINARY_SECRET_KEY",
  ];
  const optional = ["CONSTELLATION_PEPPER", "FRONTEND_URL", "NODE_ENV", "PORT"];

  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }

  if (process.env.NODE_ENV === "production") {
    const missingOptional = optional.filter((key) => !process.env[key]);
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

    await connectDB();
    console.log("✓ Database connected successfully");

    const configuredPort = parseInt(process.env.PORT || "3000", 10);
    const port = await findAvailablePort(configuredPort);

    httpServer.listen(port, "0.0.0.0", () => {
      console.log(`✓ Server is running on port ${port}`);
      console.log(`✓ Node environment: ${process.env.NODE_ENV || "development"}`);
      console.log(
        `✓ Socket.IO initialized with CORS origins: ${
          Array.isArray(allowedOrigins) ? allowedOrigins.join(", ") : allowedOrigins
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
    process.on("SIGINT",  () => gracefulShutdown("SIGINT"));

  } catch (error) {
    console.error("✗ Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();
// nodemon trigger
