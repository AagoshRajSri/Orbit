import React, { useState, useRef, useEffect, useCallback, useMemo, Component } from "react";
import { useNavigate } from "react-router-dom";
import { THEMES, Ico, I, Toast, CallOverlay, VoiceBubble, ImgBubble, FileBubble, InfoPanel, Wave, MediaPanel } from "./ChatCoreUI";
import { useNexusStore } from "../../store/useNexusStore";
import { useChatStore } from "../../store/useChatStore";
import { useAuthStore } from "../../store/useAuthStore";
import { useThemeStore } from "../../store/useThemeStore";
import { getSocket } from "../../lib/socket";
import { soundManager } from "../../lib/SoundManager";
import { PixelAvatarBadge } from "../avatar/PixelAvatar/PixelAvatarBadge.jsx";
import { useAvatarState } from "../avatar/PixelAvatar/useAvatarState.js";
import TelemeteryCapsule from "./TelemeteryCapsule.jsx";
import { OrbitMsgBubble } from "./MsgBubble.jsx";
import { OrbitTypingIndicator } from "./OrbitTypingIndicator.jsx";
import AeroInput from "./AeroInput.jsx";
import { resolveTheme } from "./OrbitChatTheme.js";
import { normalizeId } from "../../lib/idUtils";

// ─── Theme bridge: Orbit theme IDs → NexusChatDesktop theme tokens ───────────
const THEME_BRIDGE = {
  "dark":             "vampire",
  "amoled-dark":      "amoled",
  "neon-cyberpunk":   "cyberpunk",
  "gamer-high-energy":"gamer",
  "pastel-dream":     "barbie",
  "light":            "premium",
};

function throttle(fn, wait) {
  let last = 0;
  return (...args) => {
    const now = Date.now();
    if (now - last >= wait) { last = now; fn(...args); }
  };
}
// Safe date formatter
function formatDate(date) {
  if (!date) return "—";
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return "—";
    return d.toISOString().slice(0, 10);
  } catch (e) {
    return "—";
  }
}

// Safe time formatter
function formatTime(date) {
  if (!date) return "00:00";
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return "00:00";
    return d.toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit", hour12: false });
  } catch (e) {
    return "00:00";
  }
}

// ─── Global animation CSS injected once ──────────────────────────────────────
const ANIM_CSS = `
@keyframes typingBounce{0%,80%,100%{transform:translateY(0);opacity:.35}40%{transform:translateY(-7px);opacity:1}}
@keyframes cyberBlink{0%,100%{opacity:1;background:var(--acc)}50%{opacity:0}}
@keyframes pastelDot{0%,100%{transform:translateY(0) scale(1)}30%{transform:translateY(-8px) scale(1.15)}}
@keyframes recPulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.6;transform:scale(1.15)}}
@keyframes waveBar{0%,100%{height:4px}50%{height:var(--h,20px)}}
@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeUpMsg{from{opacity:0;transform:translateY(12px) scale(0.97)}to{opacity:1;transform:none}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes slideInRight{from{opacity:0;transform:translateX(30px)}to{opacity:1;transform:translateX(0)}}
@keyframes notifSlide{0%{transform:translateY(-60px);opacity:0}15%,85%{transform:translateY(0);opacity:1}100%{transform:translateY(-60px);opacity:0}}
@keyframes popIn{0%{opacity:0;transform:scale(.85) translateY(8px)}70%{transform:scale(1.04) translateY(-2px)}100%{opacity:1;transform:scale(1) translateY(0)}}
@keyframes borderGlow{0%,100%{box-shadow:0 0 5px var(--acc)}50%{box-shadow:0 0 20px var(--acc),0 0 40px var(--acc)}}
@keyframes scan{from{left:-60%}to{left:160%}}
@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
*{box-sizing:border-box}
::-webkit-scrollbar{width:5px;height:5px}
::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar-thumb{border-radius:6px}
::selection{background:var(--sel,rgba(255,255,255,0.2))}
`;

// ─── Loading skeleton ─────────────────────────────────────────────────────────
function MsgSkeleton({ ot }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {[false, true, false, true, false].map((out, i) => (
        <div key={i} style={{ display: "flex", justifyContent: out ? "flex-end" : "flex-start" }}>
          <div style={{
            width: `${140 + (i * 37) % 120}px`, height: 44, 
            borderRadius: ot["--radius"],
            background: out ? ot["--send-bg"] : ot["--recv-bg"],
            border: `1px solid ${ot["--border"]}`,
            opacity: 0.5, animation: "fadeIn 1s ease infinite alternate",
          }} />
        </div>
      ))}
    </div>
  );
}

