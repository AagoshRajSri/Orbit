import { useEffect, useRef, useState, useCallback, useMemo, memo, Fragment } from "react";
import UniversalChatContainer from "../components/chat/UniversalChatContainer";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { useSpotifyStore } from "../store/useSpotifyStore";
import { THEMES, THEME_LABELS } from "../constants";
import { useSoundManager } from "../hooks/useSoundManager";
import { useChatStore } from "../store/useChatStore";
import { gsap } from "gsap";
import { useNexusStore } from "../store/useNexusStore";
import { useSettingsStore } from "../store/useSettingsStore";
import NexusActionOverlay from "../components/nexus/NexusActionOverlay";
import { PixelAvatarBadge } from "../components/avatar/PixelAvatar/PixelAvatarBadge.jsx";
import { spotifyService } from "../services/spotifyService";
import { API_URL } from "../config";
import CyberpunkThemeLayout from "../components/layout/themes/cyberpunk/CyberpunkThemeLayout";
import "./styles/cyberpunk.css";

/* ─────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────── */
const C = "#00fff5";   // neon cyan
const M = "#ff00c8";   // neon magenta
const P = "#b026ff";   // neon purple
const Y = "#ffe600";   // neon yellow

const SCAN_FEED = [
  { node: "NEXUS_7A", type: "HANDSHAKE", time: "0:03", color: C },
  { node: "GHOST_ID", type: "ENCRYPTED", time: "0:12", color: M, mine: true },
  { node: "SHADOW_X", type: "LATENCY_OK", time: "0:29", color: P },
  { node: "YOU", type: "UPLINK_ACT", time: "0:44", color: Y, mine: true },
];

const METRICS = [
  { label: "SOCKET_LAT", val: "12ms", color: C },
  { label: "SYNC_RANK", val: "ALPHA", color: P },
  { label: "UPTIME", val: "99.9%", color: Y },
  { label: "NEXUS_CNT", val: "1,337", color: M },
];

