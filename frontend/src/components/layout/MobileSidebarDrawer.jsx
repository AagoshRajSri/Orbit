import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { useThemeStore } from "../../store/useThemeStore";
import Sidebar from "./Sidebar";

/**
 * MobileSidebarDrawer
 * Slide-in panel from the left on mobile, containing the full Sidebar.
 * Triggered by MobileBottomNav or hamburger button.
 */
export default function MobileSidebarDrawer({ isOpen, onClose, initialTab }) {
  const { theme } = useThemeStore();
  const panelRef = useRef(null);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  // Prevent body scroll when drawer open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const isPastel = theme === "pastel-dream";
  const isLight  = theme === "light";

  return (
    <div className={`orbit-mobile-drawer ${isOpen ? "open" : ""}`}>
      {/* Backdrop */}
      <div
        className="orbit-mobile-drawer__backdrop"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className="orbit-mobile-drawer__panel"
        style={
          isPastel
            ? { background: "linear-gradient(180deg, #ffdcf3 0%, #fef4f9 100%)" }
            : isLight
            ? { background: "linear-gradient(180deg, #faf7f0 0%, #f0ebd8 100%)" }
            : { background: "var(--color-base-100)" }
        }
        role="dialog"
        aria-label="Navigation drawer"
        aria-modal="true"
      >
        {/* Close button row */}
        <div
          className="flex items-center justify-between px-4 pt-4 pb-2 sticky top-0 z-10"
          style={{
            paddingTop: `calc(env(safe-area-inset-top, 0px) + 12px)`,
            background: "inherit",
            borderBottom: "1px solid var(--chat-border)",
          }}
        >
          <span
            className="text-xs font-black uppercase tracking-[0.2em] opacity-60"
            style={{ color: "var(--chat-text)" }}
          >
            Navigate
          </span>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors hover:bg-[var(--chat-text)]/10"
            aria-label="Close drawer"
          >
            <X size={18} style={{ color: "var(--chat-muted)" }} />
          </button>
        </div>

        {/* Full Sidebar content — it manages its own state */}
        <div
          className="flex-1 h-[calc(100%-56px)] overflow-hidden"
          style={{ display: "flex", flexDirection: "column" }}
        >
          <Sidebar
            mobileInitialTab={initialTab}
            onMobileSelect={onClose}
          />
        </div>
      </div>
    </div>
  );
}
