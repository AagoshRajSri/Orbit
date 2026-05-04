/**
 * ORBIT BOTTOM NAV — mobile (≤ 480px) persistent navigation bar
 * Matches the dark Vampire theme from darkTheme.jsx.
 * Respects env(safe-area-inset-bottom) for iPhone notch.
 *
 * Usage:
 *   <BottomNav active="home" onNavigate={(tab) => navigate(`/${tab}`)} />
 */

import { useBreakpoint } from "../../lib/useBreakpoint";

const NAV_ITEMS = [
  { id: "home",          icon: "⊞", label: "Orbit"    },
  { id: "chat",         icon: "✉", label: "Messages" },
  { id: "nexus",        icon: "◎", label: "Nexus"    },
  { id: "notifications",icon: "🔔", label: "Alerts"   },
  { id: "settings",     icon: "⚙", label: "Settings" },
];

const CSS = `
  .orb-bottom-nav {
    position: fixed;
    bottom: 0; left: 0; right: 0;
    z-index: 200;
    display: flex;
    align-items: center;
    justify-content: space-around;
    background: var(--surface, #0F0F18);
    border-top: 1px solid var(--border, rgba(139,0,0,0.25));
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    padding-bottom: max(8px, env(safe-area-inset-bottom));
    padding-top: 6px;
    box-shadow: 0 -4px 24px rgba(0,0,0,0.4);
  }
  .orb-bottom-nav-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    padding: 6px 4px;
    cursor: pointer;
    border-radius: 10px;
    transition: all 0.2s ease;
    -webkit-tap-highlight-color: transparent;
    position: relative;
  }
  .orb-bottom-nav-icon {
    font-size: 1.3rem;
    line-height: 1;
    transition: transform 0.2s ease;
  }
  .orb-bottom-nav-label {
    font-size: 0.6rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    font-family: var(--font, sans-serif);
    font-weight: 700;
    color: var(--text3, #7B6E8A);
    transition: color 0.2s;
  }
  .orb-bottom-nav-item.active .orb-bottom-nav-icon {
    transform: scale(1.15) translateY(-2px);
    filter: drop-shadow(0 0 8px var(--acc));
  }
  .orb-bottom-nav-item.active .orb-bottom-nav-label {
    color: var(--acc, #DC143C);
  }
  .orb-bottom-nav-pip {
    position: absolute;
    top: 4px; right: calc(50% - 18px);
    width: 8px; height: 8px;
    border-radius: 50%;
    background: var(--acc, #DC143C);
    box-shadow: 0 0 8px var(--acc);
    animation: orbit-pulse-glow 2s ease-in-out infinite;
  }

  /* Only show on mobile */
  @media (min-width: 481px) {
    .orb-bottom-nav { display: none !important; }
  }
`;

export function BottomNav({ active = "home", onNavigate, unread = {} }) {
  return (
    <>
      <style>{CSS}</style>
      <nav className="orb-bottom-nav" role="navigation" aria-label="Main navigation">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            id={`bottom-nav-${item.id}`}
            className={`orb-bottom-nav-item${active === item.id ? " active" : ""}`}
            onClick={() => onNavigate?.(item.id)}
            aria-label={item.label}
            aria-current={active === item.id ? "page" : undefined}
          >
            {unread[item.id] > 0 && <span className="orb-bottom-nav-pip" aria-hidden="true" />}
            <span className="orb-bottom-nav-icon">{item.icon}</span>
            <span className="orb-bottom-nav-label">{item.label}</span>
          </button>
        ))}
      </nav>
    </>
  );
}

/**
 * ORBIT DRAWER — shared slide-in sheet primitive (used by Settings, Music, etc.)
 * Matches foundation's drawer pattern exactly.
 */
const DRAWER_CSS = `
  .orb-drawer-overlay {
    display: none;
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.55);
    z-index: 150;
    backdrop-filter: blur(3px);
    -webkit-backdrop-filter: blur(3px);
    animation: orbit-fade-up .2s ease;
  }
  .orb-drawer-overlay.open { display: block; }
  .orb-drawer {
    position: fixed;
    top: 0; left: 0; bottom: 0;
    width: min(300px, 85vw);
    z-index: 151;
    background: var(--surface, #0F0F18);
    border-right: 1px solid var(--border);
    box-shadow: 4px 0 40px rgba(0,0,0,0.6);
    transform: translateX(-100%);
    transition: transform 0.28s cubic-bezier(0.4,0,0.2,1);
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    padding-top: max(16px, env(safe-area-inset-top));
  }
  .orb-drawer.open { transform: translateX(0); }

  /* Right-side drawer variant */
  .orb-drawer.right {
    left: auto; right: 0;
    border-right: none;
    border-left: 1px solid var(--border);
    box-shadow: -4px 0 40px rgba(0,0,0,0.6);
    transform: translateX(100%);
  }
  .orb-drawer.right.open { transform: translateX(0); }
`;

export function OrbitDrawer({ open, onClose, children, side = "left" }) {
  return (
    <>
      <style>{DRAWER_CSS}</style>
      <div
        className={`orb-drawer-overlay${open ? " open" : ""}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={`orb-drawer ${side}${open ? " open" : ""}`}
        role="dialog"
        aria-modal="true"
      >
        {children}
      </div>
    </>
  );
}
