/**
 * RESPONSIVE LAYOUT SYSTEM
 * Base format for all pages/components
 * Covers: mobile (320–480px), tablet (481–768px), iPad (769–1024px), laptop/desktop (1025px+)
 *
 * Usage: Show this file to your code editor.
 * Each component has the correct responsive structure + breakpoints.
 * Your editor should plug in the real theme (colors, fonts, data) from your existing codebase.
 */

import { useState, useEffect, useRef } from "react";

/* ─────────────────────────────────────────────
   SHARED: Breakpoint hook
───────────────────────────────────────────── */
function useBreakpoint() {
  const [bp, setBp] = useState("desktop");
  useEffect(() => {
    const check = () => {
      const w = window.innerWidth;
      if (w < 481) setBp("mobile");
      else if (w < 769) setBp("tablet");
      else if (w < 1025) setBp("ipad");
      else setBp("desktop");
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return bp;
}

/* ─────────────────────────────────────────────
   SHARED: CSS reset + variables
   Inject this once at root level
───────────────────────────────────────────── */
const GlobalStyles = () => (
  <style>{`
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { font-size: 16px; -webkit-text-size-adjust: 100%; }
    body { min-height: 100dvh; overflow-x: hidden; }
    img, svg { display: block; max-width: 100%; }
    input, textarea, button { font: inherit; }
    button { cursor: pointer; border: none; background: none; }

    /* ── Breakpoint reference ──
       mobile  : max-width 480px
       tablet  : 481px – 768px
       ipad    : 769px – 1024px
       desktop : 1025px+
    ── */
  `}</style>
);

/* ══════════════════════════════════════════════
   PAGE 1 — CHAT / MESSENGER
   Pink E2E encrypted chat, 2-member thread
══════════════════════════════════════════════ */
export function ChatPage() {
  const bp = useBreakpoint();
  const isMobile = bp === "mobile";
  const isTablet = bp === "tablet";

  return (
    <>
      <style>{`
        /* ── CHAT PAGE ── */
        .chat-root {
          display: flex;
          flex-direction: column;
          height: 100dvh;
          width: 100%;
          overflow: hidden;
          /* inherit theme colors from your theme vars */
          background: var(--chat-bg, #fff0f5);
          color: var(--chat-text, #3d1a2e);
          font-family: var(--font-body, sans-serif);
        }

        /* ── TOP BAR ── */
        .chat-topbar {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 16px;
          border-bottom: 1px solid var(--chat-border, rgba(255,182,210,0.3));
          background: var(--chat-topbar-bg, rgba(255,255,255,0.85));
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          flex-shrink: 0;
          /* sticks to top on all devices */
          position: sticky;
          top: 0;
          z-index: 10;
        }
        .chat-topbar-back {
          /* visible only on mobile/tablet — back arrow */
          display: none;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .chat-topbar-avatar {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          flex-shrink: 0;
          background: var(--avatar-bg, #e8c0d0);
          overflow: hidden;
        }
        .chat-topbar-info { flex: 1; min-width: 0; }
        .chat-topbar-name {
          font-weight: 600;
          font-size: 0.95rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .chat-topbar-sub {
          font-size: 0.72rem;
          opacity: 0.6;
        }
        .chat-topbar-code {
          font-size: 0.75rem;
          padding: 4px 10px;
          border-radius: 20px;
          border: 1px solid var(--accent, #f4a0c0);
          cursor: pointer;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .chat-topbar-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }
        .chat-topbar-icon {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          cursor: pointer;
          font-size: 1rem;
        }

        /* ── PIN BAR ── */
        .chat-pinbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 16px;
          background: var(--pinbar-bg, rgba(255,220,235,0.5));
          font-size: 0.78rem;
          flex-shrink: 0;
        }

        /* ── MESSAGES AREA ── */
        .chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          /* smooth scroll on iOS */
          -webkit-overflow-scrolling: touch;
          overscroll-behavior: contain;
        }
        .chat-date-divider {
          text-align: center;
          font-size: 0.72rem;
          opacity: 0.5;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          margin: 8px 0;
        }
        .chat-msg-row {
          display: flex;
          align-items: flex-end;
          gap: 8px;
          max-width: 75%;
        }
        .chat-msg-row.outgoing {
          align-self: flex-end;
          flex-direction: row-reverse;
        }
        .chat-msg-row.incoming {
          align-self: flex-start;
        }
        .chat-msg-avatar {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          flex-shrink: 0;
          background: var(--avatar-bg, #e8c0d0);
          overflow: hidden;
        }
        .chat-bubble-wrap { display: flex; flex-direction: column; gap: 2px; }
        .chat-sender-name { font-size: 0.7rem; opacity: 0.6; margin-bottom: 2px; }
        .chat-bubble {
          padding: 10px 14px;
          border-radius: 18px;
          font-size: 0.9rem;
          line-height: 1.4;
          word-break: break-word;
          position: relative;
        }
        .chat-bubble.incoming {
          background: var(--bubble-in, rgba(255,255,255,0.9));
          border-bottom-left-radius: 4px;
        }
        .chat-bubble.outgoing {
          background: var(--bubble-out, #f4a0c0);
          color: var(--bubble-out-text, #fff);
          border-bottom-right-radius: 4px;
        }
        .chat-bubble-time {
          font-size: 0.65rem;
          opacity: 0.55;
          text-align: right;
          margin-top: 2px;
          padding-right: 2px;
        }

        /* ── INPUT BAR ── */
        .chat-inputbar {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
          background: var(--chat-topbar-bg, rgba(255,255,255,0.9));
          border-top: 1px solid var(--chat-border, rgba(255,182,210,0.3));
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          flex-shrink: 0;
          /* safe area for iPhone notch */
          padding-bottom: max(10px, env(safe-area-inset-bottom));
        }
        .chat-input-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          flex-shrink: 0;
          overflow: hidden;
          background: var(--avatar-bg, #e8c0d0);
        }
        .chat-input {
          flex: 1;
          min-width: 0;
          border: none;
          outline: none;
          background: transparent;
          font-size: 0.9rem;
          padding: 6px 0;
          color: inherit;
        }
        .chat-input-actions {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-shrink: 0;
        }
        .chat-input-icon {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          font-size: 1.1rem;
          cursor: pointer;
          opacity: 0.7;
          transition: opacity 0.2s;
        }
        .chat-input-icon:hover { opacity: 1; }
        .chat-send-btn {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: var(--accent, #f4a0c0);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1rem;
          color: white;
          flex-shrink: 0;
          transition: transform 0.15s, background 0.2s;
        }
        .chat-send-btn:hover { transform: scale(1.08); }

        /* ── ENCRYPT FOOTER ── */
        .chat-encrypt-footer {
          text-align: center;
          font-size: 0.68rem;
          opacity: 0.45;
          padding: 4px 0 2px;
          flex-shrink: 0;
          background: var(--chat-bg, #fff0f5);
        }

        /* ── RESPONSIVE ── */
        @media (max-width: 480px) {
          /* mobile: full bleed, compact */
          .chat-topbar { padding: 8px 12px; }
          .chat-topbar-back { display: flex; }
          .chat-topbar-code { display: none; } /* hide room code on tiny screens */
          .chat-topbar-icon.hide-mobile { display: none; }
          .chat-messages { padding: 12px 10px; }
          .chat-msg-row { max-width: 88%; }
          .chat-bubble { font-size: 0.88rem; padding: 8px 12px; }
          .chat-inputbar { padding: 8px 10px; padding-bottom: max(8px, env(safe-area-inset-bottom)); }
          .chat-input-icon.hide-mobile { display: none; }
        }

        @media (min-width: 481px) and (max-width: 768px) {
          /* tablet: slightly more room */
          .chat-topbar-back { display: flex; }
          .chat-msg-row { max-width: 80%; }
        }

        @media (min-width: 769px) and (max-width: 1024px) {
          /* iPad: comfortable */
          .chat-messages { padding: 20px 40px; }
          .chat-msg-row { max-width: 70%; }
        }

        @media (min-width: 1025px) {
          /* desktop: max width centered */
          .chat-messages { padding: 20px; max-width: 900px; margin: 0 auto; width: 100%; }
          .chat-msg-row { max-width: 65%; }
          .chat-root { max-width: 100%; }
        }
      `}</style>

      <div className="chat-root">
        {/* TOP BAR */}
        <div className="chat-topbar">
          <button className="chat-topbar-back">←</button>
          <div className="chat-topbar-avatar">{/* avatar img */}</div>
          <div className="chat-topbar-info">
            <div className="chat-topbar-name">WE</div>
            <div className="chat-topbar-sub">2 members</div>
          </div>
          <button className="chat-topbar-code">0R7EE0 ⧉</button>
          <div className="chat-topbar-actions">
            <div className="chat-topbar-icon">🔍</div>
            <div className="chat-topbar-icon hide-mobile">📞</div>
            <div className="chat-topbar-icon hide-mobile">ℹ️</div>
          </div>
        </div>

        {/* PIN BAR */}
        <div className="chat-pinbar">
          <span>📌 No pinned message</span>
          <span style={{ cursor: "pointer", opacity: 0.5 }}>✕</span>
        </div>

        {/* MESSAGES */}
        <div className="chat-messages">
          <div className="chat-date-divider">Nexus Thread · May 4</div>

          {/* Incoming */}
          <div className="chat-msg-row incoming">
            <div className="chat-msg-avatar" />
            <div className="chat-bubble-wrap">
              <div className="chat-sender-name">oggy</div>
              <div className="chat-bubble incoming">wassgoood</div>
              <div className="chat-bubble-time">16:36</div>
            </div>
          </div>

          {/* Outgoing */}
          <div className="chat-msg-row outgoing">
            <div className="chat-msg-avatar" />
            <div className="chat-bubble-wrap">
              <div className="chat-bubble outgoing">wassgoood</div>
              <div className="chat-bubble-time">16:36</div>
            </div>
          </div>

          {/* More messages follow same pattern */}
        </div>

        {/* INPUT BAR */}
        <div className="chat-inputbar">
          <div className="chat-input-avatar" />
          <input className="chat-input" placeholder="Transmit encrypted message..." />
          <div className="chat-input-actions">
            <div className="chat-input-icon hide-mobile">😊</div>
            <div className="chat-input-icon hide-mobile">🖼</div>
            <div className="chat-input-icon">📎</div>
            <div className="chat-input-icon">🎤</div>
            <div className="chat-send-btn">➤</div>
          </div>
        </div>

        <div className="chat-encrypt-footer">
          🔒 Messages are end-to-end encrypted · AES-256-GCM + RSA-2048
        </div>
      </div>
    </>
  );
}

/* ══════════════════════════════════════════════
   PAGE 2 — SETTINGS PAGE
   Left sidebar nav + right content panel
══════════════════════════════════════════════ */
export function SettingsPage() {
  const [activeSection, setActiveSection] = useState("Identity");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const bp = useBreakpoint();
  const isMobile = bp === "mobile" || bp === "tablet";

  const navItems = [
    { label: "Identity", icon: "🌸" },
    { label: "Acoustics", icon: "🎵" },
    { label: "Aesthetics", icon: "🎀" },
    { label: "Motion", icon: "✨" },
    { label: "Alerts", icon: "🔔" },
    { label: "Magic Rules", icon: "💫" },
  ];

  return (
    <>
      <style>{`
        /* ── SETTINGS PAGE ── */
        .settings-root {
          display: flex;
          flex-direction: column;
          min-height: 100dvh;
          background: var(--settings-bg, #fdf0f5);
          font-family: var(--font-body, sans-serif);
          color: var(--settings-text, #3d1a2e);
        }

        /* ── TOP NAV BAR ── */
        .settings-topnav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 20px;
          background: var(--settings-surface, rgba(255,255,255,0.8));
          backdrop-filter: blur(10px);
          border-bottom: 1px solid var(--settings-border, rgba(255,182,210,0.2));
          position: sticky;
          top: 0;
          z-index: 20;
        }
        .settings-topnav-left { display: flex; align-items: center; gap: 10px; }
        .settings-topnav-hamburger {
          display: none; /* shown on mobile/tablet */
          width: 36px; height: 36px;
          align-items: center; justify-content: center;
          border-radius: 8px; font-size: 1.2rem; cursor: pointer;
        }
        .settings-topnav-back {
          font-size: 0.82rem; cursor: pointer;
          display: flex; align-items: center; gap: 4px;
          padding: 6px 12px; border-radius: 20px;
          border: 1px solid var(--settings-border, rgba(255,182,210,0.4));
        }
        .settings-topnav-right { display: flex; gap: 10px; }
        .settings-btn {
          font-size: 0.78rem;
          padding: 6px 14px; border-radius: 20px; cursor: pointer;
          border: 1px solid var(--accent, #f4a0c0);
          transition: background 0.2s;
        }
        .settings-btn.primary { background: var(--accent, #f4a0c0); color: white; border-color: transparent; }

        /* ── BODY: sidebar + content ── */
        .settings-body {
          display: flex;
          flex: 1;
          position: relative;
        }

        /* ── SIDEBAR ── */
        .settings-sidebar {
          width: 240px;
          flex-shrink: 0;
          background: var(--settings-sidebar-bg, rgba(255,240,248,0.9));
          padding: 24px 16px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          border-right: 1px solid var(--settings-border, rgba(255,182,210,0.2));
          /* desktop: always visible */
        }
        .settings-sidebar-title {
          font-size: 1.25rem; font-weight: 700;
          margin-bottom: 16px; padding-left: 8px;
        }
        .settings-nav-item {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 14px; border-radius: 12px;
          font-size: 0.9rem; cursor: pointer;
          transition: background 0.18s, color 0.18s;
        }
        .settings-nav-item:hover { background: var(--settings-hover, rgba(244,160,192,0.15)); }
        .settings-nav-item.active {
          background: var(--settings-surface, white);
          font-weight: 600;
          box-shadow: 0 2px 8px rgba(244,160,192,0.15);
        }
        .settings-nav-icon { width: 20px; text-align: center; }

        /* ── SIDEBAR OVERLAY (mobile/tablet) ── */
        .settings-sidebar-overlay {
          display: none;
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.3);
          z-index: 30;
          backdrop-filter: blur(2px);
        }
        .settings-sidebar-overlay.open { display: block; }
        .settings-sidebar.mobile-drawer {
          position: fixed;
          top: 0; left: 0; bottom: 0;
          z-index: 31;
          transform: translateX(-100%);
          transition: transform 0.28s cubic-bezier(0.4,0,0.2,1);
          box-shadow: 4px 0 20px rgba(0,0,0,0.1);
          padding-top: 60px;
        }
        .settings-sidebar.mobile-drawer.open { transform: translateX(0); }

        /* ── CONTENT PANEL ── */
        .settings-content {
          flex: 1;
          padding: 36px 48px;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
        }
        .settings-content-title {
          font-size: 2rem; font-weight: 700;
          color: var(--accent-purple, #8b3fc8);
          margin-bottom: 32px;
        }
        .settings-field { margin-bottom: 24px; }
        .settings-label {
          font-size: 0.72rem; letter-spacing: 0.08em;
          text-transform: uppercase; opacity: 0.6;
          margin-bottom: 8px;
        }
        .settings-input, .settings-textarea {
          width: 100%; border-radius: 14px;
          border: 1.5px solid var(--accent, rgba(244,160,192,0.5));
          padding: 14px 18px;
          background: white;
          font-size: 0.95rem; outline: none;
          transition: border-color 0.2s;
          color: var(--accent-purple, #8b3fc8);
        }
        .settings-input:focus, .settings-textarea:focus {
          border-color: var(--accent, #f4a0c0);
        }
        .settings-textarea { min-height: 130px; resize: vertical; }

        /* ── RESPONSIVE ── */
        @media (max-width: 768px) {
          /* mobile + tablet: drawer sidebar */
          .settings-sidebar {
            width: 260px;
          }
          .settings-topnav-hamburger { display: flex; }
          .settings-content { padding: 24px 20px; }
          .settings-content-title { font-size: 1.5rem; margin-bottom: 20px; }
          /* hide "SAVE DREAMS" text on tiny mobile, keep icon */
        }

        @media (max-width: 480px) {
          .settings-topnav { padding: 10px 14px; }
          .settings-btn:not(.primary) { display: none; }
          .settings-content { padding: 20px 16px; }
          .settings-input, .settings-textarea { padding: 12px 14px; }
        }

        @media (min-width: 769px) and (max-width: 1024px) {
          /* iPad: sidebar stays but narrower */
          .settings-sidebar { width: 200px; }
          .settings-content { padding: 28px 32px; }
        }

        @media (min-width: 1025px) {
          /* desktop: full layout */
          .settings-sidebar { width: 240px; }
          .settings-content { padding: 40px 60px; }
        }
      `}</style>

      <div className="settings-root">
        {/* TOP NAV */}
        <div className="settings-topnav">
          <div className="settings-topnav-left">
            <button
              className="settings-topnav-hamburger"
              onClick={() => setSidebarOpen(true)}
            >
              ☰
            </button>
            <button className="settings-topnav-back">◀ Back to Dreamland</button>
          </div>
          <div className="settings-topnav-right">
            <button className="settings-btn">Reset Magic</button>
            <button className="settings-btn primary">Save Dreams ✨</button>
          </div>
        </div>

        <div className="settings-body">
          {/* MOBILE OVERLAY */}
          {isMobile && (
            <>
              <div
                className={`settings-sidebar-overlay ${sidebarOpen ? "open" : ""}`}
                onClick={() => setSidebarOpen(false)}
              />
              <nav className={`settings-sidebar mobile-drawer ${sidebarOpen ? "open" : ""}`}>
                <div className="settings-sidebar-title">Settings 🎀</div>
                {navItems.map((item) => (
                  <div
                    key={item.label}
                    className={`settings-nav-item ${activeSection === item.label ? "active" : ""}`}
                    onClick={() => { setActiveSection(item.label); setSidebarOpen(false); }}
                  >
                    <span className="settings-nav-icon">{item.icon}</span>
                    {item.label}
                  </div>
                ))}
              </nav>
            </>
          )}

          {/* DESKTOP SIDEBAR */}
          {!isMobile && (
            <nav className="settings-sidebar">
              <div className="settings-sidebar-title">Settings 🎀</div>
              {navItems.map((item) => (
                <div
                  key={item.label}
                  className={`settings-nav-item ${activeSection === item.label ? "active" : ""}`}
                  onClick={() => setActiveSection(item.label)}
                >
                  <span className="settings-nav-icon">{item.icon}</span>
                  {item.label}
                </div>
              ))}
            </nav>
          )}

          {/* CONTENT */}
          <div className="settings-content">
            <div className="settings-content-title">{activeSection}</div>
            <div className="settings-field">
              <div className="settings-label">Persona Name</div>
              <input className="settings-input" defaultValue="Aagosh" />
            </div>
            <div className="settings-field">
              <div className="settings-label">Dreamy Bio</div>
              <textarea className="settings-textarea" placeholder="Tell your story..." />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ══════════════════════════════════════════════
   PAGE 3 — PROFILE / IDENTITY DETAILS
   Split: avatar card left, form fields right
══════════════════════════════════════════════ */
export function ProfilePage() {
  const bp = useBreakpoint();

  return (
    <>
      <style>{`
        /* ── PROFILE PAGE ── */
        .profile-root {
          min-height: 100dvh;
          display: flex;
          flex-direction: column;
          background: var(--profile-bg, #fdf0f5);
          font-family: var(--font-body, sans-serif);
          color: var(--profile-text, #3d1a2e);
        }

        /* ── TOP NAV ── */
        .profile-topnav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 20px;
          position: sticky; top: 0; z-index: 10;
          background: var(--profile-surface, rgba(255,255,255,0.85));
          backdrop-filter: blur(10px);
          border-bottom: 1px solid var(--profile-border, rgba(255,182,210,0.2));
        }
        .profile-topnav-back {
          font-size: 0.82rem; cursor: pointer;
          display: flex; align-items: center; gap: 4px;
          padding: 6px 12px; border-radius: 20px;
          border: 1px solid var(--profile-border, rgba(255,182,210,0.4));
        }
        .profile-topnav-right {
          font-size: 0.85rem; font-weight: 500;
          color: var(--accent, #f4a0c0);
          display: flex; align-items: center; gap: 6px;
        }

        /* ── BODY: card + form ── */
        .profile-body {
          flex: 1;
          display: flex;
          gap: 0;
          max-width: 1200px;
          width: 100%;
          margin: 0 auto;
          padding: 32px 24px;
          align-items: flex-start;
        }

        /* ── AVATAR CARD ── */
        .profile-card {
          background: var(--profile-card-bg, linear-gradient(160deg, #fce4ec, #f8bbdd));
          border-radius: 20px;
          padding: 36px 28px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          width: 320px;
          flex-shrink: 0;
          margin-right: 24px;
        }
        .profile-avatar-wrap {
          position: relative;
          width: 120px; height: 120px;
        }
        .profile-avatar {
          width: 120px; height: 120px;
          border-radius: 50%;
          background: var(--avatar-bg, #c0c0d0);
          border: 4px solid white;
          box-shadow: 0 4px 16px rgba(244,160,192,0.3);
          overflow: hidden;
        }
        .profile-avatar-edit {
          position: absolute;
          bottom: 4px; right: 4px;
          width: 32px; height: 32px;
          border-radius: 50%;
          background: var(--accent-purple, #8b3fc8);
          color: white;
          display: flex; align-items: center; justify-content: center;
          font-size: 0.8rem; cursor: pointer;
          border: 2px solid white;
        }
        .profile-name {
          font-size: 1.4rem; font-weight: 700;
          color: var(--accent-purple, #8b3fc8);
        }
        .profile-status {
          font-size: 0.8rem; padding: 5px 14px;
          border-radius: 20px;
          background: var(--profile-surface, white);
          border: 1px solid var(--profile-border, rgba(255,182,210,0.4));
        }
        .profile-stats {
          width: 100%;
          display: flex; flex-direction: column; gap: 8px;
          margin-top: 8px;
        }
        .profile-stat-row {
          display: flex; justify-content: space-between; align-items: center;
          padding: 10px 14px; border-radius: 12px;
          background: var(--profile-surface, rgba(255,255,255,0.6));
          font-size: 0.85rem;
        }
        .profile-stat-val { font-weight: 600; }
        .profile-edit-btn {
          width: 100%; padding: 12px;
          border-radius: 14px;
          border: 2px solid var(--accent-purple, #8b3fc8);
          color: var(--accent-purple, #8b3fc8);
          font-size: 0.85rem; font-weight: 600; letter-spacing: 0.04em;
          cursor: pointer; margin-top: 8px;
          transition: background 0.2s, color 0.2s;
        }
        .profile-edit-btn:hover {
          background: var(--accent-purple, #8b3fc8); color: white;
        }

        /* ── FORM PANEL ── */
        .profile-form {
          flex: 1;
          background: var(--profile-surface, white);
          border-radius: 20px;
          padding: 40px 44px;
          box-shadow: 0 4px 24px rgba(244,160,192,0.1);
        }
        .profile-form-title {
          font-size: 1.8rem; font-weight: 700;
          color: var(--accent-purple, #8b3fc8);
          margin-bottom: 6px;
        }
        .profile-form-sub {
          font-size: 0.85rem; font-weight: 600;
          color: var(--accent-purple, #8b3fc8);
          margin-bottom: 28px;
        }
        .profile-field { margin-bottom: 22px; }
        .profile-label {
          font-size: 0.7rem; letter-spacing: 0.08em;
          text-transform: uppercase; opacity: 0.6;
          margin-bottom: 8px;
        }
        .profile-input, .profile-textarea {
          width: 100%; border-radius: 14px;
          border: 1.5px solid var(--accent, rgba(244,160,192,0.5));
          padding: 13px 16px;
          font-size: 0.92rem; outline: none;
          transition: border-color 0.2s;
          color: var(--accent-purple, #8b3fc8);
          background: var(--profile-surface, white);
        }
        .profile-input:focus, .profile-textarea:focus {
          border-color: var(--accent, #f4a0c0);
        }
        .profile-textarea { min-height: 120px; resize: vertical; }

        /* ── RESPONSIVE ── */
        @media (max-width: 480px) {
          /* mobile: stack vertically */
          .profile-body {
            flex-direction: column;
            padding: 16px 14px;
            gap: 16px;
          }
          .profile-card {
            width: 100%; margin-right: 0;
            padding: 24px 20px;
          }
          .profile-avatar { width: 90px; height: 90px; }
          .profile-avatar-wrap { width: 90px; height: 90px; }
          .profile-form { padding: 24px 20px; }
          .profile-form-title { font-size: 1.4rem; }
          .profile-topnav { padding: 10px 14px; }
        }

        @media (min-width: 481px) and (max-width: 768px) {
          /* tablet: stack but more room */
          .profile-body { flex-direction: column; padding: 20px; gap: 20px; }
          .profile-card { width: 100%; margin-right: 0; flex-direction: row; align-items: center; padding: 24px; }
          .profile-stats { flex: 1; }
          .profile-form { padding: 28px 28px; }
        }

        @media (min-width: 769px) and (max-width: 1024px) {
          /* iPad: side-by-side but narrower card */
          .profile-body { padding: 24px; gap: 20px; }
          .profile-card { width: 260px; }
          .profile-form { padding: 32px 36px; }
        }

        @media (min-width: 1025px) {
          .profile-body { padding: 40px 32px; }
        }
      `}</style>

      <div className="profile-root">
        {/* TOP NAV */}
        <div className="profile-topnav">
          <button className="profile-topnav-back">◀ Back to Dreamland</button>
          <div className="profile-topnav-right">Aagosh's Profile 🌸</div>
        </div>

        <div className="profile-body">
          {/* AVATAR CARD */}
          <div className="profile-card">
            <div className="profile-avatar-wrap">
              <div className="profile-avatar">{/* img tag here */}</div>
              <div className="profile-avatar-edit">📷</div>
            </div>
            <div className="profile-name">Aagosh</div>
            <div className="profile-status">Status: Magical ✨</div>
            <div className="profile-stats">
              <div className="profile-stat-row">
                <span>🎀 Charm Level</span>
                <span className="profile-stat-val">9,999</span>
              </div>
              <div className="profile-stat-row">
                <span>☁️ Cloud Jumps</span>
                <span className="profile-stat-val">42</span>
              </div>
            </div>
            <button className="profile-edit-btn">🌸 EDIT PROFILE</button>
          </div>

          {/* FORM PANEL */}
          <div className="profile-form">
            <div className="profile-form-title">Identity Details</div>
            <div className="profile-form-sub">Sprinkle some magic on your persona! 🪄</div>

            <div className="profile-field">
              <div className="profile-label">Persona Name</div>
              <input className="profile-input" defaultValue="Aagosh" />
            </div>
            <div className="profile-field">
              <div className="profile-label">Magical Mail (Email)</div>
              <input className="profile-input" defaultValue="aagosh0000@gmail.com" type="email" />
            </div>
            <div className="profile-field">
              <div className="profile-label">Dreamy Bio</div>
              <textarea className="profile-textarea" placeholder="Write your dreamy bio..." />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ══════════════════════════════════════════════
   PAGE 4 — SPOTIFY SYNC / MUSIC PLAYER
   Dark theme: sidebar + main + now-playing bar
══════════════════════════════════════════════ */
export function SpotifyPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const bp = useBreakpoint();
  const isMobile = bp === "mobile";
  const isTablet = bp === "tablet";
  const isCompact = isMobile || isTablet;

  const playlists = [
    { name: "Namami Shamishan", by: "Aagosh_Srivastava", img: null },
    { name: "Trip", by: "Aagosh_Srivastava", img: null },
    { name: "Pills", by: "Aagosh_Srivastava", img: null },
    { name: "Stars", by: "Aagosh_Srivastava", img: null },
  ];

  return (
    <>
      <style>{`
        /* ── SPOTIFY / MUSIC PAGE ── */
        .music-root {
          display: flex;
          flex-direction: column;
          height: 100dvh;
          background: var(--music-bg, #121212);
          color: var(--music-text, #fff);
          font-family: var(--font-body, sans-serif);
          overflow: hidden;
        }

        /* ── TOP BAR ── */
        .music-topbar {
          display: flex;
          align-items: center;
          padding: 12px 16px;
          border-bottom: 1px solid rgba(255,255,255,0.08);
          gap: 12px;
          flex-shrink: 0;
          position: sticky; top: 0; z-index: 20;
          background: var(--music-bg, #121212);
        }
        .music-topbar-back {
          font-size: 0.82rem; padding: 6px 12px;
          border-radius: 20px;
          border: 1px solid rgba(255,255,255,0.2);
          cursor: pointer; color: inherit;
          flex-shrink: 0;
        }
        .music-topbar-brand {
          display: flex; align-items: center; gap: 10px; flex: 1;
          min-width: 0;
        }
        .music-topbar-logo {
          width: 36px; height: 36px; border-radius: 10px;
          background: #1db954; display: flex; align-items: center;
          justify-content: center; font-size: 1rem; flex-shrink: 0;
        }
        .music-topbar-title {
          font-size: 1rem; font-weight: 600;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .music-topbar-badge {
          font-size: 0.65rem; padding: 2px 8px;
          border-radius: 20px; background: #1db954;
          color: #000; font-weight: 700; flex-shrink: 0;
        }
        .music-topbar-user {
          display: flex; align-items: center; gap: 8px;
          flex-shrink: 0;
        }
        .music-topbar-user-avatar {
          width: 32px; height: 32px; border-radius: 50%;
          background: #888; overflow: hidden; flex-shrink: 0;
        }
        .music-topbar-user-name {
          font-size: 0.82rem; font-weight: 500;
          white-space: nowrap;
        }
        .music-topbar-hamburger {
          display: none;
          width: 36px; height: 36px;
          align-items: center; justify-content: center;
          border-radius: 8px; font-size: 1.2rem; cursor: pointer;
          border: 1px solid rgba(255,255,255,0.15);
        }

        /* ── BODY: sidebar + main ── */
        .music-body {
          flex: 1;
          display: flex;
          overflow: hidden;
        }

        /* ── SIDEBAR ── */
        .music-sidebar {
          width: 220px;
          flex-shrink: 0;
          background: var(--music-sidebar-bg, #000);
          display: flex;
          flex-direction: column;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
          padding: 16px 0;
          border-right: 1px solid rgba(255,255,255,0.06);
        }
        .music-sidebar-section {
          padding: 0 8px; margin-bottom: 8px;
        }
        .music-sidebar-item {
          display: flex; align-items: center; gap: 12px;
          padding: 10px 14px; border-radius: 8px;
          font-size: 0.85rem; font-weight: 600; cursor: pointer;
          transition: background 0.15s; color: rgba(255,255,255,0.7);
        }
        .music-sidebar-item:hover, .music-sidebar-item.active {
          background: rgba(255,255,255,0.1);
          color: white;
        }
        .music-sidebar-icon {
          width: 24px; height: 24px; border-radius: 6px;
          display: flex; align-items: center; justify-content: center;
          font-size: 0.9rem; flex-shrink: 0;
        }
        .music-sidebar-divider {
          font-size: 0.68rem; letter-spacing: 0.1em;
          text-transform: uppercase; opacity: 0.4;
          padding: 12px 16px 6px;
        }
        .music-playlist-item {
          display: flex; align-items: center; gap: 10px;
          padding: 8px 14px; border-radius: 8px;
          cursor: pointer; transition: background 0.15s;
        }
        .music-playlist-item:hover { background: rgba(255,255,255,0.07); }
        .music-playlist-thumb {
          width: 36px; height: 36px; border-radius: 6px;
          background: var(--pl-thumb-bg, #333); flex-shrink: 0; overflow: hidden;
        }
        .music-playlist-info { min-width: 0; }
        .music-playlist-name {
          font-size: 0.82rem; font-weight: 500;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .music-playlist-by {
          font-size: 0.7rem; opacity: 0.45;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }

        /* SIDEBAR DRAWER (mobile/tablet) */
        .music-sidebar-overlay {
          display: none;
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.6);
          z-index: 25; backdrop-filter: blur(2px);
        }
        .music-sidebar-overlay.open { display: block; }
        .music-sidebar.drawer {
          position: fixed; top: 0; left: 0; bottom: 0;
          z-index: 26; width: 260px;
          transform: translateX(-100%);
          transition: transform 0.28s cubic-bezier(0.4,0,0.2,1);
          box-shadow: 4px 0 24px rgba(0,0,0,0.5);
        }
        .music-sidebar.drawer.open { transform: translateX(0); }

        /* ── MAIN CONTENT ── */
        .music-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        /* Search bar */
        .music-search-bar {
          padding: 12px 16px;
          display: flex; align-items: center; gap: 10px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          flex-shrink: 0;
        }
        .music-search-input {
          flex: 1; background: rgba(255,255,255,0.1);
          border: none; outline: none; border-radius: 24px;
          padding: 8px 16px; color: white; font-size: 0.88rem;
        }
        .music-search-input::placeholder { color: rgba(255,255,255,0.4); }
        .music-orbit-btn {
          display: flex; align-items: center; gap: 6px;
          padding: 8px 14px; border-radius: 24px;
          border: 1px solid #1db954; color: #1db954;
          font-size: 0.8rem; font-weight: 600; cursor: pointer;
          flex-shrink: 0; white-space: nowrap;
        }

        /* Hero area */
        .music-hero {
          background: linear-gradient(180deg, #1a3c1a 0%, #121212 100%);
          padding: 32px 28px 24px;
          display: flex;
          align-items: flex-end;
          gap: 28px;
          flex-shrink: 0;
        }
        .music-hero-art {
          width: 160px; height: 160px;
          border-radius: 12px;
          background: rgba(0,0,0,0.5);
          display: flex; align-items: center; justify-content: center;
          font-size: 2.5rem; flex-shrink: 0;
          box-shadow: 0 8px 32px rgba(0,0,0,0.4);
        }
        .music-hero-info { min-width: 0; }
        .music-hero-label {
          font-size: 0.72rem; letter-spacing: 0.1em;
          text-transform: uppercase; opacity: 0.6;
          margin-bottom: 8px;
        }
        .music-hero-title {
          font-size: clamp(1.8rem, 4vw, 3rem);
          font-weight: 900; letter-spacing: -0.02em;
          margin-bottom: 12px; line-height: 1.1;
        }
        .music-hero-meta {
          font-size: 0.82rem; opacity: 0.6;
          display: flex; align-items: center; gap: 8px;
        }

        /* Track list */
        .music-tracklist {
          flex: 1; overflow-y: auto;
          -webkit-overflow-scrolling: touch;
          padding: 8px 0;
        }
        .music-track-header {
          display: grid;
          grid-template-columns: 40px 1fr 1fr 60px;
          gap: 8px;
          padding: 8px 28px;
          font-size: 0.7rem; letter-spacing: 0.06em;
          text-transform: uppercase; opacity: 0.4;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .music-track-row {
          display: grid;
          grid-template-columns: 40px 1fr 1fr 60px;
          gap: 8px;
          padding: 8px 28px;
          align-items: center;
          border-radius: 6px;
          transition: background 0.15s;
          cursor: pointer;
        }
        .music-track-row:hover { background: rgba(255,255,255,0.07); }
        .music-track-num { font-size: 0.9rem; opacity: 0.5; text-align: center; }
        .music-track-info { display: flex; align-items: center; gap: 12px; min-width: 0; }
        .music-track-thumb {
          width: 40px; height: 40px; border-radius: 4px;
          background: #333; flex-shrink: 0; overflow: hidden;
        }
        .music-track-name {
          font-size: 0.88rem; font-weight: 500;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .music-track-artist {
          font-size: 0.75rem; opacity: 0.5;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .music-track-album {
          font-size: 0.8rem; opacity: 0.5;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .music-track-dur { font-size: 0.8rem; opacity: 0.5; text-align: right; }

        /* ── NOW PLAYING BAR ── */
        .music-nowplaying {
          display: flex;
          align-items: center;
          padding: 10px 16px;
          border-top: 1px solid rgba(255,255,255,0.08);
          background: var(--music-bar-bg, #181818);
          gap: 12px;
          flex-shrink: 0;
          /* iPhone safe area */
          padding-bottom: max(10px, env(safe-area-inset-bottom));
        }
        .music-np-thumb {
          width: 52px; height: 52px; border-radius: 6px;
          background: #888; flex-shrink: 0; overflow: hidden;
        }
        .music-np-info { min-width: 0; flex: 1; }
        .music-np-title {
          font-size: 0.88rem; font-weight: 600;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .music-np-artist {
          font-size: 0.72rem; opacity: 0.5;
          text-transform: uppercase; letter-spacing: 0.04em;
        }
        .music-np-heart { font-size: 1.1rem; opacity: 0.6; cursor: pointer; flex-shrink: 0; }
        .music-controls {
          display: flex; flex-direction: column;
          align-items: center; gap: 6px;
          flex: 2; min-width: 0;
        }
        .music-controls-row {
          display: flex; align-items: center; gap: 18px;
        }
        .music-ctrl-btn {
          font-size: 1rem; opacity: 0.7; cursor: pointer;
          transition: opacity 0.15s;
        }
        .music-ctrl-btn:hover { opacity: 1; }
        .music-play-btn {
          width: 36px; height: 36px; border-radius: 50%;
          background: white; color: black;
          display: flex; align-items: center; justify-content: center;
          font-size: 0.9rem; cursor: pointer;
          transition: transform 0.15s;
        }
        .music-play-btn:hover { transform: scale(1.1); }
        .music-progress {
          display: flex; align-items: center; gap: 8px;
          width: 100%;
        }
        .music-progress-bar {
          flex: 1; height: 4px; border-radius: 4px;
          background: rgba(255,255,255,0.2); cursor: pointer;
        }
        .music-progress-fill {
          height: 100%; border-radius: 4px;
          background: white; width: 0%;
          transition: width 0.1s;
        }
        .music-progress-time { font-size: 0.68rem; opacity: 0.45; white-space: nowrap; }
        .music-extra-controls {
          display: flex; align-items: center; gap: 10px;
          flex-shrink: 0;
        }
        .music-extra-btn { font-size: 1rem; opacity: 0.6; cursor: pointer; }

        /* ── RESPONSIVE ── */
        @media (max-width: 480px) {
          .music-topbar-hamburger { display: flex; }
          .music-topbar-user-name { display: none; }
          .music-topbar-title { font-size: 0.9rem; }
          .music-search-bar { padding: 8px 12px; }
          .music-orbit-btn { display: none; }
          .music-hero { padding: 20px 16px 16px; gap: 14px; }
          .music-hero-art { width: 90px; height: 90px; font-size: 1.8rem; }
          .music-hero-title { font-size: 1.4rem; }
          .music-track-header { display: none; }
          .music-track-row { grid-template-columns: 1fr 60px; padding: 8px 16px; }
          .music-track-num, .music-track-album { display: none; }
          .music-nowplaying { padding: 8px 12px; }
          .music-controls { display: none; } /* collapsed on mobile */
          .music-extra-controls { display: none; }
          .music-np-thumb { width: 42px; height: 42px; }
        }

        @media (min-width: 481px) and (max-width: 768px) {
          .music-topbar-hamburger { display: flex; }
          .music-hero { padding: 24px 20px; }
          .music-hero-art { width: 120px; height: 120px; }
          .music-track-header, .music-track-row {
            grid-template-columns: 40px 1fr 60px; padding: 8px 20px;
          }
          .music-track-album { display: none; }
          .music-extra-controls { display: none; }
        }

        @media (min-width: 769px) and (max-width: 1024px) {
          /* iPad: sidebar stays, track album hidden */
          .music-sidebar { width: 180px; }
          .music-track-header, .music-track-row {
            grid-template-columns: 40px 1fr 1fr 60px; padding: 8px 20px;
          }
        }

        @media (min-width: 1025px) {
          .music-sidebar { width: 220px; }
          .music-hero { padding: 40px 36px 28px; }
          .music-hero-art { width: 180px; height: 180px; }
        }
      `}</style>

      <div className="music-root">
        {/* TOP BAR */}
        <div className="music-topbar">
          <button className="music-topbar-back">← Back</button>
          <div className="music-topbar-brand">
            <div className="music-topbar-logo">🎵</div>
            <div>
              <div className="music-topbar-title">Spotify Sync ✨</div>
            </div>
            <div className="music-topbar-badge">CONNECTED</div>
          </div>
          <button
            className="music-topbar-hamburger"
            onClick={() => setSidebarOpen(true)}
          >☰</button>
          <div className="music-topbar-user">
            <div className="music-topbar-user-avatar" />
            <div className="music-topbar-user-name">Aagosh_Srivastava</div>
          </div>
        </div>

        <div className="music-body">
          {/* MOBILE SIDEBAR DRAWER */}
          {isCompact && (
            <>
              <div
                className={`music-sidebar-overlay ${sidebarOpen ? "open" : ""}`}
                onClick={() => setSidebarOpen(false)}
              />
              <div className={`music-sidebar drawer ${sidebarOpen ? "open" : ""}`}>
                <div className="music-sidebar-section">
                  <div className="music-sidebar-item active">
                    <div className="music-sidebar-icon">⊞</div> Orbit Core
                  </div>
                  <div className="music-sidebar-item">
                    <div className="music-sidebar-icon" style={{ background: "#1db954", borderRadius: "50%" }}>●</div> Dash
                  </div>
                  <div className="music-sidebar-item">
                    <div className="music-sidebar-icon">♡</div> Liked
                  </div>
                </div>
                <div className="music-sidebar-divider">Orbital Streams</div>
                {playlists.map((pl) => (
                  <div key={pl.name} className="music-playlist-item">
                    <div className="music-playlist-thumb" />
                    <div className="music-playlist-info">
                      <div className="music-playlist-name">{pl.name}</div>
                      <div className="music-playlist-by">By {pl.by}</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* DESKTOP SIDEBAR */}
          {!isCompact && (
            <div className="music-sidebar">
              <div className="music-sidebar-section">
                <div className="music-sidebar-item active">⊞ Orbit Core</div>
                <div className="music-sidebar-item">● Dash</div>
                <div className="music-sidebar-item">♡ Liked</div>
              </div>
              <div className="music-sidebar-divider">Orbital Streams</div>
              {playlists.map((pl) => (
                <div key={pl.name} className="music-playlist-item">
                  <div className="music-playlist-thumb" />
                  <div className="music-playlist-info">
                    <div className="music-playlist-name">{pl.name}</div>
                    <div className="music-playlist-by">By {pl.by}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* MAIN */}
          <div className="music-main">
            <div className="music-search-bar">
              <input className="music-search-input" placeholder="Search all Spotify songs, artists, albums..." />
              <div className="music-orbit-btn">🌐 Orbit Browser</div>
            </div>

            <div className="music-hero">
              <div className="music-hero-art">⏱</div>
              <div className="music-hero-info">
                <div className="music-hero-label">Transmission</div>
                <div className="music-hero-title">Recent Echoes</div>
                <div className="music-hero-meta">
                  <span>Orbit Sync</span>
                  <span>·</span>
                  <span>🎵 20 Fragments</span>
                </div>
              </div>
            </div>

            <div className="music-tracklist">
              <div className="music-track-header">
                <div>#</div>
                <div>Fragment</div>
                <div>Source Archive</div>
                <div style={{ textAlign: "right" }}>⏱</div>
              </div>
              <div className="music-track-row">
                <div className="music-track-num">1</div>
                <div className="music-track-info">
                  <div className="music-track-thumb" />
                  <div>
                    <div className="music-track-name">Whenever, Wherever</div>
                    <div className="music-track-artist">Shakira</div>
                  </div>
                </div>
                <div className="music-track-album">Laundry Service</div>
                <div className="music-track-dur">3:18</div>
              </div>
              {/* More tracks follow same .music-track-row pattern */}
            </div>
          </div>
        </div>

        {/* NOW PLAYING BAR */}
        <div className="music-nowplaying">
          <div className="music-np-thumb" />
          <div className="music-np-info">
            <div className="music-np-title">Whenever, Wherever</div>
            <div className="music-np-artist">Shakira</div>
          </div>
          <div className="music-np-heart">♡</div>

          <div className="music-controls">
            <div className="music-controls-row">
              <div className="music-ctrl-btn">⇌</div>
              <div className="music-ctrl-btn">⏮</div>
              <div className="music-play-btn">▶</div>
              <div className="music-ctrl-btn">⏭</div>
              <div className="music-ctrl-btn">↻</div>
            </div>
            <div className="music-progress">
              <span className="music-progress-time">0:00</span>
              <div className="music-progress-bar">
                <div className="music-progress-fill" />
              </div>
              <span className="music-progress-time">3:18</span>
            </div>
          </div>

          <div className="music-extra-controls">
            <div className="music-extra-btn">🎤</div>
            <div className="music-extra-btn">≡</div>
            <div className="music-extra-btn">🔊</div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ══════════════════════════════════════════════
   EXPORT ALL
══════════════════════════════════════════════ */
export default function App() {
  return (
    <>
      <GlobalStyles />
      {/* Render individual pages based on your router */}
      {/* <ChatPage /> */}
      {/* <SettingsPage /> */}
      {/* <ProfilePage /> */}
      {/* <SpotifyPage /> */}
    </>
  );
}

/*
  ══════════════════════════════════════════════
  IMPLEMENTATION GUIDE FOR YOUR CODE EDITOR
  ══════════════════════════════════════════════

  1. CSS VARIABLES
     Each component uses CSS custom properties (var(--name, fallback)).
     Define them in your :root or theme provider:

     :root {
       // Pink/Dreamland theme
       --chat-bg: #fff0f5;
       --accent: #f4a0c0;
       --accent-purple: #8b3fc8;
       --avatar-bg: #e8c0d0;
       --bubble-in: rgba(255,255,255,0.9);
       --bubble-out: #f4a0c0;
       --bubble-out-text: #fff;
       --font-body: 'Your chosen font', sans-serif;

       // Dark/Spotify theme
       --music-bg: #121212;
       --music-sidebar-bg: #000;
       --music-bar-bg: #181818;
       --music-text: #fff;
     }

  2. BREAKPOINTS REFERENCE
     mobile  : max-width 480px
     tablet  : 481px – 768px
     iPad    : 769px – 1024px
     desktop : 1025px+

  3. KEY RESPONSIVE BEHAVIORS
     ChatPage:
       - Back button appears on mobile/tablet
       - Room code button hides on mobile
       - Input icons collapse on mobile
       - Message max-width grows on mobile (88%) for readability

     SettingsPage:
       - Desktop: sidebar always visible (240px)
       - Mobile/Tablet: sidebar becomes slide-in drawer (hamburger button)
       - Content padding shrinks on mobile

     ProfilePage:
       - Desktop/iPad: side-by-side (card + form)
       - Tablet: stacks, card goes horizontal
       - Mobile: full stack, all full-width

     SpotifyPage:
       - Desktop/iPad: sidebar always visible
       - Mobile/Tablet: sidebar becomes slide-in drawer
       - Mobile: now-playing controls collapse (show only track info + like)
       - Mobile: track grid collapses to 2 columns (title + duration)
       - Hero art shrinks on mobile

  4. IMAGE ASSETS
     Replace placeholder divs (e.g., .profile-avatar, .music-np-thumb)
     with actual <img> tags pointing to your asset paths.

  5. FONTS
     Replace var(--font-body) with your actual font stack.
     Import fonts in your global CSS or index.html.

  6. ROUTING
     Export each component and plug into your router:
     <Route path="/chat" element={<ChatPage />} />
     <Route path="/settings" element={<SettingsPage />} />
     <Route path="/profile" element={<ProfilePage />} />
     <Route path="/music" element={<SpotifyPage />} />
*/
