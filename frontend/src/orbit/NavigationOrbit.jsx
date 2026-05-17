import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { useNexusStore } from "../store/useNexusStore";
import { prefersReducedMotion, variants } from "./MotionSystem";
import { PixelAvatarBadge } from "../components/avatar/PixelAvatar/PixelAvatarBadge";
import { Hash, Users, Compass, CloudOff, CloudLightning, Activity } from "lucide-react";
import toast from "../lib/toast";
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
    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest ${isOffline ? 'bg-amber-500/20 text-amber-500' : 'bg-emerald-500/20 text-emerald-400'}`}>
      {isOffline ? <CloudOff className="size-3" /> : <Activity className="size-3 animate-pulse" />}
      {isOffline ? 'Offline' : 'Syncing'}
      {queueCount > 0 && <span className="bg-black/40 px-1.5 rounded-sm ml-1">{queueCount}</span>}
    </div>
  );
}

/**
 * NavigationOrbit.jsx
 * ──────────────────────────────────────────────────────────────────────────────
 * Phase 2 of Orbit Singularity: Radial / Floating Navigation System
 * Replaces the static Sidebar with a dynamic, spatial "Thumb Arc" (mobile)
 * or floating glass dock (desktop).
 */

const NAV_SPRING = { type: "spring", stiffness: 400, damping: 30 };

function NavItem({ id, item, type, isSelected, onClick, hasUnread, unreadCount, peerState, customText }) {
  const [hover, setHover] = useState(false);
  
  // Choose colors based on state
  const isOnline = peerState === "online";
  const ringColor = isSelected ? "var(--orb-acc, #c9a84c)" : hasUnread ? "#10b981" : "transparent";
  const glow = isSelected || hasUnread ? `drop-shadow(0 0 12px ${ringColor})` : "none";

  return (
    <motion.button
      layout="position"
      whileHover={prefersReducedMotion ? {} : { scale: 1.05, x: 4 }}
      whileTap={prefersReducedMotion ? {} : { scale: 0.95 }}
      onClick={() => onClick(item)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="relative flex items-center gap-3 p-2 w-full text-left rounded-2xl transition-all duration-300 group"
      style={{
        background: isSelected ? "var(--orb-glass-2)" : hover ? "var(--orb-glass-1)" : "transparent",
        border: `1px solid ${isSelected ? "var(--orb-acc, #c9a84c)" : "transparent"}`,
      }}
    >
      <div className="relative shrink-0 transition-transform duration-300" style={{ filter: glow }}>
        <PixelAvatarBadge
          type={type === "nexus" ? "cat" : "dog"} // Pseudo logic for animal
          state="idle"
          size={42}
          showDot={false}
          style={{ imageRendering: "pixelated", borderRadius: "12px" }}
        />
        {/* Unread / Online Indicator */}
        {hasUnread && type === "nexus" && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[9px] font-black text-white shadow-[0_0_8px_#10b981]">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
        {type === "user" && peerState && peerState !== "offline" && (
          <span 
            className={`absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-black ${isOnline ? "bg-emerald-500" : "bg-amber-500"}`} 
            style={{ boxShadow: `0 0 8px ${isOnline ? '#10b981' : '#f59e0b'}` }}
          />
        )}
      </div>

      <div className="flex flex-col overflow-hidden">
        <span className="truncate font-bold text-[13px] tracking-wide" style={{ color: "var(--orb-text, #fff)" }}>
          {type === "nexus" ? item.name : item.username}
        </span>
        <span className="truncate text-[10px] font-medium opacity-70 flex items-center gap-1" style={{ color: "var(--orb-text, #fff)" }}>
          {type === "nexus" ? (
             <><Hash className="size-3"/> {item.members?.length || 0} members</>
          ) : (
            <>
              {item.isTyping ? <span className="text-emerald-400 animate-pulse">Typing...</span> : peerState || "Offline"}
              {customText && <span className="italic truncate ml-1 opacity-60">— {customText}</span>}
            </>
          )}
        </span>
      </div>
    </motion.button>
  );
}

export function NavigationOrbit() {
  const navigate = useNavigate();
  const location = useLocation();

  const users = useChatStore((s) => s.users);
  const nexuses = useNexusStore((s) => s.nexuses);
  const onlineUsers = useAuthStore((s) => s.onlineUsers);
  const presenceMap = useAuthStore((s) => s.presenceMap);
  const nexusUnread = useNexusStore((s) => s.nexusUnread);
  
  const selectedUser = useChatStore((s) => s.selectedUser);
  const selectedNexus = useNexusStore((s) => s.selectedNexus);

  const [tab, setTab] = useState("nexus"); // 'nexus' | 'users'

  // Memoize sets for performance
  const onlineSet = useMemo(() => new Set(onlineUsers.map((id) => id?.toString())), [onlineUsers]);

  const handleSelect = useCallback((item, type) => {
    if (type === "nexus") {
      useNexusStore.getState().setSelectedNexus(item);
      useChatStore.getState().setSelectedUser(null);
      navigate(`/nexus/${item._id || item.id}`);
    } else {
      useChatStore.getState().setSelectedUser(item);
      useNexusStore.getState().setSelectedNexus(null);
      navigate(`/chat/${item._id || item.id}`);
    }
  }, [navigate]);

  return (
    <motion.nav
      initial={{ x: -50, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="fixed left-4 top-24 bottom-6 w-72 z-40 hidden md:flex flex-col rounded-[32px] overflow-hidden shadow-2xl backdrop-blur-2xl"
      style={{
        background: "var(--orb-glass-1, rgba(20,20,25,0.4))",
        border: "1px solid var(--orb-border, rgba(255,255,255,0.05))",
        boxShadow: "inset 0 0 40px rgba(0,0,0,0.5), 0 20px 60px rgba(0,0,0,0.5)",
      }}
    >
      {/* ── Segmented Control ── */}
      <div className="p-4 pb-2 relative z-10">
        <div className="flex bg-black/40 p-1 rounded-2xl relative shadow-inner">
          <motion.div
            className="absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-xl bg-white/10 shadow-[0_4px_12px_rgba(0,0,0,0.2)] border border-white/10 backdrop-blur-md"
            animate={{ left: tab === "nexus" ? 4 : "50%" }}
            transition={NAV_SPRING}
          />
          <button
            className={`relative z-10 flex-1 py-2 flex justify-center items-center gap-2 text-[11px] font-black uppercase tracking-widest transition-colors ${tab === "nexus" ? "text-white" : "text-white/40 hover:text-white/80"}`}
            onClick={() => setTab("nexus")}
          >
            <Compass className="size-4" /> Orbits
          </button>
          <button
            className={`relative z-10 flex-1 py-2 flex justify-center items-center gap-2 text-[11px] font-black uppercase tracking-widest transition-colors ${tab === "users" ? "text-white" : "text-white/40 hover:text-white/80"}`}
            onClick={() => setTab("users")}
          >
            <Users className="size-4" /> Comms
          </button>
        </div>
      </div>

      {/* ── List ── */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-3 pb-4">
        <AnimatePresence mode="popLayout">
          {tab === "nexus" && nexuses.map((nexus) => {
            const nId = (nexus._id || nexus.id)?.toString();
            const unread = nexusUnread[nId] || 0;
            const isSel = selectedNexus && (selectedNexus._id || selectedNexus.id)?.toString() === nId;
            return (
              <motion.div key={nId} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.2 }}>
                <NavItem
                  id={nId}
                  item={nexus}
                  type="nexus"
                  isSelected={isSel}
                  hasUnread={unread > 0 && !isSel}
                  unreadCount={unread}
                  onClick={(n) => handleSelect(n, "nexus")}
                />
              </motion.div>
            );
          })}

          {tab === "users" && users.map((u) => {
            const uId = (u._id || u.id)?.toString();
            const isSel = selectedUser && (selectedUser._id || selectedUser.id)?.toString() === uId;
            const pState = presenceMap[uId]?.state || (onlineSet.has(uId) ? "online" : "offline");
            return (
              <motion.div key={uId} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.2 }}>
                <NavItem
                  id={uId}
                  item={u}
                  type="user"
                  isSelected={isSel}
                  peerState={pState}
                  customText={presenceMap[uId]?.customText}
                  onClick={(u) => handleSelect(u, "user")}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>

        {tab === "nexus" && nexuses.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full opacity-40 text-[11px] font-bold tracking-widest uppercase">
             No Orbits Detected
          </div>
        )}
      </div>
      
      {/* ── Actions Footer ── */}
      <div className="p-3 border-t border-white/5 bg-black/20 shrink-0 flex justify-between items-center">
        <button 
          onClick={() => { document.dispatchEvent(new CustomEvent('open-nexus-modal')); }}
          className="px-4 py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500/20 transition-colors shadow-[0_0_15px_rgba(16,185,129,0.1)]"
        >
          + Add Orbit
        </button>
        <SyncStatusBadge />
      </div>
    </motion.nav>
  );
}

export default NavigationOrbit;
