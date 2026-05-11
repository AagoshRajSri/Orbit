import React, { useEffect, useRef, useState, useMemo, memo } from "react";
import UniversalChatContainer from "../components/chat/UniversalChatContainer";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Globe, Settings, User, LogOut, Music, Bell, Shield, Layers,
  Coffee, Play, SkipForward, SkipBack, MessageCircle, Maximize2,
  Compass, CheckCircle2, ArrowLeft, Gamepad2, Lock,
  Target, Users, SlidersHorizontal, UserCircle, ChevronRight,
  Edit, Calendar, BadgeCheck, Palette, Waves, Pin
} from "lucide-react";

import { useSettingsStore } from "../store/useSettingsStore";
import { spotifyService } from "../services/spotifyService";
import { useAuthStore } from "../store/useAuthStore";
import { useSpotifyStore } from "../store/useSpotifyStore";
import { THEMES, THEME_LABELS } from "../constants";
import LightThemeLayout from "../components/layout/themes/light/LightThemeLayout";
import NexusActionOverlay from "../components/nexus/NexusActionOverlay";
import { PixelAvatarBadge } from "../components/avatar/PixelAvatar/PixelAvatarBadge.jsx";

export default function LightTheme({ children }) {
  return <LightThemeLayout children={children} />;
}

const LUXURY_COLORS = {
  canvas: "#F8F5EF",
  surface: "#FFFFFF",
  surfaceHover: "#FAFAF8",
  textPrimary: "#1C1C1C",
  textSecondary: "#6B6560",
  goldLight: "#E8D5B5",
  goldMedium: "#C9A87C",
  goldDark: "#9E7A4F",
  borderSubtle: "#EAE4D8",
  accentMute: "#ECEADE",
  accentPink: "#E8D0D0",
  shadowSoft: "0 8px 24px rgba(150, 135, 118, 0.07)",
  shadowMedium: "0 14px 36px rgba(150, 135, 118, 0.13)",
};

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Outfit:wght@300;400;500;600;700;800&family=Inter:wght@300;400;500;600&display=swap');

.luxury-root {
  font-family: 'Inter', 'Outfit', sans-serif;
  color: ${LUXURY_COLORS.textPrimary};
  background-color: ${LUXURY_COLORS.canvas};
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

.luxury-root::before {
  content: "";
  position: absolute;
  inset: 0;
  backgroundImage: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");
  opacity: 0.5;
  pointer-events: none;
  z-index: 0;
}

.font-playfair {
  font-family: 'Playfair Display', serif;
}

.luxury-card-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0) 100%);
  opacity: 0.5;
  pointer-events: none;
  transition: opacity 0.3s;
}

.luxury-card:hover .luxury-card-overlay {
  opacity: 1;
}

.rich-icon-wrapper {
  position: relative;
  overflow: hidden;
}
.rich-icon-wrapper::after {
  content: "";
  position: absolute;
  top: -50%; left: -50%; right: -50%; bottom: -50%;
  background: conic-gradient(from 0deg, transparent 0deg, rgba(255,255,255,0.8) 45deg, transparent 90deg);
  animation: rotate-shine 4s linear infinite;
  opacity: 0.4;
}

