"use client";

/**
 * socket.ts  (Client Component scope only)
 *
 * Socket.IO singleton for use inside Client Components.
 *
 * Key architectural rule enforced here:
 *   - `getSocket()` creates the connection lazily on first call.
 *   - The actual `io()` call is ALWAYS guarded so it only ever runs
 *     inside a useEffect() in the consuming component — never at
 *     module evaluation time, which would cause Next.js to attempt
 *     a WebSocket handshake during the Node.js SSR phase and crash.
 *
 * Usage pattern (in any Client Component):
 *   useEffect(() => {
 *     const socket = getSocket(token);
 *     socket.on("event", handler);
 *     return () => socket.off("event", handler);
 *   }, [token]);
 */

import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5001";

/**
 * Returns the singleton Socket.IO instance, creating it if necessary.
 * @param token  Optional JWT auth token for the handshake.
 */
export function getSocket(token?: string | null): Socket {
  if (socket) return socket;

  const config: Parameters<typeof io>[1] = {
    withCredentials: true,
    transports: ["polling", "websocket"],
    upgrade: true,
    reconnectionAttempts: 20,
    reconnectionDelay: 2000,
    reconnectionDelayMax: 10000,
    timeout: 45000,
  };

  if (token && token !== "null" && token !== "undefined") {
    config.auth = { token };
  }

  socket = io(API_URL, config);

  socket.on("connect", () => {
    console.log("[Socket.IO] Connected");
  });

  socket.on("disconnect", (reason) => {
    console.log("[Socket.IO] Disconnected:", reason);
  });

  socket.on("connect_error", (err) => {
    console.error("[Socket.IO] Connection error:", err.message);
  });

  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function updateSocketToken(newToken: string): void {
  if (!socket) return;
  socket.auth = { token: newToken };
  if (socket.connected) socket.disconnect();
  socket.connect();
}