// ─── Simple Message Error Boundary ──────────────────────────────────────────
class MsgErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error, info) { console.error("Message render error:", error, info); }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ color: "#ff4d4f", fontSize: 11, padding: 8, background: "rgba(255,0,0,0.1)", borderRadius: 6, margin: "4px 0", textAlign: "center" }}>
          [Error rendering message]
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Empty state (no selection) ───────────────────────────────────────────────

function NoSelection({ ot }) {
  return (
    <div style={{
      flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", gap: 20, position: "relative", overflow: "hidden",
      background: ot["--bg"],
    }}>
      <div style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
        <div style={{ fontSize: 64, marginBottom: 16, filter: `drop-shadow(0 0 24px ${ot["--acc"]})` }}>
          {ot.decorator}
        </div>
        <div style={{ color: ot["--text"], fontSize: 22, fontWeight: 800, fontFamily: ot.font, letterSpacing: ".06em", marginBottom: 8 }}>
          Select a conversation
        </div>
        <div style={{ color: ot["--text2"], fontSize: 14, fontFamily: ot.font, lineHeight: 1.6, maxWidth: 280, opacity: 0.8 }}>
          Choose a chat or Nexus from the sidebar to begin your encrypted session.
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
/**
 * UniversalChatContainer
 * @param {("nexus"|"dm")} type
 */
export default function UniversalChatContainer({ type, onMobileBack, onOpenSidebar }) {
  const { theme } = useThemeStore();
  const themeId = THEME_BRIDGE[theme] || "vampire";
  const t       = THEMES[themeId];
  // New orbit-messaging theme tokens for the new chat UI components
  const ot = resolveTheme(theme);
  const navigate = useNavigate();

  const authUser = useAuthStore(s => s.authUser);

  // ── Nexus store ──
  const selectedNexus     = useNexusStore(s => s.selectedNexus);
  const selectedNexusId   = useNexusStore(s => s.selectedNexusId);
  const nexuses           = useNexusStore(s => s.nexuses);
  const nexusMessages     = useNexusStore(s => s.nexusMessages);
  const isNexusLoading    = useNexusStore(s => s.isMessagesLoading);
  const nexusTypingUsers  = useNexusStore(s => s.nexusTypingUsers);
  const sendNexusMessage  = useNexusStore(s => s.sendNexusMessage);
  const getNexusMessages  = useNexusStore(s => s.getNexusMessages);
  const setNexusTyping    = useNexusStore(s => s.setNexusTyping);
  // For InfoPanel wiring
  const setSelectedNexus  = useNexusStore(s => s.setSelectedNexus);
  const deleteNexus        = useNexusStore(s => s.deleteNexus);

  // ── Chat store ──
  const selectedUser      = useChatStore(s => s.selectedUser);
  const setSelectedUser   = useChatStore(s => s.setSelectedUser);
  const messages          = useChatStore(s => s.messages);
  const isChatLoading     = useChatStore(s => s.isMessagesLoading);
  const sendMessage       = useChatStore(s => s.sendMessage);
  const getMessages       = useChatStore(s => s.getMessages);

  const isNexus = type === "nexus";

  // ── Pixel Avatar: deterministic animal from entity id ─────────────────────
  const entityId = isNexus
    ? (selectedNexus?.id || selectedNexus?._id || "").toString()
    : (selectedUser?.id || selectedUser?._id || "").toString();
  const ANIMALS = ['dog', 'cat', 'bunny'];
  const peerAnimal = ANIMALS[parseInt((entityId || "").toString().slice(-4) || '0', 16) % ANIMALS.length];
  const myAnimal   = ANIMALS[parseInt((authUser?._id || authUser?.id || "1").toString().slice(-4) || "0", 16) % ANIMALS.length];

  // ── Avatar state machines ──────────────────────────────────────────────────
  const peerAvatar = useAvatarState('idle', { sleepAfter: 120_000 });
  const myAvatar   = useAvatarState('idle', { sleepAfter: 60_000 });
  // Robust entity lookup: if selectedNexus object is missing but we have an ID, try to find it in the nexuses list.
  const activeNexus = useMemo(() => {
    if (!isNexus) return null;
    if (selectedNexus) return selectedNexus;
    if (selectedNexusId && nexuses.length > 0) {
      const found = nexuses.find(n => (n._id?.toString() === selectedNexusId?.toString()));
      if (found) return found;
    }
    // Fallback: if we only have selectedNexusId, return a stub so it doesn't crash
    if (selectedNexusId) return { _id: selectedNexusId, name: "Loading Nexus...", members: [] };
    return null;
  }, [isNexus, selectedNexus, selectedNexusId, nexuses]);

  const entity = isNexus ? activeNexus : selectedUser;

  // Sync back to store if we found it but it's null there
  useEffect(() => {
    if (isNexus && activeNexus && !selectedNexus) {
      setSelectedNexus(activeNexus);
    }
  }, [isNexus, activeNexus, selectedNexus, setSelectedNexus]);

  // ── Local state ──
  const [input, setInput]               = useState("");
  const [recording, setRecording]       = useState(false);
  const [recSec, setRecSec]             = useState(0);
  const [mediaPanel, setMediaPanel]     = useState(null); // "emoji"|"gif"|"sticker"|null
  const [callType, setCallType]         = useState(null); // "voice"|"video"|null
  const [showInfo, setShowInfo]         = useState(false);
  const [searchOpen, setSearchOpen]     = useState(false);
  const [searchQ, setSearchQ]           = useState("");
  const [toast, setToast]               = useState(null);
  const [pinnedVisible, setPinnedVisible] = useState(true);
  const [pinnedMsgData, setPinnedMsgData] = useState(null);
  const [localNexusGroup, setLocalNexusGroup] = useState(null); // for InfoPanel edits

  const endRef   = useRef(null);
  const inputRef = useRef(null);
  const recRef   = useRef(null);
  const typingTimerRef = useRef(null);
  const styleInjected = useRef(false);

  // ── Inject global animation CSS once ──
  useEffect(() => {
    if (styleInjected.current) return;
    styleInjected.current = true;
    const s = document.createElement("style");
    s.textContent = ANIM_CSS;
    document.head.appendChild(s);
  }, []);

  // ── Load messages when entity changes ──
  useEffect(() => {
    if (isNexus && (activeNexus?.id || activeNexus?._id)) {
      getNexusMessages(activeNexus.id || activeNexus._id);
      // Build local group state for InfoPanel from live nexus data
      setLocalNexusGroup({
        id: activeNexus.id || activeNexus._id,
        name: activeNexus.name,
        description: activeNexus.description || "",
        icon: "🌐",
        privacy: activeNexus.privacy || "private",
        notifications: "all",
        slowMode: 0,
        maxMembers: activeNexus.maxMembers || 50,
        disappearingMessages: 0,
        pinnedMsg: activeNexus.pinnedMessage || "No pinned message",
        roles: ["Owner", "Admin", "Moderator", "Member"],
        members: (Array.isArray(activeNexus.members) ? activeNexus.members : []).map((m, idx) => ({
          id: m._id || idx,
          name: m.username || m.email || "Member",
          role: activeNexus.adminIds?.includes(m._id) ? "Admin" : "Member",
          status: "online",
          muted: false,
          banned: false,
          joined: formatDate(m.createdAt),
        })),
        media: [],
        links: [],
        tags: [activeNexus.joinCode ? `#${activeNexus.joinCode}` : "#nexus"],
        color: t.acc,
        inviteLink: `nexus.app/join/${activeNexus.joinCode || activeNexus.id || activeNexus._id}`,
        createdAt: formatDate(activeNexus.createdAt),
        messageCount: nexusMessages.length,
        voiceActive: false,
      });
      setPinnedVisible(true);
    } else if (!isNexus && (selectedUser?.id || selectedUser?._id)) {
      getMessages(selectedUser.id || selectedUser._id);
    }
  }, [isNexus, activeNexus?.id, activeNexus?._id, selectedUser?.id, selectedUser?._id, getNexusMessages, getMessages, t.acc]);

  // ── Auto scroll ──
  useEffect(() => {
    const container = endRef.current?.parentElement;
    if (!container) return;
    
    // Always scroll to bottom when messages or typing status changes
    // This ensures we always see the latest content as requested.
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [nexusMessages?.length, messages?.length, nexusTypingUsers, selectedUser?.isTyping, authUser?._id, isNexus]);

  // ── Force scroll to bottom on chat switch ──
  useEffect(() => {
    // Force immediate scroll to bottom when switching chats
    const forceScroll = () => {
      endRef.current?.scrollIntoView({ behavior: "auto", block: "end" });
    };
    forceScroll();
    // Also try after a short delay for cases where content is still rendering
    const timer = setTimeout(forceScroll, 50);
    const timer2 = setTimeout(forceScroll, 250);
    return () => { clearTimeout(timer); clearTimeout(timer2); };
  }, [isNexus, activeNexus?.id, activeNexus?._id, selectedUser?.id, selectedUser?._id]);

  // ── Wire peer avatar to incoming messages ─────────────────────────────────
  useEffect(() => {
    const rawMsgs = isNexus ? nexusMessages : messages;
    if (rawMsgs.length > 0) {
      const lastMsg = rawMsgs[rawMsgs.length - 1];
      const senderId = normalizeId(lastMsg.senderId);
      const myId = normalizeId(authUser);
      const isMe = senderId === myId;
      
      if (!isMe) peerAvatar.onMessageReceived();
      else myAvatar.onMessageSent();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nexusMessages?.length, messages?.length]);

  // ── Wire peer avatar to typing events ─────────────────────────────────────
  useEffect(() => {
    const isTypingActive = isNexus
      ? (nexusTypingUsers?.filter(u => u.userId !== (authUser?._id || authUser?.id)?.toString()).length > 0)
      : !!selectedUser?.isTyping;
    if (isTypingActive) peerAvatar.onPeerTyping();
    else peerAvatar.onPeerIdle();
  }, [nexusTypingUsers, selectedUser?.isTyping, isNexus, authUser]);

  // ── Recording timer ──
  useEffect(() => {
    if (recording) {
      recRef.current = setInterval(() => setRecSec(s => s + 1), 1000);
    } else {
      clearInterval(recRef.current);
      setRecSec(0);
    }
    return () => clearInterval(recRef.current);
  }, [recording]);

  // ── SOUND INTEGRATION ──
  const prevMsgCount = useRef(0);
  useEffect(() => {
    const rawMsgs = isNexus ? nexusMessages : messages;
    if (rawMsgs.length > prevMsgCount.current) {
      const lastMsg = rawMsgs[rawMsgs.length - 1];
      const isMe = (lastMsg.senderId?._id || lastMsg.senderId) === authUser?._id;
      if (!isMe && prevMsgCount.current > 0) {
        // Only play if it's a new message and not from me
        soundManager.play("incomingmsg");
      }
    }
    prevMsgCount.current = rawMsgs.length;
  }, [nexusMessages, messages, isNexus, authUser]);

  // ── Toast helper ──
  const addToast = useCallback((msg) => {
    setToast(null);
    setTimeout(() => setToast(msg), 10);
  }, []);

  // ── Throttled typing emit ──
  const emitTyping = useMemo(() => throttle((isTyping) => {
    const socket = getSocket();
    if (!socket) return;
    if (isNexus && (selectedNexus?.id || selectedNexus?._id)) {
      socket.emit("nexusTyping", {
        nexusId: selectedNexus.id || selectedNexus._id,
        isTyping,
        username: authUser?.username,
        userId: authUser?._id,
      });
    } else if (!isNexus && (selectedUser?.id || selectedUser?._id)) {
      socket.emit("userTyping", { to: selectedUser.id || selectedUser._id, isTyping });
    }
  }, 500), [isNexus, selectedNexus?._id, selectedUser?._id, authUser]);

  const handleInputChange = (e) => {
    setInput(e.target.value);
    emitTyping(true);
    myAvatar.onTyping();
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => emitTyping(false), 2000);
  };

  // ── Send ──
  const sendMsg = useCallback(async (text) => {
    if (!text.trim()) return;
    emitTyping(false);
    clearTimeout(typingTimerRef.current);
    myAvatar.onMessageSent();
    try {
      if (isNexus) {
        if (!(selectedNexus?.id || selectedNexus?._id)) return;
        await sendNexusMessage(selectedNexus.id || selectedNexus._id, { text });
      } else {
        if (!(selectedUser?.id || selectedUser?._id)) return;
        await sendMessage(selectedUser.id || selectedUser._id, text, null);
      }
      setInput("");
      setMediaPanel(null);
    } catch {
      addToast("Failed to send message");
    }
  }, [isNexus, selectedNexus, selectedUser, sendNexusMessage, sendMessage, emitTyping, addToast, myAvatar]);

  // ── Reaction handler (local optimistic) ──
  const [localReactions, setLocalReactions] = useState({});
  const handleReact = useCallback((msgId, emoji) => {
    setLocalReactions(prev => ({
      ...prev,
      [msgId]: { ...(prev[msgId] || {}), [emoji]: ((prev[msgId]?.[emoji]) || 0) + 1 },
    }));
  }, []);

  // ── Normalise messages for renderer ──
  const rawMsgs = isNexus ? nexusMessages : messages;
  const isLoading = isNexus ? isNexusLoading : isChatLoading;

  const formattedMsgs = useMemo(() => {
    return (rawMsgs || []).map(m => {
      const meIdStr = authUser?._id?.toString();
      const sIdStr  = (m.senderId?._id || m.senderId?.id || m.senderId)?.toString();
      const isMe = sIdStr === meIdStr;
      return {
        id:        m.id || m._id,
        from:      isMe ? "You" : (m.senderId?.username || m.senderId?.fullName || "Member"),
        text:      m.text || null,
        image:     m.image || null,
        uid:       sIdStr,
        out:       isMe,
        time:      formatTime(m.createdAt),
        reactions: localReactions[m.id || m._id] || {},
        status:    m.status || "sent",
        isSystem:  m.isSystem,
      };
    });
  }, [rawMsgs, authUser, localReactions]);

  const filtered = searchQ
    ? formattedMsgs.filter(m => (m.text || "").toLowerCase().includes(searchQ.toLowerCase()))
    : formattedMsgs;

  // Is the other side typing?
  const isTypingActive = isNexus
    ? (nexusTypingUsers?.filter(u => u.userId !== authUser?._id?.toString()).length > 0)
    : !!selectedUser?.isTyping;

  const entityName = isNexus ? (activeNexus?.name || "Nexus") : (selectedUser?.username || selectedUser?.fullName || "User");
  const entitySub  = isNexus
    ? `${activeNexus?.members?.length || 0} members`
    : (selectedUser?.isTyping ? "typing…" : "Online");

  const fmt = s => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  const gridBg = `repeating-linear-gradient(${t.grid} 0,${t.grid} 1px,transparent 1px,transparent 32px),repeating-linear-gradient(90deg,${t.grid} 0,${t.grid} 1px,transparent 1px,transparent 32px)`;

  // CSS vars for selection / accent
  const cssVars = { "--sel": t.selection, "--acc": t.acc };

  if (!entity) return (
    <div style={{ flex: 1, display: "flex", height: "100%", background: ot["--bg"], ...cssVars }}>
      <NoSelection ot={ot} />
    </div>
  );

  // ── InfoPanel group updater ──
  const handleInfoUpdate = async (field, val) => {
    setLocalNexusGroup(g => ({ ...g, [field]: val }));
    if (isNexus && (selectedNexus?.id || selectedNexus?._id)) {
      try {
        await useNexusStore.getState().updateNexus(selectedNexus.id || selectedNexus._id, { [field]: val });
        addToast(`${field} updated`);
      } catch {
        addToast("Update failed");
      }
    }
  };

  const handleLeaveNexus = async () => {
    if (!isNexus || !(selectedNexus?.id || selectedNexus?._id)) return;
    try {
      await useNexusStore.getState().leaveNexus(selectedNexus.id || selectedNexus._id);
      addToast("Left Nexus successfully");
      navigate("/");
    } catch {
      addToast("Failed to leave Nexus");
    }
  };

  const handleDeleteNexus = async () => {
    if (!isNexus || !(selectedNexus?.id || selectedNexus?._id)) return;
    try {
      await deleteNexus(selectedNexus.id || selectedNexus._id);
      addToast("Nexus deleted permanently");
      navigate("/");
    } catch {
      addToast("Failed to delete Nexus");
    }
  };

  return (
    <div
      style={{ flex: 1, display: "flex", flexDirection: "column", height: "100%", minHeight: 0, width: "100%", position: "relative", overflow: "hidden", background: ot["--bg"], ...cssVars }}
    >
      {/* ── Cyber scanlines overlay ── */}
      {ot.scanlines && (
        <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 998,
          background: "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,255,157,0.012) 2px,rgba(0,255,157,0.012) 4px)" }} />
      )}

      {/* ── NEW TelemeteryCapsule header — fully self-contained ── */}
      <TelemeteryCapsule
        t={ot}
        entityName={entityName}
        entitySub={entitySub}
        isNexus={isNexus}
        isOnline={true}
        joinCode={isNexus ? (activeNexus?.joinCode || null) : null}
        peerAnimal={peerAnimal}
        peerAvatarState={peerAvatar.state}
        onBack={() => { if (onMobileBack) onMobileBack(); else { if (isNexus) setSelectedNexus(null); else setSelectedUser(null); navigate("/"); } }}
        onSearch={() => { setSearchOpen(x => !x); setSearchQ(""); }}
        onCall={() => setCallType("voice")}
        onInfoToggle={() => setShowInfo(x => !x)}
        onMobileMenuToggle={onOpenSidebar ? () => onOpenSidebar(isNexus ? "nexus" : "contacts") : null}
        searchActive={searchOpen}
      />

      {/* ── SEARCH BAR ── */}
      {searchOpen && (
        <div style={{ background: t.header, borderBottom: `1px solid ${t.border}`, padding: "8px 20px", display: "flex", gap: 10, alignItems: "center", animation: "fadeUp .15s ease", flexShrink: 0, zIndex: 9 }}>
          <Ico d={I.search} size={16} stroke={t.txt2} />
          <input
            value={searchQ} onChange={e => setSearchQ(e.target.value)} autoFocus
            placeholder="Search in conversation…"
            style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: t.txt, fontSize: 14, fontFamily: t.font }}
          />
          {searchQ && (
            <button onClick={() => setSearchQ("")} style={{ background: "none", border: "none", color: t.txt2, cursor: "pointer", display: "flex" }}>
              <Ico d={I.x} size={14} stroke={t.txt2} />
            </button>
          )}
          <span style={{ color: t.txt2, fontSize: 12, fontFamily: t.font, whiteSpace: "nowrap" }}>
            {searchQ ? `${filtered.length} result${filtered.length !== 1 ? "s" : ""}` : ""}
          </span>
        </div>
      )}

      {/* ── PINNED BANNER (Nexus description / pinned msg) ── */}
      {pinnedVisible && (
        <div 
          style={{ background: t.tag, borderBottom: `1px solid ${t.border}`, padding: "7px 20px", display: "flex", alignItems: "center", gap: 10, flexShrink: 0, cursor: pinnedMsgData ? "pointer" : "default" }}
          onClick={() => {
            if (pinnedMsgData) {
              const el = document.getElementById(`msg-${pinnedMsgData.id || pinnedMsgData._id}`);
              if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
            }
          }}
        >
          <Ico d={I.pin} size={14} stroke={t.acc} />
          <div style={{ flex: 1, overflow: "hidden" }}>
            <div style={{ color: t.txt2, fontSize: 10, fontFamily: t.font, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 1 }}>
              {pinnedMsgData ? "Pinned Message" : (isNexus ? "Pinned" : "Encrypted · End-to-End")}
            </div>
            <div style={{ color: t.txt, fontSize: 12, fontFamily: t.font, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", opacity: .9 }}>
              {pinnedMsgData 
                ? pinnedMsgData.text 
                : (isNexus
                  ? (localNexusGroup?.pinnedMsg || selectedNexus?.description || "No pinned message")
                  : "Messages are secured with end-to-end encryption.")}
            </div>
          </div>
          <button onClick={(e) => { e.stopPropagation(); setPinnedVisible(false); }} style={{ background: "none", border: "none", color: t.txt2, cursor: "pointer", display: "flex", padding: 4 }}>
            <Ico d={I.x} size={14} stroke={t.txt2} />
          </button>
        </div>
      )}

      {/* ── FULL-AREA INFO PANEL ── replaces message+input when open ── */}
      {showInfo && isNexus && localNexusGroup && (
        <div style={{ flex: 1, minHeight: 0, overflow: "hidden", display: "flex", flexDirection: "column", animation: "fadeIn .2s ease" }}>
          <InfoPanel
            t={t}
            group={localNexusGroup}
            setGroup={setLocalNexusGroup}
            onClose={() => setShowInfo(false)}
            addToast={addToast}
            onUpdate={handleInfoUpdate}
            onLeave={handleLeaveNexus}
            onDelete={handleDeleteNexus}
            fullArea
          />
        </div>
      )}

      {/* ── MESSAGE AREA ── hidden when info panel is open ── */}
      <div style={{
        flex: 1, overflowY: "auto", padding: "20px 20px 10px",
        background: ot["--bg"],
        scrollbarWidth: "thin", scrollbarColor: `${ot["--border"]} transparent`,
        position: "relative", display: showInfo && isNexus ? "none" : "flex", flexDirection: "column", gap: 10,
      }}>

        {/* Date divider */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "6px 0", fontSize: 10, color: ot["--text2"], opacity: 0.55, fontWeight: 700, letterSpacing: "1.5px" }}>
          <div style={{ flex: 1, height: 1, background: ot["--border"] }} />
          <span style={{ fontFamily: ot.fontMono, whiteSpace: "nowrap", textTransform: "uppercase" }}>
            {isNexus ? "Nexus Thread" : "Direct Line"} · {new Date().toLocaleDateString("en", { month: "short", day: "numeric" })}
          </span>
          <div style={{ flex: 1, height: 1, background: ot["--border"] }} />
        </div>

        {/* Loading state */}
        {isLoading && <MsgSkeleton ot={ot} />}

        {/* Empty state */}
        {!isLoading && filtered.length === 0 && !searchQ && (
          <div style={{ textAlign: "center", padding: "48px 0" }}>
            <div style={{ fontSize: 40, marginBottom: 12, opacity: .6 }}>{ot.decorator}</div>
            <div style={{ color: ot["--text2"], fontSize: 14, fontFamily: ot.font, lineHeight: 1.6 }}>
              No messages yet. Say something {ot.decorator}
            </div>
          </div>
        )}

        {/* Messages */}
        {!isLoading && filtered.map(m => {
          const mKey = m._id || m.id || m.idempotencyKey;
          if (m.text === "__voice__") return <MsgErrorBoundary key={mKey}><VoiceBubble t={t} out={m.out} /></MsgErrorBoundary>;
          if (m.text === "__img__")   return <MsgErrorBoundary key={mKey}><ImgBubble   t={t} out={m.out} /></MsgErrorBoundary>;
          if (m.text === "__file__")  return <MsgErrorBoundary key={mKey}><FileBubble  t={t} out={m.out} /></MsgErrorBoundary>;

          // Real image message
          if (m.image && !m.text) {
            return (
              <MsgErrorBoundary key={mKey}>
                <div style={{ display: "flex", justifyContent: m.out ? "flex-end" : "flex-start", marginBottom: 14, animation: "fadeUp .28s ease", position: "relative", zIndex: 1 }}>
                  <div style={{ background: m.out ? t.msgOut : t.msgIn, border: `1px solid ${m.out ? t.msgOutBrd : t.border}`, borderRadius: 18, [`borderBottom${m.out ? "Right" : "Left"}Radius`]: 3, padding: 4, overflow: "hidden", maxWidth: 280 }}>
                    <img src={m.image} alt="Shared media" style={{ width: 272, height: "auto", borderRadius: 14, objectFit: "cover", display: "block" }} />
                    <div style={{ padding: "4px 8px", fontSize: 11, color: t.txt2, fontFamily: t.font }}>{m.time}</div>
                  </div>
                </div>
              </MsgErrorBoundary>
            );
          }

          if (m.isSystem) {
            return (
              <MsgErrorBoundary key={mKey}>
                <div style={{ display: "flex", justifyContent: "center", margin: "16px 0", position: "relative", zIndex: 1, width: "100%" }}>
                  <div style={{
                    padding: "6px 16px",
                    background: `linear-gradient(135deg, ${t.msgIn}, transparent)`,
                    border: `1px solid ${t.border}`,
                    borderRadius: 16,
                    color: t.txt2,
                    fontFamily: t.font,
                    fontSize: 12,
                    fontStyle: "italic",
                    textAlign: "center",
                    opacity: 0.8,
                    boxShadow: `0 4px 12px ${t.glow}`
                  }}>
                    {m.text}
                    <span style={{ opacity: 0.5, marginLeft: 8, fontSize: 10 }}>{m.time}</span>
                  </div>
                </div>
              </MsgErrorBoundary>
            );
          }

          // Text + optional image — using new OrbitMsgBubble
          const isLatest = mKey === (filtered[filtered.length - 1]?._id || filtered[filtered.length - 1]?.id);
          const rowAvatarType = m.out ? myAnimal : peerAnimal;
          const rowAvatarState = isLatest ? (m.out ? myAvatar.state : peerAvatar.state) : "idle";

          return (
            <MsgErrorBoundary key={mKey}>
              <OrbitMsgBubble
                msg={m}
                t={ot}
                avatarAnimal={rowAvatarType}
                avatarState={rowAvatarState}
                onReact={handleReact}
                onPin={(msg) => { setPinnedMsgData(msg); setPinnedVisible(true); addToast("Message pinned to top"); }}
              />
            </MsgErrorBoundary>
          );
        })}

        {/* Typing indicator — new OrbitTypingIndicator */}
        {isTypingActive && (
          <OrbitTypingIndicator
            t={ot}
            peerAnimal={peerAnimal}
            peerAvatarState={peerAvatar.state}
            typingUsers={isNexus
              ? (Array.isArray(nexusTypingUsers) ? nexusTypingUsers : []).filter(u => u.userId !== authUser?._id?.toString()).map(u => u.username)
              : [selectedUser?.username || "user"]}
          />
        )}

        <div ref={endRef} />
      </div>

      {/* ── NEW AeroInput — hidden when info panel is open ── */}
      {!(showInfo && isNexus) && <div style={{ position: "relative", zIndex: 100 }}>
        {/* Media/Emoji panel */}
        {mediaPanel && (
          <div style={{ position: "absolute", bottom: "100%", left: 0, right: 0, zIndex: 101, marginBottom: 10 }}>
            <MediaPanel
              t={t} mode={mediaPanel}
              onClose={() => setMediaPanel(null)}
              onSelectEmoji={e => { setInput(v => v + e); inputRef.current?.focus(); setMediaPanel(null); }}
            />
          </div>
        )}

        {/* Recording bar overlay */}
        {recording && (
          <div style={{
            position: "absolute", bottom: "100%", left: 20, right: 20, zIndex: 101, marginBottom: 10,
            padding: "10px 20px", background: ot["--bg2"], border: `1px solid ${ot["--border"]}`,
            borderRadius: ot["--radius"], display: "flex", alignItems: "center", gap: 14,
            boxShadow: ot["--shadow"], animation: "fadeUp .3s ease"
          }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ff3131", animation: "recPulse 1s ease-in-out infinite", flexShrink: 0 }} />
            <Wave color={ot["--acc"]} active bars={36} h={32} />
            <span style={{ color: ot["--text"], fontSize: 14, fontFamily: ot.font, minWidth: 40, fontVariantNumeric: "tabular-nums" }}>{fmt(recSec)}</span>
            <span style={{ color: ot["--text2"], fontSize: 12, fontFamily: ot.font, marginLeft: "auto" }}>Recording...</span>
          </div>
        )}

        <AeroInput
          t={ot}
          value={input}
          onChange={setInput}
          onSend={() => { sendMsg(input); setInput(""); }}
          onTyping={() => { emitTyping(true); myAvatar.onTyping(); clearTimeout(typingTimerRef.current); typingTimerRef.current = setTimeout(() => emitTyping(false), 2000); }}
          onMediaToggle={(mode) => setMediaPanel(m => m === mode ? null : mode)}
          onVoiceToggle={() => setRecording(!recording)}
          isRecording={recording}
          selfAnimal={myAnimal}
          selfAvatarState={myAvatar.state}
          disabled={false}
        />
      </div>}



      {/* Info panel is now rendered above as full-area, not as absolute overlay */}

      {/* ── CALL OVERLAY ── */}
      {callType && <CallOverlay t={t} type={callType} onEnd={() => setCallType(null)} />}

      {/* ── TOAST ── */}
      {toast && <Toast key={toast + Date.now()} t={t} msg={toast} onDone={() => setToast(null)} />}
    </div>
  );
}
