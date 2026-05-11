import { io } from "socket.io-client";
import { API_URL } from "../config.js";
import { useAuthStore } from "../store/useAuthStore";

let socket = null;
let connectionState = "disconnected";
let connectionError = null;

// Debounce guard for rapid token update calls
let _tokenUpdateDebounce = null;

export const getSocket = () => {
  if (socket) return socket;

  const authState = useAuthStore.getState();

  // Don't create a socket if there's no user at all — avoids
  // "Access Denied" spam when the page loads unauthenticated.
  if (!authState.authUser && !authState.socketToken) {
    console.log("[Socket.IO] Skipping init — no authenticated user yet.");
    return null;
  }

  console.log("[Socket.IO] Initializing client v2.0 - Polling Forced");

  socket = io(API_URL, {
    auth: {
      token: authState.socketToken || undefined,
    },
    withCredentials: true,
    // Render free-tier does not support WS upgrade from Socket.IO polling sessions.
    // Polling-only is reliable and still delivers real-time events.
    transports: ["polling"],
    upgrade: false,
    reconnectionAttempts: 20,
    reconnectionDelay: 2000,
    reconnectionDelayMax: 10000,
    timeout: 45000,
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

    // Auth errors (expired/invalid token) are recoverable:
    // The axios interceptor in checkAuth() handles the token refresh and
    // updates socketToken in the store. The App.jsx socketToken effect then
    // calls updateSocketToken() to reconnect with the fresh token.
    // We do NOT attempt a secondary refresh here to avoid racing with the
    // interceptor's _isRefreshing lock and causing duplicate refresh requests.
    const isAuthError =
      error.message.includes("Authentication") ||
      error.message.includes("Token expired") ||
      error.message.includes("Access Denied") ||
      error.message.includes("Orbit Shield");

    if (isAuthError) {
      console.log("[Socket.IO] Auth error — awaiting token refresh from checkAuth flow.");
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
  // Debounce rapid token updates (e.g., from multiple refresh calls)
  if (_tokenUpdateDebounce) {
    clearTimeout(_tokenUpdateDebounce);
  }
  _tokenUpdateDebounce = setTimeout(() => {
    _tokenUpdateDebounce = null;
    if (!socket) return;
    socket.auth = { token: newToken || undefined };
    if (socket.connected) {
      socket.disconnect();
    }
    socket.connect();
  }, 100);
};

export const reconnectSocket = () => {
  disconnectSocket();
  return getSocket();
};

export const getSocketConnectionState = () => connectionState;
export const getSocketConnectionError = () => connectionError;

export const checkBackendConnection = async () => {
  try {
    const response = await fetch(`${API_URL}/api/auth/check`, {
      method: "GET",
      credentials: "include",
      signal: AbortSignal.timeout(3000),
    });
    return response.ok;
  } catch {
    return false;
  }
};
