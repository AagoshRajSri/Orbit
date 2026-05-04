/**
 * DREAMLAND PAGE — App hub / home screen
 * The "Back to Dreamland" button across all pages navigates here.
 * Dark vampire theme from darkTheme.jsx, fully responsive.
 *
 * Breakpoints (from ResponsiveLayouts.jsx foundation):
 *   mobile  ≤ 480px  : stack, bottom-nav, no sidebar
 *   tablet  481–768  : compact cards 2-col
 *   ipad    769–1024 : sidebar + cards
 *   desktop 1025+    : full layout
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBreakpoint, isMobileOrTablet } from "../../lib/useBreakpoint";
import { useAuthStore } from "../../store/useAuthStore";
import { useNexusStore } from "../../store/useNexusStore";
import { useChatStore } from "../../store/useChatStore";
import { BottomNav } from "../../components/layout/BottomNav";

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@700;900&family=Cinzel:wght@400;600;700&family=IM+Fell+English:ital@0;1&display=swap');

  /* ── ROOT ── */
  .dl-root {
    min-height: 100dvh;
    width: 100%;
    background: var(--bg, #050508);
    color: var(--text, #F0E6D3);
    font-family: var(--font-body, 'IM Fell English', serif);
    display: flex;
    flex-direction: column;
    overflow-x: hidden;
    position: relative;
  }

  /* ── ATMOSPHERIC BG ── */
  .dl-atmosphere {
    position: fixed; inset: 0; z-index: 0; pointer-events: none;
    background:
      radial-gradient(ellipse 60% 40% at 80% 20%, rgba(139,0,0,0.12) 0%, transparent 70%),
      radial-gradient(ellipse 40% 60% at 20% 80%, rgba(80,0,80,0.08) 0%, transparent 70%);
  }

  /* ── BLOOD DRIP TOP ACCENT ── */
  .dl-drip {
    position: fixed; top: 0; left: 0; right: 0; height: 2px; z-index: 100;
    background: linear-gradient(90deg, transparent, #DC143C, #8B0000, #DC143C, transparent);
    box-shadow: 0 0 20px #DC143C, 0 0 60px #8B0000;
  }

  /* ── NAVBAR ── */
  .dl-navbar {
    position: sticky; top: 0; z-index: 50;
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 32px; height: 60px;
    background: rgba(5,5,8,0.97);
    border-bottom: 1px solid rgba(139,0,0,0.3);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    flex-shrink: 0;
  }
  .dl-logo {
    display: flex; align-items: center; gap: 10px;
    font-family: 'Cinzel Decorative', cursive;
    font-size: 20px; font-weight: 900;
    color: var(--text, #F0E6D3);
    text-shadow: 0 0 20px #DC143C, 0 0 40px #8B0000;
    letter-spacing: 3px;
    text-decoration: none;
  }
  .dl-logo-orb {
    width: 34px; height: 34px; border-radius: 50%;
    background: radial-gradient(circle, rgba(139,0,0,0.4), rgba(80,0,80,0.2));
    border: 1px solid #8B0000;
    display: flex; align-items: center; justify-content: center;
    font-size: 18px;
    animation: orbit-pulse-glow 3s ease-in-out infinite;
  }
  .dl-navbar-right {
    display: flex; align-items: center; gap: 8px;
  }
  .dl-nav-btn {
    display: flex; align-items: center; gap: 6px;
    padding: 7px 14px; border-radius: 6px; cursor: pointer;
    font-family: 'Cinzel', serif; font-size: 11px; font-weight: 600;
    letter-spacing: 1.5px; text-transform: uppercase;
    color: var(--text2, #A89BB0); border: none; background: transparent;
    transition: all 0.3s ease;
  }
  .dl-nav-btn:hover { color: #DC143C; background: rgba(139,0,0,0.1); }
  .dl-avatar-btn {
    width: 36px; height: 36px; border-radius: 50%;
    border: 2px solid rgba(139,0,0,0.4);
    overflow: hidden; cursor: pointer;
    background: var(--surface2, #141420);
    transition: border-color 0.3s;
    flex-shrink: 0;
  }
  .dl-avatar-btn:hover { border-color: #DC143C; }

  /* ── MAIN BODY ── */
  .dl-body {
    flex: 1; position: relative; z-index: 1;
    padding: 32px 40px 40px;
    max-width: 1400px; margin: 0 auto; width: 100%;
  }

  /* ── WELCOME HEADER ── */
  .dl-header { margin-bottom: 32px; }
  .dl-status-line {
    display: flex; align-items: center; gap: 10px;
    margin-bottom: 12px;
  }
  .dl-status-line::before {
    content: ''; display: block; width: 40px; height: 1px;
    background: linear-gradient(90deg, transparent, #DC143C);
  }
  .dl-status-text {
    font-family: 'Cinzel', serif; font-size: 9px; font-weight: 700;
    letter-spacing: 4px; text-transform: uppercase; color: #DC143C;
  }
  .dl-status-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: #DC143C; box-shadow: 0 0 8px #DC143C;
    animation: status-blink 2s ease-in-out infinite;
  }
  @keyframes status-blink {
    0%,100% { opacity:1; } 50% { opacity:0.4; }
  }
  .dl-title {
    font-family: 'Cinzel Decorative', cursive;
    font-size: clamp(28px, 5vw, 56px);
    font-weight: 900; letter-spacing: 3px; line-height: 1.05;
    color: var(--text, #F0E6D3);
    text-shadow: 0 0 40px rgba(220,20,60,0.4);
    margin-bottom: 8px;
  }
  .dl-title span { color: #DC143C; text-shadow: 0 0 30px #DC143C, 0 0 60px #8B0000; }
  .dl-sub {
    font-family: 'IM Fell English', serif; font-style: italic;
    font-size: 14px; color: var(--text2, #A89BB0); letter-spacing: 1px;
  }
  .dl-ornament {
    text-align: center; color: rgba(139,0,0,0.3);
    font-size: 18px; letter-spacing: 12px;
    margin: 20px 0; text-shadow: 0 0 10px #8B0000; user-select: none;
  }

  /* ── CARDS GRID ── */
  .dl-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
    width: 100%;
  }
  .dl-card {
    background: linear-gradient(135deg, rgba(16,16,26,0.98), rgba(8,8,12,1));
    border: 1px solid rgba(139,0,0,0.25);
    border-radius: 20px;
    padding: 24px;
    cursor: pointer; position: relative; overflow: hidden;
    transition: all 0.4s cubic-bezier(0.23,1,0.32,1);
    display: flex; flex-direction: column; gap: 10px;
    text-decoration: none; color: inherit;
    min-height: 160px;
    animation: orbit-fade-up .32s ease both;
  }
  .dl-card:nth-child(2) { animation-delay: .06s; }
  .dl-card:nth-child(3) { animation-delay: .12s; }
  .dl-card:nth-child(4) { animation-delay: .18s; }
  .dl-card::before {
    content: ''; position: absolute; inset: 0; border-radius: 20px;
    background: radial-gradient(ellipse at top left, rgba(139,0,0,0.1), transparent 60%);
    opacity: 0; transition: opacity 0.4s; pointer-events: none;
  }
  .dl-card:hover::before { opacity: 1; }
  .dl-card:hover {
    transform: translateY(-4px);
    border-color: rgba(220,20,60,0.45);
    box-shadow: 0 20px 60px rgba(139,0,0,0.2), 0 0 30px rgba(139,0,0,0.12);
  }
  .dl-card.spotify {
    background: linear-gradient(160deg, rgba(14,24,14,0.99), rgba(6,12,6,1));
    border-color: rgba(20,100,20,0.3);
  }
  .dl-card.spotify:hover { border-color: rgba(30,180,30,0.4); }
  .dl-card-icon {
    width: 56px; height: 56px; border-radius: 16px;
    display: flex; align-items: center; justify-content: center;
    font-size: 28px; flex-shrink: 0;
    box-shadow: 0 0 20px currentColor; opacity: 0.9;
  }
  .icon-chat    { background: linear-gradient(135deg,#7E22CE,#4C1D95); color: #D8B4FE; }
  .icon-nexus   { background: linear-gradient(135deg,#8B0000,#5A0000); color: #FCA5A5; }
  .icon-notify  { background: linear-gradient(135deg,#EA580C,#9A3412); color: #FDBA74; }
  .icon-spotify { background: #1a3a1a; color: #1DB954; }
  .icon-profile { background: linear-gradient(135deg,#0369A1,#075985); color: #7DD3FC; }
  .icon-search  { background: linear-gradient(135deg,#059669,#064E3B); color: #6EE7B7; }
  .dl-card-title {
    font-family: 'Cinzel', serif; font-size: 14px; font-weight: 700;
    letter-spacing: 2px; text-transform: uppercase; color: var(--text, #F0E6D3);
  }
  .dl-card-desc {
    font-family: 'IM Fell English', serif; font-size: 13px;
    font-style: italic; color: var(--text2, #A89BB0); line-height: 1.7;
  }
  .dl-card-arrow {
    position: absolute; bottom: 20px; right: 20px;
    color: rgba(139,0,0,0.4); font-size: 16px; transition: all 0.3s;
  }
  .dl-card:hover .dl-card-arrow { color: #DC143C; transform: translate(3px,-3px); }

  /* ── RESPONSIVE ── */
  @media (max-width: 480px) {
    .dl-navbar { padding: 0 14px; }
    .dl-nav-btn span { display: none; }
    .dl-nav-btn { padding: 7px 10px; }
    .dl-body { padding: 20px 14px 90px; } /* 90px = bottom-nav clearance */
    .dl-grid { grid-template-columns: 1fr; gap: 12px; }
    .dl-title { font-size: clamp(22px,8vw,36px); }
    .dl-card { min-height: 120px; padding: 18px; }
  }

  @media (min-width: 481px) and (max-width: 768px) {
    .dl-body { padding: 24px 20px 32px; }
    .dl-grid { grid-template-columns: 1fr 1fr; }
    .dl-title { font-size: 36px; }
  }

  @media (min-width: 769px) and (max-width: 1024px) {
    .dl-body { padding: 28px 32px 32px; }
    .dl-grid { gap: 14px; }
  }

  @media (min-width: 1025px) {
    .dl-body { padding: 40px 48px; }
    .dl-grid { grid-template-columns: repeat(3, 1fr); }
  }
`;

export default function DreamlandPage() {
  const navigate    = useNavigate();
  const bp          = useBreakpoint();
  const mobile      = isMobileOrTablet(bp);
  const authUser    = useAuthStore((s) => s.authUser);
  const logout      = useAuthStore((s) => s.logout);
  const nexusUnread = useNexusStore((s) => s.nexusUnread);
  const unreadCount = Object.values(nexusUnread || {}).reduce((a, v) => a + v, 0);

  const cards = [
    { id: "chat",    icon: "✉", cls: "icon-chat",    title: "Messages",      desc: "End-to-end encrypted threads with your contacts.", path: "/chat" },
    { id: "nexus",   icon: "◎", cls: "icon-nexus",   title: "Nexus",         desc: "Encrypted group constellations for your circle.", path: "/chat" },
    { id: "spotify", icon: "♫", cls: "icon-spotify", title: "Orbit Sync",    desc: "Share and sync music in real-time with anyone.", path: "/spotify", extra: "spotify" },
    { id: "search",  icon: "⊕", cls: "icon-search",  title: "Discovery",     desc: "Find and connect with other users in the orbit.", path: "/search" },
    { id: "notify",  icon: "🔔", cls: "icon-notify",  title: "Alerts",        desc: "Stay updated with notifications across all channels.", path: "/notifications" },
    { id: "profile", icon: "◈", cls: "icon-profile", title: "Identity",      desc: "Your persona, keys, and presence in the Orbit.", path: "/profile" },
  ];

  return (
    <>
      <style>{CSS}</style>
      <div className="dl-root">
        <div className="dl-atmosphere" aria-hidden="true" />
        <div className="dl-drip" aria-hidden="true" />

        {/* NAVBAR */}
        <nav className="dl-navbar">
          <span className="dl-logo" role="img" aria-label="Orbit">
            <span className="dl-logo-orb">🌑</span>
            ORBIT
          </span>
          <div className="dl-navbar-right">
            {!mobile && (
              <>
                <button className="dl-nav-btn" onClick={() => navigate("/settings")} id="dl-nav-settings">
                  <span>Settings</span>
                </button>
                <button className="dl-nav-btn" onClick={logout} id="dl-nav-logout">
                  <span>Exit</span>
                </button>
              </>
            )}
            <button
              className="dl-avatar-btn"
              onClick={() => navigate("/profile")}
              id="dl-avatar-btn"
              aria-label="Profile"
            >
              {authUser?.profilePic
                ? <img src={authUser.profilePic} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <span style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontSize: "16px" }}>◈</span>
              }
            </button>
          </div>
        </nav>

        {/* BODY */}
        <main className="dl-body">
          <header className="dl-header">
            <div className="dl-status-line">
              <div className="dl-status-dot" />
              <span className="dl-status-text">Connection Established</span>
            </div>
            <h1 className="dl-title">
              DREAM<span>LAND</span>
            </h1>
            <p className="dl-sub">
              Welcome back, {authUser?.username || "Traveller"} — your orbit awaits.
            </p>
          </header>

          <div className="dl-ornament" aria-hidden="true">✦ ✦ ✦</div>

          <div className="dl-grid" role="list">
            {cards.map((card) => (
              <button
                key={card.id}
                className={`dl-card${card.extra ? ` ${card.extra}` : ""}`}
                onClick={() => navigate(card.path)}
                id={`dl-card-${card.id}`}
                role="listitem"
                aria-label={card.title}
              >
                <div className={`dl-card-icon ${card.cls}`}>{card.icon}</div>
                <div className="dl-card-title">{card.title}</div>
                <div className="dl-card-desc">{card.desc}</div>
                <span className="dl-card-arrow" aria-hidden="true">↗</span>
              </button>
            ))}
          </div>
        </main>

        {/* BOTTOM NAV — mobile only */}
        {mobile && (
          <BottomNav
            active="home"
            onNavigate={(tab) => {
              if (tab === "home")          navigate("/");
              else if (tab === "chat")     navigate("/chat");
              else if (tab === "nexus")    navigate("/chat");
              else if (tab === "notifications") navigate("/notifications");
              else if (tab === "settings") navigate("/settings");
            }}
            unread={{ nexus: unreadCount }}
          />
        )}
      </div>
    </>
  );
}
