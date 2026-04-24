import { useEffect, useRef, useState, useCallback, useMemo, memo, Fragment } from "react";
import UniversalChatContainer from "../components/UniversalChatContainer";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { useSpotifyStore } from "../store/useSpotifyStore";
import { THEMES, THEME_LABELS } from "../constants";
import { useSoundManager } from "../hooks/useSoundManager";
import { useChatStore } from "../store/useChatStore";
import { gsap } from "gsap";
import { useNexusStore } from "../store/useNexusStore";
import NexusActionOverlay from "../components/NexusActionOverlay";
import { API_URL } from "../config";

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
  .ncb-glitch-text::before, .ncb-glitch-text::after { content: attr(data-text); position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0; }
  .ncb-glitch-text:hover::before { animation: ncbGlitch1 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94) both infinite; color: #ff00c8; z-index: -1; }
  .ncb-glitch-text:hover::after { animation: ncbGlitch2 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) both infinite; color: #00fff5; z-index: -2; }
  
  @media (max-width: 800px) {
    .ncb-desktop-nav { flex-wrap: wrap !important; height: auto !important; padding: 10px 14px !important; gap: 8px !important; }
    .ncb-desktop-nav > div { flex-wrap: wrap !important; }
    .ncb-center-hud { display: none !important; }
    .ncb-container { flex-direction: column !important; }
    .ncb-sidebar { width: 100% !important; border-right: none !important; border-bottom: 1px solid rgba(176,38,255,0.3) !important; max-height: 240px !important; }
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
   CANVAS: CONSTELLATION GRID
───────────────────────────────────────────── */
const ConstellationGrid = memo(() => {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext("2d"), W = c.width, H = c.height;
    const pts = Array.from({ length: 7 }, () => ({
      x: 16 + Math.random() * (W - 32),
      y: 16 + Math.random() * (H - 32),
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      r: 1.5 + Math.random() * 2,
    }));
    let raf;
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      pts.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 8 || p.x > W - 8) p.vx *= -1;
        if (p.y < 8 || p.y > H - 8) p.vy *= -1;
      });
      pts.forEach((a, i) => pts.slice(i + 1).forEach(b => {
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < 100) {
          ctx.strokeStyle = `rgba(176,38,255,${0.4 * (1 - d / 100)})`;
          ctx.lineWidth = 0.8;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }));
      pts.forEach(p => {
        ctx.fillStyle = C; ctx.shadowColor = C; ctx.shadowBlur = 8;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
      });
      raf = requestAnimationFrame(draw);
    };
    draw(); return () => cancelAnimationFrame(raf);
  }, []);
  return <canvas ref={ref} width={150} height={110} style={{ display: "block" }} />;
});

/* ─────────────────────────────────────────────
   NEON CARD SHELL
───────────────────────────────────────────── */
const NeonCard = memo(({ color = C, children, style = {}, onClick }) => {
  const [hover, setHover] = useState(false);
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={onClick}
      style={{
        border: `1.5px solid ${color}`,
        borderRadius: 8,
        boxShadow: hover
          ? `0 0 18px ${color},0 0 36px ${color}55,inset 0 0 16px ${color}22`
          : `0 0 8px ${color}66,0 0 20px ${color}33,inset 0 0 8px ${color}11`,
        background: "rgba(9,0,20,0.82)",
        backdropFilter: "blur(8px)",
        position: "relative",
        overflow: "hidden",
        transition: "all 0.3s ease",
        transform: hover ? "translateY(-2px)" : "none",
        cursor: onClick ? "pointer" : "default",
        ...style,
      }}
    >
      {/* corner accents */}
      {[["-1px","-1px","Top","Left"],["auto","-1px","Bottom","Left"],
        ["-1px","auto","Top","Right"],["auto","auto","Bottom","Right"]].map(([t,b,v,h],i) => (
        <div key={i} style={{
          position: "absolute",
          top: t !== "auto" ? t : undefined, bottom: b !== "auto" ? b : undefined,
          left: h === "Left" ? t !== "auto" ? "-1px" : "auto" : undefined,
          right: h === "Right" ? "-1px" : undefined,
          width: 12, height: 12,
          [`border${v}`]: `2px solid ${color}`,
          [`border${h}`]: `2px solid ${color}`,
          [`borderRadius`]: `${v === "Top" ? (h === "Left" ? "6px 0 0 0" : "0 6px 0 0") : (h === "Left" ? "0 0 0 6px" : "0 0 6px 0")}`,
          zIndex: 5,
        }} />
      ))}
      {children}
    </div>
  );
});

/* ─────────────────────────────────────────────
   DATA STREAM OVERLAY
───────────────────────────────────────────── */
const DataStreams = memo(({ count = 5, color = P }) => {
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{
          position: "absolute", top: 0, width: 1,
          left: `${(i / count) * 100}%`,
          background: `linear-gradient(180deg, transparent, ${color}, transparent)`,
          animation: `ncbStream ${2 + i * 0.4}s linear infinite`,
          animationDelay: `${i * 0.6}s`, opacity: 0.5,
        }} />
      ))}
    </div>
  );
});

/* ─────────────────────────────────────────────
   SCAN FEED (like kill feed)
───────────────────────────────────────────── */
const ScanFeed = memo(() => {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <div style={{ fontSize: 8, fontWeight: 900, letterSpacing: "0.2em", color: `${C}aa`, fontFamily: "'Orbitron',monospace", marginBottom: 2 }}>
        ◈ SCAN FEED
      </div>
      {SCAN_FEED.map((f, i) => (
        <div key={i} style={{
          display: "flex", alignItems: "center", gap: 5, padding: "3px 6px", borderRadius: 3,
          background: f.mine ? `${f.color}14` : "rgba(255,255,255,0.02)",
          border: `1px solid ${f.mine ? f.color + "44" : "rgba(255,255,255,0.06)"}`,
        }}>
          <span style={{ fontSize: 8, fontWeight: 800, color: f.mine ? f.color : "rgba(255,255,255,0.6)", fontFamily: "'Orbitron',monospace", letterSpacing: "0.04em" }}>{f.node}</span>
          <span style={{ fontSize: 7, color: "rgba(176,38,255,0.7)" }}>◆</span>
          <span style={{ fontSize: 8, color: "rgba(150,130,200,0.6)", fontFamily: "'Orbitron',monospace", flex: 1 }}>{f.type}</span>
          <span style={{ fontSize: 7, color: "rgba(100,100,150,0.5)", fontFamily: "'Share Tech Mono'" }}>{f.time}</span>
        </div>
      ))}
    </div>
  );
});

/* ─────────────────────────────────────────────
   METRIC ROW
───────────────────────────────────────────── */
const MetricRow = memo(() => {
  return (
    <div style={{ display: "flex", gap: 8 }}>
      {METRICS.map(m => (
        <div key={m.label} style={{ flex: 1, padding: "4px 6px", borderRadius: 4, background: `${m.color}0e`, border: `1px solid ${m.color}33`, textAlign: "center" }}>
          <div style={{ fontSize: 6.5, color: `${m.color}88`, letterSpacing: "0.12em", fontFamily: "'Orbitron',monospace" }}>{m.label}</div>
          <div style={{ fontSize: 11, fontWeight: 900, color: m.color, fontFamily: "'Orbitron',monospace", textShadow: `0 0 6px ${m.color}` }}>{m.val}</div>
        </div>
      ))}
    </div>
  );
});

