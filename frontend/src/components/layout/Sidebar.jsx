import { useEffect, useState, memo, useRef, useCallback, useMemo } from "react";
import { useChatStore } from "../../store/useChatStore";
import { useAuthStore } from "../../store/useAuthStore";
import { useNexusStore } from "../../store/useNexusStore";
import SidebarSkeleton from "../common/skeletons/SidebarSkeleton";
import {
  Users,
  Hash,
  Users as UsersIcon,
  Compass,
  Edit3,
  UserMinus,
  UserPlus,
  Music,
  Flower,
  UserCheck,
  UserX,
  Clock,
  ChevronDown,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useSoundManager } from "../../hooks/useSoundManager";
import NexusActions from "../nexus/NexusActions";
import toast from "../../lib/toast";
import { motion, AnimatePresence } from "framer-motion";
import { useThemeStore } from "../../store/useThemeStore";
import { PixelAvatarBadge } from "../avatar/PixelAvatar/PixelAvatarBadge.jsx";
import { UserAura } from "../../orbit/UserAura";

// Helper: format a date string as relative time (e.g. "3m ago")
const formatRelativeTime = (dateStr) => {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

const AddContactAction = memo(function AddContactAction({ users, contactList, addContact }) {
  const [handle, setHandle] = useState("");

  const handleAdd = async () => {
    const trimmed = handle.trim();
    if (!trimmed) {
      toast.error("Please enter an orbit handle");
      return;
    }

    const candidate = users.find(
      (u) => (u.normalizedHandle || "").toLowerCase() === trimmed.toLowerCase() || u.username.toLowerCase() === trimmed.toLowerCase(),
    );

    if (candidate && contactList?.includes(candidate._id.toString())) {
      toast.error("Contact already in list");
      return;
    }

    try {
      await addContact(trimmed);
      setHandle("");
    } catch (error) {
      // Error is handled in useChatStore
    }
  };

  return (
    <div className="flex flex-col gap-2 mt-2">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <UserMinus className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 opacity-40 hidden" />
          <input
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            placeholder="Orbit handle to add..."
            className="input input-sm input-bordered w-full bg-base-200/50 focus:bg-base-200 transition-colors text-[11px] font-bold"
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          />
        </div>
        <button 
          onClick={handleAdd} 
          className="btn btn-sm btn-primary shadow-md hover:scale-105 transition-transform px-3"
          title="Add Contact"
        >
          <UserPlus className="size-4" />
          <span className="hidden lg:inline text-[10px] font-black uppercase tracking-wider">Add</span>
        </button>
      </div>
    </div>
  );
});

const Sidebar = ({ mobileInitialTab, onMobileSelect }) => {
  const getUsers = useChatStore((state) => state.getUsers);
  const users = useChatStore((state) => state.users);
  const contactList = useChatStore((state) => state.contactList);
  const contactAliases = useChatStore((state) => state.contactAliases);
  const addContact = useChatStore((state) => state.addContact);
  const removeContact = useChatStore((state) => state.removeContact);
  const renameContact = useChatStore((state) => state.renameContact);
  const contactRequests = useChatStore((state) => state.contactRequests);
  const sentRequests   = useChatStore((state) => state.sentRequests);
  const contactRequestDates = useChatStore((state) => state.contactRequestDates);
  const sentRequestDates    = useChatStore((state) => state.sentRequestDates);
  const acceptContactRequest = useChatStore((state) => state.acceptContactRequest);
  const rejectContactRequest = useChatStore((state) => state.rejectContactRequest);
  const selectedUser = useChatStore((state) => state.selectedUser);
  const setSelectedUser = useChatStore((state) => state.setSelectedUser);
  const isUsersLoading = useChatStore((state) => state.isUsersLoading);
  const prefetchMessages = useChatStore((state) => state.prefetchMessages);

  const getNexuses = useNexusStore((state) => state.getNexuses);
  const nexuses = useNexusStore((state) => state.nexuses);
  const selectedNexus = useNexusStore((state) => state.selectedNexus);
  const setSelectedNexus = useNexusStore((state) => state.setSelectedNexus);
  const isNexusesLoading = useNexusStore((state) => state.isNexusesLoading);
  const nexusUnread = useNexusStore((state) => state.nexusUnread);

  const onlineUsers = useAuthStore((state) => state.onlineUsers);
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  // Use mobileInitialTab if provided (from bottom nav), otherwise default to "nexus"
  const [activeTab, setActiveTab] = useState(mobileInitialTab || "nexus");
  const [aliasEditingUserId, setAliasEditingUserId] = useState(null);
  const [aliasInputValue, setAliasInputValue] = useState("");
  const [showPresencePanel, setShowPresencePanel] = useState(false);
  const [presenceCustomText, setPresenceCustomText] = useState("");
  const [showRequests, setShowRequests] = useState(false);

  const presenceMap = useAuthStore((state) => state.presenceMap);
  const authUser = useAuthStore((state) => state.authUser);
  const sendPresenceUpdate = useAuthStore((state) => state.sendPresenceUpdate);

  const myPresence = useMemo(() => {
    const myId = authUser?._id?.toString() || authUser?.id?.toString();
    return presenceMap[myId] || { state: "online", customText: "" };
  }, [presenceMap, authUser]);

  useEffect(() => {
    if (myPresence?.customText) {
      setPresenceCustomText(myPresence.customText);
    }
  }, [myPresence]);

  // FIX 10: Memoize onlineSet so its reference is stable when onlineUsers array hasn't changed
  const onlineSet = useMemo(() => new Set(onlineUsers.map((id) => id?.toString())), [onlineUsers]);
  const fetchedRef = useRef(false);
  const { play } = useSoundManager();
  const { theme } = useThemeStore();
  const isPastel = theme === "pastel-dream";
  const isLight = theme === "light";
  const navigate = useNavigate();

  // Sync tab when drawer re-opens with a different initial tab
  useEffect(() => {
    if (mobileInitialTab) setActiveTab(mobileInitialTab);
  }, [mobileInitialTab]);

  // Auto-expand requests panel when incoming requests arrive
  useEffect(() => {
    if (contactRequests.length > 0) setShowRequests(true);
  }, [contactRequests.length]);

  useEffect(() => {
    // Prevent multiple fetches
    if (!fetchedRef.current) {
      fetchedRef.current = true;
      if (!users.length) getUsers();
      if (!nexuses.length) getNexuses();
    }
  }, []); // Empty dependency array - fetch only once on mount

  // FIX 10: Memoize derived user lists — prevent recomputation on every render
  const contactSet = useMemo(() => new Set(contactList || []), [contactList]);
  
  const visibleUsers = useMemo(() => users.filter((user) => {
    const id = user._id?.toString?.();
    return contactSet.has(id);
  }), [users, contactSet]);

  const filteredUsers = useMemo(() => visibleUsers.filter((user) => {
    const id = user._id?.toString?.();
    if (showOnlineOnly) return onlineSet.has(id);
    return true;
  }), [visibleUsers, showOnlineOnly, onlineSet]);

  // FIX 10: Stable callback references — prevent React.memo'd children from re-rendering
  const handleUserSelect = useCallback((user) => {
    setSelectedUser(user);
    setSelectedNexus(null);
    navigate(`/chat/${user._id || user.id}`);
    onMobileSelect?.();
  }, [setSelectedUser, setSelectedNexus, navigate, onMobileSelect]);

  const handleNexusSelect = useCallback((nexus) => {
    setSelectedNexus(nexus);
    setSelectedUser(null);
    navigate(`/nexus/${nexus._id || nexus.id}`);
    onMobileSelect?.();
  }, [setSelectedNexus, setSelectedUser, navigate, onMobileSelect]);

  const handleOnlineFilterChange = useCallback((e) => {
    setShowOnlineOnly(e.target.checked);
  }, []);

  if (isUsersLoading || isNexusesLoading) return <SidebarSkeleton />;

  return (
    <aside
      className={`h-full w-full md:w-56 lg:w-64 xl:w-72 shrink-0 flex flex-col backdrop-blur-md chat-sidebar border-r ${
        !isPastel && !isLight ? "bg-base-100/90 border-[var(--chat-border)]" : ""
      }`}
      style={isPastel ? {
        background: "linear-gradient(180deg, #ffdcf3 0%, #fef4f9 100%)",
        borderColor: "rgba(255,180,220,0.25)",
      } : isLight ? {
        background: "linear-gradient(180deg, #faf7f0 0%, #f0ebd8 100%)",
        borderColor: "rgba(176,141,87,0.2)",
      } : {}}
    >
      {/* Tabs / Toggle */}
      <div
        className={`flex w-full p-2 border-b backdrop-blur-xl sticky top-0 z-20 shrink-0 ${
          !isPastel && !isLight ? "bg-base-200/80 border-[var(--chat-border)]" : ""
        }`}
        style={isPastel ? {
          background: "rgba(255,245,250,0.75)",
          borderColor: "rgba(255,180,220,0.25)",
        } : isLight ? {
          background: "rgba(250,247,240,0.85)",
          borderColor: "rgba(176,141,87,0.15)",
        } : {}}
      >
        <div
          className={`flex w-full p-1 rounded-xl relative border group overflow-hidden ${
            !isPastel && !isLight ? "bg-base-300/40 border-[var(--chat-border)]" : ""
          }`}
          style={isPastel ? {
            background: "rgba(255,220,240,0.55)",
            borderColor: "rgba(255,160,210,0.3)",
          } : isLight ? {
            background: "rgba(240,235,216,0.5)",
            borderColor: "rgba(176,141,87,0.2)",
          } : {}}
        >
          {/* Subtle shimmer across the tab bar */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[var(--chat-text)]/5 to-transparent w-[200%] -translate-x-[100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out pointer-events-none" />

          <button
            onClick={() => setActiveTab("nexus")}
            className={`flex-1 relative z-10 rounded-lg px-1.5 py-1.5 text-[9px] font-black transition-all duration-500 flex items-center justify-center gap-1.5 uppercase tracking-[0.15em] ${
              activeTab === "nexus"
                ? isPastel
                  ? "text-[#d060a8] bg-white/60"
                  : isLight
                  ? "text-[#5c4a2a] bg-white/70"
                  : "text-[var(--chat-text)] bg-[var(--chat-text)]/10"
                : isPastel
                  ? "text-[#b08898] hover:text-[#d060a8] hover:bg-white/30"
                  : isLight
                  ? "text-[#8c7055]/70 hover:text-[#5c4a2a] hover:bg-white/50"
                  : "text-[var(--chat-muted)] hover:text-[var(--chat-text)] hover:bg-[var(--chat-text)]/5"
            }`}
          >
            <Hash className={`size-3.5 transition-all duration-500 ${activeTab === "nexus" ? "scale-110" : "opacity-60"}`} />
            <span className="font-bricolage">Orbits</span>
          </button>

          <button
            onClick={() => setActiveTab("contacts")}
            className={`flex-1 relative z-10 rounded-lg px-1.5 py-1.5 text-[9px] font-black transition-all duration-500 flex items-center justify-center gap-1.5 uppercase tracking-[0.15em] ${
              activeTab === "contacts"
                ? isPastel
                  ? "text-[#d060a8] bg-white/60"
                  : isLight
                  ? "text-[#5c4a2a] bg-white/70"
                  : "text-[var(--chat-text)] bg-[var(--chat-text)]/10"
                : isPastel
                  ? "text-[#b08898] hover:text-[#d060a8] hover:bg-white/30"
                  : isLight
                  ? "text-[#8c7055]/70 hover:text-[#5c4a2a] hover:bg-white/50"
                  : "text-[var(--chat-muted)] hover:text-[var(--chat-text)] hover:bg-[var(--chat-text)]/5"
            }`}
          >
            <UsersIcon className={`size-3.5 transition-all duration-500 ${activeTab === "contacts" ? "scale-110" : "opacity-60"}`} />
            <span className="font-bricolage">Contacts</span>
          </button>

          {/* Sliding Indicator */}
          <div
            className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-lg transition-all duration-500 border shadow-sm ${activeTab === "nexus" ? "left-1" : "left-[calc(50%+1px)]"}`}
            style={isPastel ? {
              background: "rgba(255,255,255,0.7)",
              borderColor: "rgba(255,160,210,0.4)",
              boxShadow: "0 4px 15px rgba(255,150,200,0.15)",
            } : isLight ? {
              background: "rgba(255,255,255,0.8)",
              borderColor: "rgba(176,141,87,0.3)",
              boxShadow: "0 4px 15px rgba(176,141,87,0.12)",
            } : {
              background: "rgba(var(--chat-bg),0.4)",
              borderColor: "var(--chat-border)",
              boxShadow: "0 4px 15px rgba(var(--p),0.05)",
            }}
          />
        </div>
      </div>

      {activeTab === "nexus" && <NexusActions />}

      <div
        className="flex-1 overflow-y-auto custom-scrollbar w-full p-2"
        style={isPastel ? { background: "transparent" } : {}}
      >
        {/* Contacts Header for filter and quick actions */}
        {activeTab === "contacts" && (
          <div className="px-2 mb-3 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <label className="cursor-pointer flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={showOnlineOnly}
                  onChange={handleOnlineFilterChange}
                  className="checkbox checkbox-xs"
                />
                <span className="text-xs text-base-content/70">
                  Online only
                </span>
              </label>
              <span className="text-xs text-base-content/60">
                ({filteredUsers.length}/{visibleUsers.length})
              </span>
            </div>
            <AddContactAction
              users={users}
              contactList={contactList}
              addContact={addContact}
            />

            {/* ── Requests Section ─────────────────────────── */}
            {(contactRequests.length > 0 || sentRequests.length > 0) && (
              <div className="mt-1">
                <button
                  onClick={() => setShowRequests(v => !v)}
                  className="w-full flex items-center justify-between px-2 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-[var(--chat-muted)] hover:text-[var(--chat-text)] hover:bg-[var(--bg-elevation-1)] transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <Clock className="size-3" />
                    <span>Requests</span>
                    <span className="bg-primary text-primary-content text-[9px] font-black px-1.5 py-0.5 rounded-full min-w-[16px] text-center leading-none">
                      {contactRequests.length + sentRequests.length}
                    </span>
                  </div>
                  <ChevronDown className={`size-3 transition-transform duration-200 ${showRequests ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {showRequests && (
                    <motion.div
                      key="requests-panel"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      {/* Incoming requests */}
                      {contactRequests.length > 0 && (
                        <div className="mt-1 mb-2">
                          <div className="px-2 text-[9px] uppercase tracking-widest text-[var(--chat-muted)] mb-1 font-bold">Incoming</div>
                          {contactRequests.map(req => {
                            const reqId = (req._id || req.id)?.toString();
                            const handle = req.normalizedHandle || `${req.username}`;
                            const receivedAt = contactRequestDates?.[reqId];
                            return (
                              <div key={reqId} className="flex items-center gap-2 px-2 py-2 rounded-xl hover:bg-[var(--bg-elevation-1)] transition-colors">
                                <div className="size-8 rounded-lg bg-[var(--bg-elevation-2)] flex items-center justify-center flex-shrink-0 text-[11px] font-black text-[var(--chat-text)] border border-[var(--border-default)]">
                                  {req.username?.[0]?.toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-[11px] font-bold text-[var(--chat-text)] truncate">{handle}</div>
                                  <div className="text-[9px] text-[var(--chat-muted)]">{receivedAt ? formatRelativeTime(receivedAt) : 'Pending'}</div>
                                </div>
                                <div className="flex gap-1 shrink-0">
                                  <button
                                    onClick={() => acceptContactRequest(reqId)}
                                    className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/25 text-emerald-400 transition-colors"
                                    title="Accept request"
                                  >
                                    <UserCheck className="size-3.5" />
                                  </button>
                                  <button
                                    onClick={() => rejectContactRequest(reqId)}
                                    className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/25 text-red-400 transition-colors"
                                    title="Reject request"
                                  >
                                    <UserX className="size-3.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Sent requests */}
                      {sentRequests.length > 0 && (
                        <div className="mt-1">
                          <div className="px-2 text-[9px] uppercase tracking-widest text-[var(--chat-muted)] mb-1 font-bold">Sent</div>
                          {sentRequests.map(req => {
                            const reqId = (req._id || req.id)?.toString();
                            const handle = req.normalizedHandle || `${req.username}`;
                            const sentAt = sentRequestDates?.[reqId];
                            return (
                              <div key={reqId} className="flex items-center gap-2 px-2 py-2 rounded-xl hover:bg-[var(--bg-elevation-1)] transition-colors">
                                <div className="size-8 rounded-lg bg-[var(--bg-elevation-2)] flex items-center justify-center flex-shrink-0 text-[11px] font-black text-[var(--chat-muted)] opacity-70 border border-[var(--border-default)]">
                                  {req.username?.[0]?.toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-[9px] text-[var(--chat-muted)] uppercase tracking-wide font-bold">Sent request to</div>
                                  <div className="text-[11px] font-bold text-[var(--chat-text)] truncate">{handle}</div>
                                  <div className="text-[9px] text-[var(--chat-muted)]">{sentAt ? formatRelativeTime(sentAt) : 'Pending'}</div>
                                </div>
                                <div className="size-2 rounded-full bg-amber-400/70 animate-pulse shrink-0" title="Awaiting response" />
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        )}

        <AnimatePresence mode="popLayout" initial={false}>
          {activeTab === "contacts" &&
            filteredUsers.map((user) => {
              // FIX 9: Removed `layout` prop — it caused framer-motion to measure & animate
              // ALL N items whenever ANY item changes (e.g. a user coming online). O(n) work → O(1).
              // Enter/exit animations are kept for genuine list membership changes only.
              return (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.15 }}
                key={user.id || user._id}
                onClick={() => handleUserSelect(user)}
                onMouseEnter={() => prefetchMessages((user.id || user._id)?.toString())}
                role="button"
                tabIndex={0}
                className={`
                    w-full p-2.5 flex items-center gap-3 rounded-xl border transition-colors duration-300 group relative
                    ${(selectedUser?.id || selectedUser?._id) === (user.id || user._id)
                    ? isPastel
                      ? "bg-white/80 border-[#ffaad0]/50 shadow-[0_4px_20px_rgba(255,150,200,0.15)]"
                      : isLight
                      ? "bg-white/90 border-[#b08d57]/35 shadow-[0_4px_20px_rgba(176,141,87,0.12)]"
                      : "bg-primary/10 border-primary/30 shadow-[0_4px_20px_rgba(var(--p),0.1)]"
                    : isPastel
                      ? "bg-transparent border-transparent hover:bg-white/40 hover:border-[#ffaad0]/20"
                      : isLight
                      ? "bg-transparent border-transparent hover:bg-white/60 hover:border-[#b08d57]/20"
                      : "bg-transparent border-transparent hover:bg-[var(--bg-elevation-1)] hover:border-[var(--border-default)]" 
                  }
                  `}
              >
                <div className="relative shrink-0">
                  <div
                    className={`absolute inset-0 rounded-xl blur-lg transition-opacity duration-300 ${onlineSet.has((user.id || user._id)?.toString()) ? "bg-emerald-500/20 opacity-100" : "opacity-0"}`}
                  />
                  {(() => {
                    const uId = (user.id || user._id)?.toString() || "";
                    const ANIMALS = ['dog', 'cat', 'bunny'];
                    const animal = ANIMALS[parseInt((uId || "").toString().slice(-4) || '0', 16) % ANIMALS.length];
                    const peerPresence = presenceMap[user._id?.toString()];
                    const peerState = peerPresence?.state || (onlineSet.has(uId) ? "online" : "offline");
                    const auraState = user.isTyping ? "typing" : peerState;
                    return (
                      <UserAura state={auraState} size={36} showDot={false}>
                        <PixelAvatarBadge
                          type={animal}
                          state="idle"
                          size={36}
                          showDot={false}
                          style={{
                            imageRendering: "pixelated",
                            width: "100%",
                            height: "100%",
                            borderRadius: "8px"
                          }}
                        />
                      </UserAura>
                    );
                  })()}
                  {(() => {
                    const peerPresence = presenceMap[user._id?.toString()];
                    const peerState = peerPresence?.state || (onlineSet.has(user._id?.toString()) ? "online" : "offline");
                    if (peerState === "offline") return null;

                    const colorClass = 
                      peerState === "online" ? "bg-emerald-500" :
                      peerState === "idle" ? "bg-amber-500" :
                      peerState === "dnd" ? "bg-rose-500" : "bg-cyan-500";

                    return (
                      <div className="absolute -bottom-1 -right-1 flex items-center justify-center z-20">
                        <motion.span
                          animate={{ scale: [1, 2.5], opacity: [0.8, 0] }}
                          transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
                          className={`absolute w-3 h-3 ${colorClass} rounded-full`}
                        />
                        <span className={`relative w-3.5 h-3.5 ${colorClass} rounded-full border-[2.5px] border-base-300 shadow-[0_0_8px_rgba(16,185,129,0.8)]`} />
                      </div>
                    );
                  })()}
                </div>

                <div className="text-left min-w-0 flex-1 relative z-10">
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="font-bold truncate text-[11px] font-outfit" style={isPastel ? { color: "#d060a8" } : isLight ? { color: "#5c4a2a" } : { color: "var(--chat-text)" }}>
                      {contactAliases[user._id?.toString()] || user.username}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {Number(user.unreadCount) > 0 && (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-primary text-primary-content shadow-lg shadow-primary/20">
                          {user.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-[10px] truncate mt-0.5">
                    {(() => {
                      const peerPresence = presenceMap[user._id?.toString()];
                      const peerState = peerPresence?.state || (onlineSet.has(user._id?.toString()) ? "online" : "offline");
                      const statusText = peerPresence?.customText || user.lastMessage;
                      
                      if (user.isTyping) {
                        return (
                          <span className="text-secondary font-bold tracking-tight animate-pulse flex items-center gap-1">
                            typing...
                          </span>
                        );
                      }

                      if (peerState === "offline") {
                        return (
                          <span style={isPastel ? { color: "#a1887f" } : { color: "var(--chat-muted)" }} className="font-medium">
                            {statusText || "Offline"}
                          </span>
                        );
                      }

                      const dotColor = 
                        peerState === "online" ? "bg-emerald-500 shadow-emerald-500/50" :
                        peerState === "idle" ? "bg-amber-500 shadow-amber-500/50" :
                        peerState === "dnd" ? "bg-rose-500 shadow-rose-500/50" :
                        "bg-cyan-500 shadow-cyan-500/50";

                      return (
                        <span className="flex items-center gap-1.5 font-bold tracking-wide transition-all">
                          <span className={`size-1.5 rounded-full ${dotColor} animate-pulse shadow-[0_0_4px]`} />
                          <span className="uppercase text-[8px] font-black opacity-85" style={{ color: "var(--chat-text)" }}>
                            {peerState}
                          </span>
                          {peerPresence?.customText && (
                            <span className="text-[9px] font-normal italic text-[var(--chat-muted)] truncate max-w-[100px]">
                              — "{peerPresence.customText}"
                            </span>
                          )}
                        </span>
                      );
                    })()}
                  </div>
                </div>

                {/* Quick Actions on Hover */}
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0">
                  <button
                    className="p-2 rounded-lg bg-[var(--chat-text)]/5 hover:bg-[var(--chat-text)]/10 text-[var(--chat-muted)] hover:text-[var(--chat-text)] transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      setAliasEditingUserId(user._id?.toString());
                      setAliasInputValue(
                        contactAliases[user._id?.toString()] || user.username,
                      );
                    }}
                  >
                    <Edit3 className="size-3.5" />
                  </button>
                  <button
                    className="p-2 rounded-lg bg-[var(--chat-text)]/5 hover:bg-[var(--chat-text)]/10 text-[var(--chat-muted)] hover:text-error transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeContact(user._id.toString());
                    }}
                  >
                    <UserMinus className="size-3.5" />
                  </button>
                </div>

                {/* Inline Alias Editor Overlay */}
                <AnimatePresence>
                  {aliasEditingUserId === user._id?.toString() && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="absolute inset-0 bg-base-300 rounded-2xl flex items-center gap-2 px-3 z-30"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        autoFocus
                        value={aliasInputValue}
                        onChange={(e) => setAliasInputValue(e.target.value)}
                        className="bg-transparent border-none outline-none text-xs text-[var(--chat-text)] flex-1 font-bold"
                        placeholder="Assign Alias..."
                      />
                      <button
                        onClick={() => {
                          renameContact(
                            (user.id || user._id).toString(),
                            aliasInputValue.trim() || user.username,
                          );
                          setAliasEditingUserId(null);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-primary text-[10px] font-black uppercase text-primary-content shadow-lg shadow-primary/20"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setAliasEditingUserId(null)}
                        className="text-[10px] font-bold uppercase text-[var(--chat-muted)] hover:text-[var(--chat-text)] px-2"
                      >
                        X
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}

          {activeTab === "nexus" &&
            nexuses.map((nexus) => {
              const nexusId = (nexus.id || nexus._id)?.toString();
              const unread = nexusUnread[nexusId] || 0;
              const isSelected = (selectedNexus?.id || selectedNexus?._id) === (nexus.id || nexus._id);
              const hasUnread = unread > 0 && !isSelected;

              // FIX 9: No `layout` prop — avoids O(n) layout measurement per state change
              return (
                <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.15 }}
                key={nexus.id || nexus._id}
                  onClick={() => handleNexusSelect(nexus)}
                  role="button"
                  tabIndex={0}
                  className={[
                    "w-full p-2.5 flex items-center gap-3 rounded-xl border transition-colors duration-300 group relative",
                    isSelected
                      ? isPastel
                        ? "bg-white/80 border-[#ffaad0]/50 shadow-[0_4px_20px_rgba(255,150,200,0.15)]"
                        : isLight
                        ? "bg-white/90 border-[#b08d57]/35 shadow-[0_4px_20px_rgba(176,141,87,0.12)]"
                        : "bg-primary/10 border-primary/30 shadow-[0_4px_20px_rgba(var(--p),0.1)]"
                      : hasUnread
                        ? "bg-emerald-500/5 border-emerald-500/25 shadow-[0_0_20px_rgba(16,185,129,0.08)] hover:border-emerald-500/40"
                        : isPastel
                          ? "bg-transparent border-transparent hover:bg-white/40 hover:border-[#ffaad0]/20"
                          : isLight
                          ? "bg-transparent border-transparent hover:bg-white/60 hover:border-[#b08d57]/20"
                          : "bg-transparent border-transparent hover:bg-[var(--bg-elevation-1)] hover:border-[var(--border-default)]",
                  ].join(" ")}
                >
                  {/* Avatar with optional unread badge */}
                  <div className="shrink-0 relative">
                    {/* Green glow behind avatar when unread */}
                    <div
                      className={[
                        "absolute inset-0 rounded-xl blur-md transition-opacity duration-500",
                        hasUnread
                          ? "bg-emerald-500/30 opacity-100"
                          : "opacity-0",
                      ].join(" ")}
                    />

                    <div
                      className="size-10 rounded-lg flex items-center justify-center font-black transition-transform relative z-10 overflow-hidden"
                      style={{
                        background: "transparent",
                      }}
                    >
                      {(() => {
                        const ANIMALS = ['dog', 'cat', 'bunny'];
                        const animal = ANIMALS[parseInt((nexusId || "").toString().slice(-4) || '0', 16) % ANIMALS.length];
                        return (
                          <PixelAvatarBadge
                            type={animal}
                            state="idle"
                            size={40}
                            showDot={false}
                            style={{
                              imageRendering: "pixelated",
                              width: "100%",
                              height: "100%",
                            }}
                          />
                        );
                      })()}
                    </div>

                    {/* Unread count badge */}
                    <AnimatePresence>
                      {hasUnread && (
                        <motion.span
                          key="badge"
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={{
                            type: "spring",
                            stiffness: 500,
                            damping: 25,
                          }}
                          className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-emerald-500 text-base-100 text-[9px] font-black flex items-center justify-center shadow-lg shadow-emerald-500/40 z-20 leading-none"
                        >
                          {unread > 99 ? "99+" : unread}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="text-left min-w-0 flex-1 relative z-10">
                    <div
                      className="font-bold truncate text-[12px] font-josefin tracking-wide leading-tight transition-colors duration-300"
                      style={isPastel ? {
                        color: isSelected || hasUnread ? "#d060a8" : "#8e44ad",
                      } : isLight ? {
                        color: isSelected || hasUnread ? "#5c4a2a" : "#8c7055",
                      } : {
                        color: "var(--chat-text)",
                        opacity: hasUnread ? 1 : 0.9,
                      }}
                    >
                      {nexus.name}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div className="text-[9px] font-bold uppercase tracking-widest text-[var(--chat-muted)] flex items-center gap-1 bg-[var(--chat-text)]/5 px-1.5 py-0.5 rounded-md">
                        <UsersIcon className="size-2.5" />
                        {nexus.members?.length || 0}
                      </div>
                      <div
                        className="text-[9px] font-mono font-bold tracking-widest px-1.5 py-0.5 rounded-md border"
                        style={isPastel ? {
                          color: "#d060a8",
                          background: "rgba(255,160,210,0.1)",
                          borderColor: "rgba(255,160,210,0.2)",
                        } : {
                          color: "rgba(var(--p), 0.6)",
                          background: "rgba(var(--p), 0.05)",
                          borderColor: "rgba(var(--p), 0.1)",
                        }}
                      >
                        {nexus.joinCode}
                      </div>
                      {hasUnread && (
                        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider animate-pulse">
                          NEW
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
        </AnimatePresence>

        {activeTab === "contacts" && filteredUsers.length === 0 && (
          <div className="text-center text-base-content/60 py-10 opacity-60">
            No friends found
          </div>
        )}

        {activeTab === "nexus" && nexuses.length === 0 && (
          <div className="flex flex-col items-center justify-center py-14 px-6 text-center space-y-4">
            <div className="relative group">
              <div
                className="absolute inset-0 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 animate-pulse"
                style={isPastel ? { background: "rgba(255,160,210,0.3)" } : { background: "var(--chat-primary-20)" }}
              />
              <div
                className="relative size-16 rounded-3xl flex items-center justify-center border shadow-lg mb-2"
                style={isPastel ? {
                  background: "linear-gradient(135deg, rgba(255,160,210,0.1), rgba(160,180,255,0.1))",
                  borderColor: "rgba(255,160,210,0.3)",
                } : {
                  background: "linear-gradient(135deg, rgba(var(--p),0.1), rgba(var(--s),0.1))",
                  borderColor: "var(--border-default)",
                }}
              >
                <Compass
                  className="size-8 transition-colors duration-500 group-hover:rotate-[30deg]"
                  style={isPastel ? { color: "#d060a8" } : { color: "var(--chat-primary-40)" }}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <h3
                className="text-[13px] font-black uppercase tracking-[0.1em] font-bricolage"
                style={isPastel ? { color: "#d060a8" } : { color: "rgba(var(--chat-text-rgb), 0.8)" }}
              >
                No Orbits Detected
              </h3>
              <p className="text-[11px] text-[var(--chat-muted)] font-medium leading-relaxed max-w-[180px] mx-auto">
                Join a Nexus code or launch your own orbit system ✨
              </p>
            </div>
          </div>
        )}
      </div>
      {/* Sidebar Footer Action: Your Orbit */}
      <div
        className={`p-2.5 border-t backdrop-blur-xl shrink-0 ${
          !isPastel && !isLight ? "bg-base-200/50 border-[var(--chat-border)]" : ""
        }`}
        style={isPastel ? {
          borderColor: "rgba(255,180,220,0.25)",
          background: "rgba(255,245,252,0.6)",
        } : isLight ? {
          borderColor: "rgba(176,141,87,0.2)",
          background: "rgba(250,247,240,0.8)",
        } : {}}
      >
        <div className="relative">
          {/* Dynamic Rich Presence Modal Overlay */}
          <AnimatePresence>
            {showPresencePanel && (
              <motion.div
                initial={{ opacity: 0, y: 15, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 15, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
                className="absolute bottom-full left-0 right-0 mb-3 p-4 rounded-2xl border backdrop-blur-xl shadow-2xl z-50 flex flex-col gap-3"
                style={isPastel ? {
                  background: "linear-gradient(135deg, rgba(255,240,250,0.95) 0%, rgba(240,240,255,0.95) 100%)",
                  borderColor: "rgba(255,180,220,0.4)",
                  boxShadow: "0 10px 30px rgba(255,150,200,0.2)",
                } : isLight ? {
                  background: "linear-gradient(135deg, rgba(250,247,240,0.98) 0%, rgba(240,235,216,0.98) 100%)",
                  borderColor: "rgba(176,141,87,0.3)",
                  boxShadow: "0 10px 30px rgba(176,141,87,0.15)",
                } : {
                  background: "rgba(30, 30, 40, 0.95)",
                  borderColor: "var(--chat-border)",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[var(--chat-muted)]">
                    Secure Telemetry
                  </span>
                  <div className="flex items-center gap-1.5 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-[8px] font-bold text-emerald-500 uppercase tracking-widest font-mono">
                      E2EE Verified
                    </span>
                  </div>
                </div>

                {/* Custom Status Message input */}
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-bold text-[var(--chat-muted)] uppercase tracking-wider">
                    Custom Status text
                  </span>
                  <input
                    value={presenceCustomText}
                    onChange={(e) => setPresenceCustomText(e.target.value)}
                    placeholder="What's orbiting your mind?"
                    className="input input-xs input-bordered w-full font-medium"
                    style={{ fontSize: "10px" }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        sendPresenceUpdate({ state: myPresence.state, customText: presenceCustomText });
                        toast.success("Presence synced successfully");
                      }
                    }}
                  />
                </div>

                {/* Quick Status selectors */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[9px] font-bold text-[var(--chat-muted)] uppercase tracking-wider">
                    Activity Vector
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: "online", label: "Active", desc: "Visible Online", color: "bg-emerald-500 shadow-emerald-500/50" },
                      { id: "idle", label: "Idle", desc: "Away from desk", color: "bg-amber-500 shadow-amber-500/50" },
                      { id: "dnd", label: "DND", desc: "Do Not Disturb", color: "bg-rose-500 shadow-rose-500/50" },
                      { id: "invisible", label: "Invisible", desc: "Appear Offline", color: "bg-cyan-500 shadow-cyan-500/50" }
                    ].map((s) => (
                      <button
                        key={s.id}
                        onClick={() => {
                          sendPresenceUpdate({ state: s.id, customText: presenceCustomText });
                          toast.success(`State set to ${s.label} ✦`);
                        }}
                        className={`flex flex-col items-start p-2 rounded-xl border text-left transition-all ${
                          myPresence.state === s.id
                            ? isPastel
                              ? "bg-white/80 border-[#ffaad0]/50 shadow-md"
                              : isLight
                              ? "bg-white/90 border-[#b08d57]/30 shadow-md"
                              : "bg-primary/10 border-primary/30 shadow-md"
                            : "bg-transparent border-transparent hover:bg-white/10 hover:border-white/5"
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${s.color} shadow-[0_0_8px]`} />
                          <span className="text-[10px] font-bold" style={isPastel ? { color: "#d060a8" } : isLight ? { color: "#5c4a2a" } : { color: "var(--chat-text)" }}>
                            {s.label}
                          </span>
                        </div>
                        <span className="text-[8px] text-[var(--chat-muted)] font-medium mt-0.5">
                          {s.desc}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quick Save */}
                <button
                  onClick={() => {
                    sendPresenceUpdate({ state: myPresence.state, customText: presenceCustomText });
                    setShowPresencePanel(false);
                    toast.success("Secure presence broadcasted ✦");
                  }}
                  className="btn btn-xs btn-primary w-full rounded-xl uppercase tracking-widest font-black text-[9px]"
                >
                  Broadcast Presence
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={() => setShowPresencePanel(!showPresencePanel)}
            className="w-full relative group overflow-hidden rounded-[1rem] p-2.5 transition-all duration-300 shadow-xl shadow-primary/5 ring-1 ring-[var(--chat-border)] cursor-pointer"
          >
            {/* Background Effect */}
            <div
              className="absolute inset-0 opacity-80 group-hover:opacity-100 transition-opacity"
              style={isPastel ? {
                background: "linear-gradient(135deg, rgba(255,170,220,0.35) 0%, rgba(200,180,255,0.25) 100%)",
              } : isLight ? {
                background: "linear-gradient(135deg, rgba(176,141,87,0.12) 0%, rgba(255,255,255,0.7) 50%, rgba(155,168,142,0.1) 100%)",
              } : {
                background: "linear-gradient(135deg, rgba(var(--p),0.15), rgba(var(--chat-surface),1), rgba(var(--s),0.15))",
              }}
            />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,var(--chat-primary),transparent_70%)] opacity-20" />

            <div className="relative flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-[0_0_15px_rgba(var(--p),0.1)] group-hover:shadow-[0_0_20px_rgba(var(--p),0.3)] transition-all">
                {isPastel ? (
                  <Flower className="size-5.5 group-hover:rotate-[120deg] transition-transform duration-1000 ease-in-out text-[#d060a8]" />
                ) : (
                  <Compass className="size-5.5 group-hover:rotate-[120deg] transition-transform duration-1000 ease-in-out" />
                )}
              </div>
              <div className="text-left">
                <div
                  className="text-[11px] font-bricolage font-black uppercase tracking-[0.12em] bg-clip-text text-transparent group-hover:brightness-110 transition-all"
                  style={isPastel ? {
                    backgroundImage: "linear-gradient(90deg, #e060b0, #a060e0)",
                  } : isLight ? {
                    backgroundImage: "linear-gradient(90deg, #b08d57, #5c4a2a, #708264)",
                  } : {
                    backgroundImage: "linear-gradient(90deg, var(--chat-primary), var(--chat-text), var(--color-accent))",
                  }}
                >
                  Configure Presence
                </div>
                <div className="text-[8px] font-bold uppercase tracking-[0.2em] text-[var(--chat-muted)] group-hover:text-[var(--chat-text)]/50 transition-colors flex items-center gap-1.5 mt-0.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    myPresence.state === "online" ? "bg-emerald-500" :
                    myPresence.state === "idle" ? "bg-amber-500" :
                    myPresence.state === "dnd" ? "bg-rose-500" : "bg-cyan-500"
                  }`} />
                  {myPresence.state.toUpperCase()} MODE
                </div>
              </div>
            </div>
          </button>
        </div>
      </div>
    </aside>
  );
};
export default memo(Sidebar);
