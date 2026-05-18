import { motion, AnimatePresence } from "framer-motion";
import {
  Bell, Zap, MessageCircle, Settings, Music,
  Disc, Pause, Play, SkipBack, SkipForward, Volume2, Gamepad2, Lock,
  Hash, ChevronRight, Plus, UserPlus
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSpotifyStore } from "../../store/useSpotifyStore";
import { spotifyService } from "../../services/spotifyService";
import React, { memo, useMemo, useState, useEffect, useRef, useCallback } from "react";
import { ThemeMainContainer, ThemeCardWrapper } from "./welcome/WelcomeWrappers";
import { useThemeStore } from "../../store/useThemeStore";
import { TruePastelDashboard } from "./welcome/PastelDreamBoard";
import { BusinessLightDashboard, GlowCurve, FloatingDust, ElegantSpotifyCard } from "./welcome/BusinessLightDashboard";
import OrbitApp from "../../themes/amoledTheme";
import OrbitGrind from "../../themes/gamerTheme";
import OrbitVampire from "../../themes/darkTheme";
import OrbitNeonCyberpunk from "../../themes/darkCyberpunkTheme";
import { createPortal } from "react-dom";
import { useNexusStore } from "../../store/useNexusStore";
import NexusActionOverlay from "../nexus/NexusActionOverlay";
import { useChatStore } from "../../store/useChatStore";
import { useAuthStore } from "../../store/useAuthStore";
import { PixelAvatarBadge } from "../avatar/PixelAvatar/PixelAvatarBadge.jsx";
import toast from "../../lib/toast";

// ── Quick-Access Orbital Ring ──────────────────────────────────────────────
const ANIMALS = ['dog', 'cat', 'bunny'];
const animalFor = (id) => ANIMALS[parseInt((id || '').toString().slice(-4) || '0', 16) % ANIMALS.length];

