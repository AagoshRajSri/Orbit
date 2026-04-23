import { useEffect, useRef, useState, useCallback } from "react";
import UniversalChatContainer from "../components/UniversalChatContainer";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { useSpotifyStore } from "../store/useSpotifyStore";
import { THEMES, THEME_LABELS } from "../constants";
import { gsap } from "gsap";
import { useNexusStore } from "../store/useNexusStore";
import NexusActionOverlay from "../components/NexusActionOverlay";
import { useSettingsStore } from "../store/useSettingsStore";
import { API_URL } from "../config";

/* ─────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────── */
const SHARDS = [
  { x: 220, y: 60, w: 8, h: 14, color: "#ff2d78", rot: 35, dur: 4.2 }, { x: 235, y: 95, w: 5, h: 10, color: "#00f5d4", rot: -20, dur: 3.8 },
  { x: 590, y: 62, w: 7, h: 12, color: "#ffe600", rot: 15, dur: 4.5 }, { x: 610, y: 80, w: 4, h: 8, color: "#ff2d78", rot: -40, dur: 3.5 },
  { x: 680, y: 55, w: 6, h: 10, color: "#00cfff", rot: 50, dur: 4.0 }, { x: 750, y: 140, w: 5, h: 9, color: "#9b59b6", rot: -25, dur: 3.9 },
  { x: 820, y: 70, w: 8, h: 5, color: "#00f5d4", rot: 60, dur: 4.3 }, { x: 870, y: 110, w: 4, h: 8, color: "#ff2d78", rot: -15, dur: 3.6 },
  { x: 930, y: 60, w: 6, h: 11, color: "#ffe600", rot: 30, dur: 4.1 }, { x: 960, y: 90, w: 5, h: 5, color: "#00cfff", rot: -50, dur: 3.7 },
  { x: 990, y: 130, w: 7, h: 4, color: "#ff2d78", rot: 40, dur: 4.4 }, { x: 258, y: 280, w: 8, h: 5, color: "#00f5d4", rot: 20, dur: 4.0 },
  { x: 244, y: 320, w: 5, h: 10, color: "#9b59b6", rot: -30, dur: 3.8 }, { x: 232, y: 380, w: 6, h: 6, color: "#ff2d78", rot: 55, dur: 4.2 },
  { x: 975, y: 280, w: 7, h: 12, color: "#ffe600", rot: -20, dur: 3.9 }, { x: 985, y: 360, w: 5, h: 8, color: "#00cfff", rot: 35, dur: 4.1 },
];
const STARS_BG = [
  { x: 300, y: 90, s: 3, c: "#00f5d4" }, { x: 720, y: 75, s: 4, c: "#ff2d78" }, { x: 810, y: 165, s: 3, c: "#ffe600" },
  { x: 670, y: 135, s: 5, c: "#00cfff" }, { x: 740, y: 185, s: 4, c: "#9b59b6" }, { x: 900, y: 195, s: 3, c: "#00f5d4" },
  { x: 960, y: 165, s: 4, c: "#ff2d78" }, { x: 950, y: 455, s: 22, c: "#e0e0ff" }, { x: 275, y: 455, s: 4, c: "#00f5d4" },
  { x: 265, y: 200, s: 4, c: "#ff2d78" }, { x: 258, y: 415, s: 5, c: "#00cfff" },
];
const RANKS = ["IRON", "BRONZE", "SILVER", "GOLD", "PLATINUM", "DIAMOND", "MASTER", "GRANDMASTER", "RADIANT"];
const RANK_COLORS = { "IRON": "#8a8a8a", "BRONZE": "#cd7f32", "SILVER": "#c0c0c0", "GOLD": "#ffd700", "PLATINUM": "#00e5ff", "DIAMOND": "#a78bfa", "MASTER": "#ff6b9d", "GRANDMASTER": "#ff2d78", "RADIANT": "#fff700" };
const QUESTS = [
  { id: 1, icon: "⚔️", label: "FRAG OUT", desc: "Get 20 eliminations", cur: 14, max: 20, xp: 500, color: "#ff2d78" },
  { id: 2, icon: "🏆", label: "WIN STREAK", desc: "Win 3 matches in a row", cur: 2, max: 3, xp: 750, color: "#ffe600" },
  { id: 3, icon: "🛡️", label: "LOCK DEFENSE", desc: "Block 50 incoming hits", cur: 50, max: 50, xp: 300, color: "#00f5d4", done: true },
];
const KILL_FEED = [
  { killer: "NEXUS_X", victim: "SHADOW99", weapon: "PLASMA", time: "0:12", color: "#ff2d78" },
  { killer: "YOU", victim: "DARKWAVE", weapon: "RAILGUN", time: "0:34", color: "#ffe600", isYou: true },
  { killer: "CYBORG", victim: "GLITCH", weapon: "VOID", time: "1:02", color: "#9b59b6" },
  { killer: "YOU", victim: "ZERO_K", weapon: "RAILGUN", time: "1:18", color: "#ffe600", isYou: true },
];
const SQUAD = [
  { name: "YOU", rank: "DIAMOND", hp: 100, ping: 12, status: "alive", color: "#a78bfa" },
  { name: "NEXUS_X", rank: "MASTER", hp: 68, ping: 28, status: "alive", color: "#ff2d78" },
  { name: "CYBORG", rank: "PLATINUM", hp: 34, ping: 55, status: "low", color: "#00e5ff" },
  { name: "GLITCH_7", rank: "GOLD", hp: 0, ping: 0, status: "dead", color: "#ffd700" },
];

/* ─────────────────────────────────────────────
   CIRCUIT SVG OVERLAYS
───────────────────────────────────────────── */
function CircuitLines() {
  return (
    <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.18, pointerEvents: "none" }} viewBox="0 0 215 500" preserveAspectRatio="none">
      <g stroke="#00f5d4" strokeWidth="0.6" fill="none">
        {["20", "50", "120", "180"].map(x => <line key={x} x1={x} y1="0" x2={x} y2="500" />)}
        {["80", "160", "300", "420"].map(y => <line key={y} x1="0" y1={y} x2="215" y2={y} />)}
        <line x1="20" y1="80" x2="50" y2="120" /><line x1="50" y1="160" x2="120" y2="200" />
        <line x1="120" y1="80" x2="180" y2="100" /><line x1="20" y1="300" x2="80" y2="340" />
        {[[20, 80], [50, 160], [120, 80], [180, 160], [20, 300], [120, 300], [50, 420], [180, 420]].map(([cx, cy]) => (
          <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="2.5" fill="#00f5d4" />
        ))}
      </g>
      <g stroke="#ff2d78" strokeWidth="0.5" fill="none" opacity="0.7">
        <line x1="80" y1="0" x2="80" y2="500" /><line x1="155" y1="0" x2="155" y2="500" />
        <line x1="0" y1="240" x2="215" y2="240" />
        <circle cx="80" cy="240" r="2" fill="#ff2d78" /><circle cx="155" cy="80" r="2" fill="#ff2d78" />
      </g>
    </svg>
  );
}
function MainCircuits() {
  return (
    <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.1, pointerEvents: "none" }} viewBox="0 0 790 460" preserveAspectRatio="none">
      <g stroke="#00f5d4" strokeWidth="0.7" fill="none">
        <line x1="0" y1="50" x2="60" y2="50" /><line x1="60" y1="50" x2="80" y2="30" /><line x1="80" y1="30" x2="200" y2="30" />
        <line x1="790" y1="120" x2="730" y2="120" /><line x1="730" y1="120" x2="710" y2="100" /><line x1="710" y1="100" x2="600" y2="100" />
        <line x1="0" y1="400" x2="80" y2="400" /><line x1="80" y1="400" x2="100" y2="420" />
        <circle cx="60" cy="50" r="2.5" fill="#00f5d4" /><circle cx="730" cy="120" r="2.5" fill="#00f5d4" /><circle cx="80" cy="400" r="2.5" fill="#00f5d4" />
      </g>
    </svg>
  );
}

/* ─────────────────────────────────────────────
   NEON CARD SHELL
───────────────────────────────────────────── */
function NeonCard({ color = "#00f5d4", children, style = {} }) {
  const [hover, setHover] = useState(false);
  return (
    <div 
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ border: `1.5px solid ${color}`, borderRadius: 8, boxShadow: hover ? `0 0 15px ${color},0 0 30px ${color}66,inset 0 0 15px ${color}33` : `0 0 8px ${color},0 0 20px ${color}44,inset 0 0 8px ${color}11`, background: "rgba(8,6,20,0.82)", backdropFilter: "blur(6px)", position: "relative", overflow: "hidden", transition: "all 0.3s ease", transform: hover ? "translateY(-2px)" : "translateY(0)", ...style }}>
      <div style={{ position: "absolute", top: -1, left: -1, width: 14, height: 14, borderTop: `2.5px solid ${color}`, borderLeft: `2.5px solid ${color}`, borderRadius: "6px 0 0 0", zIndex: 5 }} />
      <div style={{ position: "absolute", top: -1, right: -1, width: 14, height: 14, borderTop: `2.5px solid ${color}`, borderRight: `2.5px solid ${color}`, borderRadius: "0 6px 0 0", zIndex: 5 }} />
      <div style={{ position: "absolute", bottom: -1, left: -1, width: 14, height: 14, borderBottom: `2.5px solid ${color}`, borderLeft: `2.5px solid ${color}`, borderRadius: "0 0 0 6px", zIndex: 5 }} />
      <div style={{ position: "absolute", bottom: -1, right: -1, width: 14, height: 14, borderBottom: `2.5px solid ${color}`, borderRight: `2.5px solid ${color}`, borderRadius: "0 0 6px 0", zIndex: 5 }} />
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────────
   AUDIO VISUALIZER
