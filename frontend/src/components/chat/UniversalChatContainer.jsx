import React, { useState, useRef, useEffect, useCallback, useMemo, Component } from "react";
import { useNavigate } from "react-router-dom";
import { Virtuoso } from "react-virtuoso";
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
import { OrbitMsgBubble, SafeImage } from "./MsgBubble.jsx";
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

// FIX 5: ANIM_CSS removed — all keyframes now live in src/styles/animations.css
// imported once in main.jsx; zero per-mount style recalculations.

const SKELETON_LAYOUT = [false, true, false, true, false];

// ─── Loading skeleton ─────────────────────────────────────────────────────────
function MsgSkeleton({ ot }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {SKELETON_LAYOUT.map((out, i) => (
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
  // FIX 3: Atomic selector
  const theme = useThemeStore((state) => state.theme);
  const themeId = THEME_BRIDGE[theme] || "vampire";
  const t       = THEMES[themeId];
  // New orbit-messaging theme tokens for the new chat UI components
  const ot = useMemo(() => resolveTheme(theme), [theme]);
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
  const entityId = useMemo(() => isNexus
    ? (selectedNexus?.id || selectedNexus?._id || "").toString()
    : (selectedUser?.id || selectedUser?._id || "").toString(), [isNexus, selectedNexus, selectedUser]);
  
  const ANIMALS = useMemo(() => ['dog', 'cat', 'bunny'], []);
  const peerAnimal = useMemo(() => ANIMALS[parseInt((entityId || "").toString().slice(-4) || '0', 16) % ANIMALS.length], [entityId, ANIMALS]);
  const myAnimal   = useMemo(() => ANIMALS[parseInt((authUser?._id || authUser?.id || "1").toString().slice(-4) || "0", 16) % ANIMALS.length], [authUser, ANIMALS]);

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
    // Fallback: if we only have selectedNexusId, return null so we don't trigger infinite loops with new object references
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
  const [seenPinnedEntities, setSeenPinnedEntities] = useState(new Set());

  const endRef   = useRef(null);
  const inputRef = useRef(null);
  const recRef   = useRef(null);
  const typingTimerRef = useRef(null);
  const styleInjected = useRef(false);

  // ── Secure Tether (Phase 3/4) states ──
  const [pqAvailable, setPqAvailable] = useState(false);
  const [lastAction, setLastAction] = useState(null);
  const tetherMsgCount = useRef(0);

  const isTypingActive = useMemo(() => {
    return isNexus
      ? (nexusTypingUsers?.filter(u => u.userId !== (authUser?._id || authUser?.id)?.toString()).length > 0)
      : !!selectedUser?.isTyping;
  }, [isNexus, nexusTypingUsers, authUser, selectedUser]);

  useEffect(() => {
    import("../../lib/hybridKem.js").then(mod => {
      if (mod.isPostQuantumAvailable) mod.isPostQuantumAvailable().then(setPqAvailable);
    }).catch(() => {});
  }, []);

  // FIX 5: CSS injection removed — animations loaded via animations.css in main.jsx

  // ── Load messages when entity changes ──
  useEffect(() => {
    if (isNexus && (activeNexus?.id || activeNexus?._id)) {
      getNexusMessages(activeNexus.id || activeNexus._id);
      // Only show pinned banner if never seen before for this entity
      const eid = (activeNexus.id || activeNexus._id).toString();
      if (!seenPinnedEntities.has(eid)) {
        setPinnedVisible(true);
        setSeenPinnedEntities(prev => new Set(prev).add(eid));
      } else {
        setPinnedVisible(false);
      }
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
    } else if (!isNexus && (selectedUser?.id || selectedUser?._id)) {
      getMessages(selectedUser.id || selectedUser._id);
      const eid = (selectedUser.id || selectedUser._id).toString();
      if (!seenPinnedEntities.has(eid)) {
        setPinnedVisible(true);
        setSeenPinnedEntities(prev => new Set(prev).add(eid));
      } else {
        setPinnedVisible(false);
      }
    }
  }, [isNexus, activeNexus?.id, activeNexus?._id, selectedUser?.id, selectedUser?._id, getNexusMessages, getMessages, t.acc]);

  // FIX 16: Use last-message-id instead of messages.length — prevents spurious re-renders
  // when the array reference changes but the last message stays the same.
  const lastMsgId = useMemo(() => {
    const arr = isNexus ? nexusMessages : messages;
    return arr.at(-1)?._id ?? arr.at(-1)?.id ?? null;
  }, [isNexus, nexusMessages, messages]);

  // FIX 1: Virtuoso ref for programmatic scroll
  const virtuosoRef = useRef(null);

  const scrollToBottom = useCallback((behavior = "smooth") => {
    if (virtuosoRef.current) {
      virtuosoRef.current.scrollToIndex({ index: "LAST", behavior });
    } else {
      endRef.current?.scrollIntoView({ behavior, block: "end" });
    }
  }, []);

  // FIX 16: Use lastMsgId (stable derived id) to trigger scroll — not messages.length
  useEffect(() => {
    scrollToBottom("smooth");
  }, [lastMsgId, isTypingActive, scrollToBottom]);

  useEffect(() => {
    scrollToBottom("auto");
  }, [activeNexus?.id, selectedUser?.id, scrollToBottom]);

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
    if (isTypingActive) peerAvatar.onPeerTyping();
    else peerAvatar.onPeerIdle();
  }, [isTypingActive, peerAvatar]);

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
  const sendMsg = useCallback(async (text, image = null) => {
    if (!text?.trim() && !image) return;
    emitTyping(false);
    clearTimeout(typingTimerRef.current);
    myAvatar.onMessageSent();
    try {
      if (isNexus) {
        if (!(selectedNexus?.id || selectedNexus?._id)) return;
        await sendNexusMessage(selectedNexus.id || selectedNexus._id, { text, image });
      } else {
        if (!(selectedUser?.id || selectedUser?._id)) return;
        await sendMessage(selectedUser.id || selectedUser._id, text, image);
      }
      setInput("");
      setMediaPanel(null);
    } catch {
      addToast("Failed to send message");
    }
  }, [isNexus, selectedNexus, selectedUser, sendNexusMessage, sendMessage, emitTyping, addToast, myAvatar]);

  // ── Universal File Attachment (E2EE) ──
  const handleAttach = useCallback(async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "*/*"; // Support files, images, documents, videos
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      if (file.size > 5 * 1024 * 1024) {
        addToast("Image too large (max 5MB)");
        return;
      }

      try {
        // Pass File (Blob) directly instead of blobUrl string to allow SafeImage to manage lifecycle
        await sendMsg("", file);
      } catch (err) {
        console.error("Media upload failed:", err);
        addToast("Media upload failed");
      }
    };
    input.click();
  }, [sendMsg, addToast]);

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

  const filtered = useMemo(() => {
    const arr = rawMsgs || [];
    if (!searchQ) return arr;
    const q = searchQ.toLowerCase();
    return arr.filter(m => (m.text || "").toLowerCase().includes(q));
  }, [rawMsgs, searchQ]);



  // Watch messages for tether pulses & Ratchet events
  useEffect(() => {
    if (!filtered || isNexus) return;
    if (filtered.length > tetherMsgCount.current) {
      const lastMsg = filtered[filtered.length - 1];
      const sIdStr = (lastMsg.senderId?._id || lastMsg.senderId?.id || lastMsg.senderId)?.toString();
      const out = sIdStr === authUser?._id?.toString();
      const isRatchet = lastMsg.v === 3 && !out; 
      
      setLastAction({ 
        type: isRatchet ? 'ratchet' : (out ? 'sent' : 'received'), 
        ts: Date.now() 
      });
    }
    tetherMsgCount.current = filtered.length;
  }, [filtered, isNexus]);



  const entityName = isNexus ? (activeNexus?.name || "Nexus") : (selectedUser?.username || selectedUser?.fullName || "User");
  const entitySub  = isNexus
    ? `${activeNexus?.members?.length || 0} members`
    : (selectedUser?.isTyping ? "typing…" : "Online");

  const fmt = s => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  const gridBg = `repeating-linear-gradient(${t.grid} 0,${t.grid} 1px,transparent 1px,transparent 32px),repeating-linear-gradient(90deg,${t.grid} 0,${t.grid} 1px,transparent 1px,transparent 32px)`;

  // CSS vars for selection / accent
  const cssVars = { "--sel": t.selection, "--acc": t.acc };

  const renderItemContent = useCallback((index, m) => {
    const mKey = m._id || m.id || m.idempotencyKey;
    const sIdStr = (m.senderId?._id || m.senderId?.id || m.senderId)?.toString();
    const out = sIdStr === authUser?._id?.toString();
    const isLatest = index === filtered.length - 1;
    const rowAvatarType = out ? myAnimal : peerAnimal;
    const rowAvatarState = isLatest ? (out ? myAvatar.state : peerAvatar.state) : "idle";

    if (m.text === "__voice__") return <VoiceBubble key={mKey} t={t} out={m.out} />;
    if (m.text === "__img__")   return <ImgBubble   key={mKey} t={t} out={m.out} />;
    if (m.text === "__file__")  return <FileBubble  key={mKey} t={t} out={m.out} />;

    return (
      <MsgErrorBoundary key={mKey}>
        <OrbitMsgBubble
          msg={m}
          rawOut={out}
          isLatest={isLatest}
          authUser={authUser}
          localReactions={localReactions[mKey] || {}}
          t={ot}
          avatarAnimal={rowAvatarType}
          avatarState={rowAvatarState}
          onReact={handleReact}
          onPin={(msg) => { setPinnedMsgData(msg); setPinnedVisible(true); addToast("Message pinned"); }}
        />
      </MsgErrorBoundary>
    );
  }, [filtered.length, authUser, myAnimal, peerAnimal, myAvatar.state, peerAvatar.state, t, ot, handleReact, localReactions, addToast]);

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


  const chatContent = (
    <>
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

      {/* ── PINNED BANNER ── */}
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
              {pinnedMsgData ? pinnedMsgData.text : (isNexus ? (localNexusGroup?.pinnedMsg || selectedNexus?.description || "No pinned message") : "Messages are secured.")}
            </div>
          </div>
          <button onClick={(e) => { e.stopPropagation(); setPinnedVisible(false); }} style={{ background: "none", border: "none", color: t.txt2, cursor: "pointer", display: "flex", padding: 4 }}>
            <Ico d={I.x} size={14} stroke={t.txt2} />
          </button>
        </div>
      )}

      {/* ── MESSAGE AREA — virtualized ── */}
      <div style={{
        flex: 1,
        position: "relative",
        display: showInfo && isNexus ? "none" : "flex",
        flexDirection: "column",
        minHeight: 0,
        zIndex: 1,
      }}>
        {/* Date divider */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 20px", fontSize: 10, color: ot["--text2"], opacity: 0.55, fontWeight: 700, letterSpacing: "1.5px", flexShrink: 0 }}>
          <div style={{ flex: 1, height: 1, background: ot["--border"] }} />
          <span style={{ fontFamily: ot.fontMono, whiteSpace: "nowrap", textTransform: "uppercase" }}>
            {isNexus ? "Nexus Thread" : "Direct Line"} · {new Date().toLocaleDateString("en", { month: "short", day: "numeric" })}
          </span>
          <div style={{ flex: 1, height: 1, background: ot["--border"] }} />
        </div>

        {/* Loading skeleton */}
        {isLoading && <MsgSkeleton ot={ot} />}

        {/* Virtuoso message list — only ~25-35 DOM nodes regardless of message count */}
        {!isLoading && (
          <Virtuoso
            ref={virtuosoRef}
            style={{ flex: 1, padding: isNexus ? "0 20px 10px" : "0 20px 10px", overflowX: "hidden" }}
            data={filtered}
            followOutput="smooth"
            increaseViewportBy={250}
            initialTopMostItemIndex={filtered.length > 0 ? filtered.length - 1 : 0}
            alignToBottom
            itemContent={renderItemContent}
            components={{
              Footer: () => (
                <>
                  {isTypingActive && (
                    <div style={{ padding: "0 0 10px" }}>
                      <OrbitTypingIndicator
                        t={ot}
                        peerAnimal={peerAnimal}
                        peerAvatarState={peerAvatar.state}
                        typingUsers={isNexus
                          ? (Array.isArray(nexusTypingUsers) ? nexusTypingUsers : []).filter(u => u.userId !== authUser?._id?.toString()).map(u => u.username)
                          : [selectedUser?.username || "user"]}
                      />
                    </div>
                  )}
                  <div ref={endRef} />
                </>
              )
            }}
          />
        )}
      </div>

      {/* ── INPUT AREA ── */}
      {!(showInfo && isNexus) && (
        <div style={{ position: "relative", zIndex: 100, display: "flex", flexDirection: "column" }}>
          {mediaPanel && (
            <div style={{
              position: "absolute",
              bottom: "calc(100% + 8px)",
              right: typeof window !== "undefined" && window.innerWidth < 640 ? 0 : 16,
              left: typeof window !== "undefined" && window.innerWidth < 640 ? 0 : "auto",
              zIndex: 200,
            }}>
              <MediaPanel t={ot} mode={mediaPanel} onClose={() => setMediaPanel(null)} onSelectEmoji={e => { setInput(v => v + e); inputRef.current?.focus(); }} />
            </div>
          )}
          {recording && (
            <div style={{ position: "absolute", bottom: "100%", left: 20, right: 20, zIndex: 101, marginBottom: 10, padding: "10px 20px", background: ot["--bg2"], border: `1px solid ${ot["--border"]}`, borderRadius: ot["--radius"], display: "flex", alignItems: "center", gap: 14, boxShadow: ot["--shadow"], animation: "fadeUp .3s ease" }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ff3131", animation: "recPulse 1s ease-in-out infinite", flexShrink: 0 }} />
              <Wave color={ot["--acc"]} active bars={36} h={32} />
              <span style={{ color: ot["--text"], fontSize: 14, fontFamily: ot.font, minWidth: 40, fontVariantNumeric: "tabular-nums" }}>{fmt(recSec)}</span>
              <span style={{ color: ot["--text2"], fontSize: 12, fontFamily: ot.font, marginLeft: "auto" }}>Recording...</span>
            </div>
          )}
          <AeroInput
            t={ot} value={input} onChange={setInput}
            onSend={() => { sendMsg(input); setInput(""); }}
            onTyping={() => { emitTyping(true); myAvatar.onTyping(); clearTimeout(typingTimerRef.current); typingTimerRef.current = setTimeout(() => emitTyping(false), 2000); }}
            onMediaToggle={(mode) => setMediaPanel(m => m === mode ? null : mode)}
            onVoiceToggle={() => setRecording(!recording)}
            onImageAttach={handleAttach}
            isRecording={recording} selfAnimal={myAnimal} selfAvatarState={myAvatar.state} disabled={false}
          />
        </div>
      )}
      {/* SECURITY ASSURANCE FOOTER REMOVED - NOW IN HEADER TOOLTIP */}

    </>
  );

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "100%", minHeight: 0, width: "100%", position: "relative", overflow: "hidden", background: ot["--bg"], ...cssVars }}>
      {ot.scanlines && (
        <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 998, background: "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,255,157,0.012) 2px,rgba(0,255,157,0.012) 4px)" }} />
      )}

      <TelemeteryCapsule
        t={ot} entityName={entityName} entitySub={entitySub} isNexus={isNexus} isOnline={true}
        joinCode={isNexus ? (activeNexus?.joinCode || null) : null} peerAnimal={peerAnimal} peerAvatarState={peerAvatar.state}
        onBack={() => { if (onMobileBack) onMobileBack(); else { if (isNexus) setSelectedNexus(null); else setSelectedUser(null); navigate("/"); } }}
        onSearch={() => { setSearchOpen(x => !x); setSearchQ(""); }}
        onCall={() => setCallType("voice")} onInfoToggle={() => setShowInfo(x => !x)}
        onMobileMenuToggle={onOpenSidebar ? () => onOpenSidebar(isNexus ? "nexus" : "contacts") : null}
        searchActive={searchOpen}
      />
      
      {showInfo && localNexusGroup && isNexus && (
        <div style={{ flex: 1, minHeight: 0, overflow: "hidden", display: "flex", flexDirection: "column", animation: "fadeIn .2s ease" }}>
          <InfoPanel t={t} group={localNexusGroup} setGroup={setLocalNexusGroup} onClose={() => setShowInfo(false)} addToast={addToast} onUpdate={handleInfoUpdate} onLeave={handleLeaveNexus} onDelete={handleDeleteNexus} fullArea />
        </div>
      )}

      <div style={{ flex: 1, position: "relative", display: "flex", flexDirection: "column", minHeight: 0 }}>
        {chatContent}
      </div>

      {callType && <CallOverlay t={t} type={callType} onEnd={() => setCallType(null)} />}
      {toast && <Toast key={toast + Date.now()} t={t} msg={toast} onDone={() => setToast(null)} />}
    </div>
  );
}
