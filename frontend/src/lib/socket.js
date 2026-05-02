import { io } from "socket.io-client";
import { API_URL } from "../config.js";
import { useAuthStore } from "../store/useAuthStore";
import { axiosInstance } from "./axios.jsx";

let socket = null;
let connectionState = "disconnected";
let connectionError = null;

export const getSocket = () => {
  if (socket) return socket;

  const authState = useAuthStore.getState();

  socket = io(API_URL, {
    auth: {
      token: authState.socketToken,
    },
    withCredentials: true,
    // polling first so Render can establish session before upgrading to WS
    transports: ["polling", "websocket"],
    reconnectionAttempts: 15,
    reconnectionDelay: 1500,
    timeout: 45000,
  });

  socket.on("connect", () => {
    connectionState = "connected";
    connectionError = null;
    console.log("[Socket.IO] Connected to backend");
  });

  socket.on("connect_error", async (error) => {
    connectionState = "error";
    connectionError = error.message;
    console.error("[Socket.IO] Connection error:", error.message);
    
    // Check if error is related to Authentication/Token expiry
    if (error.message.includes("Authentication") || error.message.includes("Token expired") || error.message.includes("Access Denied")) {
      console.log("[Socket.IO] Auth error detected. Attempting to trigger token refresh...");
      try {
        // Hitting a protected route to trigger the axios interceptor's silent refresh
        await axiosInstance.get("/auth/check");
      } catch (err) {
        console.warn("[Socket.IO] Token refresh triggered by socket failed.");
      }
    }
  });

  socket.on("disconnect", (reason) => {
    connectionState = "disconnected";
    console.log("[Socket.IO] Disconnected:", reason);
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    connectionState = "disconnected";
  }
};

export const updateSocketToken = (newToken) => {
  if (!socket) return;

  socket.auth = { token: newToken };

  if (socket.connected) {
    socket.disconnect();
  }

  socket.connect();
};

export const reconnectSocket = () => {
  disconnectSocket();
  return getSocket();
};

export const getSocketConnectionState = () => connectionState;
export const getSocketConnectionError = () => connectionError;

export const checkBackendConnection = async () => {
  try {
    const response = await fetch(`${API_URL}/api/auth/check`, { // health check against real endpoint
      method: "GET",
      signal: AbortSignal.timeout(3000),
    });
    return response.ok;
  } catch {
    return false;
  }
};
