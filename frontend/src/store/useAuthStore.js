import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { axiosInstance } from "../lib/axios.jsx";
import toast from "../lib/toast";

export const useAuthStore = create(
  persist(
    (set, get) => ({
      authUser: null,
      isSigningUp: false,
      isLoggingIn: false,
      isUpdatingProfile: false,
      isCheckingAuth: true,
      showPostAuthLoader: false,
      onlineUsers: [],
      sessionId: null, // Critical: Binding to server-side session
      socketToken: null,

      checkAuth: async () => {
        set({ isCheckingAuth: true });
        try {
          const res = await axiosInstance.get("/auth/check");
          const serverSessionId = res.data.data?.sessionId;
          const currentSessionId = get().sessionId;
          
          set({ 
            authUser: res.data.data, 
            sessionId: serverSessionId || currentSessionId || crypto.randomUUID() 
          });
        } catch (error) {
          if (error.response?.data?.error) {
            console.error("[checkAuth] Server error details:", error.response.data.error);
          }
          const isAuthError = error.response?.status === 401 || error.response?.status === 404;
          const isNetworkError = error.code === "ERR_NETWORK" || !error.response;
          
          // On network errors, preserve the persisted session for offline scenarios
          if (isNetworkError) {
            console.warn("Auth check failed due to network - keeping persisted session");
            // Keep current auth state (will be restored from localStorage)
          } else if (isAuthError) {
            // Clear auth only on actual auth failures (invalid session/credentials)
            set({ authUser: null, sessionId: null, socketToken: null });
            delete axiosInstance.defaults.headers.common["X-Auth-Token"];
          } else {
            console.error("Auth check failed:", error.message);
            // For other errors, also try to keep persisted auth as fallback
          }
        } finally {
          set({ isCheckingAuth: false });
        }
      },

      signup: async (data) => {
        set({ isSigningUp: true });
        try {
          const res = await axiosInstance.post("/auth/signup", data);
          const { authToken, sessionId } = res.data.data;
          localStorage.setItem("orbit_socket_token", authToken);
          axiosInstance.defaults.headers.common["X-Auth-Token"] = authToken;
          set({ authUser: res.data.data, socketToken: authToken, showPostAuthLoader: false, sessionId });
          get().refreshSocketToken();
          toast.success("Account created — verify your email to continue");
          return { success: true, email: data.email };
        } catch (error) {
          const backendMsg = error.response?.data?.error?.message || error.response?.data?.message;
          const details = error.response?.data?.error?.details?.[0]?.message;
          toast.error(details || backendMsg || "Signup failed");
          return { success: false };
        } finally {
          set({ isSigningUp: false });
        }
      },

      login: async (data) => {
        set({ isLoggingIn: true });
        try {
          const res = await axiosInstance.post("/auth/login", data);
          const { authToken, sessionId } = res.data.data;
          localStorage.setItem("orbit_socket_token", authToken);
          axiosInstance.defaults.headers.common["X-Auth-Token"] = authToken;
          set({ authUser: res.data.data, socketToken: authToken, showPostAuthLoader: true, sessionId });
          get().refreshSocketToken();
          toast.success("Logged in successfully");
          return { success: true };
        } catch (error) {
          const errCode = error.response?.data?.error?.code;
          const errEmail = error.response?.data?.error?.email;
          const backendMsg = error.response?.data?.error?.message || error.response?.data?.message;
          const details = error.response?.data?.error?.details?.[0]?.message;

          if (errCode === "EMAIL_NOT_VERIFIED") {
            toast.error("Email not verified. Redirecting...");
            return { unverified: true, email: errEmail };
          }
          toast.error(details || backendMsg || "Login failed");
          return { success: false };
        } finally {
          set({ isLoggingIn: false });
        }
      },

      // ── Constellation Auth v2 ───────────────────────────────────────────────────

      fetchConstellationNonce: async () => {
        try {
          const res = await axiosInstance.get("/auth/constellation/challenge");
          return res.data.nonce;
        } catch (error) {
          toast.error("Failed to start secure challenge.");
          return null;
        }
      },

      signupWithConstellation: async ({ username, email, edges, nonce }) => {
        set({ isSigningUp: true });
        try {
          const res = await axiosInstance.post("/auth/constellation/signup", {
            username,
            email,
            edges,
            nonce,
          });
          const { authToken, sessionId } = res.data.data;
          localStorage.setItem("orbit_socket_token", authToken);
          axiosInstance.defaults.headers.common["X-Auth-Token"] = authToken;
          set({ authUser: res.data.data, socketToken: authToken, showPostAuthLoader: true, sessionId });
          get().refreshSocketToken();
          toast.success("Constellation identity sealed ✦");
          return true;
        } catch (error) {
          const backendMsg = error.response?.data?.error?.message || error.response?.data?.message;
          toast.error(backendMsg || "Signup failed.");
          return false;
        } finally {
          set({ isSigningUp: false });
        }
      },

      loginWithConstellation: async ({ email, edges, nonce, behavioral }) => {
        set({ isLoggingIn: true });
        try {
          const res = await axiosInstance.post("/auth/constellation/login", {
            email,
            edges,
            nonce,
            behavioral: behavioral || undefined,
          });
          const { authToken, sessionId } = res.data.data;
          localStorage.setItem("orbit_socket_token", authToken);
          axiosInstance.defaults.headers.common["X-Auth-Token"] = authToken;
          set({ authUser: res.data.data, socketToken: authToken, showPostAuthLoader: true, sessionId });
          get().refreshSocketToken();
          if (res.data.data.behaviorWarning) {
            toast.warning("Pattern verified — unusual behavior noted.");
          }
          return true;
        } catch (error) {
          const retryMs = error.response?.data?.retryAfterMs;
          const backendMsg = error.response?.data?.error?.message || error.response?.data?.message;
          if (error.response?.status === 429 && retryMs) {
            toast.error(`Locked out. Try again in ${Math.ceil(retryMs / 1000)}s.`);
          } else {
            toast.error(backendMsg || "Authentication failed.");
          }
          return false;
        } finally {
          set({ isLoggingIn: false });
        }
      },

      logout: async () => {
        try {
          await axiosInstance.post("/auth/logout");
          localStorage.removeItem("orbit_socket_token");
          set({ authUser: null, sessionId: null });
          toast.success("Logged out successfully");
        } catch (error) {
          toast.error("Logout failed");
        }
      },

      updateProfile: async (data) => {
        set({ isUpdatingProfile: true });
        try {
          const res = await axiosInstance.put("/auth/update-profile", data);
          set({ authUser: res.data });
          toast.success("Profile updated successfully");
        } catch (error) {
          toast.error(error.response?.data?.message || "Update failed");
        } finally {
          set({ isUpdatingProfile: false });
        }
      },

      deleteAccount: async () => {
        try {
          await axiosInstance.delete("/auth/delete-account");
          set({ authUser: null, sessionId: null });
          toast.success("Account deleted successfully");
        } catch (error) {
          toast.error("Could not delete account.");
        }
      },
      verifyEmail: async (email, code) => {
        try {
          await axiosInstance.post("/auth/verify-email", { email, otp: code });
          set((state) => ({
            authUser: state.authUser ? { ...state.authUser, isEmailVerified: true } : null,
            showPostAuthLoader: true,
          }));
          get().refreshSocketToken();
          toast.success("Identity verified ✦");
          return true;
        } catch (error) {
          toast.error(error.response?.data?.message || "Verification failed");
          return false;
        }
      },

      resendVerification: async (email) => {
        try {
          await axiosInstance.post("/auth/resend-verification", { email });
          toast.success("New code dispatched");
          return true;
        } catch (error) {
          toast.error(error.response?.data?.message || "Failed to resend");
          return false;
        }
      },

      setOnlineUsers: (users) => set({ onlineUsers: users }),
      finishPostAuthLoader: () => set({ showPostAuthLoader: false }),
      refreshSocketToken: async () => {
        try {
          const { reconnectSocket } = await import("../lib/socket");
          reconnectSocket();
        } catch (e) {
          console.error("Failed to refresh socket:", e);
        }
      },
    }),
    {
      name: "orbit-auth-storage",
      storage: createJSONStorage(() => localStorage), // Persist across sessions
      partialize: (state) => ({
        authUser: state.authUser,
        sessionId: state.sessionId,
        socketToken: state.socketToken,
        showPostAuthLoader: state.showPostAuthLoader,
      }),
    }
  )
);