@keyframes rotate-shine {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Custom Scrollbar */
.luxury-scroll::-webkit-scrollbar { width: 4px; }
.luxury-scroll::-webkit-scrollbar-track { background: transparent; }
.luxury-scroll::-webkit-scrollbar-thumb { background: ${LUXURY_COLORS.goldMedium}; border-radius: 0; opacity: 0.5; }
.luxury-scroll::-webkit-scrollbar-thumb:hover { background: ${LUXURY_COLORS.goldDark}; }

.luxury-scroll-hide::-webkit-scrollbar { display: none; }
.luxury-scroll-hide { -ms-overflow-style: none; scrollbar-width: none; }

.menu-item-hover:hover { background: ${LUXURY_COLORS.surfaceHover} !important; transform: translateX(4px); }
.menu-item-hover-danger:hover { background: #FFF5F5 !important; transform: translateX(4px); }

@keyframes popupFade {
  from { opacity: 0; transform: scale(0.95) translateY(-10px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}


.luxury-card {
  background: ${LUXURY_COLORS.surface};
  border: 1px solid ${LUXURY_COLORS.borderSubtle};
  border-radius: 20px;
  box-shadow: ${LUXURY_COLORS.shadowSoft};
  transition: all 0.3s ease;
  position: relative;
  /* overflow: hidden; -- Removed to allow menus to float outside */
}

.luxury-card:hover {
  box-shadow: ${LUXURY_COLORS.shadowMedium};
  transform: translateY(-2px);
  border-color: ${LUXURY_COLORS.goldMedium};
}

.luxury-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 12px;
  font-weight: 500;
  font-size: 13px;
  letter-spacing: 0.5px;
  transition: all 0.3s ease;
  cursor: pointer;
  border: none;
}

.btn-gold {
  background: linear-gradient(135deg, ${LUXURY_COLORS.goldMedium}, ${LUXURY_COLORS.goldDark});
  color: white;
  box-shadow: 0 4px 15px rgba(168, 130, 87, 0.3);
}
.btn-gold:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(168, 130, 87, 0.4);
}

.btn-pill {
  background: ${LUXURY_COLORS.accentMute};
  color: ${LUXURY_COLORS.textPrimary};
  border-radius: 24px;
}
.btn-pill:hover { background: ${LUXURY_COLORS.goldLight}; color: ${LUXURY_COLORS.goldDark}; }

.btn-pill-pink {
  background: ${LUXURY_COLORS.accentPink};
  color: #7A4242;
  border-radius: 24px;
}
.btn-pill-pink:hover { background: #DCA9A9; }

.luxury-nav {
  padding: 20px 40px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  z-index: 10;
}

.board-container {
  flex: 1;
  margin: 0 40px 40px;
  border-radius: 32px;
  background: ${LUXURY_COLORS.surface};
  box-shadow: 0 20px 60px rgba(140, 125, 110, 0.12);
  border: 1px solid ${LUXURY_COLORS.goldLight};
  position: relative;
  z-index: 10;
  display: flex;
  overflow: hidden;
}

.luxury-input {
  width: 100%;
  padding: 16px 20px;
  border-radius: 12px;
  border: 1px solid ${LUXURY_COLORS.borderSubtle};
  background: ${LUXURY_COLORS.surfaceHover};
  font-family: inherit;
  font-size: 15px;
  color: ${LUXURY_COLORS.textPrimary};
  outline: none;
  transition: all 0.3s ease;
}
.luxury-input:focus {
  border-color: ${LUXURY_COLORS.goldMedium};
  box-shadow: inset 0 0 0 1px ${LUXURY_COLORS.goldMedium};
  background: ${LUXURY_COLORS.surface};
}

/* Chat Overrides inside Light Theme */
[data-theme="light"] {
  --color-base-100: ${LUXURY_COLORS.surface};
  --color-base-200: ${LUXURY_COLORS.canvas};
  --color-base-300: ${LUXURY_COLORS.canvas};
  --color-base-content: ${LUXURY_COLORS.textPrimary};
  --color-primary: ${LUXURY_COLORS.goldMedium};
}

/* Aero Light Mode UI Chat Overrides */
.luxury-root .nexus-chat-container {
  background: rgba(255,255,255,0.7) !important;
  backdrop-filter: blur(20px) !important;
  background-image: 
    linear-gradient(rgba(0, 123, 255, 0.1) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 123, 255, 0.1) 1px, transparent 1px) !important;
  background-size: 30px 30px !important;
}
.luxury-root .nexus-chat-header {
  background: rgba(255,255,255,0.85) !important;
  backdrop-filter: blur(12px) !important;
  border-bottom: 2px solid #C0C0C0 !important;
  color: #333 !important;
  border-radius: 12px 12px 0 0 !important;
}
.luxury-root .nxc-name { color: #333 !important; }
.luxury-root .nxc-utility-group,
.luxury-root .nxc-telemetry-capsule {
  background: rgba(255,255,255,0.9) !important;
  border: 1px solid #EAE5DC !important;
  box-shadow: 0 4px 10px rgba(0,0,0,0.05), inset 0 2px 4px rgba(255,255,255,0.5) !important;
  border-radius: 9999px !important; /* Soft circular buttons container */
  color: #333 !important;
}
.luxury-root .nxc-utility-group {
  gap: 8px !important;
  padding: 6px 12px !important;
}
.luxury-root .nxc-hbtn, .luxury-root .nxc-aero-btn {
  background: #ffffff !important;
  border-radius: 50% !important;
  width: 32px !important; height: 32px !important;
  box-shadow: 0 2px 5px rgba(0,0,0,0.08) !important;
  color: #333 !important; border: 1px solid #EAE5DC !important;
  display: flex !important; align-items: center !important; justify-content: center !important;
}
.luxury-root .nxc-aero-btn { width: auto !important; border-radius: 16px !important; padding: 0 12px !important; }
.luxury-root .nxc-utility-group .bg-white\\/20 { background: #C0C0C0 !important; } /* Frosted Silver dividers */
.luxury-root .text-[#5dcaa5] { color: #2A52BE !important; }
.luxury-root .nxc-signal-bars .nxc-bar { background-color: #2A52BE !important; }

/* Responsive Overrides */
@media (max-width: 768px) {
  .luxury-nav {
    padding: 12px 16px;
  }
  .board-container {
    margin: 0;
    border-radius: 0;
    border: none;
    flex-direction: column;
    box-shadow: none;
  }
  .board-container.chat-inactive {
    overflow-y: auto;
  }
  .board-container.chat-active {
    overflow: hidden;
  }
  .sidebar-container {
    width: 100% !important;
    border-right: none !important;
    border-bottom: none !important;
    flex: 1 !important;
  }
  .sidebar-container.chat-active {
    display: none !important;
  }
  .chat-area-wrapper {
    min-height: 600px;
  }
  .luxury-nav span {
    font-size: 18px !important;
  }
}

/* ══════════ MOBILE LIGHT THEME ══════════ */
@media (min-width: 769px) {
  .lm-mobile-only { display: none !important; }
}
@media (max-width: 768px) {
  .lm-desktop-only { display: none !important; }
  .luxury-nav { display: none !important; }
  .luxury-root { overflow: unset; }
}

.lm-mobile-canvas {
  display: flex;
  flex-direction: column;
  height: 100dvh;
  max-height: 100dvh;
  overflow: hidden;
  background: #EDE8DF;
  font-family: 'Inter', 'Outfit', sans-serif;
  position: relative;
}

.lm-mobile-nav {
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  background: #EDE8DF;
  flex-shrink: 0;
  position: relative;
  z-index: 10;
}

.lm-mobile-nav-center {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  font-family: 'Playfair Display', serif;
  font-size: 22px;
  font-weight: 700;
  color: #1C1C1C;
  pointer-events: none;
  white-space: nowrap;
}

.lm-mobile-scroll {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 12px 16px 100px;
  -webkit-overflow-scrolling: touch;
}
.lm-mobile-scroll::-webkit-scrollbar { display: none; }

.lm-tab-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 72px;
  background: #FFFFFF;
  border-top: 1px solid #EAE4D8;
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 0 4px;
  z-index: 999;
}

.lm-tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  flex: 1;
  padding: 6px 4px;
  background: none;
  border: none;
  cursor: pointer;
  color: #6B6560;
  font-family: 'Inter', sans-serif;
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  transition: color 0.2s;
  -webkit-tap-highlight-color: transparent;
}
.lm-tab.active { color: #1C1C1C; }

.lm-tab-active-pill {
  background: #B8924A;
  border-radius: 14px;
  padding: 8px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  color: #FFFFFF;
}

.lm-card {
  background: #FFFFFF;
  border-radius: 20px;
  border: 1px solid #EAE4D8;
  box-shadow: 0 2px 12px rgba(140,120,90,0.06);
  overflow: hidden;
  position: relative;
}

.lm-icon-box {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: #F0ECE4;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.lm-label {
  display: block;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1.2px;
  text-transform: uppercase;
  color: #8A8480;
  margin-bottom: 10px;
}

.lm-input {
  width: 100%;
  padding: 14px 16px;
  border-radius: 12px;
  border: 1px solid #E8E3D8;
  background: #F8F5EE;
  font-family: 'Inter', sans-serif;
  font-size: 15px;
  color: #1C1C1C;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.2s;
}
.lm-input:focus { border-color: #C9A87C; background: #FFFFFF; }

.lm-textarea {
  width: 100%;
  padding: 14px 16px;
  border-radius: 12px;
  border: 1px solid #E8E3D8;
  background: #F8F5EE;
  font-family: 'Inter', sans-serif;
  font-size: 15px;
  color: #1C1C1C;
  outline: none;
  resize: none;
  box-sizing: border-box;
  line-height: 1.5;
  transition: border-color 0.2s;
}
.lm-textarea:focus { border-color: #C9A87C; background: #FFFFFF; }

.lm-toggle {
  width: 50px;
  height: 28px;
  border-radius: 14px;
  position: relative;
  cursor: pointer;
  transition: background 0.3s;
  flex-shrink: 0;
}
.lm-toggle-thumb {
  position: absolute;
  top: 3px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: white;
  box-shadow: 0 2px 5px rgba(0,0,0,0.2);
  transition: left 0.3s;
}
`;

/* ─────────────────────────────── CORE COMPONENTS ─────────────────────────────── */

const TopNav = memo(({ handleLogout, hiddenNexuses, onReveal }) => {
  const navigate = useNavigate();

  return (
    <div className="luxury-nav" style={{ display: 'flex', alignItems: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => navigate('/')}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: 'linear-gradient(135deg, #DFCAAE, #A88257)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 10px rgba(168, 130, 87, 0.3)'
        }}>
          <Globe size={18} color="white" />
        </div>
        <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: '0.5px' }}>Orbit</span>
      </div>

      {/* ── Centered Globes Gap ── */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 80, height: '100%', pointerEvents: 'none' }}>
        {(hiddenNexuses || []).map((nexus, i) => (
          <div key={nexus._id} style={{ pointerEvents: 'auto' }}>
            <HiddenNexusGlobe
              nexus={nexus}
              index={i}
              totalCount={hiddenNexuses.length}
              onReveal={onReveal}
            />
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '12px' }}>
        <button onClick={() => navigate('/settings')} className="luxury-button btn-pill-pink" style={{ padding: '8px 16px' }}>
          <Settings size={14} /> Settings
        </button>
        <button onClick={() => navigate('/profile')} className="luxury-button btn-pill-pink" style={{ padding: '8px 16px' }}>
          <User size={14} /> Profile
        </button>
        <button onClick={handleLogout} className="luxury-button btn-pill" style={{ padding: '8px 16px' }}>
          <LogOut size={14} /> Logout
        </button>
      </div>
    </div>
  );
});

// ── Hidden Nexus Globe ──────────────────────────────────────────────────
const HiddenNexusGlobe = memo(({ nexus, onReveal, index, totalCount }) => {
  const [grabbed, setGrabbed] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const domRef = useRef(null);
  const offsetRef = useRef({ ox: 0, oy: 0 });
  const clickTimerRef = useRef(null);
  const pendingRevealRef = useRef(false);

  useEffect(() => {
    if (!grabbed) return;
    const onMove = (e) => {
      setPos({ x: e.clientX - offsetRef.current.ox, y: e.clientY - offsetRef.current.oy });
    };
    const onUp = () => setGrabbed(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [grabbed]);

  const handleMouseDown = (e) => {
    if (e.detail === 2) {
      e.preventDefault();
      e.stopPropagation();
      pendingRevealRef.current = false;
      clearTimeout(clickTimerRef.current);
      const rect = domRef.current.getBoundingClientRect();
      setPos({ x: rect.left, y: rect.top });
      offsetRef.current = { ox: e.clientX - rect.left, oy: e.clientY - rect.top };
      setGrabbed(true);
    }
  };

  const handleClick = (e) => {
    e.stopPropagation();
    if (grabbed) return;
    pendingRevealRef.current = true;
    clearTimeout(clickTimerRef.current);
    clickTimerRef.current = setTimeout(() => {
      if (pendingRevealRef.current) onReveal(nexus._id);
    }, 250);
  };

  return (
    <div
      ref={domRef}
      style={{
        position: grabbed ? 'fixed' : 'relative',
        left: grabbed ? pos.x : 'auto',
        top: grabbed ? pos.y : 'auto',
        zIndex: 9999,
        cursor: grabbed ? 'grabbing' : 'pointer',
        userSelect: 'none',
        touchAction: 'none',
        filter: grabbed
          ? 'drop-shadow(0 0 20px #C9A87C) drop-shadow(0 0 40px rgba(201,168,124,0.6))'
          : 'drop-shadow(0 0 6px rgba(201,168,124,0.4))',
        transition: grabbed ? 'none' : 'filter 0.3s',
        width: 44,
        height: 44,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'white',
        borderRadius: '12px',
        border: `1px solid ${LUXURY_COLORS.goldMedium}`,
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
      }}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      onDragStart={(e) => e.preventDefault()}
    >
      <Globe size={20} color={LUXURY_COLORS.goldDark} />
    </div>
  );
});

const LuxuryWrapper = memo(({ children, hiddenNexuses, onReveal, handleLogout }) => {
  const rootRef = useRef(null);
  const { logout } = useAuthStore();

  const onLogout = async () => {
    if (handleLogout) await handleLogout();
    else await logout();
  };

  return (
    <div className="luxury-root" ref={rootRef}>
      <style>{CSS}</style>
      <div className="lm-desktop-only">
        <TopNav
          handleLogout={onLogout}
          hiddenNexuses={hiddenNexuses}
          onReveal={onReveal}
        />
      </div>
      {children}
    </div>
  );
});

const MobileNav = memo(({ title, showBack, onBack, rightIcon, leftIcon, leftLabel }) => {
  return (
    <div className="lm-mobile-nav lm-mobile-only">
      <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
        {showBack && (
          <button onClick={onBack} style={{ background: 'none', border: 'none', padding: '8px 0', display: 'flex', alignItems: 'center', gap: 6, color: '#1C1C1C', cursor: 'pointer', fontFamily: 'Inter', fontSize: 14 }}>
            <ArrowLeft size={20} strokeWidth={1.5} />
            {leftLabel && <span style={{ fontWeight: 400 }}>{leftLabel}</span>}
          </button>
        )}
        {!showBack && leftIcon && leftIcon}
      </div>
      <div className="lm-mobile-nav-center">{title}</div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
        {rightIcon}
      </div>
    </div>
  );
});

const MobileTabBar = memo(({ activeTab }) => {
  const navigate = useNavigate();
  return (
    <div className="lm-tab-bar lm-mobile-only">
      <button className={`lm-tab ${activeTab === 'home' || activeTab === 'orbits' ? 'active' : ''}`} onClick={() => navigate('/?tab=home')}>
        <div className={activeTab === 'home' || activeTab === 'orbits' ? 'lm-tab-active-pill' : ''}>
          <Compass size={activeTab === 'home' || activeTab === 'orbits' ? 18 : 22} strokeWidth={activeTab === 'home' || activeTab === 'orbits' ? 2.5 : 1.5} />
          {(activeTab === 'home' || activeTab === 'orbits') && <span>Orbits</span>}
        </div>
        {(activeTab !== 'home' && activeTab !== 'orbits') && <span style={{ marginTop: 4 }}>Orbits</span>}
      </button>
      <button className={`lm-tab ${activeTab === 'contacts' ? 'active' : ''}`} onClick={() => navigate('/?tab=contacts')}>
        <div className={activeTab === 'contacts' ? 'lm-tab-active-pill' : ''}>
          <Users size={activeTab === 'contacts' ? 18 : 22} strokeWidth={activeTab === 'contacts' ? 2.5 : 1.5} />
          {activeTab === 'contacts' && <span>Contacts</span>}
        </div>
        {activeTab !== 'contacts' && <span style={{ marginTop: 4 }}>Contacts</span>}
      </button>
      <button className={`lm-tab ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => navigate('/settings')}>
        <div className={activeTab === 'settings' ? 'lm-tab-active-pill' : ''}>
          <SlidersHorizontal size={activeTab === 'settings' ? 18 : 22} strokeWidth={activeTab === 'settings' ? 2.5 : 1.5} />
          {activeTab === 'settings' && <span>Settings</span>}
        </div>
        {activeTab !== 'settings' && <span style={{ marginTop: 4 }}>Settings</span>}
      </button>
      <button className={`lm-tab ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => navigate('/profile')}>
        <div className={activeTab === 'profile' ? 'lm-tab-active-pill' : ''}>
          <UserCircle size={activeTab === 'profile' ? 18 : 22} strokeWidth={activeTab === 'profile' ? 2.5 : 1.5} />
          {activeTab === 'profile' && <span>Profile</span>}
        </div>
        {activeTab !== 'profile' && <span style={{ marginTop: 4 }}>Profile</span>}
      </button>
    </div>
  );
});

const LuxurySidebar = memo(({ nexuses, selectedNexus, setSelectedNexus, users, selectedUser, setSelectedUser, setNexusActionView, toggleHide, hiddenNexuses, forcedTab }) => {
  const navigate = useNavigate();
  const [internalTab, setInternalTab] = useState(forcedTab || 'orbits');
  const tab = internalTab;
  const setTab = (t) => {
    setInternalTab(t);
    // Only navigate if we're not on mobile (which passes forcedTab)
    if (!forcedTab) navigate(`/?tab=${t}`);
  };

  const [pinnedNexuses, setPinnedNexuses] = useState(() => {
    return JSON.parse(localStorage.getItem('luxury_pinned_nexuses') || '[]');
  });
  const [nexusColors, setNexusColors] = useState(() => {
    return JSON.parse(localStorage.getItem('luxury_nexus_colors') || '{}');
  });
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [activeColorPickerId, setActiveColorPickerId] = useState(null);

  const togglePin = (id, e) => {
    e.stopPropagation();
    const next = pinnedNexuses.includes(id) ? pinnedNexuses.filter(pid => pid !== id) : [...pinnedNexuses, id];
    setPinnedNexuses(next);
    localStorage.setItem('luxury_pinned_nexuses', JSON.stringify(next));
    setActiveMenuId(null);
  };

  const updateColor = (id, color, e) => {
    e.stopPropagation();
    const next = { ...nexusColors, [id]: color };
    setNexusColors(next);
    localStorage.setItem('luxury_nexus_colors', JSON.stringify(next));
    setActiveColorPickerId(null);
    setActiveMenuId(null);
  };

  const sortedNexuses = useMemo(() => {
    const hiddenIds = (hiddenNexuses || []).map(h => h._id);
    return [...(nexuses || [])]
      .filter(n => !hiddenIds.includes(n._id))
      .sort((a, b) => {
        const aPinned = pinnedNexuses.includes(a._id);
        const bPinned = pinnedNexuses.includes(b._id);
        if (aPinned && !bPinned) return -1;
        if (!aPinned && bPinned) return 1;
        return 0;
      });
  }, [nexuses, pinnedNexuses, hiddenNexuses]);

  // Click outside handler for menus
  useEffect(() => {
    const handleGlobalClick = () => {
      setActiveMenuId(null);
      setActiveColorPickerId(null);
    };
    window.addEventListener("click", handleGlobalClick);
    return () => window.removeEventListener("click", handleGlobalClick);
  }, []);

  return (
    <div className={`sidebar-container ${selectedNexus || selectedUser ? 'chat-active' : ''}`} style={{ width: 320, borderRight: `1px solid ${LUXURY_COLORS.borderSubtle}`, display: 'flex', flexDirection: 'column', background: '#FDFCFB', zIndex: 10 }}>
      {/* Tabs */}
      <div style={{ padding: 24, paddingBottom: 0 }}>
        <div style={{ display: 'flex', borderRadius: 24, border: `1px solid ${LUXURY_COLORS.borderSubtle}`, padding: 4, marginBottom: 20, background: 'white' }}>
          <button
            onClick={() => setTab('orbits')}
            style={{ flex: 1, padding: '8px 0', border: 'none', background: tab === 'orbits' ? LUXURY_COLORS.accentMute : 'transparent', borderRadius: 20, fontWeight: 600, fontSize: 12, cursor: 'pointer', transition: 'all 0.2s', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, color: tab === 'orbits' ? LUXURY_COLORS.textPrimary : LUXURY_COLORS.textSecondary }}
          >
            <Globe size={14} /> ORBITS
          </button>
          <button
            onClick={() => setTab('contacts')}
            style={{ flex: 1, padding: '8px 0', border: 'none', background: tab === 'contacts' ? LUXURY_COLORS.accentMute : 'transparent', borderRadius: 20, fontWeight: 600, fontSize: 12, cursor: 'pointer', transition: 'all 0.2s', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, color: tab === 'contacts' ? LUXURY_COLORS.textPrimary : LUXURY_COLORS.textSecondary }}
          >
            <User size={14} /> CONTACTS
          </button>
        </div>

        {/* Action Buttons */}
        {tab === 'orbits' && (
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="luxury-button" onClick={() => setNexusActionView("join")} style={{ flex: 1, background: LUXURY_COLORS.surfaceHover, border: `1px solid ${LUXURY_COLORS.borderSubtle}`, color: LUXURY_COLORS.textPrimary }}>
              # JOIN
            </button>
            <button className="luxury-button btn-gold" onClick={() => setNexusActionView("create")} style={{ flex: 1 }}>
              + NEXUS
            </button>
          </div>
        )}
      </div>

      {/* List Area */}
      <div className="luxury-scroll" style={{ flex: 1, overflowY: 'auto', padding: '12px 24px' }}>
        {tab === 'orbits' ? (
          sortedNexuses.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {sortedNexuses.map((nexus) => (
                <div
                  key={nexus._id}
                  onClick={() => {
                    setSelectedNexus(nexus);
                    setSelectedUser(null);
                    setNexusActionView(null);
                    navigate(`/nexus/${nexus._id}`);
                  }}
                  className="luxury-card"
                  style={{
                    padding: '12px 16px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 0,
                    background: selectedNexus?._id === nexus._id ? LUXURY_COLORS.accentMute : (nexusColors[nexus._id] || LUXURY_COLORS.surface),
                    borderColor: selectedNexus?._id === nexus._id ? LUXURY_COLORS.goldMedium : LUXURY_COLORS.borderSubtle,
                    position: 'relative'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%' }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
                      {nexus.avatar ? (
                        <img src={nexus.avatar} alt={nexus.name} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 12 }} />
                      ) : (
                        (() => {
                          const ANIMALS = ['dog', 'cat', 'bunny'];
                          const animal = ANIMALS[parseInt((nexus._id || "").toString().slice(-4) || '0', 16) % ANIMALS.length];
                          return (
                            <PixelAvatarBadge
                              type={animal}
                              state="idle"
                              size={40}
                              showDot={false}
                              style={{ imageRendering: "pixelated" }}
                            />
                          );
                        })()
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0, paddingRight: 30 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: LUXURY_COLORS.textPrimary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {nexus.name}
                      </div>
                      <div style={{ fontSize: 10, color: LUXURY_COLORS.textSecondary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {nexus.members?.length || 0} Members
                      </div>
                    </div>

                    {/* Pin Indicator */}
                    {pinnedNexuses.includes(nexus._id) && (
                      <div style={{ position: 'absolute', top: 6, left: 6, fontSize: 12, transform: 'rotate(-45deg)' }}>📌</div>
                    )}

                    {/* Context Menu Trigger */}
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenuId(activeMenuId === nexus._id ? null : nexus._id);
                        setActiveColorPickerId(null);
                      }}
                      style={{
                        position: 'absolute',
                        right: 8,
                        top: 24,
                        transform: "translateY(-50%)",
                        cursor: 'pointer',
                        zIndex: 10,
                        padding: 6,
                        opacity: activeMenuId === nexus._id ? 1 : 0.3,
                        transition: 'all 0.3s ease',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: activeMenuId === nexus._id ? LUXURY_COLORS.surfaceHover : 'transparent'
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.opacity = 1;
                        e.currentTarget.style.background = LUXURY_COLORS.surfaceHover;
                      }}
                      onMouseLeave={e => {
                        if (activeMenuId !== nexus._id) {
                          e.currentTarget.style.opacity = 0.3;
                          e.currentTarget.style.background = 'transparent';
                        }
                      }}
                    >
                      <span style={{ fontSize: 16 }}>⚜️</span>
                    </div>
                  </div>

                  {/* Context Menu - Floating Aesthetic Pop-up */}
                  {activeMenuId === nexus._id && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="nexus-popup-menu"
                      style={{
                        position: 'absolute',
                        top: 40,
                        right: 0,
                        width: 220,
                        background: 'white',
                        border: `1px solid ${LUXURY_COLORS.borderSubtle}`,
                        borderRadius: 16,
                        boxShadow: '0 15px 35px rgba(0,0,0,0.12), 0 5px 15px rgba(0,0,0,0.05)',
                        padding: 8,
                        zIndex: 1000,
                        marginTop: 4,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 4,
                        animation: 'popupFade .25s cubic-bezier(0.4, 0, 0.2, 1) forwards',
                        transformOrigin: 'top right'
                      }}
                    >
                      <div style={{ padding: '8px 12px', fontSize: 10, fontWeight: 800, color: LUXURY_COLORS.goldDark, letterSpacing: 1.5, opacity: 0.6 }}>MANAGEMENT</div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveColorPickerId(activeColorPickerId === nexus._id ? null : nexus._id);
                          }}
                          style={{ width: '100%', padding: '10px 14px', background: 'transparent', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, color: LUXURY_COLORS.textPrimary, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, transition: 'all 0.2s' }}
                          className="menu-item-hover"
                        >
                          <Palette size={16} color={LUXURY_COLORS.goldMedium} />
                          Signature Color
                        </button>

                        <button
                          onClick={(e) => togglePin(nexus._id, e)}
                          style={{ width: '100%', padding: '10px 14px', background: 'transparent', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, color: LUXURY_COLORS.textPrimary, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, transition: 'all 0.2s' }}
                          className="menu-item-hover"
                        >
                          <Pin size={16} color={LUXURY_COLORS.goldMedium} />
                          {pinnedNexuses.includes(nexus._id) ? "Detach Pin" : "Pin to Top"}
                        </button>

                        <div style={{ height: 1, background: LUXURY_COLORS.borderSubtle, margin: '4px 0' }} />

                        <button
                          onClick={(e) => toggleHide(nexus, e)}
                          style={{ width: '100%', padding: '10px 14px', background: 'transparent', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, color: '#D06060', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, transition: 'all 0.2s' }}
                          className="menu-item-hover-danger"
                        >
                          <Globe size={16} color="#D06060" />
                          Hide from Sidebar
                        </button>
                      </div>

                      {activeColorPickerId === nexus._id && (
                        <div style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: 8,
                          padding: '12px',
                          background: 'rgba(0,0,0,0.03)',
                          borderRadius: 12,
                          marginTop: 8,
                          width: '100%'
                        }}>
                          {[
                            "#FFFFFF", "#F5F5F5", "#FFF9E6", "#FFF3E0", "#FFEBE0", "#FFE0E0",
                            "#FCE4EC", "#F3E5F5", "#E3F2FD", "#E0F2F1", "#F1F8E9", "#F5F5DC"
                          ].map(c => (
                            <div
                              key={c}
                              onClick={(e) => updateColor(nexus._id, c, e)}
                              style={{
                                width: 22,
                                height: 22,
                                borderRadius: '50%',
                                background: c,
                                border: `1px solid ${LUXURY_COLORS.borderSubtle}`,
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
                              }}
                              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.2)'}
                              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                </div>
              ))}
            </div>
          ) : (
            <p style={{ textAlign: 'center', color: '#B0B0B0', fontSize: 13, marginTop: 40 }}>
              Join or Create a Nexus to start chatting!
            </p>
          )
        ) : (
          (users?.length > 0) ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {users.map((u) => (
                <div
                  key={u._id}
                  onClick={() => {
                    setSelectedUser(u);
                    setSelectedNexus(null);
                    setNexusActionView(null);
                    navigate(`/chat/${u._id}`);
                  }}
                  className="luxury-card"
                  style={{
                    padding: '12px 16px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    background: selectedUser?._id === u._id ? LUXURY_COLORS.accentMute : LUXURY_COLORS.surface,
                    borderColor: selectedUser?._id === u._id ? LUXURY_COLORS.goldMedium : LUXURY_COLORS.borderSubtle
                  }}
                >
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: "transparent", display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {u.profilePic ? (
                      <img src={u.profilePic} alt={u.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      (() => {
                        const ANIMALS = ['dog', 'cat', 'bunny'];
                        const animal = ANIMALS[parseInt((u._id || "").toString().slice(-4) || '0', 16) % ANIMALS.length];
                        return (
                          <PixelAvatarBadge
                            type={animal}
                            state="idle"
                            size={40}
                            showDot={false}
                            style={{ imageRendering: "pixelated" }}
                          />
                        );
                      })()
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: LUXURY_COLORS.textPrimary }}>{u.username}</div>
                    <div style={{ fontSize: 10, color: u.status === "online" ? "#6DA37A" : LUXURY_COLORS.textSecondary }}>{u.status === "online" ? "ONLINE" : "OFFLINE"}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ textAlign: 'center', color: '#B0B0B0', fontSize: 13, marginTop: 40 }}>
              Your contact list is empty.
            </p>
          )
        )}
      </div>

      {/* Global Action Footer */}
      <div style={{ padding: 24, borderTop: `1px solid ${LUXURY_COLORS.borderSubtle}` }}>
        <div
          style={{ width: '100%', padding: '16px 20px', borderRadius: 16, border: `1px solid ${LUXURY_COLORS.borderSubtle}`, background: 'rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', gap: 16, cursor: 'not-allowed', opacity: 0.5, pointerEvents: 'none' }}
        >
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#F5F1E8', border: `2px solid ${LUXURY_COLORS.borderSubtle}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            🔒
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 0.5 }}>ORBIT: COMING SOON</div>
            <div style={{ fontSize: 10, color: '#A0A0A0', fontWeight: 700, letterSpacing: 1 }}>SEQUENCING NODES</div>
          </div>
        </div>
      </div>
    </div>
  );
});

export function LightSpotify() {
  const navigate = useNavigate();
  const { spotifyLinked, currentTrack, isPlaying, pausePlayback, playTrack } = useSpotifyStore();

  return (
    <LuxuryWrapper>
      <div className="board-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(180deg, #Fdfbf9, #F2EBE1)', position: 'relative' }}>
        <button
          onClick={() => navigate('/')}
          style={{ position: 'absolute', top: 32, left: 32, padding: '8px 16px', borderRadius: '12px', background: LUXURY_COLORS.surfaceHover, border: `1px solid ${LUXURY_COLORS.borderSubtle}`, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 600, color: LUXURY_COLORS.textSecondary }}
        >
          <ArrowLeft size={16} /> Dashboard
        </button>

        {!spotifyLinked ? (
          <div style={{ textAlign: 'center', maxWidth: 500 }}>
            <div style={{ width: 120, height: 120, borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px', boxShadow: '0 20px 40px rgba(109, 163, 122, 0.2)', border: '2px solid #E6EAE5' }}>
              <Music size={40} color="#6DA37A" />
            </div>
            <h2 className="font-playfair" style={{ fontSize: 36, fontWeight: 700, color: "#1C2431", marginBottom: 16 }}>Musical Resonance</h2>
            <p style={{ fontSize: 15, color: LUXURY_COLORS.textSecondary, marginBottom: 40, lineHeight: 1.6 }}>
              The global auditory layer is tuned to high-fidelity standards. Link your Spotify account to broadcast your frequency across the orbit.
            </p>
            <button
              className="luxury-button btn-gold"
              onClick={async () => {
                try {
                  await spotifyService.initiateLogin();
                } catch (err) {
                  console.error(err);
                }
              }}
              style={{ padding: '14px 32px', fontSize: 14 }}
            >
              INITIALIZE CONNECTION
            </button>
          </div>
        ) : (
          <div style={{ textAlign: 'center', maxWidth: 600, width: '100%' }}>
            <h2 className="font-playfair" style={{ fontSize: 36, fontWeight: 700, color: "#1C2431", marginBottom: 32 }}>Now Broadcasting</h2>

            <div className="luxury-card" style={{ padding: 40, background: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
              <div style={{ width: 280, height: 280, borderRadius: 20, background: currentTrack ? `url(${currentTrack.imageUrl}) center/cover` : '#F7F5F0', boxShadow: '0 20px 50px rgba(0,0,0,0.1)', border: '1px solid #E6EAE5' }} />

              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#1C2431', marginBottom: 8 }}>{currentTrack ? currentTrack.name : "Awaiting Frequency..."}</div>
                <div style={{ fontSize: 16, color: LUXURY_COLORS.textSecondary }}>{currentTrack ? currentTrack.artist : "Ready to play"}</div>
              </div>

              <div style={{ width: '100%', height: 4, background: '#E6EAE5', borderRadius: 2, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '45%', background: '#6DA37A', borderRadius: 2 }} />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 40, color: '#6DA37A' }}>
                <SkipBack size={32} style={{ cursor: 'pointer' }} />
                <div
                  onClick={() => isPlaying ? pausePlayback() : playTrack()}
                  style={{ width: 80, height: 80, borderRadius: '50%', background: '#6DA37A', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', cursor: 'pointer', boxShadow: '0 10px 25px rgba(109, 163, 122, 0.4)' }}
                >
                  {isPlaying ? <div style={{ width: 24, height: 24, display: 'flex', gap: 6 }}><div style={{ flex: 1, background: 'white', borderRadius: 2 }} /><div style={{ flex: 1, background: 'white', borderRadius: 2 }} /></div> : <Play size={32} fill="white" />}
                </div>
                <SkipForward size={32} style={{ cursor: 'pointer' }} />
              </div>
            </div>
          </div>
        )}
      </div>
    </LightTheme>
  );
}

export function LightProfile() {
  const { authUser } = useAuthStore();
  const navigate = useNavigate();

  return (
    <LuxuryWrapper>
      {/* MOBILE PROFILE */}
      <div className="lm-mobile-canvas lm-mobile-only">
        <MobileNav
          title="Orbit"
          showBack={true}
          onBack={() => navigate('/')}
          rightIcon={
            <div style={{ width: 32, height: 32, borderRadius: '50%', overflow: 'hidden', border: '1px solid #EAE4D8', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <img src={authUser?.profilePic || "/avatar.png"} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          }
        />
        <div style={{ padding: '30px 20px 100px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: 40 }}>
            <div style={{ width: 120, height: 120, borderRadius: '50%', border: `3px solid ${LUXURY_COLORS.goldMedium}`, padding: 5, background: 'white', boxShadow: LUXURY_COLORS.shadowSoft, marginBottom: 20 }}>
              <img src={authUser?.profilePic || "/avatar.png"} alt="Profile" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
            </div>
            <h2 className="font-playfair" style={{ fontSize: 28, fontWeight: 700, color: LUXURY_COLORS.textPrimary, marginBottom: 8 }}>{authUser?.username}</h2>
            <p style={{ fontSize: 14, color: LUXURY_COLORS.textSecondary, fontStyle: 'italic' }}>{authUser?.bio || "Prime Orbit Member"}</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="luxury-card" style={{ padding: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: LUXURY_COLORS.textSecondary }}>MEMBER SINCE</span>
              <span style={{ fontSize: 14, fontWeight: 600 }}>{new Date(authUser?.createdAt || Date.now()).toLocaleDateString()}</span>
            </div>
            <div className="luxury-card" style={{ padding: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: LUXURY_COLORS.textSecondary }}>STATUS</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: LUXURY_COLORS.goldDark }}>Verified</span>
            </div>
          </div>
        </div>
        <MobileTabBar activeTab="profile" />
      </div>

      <div className="lm-desktop-only board-container" style={{ padding: 60, display: 'flex', gap: 60, overflowY: 'auto', position: 'relative' }}>
        <button
          onClick={() => navigate('/')}
          style={{ position: 'absolute', top: 32, left: 32, padding: '8px 16px', borderRadius: '12px', background: LUXURY_COLORS.surfaceHover, border: `1px solid ${LUXURY_COLORS.borderSubtle}`, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 600, color: LUXURY_COLORS.textSecondary }}
        >
          <ArrowLeft size={16} /> Dashboard
        </button>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', paddingTop: 60 }}>
          <div style={{ position: 'relative', marginBottom: 32 }}>
            <div style={{ width: 180, height: 180, borderRadius: '50%', background: 'white', border: `4px solid ${LUXURY_COLORS.goldMedium}`, padding: 8, boxShadow: LUXURY_COLORS.shadowMedium }}>
              <img src={authUser?.profilePic || "/avatar.png"} alt="Profile" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
            </div>
          </div>

          <h1 className="font-playfair" style={{ fontSize: 40, fontWeight: 700, marginBottom: 12 }}>{authUser?.username || "Guest"}</h1>
          <p style={{ fontSize: 16, color: LUXURY_COLORS.textSecondary, fontStyle: 'italic', maxWidth: 400 }}>
            {authUser?.bio || "No biography provided. Awaiting signature."}
          </p>

          <div style={{ marginTop: 40, display: 'flex', gap: 16 }}>
            <div className="luxury-card" style={{ padding: '16px 24px' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: LUXURY_COLORS.goldDark, letterSpacing: 1.5, marginBottom: 8 }}>MEMBER SINCE</div>
              <div style={{ fontSize: 16, fontWeight: 500 }}>{new Date(authUser?.createdAt || Date.now()).toLocaleDateString()}</div>
            </div>
            <div className="luxury-card" style={{ padding: '16px 24px' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: LUXURY_COLORS.goldDark, letterSpacing: 1.5, marginBottom: 8 }}>STATUS</div>
              <div style={{ fontSize: 16, fontWeight: 500 }}>Verified Prime</div>
            </div>
          </div>
        </div>
      </div>
    </LightTheme>
  );
}

export function LightSettings({
  activeSection, setActiveSection,
  draftTheme, setDraftTheme,
  draftDisplayName, setDraftDisplayName,
  draftBio, setDraftBio,
  draftNotifications, setDraftNotifications,
  draftShowOnlineStatus, setDraftShowOnlineStatus,
  draftOrbitBehavior, setDraftOrbitBehavior,
  draftSoundSettings, setDraftSoundSettings,
  isDirty, handleSave, handleReset, authUser, navigate
}) {
  const sections = [
    { id: "profile", label: "Identity" },
    { id: "appearance", label: "Visuals" },
  ];

  return (
    <LuxuryWrapper>
      {/* MOBILE SETTINGS */}
      <div className="lm-mobile-canvas lm-mobile-only">
        <MobileNav
          title="Orbit"
          showBack={true}
          onBack={() => navigate('/')}
          rightIcon={
            <div style={{ width: 32, height: 32, borderRadius: '50%', overflow: 'hidden', border: '1px solid #EAE4D8', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <img src={authUser?.profilePic || "/avatar.png"} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          }
        />
        <div className="lm-mobile-scroll" style={{ padding: '24px 16px', paddingBottom: '100px' }}>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 700, color: '#1C1C1C', marginBottom: 24 }}>Preferences</h1>

          <div className="lm-card" style={{ padding: '8px 16px', marginBottom: 32 }}>
            {sections.map((s, idx) => (
              <div
                key={s.id}
                onClick={() => setActiveSection(activeSection === s.id ? null : s.id)}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '16px 0',
                  borderBottom: idx < sections.length - 1 ? '1px solid #EAE4D8' : 'none',
                  cursor: 'pointer'
                }}
              >
                <div style={{ fontSize: 15, fontWeight: activeSection === s.id ? 700 : 500, color: activeSection === s.id ? '#1C1C1C' : '#6B6560' }}>{s.label}</div>
                <ChevronRight size={18} color={activeSection === s.id ? '#B8924A' : '#8A8480'} style={{ transform: activeSection === s.id ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }} />
              </div>
            ))}
          </div>

          {activeSection && (
            <div className="lm-card" style={{ padding: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1C1C1C', marginBottom: 20 }}>Configure {sections.find(s => s.id === activeSection)?.label}</h2>

              {activeSection === "profile" && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div>
                    <div className="lm-label">DISPLAY ALIAS</div>
                    <input className="lm-input" value={draftDisplayName} onChange={e => setDraftDisplayName(e.target.value)} placeholder="Your display name" />
                  </div>
                  <div>
                    <div className="lm-label">BIOGRAPHY</div>
                    <textarea className="lm-textarea" value={draftBio} onChange={e => setDraftBio(e.target.value)} placeholder="A few words about yourself..." rows={4} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: '#1C1C1C', marginBottom: 4 }}>Broadcast Presence</div>
                      <div style={{ fontSize: 13, color: '#6B6560' }}>Allow others to see when you are online.</div>
                    </div>
                    <div className="lm-toggle" style={{ background: draftShowOnlineStatus ? '#B8924A' : '#E0E0E0' }} onClick={() => setDraftShowOnlineStatus(!draftShowOnlineStatus)}>
                      <div className="lm-toggle-thumb" style={{ left: draftShowOnlineStatus ? 25 : 3 }} />
                    </div>
                  </div>
                </div>
              )}

              {activeSection === "sound" && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  <div>
                    <div className="lm-label">MASTER VOLUME</div>
                    <input type="range" min="0" max="1" step="0.01" value={draftSoundSettings.volume} onChange={e => { const v = parseFloat(e.target.value); setDraftSoundSettings(p => ({ ...p, volume: v })); try { useSettingsStore.getState().updateSetting('sound.volume', v); } catch (_) { } }} style={{ width: '100%', accentColor: '#B8924A' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: '#1C1C1C', marginBottom: 4 }}>Haptic Sounds</div>
                      <div style={{ fontSize: 13, color: '#6B6560' }}>Play acoustic feedback on interaction.</div>
                    </div>
                    <div className="lm-toggle" style={{ background: draftSoundSettings.clickSound ? '#B8924A' : '#E0E0E0' }} onClick={() => { const v = !draftSoundSettings.clickSound; setDraftSoundSettings(p => ({ ...p, clickSound: v })); try { useSettingsStore.getState().updateSetting('sound.clickEnabled', v); } catch (_) { } }}>
                      <div className="lm-toggle-thumb" style={{ left: draftSoundSettings.clickSound ? 25 : 3 }} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: '#1C1C1C', marginBottom: 4 }}>Message Alerts</div>
                      <div style={{ fontSize: 13, color: '#6B6560' }}>Play a chime on receiving transmissions.</div>
                    </div>
                    <div className="lm-toggle" style={{ background: draftSoundSettings.messageSound ? '#B8924A' : '#E0E0E0' }} onClick={() => { const v = !draftSoundSettings.messageSound; setDraftSoundSettings(p => ({ ...p, messageSound: v })); try { useSettingsStore.getState().updateSetting('sound.notificationEnabled', v); } catch (_) { } }}>
                      <div className="lm-toggle-thumb" style={{ left: draftSoundSettings.messageSound ? 25 : 3 }} />
                    </div>
                  </div>
                </div>
              )}

              {activeSection === "appearance" && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                  {THEMES.map(t => {
                    const THEME_PREVIEW = {
                      "light": { primary: "#3b82f6", bg: "#ffffff" },
                      "dark": { primary: "#ef4444", bg: "#0a0a0a" },
                      "neon-cyberpunk": { primary: "#8b5cf6", bg: "#0c0e14" },
                      "amoled-dark": { primary: "#E8C990", bg: "#000000" },
                      "gamer-high-energy": { primary: "#ff2d78", bg: "#080614" },
                      "pastel-dream": { primary: "#e060b0", bg: "#ffd4ee" },
                    };
                    const preview = THEME_PREVIEW[t] || { primary: "#CFAE84", bg: "#F7F5F0" };
                    return (
                      <div key={t} onClick={() => { setDraftTheme(t); handleSave(t); }} style={{ padding: 12, borderRadius: 12, border: `2px solid ${draftTheme === t ? '#B8924A' : '#EAE4D8'}`, background: 'white', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s', boxShadow: draftTheme === t ? '0 0 0 3px rgba(184,146,74,0.15)' : 'none' }}>
                        <div style={{ width: '100%', height: 40, background: preview.bg, borderRadius: 6, marginBottom: 8, display: 'flex', overflow: 'hidden', border: '1px solid #EAE4D8' }}>
                          <div style={{ flex: 1, background: preview.primary }} />
                          <div style={{ flex: 2, background: preview.bg }} />
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 600, color: '#1C1C1C' }}>{THEME_LABELS[t] || t.toUpperCase()}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {activeSection === "notifications" && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#1C1C1C', marginBottom: 4 }}>Enable Alerts</div>
                    <div style={{ fontSize: 13, color: '#6B6560' }}>Receive desktop notifications for messages.</div>
                  </div>
                  <div className="lm-toggle" style={{ background: draftNotifications.enabled ? '#B8924A' : '#E0E0E0' }} onClick={() => { const v = !draftNotifications.enabled; setDraftNotifications(p => ({ ...p, enabled: v, desktop: v })); try { useSettingsStore.getState().updateSetting('notifications.enabled', v); } catch (_) { } }}>
                    <div className="lm-toggle-thumb" style={{ left: draftNotifications.enabled ? 25 : 3 }} />
                  </div>
                </div>
              )}

              {isDirty && (
                <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
                  <button onClick={handleReset} style={{ flex: 1, padding: 14, borderRadius: 12, border: '1px solid #EAE4D8', background: '#F8F5EE', color: '#1C1C1C', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>Reset</button>
                  <button onClick={handleSave} style={{ flex: 1, padding: 14, borderRadius: 12, border: 'none', background: '#1C1C1C', color: 'white', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>Save Changes</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </LightTheme>
  );
}

