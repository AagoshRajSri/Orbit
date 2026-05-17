import { io } from "socket.io-client";
import { API_URL } from "../config.js";
import { useAuthStore } from "../store/useAuthStore";
import { axiosInstance } from "./axios.jsx";

let socket = null;
let connectionState = "disconnected";
let connectionError = null;
let isConnectionBlockedByGate = false;

// Subscribe to Zustand auth store changes
useAuthStore.subscribe((state) => {
  if (state.authUser) {
    if (isConnectionBlockedByGate) {
      console.log("[Socket.IO] Session verified. Clearing listener gate.");
      isConnectionBlockedByGate = false;
    }
  }
});

export const getSocket = () => {
  if (isConnectionBlockedByGate) {
    console.warn("[Socket.IO] Connection blocked by listener gate. Awaiting successful authentication...");
    return new Proxy({}, {
      get: (target, prop) => {
        if (prop === "on" || prop === "off" || prop === "emit") {
          return () => {};
        }
        return undefined;
      }
    });
  }

  if (socket) return socket;

  const authState = useAuthStore.getState();
  const token = authState.socketToken;

  console.log("[Socket.IO] Initializing client v2.0 - Polling Forced");

  const socketConfig = {
    withCredentials: true,
    transports: ["websocket", "polling"],
    upgrade: true,
    reconnectionAttempts: 20,
    reconnectionDelay: 2000,
    reconnectionDelayMax: 10000,
    timeout: 45000,
  };

  if (token && token !== "null" && token !== "undefined") {
    socketConfig.auth = { token };
  }

  socket = io(API_URL, socketConfig);

  socket.on("connect", () => {
    connectionState = "connected";
    connectionError = null;
    console.log("[Socket.IO] Connected to backend");
  });

  socket.on("connect_error", async (error) => {
    connectionState = "error";
    connectionError = error.message;
    console.error("[Socket.IO] Connection error:", error.message);
    
    if (
      error.message.includes("No identity established") || 
      error.message.includes("Access Denied") || 
      (error.message.includes("Authentication rejected") && !error.message.includes("Token expired"))
    ) {
      const auth = useAuthStore.getState();
      
      if (auth.isCheckingAuth) {
        console.warn("[Socket.IO] Identity missing but auth check in progress - waiting...");
        return;
      }

      console.warn("[Socket.IO] Authentication rejected or No identity. Wiping credentials and locking gate.");
      isConnectionBlockedByGate = true;
      disconnectSocket();
      
      useAuthStore.setState({ socketToken: null, sessionId: null, authUser: null });
      
      if (window.location.pathname !== "/login" && window.location.pathname !== "/signup") {
        window.location.href = "/login";
      }
      return;
    }

    if (error.message.includes("Authentication") || error.message.includes("Token expired") || error.message.includes("rejected")) {
      console.log("[Socket.IO] Auth error detected. Attempting to trigger token refresh...");
      try {
        await axiosInstance.get("/auth/check");
      } catch (err) {
        console.warn("[Socket.IO] Token refresh triggered by socket failed.");
      }
    }
  });

  socket.on("Access Denied", () => {
    console.warn("[Socket.IO] Received Access Denied event from backend. Wiping credentials and locking gate.");
    isConnectionBlockedByGate = true;
    disconnectSocket();
    useAuthStore.setState({ socketToken: null, sessionId: null, authUser: null });
    if (window.location.pathname !== "/login" && window.location.pathname !== "/signup") {
      window.location.href = "/login";
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
    connectionState = "disconnected";
  }
};

export const updateSocketToken = (newToken) => {
  if (isConnectionBlockedByGate) {
    console.warn("[Socket.IO] updateSocketToken ignored because connection is blocked by gate.");
    return;
  }
  if (!socket) return;

  socket.auth = { token: newToken };

  if (socket.connected) {
    socket.disconnect();
  }

  socket.connect();
};

export const reconnectSocket = () => {
  if (isConnectionBlockedByGate) {
    console.warn("[Socket.IO] reconnectSocket ignored because connection is blocked by gate.");
    return null;
  }
  const authState = useAuthStore.getState();
  const token = authState.socketToken;

  if (socket) {
    if (token) socket.auth = { token };
    socket.disconnect().connect();
    return socket;
  }
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
