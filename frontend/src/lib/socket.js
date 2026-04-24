import { io } from "socket.io-client";
import { API_URL } from "../config.js";

const SOCKET_TOKEN_KEY = "orbit_socket_token";

let socket = null;
let connectionState = "disconnected";
let connectionError = null;

import * as msgpackParser from "socket.io-msgpack-parser";

export const getSocket = () => {
  if (socket) return socket;

  let token = localStorage.getItem(SOCKET_TOKEN_KEY);
  
  if (!token) {
    try {
      const authData = JSON.parse(localStorage.getItem("orbit-auth-storage"));
      token = authData?.state?.socketToken;
      if (token) {
        localStorage.setItem(SOCKET_TOKEN_KEY, token); // Sync it for next time
      }
    } catch (e) {
      console.warn("[Socket.IO] Could not parse auth storage for token backup");
    }
  }
  
  socket = io(API_URL, {
    auth: { token },
    parser: msgpackParser,
    withCredentials: true,
    transports: ["websocket", "polling"],
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
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