const QuickAccessRing = memo(() => {
  const navigate = useNavigate();
  const { theme } = useThemeStore();
  const nexuses = useNexusStore((s) => s.nexuses);
  const setSelectedNexus = useNexusStore((s) => s.setSelectedNexus);
  const nexusUnread = useNexusStore((s) => s.nexusUnread);
  const users = useChatStore((s) => s.users);
  const contactList = useChatStore((s) => s.contactList);
  const setSelectedUser = useChatStore((s) => s.setSelectedUser);
  const setSelectedNexusStore = useNexusStore((s) => s.setSelectedNexus);
  const onlineUsers = useAuthStore((s) => s.onlineUsers);
  const onlineSet = useMemo(() => new Set(onlineUsers.map((id) => id?.toString())), [onlineUsers]);

  const accentColor = useMemo(() => {
    if (theme === 'gamer-high-energy') return '#00ff66';
    if (theme === 'neon-cyberpunk') return '#b026ff';
    if (theme === 'amoled-dark') return '#00d4ff';
    if (theme === 'light') return '#b08d57';
    if (theme === 'pastel-dream') return '#d060a8';
    return '#7c3aed';
  }, [theme]);

  const contacts = useMemo(() => {
    if (!users.length) return [];
    return users.filter((u) => contactList?.includes((u._id || u.id)?.toString()));
  }, [users, contactList]);

  const handleNexusClick = useCallback((nexus) => {
    setSelectedNexusStore(nexus);
    navigate(`/nexus/${nexus._id || nexus.id}`);
  }, [setSelectedNexusStore, navigate]);

  const handleUserClick = useCallback((user) => {
    setSelectedUser(user);
    setSelectedNexusStore(null);
    navigate(`/chat/${user._id || user.id}`);
  }, [setSelectedUser, setSelectedNexusStore, navigate]);

  const hasItems = nexuses.length > 0 || contacts.length > 0;
  if (!hasItems) return null;

  return (
    <div className="w-full mt-5 mb-1">
      {/* Label */}
      <div className="flex items-center gap-2 mb-3 px-1">
        <div className="h-px flex-1" style={{ background: `${accentColor}40` }} />
        <span className="text-[9px] font-black uppercase tracking-[0.3em] opacity-60"
          style={{ color: 'var(--chat-text)' }}
        >
          Quick Orbit
        </span>
        <div className="h-px flex-1" style={{ background: `${accentColor}40` }} />
      </div>

      {/* Scrollable ring row */}
      <div
        className="flex gap-4 overflow-x-auto pb-2 px-1"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {/* Nexuses */}
        {nexuses.map((nexus) => {
          const nid = (nexus._id || nexus.id)?.toString();
          const unread = nexusUnread[nid] || 0;
          return (
            <button
              key={nid}
              onClick={() => handleNexusClick(nexus)}
              className="flex flex-col items-center gap-1.5 shrink-0 group"
              title={nexus.name}
            >
              {/* Orbital ring wrapper */}
              <div className="relative">
                {/* Animated outer ring */}
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    padding: 2,
                    background: unread > 0
                      ? `conic-gradient(${accentColor}, ${accentColor}80, ${accentColor})`
                      : `conic-gradient(${accentColor}40, transparent 60%, ${accentColor}40)`,
                    borderRadius: '50%',
                    animation: unread > 0 ? 'orbit-spin 2s linear infinite' : 'orbit-spin 8s linear infinite',
                    WebkitMaskImage: 'radial-gradient(transparent 65%, black 66%)',
                    maskImage: 'radial-gradient(transparent 65%, black 66%)',
                  }}
                />
                {/* Avatar */}
                <div
                  className="relative size-14 rounded-full flex items-center justify-center overflow-hidden border-2 transition-transform group-hover:scale-105 group-active:scale-95"
                  style={{
                    borderColor: unread > 0 ? accentColor : `${accentColor}50`,
                    background: 'var(--color-base-200)',
                    boxShadow: unread > 0 ? `0 0 12px ${accentColor}60` : 'none',
                  }}
                >
                  <PixelAvatarBadge
                    type={animalFor(nid)}
                    state="idle"
                    size={48}
                    showDot={false}
                    style={{ imageRendering: 'pixelated', width: '100%', height: '100%' }}
                  />
                  {/* Nexus hash overlay */}
                  <div className="absolute bottom-0 right-0 w-4 h-4 rounded-tl-lg flex items-center justify-center"
                    style={{ background: accentColor }}
                  >
                    <Hash size={9} color="#000" strokeWidth={3} />
                  </div>
                </div>
                {/* Unread badge */}
                <AnimatePresence>
                  {unread > 0 && (
                    <motion.span
                      key="badge"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-[9px] font-black flex items-center justify-center z-10 leading-none"
                      style={{ background: accentColor, color: '#000', boxShadow: `0 0 8px ${accentColor}` }}
                    >
                      {unread > 99 ? '99+' : unread}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
              {/* Name label */}
              <span
                className="text-[9px] font-black uppercase tracking-wider max-w-[56px] truncate text-center"
                style={{ color: 'var(--chat-text)', opacity: 0.75 }}
              >
                {nexus.name}
              </span>
            </button>
          );
        })}

        {/* Separator between nexus and DMs */}
        {nexuses.length > 0 && contacts.length > 0 && (
          <div className="w-px shrink-0 self-stretch my-2 mx-1"
            style={{ background: `${accentColor}25` }}
          />
        )}

        {/* Direct message contacts */}
        {contacts.map((user) => {
          const uid = (user._id || user.id)?.toString();
          const isOnline = onlineSet.has(uid);
          const unread = Number(user.unreadCount) || 0;
          return (
            <button
              key={uid}
              onClick={() => handleUserClick(user)}
              className="flex flex-col items-center gap-1.5 shrink-0 group"
              title={user.username}
            >
              <div className="relative">
                {/* Pulse ring for online */}
                {isOnline && (
                  <div
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: `conic-gradient(#00ff8840, transparent 60%, #00ff8840)`,
                      borderRadius: '50%',
                      animation: 'orbit-spin 6s linear infinite',
                      WebkitMaskImage: 'radial-gradient(transparent 65%, black 66%)',
                      maskImage: 'radial-gradient(transparent 65%, black 66%)',
                    }}
                  />
                )}
                <div
                  className="relative size-14 rounded-full flex items-center justify-center overflow-hidden border-2 transition-transform group-hover:scale-105 group-active:scale-95"
                  style={{
                    borderColor: isOnline ? '#00ff8880' : `${accentColor}30`,
                    background: 'var(--color-base-200)',
                    boxShadow: unread > 0 ? `0 0 12px ${accentColor}60` : 'none',
                  }}
                >
                  <PixelAvatarBadge
                    type={animalFor(uid)}
                    state="idle"
                    size={48}
                    showDot={false}
                    style={{ imageRendering: 'pixelated', width: '100%', height: '100%' }}
                  />
                  {/* Online dot */}
                  {isOnline && (
                    <div className="absolute bottom-0.5 right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-[var(--color-base-100)]" />
                  )}
                </div>
                {/* Unread badge */}
                <AnimatePresence>
                  {unread > 0 && (
                    <motion.span
                      key="badge"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-[9px] font-black flex items-center justify-center z-10 leading-none"
                      style={{ background: accentColor, color: '#000' }}
                    >
                      {unread > 99 ? '99+' : unread}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
              <span
                className="text-[9px] font-black uppercase tracking-wider max-w-[56px] truncate text-center"
                style={{ color: 'var(--chat-text)', opacity: 0.75 }}
              >
                {user.username}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
});
// ───────────────────────────────────────────────────────────────────────────

const themeColorMap = {
  gamer: "#ff2d78",
  pastel: "rgba(255,142,200,0.2)",
  default: "#7c3aed"
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
};

const StarryBackground = memo(() => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
    {[...Array(20)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute rounded-full bg-white"
        style={{
          width: Math.random() * 1.5 + 0.5,
          height: Math.random() * 1.5 + 0.5,
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
        }}
        animate={{ opacity: [0.2, 0.5, 0.2] }}
        transition={{ duration: Math.random() * 3 + 2, repeat: Infinity }}
      />
    ))}
  </div>
));

const VolumeControl = memo(({ activeDeviceId }) => {
  const [volume, setVolume] = useState(70);

  const handleVolume = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const newVol = Math.round(Math.max(0, Math.min(100, (x / rect.width) * 100)));
    setVolume(newVol);
    if (activeDeviceId) {
      spotifyService.setVolume(activeDeviceId, newVol);
    }
  };

  return (
    <div className="flex items-center gap-2 group w-20">
      <Volume2 className="w-3.5 h-3.5 text-[var(--chat-muted)]" />
      <div
        onClick={handleVolume}
        className="flex-1 h-1 bg-[var(--chat-border)] rounded-full cursor-pointer relative"
      >
        <div className="absolute left-0 top-0 h-full bg-[var(--chat-text)] opacity-60 group-hover:bg-[#1DB954] rounded-full transition-all duration-150 group-hover:opacity-100" style={{ width: `${volume}%` }} />
      </div>
    </div>
  );

});

const SpotifyCard = memo(() => {
  const {
    spotifyLinked,
    currentTrack,
    isPlaying,
    activeDevice,
    pausePlayback,
    playTrack,
    skipNext,
    skipPrevious,
    seekTo,
    positionMsAtSync,
    lastSyncTimestamp,
    durationMs,
  } = useSpotifyStore();

  const navigate = useNavigate();
  const [isResetting, setIsResetting] = useState(false);
  const [optimisticAnchor, setOptimisticAnchor] = useState(null);

  const prevTrackIdRef = useRef(null);
  const cardRef = useRef(null);
  const fillRef = useRef(null);
  const glowRef = useRef(null);

  useEffect(() => {
    if (!currentTrack?.id) return;
    if (currentTrack.id !== prevTrackIdRef.current) {
      prevTrackIdRef.current = currentTrack.id;
      setOptimisticAnchor(null);
      setIsResetting(true);
      const t = setTimeout(() => {
        setIsResetting(false);
      }, 300);
      return () => clearTimeout(t);
    }
  }, [currentTrack]);

  useEffect(() => {
    let frameId;
    const tick = () => {
      if (isResetting || !durationMs) {
        if (fillRef.current) fillRef.current.style.width = "0%";
        if (glowRef.current) glowRef.current.style.left = "0%";
        frameId = requestAnimationFrame(tick);
        return;
      }

      let currentPos = 0;
      if (optimisticAnchor) {
        currentPos = optimisticAnchor.pos + (isPlaying ? Date.now() - optimisticAnchor.ts : 0);
      } else if (lastSyncTimestamp) {
        currentPos = positionMsAtSync + (isPlaying ? Date.now() - lastSyncTimestamp : 0);
      } else {
        currentPos = positionMsAtSync;
      }

      currentPos = Math.max(0, Math.min(currentPos, durationMs));
      const p = (currentPos / durationMs) * 100;

      if (fillRef.current) fillRef.current.style.width = `${p}%`;
      if (glowRef.current) glowRef.current.style.left = `calc(${p}% - 10px)`;

      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [isPlaying, isResetting, durationMs, positionMsAtSync, lastSyncTimestamp, optimisticAnchor]);

  const handleCardSeek = (e) => {
    if (!cardRef.current || !durationMs) return;
    if (e.target.closest("button")) return;
    const rect = cardRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const newPos = ratio * durationMs;
    
    setOptimisticAnchor({ pos: newPos, ts: Date.now() });
    setIsResetting(false);
    seekTo(newPos).catch(() => {});
  };

  if (!spotifyLinked) {
    return (
      <motion.div variants={itemVariants} style={{ backfaceVisibility: "hidden", willChange: "transform" }} className="h-full">
        <ThemeCardWrapper themeColorMap={{ gamer: "#00f5d4", pastel: "rgba(136,204,255,0.25)", default: "#1DB954" }} onClick={() => navigate("/spotify")} className="flex flex-col h-full min-h-[160px] p-6 relative justify-between overflow-hidden cursor-pointer group">
          <div className="relative z-10 flex items-center justify-between mb-4">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg transition-transform group-hover:scale-105">
              <Music className="w-6 h-6 text-[var(--bg-primary)]" />
            </div>
            <div className="size-1.5 rounded-full bg-[#1DB954]/50" />
          </div>
          <div>
            <h3 className="text-sm font-black tracking-widest mb-2 uppercase text-[var(--text-primary)]">SPOTIFY SYNC</h3>
            <p className="text-xs text-[var(--text-secondary)] font-medium leading-relaxed">Connect and share your listening experience in real-time</p>
          </div>
          <div className="mt-auto pt-4 flex items-center justify-end">
            <div className="h-px flex-1 bg-[var(--chat-border)]" />
            <Zap className="ml-4 size-3 text-[var(--chat-muted)] transition-transform group-hover:scale-110" />
          </div>
        </ThemeCardWrapper>
      </motion.div>
    );
  }

  if (!currentTrack) {
    return (
      <motion.div variants={itemVariants} style={{ backfaceVisibility: "hidden", willChange: "transform" }} className="h-full">
        <ThemeCardWrapper themeColorMap={{ gamer: "#00f5d4", pastel: "rgba(136,204,255,0.25)", default: "#1DB954" }} onClick={() => navigate("/spotify")} className="flex flex-col items-center justify-center text-center h-full min-h-[160px] cursor-pointer group">
          <Disc className="w-10 h-10 text-[var(--chat-muted)] animate-spin-slow mb-3 transition-colors group-hover:text-[#1DB954]" />
          <p className="text-[10px] font-black uppercase tracking-widest text-[#1DB954] opacity-90 leading-none">Ready to play</p>
          <p className="text-xs text-[var(--chat-muted)] font-bold mt-1">Select music to start sync</p>
        </ThemeCardWrapper>
      </motion.div>
    );
  }

  return (
    <motion.div variants={itemVariants} style={{ backfaceVisibility: "hidden", willChange: "transform", height: "100%" }}>
      <div 
        ref={cardRef} 
        onClick={handleCardSeek} 
        style={{ cursor: "crosshair", height: "100%", position: "relative", overflow: "hidden", borderRadius: "var(--card-radius, 1rem)" }}
        onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.02)"; e.currentTarget.style.transition = "transform 0.2s"; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
      >
        <ThemeCardWrapper themeColorMap={{ gamer: "#00f5d4", pastel: "rgba(136,204,255,0.25)", default: "#1DB954" }} className="flex flex-col h-full min-h-[160px] relative pointer-events-none p-0 overflow-hidden">
          
          <div
            ref={fillRef}
            style={{
              position: "absolute", inset: 0, zIndex: 0,
              background: `linear-gradient(90deg, rgba(29, 185, 84, 0.15) 0%, rgba(29, 185, 84, 0.05) 100%)`,
              width: "0%", transition: isResetting ? "width 0.2s ease-out" : "none",
              pointerEvents: "none",
            }}
          />
          <div
            ref={glowRef}
            style={{
              position: "absolute", top: 0, bottom: 0, zIndex: 1, width: 20,
              left: "0%", background: `radial-gradient(ellipse at center, rgba(29, 185, 84, 0.4) 0%, transparent 100%)`,
              transition: isResetting ? "left 0.2s ease-out" : "none", pointerEvents: "none",
              opacity: isPlaying ? 1 : 0.3, filter: "blur(2px)"
            }}
          />

          <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-600/5 opacity-30 blur-3xl pointer-events-none" />

          {/* Card Content Wrapper (pointer-events-auto for buttons inside) */}
          <div className="relative z-10 flex flex-col h-full p-4 pointer-events-auto" style={{ pointerEvents: "auto" }}>
            <div className="flex items-center justify-between mb-4 pointer-events-none">
              <div className="flex items-center gap-2">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#1DB954] text-[var(--chat-bg)]">
                  <Music className="w-3 h-3 fill-current" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--chat-text)] opacity-90">Spotify Active</span>
              </div>
              <button onClick={(e) => { e.stopPropagation(); navigate("/spotify"); }} className="text-[10px] font-black text-[#1DB954] hover:text-[#1ed760] transition-colors uppercase tracking-tight pointer-events-auto">Expand</button>
            </div>

            <div className="flex gap-4 mb-4 pointer-events-none">
              <div className="h-16 w-16 rounded-xl shadow-xl overflow-hidden flex-shrink-0 border border-[var(--chat-border)]">
                <img loading="lazy" decoding="async" src={currentTrack.imageUrl} alt="" className="h-full w-full object-cover" />
              </div>
              <div className="flex-1 min-w-0 flex flex-col justify-center" style={{ textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}>
                <h4 className="text-sm font-bold text-[var(--chat-text)] truncate leading-tight mb-1">{currentTrack.name}</h4>
                <p className="text-[10px] font-bold text-[var(--chat-muted)] truncate">{currentTrack.artist}</p>
              </div>
            </div>

            {/* Mini Controls */}
            <div className="flex items-center justify-between gap-4 mt-auto">
              <div className="flex items-center gap-3">
                <button onClick={(e) => { e.stopPropagation(); skipPrevious(); }} className="text-[var(--chat-muted)] hover:text-[var(--chat-text)] transition-colors pointer-events-auto">
                  <SkipBack className="w-4 h-4 fill-current" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); isPlaying ? pausePlayback() : playTrack(); }}
                  className="h-8 w-8 rounded-full bg-[var(--chat-text)] text-[var(--color-base-100)] flex items-center justify-center hover:scale-105 active:scale-95 shadow-lg transition-all pointer-events-auto"
                >
                  {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                </button>
                <button onClick={(e) => { e.stopPropagation(); skipNext(); }} className="text-[var(--chat-muted)] hover:text-[var(--chat-text)] transition-colors pointer-events-auto">
                  <SkipForward className="w-4 h-4 fill-current" />
                </button>
              </div>

              <div className="pointer-events-auto">
                <VolumeControl activeDeviceId={activeDevice?.id} />
              </div>
            </div>
          </div>
        </ThemeCardWrapper>
      </div>
    </motion.div>
  );
});