───────────────────────────────────────────── */
function AudioViz({ playing }) {
  const [bars, setBars] = useState(() => Array.from({ length: 32 }, () => 0.3 + Math.random() * 0.7));
  useEffect(() => {
    if (!playing) return;
    const iv = setInterval(() => setBars(b => b.map(v => Math.max(0.05, Math.min(1, v + (Math.random() - 0.5) * 0.4)))), 80);
    return () => clearInterval(iv);
  }, [playing]);
  const colors = ["#00f5d4", "#00cfff", "#ff2d78", "#ffe600", "#9b59b6"];
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 1.5, height: 44, padding: "0 2px" }}>
      {bars.map((h, i) => (
        <div key={i} style={{ flex: 1, height: `${h * 100}%`, background: colors[i % colors.length], borderRadius: "1px 1px 0 0", boxShadow: `0 0 4px ${colors[i % colors.length]}`, transition: "height 0.08s ease", minWidth: 3 }} />
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────
   RADAR SWEEP
───────────────────────────────────────────── */
function RadarSweep() {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext("2d"), W = c.width, H = c.height, cx = W / 2, cy = H / 2, R = Math.min(W, H) / 2 - 4;
    let ang = 0;
    const blips = Array.from({ length: 6 }, () => ({ a: Math.random() * Math.PI * 2, r: R * (0.2 + Math.random() * 0.7), alpha: 0 }));
    let raf;
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      ctx.strokeStyle = "rgba(0,245,212,0.18)"; ctx.lineWidth = 0.8;
      [0.33, 0.66, 1].forEach(f => { ctx.beginPath(); ctx.arc(cx, cy, R * f, 0, Math.PI * 2); ctx.stroke(); });
      ctx.strokeStyle = "rgba(0,245,212,0.12)";
      ctx.beginPath(); ctx.moveTo(cx - R, cy); ctx.lineTo(cx + R, cy); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, cy - R); ctx.lineTo(cx, cy + R); ctx.stroke();
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(ang);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, R, -0.6, 0); ctx.fillStyle = "rgba(0,245,212,0.07)"; ctx.fill();
      ctx.strokeStyle = "#00f5d4"; ctx.lineWidth = 1.5; ctx.shadowColor = "#00f5d4"; ctx.shadowBlur = 6;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(R, 0); ctx.stroke(); ctx.restore();
      blips.forEach(b => {
        const da = ((ang - b.a) + Math.PI * 2) % (Math.PI * 2);
        if (da < 0.15) b.alpha = 1; else b.alpha = Math.max(0, b.alpha - 0.012);
        if (b.alpha > 0) {
          const bx = cx + b.r * Math.cos(b.a), by = cy + b.r * Math.sin(b.a);
          ctx.save(); ctx.globalAlpha = b.alpha; ctx.fillStyle = "#00f5d4"; ctx.shadowColor = "#00f5d4"; ctx.shadowBlur = 8;
          ctx.beginPath(); ctx.arc(bx, by, 2.5, 0, Math.PI * 2); ctx.fill(); ctx.restore();
        }
      });
      ang = (ang + 0.025) % (Math.PI * 2); raf = requestAnimationFrame(draw);
    };
    draw(); return () => cancelAnimationFrame(raf);
  }, []);
  return <canvas ref={ref} width={150} height={120} style={{ display: "block" }} />;
}

/* ─────────────────────────────────────────────
   HOLOGRAPHIC GLOBE
───────────────────────────────────────────── */
function HoloGlobe() {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext("2d"), W = c.width, H = c.height, cx = W / 2, cy = H / 2, R = 48;
    let t = 0, raf;
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      const grd = ctx.createRadialGradient(cx, cy, R * 0.5, cx, cy, R * 1.3);
      grd.addColorStop(0, "rgba(180,80,255,0)"); grd.addColorStop(0.7, "rgba(180,80,255,0.15)"); grd.addColorStop(1, "rgba(0,180,255,0)");
      ctx.fillStyle = grd; ctx.fillRect(0, 0, W, H);
      for (let lat = -3; lat <= 3; lat++) {
        const y = cy + (lat / 3) * R * 0.85, xr = Math.sqrt(Math.max(0, R * R - (y - cy) * (y - cy)));
        if (xr < 2) continue;
        ctx.strokeStyle = `rgba(0,200,255,${0.1 + 0.12 * Math.abs(lat / 4)})`; ctx.lineWidth = 0.8;
        ctx.beginPath(); ctx.ellipse(cx, y, xr, xr * 0.22, 0, 0, Math.PI * 2); ctx.stroke();
      }
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI + t * 0.3; ctx.strokeStyle = "rgba(180,80,255,0.18)"; ctx.lineWidth = 0.7;
        ctx.beginPath(); ctx.ellipse(cx, cy, R * Math.abs(Math.cos(a)), R, 0, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.strokeStyle = "rgba(0,200,255,0.55)"; ctx.lineWidth = 1.5; ctx.shadowColor = "#00cfff"; ctx.shadowBlur = 12;
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke(); ctx.shadowBlur = 0;
      const nodes = [{ a: t * .5, la: .4 }, { a: t * .5 + 2, la: -.3 }, { a: t * .5 + 1, la: .1 }, { a: t * .5 + 4, la: .6 }, { a: t * .5 + 3, la: -.5 }];
      const pts = nodes.map(n => {
        const cosLo = Math.cos(n.a); if (cosLo < 0) return null;
        return { x: cx + R * cosLo * Math.cos(n.la), y: cy + R * Math.sin(n.la), vis: cosLo };
      });
      pts.forEach((p, i) => {
        if (!p) return; pts.forEach((q, j) => {
          if (j <= i || !q) return; ctx.strokeStyle = `rgba(0,200,255,${p.vis * q.vis * 0.4})`; ctx.lineWidth = 0.5;
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
        });
      });
      pts.forEach(p => {
        if (!p) return; ctx.fillStyle = `rgba(0,220,255,${p.vis})`; ctx.shadowColor = "#00cfff"; ctx.shadowBlur = 8;
        ctx.beginPath(); ctx.arc(p.x, p.y, 2, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
      });
      const plat = ctx.createRadialGradient(cx, cy + R + 6, 2, cx, cy + R + 6, 32);
      plat.addColorStop(0, "rgba(180,80,255,0.5)"); plat.addColorStop(1, "rgba(180,80,255,0)");
      ctx.fillStyle = plat; ctx.beginPath(); ctx.ellipse(cx, cy + R + 6, 32, 8, 0, 0, Math.PI * 2); ctx.fill();
      t += 0.012; raf = requestAnimationFrame(draw);
    };
    draw(); return () => cancelAnimationFrame(raf);
  }, []);
  return <canvas ref={ref} width={130} height={130} style={{ display: "block" }} />;
}

/* ─────────────────────────────────────────────
   SPINNING GEARS
───────────────────────────────────────────── */
function Gears() {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext("2d"), W = c.width, H = c.height;
    let t = 0, raf;
    const drawGear = (cx, cy, R, r, teeth, angle, color, alpha = 1) => {
      ctx.save(); ctx.globalAlpha = alpha; ctx.translate(cx, cy); ctx.rotate(angle);
      ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.shadowColor = color; ctx.shadowBlur = 6;
      ctx.beginPath();
      for (let i = 0; i < teeth; i++) {
        const a = (i / teeth) * Math.PI * 2, a1 = a - 0.15, a2 = a + 0.15, a3 = a + 0.35, a4 = a + 0.5;
        if (i === 0) ctx.moveTo(R * Math.cos(a1), R * Math.sin(a1)); else ctx.lineTo(R * Math.cos(a1), R * Math.sin(a1));
        ctx.lineTo((R + r) * Math.cos(a2), (R + r) * Math.sin(a2)); ctx.lineTo((R + r) * Math.cos(a3), (R + r) * Math.sin(a3)); ctx.lineTo(R * Math.cos(a4), R * Math.sin(a4));
      }
      ctx.closePath(); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, R * 0.35, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI * 2); ctx.stroke();
      for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2; ctx.beginPath(); ctx.moveTo(6 * Math.cos(a), 6 * Math.sin(a)); ctx.lineTo(R * 0.3 * Math.cos(a), R * 0.3 * Math.sin(a)); ctx.stroke(); }
      ctx.restore();
    };
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      drawGear(65, 65, 36, 7, 12, t, "#00f5d4", 0.9);
      drawGear(110, 72, 22, 5, 9, -t * 1.6, "#9b59b6", 0.8);
      drawGear(42, 100, 16, 5, 8, -t * 2.2, "#00cfff", 0.7);
      t += 0.018; raf = requestAnimationFrame(draw);
    };
    draw(); return () => cancelAnimationFrame(raf);
  }, []);
  return <canvas ref={ref} width={155} height={130} style={{ display: "block" }} />;
}

