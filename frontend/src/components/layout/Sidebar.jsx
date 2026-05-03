import { useEffect, useState, memo, useRef } from "react";
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
  Music,
  Flower,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useSoundManager } from "../../hooks/useSoundManager";
import NexusActions from "../nexus/NexusActions";
import toast from "../../lib/toast";
import { motion, AnimatePresence } from "framer-motion";
import { useThemeStore } from "../../store/useThemeStore";
import { PixelAvatarBadge } from "../avatar/PixelAvatar/PixelAvatarBadge.jsx";

const AddContactAction = memo(({ users, contactList, addContact }) => {
  const [username, setUsername] = useState("");

  const handleAdd = () => {
    const candidate = users.find(
      (u) => u.username.toLowerCase() === username.trim().toLowerCase(),
    );
    if (!candidate) {
      toast.error("Contact not found");
      return;
    }
    if (contactList?.includes(candidate._id.toString())) {
      toast.error("Contact already in list");
      return;
    }
    addContact(candidate._id.toString());
    setUsername("");
    toast.success("Contact added");
  };

  return (
    <div className="flex gap-2 items-center">
      <input
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Add contact by username"
        className="input input-bordered input-xs flex-1"
      />
      <button onClick={handleAdd} className="btn btn-xs btn-primary">
        Add
      </button>
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
  const selectedUser = useChatStore((state) => state.selectedUser);
  const setSelectedUser = useChatStore((state) => state.setSelectedUser);
  const isUsersLoading = useChatStore((state) => state.isUsersLoading);

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
  const onlineSet = new Set(onlineUsers.map((id) => id?.toString()));
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

  useEffect(() => {
    // Prevent multiple fetches
    if (!fetchedRef.current) {
      fetchedRef.current = true;
      if (!users.length) getUsers();
      if (!nexuses.length) getNexuses();
    }
  }, []); // Empty dependency array - fetch only once on mount

  const visibleUsers = users.filter((user) => {
    const id = user._id?.toString?.();
    return contactList?.length ? contactList.includes(id) : true;
  });

  const filteredUsers = visibleUsers.filter((user) => {
    const id = user._id?.toString?.();
    if (showOnlineOnly) {
      return onlineSet.has(id);
    }
    return true;
  });

  const handleUserSelect = (user) => {
    setSelectedUser(user);
    setSelectedNexus(null);
    navigate(`/chat/${user._id || user.id}`);
    onMobileSelect?.(); // close drawer on mobile
  };

  const handleNexusSelect = (nexus) => {
    setSelectedNexus(nexus);
    setSelectedUser(null);
    navigate(`/nexus/${nexus._id || nexus.id}`);
    onMobileSelect?.(); // close drawer on mobile
  };

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
                  onChange={(e) => setShowOnlineOnly(e.target.checked)}
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
          </div>
        )}

        <AnimatePresence mode="popLayout" initial={false}>
          {activeTab === "contacts" &&
            filteredUsers.map((user) => (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                key={user.id || user._id}
                onClick={() => handleUserSelect(user)}
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
                style={{ backfaceVisibility: "hidden" }}
              >
                <div className="relative shrink-0">
                  <div
                    className={`absolute inset-0 rounded-xl blur-lg transition-opacity duration-300 ${onlineSet.has((user.id || user._id)?.toString()) ? "bg-emerald-500/20 opacity-100" : "opacity-0"}`}
                  />
                  {(() => {
                    const uId = (user.id || user._id)?.toString() || "";
                    const ANIMALS = ['dog', 'cat', 'bunny'];
                    const animal = ANIMALS[parseInt((uId || "").toString().slice(-4) || '0', 16) % ANIMALS.length];
                    return (
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
                    );
                  })()}
                  {onlineSet.has(user._id?.toString()) && (
                    <motion.span
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-400 rounded-full border-[3px] border-base-300 z-20"
                    />
                  )}
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
                    {user.isTyping ? (
                      <span className="text-secondary font-bold tracking-tight animate-pulse flex items-center gap-1">
                        typing...
                      </span>
                    ) : (
                      <span style={isPastel ? { color: "#a1887f" } : { color: "var(--chat-muted)" }} className="font-medium">
                        {user.isTyping ? (
                          <span className="flex items-center gap-1.5 text-primary animate-pulse italic">
                            <span className="size-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0s' }}></span>
                            <span className="size-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                            <span className="size-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                            typing…
                          </span>
                        ) : (user.lastMessage ||
                          (onlineSet.has(user._id?.toString())
                            ? "Ready for signal"
                            : "Offline"))}
                      </span>
                    )}
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
            ))}

          {activeTab === "nexus" &&
            nexuses.map((nexus) => {
              const nexusId = (nexus.id || nexus._id)?.toString();
              const unread = nexusUnread[nexusId] || 0;
              const isSelected = (selectedNexus?.id || selectedNexus?._id) === (nexus.id || nexus._id);
              const hasUnread = unread > 0 && !isSelected;

              return (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
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
                  style={{ backfaceVisibility: "hidden" }}
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
        <button
          className="w-full relative group overflow-hidden rounded-[1rem] p-2.5 transition-all duration-300 shadow-xl shadow-primary/5 ring-1 ring-[var(--chat-border)] opacity-60 cursor-not-allowed"
          style={{ pointerEvents: 'none' }}
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
              Enter Your Orbit
            </div>
              <div className="text-[8px] font-bold uppercase tracking-[0.2em] text-[var(--chat-muted)] group-hover:text-[var(--chat-text)]/50 transition-colors">
                GALAXY ENGINE
              </div>
            </div>
          </div>
        </button>
      </div>
    </aside>
  );
};
export default Sidebar;