const NoChatSelected = () => {
  const navigate = useNavigate();
  const { theme } = useThemeStore();
  const addContact = useChatStore((s) => s.addContact);
  const users = useChatStore((s) => s.users);
  const contactList = useChatStore((s) => s.contactList);

  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [newContactHandle, setNewContactHandle] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const handleAddContactSubmit = async (e) => {
    e.preventDefault();
    const trimmed = newContactHandle.trim();
    if (!trimmed) {
      toast.error("Please enter a handle");
      return;
    }

    const candidate = users.find(
      (u) => (u.normalizedHandle || "").toLowerCase() === trimmed.toLowerCase() || u.username.toLowerCase() === trimmed.toLowerCase(),
    );

    if (candidate && contactList?.includes(candidate._id.toString())) {
      toast.error("Contact already in list");
      return;
    }

    setIsAdding(true);
    try {
      await addContact(trimmed);
      setNewContactHandle("");
      setShowAddContactModal(false);
    } catch (err) {
      // Handled in store
    } finally {
      setIsAdding(false);
    }
  };

  const infoBoxes = useMemo(() => [
    {
      id: 2,
      icon: Gamepad2,
      title: "Orbit Games",
      description: "Coming soon. A new way to play together.",
      locked: true,
      colors: { gamer: "#ff2bd6", pastel: "rgba(255,142,200,0.2)", default: "#a855f7" }
    },
    {
      id: 3,
      icon: UserPlus,
      title: "Add Contact",
      description: "Connect instantly with a friend by their username or ID",
      action: () => setShowAddContactModal(true),
      colors: { gamer: "#ff7a00", pastel: "rgba(255,204,136,0.3)", default: "#fb923c" }
    },
    {
      id: 4,
      icon: Settings,
      title: "Customize",
      description: "Configure your orbit behavior and preferences",
      action: () => navigate("/settings"),
      colors: { gamer: "#00cfff", pastel: "rgba(136,255,204,0.2)", default: "#0ea5e9" }
    },
  ], [navigate]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const { nexusActionView, setNexusActionView } = useNexusStore();

  const accentColor = useMemo(() => {
    if (theme === 'gamer-high-energy') return '#00ff66';
    if (theme === 'neon-cyberpunk') return '#b026ff';
    if (theme === 'amoled-dark') return '#00d4ff';
    if (theme === 'light') return '#b08d57';
    if (theme === 'pastel-dream') return '#d060a8';
    return '#7c3aed';
  }, [theme]);

  if (theme === "pastel-dream") {
    return (
      <div className="w-full h-full p-0 bg-transparent overflow-auto relative">
        <TruePastelDashboard onAddContact={() => setShowAddContactModal(true)} />
        <AnimatePresence>
          {showAddContactModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowAddContactModal(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-md"
              />

              {/* Modal Body */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-md p-6 rounded-2xl border overflow-hidden shadow-2xl z-10"
                style={{
                  background: "linear-gradient(135deg, #ffdcf3 0%, #fef4f9 100%)",
                  borderColor: "rgba(255, 142, 200, 0.4)",
                  color: "#ff479c",
                  boxShadow: "0 20px 40px rgba(255, 150, 200, 0.2)",
                }}
              >
                {/* Close Button */}
                <button
                  onClick={() => setShowAddContactModal(false)}
                  className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-[var(--chat-text)]/10 transition-colors"
                  style={{ color: "#ff85cc" }}
                >
                  <Plus className="size-5 rotate-45" />
                </button>

                <div className="relative z-10 flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="p-2.5 rounded-xl flex items-center justify-center"
                      style={{
                        background: "rgba(255, 71, 156, 0.1)",
                        color: "#ff479c",
                        border: "1.5px solid rgba(255, 71, 156, 0.3)",
                      }}
                    >
                      <UserPlus className="size-5" />
                    </div>
                    <div>
                      <h2
                        className="text-lg font-black uppercase tracking-wider"
                        style={{
                          fontFamily: "'Nunito', sans-serif",
                        }}
                      >
                        Add Contact 🎀
                      </h2>
                      <p className="text-xs text-[#e8338a] font-medium">
                        Enter orbit handle to expand your pastel orbit!
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleAddContactSubmit} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label
                        className="text-[10px] font-black uppercase tracking-widest text-[#ff85cc]"
                        style={{
                          fontFamily: "'Nunito', sans-serif",
                        }}
                      >
                        ORBIT HANDLE
                      </label>
                      <input
                        autoFocus
                        type="text"
                        placeholder="e.g. sweet_cipher#1000"
                        value={newContactHandle}
                        onChange={(e) => setNewContactHandle(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border outline-none font-bold text-sm transition-all duration-300"
                        style={{
                          background: "#ffffff",
                          borderColor: "rgba(255, 142, 200, 0.4)",
                          color: "#9c27b0",
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = "#ff479c";
                          e.currentTarget.style.boxShadow = "0 0 10px rgba(255, 71, 156, 0.3)";
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = "rgba(255, 142, 200, 0.4)";
                          e.currentTarget.style.boxShadow = "none";
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-end gap-3 mt-2">
                      <button
                        type="button"
                        onClick={() => setShowAddContactModal(false)}
                        className="px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all"
                        style={{
                          color: "#ff85cc",
                          background: "transparent",
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isAdding}
                        className="px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg active:scale-95"
                        style={{
                          background: isAdding ? "rgba(255, 142, 200, 0.2)" : "linear-gradient(135deg, #ff479c, #e860ff)",
                          color: "#ffffff",
                          boxShadow: isAdding ? "none" : "0 4px 15px rgba(255, 71, 156, 0.4)",
                          cursor: isAdding ? "default" : "pointer",
                        }}
                      >
                        {isAdding ? "CONNECTING..." : "ADD CONTACT"}
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // All other themes (gamer, amoled, dark, neon) use the default dashboard content 
  // if no chat is selected. The shell is already provided by the theme loader.

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-transparent overflow-auto relative">
      {theme === "light" ? (
        <>
          <GlowCurve />
          <FloatingDust />
        </>
      ) : (
        <StarryBackground />
      )}

      {nexusActionView ? (
        <div style={{ position: "absolute", inset: 0, zIndex: 10 }}>
          <NexusActionOverlay mode={nexusActionView} onClose={() => setNexusActionView(null)} inline={true} />
        </div>
      ) : (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="w-full max-w-4xl flex flex-col items-center justify-center relative min-h-0"
        >
          <ThemeMainContainer>
            <>
              <motion.div variants={itemVariants} className="text-left w-full">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-0.5 w-12 bg-[var(--text-secondary)]/60 rounded-full" />
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--chat-text)] opacity-90" style={{ textShadow: '0 0 10px rgba(255,255,255,0.5)' }}>Status: Online</span>
                </div>
                <h1 className="text-4xl font-black tracking-tight text-[var(--chat-text)] uppercase leading-none" style={{ textShadow: '0 0 20px rgba(255,255,255,0.6)' }}>Welcome to Orbit</h1>
                <p className="text-[var(--chat-text)] opacity-80 text-xs mt-3 max-w-md font-bold">Choose a pathway to begin your mission.</p>
                {/* ── Quick Orbit Access Ring ── */}
                <QuickAccessRing />
              </motion.div>

              <motion.div variants={containerVariants} className="w-full mt-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full">
                  {theme === "light" ? <ElegantSpotifyCard onClick={() => navigate("/spotify")} /> : <SpotifyCard />}
                  {infoBoxes.map((box) => {
                    const Icon = box.icon;
                    return (
                      <motion.div key={box.id} variants={itemVariants} style={{ backfaceVisibility: "hidden", willChange: "transform" }}>
                        <ThemeCardWrapper 
                          themeColorMap={{ gamer: box.colors.gamer, pastel: box.colors.pastel, default: box.colors.default }}
                          onClick={box.action}
                          className="flex flex-col h-full min-h-[160px] p-6 relative justify-between overflow-hidden cursor-pointer"
                        >
                          <div className="relative z-10 flex items-center justify-between mb-4">
                            <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${theme === "light" ? "bg-[var(--chat-primary)]/10" : "bg-[var(--chat-text)]/10"} shadow-inner relative z-10`}>
                              <Icon className={`size-6 ${theme === "light" ? "text-[color-mix(in srgb,var(--color-base-content) 50%,transparent)]" : "text-[var(--chat-text)] opacity-80"}`} />
                              {/* Inject Screenshot Badge for Notifications */}
                              {theme === "light" && box.id === 3 && (
                                <div className="absolute -top-1.5 -right-1.5 bg-[#8b7355] text-[#f8f6f0] text-[10px] font-bold w-[18px] h-[18px] flex items-center justify-center rounded-full border-2 border-[#f8f6f0] shadow-sm">3</div>
                              )}
                            </div>
                            
                            {/* Decorative Network Graph matching exactly the image for box.id===2 */}
                            {theme === "light" && box.id === 2 && (
                              <svg className="absolute top-1/2 left-10 -translate-y-1/2 w-40 h-20 opacity-60 pointer-events-none z-0" viewBox="0 0 100 60">
                                <path d="M0,30 L20,15 L40,40 L60,10 L80,35 L100,20" fill="none" stroke="var(--chat-primary)" strokeWidth="1" strokeDasharray="3 2" />
                                <circle cx="20" cy="15" r="2.5" fill="none" stroke="var(--chat-primary)" strokeWidth="1" />
                                <circle cx="40" cy="40" r="2.5" fill="var(--chat-primary)" />
                                <circle cx="60" cy="10" r="2.5" fill="none" stroke="var(--chat-primary)" strokeWidth="1" />
                                <circle cx="80" cy="35" r="2.5" fill="var(--chat-primary)" />
                                <circle cx="100" cy="20" r="2.5" fill="none" stroke="var(--chat-primary)" strokeWidth="1" />
                                <path d="M20,15 L40,10 L60,10" fill="none" stroke="var(--chat-primary)" strokeWidth="0.5" />
                                <path d="M40,40 L80,35" fill="none" stroke="var(--chat-primary)" strokeWidth="0.5" />
                              </svg>
                            )}
                          </div>
                          <div>
                            <h3 className="text-sm font-black tracking-widest mb-2 uppercase text-[var(--chat-text)] flex items-center gap-2">
                              {box.title}
                              {box.locked && <Lock className="size-3 text-[var(--chat-muted)]" />}
                            </h3>
                            <p className="text-xs text-[var(--chat-muted)] leading-relaxed font-bold">{box.description}</p>
                          </div>
                          <div className="mt-auto pt-4 flex items-center justify-end">
                            <div className="h-px flex-1 bg-[var(--chat-border)]" />
                            <Zap className="ml-4 size-3 text-[var(--chat-muted)]" />
                          </div>
                        </ThemeCardWrapper>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            </>
          </ThemeMainContainer>
        </motion.div>
      )}

      {/* Elegant Theme-Aware Add Contact Modal */}
      <AnimatePresence>
        {showAddContactModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddContactModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md p-6 rounded-2xl border overflow-hidden shadow-2xl z-10"
              style={
                theme === "light"
                  ? {
                      background: "linear-gradient(135deg, #fcfbf7 0%, #f7f3e8 100%)",
                      borderColor: "rgba(176,141,87,0.3)",
                      color: "#5c4a2a",
                      boxShadow: "0 20px 40px rgba(176,141,87,0.15)",
                    }
                  : {
                      background: "rgba(10, 10, 15, 0.95)",
                      borderColor: `${accentColor}33`,
                      color: "var(--chat-text)",
                      boxShadow: `0 0 30px ${accentColor}15`,
                    }
              }
            >
              {/* Starry highlight overlay for dark theme */}
              {theme !== "light" && <StarryBackground />}

              {/* Close Button */}
              <button
                onClick={() => setShowAddContactModal(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-[var(--chat-text)]/10 transition-colors"
                style={{ color: "var(--chat-muted)" }}
              >
                <Plus className="size-5 rotate-45" />
              </button>

              <div className="relative z-10 flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div
                    className="p-2.5 rounded-xl flex items-center justify-center"
                    style={{
                      background: `${accentColor}15`,
                      color: accentColor,
                      border: `1.5px solid ${accentColor}30`,
                    }}
                  >
                    <UserPlus className="size-5" />
                  </div>
                  <div>
                    <h2
                      className="text-lg font-black uppercase tracking-wider"
                      style={{
                        fontFamily: theme === "light" ? "'Josefin Sans', sans-serif" : "'Orbitron', sans-serif",
                      }}
                    >
                      Add Contact
                    </h2>
                    <p className="text-xs text-[var(--chat-muted)] font-medium">
                      Enter orbit handle to expand your orbit network.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleAddContactSubmit} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label
                      className="text-[10px] font-black uppercase tracking-widest text-[var(--chat-muted)]"
                      style={{
                        fontFamily: theme === "light" ? "'Josefin Sans', sans-serif" : "'Share Tech Mono', sans-serif",
                      }}
                    >
                      ORBIT HANDLE
                    </label>
                    <input
                      autoFocus
                      type="text"
                      placeholder="e.g. cipher_one#1000"
                      value={newContactHandle}
                      onChange={(e) => setNewContactHandle(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border outline-none font-bold text-sm transition-all duration-300"
                      style={
                        theme === "light"
                          ? {
                              background: "#ffffff",
                              borderColor: "rgba(176,141,87,0.3)",
                              color: "#5c4a2a",
                            }
                          : {
                              background: "rgba(0, 0, 0, 0.6)",
                              borderColor: `${accentColor}40`,
                              color: "var(--chat-text)",
                            }
                      }
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = accentColor;
                        e.currentTarget.style.boxShadow = `0 0 10px ${accentColor}30`;
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = theme === "light" ? "rgba(176,141,87,0.3)" : `${accentColor}40`;
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 mt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddContactModal(false)}
                      className="px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all"
                      style={{
                        color: "var(--chat-muted)",
                        background: "transparent",
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isAdding}
                      className="px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg active:scale-95"
                      style={{
                        background: isAdding ? "rgba(var(--chat-muted-rgb), 0.2)" : accentColor,
                        color: theme === "light" ? "#fcfbf7" : "#000",
                        boxShadow: isAdding ? "none" : `0 4px 15px ${accentColor}40`,
                        cursor: isAdding ? "default" : "pointer",
                      }}
                    >
                      {isAdding ? "CONNECTING..." : "ADD CONTACT"}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NoChatSelected;
