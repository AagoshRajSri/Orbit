"use client";

/**
 * useAuthStore.ts
 *
 * Zustand auth store for the Next.js frontend.
 * This is a Client Component store — it persists auth state in localStorage
 * and is hydrated on the client on first render.
 *
 * Server Components cannot use this store. They read auth state from cookies
 * (forwarded automatically by Next.js to backend RSC fetches).
 *
 * Ported from the Vite frontend with:
 *  - No import.meta.env
 *  - Lazy imports for socket/axios to avoid SSR module errors
 *  - Preserves all constellation auth, E2EE, presence, and session methods
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { axiosInstance } from "@/lib/axios";

interface AuthUser {
  _id: string;
  username: string;
  email: string;
  profilePic?: string;
  isEmailVerified?: boolean;
  [key: string]: unknown;
}

interface PresenceEntry {
  state: string;
  userId?: string;
  [key: string]: unknown;
}

interface AuthState {
  authUser: AuthUser | null;
  isSigningUp: boolean;
  isLoggingIn: boolean;
  isUpdatingProfile: boolean;
  isCheckingAuth: boolean;
  onlineUsers: string[];
  presenceMap: Record<string, PresenceEntry>;
  sessionId: string | null;
  socketToken: string | null;
  appConfig: unknown | null;
  e2eePublicKey: string | null;

  // Actions
  checkAuth: () => Promise<void>;
  login: (data: { email: string; password: string }) => Promise<{ success: boolean; unverified?: boolean; email?: string }>;
  logout: () => Promise<void>;
  signup: (data: Record<string, unknown>) => Promise<{ success: boolean; email?: string }>;
  updateProfile: (data: Record<string, unknown>) => Promise<void>;
  setOnlineUsers: (users: unknown[]) => void;
  updateUserPresence: (userId: string, presence: PresenceEntry) => void;
  sendPresenceUpdate: (presence: PresenceEntry) => Promise<void>;
  refreshSocketToken: () => Promise<void>;
  fetchAppConfig: () => Promise<void>;
  loginWithConstellation: (data: {
    email: string;
    edges: unknown[];
    nonce: string;
    behavioral?: unknown;
  }) => Promise<boolean>;
  fetchConstellationNonce: () => Promise<string | null>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      authUser: null,
      isSigningUp: false,
      isLoggingIn: false,
      isUpdatingProfile: false,
      isCheckingAuth: true,
      onlineUsers: [],
      presenceMap: {},
      sessionId: null,
      socketToken: null,
      appConfig: null,
      e2eePublicKey: null,

      checkAuth: async () => {
        const startToken = get().socketToken;
        set({ isCheckingAuth: true });
        try {
          const res = await axiosInstance.get("/auth/check");
          const serverSessionId = res.data.data?.sessionId;
          const serverSocketToken = res.data.data?.socketToken;
          const currentSessionId = get().sessionId;
          set({
            authUser: res.data.data,
            sessionId: serverSessionId || currentSessionId || crypto.randomUUID(),
            ...(serverSocketToken && { socketToken: serverSocketToken }),
          });
        } catch (error: unknown) {
          const err = error as { response?: { status?: number }; code?: string };
          const isNetworkError = err.code === "ERR_NETWORK" || !err.response;
          const isAuthError = err.response?.status === 401 || err.response?.status === 404;
          if (!isNetworkError && isAuthError) {
            if (get().socketToken === startToken) {
              set({ authUser: null, sessionId: null, socketToken: null });
            }
          }
        } finally {
          set({ isCheckingAuth: false });
        }
      },

      login: async (data) => {
        set({ isLoggingIn: true });
        try {
          const res = await axiosInstance.post("/auth/login", data);
          const { authToken, sessionId } = res.data.data;
          set({ authUser: res.data.data, socketToken: authToken, sessionId });
          await get().refreshSocketToken();
          return { success: true };
        } catch (error: unknown) {
          const err = error as { response?: { data?: { error?: { code?: string; email?: string; message?: string; details?: { message: string }[] }; message?: string } } };
          const errCode = err.response?.data?.error?.code;
          const errEmail = err.response?.data?.error?.email;
          if (errCode === "EMAIL_NOT_VERIFIED") {
            return { success: false, unverified: true, email: errEmail };
          }
          return { success: false };
        } finally {
          set({ isLoggingIn: false });
        }
      },

      signup: async (data) => {
        set({ isSigningUp: true });
        try {
          const res = await axiosInstance.post("/auth/signup", data);
          const { authToken, sessionId } = res.data.data;
          set({ authUser: res.data.data, socketToken: authToken, sessionId });
          await get().refreshSocketToken();
          return { success: true, email: data.email as string };
        } catch {
          return { success: false };
        } finally {
          set({ isSigningUp: false });
        }
      },

      fetchConstellationNonce: async () => {
        try {
          const res = await axiosInstance.get("/auth/constellation/challenge");
          return res.data.nonce as string;
        } catch {
          return null;
        }
      },

      loginWithConstellation: async ({ email, edges, nonce, behavioral }) => {
        set({ isLoggingIn: true });
        try {
          const res = await axiosInstance.post("/auth/constellation/login", {
            email, edges, nonce, behavioral: behavioral || undefined,
          });
          const { authToken, sessionId } = res.data.data;
          set({ authUser: res.data.data, socketToken: authToken, sessionId });
          await get().refreshSocketToken();
          return true;
        } catch {
          return false;
        } finally {
          set({ isLoggingIn: false });
        }
      },

      logout: async () => {
        set({ authUser: null, sessionId: null, socketToken: null, e2eePublicKey: null });
        try {
          const { disconnectSocket } = await import("@/lib/socket");
          disconnectSocket();
        } catch {/* non-critical */}
        try {
          await axiosInstance.post("/auth/logout");
        } catch {/* non-critical */}
      },

      updateProfile: async (data) => {
        set({ isUpdatingProfile: true });
        try {
          const res = await axiosInstance.put("/auth/update-profile", data);
          set((s) => ({ authUser: { ...s.authUser!, ...res.data } }));
        } finally {
          set({ isUpdatingProfile: false });
        }
      },

      setOnlineUsers: (users) => {
        const ids = users.map((u) => (typeof u === "string" ? u : (u as Record<string, unknown>).userId as string || (u as Record<string, unknown>)._id as string));
        const map: Record<string, PresenceEntry> = {};
        users.forEach((u) => {
          if (typeof u === "object" && u) {
            const obj = u as Record<string, unknown>;
            const id = (obj.userId || obj._id || obj.id) as string;
            if (id) map[id.toString()] = u as PresenceEntry;
          }
        });
        set({ onlineUsers: ids, presenceMap: { ...get().presenceMap, ...map } });
      },

      updateUserPresence: (userId, presence) => {
        set((s) => {
          const updatedMap = { ...s.presenceMap, [userId]: presence };
          const active = ["online", "idle", "dnd", "typing", "spotify"].includes(presence.state);
          const list = active
            ? s.onlineUsers.includes(userId) ? s.onlineUsers : [...s.onlineUsers, userId]
            : s.onlineUsers.filter((id) => id !== userId);
          return { presenceMap: updatedMap, onlineUsers: list };
        });
      },

      sendPresenceUpdate: async (presence) => {
        try {
          const { getSocket } = await import("@/lib/socket");
          const socket = getSocket(get().socketToken);
          if (socket.connected) socket.emit("presence:update", presence);
          const myId = get().authUser?._id;
          if (myId) get().updateUserPresence(myId, presence);
        } catch {/* non-critical */}
      },

      refreshSocketToken: async () => {
        try {
          // Socket reconnect is handled lazily inside Client Components
          // when they call getSocket(token) in useEffect.
        } catch {/* non-critical */}
      },

      fetchAppConfig: async () => {
        try {
          const res = await axiosInstance.get("/config/public");
          set({ appConfig: res.data.config });
        } catch {/* non-critical */}
      },
    }),
    {
      name: "orbit-auth-storage",
      storage: createJSONStorage(() => {
        // SSR safety: return a no-op storage on the server
        if (typeof window === "undefined") {
          return {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
          };
        }
        return localStorage;
      }),
      partialize: (s) => ({
        authUser: s.authUser,
        sessionId: s.sessionId,
        socketToken: s.socketToken,
        e2eePublicKey: s.e2eePublicKey,
      }),
    }
  )
);