/* ─────────────────────────────────────────────
   XP BAR
───────────────────────────────────────────── */
function XPBar({ xp = 7340, maxXp = 10000, level = 47 }) {
  const pct = (xp / maxXp) * 100;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontSize: 9, fontWeight: 900, color: "#ffe600", letterSpacing: "0.1em", whiteSpace: "nowrap", fontFamily: "'Orbitron',monospace", textShadow: "0 0 6px #ffe600" }}>LVL {level}</span>
      <div style={{ flex: 1, height: 6, borderRadius: 3, background: "rgba(255,230,0,0.12)", border: "1px solid rgba(255,230,0,0.25)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, width: `${pct}%`, background: "linear-gradient(90deg,#ffaa00,#ffe600,#fff700)", borderRadius: 3, boxShadow: "0 0 8px #ffe600", transition: "width 0.5s ease" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg,transparent 0%,rgba(255,255,255,0.15) 50%,transparent 100%)", animation: "shimmer 2s infinite" }} />
      </div>
      <span style={{ fontSize: 8.5, color: "rgba(255,230,0,0.6)", fontFamily: "'Orbitron',monospace", whiteSpace: "nowrap" }}>{xp.toLocaleString()}/{maxXp.toLocaleString()} XP</span>
    </div>
  );
}

/* ─────────────────────────────────────────────
   RANK BADGE
───────────────────────────────────────────── */
function RankBadge({ rank = "DIAMOND", rp = 1847, nextRp = 2000 }) {
  const color = RANK_COLORS[rank] || "#fff";
  const pct = Math.round((rp / nextRp) * 100);
  return (
    <NeonCard color={color} style={{ padding: "8px 12px", display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ textAlign: "center", flexShrink: 0 }}>
        <div style={{ fontSize: 22, lineHeight: 1, filter: `drop-shadow(0 0 8px ${color})` }}>
          {rank === "IRON" ? "⬡" : rank === "BRONZE" ? "🔶" : rank === "SILVER" ? "💠" : rank === "GOLD" ? "👑" : rank === "PLATINUM" ? "💎" : rank === "DIAMOND" ? "💎" : rank === "MASTER" ? "⭐" : rank === "GRANDMASTER" ? "🔥" : "✦"}
        </div>
        <div style={{ fontSize: 7, fontWeight: 900, color, letterSpacing: "0.15em", marginTop: 2, fontFamily: "'Orbitron',monospace", textShadow: `0 0 6px ${color}` }}>{rank}</div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
          <span style={{ fontSize: 8, color: "rgba(255,255,255,0.5)", letterSpacing: "0.08em", fontFamily: "'Orbitron',monospace" }}>RANK POINTS</span>
          <span style={{ fontSize: 9, fontWeight: 900, color, fontFamily: "'Orbitron',monospace", textShadow: `0 0 4px ${color}` }}>{rp.toLocaleString()} RP</span>
        </div>
        <div style={{ height: 4, borderRadius: 2, background: `rgba(${color === '#a78bfa' ? '167,139,250' : color === '#ffd700' ? '255,215,0' : '0,229,255'},0.12)`, border: `1px solid ${color}44`, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg,${color}88,${color})`, borderRadius: 2, boxShadow: `0 0 6px ${color}`, transition: "width 0.5s" }} />
        </div>
        <div style={{ fontSize: 7.5, color: "rgba(255,255,255,0.4)", marginTop: 2, fontFamily: "'Rajdhani',monospace" }}>{nextRp - rp} RP to promote</div>
      </div>
    </NeonCard>
  );
}

/* ─────────────────────────────────────────────
   KILL FEED
───────────────────────────────────────────── */
function KillFeed() {
  const [visible, setVisible] = useState(KILL_FEED);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <div style={{ fontSize: 8, fontWeight: 900, letterSpacing: "0.2em", color: "rgba(255,45,120,0.7)", fontFamily: "'Orbitron',monospace", marginBottom: 2 }}>⚔ KILL FEED</div>
      {visible.map((k, i) => (
        <div key={i} style={{
          display: "flex", alignItems: "center", gap: 5, padding: "3px 6px", borderRadius: 3,
          background: k.isYou ? "rgba(255,230,0,0.08)" : "rgba(255,255,255,0.03)",
          border: k.isYou ? "1px solid rgba(255,230,0,0.25)" : "1px solid rgba(255,255,255,0.06)",
          animation: `fadeSlideIn 0.3s ease ${i * 0.1}s both`,
        }}>
          <span style={{ fontSize: 8, fontWeight: 800, color: k.isYou ? "#ffe600" : "rgba(255,255,255,0.7)", fontFamily: "'Orbitron',monospace", letterSpacing: "0.04em" }}>{k.killer}</span>
          <span style={{ fontSize: 8, color: "rgba(255,45,120,0.8)" }}>✕</span>
          <span style={{ fontSize: 8, color: "rgba(150,130,180,0.7)", fontFamily: "'Orbitron',monospace" }}>{k.victim}</span>
          <span style={{ flex: 1, textAlign: "right", fontSize: 7, color: "rgba(100,100,150,0.6)", fontFamily: "'Rajdhani',monospace" }}>{k.weapon}</span>
          <span style={{ fontSize: 7, color: "rgba(100,100,150,0.5)", fontFamily: "'Rajdhani',monospace" }}>{k.time}</span>
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────
   SQUAD STATUS
───────────────────────────────────────────── */
function SquadStatus() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={{ fontSize: 8, fontWeight: 900, letterSpacing: "0.2em", color: "rgba(0,245,212,0.7)", fontFamily: "'Orbitron',monospace", marginBottom: 1 }}>👥 SQUAD</div>
      {SQUAD.map((m, i) => (
        <div key={i} style={{
          display: "flex", alignItems: "center", gap: 6, padding: "4px 6px", borderRadius: 3,
          background: m.name === "YOU" ? "rgba(167,139,250,0.1)" : "rgba(255,255,255,0.02)",
          border: m.name === "YOU" ? "1px solid rgba(167,139,250,0.3)" : "1px solid rgba(255,255,255,0.05)",
          opacity: m.status === "dead" ? 0.4 : 1,
        }}>
          <div style={{ width: 5, height: 5, borderRadius: "50%", background: m.status === "dead" ? "#444" : m.status === "low" ? "#ff6b00" : "#00f5d4", boxShadow: m.status === "dead" ? "none" : `0 0 5px ${m.status === "low" ? "#ff6b00" : "#00f5d4"}` }} />
          <span style={{ fontSize: 8, fontWeight: 800, color: m.name === "YOU" ? m.color : "rgba(255,255,255,0.75)", fontFamily: "'Orbitron',monospace", letterSpacing: "0.04em", flex: 1 }}>{m.name}</span>
          <span style={{ fontSize: 7, color: "rgba(100,100,150,0.7)", fontFamily: "'Orbitron',monospace" }}>{m.rank.slice(0, 3)}</span>
          {m.status !== "dead" && <div style={{ width: 36, height: 3, borderRadius: 2, background: "rgba(255,100,0,0.2)", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${m.hp}%`, background: m.hp > 60 ? "#00f5d4" : m.hp > 30 ? "#ffe600" : "#ff2d78", borderRadius: 2, transition: "width 0.3s" }} />
          </div>}
          {m.status === "dead" ? <span style={{ fontSize: 7, color: "#ff2d78", fontFamily: "'Orbitron',monospace" }}>DEAD</span> : <span style={{ fontSize: 7, color: "rgba(100,100,150,0.5)", fontFamily: "'Rajdhani',monospace" }}>{m.ping}ms</span>}
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────
   DAILY QUESTS
───────────────────────────────────────────── */
function DailyQuests() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 1 }}>
        <span style={{ fontSize: 8, fontWeight: 900, letterSpacing: "0.2em", color: "rgba(255,170,0,0.8)", fontFamily: "'Orbitron',monospace" }}>📋 DAILY GRIND</span>
        <span style={{ fontSize: 7.5, color: "rgba(100,100,150,0.6)", fontFamily: "'Rajdhani',monospace" }}>resets in 6h 42m</span>
      </div>
      {QUESTS.map(q => (
        <div key={q.id} style={{
          padding: "5px 8px", borderRadius: 4,
          background: q.done ? "rgba(0,245,212,0.06)" : "rgba(255,255,255,0.02)",
          border: `1px solid ${q.done ? "rgba(0,245,212,0.3)" : "rgba(255,255,255,0.07)"}`,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ fontSize: 10 }}>{q.icon}</span>
              <div>
                <div style={{ fontSize: 8, fontWeight: 900, color: q.done ? "#00f5d4" : q.color, letterSpacing: "0.1em", fontFamily: "'Orbitron',monospace" }}>{q.label}</div>
                <div style={{ fontSize: 7.5, color: "rgba(150,130,180,0.6)", fontFamily: "'Rajdhani',monospace" }}>{q.desc}</div>
              </div>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div style={{ fontSize: 8, fontWeight: 800, color: q.done ? "#00f5d4" : "#ffe600", fontFamily: "'Orbitron',monospace" }}>{q.done ? "✓" : ""} +{q.xp} XP</div>
              <div style={{ fontSize: 7.5, color: "rgba(100,100,150,0.6)", fontFamily: "'Rajdhani',monospace" }}>{q.cur}/{q.max}</div>
            </div>
          </div>
          <div style={{ height: 3, borderRadius: 2, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${(q.cur / q.max) * 100}%`, background: q.done ? "#00f5d4" : `linear-gradient(90deg,${q.color}88,${q.color})`, borderRadius: 2, boxShadow: q.done ? "0 0 4px #00f5d4" : "none", transition: "width 0.4s" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────
   LOCK IN BUTTON
───────────────────────────────────────────── */
function LockInButton({ locked, onToggle }) {
  return (
    <button onClick={onToggle} style={{
      width: "100%", padding: "7px 0", border: "none", borderRadius: 5, cursor: "pointer",
      background: locked
        ? "linear-gradient(90deg,#ff2d78,#ff6030)"
        : "linear-gradient(90deg,#ffe600,#ffaa00)",
      color: "#000", fontFamily: "'Orbitron',monospace",
      fontSize: 11, fontWeight: 900, letterSpacing: "0.2em",
      boxShadow: locked
        ? "0 0 16px #ff2d78,0 0 32px #ff2d7866"
        : "0 0 16px #ffe600,0 0 32px #ffe60066",
      transition: "all 0.25s",
      animation: locked ? "lockedPulse 2s ease-in-out infinite" : "none",
      position: "relative", overflow: "hidden",
    }}>
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.18),transparent)", animation: "shimmer 1.8s infinite" }} />
      {locked ? "🔒 LOCKED IN" : "⚡ LOCK IN NOW"}
    </button>
  );
}

/* ─────────────────────────────────────────────
   DEBRIS + STARS LAYER
───────────────────────────────────────────── */
function DebrisLayer() {
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
      {SHARDS.map((s, i) => (
        <div key={i} style={{ position: "absolute", left: s.x, top: s.y, width: s.w, height: s.h, background: s.color, transform: `rotate(${s.rot}deg)`, opacity: 0.75, boxShadow: `0 0 4px ${s.color}`, animation: `debrisFloat ${s.dur}s ease-in-out infinite`, animationDelay: `${i * 0.18}s` }} />
      ))}
      {STARS_BG.map((s, i) => (
        <div key={"st" + i} style={{ position: "absolute", left: s.x, top: s.y, width: s.s, height: s.s, background: s.c, borderRadius: s.s > 8 ? "50%" : "2px", transform: s.s > 8 ? "none" : "rotate(45deg)", opacity: s.s > 8 ? 0.6 : 0.7, boxShadow: `0 0 ${s.s * 2}px ${s.c}`, animation: `starBlink ${2.5 + i * 0.3}s ease-in-out infinite`, animationDelay: `${i * 0.22}s` }} />
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────
   SCANLINES
───────────────────────────────────────────── */
function Scanlines() {
  return <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 50, background: "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.04) 2px,rgba(0,0,0,0.04) 4px)", mixBlendMode: "overlay" }} />;
}

/* ─────────────────────────────────────────────
   TOP NAV
───────────────────────────────────────────── */
function TopNav({ navRef, locked, killCount }) {
  const [time, setTime] = useState(() => new Date().toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" }));
  useEffect(() => { const iv = setInterval(() => setTime(new Date().toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" })), 1000); return () => clearInterval(iv); }, []);
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuthStore();
  
  const navItems = [];
  if (location.pathname !== "/") {
    navItems.push({ icon: "◀", label: "Go back", path: "/", highlight: true });
  }
  navItems.push(
    { icon: "⚙", label: "Settings", path: "/settings" },
    { icon: "👤", label: "Profile", path: "/profile" },
    { icon: "→", label: "Logout", action: "logout" }
  );

  return (
    <div ref={navRef} style={{ position: "absolute", top: 0, left: 0, right: 0, height: 42, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 14px", zIndex: 40, background: "rgba(4,2,18,0.9)", borderBottom: "1px solid rgba(0,245,212,0.2)", backdropFilter: "blur(8px)" }}>
      {/* Logo + mode */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 26, height: 26, borderRadius: "50%", border: "1.5px solid #ff2d78", boxShadow: "0 0 8px #ff2d78,0 0 16px #ff2d7844", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,45,120,0.12)", fontSize: 12 }}>🌀</div>
        <span style={{ fontSize: 14, fontWeight: 900, letterSpacing: "0.18em", color: "#00f5d4", textShadow: "0 0 10px #00f5d4,0 0 20px #00f5d488", fontFamily: "'Orbitron',monospace" }}>ORBIT</span>
        {locked && <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 3, background: "rgba(255,45,120,0.15)", border: "1px solid rgba(255,45,120,0.5)", animation: "lockedPulse 2s infinite" }}>
          <span style={{ fontSize: 8 }}>🔒</span>
          <span style={{ fontSize: 8, fontWeight: 900, color: "#ff2d78", letterSpacing: "0.15em", fontFamily: "'Orbitron',monospace" }}>GRIND MODE</span>
        </div>}
      </div>
      {/* Center HUD stats */}
      <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 7, color: "rgba(0,245,212,0.5)", letterSpacing: "0.15em", fontFamily: "'Orbitron',monospace" }}>SESSION KILLS</div>
          <div style={{ fontSize: 13, fontWeight: 900, color: "#ff2d78", fontFamily: "'Orbitron',monospace", textShadow: "0 0 8px #ff2d78" }}>{killCount}</div>
        </div>
        <div style={{ width: 1, height: 22, background: "rgba(0,245,212,0.2)" }} />
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 7, color: "rgba(0,245,212,0.5)", letterSpacing: "0.15em", fontFamily: "'Orbitron',monospace" }}>K/D RATIO</div>
          <div style={{ fontSize: 13, fontWeight: 900, color: "#ffe600", fontFamily: "'Orbitron',monospace", textShadow: "0 0 8px #ffe600" }}>4.2</div>
        </div>
        <div style={{ width: 1, height: 22, background: "rgba(0,245,212,0.2)" }} />
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 7, color: "rgba(0,245,212,0.5)", letterSpacing: "0.15em", fontFamily: "'Orbitron',monospace" }}>WIN RATE</div>
          <div style={{ fontSize: 13, fontWeight: 900, color: "#00f5d4", fontFamily: "'Orbitron',monospace", textShadow: "0 0 8px #00f5d4" }}>68%</div>
        </div>
        <div style={{ width: 1, height: 22, background: "rgba(0,245,212,0.2)" }} />
        <div style={{ width: 75, textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end", justifyContent: "center" }}>
          <div style={{ fontSize: 7, color: "rgba(0,245,212,0.5)", letterSpacing: "0.15em", fontFamily: "'Orbitron',monospace" }}>LOCAL TIME</div>
          <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 11, color: "rgba(0,245,212,0.6)", letterSpacing: "0.08em", fontVariantNumeric: "tabular-nums" }}>{time}</div>
        </div>
      </div>
      {/* Nav */}
      <div style={{ display: "flex", gap: 5 }}>
        {navItems.map((item) => (
          <button key={item.label} onClick={item.action === "logout" ? logout : () => navigate(item.path)} style={{ display: "flex", alignItems: "center", gap: 4, background: item.highlight ? "rgba(255,45,120,0.15)" : "rgba(0,245,212,0.06)", border: `1px solid ${item.highlight ? "rgba(255,45,120,0.5)" : "rgba(0,245,212,0.35)"}`, borderRadius: 4, padding: "4px 8px", cursor: "pointer", fontSize: 10, fontWeight: 900, letterSpacing: "0.08em", color: item.highlight ? "#ff2d78" : "#a0f0e8", fontFamily: "'Orbitron',monospace", transition: "all 0.2s", textTransform: "uppercase" }}
            onMouseEnter={e => { e.currentTarget.style.background = item.highlight ? "rgba(255,45,120,0.3)" : "rgba(0,245,212,0.18)"; e.currentTarget.style.boxShadow = `0 0 10px ${item.highlight ? "rgba(255,45,120,0.5)" : "rgba(0,245,212,0.4)"}`; }}
            onMouseLeave={e => { e.currentTarget.style.background = item.highlight ? "rgba(255,45,120,0.15)" : "rgba(0,245,212,0.06)"; e.currentTarget.style.boxShadow = "none"; }}>
            <span>{item.icon}</span>{item.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   SIDEBAR
───────────────────────────────────────────── */
function Sidebar({ sidebarRef, locked, onToggleLocked, onJoin, onNexus, nexuses, isNexusesLoading, setSelectedNexus, users, setSelectedUser, nexusUnread, setNexusActionView }) {
  const navigate = useNavigate();
  const [tab, setTab] = useState("orbits");
  const activeSt = (color) => ({ flex: 1, border: `1px solid ${color}`, borderRadius: 3, padding: "5px 0", cursor: "pointer", fontSize: 9, fontWeight: 800, letterSpacing: "0.1em", fontFamily: "'Orbitron',monospace", background: `rgba(${color === "#ff2d78" ? "255,45,120" : "0,245,212"},0.12)`, color, boxShadow: `0 0 8px ${color}66`, transition: "all 0.2s" });
  const ghostSt = () => ({ flex: 1, border: "1px solid rgba(100,100,150,0.4)", borderRadius: 3, padding: "5px 0", cursor: "pointer", fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", fontFamily: "'Orbitron',monospace", background: "rgba(255,255,255,0.03)", color: "rgba(150,150,200,0.6)", transition: "all 0.2s" });
  return (
    <div ref={sidebarRef} style={{ width: 215, flexShrink: 0, display: "flex", flexDirection: "column", gap: 8, borderRight: "1px solid rgba(0,245,212,0.2)", background: "rgba(4,2,18,0.7)", backdropFilter: "blur(8px)", padding: "10px 10px 10px 10px", position: "relative", overflow: "hidden", overflowY: "auto" }}>
      <CircuitLines />
      <div style={{ display: "flex", gap: 4, position: "relative", zIndex: 2 }}>
        <button onClick={() => setTab("orbits")} style={tab === "orbits" ? activeSt("#ff2d78") : ghostSt()}># ORBITS</button>
        <button onClick={() => setTab("contacts")} style={tab === "contacts" ? activeSt("#00f5d4") : ghostSt()}><span style={{ fontSize: 8, marginRight: 2 }}>👤</span>CONTACTS</button>
      </div>
      <div style={{ display: "flex", gap: 4, position: "relative", zIndex: 2 }}>
        <button onClick={onJoin} style={{ flex: 1, border: "1px solid rgba(0,245,212,0.4)", borderRadius: 3, padding: "5px 0", fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", fontFamily: "'Orbitron',monospace", background: "rgba(0,245,212,0.06)", color: "#60d8cc", cursor: "pointer" }}>JOIN</button>
        <button onClick={onNexus} style={{ flex: 1, border: "1px solid rgba(0,207,255,0.5)", borderRadius: 3, padding: "5px 0", fontSize: 9, fontWeight: 800, letterSpacing: "0.1em", fontFamily: "'Orbitron',monospace", background: "linear-gradient(90deg,rgba(0,207,255,0.18),rgba(180,80,255,0.18))", color: "#00cfff", cursor: "pointer", boxShadow: "0 0 8px rgba(0,207,255,0.3)" }}>+ NEXUS</button>
      </div>
      {/* Nexus / Contact List */}
      <div style={{ flex: 1, overflowY: "auto", position: "relative", zIndex: 2, display: "flex", flexDirection: "column", gap: 2 }}>
        {tab === "orbits" ? (
          isNexusesLoading ? (
            <div style={{ padding: 12, fontSize: 10, color: "rgba(0,245,212,0.5)", fontFamily: "'Orbitron',monospace", textAlign: "center" }}>SCANNING...</div>
          ) : nexuses.length === 0 ? (
            <div style={{ padding: 12, fontSize: 10, color: "rgba(0,245,212,0.4)", fontFamily: "'Orbitron',monospace", textAlign: "center", lineHeight: 1.6 }}>NO NEXUS NODES DETECTED<br />JOIN OR CREATE ONE</div>
          ) : (
            nexuses.map(n => (
              <div key={n._id}
                onClick={() => { setSelectedNexus(n); }}
                style={{ display: "flex", alignItems: "center", gap: 9, padding: "9px 10px", borderRadius: 6, cursor: "pointer", transition: "background 0.2s", background: "rgba(0,245,212,0.03)", border: "1px solid transparent" }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(0,245,212,0.1)"; e.currentTarget.style.borderColor = "rgba(0,245,212,0.3)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(0,245,212,0.03)"; e.currentTarget.style.borderColor = "transparent"; }}
              >
                <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(0,207,255,0.12)", border: "1px solid rgba(0,245,212,0.4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0, overflow: "hidden" }}>
                  {n.avatar ? <img src={n.avatar} alt={n.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : "⬡"}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "#00f5d4", fontFamily: "'Orbitron',monospace", letterSpacing: "0.05em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n.name}</div>
                  <div style={{ fontSize: 9, color: "rgba(0,245,212,0.5)", fontFamily: "'Orbitron',monospace" }}>{n.members?.length || 0} MEMBERS</div>
                </div>
                {nexusUnread[n._id] > 0 && (
                  <div style={{ width: 18, height: 18, background: "#ff2d78", color: "#fff", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 900, boxShadow: "0 0 10px #ff2d78" }}>{nexusUnread[n._id]}</div>
                )}
              </div>
            ))
          )
        ) : (
          users.length === 0 ? (
            <div style={{ padding: 12, fontSize: 10, color: "rgba(0,245,212,0.4)", fontFamily: "'Orbitron',monospace", textAlign: "center" }}>NO CONTACTS</div>
          ) : (
            users.map(u => (
              <div key={u._id}
                onClick={() => { setSelectedUser(u); }}
                style={{ display: "flex", alignItems: "center", gap: 9, padding: "9px 10px", borderRadius: 6, cursor: "pointer", transition: "background 0.2s" }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(0,207,255,0.08)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <div style={{ width: 32, height: 32, borderRadius: "50%", overflow: "hidden", flexShrink: 0, border: "1px solid rgba(0,245,212,0.4)" }}>
                  {u.profilePic ? <img src={u.profilePic} alt={u.username} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: "100%", height: "100%", background: "rgba(0,207,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#00cfff", fontFamily: "'Orbitron',monospace" }}>{u.username?.[0]?.toUpperCase()}</div>}
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#00f5d4", fontFamily: "'Orbitron',monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.username}</div>
              </div>
            ))
          )
        )}
      </div>

      {/* Rank Badge */}
      <div style={{ position: "relative", zIndex: 2 }}>
        <RankBadge rank="DIAMOND" rp={1847} nextRp={2000} />
      </div>

      {/* XP Bar */}
      <div style={{ position: "relative", zIndex: 2, padding: "4px 0" }}>
        <XPBar />
      </div>

      {/* Squad Status */}
      <div style={{ position: "relative", zIndex: 2 }}>
        <NeonCard color="#00f5d4" style={{ padding: "8px 10px" }}>
          <SquadStatus />
        </NeonCard>
      </div>

      {/* Kill Feed */}
      <div style={{ position: "relative", zIndex: 2 }}>
        <NeonCard color="#ff2d78" style={{ padding: "8px 10px" }}>
          <KillFeed />
        </NeonCard>
      </div>

      {/* Lock In */}
      <div style={{ position: "relative", zIndex: 2 }}>
        <LockInButton locked={locked} onToggle={onToggleLocked} />
      </div>

      {/* Enter Orbit */}
      <div style={{ marginTop: "auto", borderRadius: 6, padding: "8px 10px", display: "flex", alignItems: "center", gap: 8, background: "linear-gradient(90deg,rgba(0,207,255,0.12),rgba(180,80,255,0.1))", border: "1.5px solid #00cfff", cursor: "pointer", boxShadow: "0 0 10px rgba(0,207,255,0.3)", position: "relative", zIndex: 2, flexShrink: 0, overflow: "hidden", transition: "all 0.2s" }}
        onClick={() => window.dispatchEvent(new CustomEvent("toggle-orbit-mode"))}
        onMouseEnter={e => e.currentTarget.style.boxShadow = "0 0 20px rgba(0,207,255,0.6)"}
        onMouseLeave={e => e.currentTarget.style.boxShadow = "0 0 10px rgba(0,207,255,0.3)"}>
        <div style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid rgba(0,207,255,0.5)", background: "rgba(0,207,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0, boxShadow: "0 0 8px rgba(0,207,255,0.3)" }}>🌀</div>
        <div>
          <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: "0.12em", color: "#00cfff", textTransform: "uppercase", textShadow: "0 0 6px #00cfff", fontFamily: "'Orbitron',monospace" }}>ENTER YOUR ORBIT</div>
          <div style={{ fontSize: 7.5, color: "rgba(0,207,255,0.55)", letterSpacing: "0.1em", fontFamily: "'Orbitron',monospace" }}>88 FPS GALAXY ENGINE</div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   AUDIO CARD
───────────────────────────────────────────── */
function AudioCard() {
  const [playing, setPlaying] = useState(true);
  const navigate = useNavigate();
  
  return (
    <NeonCard color="#00f5d4" style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8, height: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#00f5d4", boxShadow: "0 0 8px #00f5d4", display: "inline-block", animation: "pulse 1.6s infinite" }} />
          <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.15em", color: "#00f5d4", textShadow: "0 0 6px #00f5d4", fontFamily: "'Orbitron',monospace" }}>NEXUS AUDIO</span>
        </div>
        <span onClick={() => navigate("/spotify")} style={{ fontSize: 8, fontWeight: 700, color: "rgba(0,245,212,0.45)", fontFamily: "'Orbitron',monospace", cursor: "pointer", transition: "color 0.2s" }} onMouseEnter={e => e.currentTarget.style.color = "#00f5d4"} onMouseLeave={e => e.currentTarget.style.color = "rgba(0,245,212,0.45)"}>EXPAND</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 52, height: 52, borderRadius: 4, flexShrink: 0, overflow: "hidden", border: "1px solid rgba(0,245,212,0.3)", boxShadow: "0 0 8px rgba(0,245,212,0.2)" }}>
          <svg width="52" height="52" viewBox="0 0 52 52"><rect width="52" height="52" fill="#1a0e2a" /><rect x="0" y="8" width="52" height="16" fill="rgba(100,60,140,0.6)" /><rect x="0" y="30" width="52" height="12" fill="rgba(60,40,100,0.5)" /><line x1="13" y1="0" x2="13" y2="52" stroke="rgba(80,50,120,0.4)" strokeWidth="1" /><line x1="30" y1="0" x2="30" y2="52" stroke="rgba(80,50,120,0.3)" strokeWidth="1" /></svg>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: "#fff", textShadow: "0 0 6px rgba(255,255,255,0.5)" }}>Reflections</div>
          <div style={{ fontSize: 9.5, color: "rgba(180,160,220,0.65)", marginTop: 1 }}>The Neighbourhood</div>
          <div style={{ marginTop: 5, height: 44 }}><AudioViz playing={playing} /></div>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 14 }}>
        <button style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,45,120,0.65)", fontSize: 13, padding: 0 }}>⏮</button>
        <button onClick={() => setPlaying(p => !p)} style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,#ff2d78,#ff6060)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 11, boxShadow: "0 0 12px #ff2d78,0 0 24px #ff2d7844", transition: "transform 0.15s" }}
          onMouseEnter={e => e.currentTarget.style.transform = "scale(1.15)"} onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>
          {playing ? "⏸" : "▶"}
        </button>
        <button style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,45,120,0.65)", fontSize: 13, padding: 0 }}>⏭</button>
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 6, marginLeft: 4 }}>
          <span style={{ fontSize: 9, color: "rgba(255,45,120,0.5)" }}>🔈</span>
          <div style={{ flex: 1, height: 3, borderRadius: 2, background: "rgba(255,45,120,0.12)", position: "relative" }}>
            <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "55%", background: "linear-gradient(90deg,#ff2d78,#ff8060)", borderRadius: 2, boxShadow: "0 0 5px #ff2d78" }} />
            <div style={{ position: "absolute", left: "55%", top: "50%", transform: "translate(-50%,-50%)", width: 7, height: 7, borderRadius: "50%", background: "#ff2d78", boxShadow: "0 0 6px #ff2d78" }} />
          </div>
        </div>
      </div>
    </NeonCard>
  );
}

/* ─────────────────────────────────────────────
   CHAT CARD
───────────────────────────────────────────── */
function ChatCard() {
  return (
    <NeonCard color="#ff2d78" style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 6, height: "100%", position: "relative" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
        <div style={{ flex: 1 }}>
          <div style={{ width: 30, height: 30, borderRadius: 7, border: "1.5px solid rgba(255,45,120,0.6)", background: "rgba(255,45,120,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, boxShadow: "0 0 8px rgba(255,45,120,0.3)", marginBottom: 8 }}>💬</div>
          <div style={{ fontSize: 10.5, fontWeight: 900, letterSpacing: "0.15em", color: "#ff2d78", textTransform: "uppercase", textShadow: "0 0 8px #ff2d78", fontFamily: "'Orbitron',monospace", marginBottom: 4 }}>START CHATTING</div>
          <div style={{ fontSize: 9.5, color: "rgba(200,140,170,0.7)", lineHeight: 1.5 }}>Select a Constellation or create a private conversation</div>
        </div>
        <div style={{ flexShrink: 0 }}><HoloGlobe /></div>
      </div>
      <div style={{ position: "absolute", bottom: 26, left: 14, right: 14, height: "0.5px", background: "rgba(255,45,120,0.2)" }} />
      <div style={{ position: "absolute", bottom: 9, right: 12, fontSize: 10, color: "rgba(255,45,120,0.4)", fontWeight: "bold" }}>⚡</div>
    </NeonCard>
  );
}

/* ─────────────────────────────────────────────
   NOTIF CARD (with Daily Quests inside)
───────────────────────────────────────────── */
function NotifCard() {
  return (
    <NeonCard color="#ffaa00" style={{ padding: "12px 14px", display: "flex", gap: 10, height: "100%", position: "relative" }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, border: "1.5px solid rgba(255,170,0,0.6)", background: "rgba(255,170,0,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, boxShadow: "0 0 8px rgba(255,170,0,0.3)" }}>🔔</div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.15em", color: "#ffaa00", textShadow: "0 0 8px #ffaa00", fontFamily: "'Orbitron',monospace" }}>GET NOTIFICATIONS</div>
            <div style={{ fontSize: 8.5, color: "rgba(200,160,80,0.65)", lineHeight: 1.4 }}>Stay updated with real-time alerts</div>
          </div>
        </div>
        <DailyQuests />
      </div>
      <div style={{ flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(0,245,212,0.2)", borderRadius: 4, overflow: "hidden", boxShadow: "0 0 8px rgba(0,245,212,0.1)", background: "rgba(0,20,15,0.6)" }}>
        <RadarSweep />
      </div>
      <div style={{ position: "absolute", bottom: 9, right: 12, fontSize: 10, color: "rgba(255,170,0,0.4)", fontWeight: "bold" }}>↓</div>
    </NeonCard>
  );
}

/* ─────────────────────────────────────────────
   CUSTOMIZE CARD
───────────────────────────────────────────── */
function CustomizeCard() {
  return (
    <NeonCard color="#00cfff" style={{ padding: "12px 14px", display: "flex", gap: 8, height: "100%", position: "relative" }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5 }}>
        <div style={{ width: 28, height: 28, borderRadius: 7, border: "1.5px solid rgba(0,207,255,0.6)", background: "rgba(0,207,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, boxShadow: "0 0 8px rgba(0,207,255,0.3)" }}>⚙️</div>
        <div style={{ fontSize: 10.5, fontWeight: 900, letterSpacing: "0.15em", color: "#00cfff", textTransform: "uppercase", textShadow: "0 0 8px #00cfff", fontFamily: "'Orbitron',monospace" }}>CUSTOMIZE</div>
        <div style={{ fontSize: 9.5, color: "rgba(100,190,220,0.7)", lineHeight: 1.5 }}>Configure your orbit behavior and preferences</div>
        {/* quick stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, marginTop: 2 }}>
          {[{ l: "MATCHES", v: "284" }, { l: "TOP 1%", v: "YES" }, { l: "HOURS", v: "1,240" }, { l: "STREAK", v: "7d" }].map(s => (
            <div key={s.l} style={{ padding: "3px 6px", borderRadius: 3, background: "rgba(0,207,255,0.06)", border: "1px solid rgba(0,207,255,0.18)" }}>
              <div style={{ fontSize: 6.5, color: "rgba(0,207,255,0.45)", letterSpacing: "0.12em", fontFamily: "'Orbitron',monospace" }}>{s.l}</div>
              <div style={{ fontSize: 10, fontWeight: 900, color: "#00cfff", fontFamily: "'Orbitron',monospace", textShadow: "0 0 4px #00cfff" }}>{s.v}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ flexShrink: 0, display: "flex", alignItems: "center" }}><Gears /></div>
      <div onClick={() => window.location.href = "/settings"} style={{ position: "absolute", bottom: 9, right: 12, fontSize: 10, color: "rgba(0,207,255,0.4)", fontWeight: "bold", cursor: "pointer", transition: "color 0.2s" }} onMouseEnter={e => e.currentTarget.style.color = "#00cfff"} onMouseLeave={e => e.currentTarget.style.color = "rgba(0,207,255,0.4)"}>↑</div>
    </NeonCard>
  );
}

/* ─────────────────────────────────────────────
   STATUS BAR
───────────────────────────────────────────── */
function StatusBar({ locked }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
      <div style={{ width: 24, height: "1px", background: "rgba(0,245,212,0.4)" }} />
      <span style={{ fontSize: 8, fontWeight: 800, letterSpacing: "0.2em", color: "#00f5d4", textShadow: "0 0 6px #00f5d4", fontFamily: "'Orbitron',monospace" }}>STATUS: ONLINE</span>
      <div style={{ display: "flex", gap: 1.5, alignItems: "flex-end" }}>
        {Array.from({ length: 26 }, (_, i) => (
          <div key={i} style={{ width: 2, height: 4 + Math.sin(i * 0.5) * 3, background: "#00f5d4", opacity: 0.65 + (i % 3) * 0.1, boxShadow: "0 0 3px #00f5d4" }} />
        ))}
      </div>
      {locked && <div style={{ marginLeft: 8, padding: "1px 8px", borderRadius: 2, background: "rgba(255,45,120,0.2)", border: "1px solid rgba(255,45,120,0.6)", fontSize: 8, fontWeight: 900, color: "#ff2d78", fontFamily: "'Orbitron',monospace", letterSpacing: "0.15em", animation: "lockedPulse 2s infinite" }}>🔒 GRIND ACTIVE</div>}
    </div>
  );
}

/* ─────────────────────────────────────────────
   MAIN APP
───────────────────────────────────────────── */
export default function OrbitGrind({ children }) {
  const navRef = useRef(null), sidebarRef = useRef(null), heroRef = useRef(null);
  const c0 = useRef(null), c1 = useRef(null), c2 = useRef(null), c3 = useRef(null);
  const [locked, setLocked] = useState(false);
  const [killCount, setKillCount] = useState(14);
  const { nexusActionView, setNexusActionView, nexuses, setSelectedNexus, isNexusesLoading, nexusUnread, selectedNexus, selectedNexusId } = useNexusStore();
  const nexusSelected = Boolean(selectedNexus || selectedNexusId);
  const { users, selectedUser, setSelectedUser } = useChatStore();

  useEffect(() => {
    const ctx = gsap.context(() => {
      const cards = [c0, c1, c2, c3].map(r => r?.current).filter(Boolean);
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
      
      if (cards.length > 0) {
        tl.to(cards, { opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.09 }, "-=0.2");
      }
    });
    return () => ctx.revert();
  }, []);

  const handleLockIn = useCallback(() => {
    setLocked(p => {
      const isLocking = !p;
      if (isLocking) {
        gsap.to("body", { filter: "hue-rotate(90deg) contrast(1.5)", duration: 0.1, yoyo: true, repeat: 5 });
        if (heroRef.current) gsap.fromTo(heroRef.current, { scale: 0.9, opacity: 0.5 }, { scale: 1, opacity: 1, duration: 0.5, ease: "elastic.out(1, 0.3)" });
        gsap.fromTo(document.body, { x: -8 }, { x: 0, duration: 0.08, yoyo: true, repeat: 7, clearProps: "x" });
      } else if (!isLocking) {
        gsap.to("body", { filter: "none", duration: 0.3 });
      }
      return isLocking;
    });
    setKillCount(k => k + (Math.floor(Math.random() * 3) + 1));
  }, []);

  return (
    <div style={{ position: "relative", width: "100%", height: "100vh", overflow: "hidden", fontFamily: "'Rajdhani',system-ui,sans-serif", background: "#060412" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Rajdhani:wght@400;500;600;700&display=swap');
        @keyframes debrisFloat{0%,100%{transform:translateY(0) rotate(0deg);}50%{transform:translateY(-8px) rotate(10deg);}}
        @keyframes starBlink{0%,100%{opacity:0.55;transform:scale(1);}50%{opacity:1;transform:scale(1.2);}}
        @keyframes pulse{0%,100%{opacity:1;}50%{opacity:0.35;}}
        @keyframes shimmer{0%{transform:translateX(-100%);}100%{transform:translateX(200%);}}
        @keyframes lockedPulse{0%,100%{opacity:1;box-shadow:0 0 10px currentColor;}50%{opacity:0.7;box-shadow:0 0 25px currentColor;}}
        @keyframes fadeSlideIn{from{opacity:0;transform:translateX(-8px);}to{opacity:1;transform:translateX(0);}}
        *{box-sizing:border-box;} button:focus{outline:none;}
        ::-webkit-scrollbar{width:3px;height:3px;} 
        ::-webkit-scrollbar-track{background:rgba(0,0,0,0.5);}
        ::-webkit-scrollbar-thumb{background:rgba(0,245,212,0.2);border-radius:99px;transition:all 0.3s;}
        ::-webkit-scrollbar-thumb:hover{background:rgba(0,245,212,0.5);}

        /* ── Gamer Battle-Station Chat Theme ── */
        .gamer-chat-env .nexus-chat-container {
          background: #0a0a0a !important;
          border: 4px solid #1a1a1a !important;
          border-radius: 4px !important; /* rigid, angular */
          box-shadow: inset 0 0 10px #000 !important;
        }
        .gamer-chat-env .nexus-chat-header { 
          background: repeating-linear-gradient(45deg, #111, #111 6px, #1a1a1a 6px, #1a1a1a 12px) !important; /* carbon-fiber-like edge */
          border-bottom: 2px solid #333 !important;
          border-radius: 4px 4px 0 0 !important;
        }
        .gamer-chat-env .nexus-chat-header .text-base-content,
        .gamer-chat-env .nxc-name { 
          color: #ff2d78 !important; font-family: 'Orbitron', sans-serif !important; letter-spacing: 2px !important; text-shadow: 0 0 8px #ff2d78 !important; font-weight: 900 !important;
        }
        .gamer-chat-env .nexus-chat-header .text-base-content\/70 { color: rgba(255,255,255,0.6) !important; }
        
        .gamer-chat-env .nxc-utility-group,
        .gamer-chat-env .nxc-telemetry-capsule {
          background: #111 !important;
          border: 1.5px solid #333 !important; /* brushed aluminum feel */
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.8), 0 2px 0px rgba(255,255,255,0.1) !important;
          border-radius: 0px !important; /* Angular */
        }
        .gamer-chat-env .nxc-hbtn, .gamer-chat-env .nxc-aero-btn {
          background: #1a1a1a !important; color: #fff !important;
          border-radius: 0px !important; border: 1px solid #ff2d78 !important;
          animation: rgb-border 4s linear infinite !important;
        }
        @keyframes rgb-border { 
           0% { border-color: #ff0000; box-shadow: inset 0 0 5px #ff0000; }
          33% { border-color: #00ff00; box-shadow: inset 0 0 5px #00ff00; }
          66% { border-color: #0000ff; box-shadow: inset 0 0 5px #0000ff; }
         100% { border-color: #ff0000; box-shadow: inset 0 0 5px #ff0000; }
        }
        .gamer-chat-env .nxc-signal-bars { display: flex; align-items: flex-end; gap: 1px; }
        .gamer-chat-env .nxc-signal-bars .nxc-bar { background: #ff2d78 !important; width: 4px !important; border-radius: 0 !important; height: 10px !important; }
        .gamer-chat-env .bg-white\/20 { background: #333 !important; }

        .gamer-chat-env .nxi-shell { 
          background: rgba(4,2,18,0.92) !important; 
          border-top: 1px solid rgba(0,245,212,0.3) !important;
        }
        .gamer-chat-env .nxi-send.ready { background: #ff2d78 !important; border: 1px solid #ff2d78 !important; box-shadow: 0 0 10px #ff2d78 !important; color: #fff !important; }
        .gamer-chat-env .nxi-textarea { background: rgba(0,245,212,0.06) !important; border: 1px solid rgba(0,245,212,0.2) !important; color: #fff !important; font-family: 'Rajdhani', sans-serif !important; font-weight: 500 !important; font-size: 15px !important; }
        .gamer-chat-env .nxi-textarea:focus { border-color: #00f5d4 !important; box-shadow: 0 0 10px rgba(0,245,212,0.3) !important; }
        .gamer-chat-env .nxi-tool-btn, .gamer-chat-env .nxi-mic { color: #00f5d4 !important; }

        .gamer-chat-env .msg-bubble-mine { 
          background: rgba(255,45,120,0.15) !important; 
          border: 1.5px solid #ff2d78 !important; 
          box-shadow: 0 0 12px rgba(255,45,120,0.3) !important;
          font-family: 'Rajdhani', sans-serif !important;
          color: #fff !important;
        }
        .gamer-chat-env .msg-bubble-other { 
          background: rgba(0,245,212,0.08) !important; 
          border: 1.5px solid rgba(0,245,212,0.4) !important; 
          font-family: 'Rajdhani', sans-serif !important;
          color: #fff !important;
        }
      `}</style>

      {/* nebula bg */}
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 20% 50%,rgba(80,0,120,0.55) 0%,transparent 50%),radial-gradient(ellipse at 80% 30%,rgba(0,60,120,0.45) 0%,transparent 45%),radial-gradient(ellipse at 60% 80%,rgba(0,80,60,0.35) 0%,transparent 40%),radial-gradient(ellipse at 10% 80%,rgba(120,0,80,0.3) 0%,transparent 40%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle,rgba(255,255,255,0.35) 1px,transparent 1px)", backgroundSize: "80px 80px", pointerEvents: "none", opacity: 0.25 }} />

      <Scanlines />
      <DebrisLayer />
      <TopNav navRef={navRef} locked={locked} killCount={killCount} />

      <div style={{ position: "absolute", top: 42, left: 0, right: 0, bottom: 0, display: "flex" }}>
        <Sidebar 
          sidebarRef={sidebarRef} 
          locked={locked} 
          onToggleLocked={handleLockIn} 
          onJoin={() => setNexusActionView("join")}
          onNexus={() => setNexusActionView("create")}
          nexuses={nexuses}
          isNexusesLoading={isNexusesLoading}
          setSelectedNexus={(n) => { setSelectedNexus(n); setSelectedUser(null); }}
          users={users || []}
          setSelectedUser={(u) => { setSelectedUser(u); setSelectedNexus(null); }}
          nexusUnread={nexusUnread || {}}
          setNexusActionView={setNexusActionView}
        />

        {/* Main */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", position: "relative" }}>
          <MainCircuits />

          {children ? (
            <div style={{ flex: 1, position: "relative", zIndex: 2, overflowY: "auto", display: "flex", flexDirection: "column" }}>
              {children}
            </div>
          ) : nexusActionView ? (
            <div style={{ position: "absolute", inset: 0, zIndex: 20 }}>
              <NexusActionOverlay mode={nexusActionView} onClose={() => setNexusActionView(null)} inline={true} />
            </div>
          ) : nexusSelected ? (
            <div className="gamer-chat-env" style={{ position: "absolute", inset: 0, zIndex: 10, display: "flex", flexDirection: "column" }}>
              <UniversalChatContainer type="nexus" />
            </div>
          ) : selectedUser ? (
            <div className="gamer-chat-env" style={{ position: "absolute", inset: 0, zIndex: 10, display: "flex", flexDirection: "column" }}>
              <UniversalChatContainer type="dm" />
            </div>
          ) : (
            <div style={{ flex: 1, padding: "12px 16px 10px 16px", display: "flex", flexDirection: "column", gap: 10, overflowY: "auto", position: "relative" }}>
              {/* Hero */}
              <div ref={heroRef} style={{ position: "relative", zIndex: 2 }}>
                <StatusBar locked={locked} />
                <div style={{ display: "flex", alignItems: "flex-end", gap: 16, flexWrap: "wrap", marginBottom: "10px" }}>
                  <div>
                    <h1 style={{ margin: "0 0 2px 0", fontSize: 34, fontWeight: 900, letterSpacing: "0.06em", textTransform: "uppercase", lineHeight: 1.02, color: "#fff", textShadow: "0 0 20px rgba(0,245,212,0.5),0 0 40px rgba(0,245,212,0.25)", fontFamily: "'Orbitron',monospace" }}>WELCOME TO ORBIT</h1>
                    <p style={{ margin: 0, fontSize: 10.5, color: "rgba(180,220,210,0.6)", letterSpacing: "0.06em", fontFamily: "'Rajdhani',monospace" }}>Choose a pathway to begin your mission. Time to LOCK IN and push rank.</p>
                  </div>
                  {/* LOCK IN hero CTA */}
                  <button onClick={handleLockIn} style={{ flexShrink: 0, padding: "8px 20px", border: "none", borderRadius: 5, cursor: "pointer", background: locked ? "linear-gradient(90deg,#ff2d78,#ff6030)" : "linear-gradient(90deg,#ffe600,#ffaa00)", color: "#000", fontFamily: "'Orbitron',monospace", fontSize: 13, fontWeight: 900, letterSpacing: "0.18em", boxShadow: locked ? "0 0 20px #ff2d78,0 0 40px #ff2d7866" : "0 0 20px #ffe600,0 0 40px #ffe60066", transition: "all 0.25s", position: "relative", overflow: "hidden" }}>
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.2),transparent)", animation: "shimmer 1.8s infinite" }} />
                    {locked ? "🔒 LOCKED IN — GRINDING" : "⚡ LOCK IN NOW"}
                  </button>
                </div>
              </div>

              {/* 2×2 Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, flex: 1, position: "relative", zIndex: 2 }}>
                <div ref={c0} style={{ height: "100%" }}><AudioCard /></div>
                <div ref={c1} style={{ height: "100%" }}><ChatCard /></div>
                <div ref={c2} style={{ height: "100%" }}><NotifCard /></div>
                <div ref={c3} style={{ height: "100%" }}><CustomizeCard /></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Toggle component for GamerSettings
function ToggleSwitch({ label, checked, onChange, color = "#00cfff" }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px", background: "rgba(255,255,255,0.03)", borderRadius: 8, border: "1px solid rgba(255,255,255,0.05)" }}>
      <span style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", fontFamily: "'Orbitron', monospace", letterSpacing: "0.05em" }}>{label}</span>
      <div 
        onClick={() => onChange(!checked)}
        style={{ width: 36, height: 20, borderRadius: 10, background: checked ? color : "rgba(255,255,255,0.1)", position: "relative", cursor: "pointer", transition: "all 0.2s", boxShadow: checked ? `0 0 10px ${color}` : "none" }}>
        <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: checked ? 19 : 3, transition: "all 0.2s" }} />
      </div>
    </div>
  );
}

export function GamerSettings({
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
  const [focusedTheme, setFocusedTheme] = useState(draftTheme);
  
  return (
    <OrbitGrind>
      <div style={{ display: "flex", gap: 20, height: "100%" }}>
        {/* Sidebar for Settings */}
        <NeonCard color="#00cfff" style={{ width: 280, padding: 24, display: "flex", flexDirection: "column", gap: 12 }}>
          {[
            { id: "profile", label: "IDENTITY", icon: "👤" },
            { id: "sound", label: "AUDIO", icon: "🔊" },
            { id: "appearance", label: "VISUALS", icon: "🎨" },
            { id: "notifications", label: "ALERTS", icon: "🔔" },
            { id: "orbit", label: "ENGINE", icon: "🪐" },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveSection(tab.id)} style={{ width: "100%", textAlign: "left", padding: "16px 20px", background: activeSection === tab.id ? "rgba(0,207,255,0.15)" : "transparent", border: "1px solid", borderColor: activeSection === tab.id ? "#00cfff" : "transparent", borderRadius: 8, color: activeSection === tab.id ? "#fff" : "rgba(0,207,255,0.6)", fontFamily: "'Orbitron', monospace", fontSize: 13, letterSpacing: "0.15em", cursor: "pointer", transition: "all 0.2s", display: "flex", alignItems: "center", gap: 14 }}>
              <span style={{ fontSize: 18 }}>{tab.icon}</span> {tab.label}
            </button>
          ))}
          <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 12 }}>
            <button onClick={handleReset} disabled={!isDirty} style={{ width: "100%", padding: "14px", borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: isDirty ? "#fff" : "rgba(255,255,255,0.3)", fontSize: 12, fontWeight: 700, fontFamily: "'Orbitron', monospace", cursor: isDirty ? "pointer" : "default", letterSpacing: "0.1em" }}>RESET</button>
            <button onClick={handleSave} disabled={!isDirty} style={{ width: "100%", padding: "14px", borderRadius: 8, background: isDirty ? "#00cfff" : "rgba(0,207,255,0.1)", border: isDirty ? "1px solid #00cfff" : "1px solid rgba(0,207,255,0.2)", color: isDirty ? "#000" : "rgba(0,207,255,0.4)", fontWeight: 900, fontSize: 12, fontFamily: "'Orbitron', monospace", cursor: isDirty ? "pointer" : "default", boxShadow: isDirty ? "0 0 15px rgba(0,207,255,0.4)" : "none", letterSpacing: "0.1em" }}>COMMIT</button>
          </div>
        </NeonCard>

        {/* Content Area */}
        <NeonCard color="#00cfff" style={{ flex: 1, padding: 32, overflowY: "auto" }}>
          <h2 style={{ fontSize: 24, fontWeight: 900, color: "#00cfff", fontFamily: "'Orbitron',monospace", marginBottom: 24, textShadow: "0 0 10px #00cfff", letterSpacing: "0.15em" }}>SYSTEM_PREFERENCES // {activeSection.toUpperCase()}</h2>
          
          {activeSection === "appearance" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 16 }}>
              {THEMES.map(t => {
                const isSelected = focusedTheme === t;
                const isApplied = draftTheme === t;
                
                // Fixed preview colors for each theme
                let previewPrimary = "#ff2d78"; // default (gamer pink)
                let previewBg = "#080614";
                
                if (t === "light") { previewPrimary = "#3b82f6"; previewBg = "#ffffff"; }
                else if (t === "dark") { previewPrimary = "#ef4444"; previewBg = "#0a0a0a"; }
                else if (t === "neon-cyberpunk") { previewPrimary = "#8b5cf6"; previewBg = "#0c0e14"; }
                else if (t === "gamer-high-energy") { previewPrimary = "#ff2d78"; previewBg = "#080614"; }
                else if (t === "pastel-dream") { previewPrimary = "#e060b0"; previewBg = "#ffd4ee"; }
                else if (t === "amoled-dark") { previewPrimary = "#E8C990"; previewBg = "#000000"; }

                return (
                  <div key={t} onClick={() => setFocusedTheme(t)} style={{ padding: 16, borderRadius: 12, border: isSelected ? "2px solid #00f5d4" : "1px solid rgba(255,255,255,0.1)", background: isSelected ? "rgba(0,245,212,0.1)" : "rgba(255,255,255,0.03)", display: "flex", flexDirection: "column", gap: 12, cursor: "pointer", transition: "all 0.2s" }}>
                    <div style={{ width: "100%", height: 40, borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)", background: previewBg, display: "flex", overflow: "hidden" }}>
                       <div style={{ flex: 1, background: previewPrimary }} />
                       <div style={{ flex: 1, background: previewBg }} />
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 10, color: isSelected ? "#00f5d4" : "rgba(255,255,255,0.5)", fontFamily: "'Orbitron', monospace", letterSpacing: "0.05em" }}>{THEME_LABELS[t] || t.toUpperCase()}</div>
                      {isSelected && !isApplied && (
                        <button onClick={(e) => { e.stopPropagation(); setDraftTheme(t); }} style={{ marginTop: 8, padding: "6px 10px", width: "100%", background: "#00f5d4", border: "none", color: "#000", fontSize: 9, fontWeight: 900, fontFamily: "'Orbitron', monospace", cursor: "pointer", borderRadius: 4, letterSpacing: "0.1em", boxShadow: "0 0 8px rgba(0,245,212,0.5)" }}>
                          DEPLOY THEME
                        </button>
                      )}
                      {isApplied && (
                        <div style={{ marginTop: 8, fontSize: 9, color: "#00f5d4", fontWeight: 700, fontFamily: "'Orbitron', monospace" }}>✓ ACTIVE</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeSection === "sound" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <div style={{ background: "rgba(255,255,255,0.03)", padding: 20, borderRadius: 12, border: "1px solid rgba(255,255,255,0.05)" }}>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", marginBottom: 16, fontFamily: "'Orbitron', monospace", letterSpacing: "0.1em" }}>MASTER GAIN: {(draftSoundSettings.volume * 100).toFixed(0)}%</div>
                <input type="range" min="0" max="1" step="0.01" value={draftSoundSettings.volume} onChange={(e) => setDraftSoundSettings(p => ({ ...p, volume: parseFloat(e.target.value) }))} style={{ width: "100%", accentColor: "#00cfff" }} />
              </div>
              <ToggleSwitch label="GLOBAL EFFECTS" checked={draftSoundSettings.effectsEnabled} onChange={v => setDraftSoundSettings(p => ({...p, effectsEnabled: v}))} color="#00cfff" />
              <ToggleSwitch label="TRANSMISSION PINGS" checked={draftSoundSettings.messageSound} onChange={v => setDraftSoundSettings(p => ({...p, messageSound: v}))} color="#00cfff" />
              <ToggleSwitch label="HAPTIC CLICKS" checked={draftSoundSettings.clickSound} onChange={v => { setDraftSoundSettings(p => ({...p, clickSound: v})); try { useSettingsStore.getState().updateSetting('sound.clickEnabled', v); } catch (_) {} }} color="#00cfff" />
              <ToggleSwitch label="BACKGROUND AMBIENCE" checked={draftSoundSettings.ambientStorm ?? draftSoundSettings.orbitAmbientEnabled ?? true} onChange={v => { setDraftSoundSettings(p => ({...p, ambientStorm: v, orbitAmbientEnabled: v})); try { useSettingsStore.getState().updateSetting('sound.orbitAmbientEnabled', v); } catch (_) {} }} color="#00cfff" />
            </div>
          )}

          {activeSection === "profile" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <div style={{ background: "rgba(255,255,255,0.03)", padding: 20, borderRadius: 12, border: "1px solid rgba(255,255,255,0.05)" }}>
                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", fontFamily: "'Orbitron', monospace", letterSpacing: "0.05em", display: "block", marginBottom: 12 }}>HANDLE ALIAS</span>
                <input 
                  type="text" 
                  value={draftDisplayName} 
                  onChange={e => setDraftDisplayName(e.target.value)} 
                  placeholder={authUser?.username || "Guest"}
                  style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(0,207,255,0.4)", color: "#00cfff", padding: "12px 16px", borderRadius: 8, fontFamily: "'Rajdhani', monospace", fontSize: 16, outline: "none", boxShadow: "inset 0 0 10px rgba(0,207,255,0.1)" }} 
                />
              </div>

              <div style={{ background: "rgba(255,255,255,0.03)", padding: 20, borderRadius: 12, border: "1px solid rgba(255,255,255,0.05)" }}>
                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", fontFamily: "'Orbitron', monospace", letterSpacing: "0.05em", display: "block", marginBottom: 12 }}>MISSION BIO</span>
                <textarea 
                  value={draftBio} 
                  onChange={e => setDraftBio(e.target.value)} 
                  placeholder="Enter mission status..."
                  style={{ width: "100%", height: 80, background: "rgba(0,0,0,0.4)", border: "1px solid rgba(0,207,255,0.4)", color: "#00cfff", padding: "12px 16px", borderRadius: 8, fontFamily: "'Rajdhani', monospace", fontSize: 15, outline: "none", boxShadow: "inset 0 0 10px rgba(0,207,255,0.1)", resize: "none" }} 
                />
              </div>
              <ToggleSwitch label="BROADCAST PRESENCE" checked={draftShowOnlineStatus} onChange={setDraftShowOnlineStatus} color="#ff2d78" />
            </div>
          )}

          {activeSection === "notifications" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <ToggleSwitch label="DESKTOP OVERLAYS" checked={draftNotifications.desktop} onChange={v => setDraftNotifications(p => ({...p, desktop: v}))} color="#ffe600" />
              <ToggleSwitch label="AUDIO CUES" checked={draftNotifications.sound} onChange={v => setDraftNotifications(p => ({...p, sound: v}))} color="#ffe600" />
              <ToggleSwitch label="EMAIL DIGESTS" checked={draftNotifications.email} onChange={v => setDraftNotifications(p => ({...p, email: v}))} color="#ffe600" />
            </div>
          )}

          {activeSection === "orbit" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <ToggleSwitch label="RENDER RINGS" checked={draftOrbitBehavior.showRings} onChange={v => setDraftOrbitBehavior(p => ({...p, showRings: v}))} color="#9b59b6" />
              <ToggleSwitch label="MOMENTUM PAUSE" checked={draftOrbitBehavior.autoPauseOnHover} onChange={v => setDraftOrbitBehavior(p => ({...p, autoPauseOnHover: v}))} color="#9b59b6" />
              <div style={{ background: "rgba(255,255,255,0.03)", padding: 20, borderRadius: 12, border: "1px solid rgba(255,255,255,0.05)", display: "flex", flexDirection: "column", gap: 12 }}>
                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", fontFamily: "'Orbitron', monospace", letterSpacing: "0.05em" }}>INTERACTION FILTER</span>
                <select value={draftOrbitBehavior.interactionFilter} onChange={(e) => setDraftOrbitBehavior(p => ({...p, interactionFilter: e.target.value}))} style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(155,89,182,0.4)", color: "#9b59b6", padding: "12px 16px", borderRadius: 8, fontFamily: "'Rajdhani', monospace", fontSize: 16, outline: "none" }}>
                  <option value="all">ALL NODES</option>
                  <option value="active">ACTIVE NODES ONLY</option>
                  <option value="mutual">MUTUAL ORBITS ONLY</option>
                </select>
              </div>
              <div style={{ background: "rgba(255,255,255,0.03)", padding: 20, borderRadius: 12, border: "1px solid rgba(255,255,255,0.05)", display: "flex", flexDirection: "column", gap: 12 }}>
                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", fontFamily: "'Orbitron', monospace", letterSpacing: "0.05em" }}>KINEMATIC THEME</span>
                <select value={draftOrbitBehavior.theme} onChange={(e) => setDraftOrbitBehavior(p => ({...p, theme: e.target.value}))} style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(155,89,182,0.4)", color: "#9b59b6", padding: "12px 16px", borderRadius: 8, fontFamily: "'Rajdhani', monospace", fontSize: 16, outline: "none" }}>
                  <option value="nebula">NEBULA</option>
                  <option value="aurora">AURORA</option>
                  <option value="cosmic">COSMIC</option>
                </select>
              </div>
            </div>
          )}

        </NeonCard>
      </div>
    </OrbitGrind>
  );
}

