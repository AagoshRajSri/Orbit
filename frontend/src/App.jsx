import Navbar from "./components/layout/Navbar";
import { Routes, Route, Navigate, useLocation, useParams, useNavigate } from "react-router-dom";
import { lazy, Suspense, useState, useEffect, useRef, useCallback } from "react";
import toast from "./lib/toast";
import { motion, AnimatePresence } from "framer-motion";


const HomePage = lazy(() => import("./pages/HomePage"));
import SignUpPage from "./pages/SignUpPage";
import LoginPage from "./pages/LoginPage";
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const SpotifyPage = lazy(() => import("./pages/SpotifyPage"));
const TetherApproval = lazy(() => import("./pages/TetherApproval"));
const StarWeaveLoginPage = lazy(() => import("./starweave/pages/StarWeaveLoginPage"));
const StarWeaveSignupPage = lazy(() => import("./starweave/pages/StarWeaveSignupPage"));
const VerifyEmailPage = lazy(() => import("./pages/VerifyEmailPage"));

import FaceLock from "./components/auth/FaceLock";
import AmbientPresence from "./components/avatar/AmbientPresence";
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
import { useDevicePerformance } from "./hooks/useDevicePerformance";
import { useSpotifyStore } from "./store/useSpotifyStore";
import { getSocket, disconnectSocket, updateSocketToken } from "./lib/socket";
import ChatLoader from "./components/chat/ChatLoader";
import OrbitLoader from "./components/common/OrbitLoader";
import PostAuthLoader from "./components/auth/PostAuthLoader";
import AuthShell from "./components/auth/AuthShell";
import { NotificationContainer } from "./components/common/NotificationContainer";
import MobileSidebarDrawer from "./components/layout/MobileSidebarDrawer";
import {
  ErrorBoundary,
  ConnectionStatus,
  useConnectivity,
} from "./components/layout/ResponsiveLayout";
import { performanceDetector } from "./lib/performanceDetection";
import { IdentityProvider } from "./context/IdentityContext";
import { useSettingsStore } from "./store/useSettingsStore";
import { useThemeStore } from "./store/useThemeStore";
import { THEMES, THEME_LABELS } from "./constants/index";
import NexusActionOverlay from "./components/nexus/NexusActionOverlay";
import { soundManager } from "./lib/SoundManager";
import ThemePortal from "./components/common/ThemePortal";
import GlobalMiniPlayer from "./components/layout/GlobalMiniPlayer";
import GlobalAnnouncementBanner from "./components/layout/GlobalAnnouncementBanner";
import { normalizeId } from "./lib/idUtils";

import OrbitChatApp from "./components/layout/OrbitChatApp";
import { useAnimationContext } from "./components/effects/AnimLayer";
import { AvatarProvider } from "./context/AvatarContext.jsx";

// Initialized exactly once at module load time (before any renders)
let _appSettingsInitialized = false;
function ensureAppSettings() {
  if (_appSettingsInitialized) return;
  _appSettingsInitialized = true;
  useSettingsStore.getState().initializeSettings();
  soundManager.initializeSettingsIntegration(useSettingsStore);
}

