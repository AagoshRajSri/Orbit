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

const createSocketProxy = () => {
  return new Proxy({}, {
    get: (target, prop) => {
      if (prop === "on" || prop === "off" || prop === "emit") {
        return () => {};
      }
      return undefined;
    }
  });
};

const isPublicRoute = () => {
  return ["/feed", "/posts", "/login", "/signup", "/verify-email"].some(
    (p) => window.location.pathname.startsWith(p)
  );
};

export const getSocket = () => {
  if (isConnectionBlockedByGate) {
    return createSocketProxy();
  }

  const authState = useAuthStore.getState();
  const token = authState.socketToken;
  const user = authState.authUser;

  // Do not initiate authenticated socket connection for unauthenticated guests
  if (!user && (!token || token === "null" || token === "undefined")) {
    return createSocketProxy();
  }

  if (socket) return socket;

  console.log("[Socket.IO] Initializing client v2.0");

  const socketConfig = {
    withCredentials: true,
    transports: ["polling", "websocket"],
    upgrade: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 2000,
    reconnectionDelayMax: 10000,
    timeout: 30000,
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
        return;
      }

      console.warn("[Socket.IO] Authentication rejected or No identity. Wiping credentials and locking gate.");
      isConnectionBlockedByGate = true;
      disconnectSocket();
      
      useAuthStore.setState({ socketToken: null, sessionId: null, authUser: null });
      
      if (!isPublicRoute() && window.location.pathname !== "/login" && window.location.pathname !== "/signup") {
        window.location.href = "/login";
      }
      return;
    }

    if (error.message.includes("Token expired")) {
      console.log("[Socket.IO] Auth token expired. Triggering token refresh...");
      try {
        const auth = useAuthStore.getState();
        const refreshRes = await axiosInstance.post(
          "/auth/refresh",
          { sessionId: auth.sessionId },
          { withCredentials: true }
        );
        const newToken = refreshRes.data?.authToken || refreshRes.data?.data?.authToken;
        if (newToken) {
          useAuthStore.setState({ socketToken: newToken });
          updateSocketToken(newToken);
        }
      } catch (err) {
        console.warn("[Socket.IO] Token refresh failed:", err?.message);
        isConnectionBlockedByGate = true;
        disconnectSocket();
        useAuthStore.setState({ socketToken: null, sessionId: null, authUser: null });
        try {
          localStorage.removeItem("orbit-auth-storage");
        } catch {}
        if (!isPublicRoute() && window.location.pathname !== "/login" && window.location.pathname !== "/signup") {
          window.location.href = "/login";
        }
      }
      return;
    }

    if (error.message.includes("Authentication") || error.message.includes("rejected")) {
      try {
        await axiosInstance.get("/auth/check");
      } catch (err) {
        console.warn("[Socket.IO] Auth check failed:", err?.message);
      }
    }
  });

  socket.on("Access Denied", () => {
    console.warn("[Socket.IO] Received Access Denied event from backend. Wiping credentials and locking gate.");
    isConnectionBlockedByGate = true;
    disconnectSocket();
    useAuthStore.setState({ socketToken: null, sessionId: null, authUser: null });
    if (!isPublicRoute() && window.location.pathname !== "/login" && window.location.pathname !== "/signup") {
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
  if (!socket || !newToken) return;

  // Prevent redundant reconnect loops if the socket is already connected with this exact token
  if (socket.auth?.token === newToken && (socket.connected || connectionState === "connecting")) {
    return;
  }

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
    if (token) {
      if (socket.auth?.token === token && socket.connected) {
        return socket;
      }
      socket.auth = { token };
    }
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
