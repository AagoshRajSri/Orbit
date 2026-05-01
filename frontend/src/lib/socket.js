import { io } from "socket.io-client";
import { API_URL } from "../config.js";

const SOCKET_TOKEN_KEY = "orbit_socket_token";

let socket = null;
let connectionState = "disconnected";
let connectionError = null;

import * as msgpackParser from "socket.io-msgpack-parser";

export const getSocket = () => {
  if (socket) return socket;

  /* Removed socket token from localStorage fallback */
  
  socket = io(API_URL, {
    // Auth token is passed via httpOnly cookie (withCredentials: true)
    parser: msgpackParser,
    withCredentials: true,
    // Prioritizing 'polling' first ensures the connection is established 
    // even if Render's WebSocket upgrade is slow or being probed.
    transports: ["polling", "websocket"],
    reconnectionAttempts: 10, // Increase attempts for waking up free-tier servers
    reconnectionDelay: 2000,
    timeout: 20000, // 20s handshake timeout for slow cold-starts
  });

  socket.on("connect", () => {
    connectionState = "connected";
    connectionError = null;
    console.log("[Socket.IO] Connected to backend");
  });

  socket.on("connect_error", (error) => {
    connectionState = "error";
    connectionError = error.message;
    console.error("[Socket.IO] Connection error:", error.message);
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
