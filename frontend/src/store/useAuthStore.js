import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { axiosInstance } from "../lib/axios.jsx";
import toast from "../lib/toast";
import { storeKeyPair, clearKeyPair, exportPublicKeyForServer, hasKeyPair } from "../lib/keyStore";

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
      presenceMap: {}, // Key: userId string, Value: rich presence object
      sessionId: null,
      socketToken: null,
      appConfig: null,
      // Only the base64 public key is kept in state (for sharing with contacts).
      // The private key lives exclusively in IndexedDB as a non-extractable CryptoKey.
      e2eePublicKey: null, // base64 SPKI public key — safe to share

      initE2EE: async () => {
        const userId = get().authUser?._id?.toString();
        if (!userId) return;

        try {
          const { generateKeyPair, exportPublicKey } = await import("../lib/e2ee.js");
          const {
            generateSigningKeyPair,
            generatePrekeyBundle,
            exportSigningPublicKey,
          } = await import("../lib/x3dh.js");
          const {
            storeSigningKeyPair,
            storeSignedPrekey,
            storeOneTimePrekey,
          } = await import("../lib/sessionStore.js");

          // ── 1. Identity key (ECDH) ──────────────────────────────────────────
          const alreadyHasKey = await hasKeyPair(userId);
          let identityKeyB64 = get().e2eePublicKey;

          if (!alreadyHasKey) {
            const identityKeyPair = await generateKeyPair();
            await storeKeyPair(userId, identityKeyPair);
            identityKeyB64 = await exportPublicKey(identityKeyPair.publicKey);
            set({ e2eePublicKey: identityKeyB64 });
          } else if (!identityKeyB64) {
            identityKeyB64 = await exportPublicKeyForServer(userId);
            if (identityKeyB64) set({ e2eePublicKey: identityKeyB64 });
          }

          if (!identityKeyB64) {
            throw new Error("[E2EE] Could not obtain identity public key");
          }

          // ── 2. Signing key (ECDSA) ──────────────────────────────────────
          const signingKP = await generateSigningKeyPair();
          const signingKeyB64 = await exportSigningPublicKey(signingKP.publicKey);
          await storeSigningKeyPair(userId, signingKP.privateKey, signingKeyB64);

          // ── 3. Signed prekey + OPKs ───────────────────────────────────
          const { getKeyPair } = await import("../lib/keyStore.js");
          const identityKP = await getKeyPair(userId);
          if (!identityKP) throw new Error("[E2EE] Identity key pair not in store");

          const { bundle, privateKeys } = await generatePrekeyBundle(
            identityKP.privateKey,
            signingKP.privateKey,
            10
          );

          // Store SPK private key
          await storeSignedPrekey(userId, privateKeys.signedPrekeyPrivate, bundle.signedPrekey);

          // Store OPK private keys
          for (const [opkId, opkPriv] of Object.entries(privateKeys.oneTimePrekeyPrivates)) {
            await storeOneTimePrekey(userId, opkId, opkPriv);
          }

          // ── 4. Publish bundle to server ───────────────────────────────────────────────
          await axiosInstance.post("/prekeys/bundle", {
            identityKey:    identityKeyB64,
            signingKey:     signingKeyB64,
            signedPrekey:   bundle.signedPrekey,
            spkSignature:   bundle.spkSignature,
            oneTimePrekeys: bundle.oneTimePrekeys,
          });

          // Also keep User.publicKey in sync (backward compat)
          await axiosInstance.put("/auth/update-public-key", { publicKey: identityKeyB64 });

          console.log("[E2EE] Prekey bundle published ✓");

          // ── Phase 3: Device Registration (non-blocking) ──────────────────────────
          ;(async () => {
            try {
              const { createDeviceAttestation, getOrCreateDeviceIdentity } =
                await import("../lib/deviceFingerprint.js");
              const { deviceId, devicePublicKey, deviceName } = await getOrCreateDeviceIdentity();
              const { timestamp, attestation } = await createDeviceAttestation(userId);
              await axiosInstance.post("/devices/register", {
                deviceId, devicePublicKey, deviceName, timestamp, attestation
              });
              console.log("[Phase 3] Device registered ✓", deviceName);
            } catch (devErr) {
              console.warn("[Phase 3] Device registration failed (non-fatal):", devErr.message);
            }
          })();

          // ── Phase 4: Hybrid KEM bundle (Post-Quantum, non-blocking) ───────────
          ;(async () => {
            try {
              const { generateHybridKeyBundle, isPostQuantumAvailable } =
                await import("../lib/hybridKem.js");
              const { storeKeyPair: storeHybridKP } = await import("../lib/keyStore.js");

              const pqAvailable = await isPostQuantumAvailable();
              const hybridBundle = await generateHybridKeyBundle();

              // Publish the hybrid public keys to the prekey server
              // The backend stores these alongside the classical X3DH bundle
              await axiosInstance.post("/prekeys/hybrid-bundle", {
                classicalPublicKey: hybridBundle.classicalPublicKey,
                kyberPublicKey:     hybridBundle.kyberPublicKey,
                algorithm:          hybridBundle.algorithm,
              }).catch(() => {}); // Best-effort — endpoint may not exist yet

              console.log(`[Phase 4] Hybrid KEM bundle published ✓ (${pqAvailable ? 'PQ+Classical' : 'Classical only'})`);
            } catch (pqErr) {
              console.warn("[Phase 4] Hybrid KEM init failed (non-fatal):", pqErr.message);
            }
          })();

        } catch (error) {
          console.error("[E2EE] Failed to initialize prekey bundle:", error);
        }
      },

      /** Check OPK count and replenish if below watermark */
      checkAndReplenishPrekeys: async () => {
        const userId = get().authUser?._id?.toString();
        if (!userId) return;
        try {
          const res = await axiosInstance.get("/prekeys/status");
          if (!res.data.hasBundle || res.data.lowWaterMark) {
            console.log("[E2EE] Low OPK count — replenishing prekeys...");
            await get().initE2EE();
          }
        } catch (e) {
          console.error("[E2EE] Prekey status check failed:", e);
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

          // Ensure E2EE prekey bundle is initialized/replenished (non-blocking)
          get().checkAndReplenishPrekeys().catch(console.error);
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
          // Force-generate fresh E2EE keys for new account (after userId is set)
          setTimeout(() => get().initE2EE().catch(console.error), 0);

          // Set default theme to light for new users
          try {
            const { useThemeStore } = await import("./useThemeStore");
            useThemeStore.getState().setTheme("light");
          } catch (e) {
            console.error("Failed to set default theme on signup:", e);
          }

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
          get().initE2EE().catch(console.error);
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
          
          // Set default theme to light for new users
          try {
            const { useThemeStore } = await import("./useThemeStore");
            useThemeStore.getState().setTheme("light");
          } catch (e) {
            console.error("Failed to set default theme on constellation signup:", e);
          }

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
        const userId = get().authUser?._id?.toString();
        try {
          await axiosInstance.post("/auth/logout");
        } catch (error) {
          console.warn("Server logout failed, forcing local session clear.");
        } finally {
          // Clear all crypto material from IndexedDB
          if (userId) {
            const { clearAllSessions, clearPrekeys } = await import("../lib/sessionStore.js").catch(() => ({}));
            const { clearAllNexusSenderKeys } = await import("../lib/nexusKeyStore.js").catch(() => ({}));
            const { clearDeviceIdentity } = await import("../lib/deviceFingerprint.js").catch(() => ({}));
            const { resetSealedSender } = await import("../lib/sealedSender.js").catch(() => ({}));
            await Promise.allSettled([
              clearKeyPair(userId),
              clearAllSessions?.(),
              clearPrekeys?.(userId),
              clearAllNexusSenderKeys?.(),
              clearDeviceIdentity?.(),
            ]);
            resetSealedSender?.();
          }
          set({ authUser: null, sessionId: null, socketToken: null, e2eePublicKey: null });
          get().refreshSocketToken();
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

      setOnlineUsers: (users) => {
        // Handle both ID string list and rich presence object arrays
        const ids = users.map(u => (typeof u === "string" ? u : u.userId || u._id));
        const map = {};
        users.forEach(u => {
          if (typeof u === "object" && u) {
            const id = u.userId || u._id || u.id;
            if (id) map[id.toString()] = u;
          }
        });
        set({ 
          onlineUsers: ids,
          presenceMap: { ...get().presenceMap, ...map }
        });
      },

      updateUserPresence: (userId, presence) => {
        set((state) => {
          const updatedMap = { ...state.presenceMap, [userId]: presence };
          let updatedOnlineList = [...state.onlineUsers];
          
          const isActive = ["online", "idle", "dnd", "typing", "spotify", "syncing", "restoring"].includes(presence.state);
          if (isActive) {
            if (!updatedOnlineList.includes(userId)) updatedOnlineList.push(userId);
          } else {
            updatedOnlineList = updatedOnlineList.filter(id => id !== userId);
          }
          return {
            onlineUsers: updatedOnlineList,
            presenceMap: updatedMap
          };
        });
      },

      sendPresenceUpdate: async (presence) => {
        try {
          const { getSocket } = await import("../lib/socket");
          const socket = getSocket();
          if (socket?.connected) {
            socket.emit("presence:update", presence);
          }
          // Update locally as well
          const myId = get().authUser?._id?.toString();
          if (myId) {
            get().updateUserPresence(myId, presence);
          }
        } catch (e) {
          console.error("Failed to send presence update:", e);
        }
      },

      finishPostAuthLoader: () => set({ showPostAuthLoader: false }),
      refreshSocketToken: async () => {
        try {
          const { reconnectSocket } = await import("../lib/socket");
          reconnectSocket();
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
        socketToken: state.socketToken,
        e2eePublicKey: state.e2eePublicKey, // safe: only public key
      }),
    }
  )
);

