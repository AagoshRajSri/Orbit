import { Link, useLocation } from "react-router-dom";
import { useAuthStore } from "../../store/useAuthStore";
import { useThemeStore } from "../../store/useThemeStore";
import { useChatStore } from "../../store/useChatStore";
import { useNexusStore } from "../../store/useNexusStore";
import { MessageSquare, Hash, User, Settings, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * MobileBottomNav
 * Shown only on mobile (<768px) via CSS.
 * Provides quick access to: Chats | Nexus | Profile | Settings | Logout
 */
export default function MobileBottomNav({ onOpenSidebar }) {
  const location = useLocation();
  const { authUser, logout } = useAuthStore();
  const { theme } = useThemeStore();

  // Unread badge counts
  const nexusUnread = useNexusStore((s) => s.nexusUnread);
  const totalNexusUnread = Object.values(nexusUnread).reduce((a, b) => a + b, 0);

  const isPastel = theme === "pastel-dream";
  const isGamer = theme === "gamer-high-energy";
  const isCyber = theme === "neon-cyberpunk";
  const isAmoled = theme === "amoled-dark";
  const isLight = theme === "light";

  const accentColor = isPastel
    ? "#d060a8"
    : isCyber
    ? "#00f5d4"
    : isGamer
    ? "#00ff66"
    : isAmoled
    ? "#00d4ff"
    : isLight
    ? "#b08d57"
    : "var(--color-primary)";

  const tabs = [
    {
      id: "chats",
      icon: MessageSquare,
      label: "Chats",
      action: () => onOpenSidebar?.("contacts"),
      badge: 0,
    },
    {
      id: "nexus",
      icon: Hash,
      label: "Nexus",
      action: () => onOpenSidebar?.("nexus"),
      badge: totalNexusUnread,
    },
    {
      id: "profile",
      icon: User,
      label: "Profile",
      href: "/profile",
    },
    {
      id: "settings",
      icon: Settings,
      label: "Settings",
      href: "/settings",
    },
  ];

  const isActive = (tab) => {
    if (tab.href) return location.pathname === tab.href;
    return false;
  };

  return (
    <nav
      className="orbit-mobile-nav items-center justify-around px-2"
      style={{ boxShadow: `0 -1px 0 var(--chat-border)` }}
    >
      {tabs.map((tab) => {
        const active = isActive(tab);
        const Icon = tab.icon;
        const content = (
          <motion.div
            whileTap={{ scale: 0.88 }}
            className="relative flex flex-col items-center justify-center gap-0.5 px-3 py-2 rounded-2xl transition-all touch-target"
            style={{
              color: active ? accentColor : "var(--chat-muted)",
              background: active ? `color-mix(in srgb, ${accentColor} 12%, transparent)` : "transparent",
              minWidth: 56,
            }}
          >
            <div className="relative">
              <Icon
                size={22}
                strokeWidth={active ? 2.2 : 1.7}
                style={{
                  filter: active ? `drop-shadow(0 0 6px ${accentColor})` : "none",
                  transition: "all 200ms ease",
                }}
              />
              {/* Unread badge */}
              <AnimatePresence>
                {tab.badge > 0 && (
                  <motion.span
                    key="badge"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full text-[9px] font-black flex items-center justify-center leading-none"
                    style={{
                      background: accentColor,
                      color: "var(--color-base-100)",
                      boxShadow: `0 0 8px ${accentColor}`,
                    }}
                  >
                    {tab.badge > 99 ? "99+" : tab.badge}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
            <span
              className="text-[9px] font-black uppercase tracking-widest transition-all"
              style={{ opacity: active ? 1 : 0.6 }}
            >
              {tab.label}
            </span>
            {/* Active indicator dot */}
            {active && (
              <motion.div
                layoutId="mobile-nav-indicator"
                className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                style={{ background: accentColor }}
              />
            )}
          </motion.div>
        );

        if (tab.href) {
          return (
            <Link key={tab.id} to={tab.href} className="flex-1 flex items-center justify-center">
              {content}
            </Link>
          );
        }

        return (
          <button
            key={tab.id}
            onClick={tab.action}
            className="flex-1 flex items-center justify-center"
          >
            {content}
          </button>
        );
      })}

      {/* Logout */}
      {authUser && (
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={logout}
          className="flex flex-col items-center justify-center gap-0.5 px-3 py-2 rounded-2xl touch-target"
          style={{ color: "var(--color-error)", minWidth: 56 }}
        >
          <LogOut size={22} strokeWidth={1.7} />
          <span className="text-[9px] font-black uppercase tracking-widest opacity-60">Out</span>
        </motion.button>
      )}
    </nav>
  );
}
