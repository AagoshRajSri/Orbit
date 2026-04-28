import React, { useEffect, useRef, useState, useMemo, memo } from "react";
import UniversalChatContainer from "../components/UniversalChatContainer";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  Globe, Settings, User, LogOut, Music, Bell, Shield, Layers, 
  Coffee, Play, SkipForward, SkipBack, MessageCircle, Maximize2, 
  Compass, CheckCircle2, ArrowLeft 
} from "lucide-react";

import { useAuthStore } from "../store/useAuthStore";
import { useNexusStore } from "../store/useNexusStore";
import { useChatStore } from "../store/useChatStore";
import { useSettingsStore } from "../store/useSettingsStore";
import { THEMES, THEME_LABELS } from "../constants";
import NexusActionOverlay from "../components/NexusActionOverlay";
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

.luxury-card {
  background: ${LUXURY_COLORS.surface};
  border: 1px solid ${LUXURY_COLORS.borderSubtle};
  border-radius: 20px;
  box-shadow: ${LUXURY_COLORS.shadowSoft};
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  position: relative;
  overflow: hidden;
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
      <TopNav 
        handleLogout={onLogout} 
        hiddenNexuses={hiddenNexuses}
        onReveal={onReveal}
      />
      {children}
    </div>
  );
});

const LuxurySidebar = memo(({ nexuses, selectedNexus, setSelectedNexus, users, selectedUser, setSelectedUser, setNexusActionView, toggleHide, hiddenNexuses }) => {
  const navigate = useNavigate();
  const [tab, setTab] = useState('orbits');

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
    <div style={{ width: 320, borderRight: `1px solid ${LUXURY_COLORS.borderSubtle}`, display: 'flex', flexDirection: 'column', background: '#FDFCFB', zIndex: 10 }}>
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
            <button className="luxury-button" onClick={() => setNexusActionView("join")} style={{ flex: 1, background: '#7A7A7A', color: 'white' }}>
               # JOIN
            </button>
            <button className="luxury-button" onClick={() => setNexusActionView("create")} style={{ flex: 1, background: '#71A5BD', color: 'white' }}>
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
                    <img 
                      src={nexus.avatar || "/nexus-avatar.png"} 
                      alt={nexus.name} 
                      style={{ width: 40, height: 40, borderRadius: 12, objectFit: 'cover', border: `1px solid ${LUXURY_COLORS.borderSubtle}` }} 
                    />
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
                      style={{ position: 'absolute', right: 12, top: 24, transform: "translateY(-50%)", cursor: 'pointer', fontSize: 18, zIndex: 5, padding: 4, opacity: 0.8, transition: 'opacity 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.opacity = 1}
                      onMouseLeave={e => e.currentTarget.style.opacity = 0.8}
                    >
                      ⚜️
                    </div>
                  </div>

                  {/* Context Menu Inline Expansion */}
                  {activeMenuId === nexus._id && (
                    <div 
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        width: '100%', marginTop: 12, paddingTop: 12, borderTop: `1px solid ${LUXURY_COLORS.borderSubtle}`, display: 'flex', flexDirection: 'column', gap: 8, zIndex: 10
                      }}
                    >
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveColorPickerId(activeColorPickerId === nexus._id ? null : nexus._id);
                          }}
                          style={{ flex: 1, padding: '8px 12px', background: LUXURY_COLORS.surfaceHover, border: `1px solid ${LUXURY_COLORS.borderSubtle}`, borderRadius: 8, fontSize: 12, fontWeight: 700, color: LUXURY_COLORS.textPrimary, cursor: 'pointer', transition: 'all 0.2s' }}
                          onMouseEnter={e => e.currentTarget.style.borderColor = LUXURY_COLORS.goldMedium}
                          onMouseLeave={e => e.currentTarget.style.borderColor = LUXURY_COLORS.borderSubtle}
                        >
                          Mark 🎨
                        </button>
                        <button 
                          onClick={(e) => togglePin(nexus._id, e)}
                          style={{ flex: 1, padding: '8px 12px', background: LUXURY_COLORS.surfaceHover, border: `1px solid ${LUXURY_COLORS.borderSubtle}`, borderRadius: 8, fontSize: 12, fontWeight: 700, color: LUXURY_COLORS.textPrimary, cursor: 'pointer', transition: 'all 0.2s' }}
                          onMouseEnter={e => e.currentTarget.style.borderColor = LUXURY_COLORS.goldMedium}
                          onMouseLeave={e => e.currentTarget.style.borderColor = LUXURY_COLORS.borderSubtle}
                        >
                          {pinnedNexuses.includes(nexus._id) ? "Unpin 📌" : "Pin 📌"}
                        </button>
                        <button 
                          onClick={(e) => toggleHide(nexus, e)}
                          style={{ flex: 1, padding: '8px 12px', background: LUXURY_COLORS.accentPink, border: `1px solid ${LUXURY_COLORS.goldLight}`, borderRadius: 8, fontSize: 12, fontWeight: 700, color: '#7A4242', cursor: 'pointer', transition: 'all 0.2s' }}
                        >
                          Hide 🌐
                        </button>
                      </div>

                      {activeColorPickerId === nexus._id && (
                        <div style={{ 
                          display: 'flex', 
                          gap: 10, 
                          padding: '12px', 
                          background: LUXURY_COLORS.surfaceHover, 
                          borderRadius: 8, 
                          border: `1px solid ${LUXURY_COLORS.goldLight}`,
                          overflowX: 'auto',
                          width: '100%',
                          scrollbarWidth: 'none'
                        }} className="luxury-scroll">
                          {[
                            "#FFFFFF", // White
                            "#F5F5F5", // Smoke
                            "#FFF9E6", "#FFF3E0", "#FFEBE0", "#FFE0E0", "#FFEBEE", // Reds/Oranges
                            "#FCE4EC", "#F8BBD0", "#F3E5F5", "#EDE7F6", "#E8EAF6", // Pinks/Purples
                            "#E3F2FD", "#E1F5FE", "#E0F7FA", "#E0F2F1", "#E8F5E9", // Blues/Teals
                            "#F1F8E9", "#F9FBE7", "#FFFDE7", "#FFF9C4", "#FFF59D", // Greens/Yellows
                            "#D7CCC8", "#F5F5DC", "#EFEBE9", "#FAFAFA", "#ECEFF1"  // Neutrals
                          ].map(c => (
                            <div 
                              key={c}
                              onClick={(e) => updateColor(nexus._id, c, e)}
                              style={{ 
                                minWidth: 26, 
                                height: 26, 
                                borderRadius: '50%', 
                                background: c, 
                                border: `1px solid ${LUXURY_COLORS.borderSubtle}`, 
                                cursor: 'pointer', 
                                transition: 'transform 0.1s', 
                                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                                flexShrink: 0
                              }}
                              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.15)'}
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
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: LUXURY_COLORS.surfaceHover, border: `1px solid ${LUXURY_COLORS.borderSubtle}`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {u.profilePic ? <img src={u.profilePic} alt={u.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : u.username?.[0]?.toUpperCase()}
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
          onClick={() => window.dispatchEvent(new CustomEvent("toggle-orbit-mode"))} 
          style={{ width: '100%', padding: '16px 20px', borderRadius: 16, border: `1px solid ${LUXURY_COLORS.borderSubtle}`, background: 'white', display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer', transition: 'all 0.3s' }}
          onMouseOver={(e) => e.currentTarget.style.borderColor = LUXURY_COLORS.goldMedium}
          onMouseOut={(e) => e.currentTarget.style.borderColor = LUXURY_COLORS.borderSubtle}
        >
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg, #F5F1E8, #DFD1C1)', border: `2px solid ${LUXURY_COLORS.borderSubtle}`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
             <Globe size={20} color={LUXURY_COLORS.goldDark} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 0.5 }}>ENTER YOUR ORBIT</div>
            <div style={{ fontSize: 10, color: '#A0A0A0', fontWeight: 700, letterSpacing: 1 }}>60 FPS GALAXY ENGINE</div>
          </div>
        </div>
      </div>
    </div>
  );
});

/* ─────────────────────────────── VIEWS ─────────────────────────────── */

export default function LightTheme({ children }) {
   const { nexusActionView, setNexusActionView, selectedNexus, setSelectedNexus, selectedNexusId, nexuses } = useNexusStore();
   const { selectedUser, setSelectedUser, users } = useChatStore();
   const { logout } = useAuthStore();
   const nexusSelected = Boolean(selectedNexus || selectedNexusId);
   const navigate = useNavigate();

   // ── Hidden Nexus State ──
   const [hiddenNexuses, setHiddenNexuses] = useState(() => {
       try {
           const saved = localStorage.getItem('luxury_hidden_nexuses');
           return saved ? JSON.parse(saved) : [];
       } catch { return []; }
   });

   const toggleHide = (nexus, e) => {
       if (e) e.stopPropagation();
       const id = nexus._id;
       const isHidden = (hiddenNexuses || []).some(h => h._id === id);
       
       if (!isHidden && hiddenNexuses.length >= 3) {
           import("react-hot-toast").then(({ toast }) => toast.error("Maximum 3 hidden Nexuses allowed per theme."));
           return;
       }

       const next = isHidden
           ? hiddenNexuses.filter(h => h._id !== id)
           : [...hiddenNexuses, { _id: id, name: nexus.name }];
       
       setHiddenNexuses(next);
       localStorage.setItem('luxury_hidden_nexuses', JSON.stringify(next));
   };

   const onReveal = (id) => {
       const next = hiddenNexuses.filter(h => h._id !== id);
       setHiddenNexuses(next);
       localStorage.setItem('luxury_hidden_nexuses', JSON.stringify(next));
   };

   return (
     <LuxuryWrapper 
        hiddenNexuses={hiddenNexuses}
        onReveal={onReveal}
     >
       <div className="board-container">
          <LuxurySidebar 
            nexuses={nexuses} 
            selectedNexus={selectedNexus} 
            setSelectedNexus={setSelectedNexus} 
            users={users} 
            selectedUser={selectedUser} 
            setSelectedUser={setSelectedUser} 
            setNexusActionView={setNexusActionView} 
            toggleHide={toggleHide}
            hiddenNexuses={hiddenNexuses}
          />
         
         <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
            
            {nexusActionView && (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)', zIndex: 100, padding: 40, overflowY: 'auto' }}>
                 <NexusActionOverlay mode={nexusActionView} onClose={() => setNexusActionView(null)} inline={true} />
              </div>
            )}

            {children ? (
              <div style={{ flex: 1, overflowY: 'auto', position: 'relative' }} className="luxury-scroll">
                {children}
              </div>
            ) : nexusSelected ? (
              <div style={{ position: 'absolute', inset: 0, zIndex: 10, display: 'flex', flexDirection: 'column' }}>
                <UniversalChatContainer type="nexus" />
              </div>
            ) : selectedUser ? (
              <div style={{ position: 'absolute', inset: 0, zIndex: 10, display: 'flex', flexDirection: 'column' }}>
                <UniversalChatContainer type="dm" />
              </div>
            ) : (
              <div style={{ flex: 1, padding: '24px 40px', display: 'flex', flexDirection: 'column', position: 'relative', overflowY: 'auto' }} className="luxury-scroll">
                <div style={{ marginBottom: 20 }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                      <div style={{ width: 40, height: 2, background: LUXURY_COLORS.goldMedium }} />
                      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, color: '#688494' }}>STATUS: ONLINE</span>
                   </div>
                   <h1 className="font-playfair" style={{ fontSize: 36, fontWeight: 700, color: "#1C2431", margin: '0 0 8px', letterSpacing: '-0.5px', textShadow: '0 4px 10px rgba(0,0,0,0.03)' }}>
                     WELCOME TO ORBIT
                   </h1>
                   <p style={{ fontSize: 14, color: LUXURY_COLORS.textSecondary }}>Choose a pathway to begin your mission.</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr)', gap: 16, flex: 1, minHeight: 0 }}>
               {/* SPOTIFY ACTIVE */}
               <div className="luxury-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', cursor: 'pointer' }} onClick={() => navigate('/spotify')}>
                 <div className="luxury-card-overlay" />
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, position: 'relative' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                       <div className="rich-icon-wrapper" style={{ width: 28, height: 28, borderRadius: '50%', background: '#E6EAE5', color: '#6DA37A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                         <Music size={14} />
                       </div>
                       <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1 }}>SPOTIFY ACTIVE</span>
                    </div>
                    <span style={{ fontSize: 9, fontWeight: 700, color: '#A0A0A0', letterSpacing: 1 }}>EXPAND</span>
                 </div>
                 
                 <div style={{ display: 'flex', alignItems: 'center', gap: 16, position: 'relative' }}>
                    <div style={{ width: 64, height: 64, borderRadius: 12, background: 'url(https://images.unsplash.com/photo-1493225457124-a1a2a5f5f9af?auto=format&fit=crop&w=200&q=80) center/cover', boxShadow: '0 8px 20px rgba(0,0,0,0.1)' }} />
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Reflections</div>
                      <div style={{ fontSize: 12, color: LUXURY_COLORS.textSecondary }}>The Neighbourhood</div>
                    </div>
                 </div>

                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, position: 'relative' }}>
                    <div style={{ display: 'flex', gap: 16, color: '#6DA37A' }}>
                       <SkipBack size={18} fill="currentColor" />
                       <Play size={18} fill="currentColor" />
                       <SkipForward size={18} fill="currentColor" />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                       <Bell size={14} color="#A0A0A0" />
                       <div style={{ width: 60, height: 4, background: '#E0E0E0', borderRadius: 2 }}>
                         <div style={{ width: '60%', height: '100%', background: '#6DA37A', borderRadius: 2 }} />
                       </div>
                    </div>
                 </div>
               </div>

               {/* START CHATTING */}
               <div className="luxury-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', cursor: 'pointer' }} onClick={() => setNexusActionView("join")}>
                  <div className="luxury-card-overlay" />
                  <div className="rich-icon-wrapper" style={{ width: 48, height: 48, borderRadius: 16, background: 'linear-gradient(135deg, #DEBBBC, #A36B6D)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', marginBottom: 'auto', position: 'relative' }}>
                     <MessageCircle size={20} />
                  </div>
                  <div style={{ position: 'relative' }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4, marginTop: 16, letterSpacing: 0.5 }}>START CHATTING</h3>
                    <p style={{ fontSize: 12, color: LUXURY_COLORS.textSecondary }}>Select a Constellation or create a private conversation.</p>
                  </div>
                  <div style={{ position: 'absolute', right: 20, bottom: 20, color: '#E0E0E0' }}>
                    <Maximize2 size={16} />
                  </div>
               </div>

               {/* GET NOTIFICATIONS */}
               <div className="luxury-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', cursor: 'pointer' }} onClick={() => navigate('/profile')}>
                  <div className="luxury-card-overlay" />
                  <div className="rich-icon-wrapper" style={{ width: 48, height: 48, borderRadius: 16, background: 'linear-gradient(135deg, #DCA876, #A86524)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', marginBottom: 'auto', position: 'relative' }}>
                     <Bell size={20} />
                  </div>
                  <div style={{ position: 'relative' }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4, marginTop: 16, letterSpacing: 0.5 }}>GET NOTIFICATIONS</h3>
                    <p style={{ fontSize: 12, color: LUXURY_COLORS.textSecondary }}>Stay updated with real-time alerts and messages.</p>
                  </div>
                  <div style={{ position: 'absolute', right: 20, bottom: 20, color: '#E0E0E0' }}>
                    <Maximize2 size={16} />
                  </div>
               </div>

                {/* CUSTOMIZE */}
                <div className="luxury-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', cursor: 'pointer' }} onClick={() => navigate('/settings')}>
                   <div className="luxury-card-overlay" />
                   <div className="rich-icon-wrapper" style={{ width: 48, height: 48, borderRadius: 16, background: 'linear-gradient(135deg, #A8B884, #6B7A49)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', marginBottom: 'auto', position: 'relative' }}>
                      <Settings size={20} />
                   </div>
                   <div style={{ position: 'relative' }}>
                     <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4, marginTop: 16, letterSpacing: 0.5 }}>CUSTOMIZE</h3>
                     <p style={{ fontSize: 12, color: LUXURY_COLORS.textSecondary }}>Configure your orbit behavior and preferences.</p>
                   </div>
                   <div style={{ position: 'absolute', right: 20, bottom: 20, color: '#E0E0E0' }}>
                     <Maximize2 size={16} />
                   </div>
                </div>
              </div>
            </div>
            )}
          </div>
        </div>
      </LuxuryWrapper>
   );
}