/* ─────────────────────────────────────────────
   TOP NAV
───────────────────────────────────────────── */
const TopNav = memo(({ navRef, synced, hiddenNexuses, onReveal }) => {
  const [time, setTime] = useState(() =>
    new Date().toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" })
  );
  useEffect(() => {
    const iv = setInterval(() =>
      setTime(new Date().toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" }))
    , 1000);
    return () => clearInterval(iv);
  }, []);
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuthStore();
  const { play } = useSoundManager();

  const navItems = [];
  if (location.pathname !== "/") {
    navItems.push({ icon: "◀", label: "Back", path: "/", highlight: true });
  }
  navItems.push(
    { icon: "⚙", label: "Settings", path: "/settings" },
    { icon: "👤", label: "Profile", path: "/profile" },
    { icon: "→", label: "Logout", action: "logout" }
  );

  const btnStyle = (highlight) => ({
    display: "flex", alignItems: "center", gap: 4,
    background: highlight ? `${M}22` : `${C}0e`,
    border: `1px solid ${highlight ? M + "88" : C + "44"}`,
    borderRadius: 4, padding: "4px 8px", cursor: "pointer",
    fontSize: 10, fontWeight: 900, letterSpacing: "0.08em",
    color: highlight ? M : "#a0f0f4",
    fontFamily: "'Orbitron',monospace", transition: "all 0.2s",
  });

  return (
    <div ref={navRef} className="ncb-desktop-nav" style={{
      position: "absolute", top: 0, left: 0, right: 0, height: 42,
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 14px", zIndex: 40,
      background: "rgba(6,0,16,0.92)", borderBottom: `1px solid ${P}33`,
      backdropFilter: "blur(10px)",
    }}>
      {/* Logo */}
      <div 
        onClick={() => { play("click"); navigate("/"); }}
        style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}
      >
        <div style={{ width: 26, height: 26, borderRadius: "50%", border: `1.5px solid ${C}`, boxShadow: `0 0 10px ${C}`, display: "flex", alignItems: "center", justifyContent: "center", background: `${C}18`, fontSize: 12 }}>🌀</div>
        <span style={{ fontSize: 14, fontWeight: 900, letterSpacing: "0.2em", color: C, textShadow: `0 0 12px ${C},0 0 24px ${C}66`, fontFamily: "'Orbitron',monospace" }}>ORBIT</span>
        <span style={{ fontSize: 13, color: M, textShadow: `0 0 10px ${M}` }}>//</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.5)", fontFamily: "'Orbitron',monospace", letterSpacing: "0.1em" }}>VRC</span>
      </div>

      {/* Gap 1 */}
      <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", gap: 30, pointerEvents: "none" }}>
        {hiddenNexuses[0] && (
          <div style={{ pointerEvents: "auto", margin: "0 10px" }}>
            <HiddenNexusCrystal nexus={hiddenNexuses[0]} onReveal={onReveal} />
          </div>
        )}
      </div>

      {/* Center HUD */}
      <div className="ncb-center-hud" style={{ display: "flex", gap: 16, alignItems: "center", position: "relative" }}>

        {[["NODES", "14k+", C], ["NEXUS", "1337", P], ["PING", "12ms", Y]].map(([lab, val, col]) => (
          <div key={lab} style={{ textAlign: "center" }}>
            <div style={{ fontSize: 7, color: `${col}88`, letterSpacing: "0.15em", fontFamily: "'Orbitron',monospace" }}>{lab}</div>
            <div style={{ fontSize: 13, fontWeight: 900, color: col, fontFamily: "'Orbitron',monospace", textShadow: `0 0 8px ${col}` }}>{val}</div>
          </div>
        ))}
        <div style={{ width: 1, height: 22, background: `${C}22` }} />
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 7, color: `${C}66`, letterSpacing: "0.15em", fontFamily: "'Orbitron',monospace" }}>LOCAL</div>
          <div style={{ fontFamily: "'Share Tech Mono'", fontSize: 11, color: `${C}99`, fontVariantNumeric: "tabular-nums" }}>{time}</div>
        </div>
      </div>
      {/* Gap 2 */}
      <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", gap: 30, pointerEvents: "none" }}>
        {hiddenNexuses[1] && (
          <div style={{ pointerEvents: "auto", margin: "0 10px" }}>
            <HiddenNexusCrystal nexus={hiddenNexuses[1]} onReveal={onReveal} />
          </div>
        )}
        {hiddenNexuses[2] && (
          <div style={{ pointerEvents: "auto", margin: "0 10px" }}>
            <HiddenNexusCrystal nexus={hiddenNexuses[2]} onReveal={onReveal} />
          </div>
        )}
      </div>

      {/* Nav */}
      <div style={{ display: "flex", gap: 5 }}>
        {synced && (
          <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "3px 8px", borderRadius: 4, background: `${C}0e`, border: `1px solid ${C}44`, fontSize: 8, color: C, fontFamily: "'Share Tech Mono'", marginRight: 6 }}>
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: C, boxShadow: `0 0 6px ${C}`, animation: "ncbPulse 2s infinite" }} />
            SYNCED
          </div>
        )}
        {navItems.map(item => (
          <button
            key={item.label}
            onClick={() => {
              play("click");
              if (item.action === "logout") logout();
              else navigate(item.path);
            }}
            style={btnStyle(item.highlight)}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 0 10px ${item.highlight ? M : C}66`; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; }}
          >
            <span>{item.icon}</span>{item.label}
          </button>
        ))}
      </div>
    </div>
  );
});



// ── Hidden Nexus Crystal ──────────────────────────────────────────────────
const HiddenNexusCrystal = memo(({ nexus, onReveal }) => {
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
                    ? `drop-shadow(0 0 15px ${P}) drop-shadow(0 0 30px ${P}88)`
                    : `drop-shadow(0 0 8px ${P}44)`,
                transition: grabbed ? 'none' : 'filter 0.3s',
                fontSize: 20,
                width: 32,
                height: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}
            onMouseDown={handleMouseDown}
            onClick={handleClick}
            onDragStart={(e) => e.preventDefault()}
        >
            🔮
        </div>
    );
});

/* ─────────────────────────────────────────────
   SIDEBAR
───────────────────────────────────────────── */
const Sidebar = memo(({ sidebarRef, synced, onToggleSync, onJoin, onNexus, nexuses, isNexusesLoading, setSelectedNexus, users, setSelectedUser, nexusUnread, setNexusActionView, hiddenNexuses, toggleHide }) => {
  const [tab, setTab] = useState("orbits");
  const navigate = useNavigate();
  const { play } = useSoundManager();

  const [pinnedNexuses, setPinnedNexuses] = useState(() => {
    return JSON.parse(localStorage.getItem('cyberpunk_pinned_nexuses') || '[]');
  });
  const [nexusColors, setNexusColors] = useState(() => {
    return JSON.parse(localStorage.getItem('cyberpunk_nexus_colors') || '{}');
  });
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [activeColorPickerId, setActiveColorPickerId] = useState(null);

  const togglePin = (id, e) => {
    e.stopPropagation();
    const next = pinnedNexuses.includes(id) ? pinnedNexuses.filter(pid => pid !== id) : [...pinnedNexuses, id];
    setPinnedNexuses(next);
    localStorage.setItem('cyberpunk_pinned_nexuses', JSON.stringify(next));
    setActiveMenuId(null);
  };

  const updateColor = (id, color, e) => {
    e.stopPropagation();
    const next = { ...nexusColors, [id]: color };
    setNexusColors(next);
    localStorage.setItem('cyberpunk_nexus_colors', JSON.stringify(next));
    setActiveColorPickerId(null);
    setActiveMenuId(null);
  };

  const sortedNexuses = useMemo(() => {
    const hiddenIds = (hiddenNexuses || []).map(h => h._id);
    return [...nexuses]
      .filter(n => !hiddenIds.includes(n._id))
      .sort((a, b) => {
        const aPinned = pinnedNexuses.includes(a._id);
        const bPinned = pinnedNexuses.includes(b._id);
        if (aPinned && !bPinned) return -1;
        if (!aPinned && bPinned) return 1;
        return 0;
      });
  }, [nexuses, pinnedNexuses, hiddenNexuses]);

  useEffect(() => {
    const handleGlobalClick = () => {
      setActiveMenuId(null);
      setActiveColorPickerId(null);
    };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  const tabStyle = (active, color) => ({
    flex: 1, border: `1px solid ${active ? color : "rgba(100,100,150,0.35)"}`,
    borderRadius: 3, padding: "5px 0", cursor: "pointer",
    fontSize: 9, fontWeight: 800, letterSpacing: "0.1em",
    fontFamily: "'Orbitron',monospace",
    background: active ? `${color}18` : "rgba(255,255,255,0.02)",
    color: active ? color : "rgba(150,150,200,0.55)",
    boxShadow: active ? `0 0 8px ${color}55` : "none",
    transition: "all 0.2s",
  });

  return (
    <div ref={sidebarRef} className="ncb-sidebar" style={{
      width: 280, flexShrink: 0, display: "flex", flexDirection: "column", gap: 8,
      borderRight: `1px solid ${P}33`,
      background: "rgba(6,0,16,0.7)", backdropFilter: "blur(8px)",
      padding: "10px", position: "relative", overflow: "hidden", overflowY: "auto",
    }}>
      {/* Scan lines left panel */}
      <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,255,245,0.008) 2px,rgba(0,255,245,0.008) 4px)", pointerEvents: "none" }} />

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, position: "relative", zIndex: 2 }}>
        <button onClick={() => { play("click"); setTab("orbits"); }} style={tabStyle(tab === "orbits", M)}>⬡ ORBITS</button>
        <button onClick={() => { play("click"); setTab("contacts"); }} style={tabStyle(tab === "contacts", C)}>👤 CONTACTS</button>
      </div>

      {/* Action btns */}
      <div style={{ display: "flex", gap: 4, position: "relative", zIndex: 2 }}>
        <button onClick={() => { play("click"); onJoin(); }} style={{ flex: 1, border: `1px solid ${C}55`, borderRadius: 3, padding: "5px 0", fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", fontFamily: "'Orbitron',monospace", background: `${C}0e`, color: "#60d8cc", cursor: "pointer" }}>JOIN</button>
        <button onClick={() => { play("click"); onNexus(); }} style={{ flex: 1, border: `1px solid ${P}88`, borderRadius: 3, padding: "5px 0", fontSize: 9, fontWeight: 800, letterSpacing: "0.1em", fontFamily: "'Orbitron',monospace", background: `linear-gradient(90deg,${P}22,${C}11)`, color: P, cursor: "pointer", boxShadow: `0 0 8px ${P}44` }}>+ NEXUS</button>
      </div>

      {/* List */}
      <div style={{ flex: 1, padding: "8px 4px", overflowY: "auto", position: "relative", zIndex: 2, display: "flex", flexDirection: "column", gap: 3 }}>
        {tab === "orbits" ? (
          isNexusesLoading ? (
            <div style={{ padding: 12, fontSize: 10, color: `${M}77`, fontFamily: "'Share Tech Mono'", textAlign: "center", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", background: `linear-gradient(180deg,transparent,${M}44,transparent)`, animation: "ncbScanline 1.5s linear infinite" }} />
              // SCANNING_NEXUS_NODES...
            </div>
          ) : nexuses.length === 0 ? (
            <div style={{ padding: 12, fontSize: 10, color: `${M}55`, fontFamily: "'Share Tech Mono'", textAlign: "center", lineHeight: 1.6, position: "relative" }}>
              <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", background: `linear-gradient(180deg,transparent,${M}22,transparent)`, animation: "ncbScanline 3s linear infinite" }} />
              NO_NODES_FOUND<br />[ACTION_REQUIRED: JOIN/CREATE]
            </div>
          ) : (
            sortedNexuses.map(n => (
              <div key={n._id}
                onClick={() => { 
                  play("click"); 
                  setSelectedNexus(n); 
                  setSelectedUser(null); 
                  setNexusActionView(null); 
                  navigate(`/nexus/${n._id}`);
                }}
                style={{ display: "flex", flexDirection: "column", padding: "8px 10px", borderRadius: 4, cursor: "pointer", transition: "all 0.2s", background: nexusColors[n._id] || `${M}08`, border: "1px solid transparent", position: "relative" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = `${M}44`; e.currentTarget.style.boxShadow = `inset 0 0 10px ${M}44`; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "transparent"; e.currentTarget.style.boxShadow = "none"; }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 9, width: "100%" }}>
                  <div style={{ width: 30, height: 30, borderRadius: 6, background: `${M}12`, border: `1px solid ${M}55`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0, overflow: "hidden" }}>
                    {n.avatar ? <img src={n.avatar} alt={n.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : "⬡"}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: M, fontFamily: "'Orbitron',monospace", letterSpacing: "0.05em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textShadow: `0 0 5px ${M}44` }}>{n.name}</div>
                    <div style={{ fontSize: 8, color: `${M}66`, fontFamily: "'Share Tech Mono'" }}>NODES: {n.members?.length || 0}</div>
                  </div>
                  {nexusUnread[n._id] > 0 && (
                     <div style={{ background: M, color: "white", fontSize: 9, fontWeight: 900, padding: "1px 6px", borderRadius: 4, boxShadow: `0 0 8px ${M}` }}>{nexusUnread[n._id]}</div>
                  )}

                  {pinnedNexuses.includes(n._id) && (
                      <div style={{ position: 'absolute', top: 2, left: 2, fontSize: 10 }}>📌</div>
                  )}

                  <div 
                      onClick={(e) => {
                          e.stopPropagation();
                          play("click");
                          setActiveMenuId(activeMenuId === n._id ? null : n._id);
                          setActiveColorPickerId(null);
                      }}
                      style={{ fontSize: 16, padding: "0 4px", opacity: 0.7, transition: "opacity 0.2s" }}
                      onMouseEnter={e => e.currentTarget.style.opacity = 1}
                      onMouseLeave={e => e.currentTarget.style.opacity = 0.7}
                  >
                      🔮
                  </div>
                </div>

                {/* Context Menu Inline Expansion */}
                {activeMenuId === n._id && (
                    <div 
                        onClick={(e) => e.stopPropagation()}
                        style={{ width: '100%', marginTop: 10, paddingTop: 10, borderTop: `1px solid ${M}33`, display: 'flex', flexDirection: 'column', gap: 8 }}
                    >
                        <div style={{ display: 'flex', gap: 8 }}>
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    play("click");
                                    setActiveColorPickerId(activeColorPickerId === n._id ? null : n._id);
                                }}
                                style={{ flex: 1, padding: '6px', background: `${M}22`, border: `1px solid ${M}55`, borderRadius: 4, fontSize: 10, color: C, fontFamily: "'Orbitron', monospace", cursor: 'pointer' }}
                            >
                                Mark 🎨
                            </button>
                            <button 
                                onClick={(e) => { play("click"); togglePin(n._id, e); }}
                                style={{ flex: 1, padding: '6px', background: `${M}22`, border: `1px solid ${M}55`, borderRadius: 4, fontSize: 10, color: C, fontFamily: "'Orbitron', monospace", cursor: 'pointer' }}
                            >
                                {pinnedNexuses.includes(n._id) ? "Unpin 📌" : "Pin 📌"}
                            </button>
                            <button 
                                onClick={(e) => toggleHide(n, e)}
                                style={{ flex: 1, padding: '6px', background: `${M}22`, border: `1px solid ${M}55`, borderRadius: 4, fontSize: 10, color: C, fontFamily: "'Orbitron', monospace", cursor: 'pointer' }}
                            >
                                Hide 🔮
                            </button>
                        </div>

                        {activeColorPickerId === n._id && (
                            <div style={{ display: 'flex', gap: 6, padding: '8px', background: "rgba(0,0,0,0.5)", borderRadius: 4, border: `1px solid ${M}33`, overflowX: 'auto', scrollbarWidth: 'none' }} className="custom-scrollbar">
                                {[
                                    "transparent", // Default
                                    "rgba(255,0,200,0.2)", // Mute Magenta
                                    "rgba(0,255,245,0.2)", // Mute Cyan
                                    "rgba(176,38,255,0.2)", // Mute Purple
                                    "rgba(255,230,0,0.2)", // Mute Yellow
                                    "rgba(255,0,0,0.2)", // Red Warning
                                    "rgba(0,255,0,0.2)", // Green Matrix
                                    "rgba(0,0,0,0.8)", // Void
                                ].map(c => (
                                    <div 
                                        key={c}
                                        onClick={(e) => updateColor(n._id, c, e)}
                                        style={{ minWidth: 20, height: 20, borderRadius: '50%', background: c, border: c === "transparent" ? "1px solid rgba(255,255,255,0.2)" : `1px solid ${M}`, cursor: 'pointer', flexShrink: 0 }}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}
              </div>
            ))
          )
        ) : (
          users.length === 0 ? (
            <div style={{ padding: 12, fontSize: 10, color: `${C}55`, fontFamily: "'Share Tech Mono'", textAlign: "center" }}>// NO_USERS_IN_RANGE</div>
          ) : (
            users.map(u => (
              <div key={u._id}
                onClick={() => { 
                  play("click"); 
                  setSelectedUser(u); 
                  setSelectedNexus(null); 
                  setNexusActionView(null); 
                  navigate(`/chat/${u._id}`);
                }}
                style={{ display: "flex", alignItems: "center", gap: 9, padding: "8px 10px", borderRadius: 4, cursor: "pointer", transition: "all 0.2s" }}
                onMouseEnter={e => e.currentTarget.style.background = `${C}12`}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <div style={{ width: 30, height: 30, borderRadius: "50%", overflow: "hidden", flexShrink: 0, border: `1px solid ${C}55` }}>
                  {u.profilePic ? <img src={u.profilePic} alt={u.username} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: "100%", height: "100%", background: `${C}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: C, fontFamily: "'Orbitron',monospace" }}>{u.username?.[0]?.toUpperCase()}</div>}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C, fontFamily: "'Orbitron',monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.username}</div>
                  <div style={{ fontSize: 8, color: `${C}77`, fontFamily: "'Share Tech Mono'" }}>STATUS: {u.online ? "ONLINE" : "OFFLINE"}</div>
                </div>
              </div>
            ))
          )
        )}
      </div>

      {/* Sync toggle */}
      <NeonCard color={synced ? C : "rgba(100,100,100,0.8)"} style={{ padding: "8px 10px", position: "relative", zIndex: 2 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 8, fontWeight: 900, letterSpacing: "0.12em", color: synced ? C : "rgba(150,150,180,0.6)", fontFamily: "'Orbitron',monospace" }}>NEXUS SYNC</div>
            <div style={{ fontSize: 7, color: "rgba(120,120,160,0.6)", fontFamily: "'Share Tech Mono'", marginTop: 1 }}>{synced ? "ACTIVE — ALPHA LINK" : "OFFLINE"}</div>
          </div>
          <div
            onClick={() => { play("click"); onToggleSync(); }}
            style={{ width: 34, height: 18, borderRadius: 9, background: synced ? `linear-gradient(90deg,${C},${P})` : "rgba(50,50,80,0.8)", border: `1px solid ${synced ? C : "rgba(100,100,150,0.4)"}`, position: "relative", cursor: "pointer", transition: "all 0.3s", boxShadow: synced ? `0 0 10px ${C}66` : "none" }}
          >
            <div style={{ position: "absolute", top: 2, left: synced ? 16 : 2, width: 12, height: 12, borderRadius: "50%", background: synced ? "#fff" : "rgba(150,150,180,0.6)", boxShadow: synced ? `0 0 6px ${C}` : "none", transition: "left 0.3s" }} />
          </div>
        </div>
      </NeonCard>

      {/* Enter Your Orbit */}
      <div
        onClick={() => {
          play("yourorbit");
          window.dispatchEvent(new CustomEvent("toggle-orbit-mode"));
        }}
        style={{ marginTop: "auto", borderRadius: 6, padding: "8px 10px", display: "flex", alignItems: "center", gap: 8, background: `linear-gradient(90deg,${P}18,${C}10)`, border: `1.5px solid ${C}`, cursor: "pointer", boxShadow: `0 0 12px ${C}44`, position: "relative", zIndex: 2, flexShrink: 0, overflow: "hidden", transition: "all 0.2s" }}
        onMouseEnter={e => e.currentTarget.style.boxShadow = `0 0 24px ${C}88`}
        onMouseLeave={e => e.currentTarget.style.boxShadow = `0 0 12px ${C}44`}
      >
        <DataStreams count={3} color={C} />
        <div style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${C}55`, background: `${C}12`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0, boxShadow: `0 0 10px ${C}44` }}>🌀</div>
        <div style={{ position: "relative", zIndex: 2 }}>
          <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: "0.12em", color: C, textTransform: "uppercase", textShadow: `0 0 8px ${C}`, fontFamily: "'Orbitron',monospace" }}>ENTER YOUR ORBIT</div>
          <div style={{ fontSize: 7.5, color: `${C}77`, letterSpacing: "0.1em", fontFamily: "'Orbitron',monospace" }}>3D SPATIAL ENGINE</div>
        </div>
      </div>
    </div>
  );
});

/* ─────────────────────────────────────────────
   SPOTIFY / AUDIO CARD
───────────────────────────────────────────── */
const AudioCard = memo(() => {
  const [playing, setPlaying] = useState(true);
  const navigate = useNavigate();
  const { play } = useSoundManager();
  const spotifyLinked = useSpotifyStore(s => s.spotifyLinked);
  const currentTrack = useSpotifyStore(s => s.currentTrack);
  const isPlaying = useSpotifyStore(s => s.isPlaying);
  const { pausePlayback, playTrack, skipNext, skipPrevious } = useSpotifyStore();

  if (!spotifyLinked) {
    return (
      <NeonCard color={C} style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8, height: "100%", cursor: "pointer" }} onClick={() => { play("click"); navigate("/spotify"); }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: C, boxShadow: `0 0 8px ${C}`, display: "inline-block", animation: "ncbPulse 1.6s infinite" }} />
          <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.15em", color: C, fontFamily: "'Orbitron',monospace" }}>NEXUS AUDIO</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1 }}>
          <OrbitalViz playing={playing} />
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: C, fontFamily: "'Orbitron',monospace", letterSpacing: "0.1em" }}>CONNECT SPOTIFY</div>
          <div style={{ fontSize: 8, color: `${C}66`, marginTop: 2, fontFamily: "'Share Tech Mono'" }}>Sync your audio dimension</div>
        </div>
      </NeonCard>
    );
  }

  return (
    <NeonCard color={C} style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8, height: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: C, boxShadow: `0 0 8px ${C}`, display: "inline-block", animation: "ncbPulse 1.6s infinite" }} />
          <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.15em", color: C, fontFamily: "'Orbitron',monospace" }}>NEXUS AUDIO</span>
        </div>
        <span onClick={() => { play("click"); navigate("/spotify"); }} style={{ fontSize: 8, fontWeight: 700, color: `${C}66`, fontFamily: "'Orbitron',monospace", cursor: "pointer" }}
          onMouseEnter={e => e.currentTarget.style.color = C}
          onMouseLeave={e => e.currentTarget.style.color = `${C}66`}>EXPAND</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <OrbitalViz playing={isPlaying} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: "#fff" }}>{currentTrack?.name || "Ready"}</div>
          <div style={{ fontSize: 9, color: "rgba(180,160,220,0.65)", marginTop: 1 }}>{currentTrack?.artist || "Select a track"}</div>
        </div>
      </div>
      {/* Controls */}
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 14 }}>
        <button onClick={() => { play("click"); skipPrevious(); }} style={{ background: "none", border: "none", cursor: "pointer", color: `${M}aa`, fontSize: 13, padding: 0 }}>⏮</button>
        <button onClick={() => { play("click"); isPlaying ? pausePlayback() : playTrack(); }} style={{ width: 28, height: 28, borderRadius: "50%", background: `linear-gradient(135deg,${P},${M})`, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 11, boxShadow: `0 0 12px ${P}`, transition: "transform 0.15s" }}
          onMouseEnter={e => e.currentTarget.style.transform = "scale(1.15)"}
          onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>{isPlaying ? "⏸" : "▶"}</button>
        <button onClick={() => { play("click"); skipNext(); }} style={{ background: "none", border: "none", cursor: "pointer", color: `${M}aa`, fontSize: 13, padding: 0 }}>⏭</button>
      </div>
    </NeonCard>
  );
});

/* ─────────────────────────────────────────────
   CHAT CARD
───────────────────────────────────────────── */
function ChatCard() {
  return (
    <NeonCard color={M} style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 6, height: "100%", position: "relative" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
        <div style={{ flex: 1 }}>
          <div style={{ width: 30, height: 30, borderRadius: 7, border: `1.5px solid ${M}88`, background: `${M}12`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, boxShadow: `0 0 8px ${M}44`, marginBottom: 8 }}>💬</div>
          <div style={{ fontSize: 10.5, fontWeight: 900, letterSpacing: "0.15em", color: M, textTransform: "uppercase", textShadow: `0 0 8px ${M}`, fontFamily: "'Orbitron',monospace", marginBottom: 4 }}>START CHATTING</div>
          <div style={{ fontSize: 9.5, color: "rgba(200,140,200,0.65)", lineHeight: 1.5 }}>Select a Constellation or create a private conversation</div>
        </div>
        <div style={{ flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <ConstellationGrid />
        </div>
      </div>
      <div style={{ position: "absolute", bottom: 9, right: 12, fontSize: 10, color: `${M}55`, fontWeight: "bold" }}>⚡</div>
    </NeonCard>
  );
}

/* ─────────────────────────────────────────────
   ANIMATED TERMINAL FEED
───────────────────────────────────────────── */
function TerminalFeed() {
  const [lines, setLines] = useState([
    { text: "CONSTELLATION: ACTIVE", id: 1 },
    { text: "NEXUS_7A: HANDSHAKE OK", id: 2 },
    { text: "SYNC RANK: ALPHA", id: 3 }
  ]);
  const feedRef = useRef(null);

  useEffect(() => {
    let count = 4;
    const sysLogs = [
      "ESTABLISHING SECURE UPLINK...", "DECRYPTING PACKETS...", 
      "ANOMALY DETECTED IN SECTOR 4", "REROUTING SIGNAL PATH", 
      "GHOST PROXY ENGAGED...", "LATENCY STABLE AT 12ms",
      "HANDSHAKE PROTOCOL: INITIATED", "OVERRIDING SAFETY PROTOCOLS"
    ];
    const iv = setInterval(() => {
      setLines(prev => {
        const newLine = { text: sysLogs[Math.floor(Math.random() * sysLogs.length)], id: count++ };
        const next = [...prev, newLine];
        if (next.length > 5) next.shift(); // Keep max 5 lines
        return next;
      });
      if (feedRef.current) feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }, 3500);
    return () => clearInterval(iv);
  }, []);

  return (
    <div ref={feedRef} style={{ background: "rgba(4,0,12,0.9)", border: `1px solid ${Y}33`, padding: "8px 10px", borderRadius: 4, height: 60, overflow: "hidden", position: "relative" }}>
      {/* Glitch Overlay */}
      <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(255,230,0,0.05) 2px,rgba(255,230,0,0.05) 4px)", pointerEvents: "none" }} />
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end", minHeight: "100%" }}>
        {lines.map((line) => (
          <div key={line.id} style={{ display: "flex", gap: 6, fontSize: 8, fontFamily: "'Share Tech Mono'", color: `${Y}cc`, marginBottom: 2, animation: "ncbGlitch1 0.2s ease-out" }}>
            <span style={{ color: P }}>{">"}</span><span style={{ wordBreak: "break-all" }}>{line.text}</span>
          </div>
        ))}
        <div style={{ display: "flex", gap: 6, fontSize: 8, fontFamily: "'Share Tech Mono'", color: `${Y}cc` }}>
          <span style={{ color: P }}>{">"}</span>
          <span style={{ animation: "ncbBlink 1s step-end infinite" }}>_</span>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   NOTIFICATION CARD
───────────────────────────────────────────── */
function NotifCard() {
  const navigate = useNavigate();
  return (
    <NeonCard color={Y} style={{ padding: "12px 14px", display: "flex", gap: 10, height: "100%", position: "relative" }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, border: `1.5px solid ${Y}88`, background: `${Y}12`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, boxShadow: `0 0 8px ${Y}44` }}>🔔</div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.15em", color: Y, textShadow: `0 0 8px ${Y}`, fontFamily: "'Orbitron',monospace" }}>GET NOTIFICATIONS</div>
            <div style={{ fontSize: 8.5, color: "rgba(200,180,80,0.55)", lineHeight: 1.4 }}>Stay updated with real-time alerts</div>
          </div>
        </div>
        <TerminalFeed />
      </div>
      <div style={{ position: "absolute", bottom: 9, right: 12, fontSize: 10, color: `${Y}44`, fontWeight: "bold" }}>↓</div>
    </NeonCard>
  );
}

/* ─────────────────────────────────────────────
   CUSTOMIZE CARD
───────────────────────────────────────────── */
function CustomizeCard() {
  const navigate = useNavigate();
  return (
    <NeonCard color={P} style={{ padding: "12px 14px", display: "flex", gap: 8, height: "100%", position: "relative" }} onClick={() => navigate("/settings")}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5 }}>
        <div style={{ width: 28, height: 28, borderRadius: 7, border: `1.5px solid ${P}88`, background: `${P}12`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, boxShadow: `0 0 8px ${P}44` }}>⚙️</div>
        <div style={{ fontSize: 10.5, fontWeight: 900, letterSpacing: "0.15em", color: P, textTransform: "uppercase", textShadow: `0 0 8px ${P}`, fontFamily: "'Orbitron',monospace" }}>CUSTOMIZE</div>
        <div style={{ fontSize: 9.5, color: "rgba(160,100,220,0.65)", lineHeight: 1.5 }}>Configure your orbit behavior and preferences</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, marginTop: 2 }}>
          {[["THEMES", "5"], ["EFFECTS", "ON"], ["SOUNDS", "ON"], ["ORBIT", "3D"]].map(([l, v]) => (
            <div key={l} style={{ padding: "3px 6px", borderRadius: 3, background: `${P}0e`, border: `1px solid ${P}22` }}>
              <div style={{ fontSize: 6.5, color: `${P}77`, letterSpacing: "0.1em", fontFamily: "'Orbitron',monospace" }}>{l}</div>
              <div style={{ fontSize: 10, fontWeight: 900, color: P, fontFamily: "'Orbitron',monospace", textShadow: `0 0 4px ${P}` }}>{v}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ position: "absolute", bottom: 9, right: 12, fontSize: 10, color: `${P}55`, fontWeight: "bold", cursor: "pointer" }}>↗</div>
    </NeonCard>
  );
}

/* ─────────────────────────────────────────────
   STATUS BAR
───────────────────────────────────────────── */
function StatusBar({ synced }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
      <div style={{ width: 24, height: 1, background: `${C}66` }} />
      <span style={{ fontSize: 8, fontWeight: 800, letterSpacing: "0.2em", color: C, textShadow: `0 0 6px ${C}`, fontFamily: "'Orbitron',monospace" }}>STATUS: {synced ? "ONLINE" : "OFFLINE"}</span>
      <div style={{ display: "flex", gap: 1.5, alignItems: "flex-end" }}>
        {Array.from({ length: 26 }, (_, i) => (
          <div key={i} style={{ width: 2, height: 4 + Math.sin(i * 0.5) * 3, background: C, opacity: 0.6 + (i % 3) * 0.1, boxShadow: `0 0 3px ${C}` }} />
        ))}
      </div>
      {synced && (
        <div style={{ marginLeft: 8, padding: "1px 8px", borderRadius: 2, background: `${C}18`, border: `1px solid ${C}66`, fontSize: 8, fontWeight: 900, color: C, fontFamily: "'Orbitron',monospace", letterSpacing: "0.15em" }}>
          🔗 SYNC ACTIVE
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   CIRCUIT OVERLAY
───────────────────────────────────────────── */
function CircuitOverlay() {
  return (
    <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.07, pointerEvents: "none" }} viewBox="0 0 790 460" preserveAspectRatio="none">
      <g stroke={C} strokeWidth="0.7" fill="none">
        <line x1="0" y1="50" x2="60" y2="50" /><line x1="60" y1="50" x2="80" y2="30" /><line x1="80" y1="30" x2="200" y2="30" />
        <line x1="790" y1="120" x2="730" y2="120" /><line x1="730" y1="120" x2="710" y2="100" />
        <line x1="0" y1="400" x2="80" y2="400" /><line x1="80" y1="400" x2="100" y2="420" />
        <circle cx="60" cy="50" r="2.5" fill={C} /><circle cx="730" cy="120" r="2.5" fill={C} /><circle cx="80" cy="400" r="2.5" fill={C} />
      </g>
      <g stroke={P} strokeWidth="0.5" fill="none" opacity="0.8">
        <line x1="400" y1="0" x2="400" y2="460" /><line x1="0" y1="230" x2="790" y2="230" />
        <circle cx="400" cy="230" r="3" fill={P} />
      </g>
    </svg>
  );
}

/* ─────────────────────────────────────────────
   MAIN EXPORT
───────────────────────────────────────────── */
export default function OrbitNeonCyberpunk({ children }) {
  const navRef = useRef(null), sidebarRef = useRef(null), heroRef = useRef(null);
  const c0 = useRef(null), c1 = useRef(null), c2 = useRef(null), c3 = useRef(null);
  const [synced, setSynced] = useState(true);

  // ── Hidden Nexus State ──
  const [hiddenNexuses, setHiddenNexuses] = useState(() => {
      try {
          const saved = localStorage.getItem('cyberpunk_hidden_nexuses');
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
      localStorage.setItem('cyberpunk_hidden_nexuses', JSON.stringify(next));
  };

  const onReveal = (id) => {
      const next = hiddenNexuses.filter(h => h._id !== id);
      setHiddenNexuses(next);
      localStorage.setItem('cyberpunk_hidden_nexuses', JSON.stringify(next));
  };

  const { nexusActionView, setNexusActionView, nexuses, setSelectedNexus, isNexusesLoading, nexusUnread, selectedNexus, selectedNexusId } = useNexusStore();
  const nexusSelected = Boolean(selectedNexus || selectedNexusId);
  const { users, selectedUser, setSelectedUser } = useChatStore();

  // GSAP entrance animation
  useEffect(() => {
    const ctx = gsap.context(() => {
      const cards = [c0, c1, c2, c3].map(r => r.current).filter(Boolean);
      const nav = navRef.current;
      const sidebar = sidebarRef.current;
      const hero = heroRef.current;

      if (nav) gsap.set(nav, { opacity: 0, y: -20 });
      if (sidebar) gsap.set(sidebar, { opacity: 0, x: -30 });
      if (hero) gsap.set(hero, { opacity: 0, y: 14 });
      if (cards.length > 0) gsap.set(cards, { opacity: 0, y: 24, scale: 0.94 });

      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      if (nav) tl.to(nav, { opacity: 1, y: 0, duration: 0.5 });
      if (sidebar) tl.to(sidebar, { opacity: 1, x: 0, duration: 0.45 }, "-=0.3");
      if (hero) tl.to(hero, { opacity: 1, y: 0, duration: 0.4 }, "-=0.25");
      if (cards.length > 0) tl.to(cards, { opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.09 }, "-=0.2");
    });

    return () => ctx.revert();
  }, []);

  const handleToggleSync = useCallback(() => {
    setSynced(p => !p);
    if (heroRef.current) gsap.fromTo(heroRef.current,
      { filter: "hue-rotate(180deg) brightness(1.5)" },
      { filter: "none", duration: 0.6, ease: "power2.out" }
    );
  }, []);

  return (
    <div style={{ position: "relative", width: "100%", height: "100vh", overflow: "hidden", fontFamily: "'Space Grotesk','Rajdhani',system-ui,sans-serif", background: "#060010" }}>
      <style>{STYLES}</style>

      {/* Nebula backgrounds */}
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at 20% 50%,${P}44 0%,transparent 50%),radial-gradient(ellipse at 80% 30%,${C}18 0%,transparent 45%),radial-gradient(ellipse at 60% 80%,${M}22 0%,transparent 40%)`, pointerEvents: "none" }} />
      <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle,rgba(255,255,255,0.3) 1px,transparent 1px)", backgroundSize: "80px 80px", pointerEvents: "none", opacity: 0.12 }} />

      {/* Scanlines */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 50, background: "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.04) 2px,rgba(0,0,0,0.04) 4px)", mixBlendMode: "overlay" }} />

      {/* Code rain */}
      <OrbitRain />

      {/* Data streams overlay */}
      <DataStreams count={6} color={P} />

      <TopNav 
        navRef={navRef} 
        synced={synced} 
        hiddenNexuses={hiddenNexuses} 
        onReveal={onReveal} 
      />

      <div className="ncb-container" style={{ position: "absolute", top: 42, left: 0, right: 0, bottom: 0, display: "flex" }}>
        <Sidebar 
          sidebarRef={sidebarRef} 
          synced={synced} 
          onToggleSync={handleToggleSync} 
          onJoin={() => setNexusActionView("join")}
          onNexus={() => setNexusActionView("create")}
          nexuses={nexuses}
          isNexusesLoading={isNexusesLoading}
          setSelectedNexus={(n) => { setSelectedNexus(n); setSelectedUser(null); }}
          users={users || []}
          setSelectedUser={setSelectedUser}
          nexusUnread={nexusUnread || {}}
          setNexusActionView={setNexusActionView}
          hiddenNexuses={hiddenNexuses}
          toggleHide={toggleHide}
        />

        {/* Main content */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", position: "relative" }}>
          {children ? (
            <div style={{ flex: 1, overflowY: "auto", position: "relative" }}>
               {children}
            </div>
          ) : nexusActionView ? (
            <div style={{ position: "absolute", inset: 0, zIndex: 120 }}>
              <NexusActionOverlay mode={nexusActionView} onClose={() => setNexusActionView(null)} inline={true} />
            </div>
          ) : nexusSelected ? (
            <div className="neon-chat-env" style={{ position: "absolute", inset: 0, zIndex: 10, display: "flex", flexDirection: "column" }}>
              <UniversalChatContainer type="nexus" />
            </div>
          ) : selectedUser ? (
            <div className="neon-chat-env" style={{ position: "absolute", inset: 0, zIndex: 10, display: "flex", flexDirection: "column" }}>
              <UniversalChatContainer type="dm" />
            </div>
          ) : (
            <div style={{ flex: 1, padding: "12px 16px 10px 16px", display: "flex", flexDirection: "column", gap: 10, overflowY: "auto", position: "relative" }}>
              <CircuitOverlay />

              {/* Hero area */}
              <div ref={heroRef} className="ncb-hero" style={{ position: "relative", zIndex: 2 }}>
                <StatusBar synced={synced} />
                <div style={{ display: "flex", alignItems: "flex-end", gap: 16, flexWrap: "wrap" }}>
                  <div>
                    <h1 data-text="WELCOME TO ORBIT" className="ncb-glitch-text" style={{ margin: "0 0 2px 0", fontSize: 34, fontWeight: 900, letterSpacing: "0.06em", textTransform: "uppercase", lineHeight: 1.02, color: "#fff", textShadow: `0 0 20px ${C}66,0 0 40px ${C}33`, fontFamily: "'Orbitron',monospace" }}>
                      WELCOME TO ORBIT
                    </h1>
                    <p style={{ margin: 0, fontSize: 10.5, color: "rgba(140,220,220,0.55)", letterSpacing: "0.06em", fontFamily: "'Rajdhani',monospace" }}>
                      Neon Cyberpunk Dimension Active — Initialize your pathway.
                    </p>
                  </div>
                  {/* Sync CTA */}
                  <button className="ncb-hero-btn" onClick={handleToggleSync} style={{
                    flexShrink: 0, padding: "8px 20px", border: "none", borderRadius: 5, cursor: "pointer",
                    background: synced ? `linear-gradient(90deg,${C},${P})` : `linear-gradient(90deg,${P}88,${M}88)`,
                    color: "#000", fontFamily: "'Orbitron',monospace", fontSize: 13, fontWeight: 900, letterSpacing: "0.18em",
                    boxShadow: synced ? `0 0 20px ${C},0 0 40px ${C}66` : `0 0 10px ${P}55`,
                    transition: "all 0.25s", position: "relative", overflow: "hidden",
                  }}>
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.2),transparent)", backgroundSize: "200% 100%", animation: "ncbShimmer 1.8s infinite" }} />
                    {synced ? "🔗 SYNCHRONIZED" : "⚡ SYNC NOW"}
                  </button>
                </div>
              </div>

              {/* 2×2 Grid or children (settings/profile/spotify pages) */}
              {children ? (
                <div style={{ flex: 1, position: "relative", zIndex: 2, overflowY: "auto", display: "flex", flexDirection: "column" }}>
                  {children}
                </div>
              ) : (
                <div className="ncb-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, flex: 1, position: "relative", zIndex: 2 }}>
                  <div ref={c0} style={{ height: "100%" }}><AudioCard /></div>
                  <div ref={c1} style={{ height: "100%" }}><ChatCard /></div>
                  <div ref={c2} style={{ height: "100%" }}><NotifCard /></div>
                  <div ref={c3} style={{ height: "100%" }}><CustomizeCard /></div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
/* ─────────────────────────────────────────────
   TOGGLE SWITCH (for settings panels)
───────────────────────────────────────────── */
function ToggleSwitch({ label, checked, onChange, color = C }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px", background: "rgba(255,255,255,0.02)", borderRadius: 8, border: "1px solid rgba(255,255,255,0.05)" }}>
      <span style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", fontFamily: "'Orbitron', monospace", letterSpacing: "0.05em" }}>{label}</span>
      <div onClick={() => onChange(!checked)} style={{ width: 36, height: 20, borderRadius: 10, background: checked ? `linear-gradient(90deg,${color},${P})` : "rgba(255,255,255,0.08)", position: "relative", cursor: "pointer", transition: "all 0.2s", boxShadow: checked ? `0 0 10px ${color}88` : "none" }}>
        <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: checked ? 19 : 3, transition: "all 0.2s", boxShadow: checked ? `0 0 6px ${color}` : "none" }} />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   CYBERPUNK SETTINGS (used by SettingsPage)
───────────────────────────────────────────── */
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
      <div className="ncb-settings-layout" style={{ display: "flex", gap: 20, height: "100%" }}>
        {/* Settings Nav */}
        <NeonCard color={C} style={{ width: 260, padding: 20, display: "flex", flexDirection: "column", gap: 10, flexShrink: 0 }} className="ncb-settings-nav">
          <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: "0.25em", color: `${C}88`, fontFamily: "'Orbitron',monospace", marginBottom: 4 }}>// SYS.PREFERENCES</div>
          {sections.map(s => (
            <button key={s.id} onClick={() => { play("click"); setActiveSection(s.id); }} style={{ width: "100%", textAlign: "left", padding: "12px 16px", background: activeSection === s.id ? `${C}14` : "transparent", border: "1px solid", borderColor: activeSection === s.id ? C : "transparent", borderRadius: 6, color: activeSection === s.id ? "#fff" : `${C}66`, fontFamily: "'Orbitron', monospace", fontSize: 11, letterSpacing: "0.15em", cursor: "pointer", transition: "all 0.2s", display: "flex", alignItems: "center", gap: 10, boxShadow: activeSection === s.id ? `0 0 10px ${C}33` : "none" }}>
              <span style={{ fontSize: 16 }}>{s.icon}</span>{s.label}
            </button>
          ))}
          <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
            <button onClick={() => { play("click"); handleReset(); }} disabled={!isDirty} style={{ width: "100%", padding: "12px", borderRadius: 6, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: isDirty ? "#fff" : "rgba(255,255,255,0.25)", fontSize: 11, fontFamily: "'Orbitron', monospace", cursor: isDirty ? "pointer" : "default", letterSpacing: "0.1em" }}>ROLLBACK</button>
            <button onClick={() => { play("click"); handleSave(); }} disabled={!isDirty} style={{ width: "100%", padding: "12px", borderRadius: 6, background: isDirty ? `linear-gradient(90deg,${C},${P})` : `${C}15`, border: `1px solid ${isDirty ? C : `${C}22`}`, color: isDirty ? "#000" : `${C}44`, fontWeight: 900, fontSize: 11, fontFamily: "'Orbitron', monospace", cursor: isDirty ? "pointer" : "default", boxShadow: isDirty ? `0 0 15px ${C}55` : "none", letterSpacing: "0.1em" }}>COMMIT</button>
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
                        <div key={t} onClick={() => { play("click"); setFocusedTheme(t); }} style={{ padding: 14, borderRadius: 10, border: isSelected ? `2px solid ${C}` : `1px solid rgba(255,255,255,0.08)`, background: isSelected ? `${C}10` : "rgba(255,255,255,0.02)", display: "flex", flexDirection: "column", gap: 10, cursor: "pointer", transition: "all 0.2s", boxShadow: isSelected ? `0 0 15px ${C}33` : "none" }}>
                          <div style={{ width: "100%", height: 36, borderRadius: 5, border: "1px solid rgba(255,255,255,0.06)", overflow: "hidden", display: "flex", background: previewBg }}>
                            <div style={{ flex: 1, background: previewPrimary }} />
                            <div style={{ flex: 1, background: previewBg }} />
                          </div>
                          <div style={{ textAlign: "center" }}>
                            <div style={{ fontSize: 9, color: isSelected ? C : "rgba(255,255,255,0.4)", fontFamily: "'Orbitron', monospace", letterSpacing: "0.05em" }}>{THEME_LABELS[t] || t.toUpperCase()}</div>
                            {isSelected && !isApplied && (
                              <button onClick={e => { e.stopPropagation(); play("click"); setDraftTheme(t); }} style={{ marginTop: 6, padding: "5px 8px", width: "100%", background: C, border: "none", color: "#000", fontSize: 8, fontWeight: 900, fontFamily: "'Orbitron', monospace", cursor: "pointer", borderRadius: 4, letterSpacing: "0.1em", boxShadow: `0 0 8px ${C}66` }}>DEPLOY</button>
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
                <input type="range" min="0" max="1" step="0.01" value={draftSoundSettings.volume} onChange={e => setDraftSoundSettings(p => ({ ...p, volume: parseFloat(e.target.value) }))} style={{ width: "100%", accentColor: C }} />
              </div>
              <ToggleSwitch label="GLOBAL EFFECTS" checked={draftSoundSettings.effectsEnabled} onChange={v => setDraftSoundSettings(p => ({ ...p, effectsEnabled: v }))} />
              <ToggleSwitch label="TRANSMISSION PINGS" checked={draftSoundSettings.messageSound} onChange={v => setDraftSoundSettings(p => ({ ...p, messageSound: v }))} />
              <ToggleSwitch label="HAPTIC CLICKS" checked={draftSoundSettings.clickSound} onChange={v => setDraftSoundSettings(p => ({ ...p, clickSound: v }))} />
              <ToggleSwitch label="BACKGROUND AMBIENCE" checked={draftSoundSettings.ambientStorm ?? draftSoundSettings.orbitAmbientEnabled ?? true} onChange={v => setDraftSoundSettings(p => ({ ...p, ambientStorm: v, orbitAmbientEnabled: v }))} />
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
              <ToggleSwitch label="DESKTOP OVERLAYS" checked={draftNotifications.desktop} onChange={v => setDraftNotifications(p => ({ ...p, desktop: v }))} color={Y} />
              <ToggleSwitch label="AUDIO CUES" checked={draftNotifications.sound} onChange={v => setDraftNotifications(p => ({ ...p, sound: v }))} color={Y} />
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

/* ─────────────────────────────────────────────
   CYBERPUNK PROFILE
───────────────────────────────────────────── */
export function CyberpunkProfile() {
  const authUser = useAuthStore(s => s.authUser);
  return (
    <OrbitNeonCyberpunk>
      <div className="ncb-profile-layout" style={{ display: "flex", gap: 20, height: "100%" }}>
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
        </NeonCard>
      </div>
    </OrbitNeonCyberpunk>
  );
}

/* ─────────────────────────────────────────────
   CYBERPUNK SPOTIFY
───────────────────────────────────────────── */
export function CyberpunkSpotify() {
  const { spotifyLinked, currentTrack, isPlaying, pausePlayback, playTrack } = useSpotifyStore();
  const [playing, setPlaying] = useState(isPlaying || false);
  const { play } = useSoundManager();
  useEffect(() => { setPlaying(isPlaying); }, [isPlaying]);

  return (
    <OrbitNeonCyberpunk>
      <NeonCard color={C} style={{ flex: 1, padding: 40, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 28 }}>
        <h2 style={{ fontSize: 28, fontWeight: 900, color: C, fontFamily: "'Orbitron',monospace", textShadow: `0 0 20px ${C}88`, letterSpacing: "0.15em" }}>AUDIO SYNC</h2>
        {!spotifyLinked ? (
          <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
            <div style={{ fontSize: 15, color: "rgba(255,255,255,0.6)", fontFamily: "'Rajdhani',monospace", maxWidth: 400, lineHeight: 1.6 }}>
              Link your Spotify account to sync spatial audio across all active dimensions and orbit sessions.
            </div>
            <button onClick={() => window.location.href = `${API_URL}/api/spotify/login`} style={{ padding: "12px 28px", borderRadius: 6, background: `linear-gradient(90deg,${C},${P})`, color: "#000", border: "none", fontSize: 14, fontWeight: 900, fontFamily: "'Orbitron',monospace", letterSpacing: "0.1em", cursor: "pointer", boxShadow: `0 0 24px ${C}66` }}>
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
    </OrbitNeonCyberpunk>
  );
}
