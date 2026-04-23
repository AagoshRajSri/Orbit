import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    const uri = process.env.DB_URI || process.env.MONGODB_URI;
    if (!uri) {
      throw new Error("DB_URI environment variable is missing");
    }

    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 15000, // Increase if slow or DNS check issues
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
      retryWrites: true, // Automatic retry on transient failures
      maxPoolSize: 10, // Connection pool size
      minPoolSize: 5, // Minimum connections in pool
      maxIdleTimeMS: 45000, // Close idle connections after 45s
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