export function LightSpotify() {
  const navigate = useNavigate();
  return (
    <LuxuryWrapper>
      <div className="board-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(180deg, #Fdfbf9, #F2EBE1)', position: 'relative' }}>
         <button 
           onClick={() => navigate('/')} 
           style={{ position: 'absolute', top: 32, left: 32, padding: '8px 16px', borderRadius: '12px', background: LUXURY_COLORS.surfaceHover, border: `1px solid ${LUXURY_COLORS.borderSubtle}`, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 600, color: LUXURY_COLORS.textSecondary }}
         >
           <ArrowLeft size={16} /> Dashboard
         </button>
        <div style={{ textAlign: 'center', maxWidth: 500 }}>
          <div style={{ width: 120, height: 120, borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px', boxShadow: '0 20px 40px rgba(109, 163, 122, 0.2)', border: '2px solid #E6EAE5' }}>
            <Music size={40} color="#6DA37A" />
          </div>
          <h2 className="font-playfair" style={{ fontSize: 36, fontWeight: 700, color: "#1C2431", marginBottom: 16 }}>Musical Resonance</h2>
          <p style={{ fontSize: 15, color: LUXURY_COLORS.textSecondary, marginBottom: 40, lineHeight: 1.6 }}>
            The global auditory layer is tuned to high-fidelity standards. Manage your frequency directly from the dashboard widget.
          </p>
          <button className="luxury-button btn-gold" onClick={() => navigate('/')} style={{ padding: '14px 32px', fontSize: 14 }}>
            RETURN TO DASHBOARD
          </button>
        </div>
      </div>
    </LuxuryWrapper>
  );
}

export function LightProfile() {
  const { authUser } = useAuthStore();
  const navigate = useNavigate();

  return (
    <LuxuryWrapper>
      <div className="board-container" style={{ padding: 60, display: 'flex', gap: 60, overflowY: 'auto', position: 'relative' }}>
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
             <div style={{ position: 'absolute', bottom: 8, right: 8, width: 44, height: 44, borderRadius: '50%', background: LUXURY_COLORS.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', cursor: 'pointer', border: `1px solid ${LUXURY_COLORS.borderSubtle}` }}>
                📸
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
    </LuxuryWrapper>
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
  isDirty, handleSave, handleReset, authUser
}) {
  const navigate = useNavigate();
  
  const sections = [
    { id: "profile", label: "Identity Matrix" },
    { id: "sound", label: "Acoustic Tuning" },
    { id: "appearance", label: "Visual Themes" },
    { id: "notifications", label: "Alert Systems" },
  ];

  return (
    <LuxuryWrapper>
      <div className="board-container" style={{ display: 'flex' }}>
        {/* Settings Sidebar */}
        <div style={{ width: 280, borderRight: `1px solid ${LUXURY_COLORS.borderSubtle}`, padding: '40px', background: '#FAFAFA', display: 'flex', flexDirection: 'column' }}>
           <button 
             onClick={() => navigate('/')} 
             style={{ padding: '8px 12px', borderRadius: '8px', background: 'white', border: `1px solid ${LUXURY_COLORS.borderSubtle}`, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontWeight: 600, color: LUXURY_COLORS.textSecondary, alignSelf: 'flex-start', marginBottom: 24 }}
           >
             <ArrowLeft size={14} /> Back
           </button>
           <h2 className="font-playfair" style={{ fontSize: 24, fontWeight: 700, marginBottom: 32 }}>Preferences</h2>
           <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
             {sections.map(s => (
               <button 
                 key={s.id} 
                 onClick={() => setActiveSection(s.id)}
                 style={{ 
                   textAlign: 'left', padding: '14px 20px', borderRadius: 12, border: 'none', 
                   background: activeSection === s.id ? LUXURY_COLORS.goldMedium : 'transparent', 
                   color: activeSection === s.id ? 'white' : LUXURY_COLORS.textSecondary, 
                   fontWeight: activeSection === s.id ? 600 : 500, 
                   fontSize: 14, cursor: 'pointer', transition: 'all 0.2s' 
                 }}
               >
                 {s.label}
               </button>
             ))}
           </div>
        </div>

        {/* Settings Content */}
        <div className="luxury-scroll" style={{ flex: 1, padding: '50px 60px', overflowY: 'auto' }}>
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
             <h3 style={{ fontSize: 20, fontWeight: 600 }}>Configure {sections.find(s => s.id === activeSection)?.label}</h3>
             
             <div style={{ display: 'flex', gap: 12 }}>
               <button onClick={handleReset} disabled={!isDirty} style={{ padding: '10px 20px', borderRadius: 8, border: `1px solid ${LUXURY_COLORS.borderSubtle}`, background: 'white', color: isDirty ? LUXURY_COLORS.textPrimary : '#D0D0D0', cursor: isDirty ? 'pointer' : 'not-allowed', fontWeight: 600, fontSize: 13 }}>Reset</button>
               <button onClick={handleSave} disabled={!isDirty} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: isDirty ? LUXURY_COLORS.textPrimary : '#E0E0E0', color: 'white', cursor: isDirty ? 'pointer' : 'not-allowed', fontWeight: 600, fontSize: 13 }}>Save Changes</button>
             </div>
           </div>

           {activeSection === "profile" && (
             <div style={{ display: 'flex', flexDirection: 'column', gap: 32, maxWidth: 600 }}>
               <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: LUXURY_COLORS.textSecondary, marginBottom: 12, letterSpacing: 1 }}>DISPLAY ALIAS</label>
                  <input className="luxury-input" value={draftDisplayName} onChange={e => setDraftDisplayName(e.target.value)} placeholder="Your display name" />
               </div>
               <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: LUXURY_COLORS.textSecondary, marginBottom: 12, letterSpacing: 1 }}>BIOGRAPHY</label>
                  <textarea className="luxury-input" value={draftBio} onChange={e => setDraftBio(e.target.value)} placeholder="A few words about yourself..." rows={4} style={{ resize: 'vertical' }} />
               </div>
               
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', background: LUXURY_COLORS.surfaceHover, borderRadius: 12, border: `1px solid ${LUXURY_COLORS.borderSubtle}` }}>
                 <div>
                   <div style={{ fontWeight: 600, marginBottom: 4 }}>Broadcast Presence</div>
                   <div style={{ fontSize: 13, color: LUXURY_COLORS.textSecondary }}>Allow others to see when you are online.</div>
                 </div>
                 <div onClick={() => setDraftShowOnlineStatus(!draftShowOnlineStatus)} style={{ width: 50, height: 28, borderRadius: 14, background: draftShowOnlineStatus ? LUXURY_COLORS.goldMedium : '#D0D0D0', position: 'relative', cursor: 'pointer', transition: '0.3s' }}>
                   <div style={{ position: 'absolute', top: 2, left: draftShowOnlineStatus ? 24 : 2, width: 24, height: 24, borderRadius: '50%', background: 'white', transition: '0.3s', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }} />
                 </div>
               </div>
             </div>
           )}


           {activeSection === "appearance" && (() => {
             const THEME_PREVIEW = {
               "light":              { primary: "#3b82f6", bg: "#ffffff" },
               "dark":               { primary: "#ef4444", bg: "#0a0a0a" },
               "neon-cyberpunk":     { primary: "#8b5cf6", bg: "#0c0e14" },
               "amoled-dark":        { primary: "#E8C990", bg: "#000000" },
               "gamer-high-energy":  { primary: "#ff2d78", bg: "#080614" },
               "pastel-dream":       { primary: "#e060b0", bg: "#ffd4ee" },
             };
             return (
               <div>
                 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 24 }}>
                    {THEMES.map(t => {
                      const preview = THEME_PREVIEW[t] || { primary: "#CFAE84", bg: "#F7F5F0" };
                      return (
                        <div key={t} onClick={() => setDraftTheme(t)} style={{ padding: 24, borderRadius: 16, border: `2px solid ${draftTheme === t ? LUXURY_COLORS.goldMedium : LUXURY_COLORS.borderSubtle}`, background: 'white', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s', boxShadow: draftTheme === t ? LUXURY_COLORS.shadowSoft : 'none' }}>
                           <div style={{ width: '100%', height: 60, background: preview.bg, borderRadius: 8, marginBottom: 16, display: 'flex', overflow: 'hidden', border: `1px solid ${LUXURY_COLORS.borderSubtle}` }}>
                              <div style={{ flex: 1, background: preview.primary }} />
                              <div style={{ flex: 2, background: preview.bg }} />
                           </div>
                           <span style={{ fontSize: 13, fontWeight: 600 }}>{THEME_LABELS[t] || t.toUpperCase()}</span>
                        </div>
                      );
                    })}
                 </div>
               </div>
             );
           })()}


            {activeSection === "sound" && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 600 }}>
                 <div style={{ padding: '24px', background: LUXURY_COLORS.surfaceHover, borderRadius: 12, border: `1px solid ${LUXURY_COLORS.borderSubtle}` }}>
                   <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: LUXURY_COLORS.textSecondary, marginBottom: 16, letterSpacing: 1 }}>MASTER VOLUME</label>
                   <input type="range" min="0" max="1" step="0.01" value={draftSoundSettings.volume} onChange={e => { const v = parseFloat(e.target.value); setDraftSoundSettings(p => ({...p, volume: v})); try { useSettingsStore.getState().updateSetting('sound.volume', v); } catch (_) {} }} style={{ width: '100%', accentColor: LUXURY_COLORS.goldDark }} />
                 </div>
                 
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', background: LUXURY_COLORS.surfaceHover, borderRadius: 12, border: `1px solid ${LUXURY_COLORS.borderSubtle}` }}>
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>Haptic Sounds</div>
                    <div style={{ fontSize: 13, color: LUXURY_COLORS.textSecondary }}>Play acoustic feedback on interaction.</div>
                  </div>
                  <div onClick={() => { const v = !draftSoundSettings.clickSound; setDraftSoundSettings(p => ({...p, clickSound: v})); try { useSettingsStore.getState().updateSetting('sound.clickEnabled', v); } catch (_) {} }} style={{ width: 50, height: 28, borderRadius: 14, background: draftSoundSettings.clickSound ? LUXURY_COLORS.goldMedium : '#D0D0D0', position: 'relative', cursor: 'pointer', transition: '0.3s' }}>
                    <div style={{ position: 'absolute', top: 2, left: draftSoundSettings.clickSound ? 24 : 2, width: 24, height: 24, borderRadius: '50%', background: 'white', transition: '0.3s' }} />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', background: LUXURY_COLORS.surfaceHover, borderRadius: 12, border: `1px solid ${LUXURY_COLORS.borderSubtle}` }}>
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>Message Alerts</div>
                    <div style={{ fontSize: 13, color: LUXURY_COLORS.textSecondary }}>Play a chime on receiving transmissions.</div>
                  </div>
                  <div onClick={() => { const v = !draftSoundSettings.messageSound; setDraftSoundSettings(p => ({...p, messageSound: v})); try { useSettingsStore.getState().updateSetting('sound.notificationEnabled', v); } catch (_) {} }} style={{ width: 50, height: 28, borderRadius: 14, background: draftSoundSettings.messageSound ? LUXURY_COLORS.goldMedium : '#D0D0D0', position: 'relative', cursor: 'pointer', transition: '0.3s' }}>
                    <div style={{ position: 'absolute', top: 2, left: draftSoundSettings.messageSound ? 24 : 2, width: 24, height: 24, borderRadius: '50%', background: 'white', transition: '0.3s' }} />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', background: LUXURY_COLORS.surfaceHover, borderRadius: 12, border: `1px solid ${LUXURY_COLORS.borderSubtle}` }}>
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>Background Ambience</div>
                    <div style={{ fontSize: 13, color: LUXURY_COLORS.textSecondary }}>Play a soothing background atmosphere.</div>
                  </div>
                  <div onClick={() => { const v = !(draftSoundSettings.ambientStorm ?? draftSoundSettings.orbitAmbientEnabled ?? true); setDraftSoundSettings(p => ({...p, ambientStorm: v, orbitAmbientEnabled: v})); try { useSettingsStore.getState().updateSetting('sound.orbitAmbientEnabled', v); } catch (_) {} }} style={{ width: 50, height: 28, borderRadius: 14, background: (draftSoundSettings.ambientStorm ?? draftSoundSettings.orbitAmbientEnabled ?? true) ? LUXURY_COLORS.goldMedium : '#D0D0D0', position: 'relative', cursor: 'pointer', transition: '0.3s' }}>
                    <div style={{ position: 'absolute', top: 2, left: (draftSoundSettings.ambientStorm ?? draftSoundSettings.orbitAmbientEnabled ?? true) ? 24 : 2, width: 24, height: 24, borderRadius: '50%', background: 'white', transition: '0.3s' }} />
                  </div>
                </div>
              </div>
            )}

            {activeSection === "notifications" && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 600 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', background: LUXURY_COLORS.surfaceHover, borderRadius: 12, border: `1px solid ${LUXURY_COLORS.borderSubtle}` }}>
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>Enable Alerts</div>
                    <div style={{ fontSize: 13, color: LUXURY_COLORS.textSecondary }}>Receive desktop notifications for messages.</div>
                  </div>
                  <div onClick={() => { const v = !draftNotifications.enabled; setDraftNotifications(p => ({...p, enabled: v, desktop: v})); try { useSettingsStore.getState().updateSetting('notifications.enabled', v); } catch (_) {} }} style={{ width: 50, height: 28, borderRadius: 14, background: draftNotifications.enabled ? LUXURY_COLORS.goldMedium : '#D0D0D0', position: 'relative', cursor: 'pointer', transition: '0.3s' }}>
                    <div style={{ position: 'absolute', top: 2, left: draftNotifications.enabled ? 24 : 2, width: 24, height: 24, borderRadius: '50%', background: 'white', transition: '0.3s' }} />
                  </div>
                </div>
              </div>
            )}

        </div>
      </div>
    </LuxuryWrapper>
  );
}