const DynamicThemeLoader = ({ isDark, isCyber, isGamer, isAmoled, isLight, isPastel, HomePage, children }) => {
  const [ThemeComponent, setThemeComponent] = useState(null);
  
  useEffect(() => {
    const loadTheme = async () => {
      try {
        let Component = null;

        if (isDark) {
          const mod = await import("./themes/darkTheme");
          Component = mod.default;
        } else if (isCyber) {
          const mod = await import("./themes/darkCyberpunkTheme");
          Component = mod.default;
        } else if (isGamer) {
          const mod = await import("./themes/gamerTheme");
          Component = mod.default;
        } else if (isAmoled) {
          const mod = await import("./themes/amoledTheme");
          Component = mod.default;
        } else if (isLight) {
          const mod = await import("./themes/lightTheme");
          Component = mod.default;
        } else if (isPastel) {
          const mod = await import("./themes/pastelTheme");
          Component = mod.default;
        } else {
          // If no theme, render children directly or fallback to HomePage
          Component = ({ children }) => children || <HomePage />;
        }

        // Safety: ensure we got a real callable React component, not a stale
        // module object or undefined (which would cause React error #31).
        if (typeof Component !== "function") {
          console.error("[DynamicThemeLoader] Theme module did not export a valid component:", Component);
          Component = ({ children }) => children || <HomePage />;
        }

        setThemeComponent(() => Component);
      } catch (err) {
        console.error("Theme load failed:", err);
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

  return <ThemeComponent children={children} />;
};

/**
 * Syncs URL parameters with global state for Nexuses and Chats
 */
const DynamicRouteHandler = (props) => {
  const { nexusId, userId } = useParams();
  const { nexuses, setSelectedNexus, selectedNexus } = useNexusStore();
  const { users, setSelectedUser, selectedUser } = useChatStore();
  const location = useLocation();

  useEffect(() => {

    const nid = normalizeId(nexusId);
    const uid = normalizeId(userId);

    // If we have a nexusId in the URL, ensure it's selected in the store
    if (nid && nexuses.length > 0) {
      const currentId = normalizeId(selectedNexus);
      // Check if current selection doesn't match URL
      if (currentId !== nid && selectedNexus?.id !== nid) {
        const target = nexuses.find(n => n._id?.toString() === nid || n.id?.toString() === nid);
        if (target) {
          setSelectedNexus(target);
        }
      }
    }
    // If we have a userId in the URL, ensure it's selected in the store
    else if (uid) {
      const currentId = normalizeId(selectedUser);
      // Check if current selection doesn't match URL
      if (currentId !== uid && selectedUser?.id !== uid) {
        // Try to find the full user object in the loaded users array
        const target = users.find(u => u._id?.toString() === uid || u.id?.toString() === uid);
        if (target) {
          // Full user object found — set normally
          setSelectedUser(target);
        } else {
          // Users not loaded yet (getUsers() still in-flight) — set a stub so that
          // selectedConversationId is populated immediately. Incoming socket messages
          // will then pass the belongsToCurrentChat check instead of being silently dropped.
          // This effect re-runs once users load (users array changes), upgrading to full object.
          setSelectedUser({ _id: uid, id: uid });
        }
      }
    }
    // Only clear if we are explicitly at the root and not in a special action view
    else if (!nid && !uid && location.pathname === "/") {
      if (selectedNexus) setSelectedNexus(null);
      if (selectedUser) setSelectedUser(null);
    }
  }, [nexusId, userId, nexuses, users, selectedNexus, selectedUser, setSelectedNexus, setSelectedUser, location.pathname]);

  return <DynamicThemeLoader {...props} />;
};

const AppContent = () => {
  useAnimationContext();
  const location = useLocation();
  const navigate = useNavigate();

  const isAuthPage = [
    "/login", "/signup", "/forgot-password", "/verify-email",
    "/login/constellation", "/signup/constellation",
    "/login/facelock", "/signup/facelock",
    "/login/ambient", "/signup/ambient",
    "/login/starweave", "/signup/starweave"
  ].some(path => location.pathname === path || location.pathname === path + "/");

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
  const messages = useChatStore((state) => state.messages);
  const markSeen = useChatStore((state) => state.markSeen);
  const selectedConversationId = useChatStore((state) => state.selectedConversationId);
  const selectedConversationType = useChatStore((state) => state.selectedConversationType);
  const getNexuses = useNexusStore((state) => state.getNexuses);
  const setNexusTyping = useNexusStore((state) => state.setNexusTyping);
  const addNexus = useNexusStore((state) => state.addNexus);
  const nexusMessages = useNexusStore((state) => state.nexusMessages);
  const markNexusSeen = useNexusStore((state) => state.markNexusSeen);
  const selectedNexusId = useNexusStore((state) => state.selectedNexusId);
  const postAuthLoaderStartedAtRef = useRef(null);
  const postAuthDataReadyRef = useRef(false);
  const postAuthAnimationReadyRef = useRef(false);
  const postAuthFinishTimerRef = useRef(null);
  const markSeenTimeoutRef = useRef(null);
  const markNexusSeenTimeoutRef = useRef(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const goOnline = () => setIsOffline(false);
    const goOffline = () => setIsOffline(true);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  useEffect(() => {
    ensureAppSettings();
    performanceDetector.detect();
    useAuthStore.getState().fetchAppConfig();
  }, []);

  // Initialize and apply global device performance classes
  useDevicePerformance();

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

  // Ref-based buffers and locks to prevent race conditions
  const messageBufferRef = useRef([]);
  const nexusMessageBufferRef = useRef([]);
  const flusherTimeoutRef = useRef(null);
  const isFlushingRef = useRef(false);

  const flushBuffers = useCallback(async () => {
    if (isFlushingRef.current) return;
    isFlushingRef.current = true;
    flusherTimeoutRef.current = null;

    try {
      // Process direct messages sequentially to maintain order
      if (messageBufferRef.current.length > 0) {
        const msgs = [...messageBufferRef.current];
        messageBufferRef.current = [];
        const chatStore = useChatStore.getState();
        for (const i of msgs) {
          // Always ack FIRST so the backend's emitWithAck resolves immediately.
          // Without this, a local processing error causes the server to treat the
          // user as offline and queue the message in Redis — only visible after refresh.
          if (typeof i.ack === "function") i.ack();
          try {
            await chatStore.addMessage(i.msg);
          } catch (err) {
            console.error("Error processing message buffer:", err);
          }
        }
      }

      // Process nexus messages sequentially to maintain order
      if (nexusMessageBufferRef.current.length > 0) {
        const msgs = [...nexusMessageBufferRef.current];
        nexusMessageBufferRef.current = [];
        const nexusStore = useNexusStore.getState();
        for (const i of msgs) {
          // Same: ack first, process second
          if (typeof i.ack === "function") i.ack();
          try {
            nexusStore.addNexusMessage(i.msg);
          } catch (err) {
            console.error("Error processing nexus message buffer:", err);
          }
        }
      }
    } finally {
      isFlushingRef.current = false;
      // If new messages arrived while we were flushing, schedule another flush
      if (messageBufferRef.current.length > 0 || nexusMessageBufferRef.current.length > 0) {
        flusherTimeoutRef.current = setTimeout(flushBuffers, 50);
      }
    }
  }, []);

  const enqueueMessage = useCallback((bufferRef, item) => {
    bufferRef.current.push(item);
    if (!flusherTimeoutRef.current && !isFlushingRef.current) {
      flusherTimeoutRef.current = setTimeout(flushBuffers, 50);
    }
  }, [flushBuffers]);

  const syncConversationData = useCallback(() => {
    const authUser = useAuthStore.getState().authUser;
    if (!authUser) return;

    const chatState = useChatStore.getState();
    const nexusState = useNexusStore.getState();

    // Sync active conversation messages if they haven't been loaded yet
    if (chatState.selectedConversationId && chatState.selectedConversationType === "direct") {
      if (chatState.messages.length === 0) {
        chatState.getMessages(chatState.selectedConversationId, "direct");
      }
    }

    if (nexusState.selectedNexusId) {
      if (nexusState.nexusMessages.length === 0) {
        nexusState.getNexusMessages(nexusState.selectedNexusId);
      }
    }
  }, []);

  // Primary Socket Lifecycle - Tied to authUser
  // Only initialize and attach handlers once the user is authenticated.
  // This prevents "Access Denied" errors on unauthenticated page loads.
  useEffect(() => {
    if (!authUser) {
      // User logged out — disconnect and clear
      disconnectSocket();
      return;
    }

    const socket = getSocket();
    if (!socket) return;

    const handlers = {
      connect: () => {
        console.log("[Socket] Connected - Triggering sync");
        syncConversationData();
      },
      getOnlineUsers: (users) => {
        setOnlineUsers(users);
      },
      newMessage: (message, ack) => {
        const currentAuthUser = useAuthStore.getState().authUser;
        // Robust ID check: if sender is NOT the current user, play sound
        const senderId = message.senderId?._id || message.senderId?.id || message.senderId;
        const myId = currentAuthUser?._id || currentAuthUser?.id;

        if (myId && senderId?.toString() !== myId.toString()) {
          soundManager.play("incomingmsg");
        }
        enqueueMessage(messageBufferRef, { msg: message, ack });
      },
      newNexusMessage: (message, ack) => {
        const currentAuthUser = useAuthStore.getState().authUser;
        const senderId = message.senderId?._id || message.senderId?.id || message.senderId;
        const myId = currentAuthUser?._id || currentAuthUser?.id;

        if (myId && senderId?.toString() !== myId.toString()) {
          soundManager.play("notification");
        }
        enqueueMessage(nexusMessageBufferRef, { msg: message, ack });
      },
      admin_notification: (data) => {
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
      },
      nexusJoined: (nexus) => {
        addNexus(nexus);
        socket.emit("joinNexusRoom", nexus._id);
      },
      userTyping: ({ from, isTyping }) => {
        setUserTyping(from, isTyping);
      },
      nexusTyping: ({ nexusId, userId, username, isTyping }) => {
        setNexusTyping(userId, username, isTyping);
      },
      userJoinedNexus: ({ nexusId, user, username }) => {
        useNexusStore.getState().addNexusMember(nexusId, user);
        toast.info(`${username} joined the Nexus`);
      },
      userLeftNexus: ({ nexusId, userId, username }) => {
        useNexusStore.getState().removeNexusMemberSocket(nexusId, userId);
        toast.info(`${username} left the Nexus`);
      },
      memberRemovedFromNexus: ({ nexusId, userId, username }) => {
        useNexusStore.getState().removeNexusMemberSocket(nexusId, userId);
        toast.warning(`${username} was removed from the Nexus`);
      },
      messageUpdated: (message) => {
        useChatStore.getState().updateMessage(message._id, message);
      },
      messageDeleted: ({ messageId }) => {
        useChatStore.getState().deleteMessage(messageId);
      },
      nexusMessageUpdated: (data) => {
        const { nexusId, messageId, updates } = data;
        useNexusStore.getState().updateNexusMessage(nexusId, messageId, updates);
      },
      nexusMessageDeleted: (data) => {
        const { nexusId, messageId } = data;
        useNexusStore.getState().deleteNexusMessage(nexusId, messageId);
      },
      messageSeen: ({ messageId, seenAt }) => {
        useChatStore.getState().markMessageSeen(messageId, seenAt);
      },
      nexusMessageSeen: ({ messageId, nexusId, seenAt }) => {
        useNexusStore.getState().markNexusMessageSeen(nexusId, messageId, seenAt);
      },
      disconnect: (reason) => {
        console.log("[Socket] Disconnected:", reason);
        useChatStore.getState().clearUserTyping();
        useNexusStore.getState().clearNexusTyping();
      }
    };

    // Attach all handlers
    Object.keys(handlers).forEach(event => {
      socket.on(event, handlers[event]);
    });

    // Initial manual trigger for sync if already connected
    if (socket.connected) {
      syncConversationData();
    }

    return () => {
      console.log("[Socket] Cleanup: Removing listeners");
      if (flusherTimeoutRef.current) clearTimeout(flusherTimeoutRef.current);
      Object.keys(handlers).forEach(event => {
        socket.off(event, handlers[event]);
      });
    };
  // Use the user ID (not the full object) as the dep — avoids re-attaching
  // handlers on every profile update while still responding to login/logout.
  }, [authUser?._id || authUser?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle Token Updates — also initialises the socket the first time
  // a fresh token arrives after a page reload (cookie-based auth).
  useEffect(() => {
    if (socketToken) {
      // If socket doesn't exist yet (first token after reload), create it
      const existingSocket = getSocket();
      if (existingSocket) {
        updateSocketToken(socketToken);
      }
    }
  }, [socketToken]);


  // Post-Auth Sync
  useEffect(() => {
    if (authUser) {
      syncConversationData();
    }
  }, [authUser, syncConversationData]);

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
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [mobileDrawerTab, setMobileDrawerTab] = useState("nexus");
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

  // Auto-mark as seen for Direct Chats (Debounced)
  useEffect(() => {
    if (!authUser) return;
    if (selectedConversationId && selectedConversationType === "direct") {
      if (markSeenTimeoutRef.current) clearTimeout(markSeenTimeoutRef.current);
      markSeenTimeoutRef.current = setTimeout(() => {
        markSeen(selectedConversationId);
      }, 500);
    }
  }, [selectedConversationId, selectedConversationType, messages.length, markSeen, authUser]);

  // Auto-mark as seen for Nexuses (Debounced)
  useEffect(() => {
    if (!authUser) return;
    if (selectedNexusId) {
      if (markNexusSeenTimeoutRef.current) clearTimeout(markNexusSeenTimeoutRef.current);
      markNexusSeenTimeoutRef.current = setTimeout(() => {
        markNexusSeen(selectedNexusId);
      }, 500);
    }
  }, [selectedNexusId, nexusMessages.length, markNexusSeen, authUser]);


  return (
    <div className={`relative h-dvh bg-base-300 text-[var(--chat-text)] overflow-hidden flex flex-col ${isOrbitMode ? 'orbit-active' : ''}`}>
      <GlobalAnnouncementBanner />
      <ThemePortal />
      {!isOnline && <ConnectionStatus />}
      <NotificationContainer />
      {(!hydrated || (isCheckingAuth && !!authUser && location.pathname !== "/")) && !isAuthPage && !isAdminRoute ? (
        <OrbitLoader />
      ) : (
        <>
          {!isAuthPage && !isAdminRoute && !isFullscreenTheme && !isOrbitMode && (
            <Navbar onHamburger={() => { setMobileDrawerTab("nexus"); setMobileDrawerOpen(true); }} />
          )}
          {/* Mobile sidebar drawer — accessible from Navbar hamburger */}
          {!isAuthPage && !isAdminRoute && authUser && (
            <MobileSidebarDrawer
              isOpen={mobileDrawerOpen}
              onClose={() => setMobileDrawerOpen(false)}
              initialTab={mobileDrawerTab}
            />
          )}
          <main
            className={`flex flex-col flex-1 min-h-0 overflow-hidden main-content-mobile ${isAuthPage || isFullscreenTheme || isAdminRoute ? "" : "pt-12"} relative`}
          >
            {isAuthPage ? (
              <Suspense fallback={<OrbitLoader />}>
                {authUser && !isCheckingAuth && !location.pathname.includes('starweave') ? (
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
          <AnimatePresence>
            {isOffline && (
              <motion.div
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -50 }}
                className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] bg-error text-error-content px-4 py-2 rounded-full shadow-2xl flex items-center gap-2 font-bold text-sm"
              >
                <div className="size-2 bg-white rounded-full animate-pulse" />
                Connection lost. Orbit is offline.
              </motion.div>
            )}
          </AnimatePresence>
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
        <AvatarProvider options={{ sleepAfter: 60_000, typingDebounce: 1500 }}>
          <AppContent />
        </AvatarProvider>
      </IdentityProvider>
    </ErrorBoundary>
  );
};

export default App;