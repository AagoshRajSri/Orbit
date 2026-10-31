import mongoose from "mongoose";
import dns from "dns";

// Ensure reliable SRV resolution on Windows / ISP networks
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch {
  // Ignore in environments where setting servers is restricted
}

export const connectDB = async () => {
  try {
    const uri = process.env.DB_URI || process.env.MONGODB_URI;
    if (!uri) {
      throw new Error("DB_URI environment variable is missing");
    }

    let connectionUri = uri;
    if (uri.startsWith("mongodb+srv://") && uri.includes("cluster0.dcgsl04.mongodb.net")) {
      const match = uri.match(/mongodb\+srv:\/\/([^:]+):([^@]+)@cluster0\.dcgsl04\.mongodb\.net\/([^?]+)?(\?.*)?/);
      if (match) {
        const [, user, pass, dbName] = match;
        connectionUri = `mongodb://${user}:${pass}@ac-sv2un3k-shard-00-00.dcgsl04.mongodb.net:27017,ac-sv2un3k-shard-00-01.dcgsl04.mongodb.net:27017,ac-sv2un3k-shard-00-02.dcgsl04.mongodb.net:27017/${dbName || ""}?ssl=true&replicaSet=atlas-g3qzsy-shard-0&authSource=admin&retryWrites=true&w=majority`;
      }
    }

    const conn = await mongoose.connect(connectionUri, {
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
      retryWrites: true,
      maxPoolSize: 200,
      minPoolSize: 20,
      maxIdleTimeMS: 45000,
    });

    console.log(`MongoDB connected: ${conn.connection.host}`);

    // Handle connection events
    mongoose.connection.on("disconnected", () => {
      console.warn("MongoDB disconnected. Attempting to reconnect...");
    });

    mongoose.connection.on("error", (err) => {
      console.error("MongoDB connection error:", err.message);
    });

    return conn;
  } catch (error) {
    console.error("MongoDB connection error: ", error);
    throw error; // Re-throw to prevent server from starting without DB
  }
};