export function GamerProfile() {
  const authUser = useAuthStore(s => s.authUser);
  return (
    <OrbitGrind>
      <div style={{ display: "flex", gap: 20, height: "100%" }}>
        <NeonCard color="#ff2d78" style={{ width: 300, padding: 24, display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
          <div style={{ width: 120, height: 120, borderRadius: "50%", border: "2px solid #ff2d78", overflow: "hidden", boxShadow: "0 0 20px rgba(255,45,120,0.5)" }}>
            <img src={authUser?.profilePic || "https://api.dicebear.com/7.x/avataaars/svg?seed=Gamer"} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="avatar" />
          </div>
          <div style={{ textAlign: "center" }}>
            <h2 style={{ fontSize: 20, fontWeight: 900, color: "#fff", fontFamily: "'Orbitron',monospace", letterSpacing: "0.1em" }}>{authUser?.username || "GUEST_USER"}</h2>
            <div style={{ fontSize: 12, color: "#ff2d78", fontFamily: "'Orbitron',monospace", marginTop: 4 }}>RANK: RADIANT</div>
          </div>
          <div style={{ width: "100%", height: 1, background: "rgba(255,45,120,0.3)" }} />
          <div style={{ width: "100%", display: "flex", justifyContent: "space-between", fontSize: 12, fontFamily: "'Rajdhani',monospace", color: "rgba(255,255,255,0.7)" }}>
            <span>K/D RATIO</span><span style={{ color: "#00f5d4", fontWeight: "bold" }}>4.2</span >
          </div>
          <div style={{ width: "100%", display: "flex", justifyContent: "space-between", fontSize: 12, fontFamily: "'Rajdhani',monospace", color: "rgba(255,255,255,0.7)" }}>
            <span>WIN RATE</span><span style={{ color: "#ffe600", fontWeight: "bold" }}>68%</span>
          </div>
        </NeonCard>
        
        <NeonCard color="#00f5d4" style={{ flex: 1, padding: 24 }}>
          <h2 style={{ fontSize: 24, fontWeight: 900, color: "#00f5d4", fontFamily: "'Orbitron',monospace", marginBottom: 20, textShadow: "0 0 10px #00f5d4", letterSpacing: "0.1em" }}>PLAYER RECORD</h2>
          <div style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", fontFamily: "'Rajdhani',monospace", lineHeight: 1.6 }}>
            {authUser?.bio || "No mission logs recorded."}
          </div>
        </NeonCard>
      </div>
    </OrbitGrind>
  );
}

export function GamerSpotify() {
  const { spotifyLinked, currentTrack, isPlaying, pausePlayback, playTrack } = useSpotifyStore();
  const [playing, setPlaying] = useState(isPlaying || true);
  
  useEffect(() => {
    setPlaying(isPlaying);
  }, [isPlaying]);

  return (
    <OrbitGrind>
      <NeonCard color="#1DB954" style={{ flex: 1, padding: 40, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 30 }}>
        <h2 style={{ fontSize: 32, fontWeight: 900, color: "#1DB954", fontFamily: "'Orbitron',monospace", textShadow: "0 0 20px rgba(29,185,84,0.5)", letterSpacing: "0.15em" }}>SPOTIFY SYNC</h2>
        
        {!spotifyLinked ? (
          <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
            <div style={{ fontSize: 16, color: "rgba(255,255,255,0.7)", fontFamily: "'Rajdhani',monospace", maxWidth: 400, lineHeight: 1.5 }}>
              Link your Spotify account to synchronize audio playback across your squad. Drop into the same frequency.
            </div>
            <button onClick={() => window.location.href = `${API_URL}/api/spotify/login`} className="shard-btn" style={{ padding: "12px 24px", borderRadius: 8, background: "#1DB954", color: "#000", border: "none", fontSize: 16, fontWeight: 900, fontFamily: "'Orbitron',monospace", letterSpacing: "0.1em", cursor: "pointer", boxShadow: "0 0 20px rgba(29,185,84,0.6)" }}>
              INITIALIZE CONNECTION
            </button>
          </div>
        ) : (
          <>
            <div style={{ width: 240, height: 240, borderRadius: 16, border: "2px solid #1DB954", overflow: "hidden", boxShadow: "0 0 40px rgba(29,185,84,0.3)", position: "relative" }}>
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg,rgba(29,185,84,0.2),transparent)" }} />
              {currentTrack ? (
                <img src={currentTrack.imageUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="Album Art" />
              ) : (
                <svg width="240" height="240" viewBox="0 0 52 52"><rect width="52" height="52" fill="#1a1a1a" /><rect x="0" y="8" width="52" height="16" fill="rgba(29,185,84,0.3)" /><rect x="0" y="30" width="52" height="12" fill="rgba(29,185,84,0.2)" /><line x1="13" y1="0" x2="13" y2="52" stroke="rgba(255,255,255,0.1)" strokeWidth="1" /><line x1="30" y1="0" x2="30" y2="52" stroke="rgba(255,255,255,0.05)" strokeWidth="1" /></svg>
              )}
            </div>
            
            <div style={{ textAlign: "center", minHeight: 60 }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#fff", textShadow: "0 0 10px rgba(255,255,255,0.5)", fontFamily: "'Rajdhani',monospace" }}>
                {currentTrack ? currentTrack.name : "Awaiting Frequency..."}
              </div>
              <div style={{ fontSize: 16, color: "rgba(29,185,84,0.8)", marginTop: 4, fontFamily: "'Rajdhani',monospace" }}>
                {currentTrack ? currentTrack.artist : "Unknown Signal"}
              </div>
            </div>
            
            <div style={{ width: "100%", maxWidth: 400, marginTop: 10, height: 60 }}>
              <AudioViz playing={playing && !!currentTrack} />
            </div>
            
            <div style={{ display: "flex", alignItems: "center", gap: 30, marginTop: 10 }}>
              <button onClick={() => {}} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.6)", fontSize: 24, transition: "color 0.2s" }} onMouseEnter={e => e.currentTarget.style.color="#fff"} onMouseLeave={e => e.currentTarget.style.color="rgba(255,255,255,0.6)"}>⏮</button>
              <button 
                onClick={() => playing ? pausePlayback() : playTrack()} 
                style={{ width: 64, height: 64, borderRadius: "50%", background: "#1DB954", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 24, boxShadow: "0 0 20px rgba(29,185,84,0.6)", transition: "transform 0.1s" }}
                onMouseEnter={e => e.currentTarget.style.transform = "scale(1.1)"} onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>
                {playing ? "⏸" : "▶"}
              </button>
              <button onClick={() => {}} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.6)", fontSize: 24, transition: "color 0.2s" }} onMouseEnter={e => e.currentTarget.style.color="#fff"} onMouseLeave={e => e.currentTarget.style.color="rgba(255,255,255,0.6)"}>⏭</button>
            </div>
          </>
        )}
      </NeonCard>
    </OrbitGrind>
  );
}