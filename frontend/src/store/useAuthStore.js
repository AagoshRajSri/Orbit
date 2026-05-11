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
      sessionId: null,
      socketToken: null,
      appConfig: null,
      e2eeKeys: null, // { publicKey, privateKey } base64

      initE2EE: async () => {
        try {
          const { generateKeyPair } = await import("../lib/e2ee.js");
          const keys = await generateKeyPair();
          set({ e2eeKeys: keys });
          // Upload public key to backend
          await axiosInstance.put("/auth/update-public-key", { publicKey: keys.publicKey });
          return keys;
        } catch (error) {
          console.error("Failed to init E2EE keys", error);
        }
      },

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
            ...(serverSocketToken && { socketToken: serverSocketToken })
          });
          
          // Force socket update if we recovered the token
          if (serverSocketToken) {
            import("../lib/socket.js").then(({ updateSocketToken }) => {
              if (updateSocketToken) updateSocketToken(serverSocketToken);
            }).catch(console.error);
          }

          if (!get().e2eeKeys) {
            get().initE2EE();
          }
        } catch (error) {
          console.error("[checkAuth] Server error status:", error.response?.status);
          console.error("[checkAuth] Server error details:", error.response?.data);
          
          const isAuthError = error.response?.status === 401 || error.response?.status === 404;
          const isNetworkError = error.code === "ERR_NETWORK" || !error.response;
          
          // On network errors, preserve the persisted session for offline scenarios
          if (isNetworkError) {
            console.warn("Auth check failed due to network - keeping persisted session");
            // Keep current auth state (will be restored from localStorage)
          } else if (isAuthError) {
            if (get().socketToken === startToken) {
              console.warn("[checkAuth] Wiping auth user due to auth error");
              set({ authUser: null, sessionId: null, socketToken: null });
              delete axiosInstance.defaults.headers.common["X-Auth-Token"];
            } else {
              console.warn("[checkAuth] Ignoring 401 because token changed (likely logged in while checking)");
            }
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
           set({ authUser: res.data.data, socketToken: authToken, showPostAuthLoader: true, sessionId });
          get().refreshSocketToken();
          get().initE2EE(); // Force new keys on signup
          toast.success("Account created successfully!");
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
          set({ 
            authUser: res.data.data, 
            socketToken: authToken, 
            showPostAuthLoader: true, 
            sessionId 
          });
          get().refreshSocketToken();
          if (!get().e2eeKeys) get().initE2EE();
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
          set({ 
            authUser: res.data.data, 
            socketToken: authToken, 
            showPostAuthLoader: true, 
            sessionId 
          });
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
          set({ 
            authUser: res.data.data, 
            socketToken: authToken, 
            showPostAuthLoader: true, 
            sessionId 
          });
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
        } catch (error) {
          console.warn("Server logout failed, forcing local session clear.");
        } finally {
          set({ authUser: null, sessionId: null, socketToken: null });
          get().refreshSocketToken(); // This will effectively disconnect and clear the socket singleton
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
          const { updateSocketToken, reconnectSocket, getSocket } = await import("../lib/socket");
          const currentToken = get().socketToken;
          const currentAuthUser = get().authUser;

          if (!currentAuthUser) {
            // Logging out — full disconnect; App.jsx will not re-init since authUser is null
            reconnectSocket();
          } else if (currentToken) {
            // Token rotated — update the existing socket's auth without full teardown
            updateSocketToken(currentToken);
          } else {
            // No token yet (fresh login) — let App.jsx's authUser effect handle init
            // Do nothing here; the effect will call getSocket() once authUser is set
            console.log("[refreshSocketToken] No token yet, deferring to auth effect.");
          }
        } catch (e) {
          console.error("Failed to refresh socket:", e);
        }
      },

      fetchAppConfig: async () => {
        try {
          const res = await axiosInstance.get("/config/public");
          set({ appConfig: res.data.config });
        } catch (error) {
          console.error("[fetchAppConfig] Error:", error);
        }
      },
    }),
    {
      name: "orbit-auth-storage",
      storage: createJSONStorage(() => localStorage), // Persist across sessions
      partialize: (state) => ({
        authUser: state.authUser,
        sessionId: state.sessionId,
        showPostAuthLoader: state.showPostAuthLoader,
      }),
    }
  )
);

