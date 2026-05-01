import Navbar from "./components/Navbar";
import { Routes, Route, Navigate, useLocation, useParams, useNavigate } from "react-router-dom";
import { lazy, Suspense, useState, useEffect, useRef, useCallback } from "react";
import toast from "./lib/toast";

const HomePage = lazy(() => import("./pages/HomePage"));
const SignUpPage = lazy(() => import("./pages/SignUpPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const SpotifyPage = lazy(() => import("./pages/SpotifyPage"));
const TetherApproval = lazy(() => import("./pages/TetherApproval"));
const StarWeaveLoginPage = lazy(() => import("./pages/StarWeaveLoginPage"));
const StarWeaveSignupPage = lazy(() => import("./pages/StarWeaveSignupPage"));
const VerifyEmailPage = lazy(() => import("./pages/VerifyEmailPage"));

import FaceLock from "./components/FaceLock";
import AmbientPresence from "./components/AmbientPresence";
import OrbitAuth from "./pages/OrbitAuth";

// Admin Imports
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const AdminLogin = lazy(() => import("./pages/admin/AdminLogin"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminMessages = lazy(() => import("./pages/admin/AdminMessages"));
const AdminNexuses = lazy(() => import("./pages/admin/AdminNexuses"));
const AdminSystem = lazy(() => import("./pages/admin/AdminSystem"));
const AdminSecurity = lazy(() => import("./pages/admin/AdminSecurity"));
const AdminBroadcast = lazy(() => import("./pages/admin/AdminBroadcast"));

import { useAuthStore } from "./store/useAuthStore";
import { useChatStore } from "./store/useChatStore";
import { useNexusStore } from "./store/useNexusStore";
import { useSpotifyStore } from "./store/useSpotifyStore";
import { getSocket, disconnectSocket } from "./lib/socket";
import ChatLoader from "./components/ChatLoader";
import OrbitLoader from "./components/OrbitLoader";
import PostAuthLoader from "./components/PostAuthLoader";
import AuthShell from "./components/AuthShell";
import { NotificationContainer } from "./components/NotificationContainer";
import {
  ErrorBoundary,
  ConnectionStatus,
  useConnectivity,
} from "./components/ResponsiveLayout";
import { performanceDetector } from "./lib/performanceDetection";
import { IdentityProvider } from "./contexts/IdentityContext";
import { useSettingsStore } from "./store/useSettingsStore";
import { useThemeStore } from "./store/useThemeStore";
import { THEMES, THEME_LABELS } from "./constants/index";
import NexusActionOverlay from "./components/NexusActionOverlay";
import { soundManager } from "./lib/SoundManager";
import ThemePortal from "./components/ThemePortal";
import GlobalMiniPlayer from "./components/GlobalMiniPlayer";
import GlobalAnnouncementBanner from "./components/GlobalAnnouncementBanner";

import OrbitChatApp from "./components/OrbitChatApp";
import { useAnimationContext } from "./components/AnimLayer";

// Initialized exactly once at module load time (before any renders)
let _appSettingsInitialized = false;
function ensureAppSettings() {
  if (_appSettingsInitialized) return;
  _appSettingsInitialized = true;
  useSettingsStore.getState().initializeSettings();
  soundManager.initializeSettingsIntegration(useSettingsStore);
}

const DynamicThemeLoader = ({ isDark, isCyber, isGamer, isAmoled, isLight, isPastel, HomePage }) => {
  const [ThemeComponent, setThemeComponent] = useState(null);
  
  useEffect(() => {
    const loadTheme = async () => {
      try {
        if (isDark) {
          const mod = await import("./themes/darkTheme");
          setThemeComponent(() => mod.default);
        } else if (isCyber) {
          const mod = await import("./themes/darkCyberpunkTheme");
          setThemeComponent(() => mod.default);
        } else if (isGamer) {
          const mod = await import("./themes/gamerTheme");
          setThemeComponent(() => mod.default);
        } else if (isAmoled) {
          const mod = await import("./themes/amoledTheme");
          setThemeComponent(() => mod.default);
        } else if (isLight) {
          const mod = await import("./themes/lightTheme");
          setThemeComponent(() => mod.default);
        } else if (isPastel) {
          const mod = await import("./themes/pastelTheme");
          setThemeComponent(() => mod.default);
        } else {
          setThemeComponent(() => HomePage);
        }
      } catch (err) {
        console.error("Theme load failed:", err);
        // If it's a fetch error, it's likely a redeploy. Reload to get new assets.
        if (err.name === "TypeError" || err.message?.includes("fetch")) {
          window.location.reload();
        }
      }
    };
    loadTheme();
  }, [isDark, isCyber, isGamer, isAmoled, isLight, isPastel, HomePage]);

  if (!ThemeComponent) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

  return <ThemeComponent />;
};

/**
 * Syncs URL parameters with global state for Nexuses and Chats
 */
const DynamicRouteHandler = (props) => {
  const { nexusId, userId } = useParams();
  const { nexuses, setSelectedNexus, selectedNexus } = useNexusStore();
  const { users, setSelectedUser, selectedUser } = useChatStore();

  useEffect(() => {
    if (nexusId && nexuses.length > 0) {
      if (selectedNexus?._id !== nexusId) {
        const target = nexuses.find(n => n._id === nexusId);
        if (target) {
          setSelectedNexus(target);
          setSelectedUser(null);
        }
      }
    } else if (userId && users.length > 0) {
      if (selectedUser?._id !== userId) {
        const target = users.find(u => u._id === userId);
        if (target) {
          setSelectedUser(target);
          setSelectedNexus(null);
        }
      }
    } else if (!nexusId && !userId) {
      if (selectedNexus) setSelectedNexus(null);
      if (selectedUser) setSelectedUser(null);
    }
  }, [nexusId, userId, nexuses, users, selectedNexus, selectedUser, setSelectedNexus, setSelectedUser]);

  return <DynamicThemeLoader {...props} />;
};

const AppContent = () => {
  useAnimationContext();
  const location = useLocation();
  const navigate = useNavigate();

  const isAuthPage =
    location.pathname === "/login" ||
    location.pathname === "/signup" ||
    location.pathname === "/forgot-password" ||
    location.pathname === "/login/constellation" ||
    location.pathname === "/signup/constellation" ||
    location.pathname === "/login/facelock" ||
    location.pathname === "/signup/facelock" ||
    location.pathname === "/login/ambient" ||
    location.pathname === "/login/starweave" ||
    location.pathname === "/signup/starweave" ||
    location.pathname === "/verify-email" ||
    location.pathname === "/signup/ambient";

  const isAdminRoute = location.pathname.startsWith("/admin");

  const { isOnline } = useConnectivity();
  const authUser = useAuthStore((state) => state.authUser);
  const { theme } = useThemeStore();
  const isAmoled = theme === "amoled-dark";
  const isGamer = theme === "gamer-high-energy";
  const isDark = theme === "dark";
  const isCyber = theme === "neon-cyberpunk";
  const isLight = theme === "light";
  const isPastel = theme === "pastel-dream";
  const isFullscreenTheme = isAmoled || isGamer || isDark || isCyber || isLight || isPastel;
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const isCheckingAuth = useAuthStore((state) => state.isCheckingAuth);
  const showPostAuthLoader = useAuthStore((state) => state.showPostAuthLoader);
  const finishPostAuthLoader = useAuthStore((state) => state.finishPostAuthLoader);
  const setOnlineUsers = useAuthStore((state) => state.setOnlineUsers);
  const socketToken = useAuthStore((state) => state.socketToken);

  const addMessage = useChatStore((state) => state.addMessage);
  const getUsers = useChatStore((state) => state.getUsers);
  const setUserTyping = useChatStore((state) => state.setUserTyping);
  const selectedConversationId = useChatStore((state) => state.selectedConversationId);
  const selectedConversationType = useChatStore((state) => state.selectedConversationType);
  const getNexuses = useNexusStore((state) => state.getNexuses);
  const setNexusTyping = useNexusStore((state) => state.setNexusTyping);
  const addNexus = useNexusStore((state) => state.addNexus);
  const selectedNexusId = useNexusStore((state) => state.selectedNexusId);
  const postAuthLoaderStartedAtRef = useRef(null);
  const postAuthDataReadyRef = useRef(false);
  const postAuthAnimationReadyRef = useRef(false);
  const postAuthFinishTimerRef = useRef(null);

  useEffect(() => {
    ensureAppSettings();
    performanceDetector.detect();
    useAuthStore.getState().fetchAppConfig();
  }, []);

  const requestFinishPostAuthLoader = useCallback(() => {
    if (!postAuthDataReadyRef.current || !postAuthAnimationReadyRef.current)
      return;
    const MIN_VISIBLE_MS = 4000;
    const startedAt = postAuthLoaderStartedAtRef.current ?? Date.now();
    const elapsed = Date.now() - startedAt;
    const remaining = Math.max(0, MIN_VISIBLE_MS - elapsed);
    if (postAuthFinishTimerRef.current) {
      clearTimeout(postAuthFinishTimerRef.current);
    }
    postAuthFinishTimerRef.current = setTimeout(() => {
      finishPostAuthLoader();
      postAuthLoaderStartedAtRef.current = null;
      postAuthDataReadyRef.current = false;
      postAuthAnimationReadyRef.current = false;
      postAuthFinishTimerRef.current = null;
    }, remaining);
  }, [finishPostAuthLoader]);

  const [hydrated, setHydrated] = useState(false);
  
  useEffect(() => {
    const checkHydration = () => {
      // If the store has hydrated, or if there's no stored data to hydrate from, proceed
      if (useAuthStore.persist.hasHydrated() || !localStorage.getItem("orbit-auth-storage")) {
        setHydrated(true);
      } else {
        setTimeout(checkHydration, 20);
      }
    };
    checkHydration();
  }, []);

  const hasCheckedAuthRef = useRef(false);

  useEffect(() => {
    // Only perform the initial security check ONCE per application load.
    if (hydrated && !hasCheckedAuthRef.current) {
      // If the post-auth loader is active, it means the user JUST logged in.
      // We already have their fresh data, so we DO NOT need to check auth again.
      // We just mark it as checked and skip the API call.
      if (showPostAuthLoader) {
        hasCheckedAuthRef.current = true;
        return;
      }
      
      hasCheckedAuthRef.current = true;
      checkAuth();
    }
  }, [hydrated, showPostAuthLoader, checkAuth]);

  useEffect(() => {
    if (isOnline && authUser) {
      useChatStore.getState().syncOfflineQueue();
    }
  }, [isOnline, authUser]);

  /*
  useEffect(() => {
    if (authUser && !authUser.isEmailVerified && !isAuthPage) {
      navigate("/verify-email", { replace: true });
    }
  }, [authUser, isAuthPage, navigate]);
  */

  useEffect(() => {
    if (authUser) {
      const socket = getSocket();
      
      if (!socket) {
        return;
      }

      const syncConversationData = () => {
        const chatState = useChatStore.getState();
        if (chatState.selectedConversationId && chatState.selectedConversationType === "direct") {
          chatState.getMessages(chatState.selectedConversationId, "direct");
        }

        const nexusState = useNexusStore.getState();
        if (nexusState.selectedNexusId) {
          nexusState.getNexusMessages(nexusState.selectedNexusId);
        }
      };

      let messageBuffer = [];
      let nexusMessageBuffer = [];
      let flusherTimeout = null;

      const flushBuffers = () => {
        if (messageBuffer.length > 0) {
          messageBuffer.forEach(i => useChatStore.getState().addMessage(i.msg));
          messageBuffer.forEach(({ ack }) => ack && ack());
          messageBuffer = [];
        }
        if (nexusMessageBuffer.length > 0) {
          nexusMessageBuffer.forEach(i => useNexusStore.getState().addNexusMessage(i.msg));
          nexusMessageBuffer.forEach(({ ack }) => ack && ack());
          nexusMessageBuffer = [];
        }
        flusherTimeout = null;
      };

      const enqueueMessage = (buffer, item) => {
        buffer.push(item);
        if (!flusherTimeout) {
          flusherTimeout = setTimeout(flushBuffers, 150);
        }
      };

      socket.on("connect", () => {
        console.log("Socket connected - syncing data");
        syncConversationData();
      });

      socket.on("getOnlineUsers", (users) => {
        setOnlineUsers(users);
      });

      socket.on("newMessage", (message, ack) => {
        const senderIdStr = typeof message.senderId === "object" ? message.senderId._id : message.senderId;
        if (authUser && senderIdStr !== authUser._id) {
          soundManager.play("incomingmsg");
        }
        enqueueMessage(messageBuffer, { msg: message, ack });
      });

      socket.on("newNexusMessage", (message, ack) => {
        const senderIdStr = typeof message.senderId === "object" ? message.senderId._id : message.senderId;
        if (authUser && senderIdStr !== authUser._id) {
          soundManager.play("notification");
        }
        enqueueMessage(nexusMessageBuffer, { msg: message, ack });
      });

      socket.on("admin_notification", (data) => {
        toast((t) => (
          <div className="flex flex-col gap-1">
            <span className="font-bold text-sm flex items-center gap-2">
              <Megaphone size={14} className="text-primary" />
              {data.title || "Announcement"}
            </span>
            <span className="text-xs opacity-90">{data.message}</span>
          </div>
        ), {
          duration: 6000,
          position: "top-center",
          style: {
            background: data.severity === 'critical' ? '#ef4444' : data.severity === 'warning' ? '#f59e0b' : '#1e1b4b',
            color: '#fff',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.1)'
          }
        });
        soundManager.play("notification");
      });

      socket.on("nexusJoined", (nexus) => {
        addNexus(nexus);
        socket.emit("joinNexusRoom", nexus._id);
      });
      
      socket.on("userTyping", ({ from, isTyping }) => {
        setUserTyping(from, isTyping);
      });

      socket.on("nexusTyping", ({ nexusId, userId, username, isTyping }) => {
        setNexusTyping(userId, username, isTyping);
      });

      socket.on("userJoinedNexus", ({ nexusId, user, username }) => {
        useNexusStore.getState().addNexusMember(nexusId, user);
        toast.info(`${username} joined the Nexus`);
      });

      socket.on("userLeftNexus", ({ nexusId, userId, username }) => {
        useNexusStore.getState().removeNexusMemberSocket(nexusId, userId);
        toast.info(`${username} left the Nexus`);
      });

      socket.on("memberRemovedFromNexus", ({ nexusId, userId, username }) => {
        useNexusStore.getState().removeNexusMemberSocket(nexusId, userId);
        toast.warning(`${username} was removed from the Nexus`);
      });

      socket.on("messageUpdated", (message) => {
        useChatStore.getState().updateMessage(message._id, message);
      });

      socket.on("messageDeleted", ({ messageId }) => {
        useChatStore.getState().deleteMessage(messageId);
      });

      socket.on("nexusMessageUpdated", (data) => {
        const { nexusId, messageId, updates } = data;
        useNexusStore.getState().updateNexusMessage(nexusId, messageId, updates);
      });

      socket.on("nexusMessageDeleted", (data) => {
        const { nexusId, messageId } = data;
        useNexusStore.getState().deleteNexusMessage(nexusId, messageId);
      });

      socket.on("messageSeen", ({ messageId, seenAt }) => {
        useChatStore.getState().markMessageSeen(messageId, seenAt);
      });

      socket.on("nexusMessageSeen", ({ messageId, nexusId, seenAt }) => {
        useNexusStore.getState().markNexusMessageSeen(nexusId, messageId, seenAt);
      });

      socket.on("disconnect", () => {
        console.log("Socket disconnected");
        useChatStore.getState().clearUserTyping();
        useNexusStore.getState().clearNexusTyping();
      });

      return () => {
        if (flusherTimeout) clearTimeout(flusherTimeout);
        socket.off("connect");
        socket.off("getOnlineUsers");
        socket.off("newMessage");
        socket.off("newNexusMessage");
        socket.off("nexusJoined");
        socket.off("userTyping");
        socket.off("nexusTyping");
        socket.off("userJoinedNexus");
        socket.off("userLeftNexus");
        socket.off("memberRemovedFromNexus");
        socket.off("messageUpdated");
        socket.off("messageDeleted");
        socket.off("nexusMessageUpdated");
        socket.off("nexusMessageDeleted");
        socket.off("messageSeen");
        socket.off("nexusMessageSeen");
        socket.off("disconnect");
      };
    } else {
      disconnectSocket();
    }
  }, [authUser, socketToken, setOnlineUsers, addNexus, setUserTyping, setNexusTyping]);

  useEffect(() => {
    if (!authUser && window.__orbitMusicEngine__) {
      window.__orbitMusicEngine__.stop();
    }
  }, [authUser]);

  useEffect(() => {
    if (!authUser || !showPostAuthLoader) return;

    postAuthLoaderStartedAtRef.current = Date.now();
    postAuthDataReadyRef.current = false;
    postAuthAnimationReadyRef.current = false;
    let cancelled = false;

    Promise.allSettled([getUsers(), getNexuses()]).finally(() => {
      if (!cancelled) {
        postAuthDataReadyRef.current = true;
        requestFinishPostAuthLoader();
      }
    });

    return () => {
      cancelled = true;
      if (postAuthFinishTimerRef.current) {
        clearTimeout(postAuthFinishTimerRef.current);
        postAuthFinishTimerRef.current = null;
      }
    };
  }, [authUser, showPostAuthLoader, getUsers, getNexuses, requestFinishPostAuthLoader]);

  const spotifyLinked = useSpotifyStore((state) => state.spotifyLinked);
  const startPolling = useSpotifyStore((state) => state.startPolling);
  const stopPolling = useSpotifyStore((state) => state.stopPolling);

  useEffect(() => {
    if (spotifyLinked) {
      startPolling();
    } else {
      stopPolling();
    }
    return () => stopPolling();
  }, [spotifyLinked, startPolling, stopPolling]);

  const [isOrbitMode, setIsOrbitMode] = useState(false);
  useEffect(() => {
    if (isOrbitMode) {
      setIsOrbitMode(false);
    }
  }, [location.pathname]);
  useEffect(() => {
    const onOpen  = () => {
      soundManager.play("yourorbit");
      setIsOrbitMode(true);
    };
    const onClose = () => setIsOrbitMode(false);
    window.addEventListener("toggle-orbit-mode", onOpen);
    window.addEventListener("orbit-mode-closed",  onClose);
    return () => {
      window.removeEventListener("toggle-orbit-mode", onOpen);
      window.removeEventListener("orbit-mode-closed",  onClose);
    };
  }, []);

  useEffect(() => {
    const isOverlayPage = isOrbitMode || location.pathname === "/spotify";
    if (isOverlayPage) {
      window.dispatchEvent(new CustomEvent("orbit:fade-out-for-overlay"));
    } else {
      window.dispatchEvent(new CustomEvent("orbit:resume-from-overlay"));
    }
  }, [isOrbitMode, location.pathname]);

  useEffect(() => {
    const handleGlobalClick = (e) => {
      const clickable = e.target.closest('button, a, input[type="button"], input[type="submit"], input[type="checkbox"], input[type="radio"], select, [role="button"], .v-toggle, .enter-orbit-card, .btn');
      if (clickable) {
        soundManager.play("click");
      }
    };
    document.addEventListener("click", handleGlobalClick, { capture: true });
    return () => document.removeEventListener("click", handleGlobalClick, { capture: true });
  }, []);


  return (
    <div className={`relative h-screen bg-base-300 text-[var(--chat-text)] overflow-hidden flex flex-col ${isOrbitMode ? 'orbit-active' : ''}`}>
      <GlobalAnnouncementBanner />
      <ThemePortal />
      {!isOnline && <ConnectionStatus />}
      <NotificationContainer />
      {(!hydrated || (isCheckingAuth && !!authUser)) && !isAuthPage && !isAdminRoute ? (
        <OrbitLoader />
      ) : (
        <>
          {!isAuthPage && !isAdminRoute && !isFullscreenTheme && !isOrbitMode && <Navbar />}
          <main
            className={`flex flex-col flex-1 min-h-0 overflow-hidden ${isAuthPage || isFullscreenTheme || isAdminRoute ? "" : "pt-12"} relative`}
          >
            {isAuthPage ? (
              <Suspense fallback={<OrbitLoader />}>
                {authUser && !location.pathname.includes('starweave') ? (
                  <Navigate to="/" />
                ) : location.pathname === "/login/constellation" ? (
                  <OrbitAuth initialMode="login" />
                ) : location.pathname === "/signup/constellation" ? (
                  <OrbitAuth initialMode="signup" />
                ) : location.pathname === "/login/facelock" ||
                  location.pathname === "/signup/facelock" ? (
                  <FaceLock />
                ) : location.pathname === "/login/ambient" ||
                  location.pathname === "/signup/ambient" ? (
                  <AmbientPresence />
                ) : location.pathname === "/login/starweave" ? (
                  <StarWeaveLoginPage />
                ) : location.pathname === "/signup/starweave" ? (
                  <StarWeaveSignupPage />
                ) : (
                  <AuthShell animationKey={location.pathname}>
                    {location.pathname === "/verify-email" ? (
                      <VerifyEmailPage />
                    ) : location.pathname === "/signup" ? (
                      <SignUpPage />
                    ) : location.pathname === "/forgot-password" ? (
                      <ForgotPasswordPage />
                    ) : (
                      <LoginPage />
                    )}
                  </AuthShell>
                )}
              </Suspense>
            ) : (
              <Suspense fallback={<div className="flex-1 flex items-center justify-center"><span className="loading loading-spinner loading-lg text-primary" /></div>}>
                <Routes>
                  <Route
                    path="/"
                    element={
                      authUser ? (
                        <DynamicRouteHandler
                          isDark={isDark}
                          isCyber={isCyber}
                          isGamer={isGamer}
                          isAmoled={isAmoled}
                          isLight={isLight}
                          isPastel={isPastel}
                          HomePage={HomePage}
                        />
                      ) : (
                        <Navigate to="/login" />
                      )
                    }
                  />

                  <Route
                    path="/nexus/:nexusId"
                    element={
                      authUser ? (
                        <DynamicRouteHandler
                          isDark={isDark}
                          isCyber={isCyber}
                          isGamer={isGamer}
                          isAmoled={isAmoled}
                          isLight={isLight}
                          isPastel={isPastel}
                          HomePage={HomePage}
                        />
                      ) : (
                        <Navigate to="/login" />
                      )
                    }
                  />

                  <Route
                    path="/chat/:userId"
                    element={
                      authUser ? (
                        <DynamicRouteHandler
                          isDark={isDark}
                          isCyber={isCyber}
                          isGamer={isGamer}
                          isAmoled={isAmoled}
                          isLight={isLight}
                          isPastel={isPastel}
                          HomePage={HomePage}
                        />
                      ) : (
                        <Navigate to="/login" />
                      )
                    }
                  />
                  <Route
                    path="/spotify"
                    element={
                      authUser ? <SpotifyPage /> : <Navigate to="/login" />
                    }
                  />
                  <Route
                    path="/settings"
                    element={
                      authUser ? <SettingsPage /> : <Navigate to="/login" />
                    }
                  />
                  <Route
                    path="/profile"
                    element={
                      authUser ? <ProfilePage /> : <Navigate to="/login" />
                    }
                  />
                  <Route path="/tether/approve" element={<TetherApproval />} />
                  <Route path="/login/starweave"  element={<StarWeaveLoginPage />} />
                  <Route path="/signup/starweave" element={<StarWeaveSignupPage />} />
                  <Route path="/verify-email" element={<VerifyEmailPage />} />

                  {/* Admin Routes */}
                  <Route path="/admin/login" element={<AdminLogin />} />
                  <Route path="/admin" element={<AdminLayout />}>
                    <Route path="dashboard" element={<AdminDashboard />} />
                    <Route path="users" element={<AdminUsers />} />
                    <Route path="messages" element={<AdminMessages />} />
                    <Route path="nexuses" element={<AdminNexuses />} />
                    <Route path="security" element={<AdminSecurity />} />
                    <Route path="system" element={<AdminSystem />} />
                    <Route path="broadcast" element={<AdminBroadcast />} />
                  </Route>
                </Routes>
              </Suspense>
            )}
            {showPostAuthLoader && (
              <PostAuthLoader
                onComplete={() => {
                  postAuthAnimationReadyRef.current = true;
                  requestFinishPostAuthLoader();
                }}
              />
            )}
            {isOrbitMode && (
              <div className="fixed inset-0 z-[9999]">
                <OrbitChatApp onClose={() => {
                  window.dispatchEvent(new CustomEvent("orbit-mode-closed"));
                }} />
              </div>
            )}
          </main>
          <GlobalMiniPlayer />
        </>
      )}
    </div>
  );
};

const App = () => {
  const { theme } = useThemeStore();
  const authUser = useAuthStore(s => s.authUser);


  return (
    <ErrorBoundary>
      <IdentityProvider>
        <AppContent />
      </IdentityProvider>
    </ErrorBoundary>
  );
};

export default App;