import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { motion, AnimatePresence, useSpring } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { useNexusStore } from "../store/useNexusStore";
import { prefersReducedMotion } from "./MotionSystem";
import { CentralPulse } from "../components/CentralPulse";
import { PixelAvatarBadge } from "../components/avatar/PixelAvatar/PixelAvatarBadge";
import { CloudOff, Activity, Compass, Users, Plus } from "lucide-react";
import { getQueue } from "../lib/offlineQueue";

function SyncStatusBadge() {
  const [queueCount, setQueueCount] = useState(0);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const checkQueue = async () => {
      try {
        const q = await getQueue();
        setQueueCount(q.length);
      } catch (e) {
        // IDB not ready
      }
    };
    checkQueue();

    const handleOfflineQueueChange = () => checkQueue();
    const handleOnline = () => { setIsOffline(false); checkQueue(); };
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('orbit:offline-queue-changed', handleOfflineQueueChange);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('orbit:offline-queue-changed', handleOfflineQueueChange);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline && queueCount === 0) return null;

  return (
    <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${isOffline ? 'bg-amber-500/20 text-amber-500' : 'bg-emerald-500/20 text-emerald-400'}`}>
      {isOffline ? <CloudOff className="size-2.5" /> : <Activity className="size-2.5 animate-pulse" />}
      {isOffline ? 'Offline' : 'Syncing'}
      {queueCount > 0 && <span className="bg-black/40 px-1 rounded-sm ml-0.5">{queueCount}</span>}
    </div>
  );
}

// ── Orbital Node Component ───────────────────────────────────────────────────

function OrbitalNode({
  id,
  item,
  type,
  isSelected,
  selectedId,
  hasUnread,
  unreadCount,
  peerState,
  onClick,
  basePos,
  isMobile,
}) {
  const [hover, setHover] = useState(false);
  const nodeRef = useRef(null);

  // Magnetic hover tracking
  const [magneticOffset, setMagneticOffset] = useState({ x: 0, y: 0 });
  const springX = useSpring(0, { stiffness: 200, damping: 20 });
  const springY = useSpring(0, { stiffness: 200, damping: 20 });

  useEffect(() => {
    if (prefersReducedMotion) return;
    springX.set(magneticOffset.x);
    springY.set(magneticOffset.y);
  }, [magneticOffset, springX, springY]);

  const handleMouseMove = (e) => {
    if (prefersReducedMotion || isMobile) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const nodeCenterX = rect.left + rect.width / 2;
    const nodeCenterY = rect.top + rect.height / 2;
    const dx = e.clientX - nodeCenterX;
    const dy = e.clientY - nodeCenterY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < 50) {
      const pull = 6; // max offset ±6px toward cursor
      setMagneticOffset({
        x: (dx / distance) * pull,
        y: (dy / distance) * pull,
      });
    } else {
      setMagneticOffset({ x: 0, y: 0 });
    }
  };

  const handleMouseLeave = () => {
    setHover(false);
    setMagneticOffset({ x: 0, y: 0 });
  };

  // Compute position shifts on selections
  const hasSelection = !!selectedId;
  const itemSelected = isSelected;

  let x = basePos.x;
  let y = basePos.y;
  let scale = isMobile ? 1.0 : 1.0;
  let opacity = 1.0;

  if (hasSelection) {
    if (itemSelected) {
      scale = isMobile ? 1.2 : 1.15;
      x = isMobile ? basePos.x : basePos.x * 0.3; // Moves toward center in desktop
      y = isMobile ? basePos.y : basePos.y * 0.3;
    } else {
      scale = isMobile ? 0.8 : 0.7;
      x = isMobile ? basePos.x : basePos.x * 1.25; // Drift outward in desktop
      y = isMobile ? basePos.y : basePos.y * 1.25;
      opacity = 0.4;
    }
  }

  const ringColor = itemSelected
    ? "var(--accent-primary, #00d4ff)"
    : hasUnread
    ? "var(--text-success, #00ff88)"
    : "rgba(240, 237, 232, 0.1)";

  const glowScale = Math.min(3, 1 + (unreadCount || 0) * 0.5);
  const glow = itemSelected || hasUnread
    ? `0 0 ${12 * glowScale}px ${ringColor}`
    : "none";

  const size = isMobile ? 24 : itemSelected ? 36 : 28;

  return (
    <motion.div
      ref={nodeRef}
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        x: prefersReducedMotion ? x : springX,
        y: prefersReducedMotion ? y : springY,
        translateX: "-50%",
        translateY: "-50%",
        zIndex: itemSelected ? 50 : 20,
      }}
      animate={{
        x: prefersReducedMotion ? x : undefined,
        y: prefersReducedMotion ? y : undefined,
      }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={() => setHover(true)}
    >
      <motion.button
        onClick={() => onClick(item)}
        className="relative rounded-full flex items-center justify-center transition-all focus:outline-none"
        style={{
          width: size,
          height: size,
          opacity,
          scale: hover && !isMobile ? 1.15 : 1,
          transition: "width 0.2s, height 0.2s, scale 0.2s",
        }}
        aria-label={`${type === "nexus" ? item.name : item.username}, ${unreadCount || 0} unread`}
      >
        {/* Border Glow Ring */}
        <span
          className="absolute inset-0 rounded-full border-2 transition-all duration-300"
          style={{
            borderColor: ringColor,
            boxShadow: glow,
          }}
        />

        {/* PixelAvatar or Standard circular fallback */}
        <div className="rounded-full overflow-hidden w-full h-full flex items-center justify-center bg-black/40">
          <PixelAvatarBadge
            type={type === "nexus" ? "cat" : "dog"}
            state="idle"
            size={size - 4}
            showDot={false}
            style={{ imageRendering: "pixelated", borderRadius: "50%" }}
          />
        </div>

        {/* Dynamic Unread Dot Overlay */}
        {hasUnread && (
          <span
            className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[9px] font-black text-white shadow-[0_0_8px_#10b981]"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}

        {/* Presence Ring indicator for DMs */}
        {type === "user" && peerState && peerState !== "offline" && (
          <span
            className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border border-black ${
              peerState === "online" ? "bg-emerald-500" : "bg-amber-500"
            }`}
          />
        )}
      </motion.button>

      {/* Spatial Hover Label */}
      <AnimatePresence>
        {hover && !isMobile && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1.5 rounded-xl border border-white/5 backdrop-blur-xl pointer-events-none whitespace-nowrap text-center z-50 shadow-2xl"
            style={{
              background: "rgba(8, 9, 16, 0.85)",
              color: "var(--text-primary)",
            }}
          >
            <div className="font-bold text-[11px] tracking-wide">
              {type === "nexus" ? item.name : item.username}
            </div>
            <div className="text-[9px] opacity-60">
              {type === "nexus"
                ? `${item.members?.length || 0} members`
                : peerState || "Offline"}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

export function NavigationOrbit() {
  const navigate = useNavigate();

  const users = useChatStore((s) => s.users);
  const nexuses = useNexusStore((s) => s.nexuses);
  const onlineUsers = useAuthStore((s) => s.onlineUsers);
  const presenceMap = useAuthStore((s) => s.presenceMap);
  const nexusUnread = useNexusStore((s) => s.nexusUnread);

  const selectedUser = useChatStore((s) => s.selectedUser);
  const selectedNexus = useNexusStore((s) => s.selectedNexus);

  // Responsive layout state
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const onlineSet = useMemo(
    () => new Set(onlineUsers.map((id) => id?.toString())),
    [onlineUsers]
  );

  const selectedId = useMemo(() => {
    if (selectedNexus) return (selectedNexus._id || selectedNexus.id)?.toString();
    if (selectedUser) return (selectedUser._id || selectedUser.id)?.toString();
    return null;
  }, [selectedNexus, selectedUser]);

  const handleSelect = useCallback(
    (item, type) => {
      if (type === "nexus") {
        useNexusStore.getState().setSelectedNexus(item);
        useChatStore.getState().setSelectedUser(null);
        navigate(`/nexus/${item._id || item.id}`);
      } else {
        useChatStore.getState().setSelectedUser(item);
        useNexusStore.getState().setSelectedNexus(null);
        navigate(`/chat/${item._id || item.id}`);
      }
    },
    [navigate]
  );

  // Calculate coordinates for spatial layouts
  const nodes = useMemo(() => {
    const nexusNodes = nexuses.map((nexus, index) => {
      const id = (nexus._id || nexus.id)?.toString();
      const unread = nexusUnread[id] || 0;
      const isSel = selectedNexus && (selectedNexus._id || selectedNexus.id)?.toString() === id;
      return {
        id,
        item: nexus,
        type: "nexus",
        isSelected: isSel,
        hasUnread: unread > 0 && !isSel,
        unreadCount: unread,
        peerState: null,
      };
    });

    const userNodes = users.map((u) => {
      const id = (u._id || u.id)?.toString();
      const isSel = selectedUser && (selectedUser._id || selectedUser.id)?.toString() === id;
      const pState = presenceMap[id]?.state || (onlineSet.has(id) ? "online" : "offline");
      const unread = Number(u.unreadCount) || 0;
      return {
        id,
        item: u,
        type: "user",
        isSelected: isSel,
        hasUnread: unread > 0 && !isSel,
        unreadCount: unread,
        peerState: pState,
      };
    });

    return { nexusNodes, userNodes };
  }, [nexuses, users, selectedNexus, selectedUser, nexusUnread, presenceMap, onlineSet]);

  // Position calculation functions
  const getOrbitalPosition = useCallback(
    (type, index, total) => {
      const isNexus = type === "nexus";
      const orbitRadius = isNexus ? 140 : 80;
      // Arc fanning centered around user pulse (left thumb comfort zone)
      const angle = (index / (total || 1)) * Math.PI * 1.4 - Math.PI * 0.2;
      return {
        x: Math.cos(angle) * orbitRadius,
        y: Math.sin(angle) * orbitRadius,
      };
    },
    []
  );

  const getMobilePosition = useCallback((index, total) => {
    // 180° thumb arc fanned upwards from bottom center
    const angle = (index / (total - 1 || 1)) * Math.PI;
    const radius = 90;
    return {
      x: -Math.cos(angle) * radius,
      y: -Math.sin(angle) * radius,
    };
  }, []);

  return (
    <>
      {/* ── Desktop Spatial Cluster Layout ── */}
      {!isMobile && (
        <div
          className="fixed left-0 top-0 w-[220px] h-screen z-40 pointer-events-none"
          aria-label="Spatial Navigation"
        >
          {/* Centered orbital anchor */}
          <div className="absolute left-[100px] top-[50%] -translate-y-1/2 pointer-events-auto">
            {/* Central Pulse represents current user */}
            <CentralPulse className="absolute -translate-x-1/2 -translate-y-1/2" />

            {/* Orbit paths for aesthetics */}
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/5 pointer-events-none"
              style={{ width: 160, height: 160 }}
            />
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/5 pointer-events-none"
              style={{ width: 280, height: 280 }}
            />

            {/* Render Nodes along concentric orbits */}
            <AnimatePresence mode="popLayout">
              {nodes.nexusNodes.map((n, i) => (
                <OrbitalNode
                  key={n.id}
                  id={n.id}
                  item={n.item}
                  type="nexus"
                  isSelected={n.isSelected}
                  selectedId={selectedId}
                  hasUnread={n.hasUnread}
                  unreadCount={n.unreadCount}
                  peerState={n.peerState}
                  onClick={() => handleSelect(n.item, "nexus")}
                  basePos={getOrbitalPosition("nexus", i, nodes.nexusNodes.length)}
                  isMobile={false}
                />
              ))}

              {nodes.userNodes.map((u, i) => (
                <OrbitalNode
                  key={u.id}
                  id={u.id}
                  item={u.item}
                  type="user"
                  isSelected={u.isSelected}
                  selectedId={selectedId}
                  hasUnread={u.hasUnread}
                  unreadCount={u.unreadCount}
                  peerState={u.peerState}
                  onClick={() => handleSelect(u.item, "user")}
                  basePos={getOrbitalPosition("user", i, nodes.userNodes.length)}
                  isMobile={false}
                />
              ))}
            </AnimatePresence>
          </div>

          {/* Floating Actions Dock at Bottom Left */}
          <div className="absolute bottom-6 left-4 right-4 pointer-events-auto flex flex-col gap-2 items-center">
            <button
              onClick={() => document.dispatchEvent(new CustomEvent('open-nexus-modal'))}
              className="w-10 h-10 flex items-center justify-center bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full hover:bg-emerald-500/20 transition-all shadow-[0_0_15px_rgba(16,185,129,0.1)]"
              aria-label="Add Orbit"
            >
              <Plus className="size-5" />
            </button>
            <SyncStatusBadge />
          </div>
        </div>
      )}

      {/* ── Mobile Thumb-Arc Navigation ── */}
      {isMobile && (
        <div
          className="fixed bottom-[16px] left-[50%] -translate-x-1/2 z-40 pointer-events-auto"
          style={{
            marginBottom: "env(safe-area-inset-bottom)",
          }}
        >
          {/* Arc center represents current user */}
          <div className="relative">
            <CentralPulse
              className="-translate-x-1/2 -translate-y-1/2 scale-[0.8]"
              style={{ zIndex: 60 }}
            />

            {/* Concentric nodes in a combined 180° fanned arc */}
            {(() => {
              const allItems = [...nodes.nexusNodes, ...nodes.userNodes];
              return allItems.map((item, index) => (
                <OrbitalNode
                  key={item.id}
                  id={item.id}
                  item={item.item}
                  type={item.type}
                  isSelected={item.isSelected}
                  selectedId={selectedId}
                  hasUnread={item.hasUnread}
                  unreadCount={item.unreadCount}
                  peerState={item.peerState}
                  onClick={() => handleSelect(item.item, item.type)}
                  basePos={getMobilePosition(index, allItems.length)}
                  isMobile={true}
                />
              ));
            })()}
          </div>
        </div>
      )}
    </>
  );
}