/* ─────────────────────────────────────────────
   INLINE KEYFRAMES
───────────────────────────────────────────── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Rajdhani:wght@400;500;600;700&family=Share+Tech+Mono&family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
  @keyframes ncbPulse{0%,100%{opacity:1}50%{opacity:0.4}}
  @keyframes ncbSpin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
  @keyframes ncbSpinR{from{transform:rotate(0deg)}to{transform:rotate(-360deg)}}
  @keyframes ncbStream{0%{top:-100%;height:60px;opacity:0}20%{opacity:0.7}80%{opacity:0.7}100%{top:100%;height:60px;opacity:0}}
  @keyframes ncbBlink{0%,100%{opacity:1}50%{opacity:0}}
  @keyframes ncbShimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
  @keyframes ncbGlitch1{0%,93%,100%{opacity:0;transform:translateX(0)}94%{opacity:1;transform:translateX(-4px)}96%{opacity:1;transform:translateX(4px)}}
  @keyframes ncbGlitch2{0%,95%,100%{opacity:0;transform:translateX(0)}96%{opacity:1;transform:translateX(4px)}98%{opacity:1;transform:translateX(-3px)}}
  @keyframes ncbFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
  @keyframes ncbMatrixFade{0%{opacity:1}100%{opacity:0}}
  @keyframes ncbScanline{0%{transform:translateY(-100%)}100%{transform:translateY(100%)}}
  *{box-sizing:border-box;} button:focus{outline:none;}
  ::-webkit-scrollbar{width:3px;height:3px;} 
  ::-webkit-scrollbar-track{background:rgba(0,0,0,0.4);}
  ::-webkit-scrollbar-thumb{background:rgba(0,255,245,0.2);border-radius:0;border-top:1px solid rgba(0,255,245,0.08);}
  ::-webkit-scrollbar-thumb:hover{background:rgba(0,255,245,0.5);}

  .ncb-glitch-text:hover { position: relative; animation: ncbGlitch1 0.4s infinite; }

  .ncb-scroll-hide::-webkit-scrollbar { display: none; }
  .ncb-scroll-hide { -ms-overflow-style: none; scrollbar-width: none; }
  .ncb-glitch-text::before, .ncb-glitch-text::after { content: attr(data-text); position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0; }
  .ncb-glitch-text:hover::before { animation: ncbGlitch1 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94) both infinite; color: #ff00c8; z-index: -1; }
  .ncb-glitch-text:hover::after { animation: ncbGlitch2 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) both infinite; color: #00fff5; z-index: -2; }
  
  @media (max-width: 768px) {
    .ncb-desktop-nav { flex-wrap: wrap !important; height: auto !important; padding: 10px 14px !important; gap: 8px !important; }
    .ncb-desktop-nav > div { flex-wrap: wrap !important; }
    .ncb-center-hud { display: none !important; }
    .ncb-container { flex-direction: column !important; }
    .ncb-container.chat-inactive { overflow-y: auto; overflow-x: hidden; }
    .ncb-sidebar { width: 100% !important; border-right: none !important; border-bottom: 1px solid rgba(176,38,255,0.3) !important; max-height: none !important; flex: none !important; }
    .ncb-container.chat-active .ncb-sidebar { display: none !important; }
    .ncb-main { min-height: 600px; flex: none !important; }
    .ncb-container.chat-active .ncb-main { min-height: auto; flex: 1 !important; display: flex; flexDirection: column; }
    .ncb-grid { grid-template-columns: 1fr !important; }
    .ncb-hero h1 { font-size: 26px !important; }
    .ncb-hero-btn { width: 100% !important; text-align: center !important; }
    .ncb-settings-layout { flex-direction: column !important; }
    .ncb-settings-nav { width: 100% !important; }
    .ncb-profile-layout { flex-direction: column !important; }
    .ncb-profile-card { width: 100% !important; }
  }

  /* ── Cyberpunk Chat Theme ── */
  .neon-chat-env .nexus-chat-container {
    background: linear-gradient(180deg, #1A0033 0%, #000000 100%) !important;
    border: 1px solid rgba(255,0,255,0.3) !important;
    border-radius: 12px !important; overflow: hidden !important;
    box-shadow: 0 0 30px rgba(255,0,255,0.1), inset 0 0 20px rgba(0,255,255,0.05) !important;
  }
  .neon-chat-env .nxc-messages {
    position: relative !important;
    background: transparent !important;
  }
  .neon-chat-env .nxc-messages::before {
    content: ""; position: absolute; inset: 0; z-index: -1; opacity: 0.02; pointer-events: none;
    background-image: linear-gradient(180deg, rgba(0,255,255,0) 0%, rgba(0,255,255,1) 50%, rgba(0,255,255,0) 100%);
    background-size: 10px 200px;
    background-repeat: repeat;
    animation: cyber-rain 6s linear infinite;
  }
  @keyframes cyber-rain { 100% { background-position: 0 100%; } }

  .neon-chat-env .nexus-chat-header { 
    background: rgba(5,2,10,0.8) !important; 
    border-bottom: 2px solid #FF00FF !important;
    border-top: 2px solid #00FFFF !important;
    box-shadow: 0 4px 20px rgba(255,0,255,0.2), inset 0 2px 10px rgba(0,255,255,0.2) !important;
    backdrop-filter: blur(12px) !important;
  }
  .neon-chat-env .nexus-chat-header .nxc-name { color: #fff !important; font-family: 'Orbitron', sans-serif !important; letter-spacing: 2px !important; text-shadow: 0 0 8px #FF00FF !important; }

  .neon-chat-env .nxc-utility-group, .neon-chat-env .nxc-telemetry-capsule {
    background: rgba(0,0,0,0.6) !important;
    border: 1px solid rgba(0,255,255,0.3) !important;
  }
  .neon-chat-env .nxc-hbtn, .neon-chat-env .nxc-aero-btn {
    color: #00FFFF !important;
    text-shadow: 1px 0 0 red, -1px 0 0 blue !important; /* chromatic aberration */
    transition: all 0.2s !important;
  }
  .neon-chat-env .nxc-hbtn:hover, .neon-chat-env .nxc-aero-btn:hover {
    text-shadow: 0 0 10px #FF00FF, 0 0 20px #00FFFF !important;
    transform: scale(1.1) !important;
  }
  .neon-chat-env .bg-white\\/20 { background: #FF00FF !important; opacity: 0.5 !important; }

  .neon-chat-env .nxi-shell {
    background: rgba(5,2,10,0.8) !important; 
    border-top: 2px solid #00FFFF !important;
    backdrop-filter: blur(12px) !important;
  }
  .neon-chat-env .nxi-textarea {
    background: rgba(0,0,0,0.6) !important;
    border: 1px solid rgba(0,255,255,0.5) !important;
    color: #00FFFF !important;
    font-family: 'Rajdhani', monospace !important;
  }
  .neon-chat-env .nxi-textarea:focus { border-color: #FF00FF !important; box-shadow: 0 0 10px rgba(255,0,255,0.3) !important; }
  .neon-chat-env .nxi-send.ready {
    background: #FF00FF !important;
    border: 1px solid #FF00FF !important;
    color: #fff !important;
    box-shadow: 0 0 15px #FF00FF !important;
  }
  .neon-chat-env .nxi-tool-btn, .neon-chat-env .nxi-mic { color: #00FFFF !important; }

  .neon-chat-env .msg-bubble-mine { 
    background: rgba(255,0,255,0.15) !important; 
    border: 1px solid #FF00FF !important; 
    color: #00FFFF !important;
    box-shadow: 0 0 12px rgba(255,0,255,0.3) !important;
    font-family: 'Rajdhani', sans-serif !important;
  }
  .neon-chat-env .msg-bubble-other { 
    background: rgba(0,255,255,0.08) !important; 
    border: 1px solid rgba(0,255,255,0.4) !important; 
    color: #fff !important;
    font-family: 'Rajdhani', sans-serif !important;
  }
`;

/* ─────────────────────────────────────────────
   CANVAS: ORBIT CODE RAIN
───────────────────────────────────────────── */
const OrbitRain = memo(() => {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext("2d");
    c.width = c.offsetWidth; c.height = c.offsetHeight;
    const cols = Math.floor(c.width / 16);
    const drops = Array(cols).fill(1);
    const chars = "10ORBITНЕХУС//SYS//10101XYZ!@#$%^&*";
    const iv = setInterval(() => {
      ctx.fillStyle = "rgba(9,0,20,0.06)";
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.font = "13px 'Share Tech Mono'";
      drops.forEach((y, i) => {
        const ch = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillStyle = Math.random() > 0.97 ? P : `rgba(0,255,245,0.35)`;
        ctx.fillText(ch, i * 16, y * 16);
        if (y * 16 > c.height && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      });
    }, 50);
    return () => clearInterval(iv);
  }, []);
  return <canvas ref={ref} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.18 }} />;
});

/* ─────────────────────────────────────────────
   CANVAS: ORBITAL RING VISUALIZER
───────────────────────────────────────────── */
const OrbitalViz = memo(({ playing }) => {
  const ref = useRef(null);
  const bars = useRef(Array.from({ length: 28 }, () => 0.3 + Math.random() * 0.7));
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext("2d"), W = c.width, H = c.height, cx = W / 2, cy = H / 2;
    let t = 0, raf;
    const colors = [C, P, M, Y, C];
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      if (playing) bars.current = bars.current.map(v => Math.max(0.05, Math.min(1, v + (Math.random() - 0.5) * 0.35)));
      // Outer ring
      ctx.strokeStyle = `rgba(0,255,245,0.2)`; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(cx, cy, 52, 0, Math.PI * 2); ctx.stroke();
      // Bars around circle
      bars.current.forEach((h, i) => {
        const a = (i / bars.current.length) * Math.PI * 2 - Math.PI / 2;
        const r0 = 32, r1 = r0 + h * 18;
        ctx.strokeStyle = colors[i % colors.length];
        ctx.lineWidth = 2.5;
        ctx.shadowColor = colors[i % colors.length]; ctx.shadowBlur = 4;
        ctx.beginPath();
        ctx.moveTo(cx + r0 * Math.cos(a), cy + r0 * Math.sin(a));
        ctx.lineTo(cx + r1 * Math.cos(a), cy + r1 * Math.sin(a));
        ctx.stroke(); ctx.shadowBlur = 0;
      });
      // Center dot
      const grd = ctx.createRadialGradient(cx, cy, 2, cx, cy, 18);
      grd.addColorStop(0, P); grd.addColorStop(1, "transparent");
      ctx.fillStyle = grd; ctx.beginPath(); ctx.arc(cx, cy, 18, 0, Math.PI * 2); ctx.fill();
      // Rotating spoke
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(t);
      ctx.strokeStyle = `rgba(0,255,245,0.6)`; ctx.lineWidth = 1;
      ctx.setLineDash([4, 6]);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(52, 0); ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
      t += 0.03; raf = requestAnimationFrame(draw);
    };
    draw(); return () => cancelAnimationFrame(raf);
  }, [playing]);
  return <canvas ref={ref} width={120} height={120} style={{ display: "block" }} />;
});

/* ─────────────────────────────────────────────
   INTERNAL COMPONENTS
───────────────────────────────────────────── */
const NeonCard = ({ children, color = C, style = {}, className = "" }) => (
  <div
    className={`neon-card-base ${className}`}
    style={{
      background: "rgba(0, 0, 0, 0.7)",
      border: `1px solid ${color}44`,
      boxShadow: `0 0 20px ${color}15`,
      borderRadius: "12px",
      position: "relative",
      overflow: "hidden",
      ...style
    }}
  >
    <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "2px", background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />
    {children}
  </div>
);

const ToggleSwitch = ({ label, checked, onChange, color = C }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "rgba(255,255,255,0.02)", borderRadius: 8, border: "1px solid rgba(255,255,255,0.05)" }}>
    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", fontFamily: "'Orbitron', monospace", letterSpacing: "0.1em" }}>{label}</span>
    <div
      onClick={() => onChange(!checked)}
      style={{ width: 34, height: 18, borderRadius: 9, background: checked ? color : "rgba(255,255,255,0.1)", position: "relative", cursor: "pointer", transition: "all 0.3s", boxShadow: checked ? `0 0 10px ${color}66` : "none" }}
    >
      <div style={{ width: 14, height: 14, borderRadius: "50%", background: checked ? "#000" : "#666", position: "absolute", top: 2, left: checked ? 18 : 2, transition: "all 0.3s" }} />
    </div>
  </div>
);

const OrbitalViz = ({ playing }) => (
  <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#050505" }}>
    <div className={`orbit-spinner ${playing ? "running" : "paused"}`} style={{ width: 60, height: 60, border: `2px solid ${C}22`, borderRadius: "50%", borderTopColor: C, animation: "ncb-spin 2s linear infinite" }} />
  </div>
);

export default function OrbitNeonCyberpunk({ children }) {
  return <CyberpunkThemeLayout children={children} />;
}

export function CyberpunkSettings({
  activeSection, setActiveSection,
  draftTheme, setDraftTheme,
  draftDisplayName, setDraftDisplayName,
  draftBio, setDraftBio,
  draftNotifications, setDraftNotifications,
  draftShowOnlineStatus, setDraftShowOnlineStatus,
  draftOrbitBehavior, setDraftOrbitBehavior,
  draftSoundSettings, setDraftSoundSettings,
  isDirty, handleSave, handleReset, authUser,
}) {
  const [focusedTheme, setFocusedTheme] = useState(draftTheme);
  const { play } = useSoundManager();

  const sections = [
    { id: "profile", label: "IDENTITY", icon: "👤" },
    { id: "sound", label: "AUDIO", icon: "🔊" },
    { id: "appearance", label: "VISUALS", icon: "🎨" },
    { id: "notifications", label: "ALERTS", icon: "🔔" },
    { id: "orbit", label: "ENGINE", icon: "🪐" },
  ];

  return (
    <OrbitNeonCyberpunk>
      <div className="ncb-settings-layout" style={{ display: "flex", gap: 20, height: "100%", padding: "20px" }}>
        {/* Settings Nav */}
        <NeonCard color={C} style={{ width: 260, padding: 20, display: "flex", flexDirection: "column", gap: 10, flexShrink: 0 }} className="ncb-settings-nav">
          <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: "0.25em", color: `${C}88`, fontFamily: "'Orbitron',monospace", marginBottom: 4 }}>// SYS.PREFERENCES</div>
          {sections.map(s => (
            <button key={s.id} onClick={() => { play?.("click"); setActiveSection(s.id); }} style={{ width: "100%", textAlign: "left", padding: "12px 16px", background: activeSection === s.id ? `${C}14` : "transparent", border: "1px solid", borderColor: activeSection === s.id ? C : "transparent", borderRadius: 6, color: activeSection === s.id ? "#fff" : `${C}66`, fontFamily: "'Orbitron', monospace", fontSize: 11, letterSpacing: "0.15em", cursor: "pointer", transition: "all 0.2s", display: "flex", alignItems: "center", gap: 10, boxShadow: activeSection === s.id ? `0 0 10px ${C}33` : "none" }}>
              <span style={{ fontSize: 16 }}>{s.icon}</span>{s.label}
            </button>
          ))}
          <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
            <button onClick={() => { play?.("click"); handleReset(); }} disabled={!isDirty} style={{ width: "100%", padding: "12px", borderRadius: 6, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: isDirty ? "#fff" : "rgba(255,255,255,0.25)", fontSize: 11, fontFamily: "'Orbitron', monospace", cursor: isDirty ? "pointer" : "default", letterSpacing: "0.1em" }}>ROLLBACK</button>
            <button onClick={() => { play?.("click"); handleSave(); }} disabled={!isDirty} style={{ width: "100%", padding: "12px", borderRadius: 6, background: isDirty ? `linear-gradient(90deg,${C},${P})` : `${C}15`, border: `1px solid ${isDirty ? C : `${C}22`}`, color: isDirty ? "#000" : `${C}44`, fontWeight: 900, fontSize: 11, fontFamily: "'Orbitron', monospace", cursor: isDirty ? "pointer" : "default", boxShadow: isDirty ? `0 0 15px ${C}55` : "none", letterSpacing: "0.1em" }}>COMMIT</button>
          </div>
        </NeonCard>

        {/* Settings Content */}
        <NeonCard color={P} style={{ flex: 1, padding: 28, overflowY: "auto" }}>
          <h2 style={{ fontSize: 20, fontWeight: 900, color: C, fontFamily: "'Orbitron',monospace", marginBottom: 24, textShadow: `0 0 10px ${C}`, letterSpacing: "0.15em" }}>
            SYS_PREF // {activeSection.toUpperCase()}
          </h2>

          {activeSection === "appearance" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 14 }}>
                  {THEMES.map(t => {
                    const isSelected = focusedTheme === t;
                    const isApplied = draftTheme === t;
                    
                    // Fixed preview colors for each theme
                    let previewPrimary = "#8b5cf6"; // default (cyber purple)
                    let previewBg = "#0c0e14";
                    
                    if (t === "light") { previewPrimary = "#3b82f6"; previewBg = "#ffffff"; }
                    else if (t === "dark") { previewPrimary = "#ef4444"; previewBg = "#0a0a0a"; }
                    else if (t === "neon-cyberpunk") { previewPrimary = "#8b5cf6"; previewBg = "#0c0e14"; }
                    else if (t === "gamer-high-energy") { previewPrimary = "#ff2d78"; previewBg = "#080614"; }
                    else if (t === "pastel-dream") { previewPrimary = "#e060b0"; previewBg = "#ffd4ee"; }
                    else if (t === "amoled-dark") { previewPrimary = "#E8C990"; previewBg = "#000000"; }

                    return (
                        <div key={t} onClick={() => { play?.("click"); setFocusedTheme(t); }} style={{ padding: 14, borderRadius: 10, border: isSelected ? `2px solid ${C}` : `1px solid rgba(255,255,255,0.08)`, background: isSelected ? `${C}10` : "rgba(255,255,255,0.02)", display: "flex", flexDirection: "column", gap: 10, cursor: "pointer", transition: "all 0.2s", boxShadow: isSelected ? `0 0 15px ${C}33` : "none" }}>
                          <div style={{ width: "100%", height: 36, borderRadius: 5, border: "1px solid rgba(255,255,255,0.06)", overflow: "hidden", display: "flex", background: previewBg }}>
                            <div style={{ flex: 1, background: previewPrimary }} />
                            <div style={{ flex: 1, background: previewBg }} />
                          </div>

                          <div style={{ textAlign: "center" }}>
                            <div style={{ fontSize: 9, color: isSelected ? C : "rgba(255,255,255,0.4)", fontFamily: "'Orbitron', monospace", letterSpacing: "0.05em" }}>{THEME_LABELS[t] || t.toUpperCase()}</div>
                            {isSelected && !isApplied && (
                              <button onClick={e => { e.stopPropagation(); play?.("click"); setDraftTheme(t); }} style={{ marginTop: 6, padding: "5px 8px", width: "100%", background: C, border: "none", color: "#000", fontSize: 8, fontWeight: 900, fontFamily: "'Orbitron', monospace", cursor: "pointer", borderRadius: 4, letterSpacing: "0.1em", boxShadow: `0 0 8px ${C}66` }}>DEPLOY</button>
                            )}
                            {isApplied && <div style={{ marginTop: 6, fontSize: 9, color: C, fontWeight: 700, fontFamily: "'Orbitron', monospace" }}>✓ ACTIVE</div>}
                          </div>

                        </div>

                    );
                  })}
            </div>
          )}

          {activeSection === "sound" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ background: "rgba(255,255,255,0.02)", padding: 16, borderRadius: 10, border: "1px solid rgba(255,255,255,0.05)" }}>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", marginBottom: 12, fontFamily: "'Orbitron', monospace", letterSpacing: "0.1em" }}>MASTER GAIN: {(draftSoundSettings.volume * 100).toFixed(0)}%</div>
                <input type="range" min="0" max="1" step="0.01" value={draftSoundSettings.volume} onChange={e => { const v = parseFloat(e.target.value); setDraftSoundSettings(p => ({ ...p, volume: v })); try { useSettingsStore.getState().updateSetting('sound.volume', v); } catch (_) {} }} style={{ width: "100%", accentColor: C }} />
              </div>

              <ToggleSwitch label="GLOBAL EFFECTS" checked={draftSoundSettings.effectsEnabled} onChange={v => { setDraftSoundSettings(p => ({ ...p, effectsEnabled: v })); try { useSettingsStore.getState().updateSetting('sound.enabled', v); } catch (_) {} }} />
              <ToggleSwitch label="TRANSMISSION PINGS" checked={draftSoundSettings.messageSound} onChange={v => { setDraftSoundSettings(p => ({ ...p, messageSound: v })); try { useSettingsStore.getState().updateSetting('sound.notificationEnabled', v); } catch (_) {} }} />
              <ToggleSwitch label="HAPTIC CLICKS" checked={draftSoundSettings.clickSound} onChange={v => { setDraftSoundSettings(p => ({ ...p, clickSound: v })); try { useSettingsStore.getState().updateSetting('sound.clickEnabled', v); } catch (_) {} }} />

            </div>
          )}

          {activeSection === "profile" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ background: "rgba(255,255,255,0.02)", padding: 16, borderRadius: 10, border: "1px solid rgba(255,255,255,0.05)" }}>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", fontFamily: "'Orbitron', monospace", letterSpacing: "0.06em", display: "block", marginBottom: 10 }}>HANDLE ALIAS</span>
                <input type="text" value={draftDisplayName} onChange={e => setDraftDisplayName(e.target.value)} placeholder={authUser?.username || "Ghost"} style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: `1px solid ${C}44`, color: C, padding: "10px 14px", borderRadius: 6, fontFamily: "'Rajdhani', monospace", fontSize: 15, outline: "none", boxShadow: `inset 0 0 10px ${C}11` }} />
              </div>


              <div style={{ background: "rgba(255,255,255,0.02)", padding: 16, borderRadius: 10, border: "1px solid rgba(255,255,255,0.05)" }}>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", fontFamily: "'Orbitron', monospace", letterSpacing: "0.06em", display: "block", marginBottom: 10 }}>DIRECTIVE BIO</span>
                <textarea value={draftBio} onChange={e => setDraftBio(e.target.value)} placeholder="Initialise directive..." style={{ width: "100%", height: 80, background: "rgba(0,0,0,0.4)", border: `1px solid ${C}44`, color: C, padding: "10px 14px", borderRadius: 6, fontFamily: "'Rajdhani', monospace", fontSize: 14, outline: "none", boxShadow: `inset 0 0 10px ${C}11`, resize: "none" }} />
              </div>

              <ToggleSwitch label="BROADCAST PRESENCE" checked={draftShowOnlineStatus} onChange={setDraftShowOnlineStatus} color={M} />
            </div>
          )}

          {activeSection === "notifications" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <ToggleSwitch label="DESKTOP OVERLAYS" checked={draftNotifications.desktop} onChange={v => { setDraftNotifications(p => ({ ...p, desktop: v })); try { useSettingsStore.getState().updateSetting('notifications.desktopEnabled', v); } catch (_) {} }} color={Y} />
              <ToggleSwitch label="AUDIO CUES" checked={draftNotifications.sound} onChange={v => { setDraftNotifications(p => ({ ...p, sound: v })); try { useSettingsStore.getState().updateSetting('notifications.enabled', v); } catch (_) {} }} color={Y} />
              <ToggleSwitch label="EMAIL DIGESTS" checked={draftNotifications.email} onChange={v => setDraftNotifications(p => ({ ...p, email: v }))} color={Y} />
            </div>
          )}

          {activeSection === "orbit" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <ToggleSwitch label="RENDER RINGS" checked={draftOrbitBehavior.showRings} onChange={v => setDraftOrbitBehavior(p => ({ ...p, showRings: v }))} color={P} />
              <ToggleSwitch label="MOMENTUM PAUSE" checked={draftOrbitBehavior.autoPauseOnHover} onChange={v => setDraftOrbitBehavior(p => ({ ...p, autoPauseOnHover: v }))} color={P} />
              <div style={{ background: "rgba(255,255,255,0.02)", padding: 16, borderRadius: 10, border: "1px solid rgba(255,255,255,0.05)", display: "flex", flexDirection: "column", gap: 10 }}>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", fontFamily: "'Orbitron', monospace", letterSpacing: "0.06em" }}>INTERACTION FILTER</span>
                <select value={draftOrbitBehavior.interactionFilter} onChange={e => setDraftOrbitBehavior(p => ({ ...p, interactionFilter: e.target.value }))} style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: `1px solid ${P}44`, color: P, padding: "10px 14px", borderRadius: 6, fontFamily: "'Rajdhani', monospace", fontSize: 15, outline: "none" }}>
                  <option value="all">ALL NODES</option>
                  <option value="active">ACTIVE NODES ONLY</option>
                  <option value="mutual">MUTUAL ORBITS ONLY</option>
                </select>
              </div>

            </div>
          )}
        </NeonCard>
      </div>
    </OrbitNeonCyberpunk>
  );
}

export function CyberpunkProfile() {
  const authUser = useAuthStore(s => s.authUser);
  const navigate = useNavigate();
  return (
    <OrbitNeonCyberpunk>
      <div className="ncb-profile-layout" style={{ display: "flex", gap: 20, height: "100%", padding: "20px" }}>
        <NeonCard color={M} style={{ width: 280, padding: 24, display: "flex", flexDirection: "column", alignItems: "center", gap: 16, flexShrink: 0 }} className="ncb-profile-card">
          <div style={{ position: "relative" }}>
            <div style={{ width: 120, height: 120, borderRadius: "50%", border: `2px solid ${M}`, overflow: "hidden", boxShadow: `0 0 24px ${M}66` }}>
              <img src={authUser?.profilePic || "https://api.dicebear.com/7.x/avataaars/svg?seed=Cyber"} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="avatar" />
            </div>
            <div style={{ position: "absolute", bottom: 4, right: 4, width: 16, height: 16, borderRadius: "50%", border: `2px solid ${C}`, background: C, boxShadow: `0 0 8px ${C}` }} />
          </div>
          <div style={{ textAlign: "center" }}>
            <h2 style={{ fontSize: 18, fontWeight: 900, color: "#fff", fontFamily: "'Orbitron',monospace", letterSpacing: "0.1em", textShadow: `0 0 10px ${C}66` }}>
              {authUser?.username || "GHOST_USER"}
            </h2>
            <div style={{ fontSize: 10, color: C, fontFamily: "'Share Tech Mono'", marginTop: 4, letterSpacing: "0.15em" }}>SYNC RANK: ALPHA</div>
          </div>
          <div style={{ width: "100%", height: 1, background: `${M}33` }} />
          {[["NEXUS NODES", "1,337"], ["CONSTELLATIONS", "14"], ["UPTIME", "99.9%"]].map(([l, v]) => (
            <div key={l} style={{ width: "100%", display: "flex", justifyContent: "space-between", fontSize: 12, fontFamily: "'Rajdhani',monospace", color: "rgba(255,255,255,0.65)" }}>
              <span>{l}</span><span style={{ color: C, fontWeight: "bold" }}>{v}</span>
            </div>
          ))}
        </NeonCard>
        <NeonCard color={C} style={{ flex: 1, padding: 24 }}>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: C, fontFamily: "'Orbitron',monospace", marginBottom: 20, textShadow: `0 0 10px ${C}`, letterSpacing: "0.1em" }}>NODE RECORD</h2>
          <div style={{ fontSize: 14, color: "rgba(255,255,255,0.55)", fontFamily: "'Rajdhani',monospace", lineHeight: 1.7 }}>
            {authUser?.bio || "No mission logs recorded. Initialize your profile to begin transmitting."}
          </div>
          <button onClick={() => navigate("/")} style={{ marginTop: "auto", padding: "10px 20px", background: "transparent", border: `1px solid ${C}`, color: C, borderRadius: 6, cursor: "pointer", fontFamily: "'Orbitron', monospace", fontSize: 11 }}>BACK</button>
        </NeonCard>
      </div>
    </OrbitNeonCyberpunk>
  );
}

export function CyberpunkSpotify() {
  const { spotifyLinked, currentTrack, isPlaying, pausePlayback, playTrack } = useSpotifyStore();
  const [playing, setPlaying] = useState(isPlaying || false);
  const { play } = useSoundManager();
  useEffect(() => { setPlaying(isPlaying); }, [isPlaying]);

  return (
    <OrbitNeonCyberpunk>
      <div style={{ padding: 40, height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <NeonCard color={C} style={{ flex: 1, maxWidth: 600, padding: 40, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 28 }}>
          <h2 style={{ fontSize: 28, fontWeight: 900, color: C, fontFamily: "'Orbitron',monospace", textShadow: `0 0 20px ${C}88`, letterSpacing: "0.15em" }}>AUDIO SYNC</h2>
          {!spotifyLinked ? (
            <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
              <div style={{ fontSize: 15, color: "rgba(255,255,255,0.6)", fontFamily: "'Rajdhani',monospace", maxWidth: 400, lineHeight: 1.6 }}>
                Link your Spotify account to sync spatial audio across all active dimensions and orbit sessions.
              </div>
              <button
                onClick={async () => {
                  try {
                    await spotifyService.initiateLogin();
                  } catch (error) {
                    console.error("Failed to connect Spotify:", error);
                  }
                }}
                style={{ padding: "12px 28px", borderRadius: 6, background: `linear-gradient(90deg,${C},${P})`, color: "#000", border: "none", fontSize: 14, fontWeight: 900, fontFamily: "'Orbitron',monospace", letterSpacing: "0.1em", cursor: "pointer", boxShadow: `0 0 24px ${C}66` }}
              >
                INITIALIZE LINK
              </button>
            </div>
          ) : (
            <>
              <div style={{ width: 220, height: 220, borderRadius: 12, border: `2px solid ${C}`, overflow: "hidden", boxShadow: `0 0 40px ${C}55`, position: "relative" }}>
                <div style={{ position: "absolute", inset: 0, background: `linear-gradient(135deg,${C}22,transparent)` }} />
                {currentTrack ? <img src={currentTrack.imageUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="Album Art" /> : <OrbitalViz playing={playing} />}
              </div>
              <div style={{ textAlign: "center", minHeight: 56 }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#fff", fontFamily: "'Rajdhani',monospace", textShadow: `0 0 10px ${C}44` }}>{currentTrack ? currentTrack.name : "Awaiting Signal..."}</div>
                <div style={{ fontSize: 14, color: `${C}cc`, marginTop: 4, fontFamily: "'Share Tech Mono'" }}>{currentTrack ? currentTrack.artist : "Unknown Frequency"}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
                <button style={{ background: "none", border: "none", cursor: "pointer", color: `${C}88`, fontSize: 22, transition: "color 0.2s" }} onMouseEnter={e => e.currentTarget.style.color = C} onMouseLeave={e => e.currentTarget.style.color = `${C}88`}>⏮</button>
                <button onClick={() => playing ? pausePlayback() : playTrack()} style={{ width: 60, height: 60, borderRadius: "50%", background: `linear-gradient(135deg,${C},${P})`, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 22, boxShadow: `0 0 20px ${C}66`, transition: "transform 0.1s" }} onMouseEnter={e => e.currentTarget.style.transform = "scale(1.1)"} onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>
                  {playing ? "⏸" : "▶"}
                </button>
                <button style={{ background: "none", border: "none", cursor: "pointer", color: `${C}88`, fontSize: 22, transition: "color 0.2s" }} onMouseEnter={e => e.currentTarget.style.color = C} onMouseLeave={e => e.currentTarget.style.color = `${C}88`}>⏭</button>
              </div>
            </>
          )}
        </NeonCard>
      </div>
    </OrbitNeonCyberpunk>
  );
}
