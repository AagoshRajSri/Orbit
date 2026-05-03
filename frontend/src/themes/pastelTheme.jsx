import { useState, useEffect, useRef, useMemo, memo } from "react";
import { THEMES, THEME_LABELS } from "../constants";
import UniversalChatContainer from "../components/UniversalChatContainer";
import { useNavigate } from "react-router-dom";
import { useNexusStore } from "../store/useNexusStore";
import { useChatStore } from "../store/useChatStore";
import { useSpotifyStore } from "../store/useSpotifyStore";
import { useAuthStore } from "../store/useAuthStore";
import NexusActionOverlay from "../components/NexusActionOverlay";
import { useSoundManager } from "../hooks/useSoundManager";
import AnimLayer from "../components/AnimLayer";
import AnimationSettingsPanel from "../components/AnimationSettingsPanel";
import { useSettingsStore } from "../store/useSettingsStore";
import { spotifyService } from "../services/spotifyService";
import { API_URL } from "../config";
import { PixelAvatarBadge } from "../components/PixelAvatar/PixelAvatarBadge.jsx";

/* ── floating glitter/hearts/butterflies scattered everywhere ── */
const FLOATIES = [
  { x: 245, y: 62, char: "✦", size: 9, color: "#f8c8e8", opacity: 0.75, dur: 2.8 },
  { x: 770, y: 58, char: "✦", size: 8, color: "#e8c8f8", opacity: 0.65, dur: 3.1 },
  { x: 958, y: 75, char: "✦", size: 10, color: "#ffd6f0", opacity: 0.7, dur: 2.5 },
  { x: 760, y: 85, char: "✺", size: 7, color: "#ffb8d8", opacity: 0.55, dur: 3.4 },
  { x: 858, y: 110, char: "✦", size: 7, color: "#e0c8ff", opacity: 0.55, dur: 2.9 },
  { x: 930, y: 130, char: "☽", size: 18, color: "#f0d8ff", opacity: 0.6, dur: 4.0 },
  { x: 950, y: 170, char: "✦", size: 7, color: "#c8f0e0", opacity: 0.5, dur: 3.2 },
  { x: 760, y: 160, char: "✦", size: 6, color: "#ffd8ee", opacity: 0.45, dur: 2.7 },
  { x: 254, y: 160, char: "✦", size: 8, color: "#c8f0d8", opacity: 0.6, dur: 3.0 },
  { x: 262, y: 310, char: "✦", size: 7, color: "#d8f0c8", opacity: 0.5, dur: 3.3 },
  { x: 966, y: 320, char: "✦", size: 7, color: "#d8c8f8", opacity: 0.5, dur: 2.6 },
  { x: 972, y: 460, char: "✦", size: 22, color: "#ffe8f0", opacity: 0.8, dur: 3.8 },
  { x: 250, y: 440, char: "✦", size: 7, color: "#c8f0e8", opacity: 0.45, dur: 2.9 },
  /* bonus cute extras */
  { x: 310, y: 95, char: "♡", size: 11, color: "#ffaad0", opacity: 0.55, dur: 3.5 },
  { x: 690, y: 200, char: "♡", size: 8, color: "#ffb8d8", opacity: 0.45, dur: 4.2 },
  { x: 820, y: 400, char: "♡", size: 10, color: "#ffaad0", opacity: 0.4, dur: 3.7 },
  { x: 400, y: 50, char: "✿", size: 12, color: "#ffd0e8", opacity: 0.5, dur: 3.9 },
  { x: 600, y: 430, char: "✿", size: 9, color: "#e8d0ff", opacity: 0.45, dur: 3.1 },
  { x: 880, y: 55, char: "✿", size: 8, color: "#ffe0f0", opacity: 0.4, dur: 2.8 },
  { x: 500, y: 240, char: "⋆", size: 14, color: "#ffc8e8", opacity: 0.35, dur: 5.0 },
  { x: 150, y: 200, char: "⋆", size: 10, color: "#d8c8ff", opacity: 0.35, dur: 4.5 },
];

/* ── tiny sparkle burst that fires on click ── */
const SparkleClick = memo(() => {
  const [sparks, setSparks] = useState([]);
  useEffect(() => {
    const handler = (e) => {
      const id = Date.now();
      const items = Array.from({ length: 7 }, (_, i) => ({
        id: id + i,
        x: e.clientX, y: e.clientY,
        dx: (Math.random() - 0.5) * 70,
        dy: (Math.random() - 1.2) * 70,
        char: ["✦", "♡", "✿", "⋆", "★"][Math.floor(Math.random() * 5)],
        color: ["#ff8ec8", "#cc88ff", "#88ccff", "#ffcc88", "#88ffcc"][Math.floor(Math.random() * 5)],
      }));
      setSparks(p => [...p, ...items]);
      setTimeout(() => setSparks(p => p.filter(s => !items.find(i => i.id === s.id))), 800);
    };
    window.addEventListener("click", handler);
    return () => window.removeEventListener("click", handler);
  }, []);
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 9999 }}>
      {sparks.map(s => (
        <span key={s.id} style={{
          position: "absolute", left: s.x, top: s.y,
          fontSize: 12, color: s.color, lineHeight: 1,
          animation: "sparkFly 0.75s ease-out forwards",
          "--dx": s.dx + "px", "--dy": s.dy + "px",
          transformOrigin: "center",
        }}>{s.char}</span>
      ))}
    </div>
  );
});

const BgClouds = memo(() => {
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
      {/* Grain texture overlay */}
      <div style={{ position: "absolute", inset: 0, backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.035'/%3E%3C/svg%3E\")", opacity: 0.6, zIndex: 1 }} />
      {/* Morning light from top-left */}
      <div style={{ position: "absolute", left: "-10%", top: "-8%", width: 500, height: 400, background: "radial-gradient(ellipse, rgba(242,196,208,0.55) 0%, transparent 68%)", filter: "blur(40px)" }} />
      {/* Faded lilac mid-right */}
      <div style={{ position: "absolute", right: "-5%", top: "15%", width: 380, height: 340, background: "radial-gradient(ellipse, rgba(200,169,212,0.38) 0%, transparent 70%)", filter: "blur(34px)" }} />
      {/* Sage mint counterpoint — the human choice */}
      <div style={{ position: "absolute", right: "8%", bottom: "5%", width: 300, height: 240, background: "radial-gradient(ellipse, rgba(168,213,186,0.28) 0%, transparent 70%)", filter: "blur(30px)" }} />
      {/* Warm cream centre */}
      <div style={{ position: "absolute", left: "30%", top: "25%", width: 420, height: 320, background: "radial-gradient(ellipse, rgba(232,213,192,0.22) 0%, transparent 70%)", filter: "blur(36px)" }} />
      {/* Dusty rose lower-left */}
      <div style={{ position: "absolute", left: "-3%", bottom: "8%", width: 360, height: 260, background: "radial-gradient(ellipse, rgba(242,196,208,0.4) 0%, transparent 70%)", filter: "blur(32px)" }} />
    </div>
  );
});

const Floaties = memo(() => {
  return (
    <AnimLayer category="atmospheric">
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        {FLOATIES.map((s, i) => (
          <span key={i} style={{
            position: "absolute", left: s.x, top: s.y,
            fontSize: s.size, color: s.color, opacity: s.opacity, lineHeight: 1,
            animation: `starPulse ${s.dur}s ease-in-out infinite`,
            animationDelay: `${i * 0.28}s`,
            userSelect: "none",
          }}>{s.char}</span>
        ))}
      </div>
    </AnimLayer>
  );
});

/* ── ribbon badge in top-right of a card ── */
const CuteBadge = memo(({ label, color }) => {
  return (
    <div style={{
      position: "absolute", top: 10, right: 10,
      background: color,
      borderRadius: 20, padding: "2px 8px",
      fontSize: 8.5, fontWeight: 800, letterSpacing: "0.1em",
      color: "white", textTransform: "uppercase",
      boxShadow: "0 1px 6px rgba(0,0,0,0.08)",
      display: "flex", alignItems: "center", gap: 3,
    }}>✨ {label}</div>
  );
});

const BarbieTrainAnimation = memo(() => {
  return (
    <AnimLayer category="atmospheric">
      <svg width="100%" height="100%" viewBox="0 0 8000 220" preserveAspectRatio="xMinYMid slice" role="img" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <style>
          {`
            .track { stroke: #C0A0C8; stroke-width: 3; fill: none; }
            .tie { stroke: #9B59B0; stroke-width: 2.5; fill: none; stroke-linecap: round; }

            @keyframes moveTrain {
              0%   { transform: translateX(-800px); }
              66.66% { transform: translateX(8000px); }
              100% { transform: translateX(8000px); }
            }
            @keyframes smoke1 {
              0%   { opacity: 0.9; transform: translate(0px, 0px) scale(0.5); }
              100% { opacity: 0; transform: translate(-30px, -60px) scale(2); }
            }
            @keyframes smoke2 {
              0%   { opacity: 0.8; transform: translate(0px, 0px) scale(0.4); }
              100% { opacity: 0; transform: translate(-15px, -70px) scale(1.8); }
            }
            @keyframes smoke3 {
              0%   { opacity: 0.7; transform: translate(0px, 0px) scale(0.3); }
              100% { opacity: 0; transform: translate(-40px, -55px) scale(1.5); }
            }
            @keyframes wheelSpin {
              0%   { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            .train-group {
              animation: moveTrain 25s linear infinite;
            }
            .smoke-puff1 { animation: smoke1 1s ease-out infinite; }
            .smoke-puff2 { animation: smoke2 1s ease-out 0.3s infinite; }
            .smoke-puff3 { animation: smoke3 1s ease-out 0.6s infinite; }
            .smoke-puff4 { animation: smoke1 1s ease-out 0.9s infinite; }
            .wheel { animation: wheelSpin 0.4s linear infinite; }

            @keyframes sparkle {
              0%, 100% { opacity: 1; transform: scale(1); }
              50% { opacity: 0.3; transform: scale(0.5); }
            }
            .sparkle1 { animation: sparkle 0.8s ease-in-out infinite; }
            .sparkle2 { animation: sparkle 0.8s ease-in-out 0.3s infinite; }
            .sparkle3 { animation: sparkle 0.8s ease-in-out 0.6s infinite; }
          `}
        </style>
        <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFE8F5" />
          <stop offset="100%" stopColor="#FFF0FB" />
        </linearGradient>
        <linearGradient id="engineGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FF6EB4" />
          <stop offset="100%" stopColor="#E0399A" />
        </linearGradient>
        <linearGradient id="carGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FF9ED4" />
          <stop offset="100%" stopColor="#FF69B4" />
        </linearGradient>
        <linearGradient id="roofGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FF1493" />
          <stop offset="100%" stopColor="#C71585" />
        </linearGradient>
      </defs>
      <line x1="0" y1="162" x2="8000" y2="162" className="track" />
      <line x1="0" y1="172" x2="8000" y2="172" className="track" />

      <pattern id="tiesPattern" x="0" y="0" width="34" height="220" patternUnits="userSpaceOnUse">
        <line x1="20" y1="162" x2="20" y2="172" className="tie" />
      </pattern>
      <rect x="0" y="162" width="8000" height="10" fill="url(#tiesPattern)" />

      <g className="train-group">
        {/* Blue Smoke from chimney */}
        <circle className="smoke-puff1" cx="38" cy="68" r="12" fill="#B3E5FC" opacity="0.85" />
        <circle className="smoke-puff2" cx="38" cy="68" r="10" fill="#81D4FA" opacity="0.75" />
        <circle className="smoke-puff3" cx="38" cy="68" r="8" fill="#4FC3F7" opacity="0.65" />
        <circle className="smoke-puff4" cx="38" cy="68" r="6" fill="#29B6F6" opacity="0.55" />

        <rect x="20" y="95" width="55" height="60" rx="6" fill="url(#engineGrad)" stroke="#C71585" strokeWidth="1.5" />
        <rect x="20" y="85" width="55" height="18" rx="4" fill="url(#roofGrad)" stroke="#A0006E" strokeWidth="1" />

        <rect x="30" y="72" width="12" height="24" rx="3" fill="#FF69B4" stroke="#C71585" strokeWidth="1" />
        <rect x="34" y="68" width="6" height="6" rx="2" fill="#FF1493" />

        <rect x="28" y="105" width="18" height="14" rx="3" fill="#FFF0FB" stroke="#FF69B4" strokeWidth="1" />
        <rect x="50" y="105" width="16" height="14" rx="3" fill="#FFF0FB" stroke="#FF69B4" strokeWidth="1" />
        <text x="58" y="116" fontSize="10" fill="#FF1493" textAnchor="middle" fontFamily="sans-serif" fontWeight="700">♡</text>

        <rect x="55" y="125" width="15" height="18" rx="2" fill="#FF69B4" stroke="#C71585" strokeWidth="1" />
        <text x="62" y="138" fontSize="10" fill="#FFF0FB" textAnchor="middle" fontFamily="sans-serif" fontWeight="700">B</text>

        <g className="wheel" style={{ transformOrigin: "30px 153px" }}>
          <circle cx="30" cy="153" r="10" fill="#FF69B4" stroke="#C71585" strokeWidth="1.5" />
          <line x1="30" y1="143" x2="30" y2="163" stroke="#C71585" strokeWidth="1.5" />
          <line x1="20" y1="153" x2="40" y2="153" stroke="#C71585" strokeWidth="1.5" />
          <circle cx="30" cy="153" r="3" fill="#FFF0FB" />
        </g>
        <g className="wheel" style={{ transformOrigin: "60px 153px" }}>
          <circle cx="60" cy="153" r="10" fill="#FF69B4" stroke="#C71585" strokeWidth="1.5" />
          <line x1="60" y1="143" x2="60" y2="163" stroke="#C71585" strokeWidth="1.5" />
          <line x1="50" y1="153" x2="70" y2="153" stroke="#C71585" strokeWidth="1.5" />
          <circle cx="60" cy="153" r="3" fill="#FFF0FB" />
        </g>

        {/* Coupler: Engine → Car1 */}
        <line x1="75" y1="145" x2="83" y2="145" stroke="#E05090" strokeWidth="2.5" strokeLinecap="round" />

        {/* Car 1 (XOXO) x=83..133 */}
        <rect x="83" y="100" width="50" height="55" rx="5" fill="url(#carGrad)" stroke="#E05090" strokeWidth="1.5" />
        <rect x="83" y="90" width="50" height="17" rx="3" fill="#FF1493" stroke="#C71585" strokeWidth="1" />
        <rect x="87" y="107" width="16" height="18" rx="3" fill="#FFF0FB" stroke="#FF69B4" strokeWidth="1" />
        <text x="95" y="119" fontSize="9" fill="#FF69B4" textAnchor="middle" fontFamily="sans-serif">♡</text>
        <rect x="110" y="107" width="16" height="18" rx="3" fill="#FFF0FB" stroke="#FF69B4" strokeWidth="1" />
        <text x="118" y="119" fontSize="8" fill="#FF69B4" textAnchor="middle" fontFamily="sans-serif">✿</text>
        <text x="108" y="136" fontSize="9" fill="#FFF0FB" textAnchor="middle" fontFamily="sans-serif" fontWeight="700">XOXO</text>
        <g className="wheel" style={{ transformOrigin: "93px 153px" }}>
          <circle cx="93" cy="153" r="9" fill="#FF69B4" stroke="#E05090" strokeWidth="1.5" />
          <line x1="93" y1="144" x2="93" y2="162" stroke="#E05090" strokeWidth="1.5" />
          <line x1="84" y1="153" x2="102" y2="153" stroke="#E05090" strokeWidth="1.5" />
          <circle cx="93" cy="153" r="2.5" fill="#FFF0FB" />
        </g>
        <g className="wheel" style={{ transformOrigin: "120px 153px" }}>
          <circle cx="120" cy="153" r="9" fill="#FF69B4" stroke="#E05090" strokeWidth="1.5" />
          <line x1="120" y1="144" x2="120" y2="162" stroke="#E05090" strokeWidth="1.5" />
          <line x1="111" y1="153" x2="129" y2="153" stroke="#E05090" strokeWidth="1.5" />
          <circle cx="120" cy="153" r="2.5" fill="#FFF0FB" />
        </g>

        {/* Coupler: Car1 → Car2 */}
        <line x1="133" y1="145" x2="141" y2="145" stroke="#E05090" strokeWidth="2.5" strokeLinecap="round" />

        {/* Car 2 (GLAM) x=141..191 */}
        <rect x="141" y="100" width="50" height="55" rx="5" fill="url(#carGrad)" stroke="#E05090" strokeWidth="1.5" />
        <rect x="141" y="90" width="50" height="17" rx="3" fill="#FF69B4" stroke="#E05090" strokeWidth="1" />
        <rect x="145" y="107" width="16" height="18" rx="3" fill="#FFF0FB" stroke="#FF69B4" strokeWidth="1" />
        <text x="153" y="119" fontSize="8" fill="#FF1493" textAnchor="middle" fontFamily="sans-serif">★</text>
        <rect x="168" y="107" width="16" height="18" rx="3" fill="#FFF0FB" stroke="#FF69B4" strokeWidth="1" />
        <text x="176" y="119" fontSize="9" fill="#FF69B4" textAnchor="middle" fontFamily="sans-serif">♡</text>
        <text x="166" y="136" fontSize="9" fill="#FFF0FB" textAnchor="middle" fontFamily="sans-serif" fontWeight="700">GLAM</text>
        <g className="wheel" style={{ transformOrigin: "151px 153px" }}>
          <circle cx="151" cy="153" r="9" fill="#FF69B4" stroke="#E05090" strokeWidth="1.5" />
          <line x1="151" y1="144" x2="151" y2="162" stroke="#E05090" strokeWidth="1.5" />
          <line x1="142" y1="153" x2="160" y2="153" stroke="#E05090" strokeWidth="1.5" />
          <circle cx="151" cy="153" r="2.5" fill="#FFF0FB" />
        </g>
        <g className="wheel" style={{ transformOrigin: "178px 153px" }}>
          <circle cx="178" cy="153" r="9" fill="#FF69B4" stroke="#E05090" strokeWidth="1.5" />
          <line x1="178" y1="144" x2="178" y2="162" stroke="#E05090" strokeWidth="1.5" />
          <line x1="169" y1="153" x2="187" y2="153" stroke="#E05090" strokeWidth="1.5" />
          <circle cx="178" cy="153" r="2.5" fill="#FFF0FB" />
        </g>

        {/* Coupler: Car2 → Car3 */}
        <line x1="191" y1="145" x2="199" y2="145" stroke="#E05090" strokeWidth="2.5" strokeLinecap="round" />

        {/* Car 3 (LOVE) x=199..249 */}
        <rect x="199" y="100" width="50" height="55" rx="5" fill="url(#carGrad)" stroke="#E05090" strokeWidth="1.5" />
        <rect x="199" y="90" width="50" height="17" rx="3" fill="#FF1493" stroke="#C71585" strokeWidth="1" />
        <rect x="203" y="107" width="16" height="18" rx="3" fill="#FFF0FB" stroke="#FF69B4" strokeWidth="1" />
        <text x="211" y="119" fontSize="9" fill="#FF69B4" textAnchor="middle" fontFamily="sans-serif">♡</text>
        <rect x="226" y="107" width="16" height="18" rx="3" fill="#FFF0FB" stroke="#FF69B4" strokeWidth="1" />
        <text x="234" y="119" fontSize="8" fill="#FF69B4" textAnchor="middle" fontFamily="sans-serif">✿</text>
        <text x="224" y="136" fontSize="9" fill="#FFF0FB" textAnchor="middle" fontFamily="sans-serif" fontWeight="700">LOVE</text>
        <g className="wheel" style={{ transformOrigin: "209px 153px" }}>
          <circle cx="209" cy="153" r="9" fill="#FF69B4" stroke="#E05090" strokeWidth="1.5" />
          <line x1="209" y1="144" x2="209" y2="162" stroke="#E05090" strokeWidth="1.5" />
          <line x1="200" y1="153" x2="218" y2="153" stroke="#E05090" strokeWidth="1.5" />
          <circle cx="209" cy="153" r="2.5" fill="#FFF0FB" />
        </g>
        <g className="wheel" style={{ transformOrigin: "236px 153px" }}>
          <circle cx="236" cy="153" r="9" fill="#FF69B4" stroke="#E05090" strokeWidth="1.5" />
          <line x1="236" y1="144" x2="236" y2="162" stroke="#E05090" strokeWidth="1.5" />
          <line x1="227" y1="153" x2="245" y2="153" stroke="#E05090" strokeWidth="1.5" />
          <circle cx="236" cy="153" r="2.5" fill="#FFF0FB" />
        </g>

        {/* Coupler: Car3 → Car4 */}
        <line x1="249" y1="145" x2="257" y2="145" stroke="#E05090" strokeWidth="2.5" strokeLinecap="round" />

        {/* Car 4 (CUTE) x=257..307 */}
        <rect x="257" y="100" width="50" height="55" rx="5" fill="url(#carGrad)" stroke="#E05090" strokeWidth="1.5" />
        <rect x="257" y="90" width="50" height="17" rx="3" fill="#FF69B4" stroke="#E05090" strokeWidth="1" />
        <rect x="261" y="107" width="16" height="18" rx="3" fill="#FFF0FB" stroke="#FF69B4" strokeWidth="1" />
        <text x="269" y="119" fontSize="8" fill="#FF1493" textAnchor="middle" fontFamily="sans-serif">★</text>
        <rect x="284" y="107" width="16" height="18" rx="3" fill="#FFF0FB" stroke="#FF69B4" strokeWidth="1" />
        <text x="292" y="119" fontSize="9" fill="#FF69B4" textAnchor="middle" fontFamily="sans-serif">♡</text>
        <text x="282" y="136" fontSize="9" fill="#FFF0FB" textAnchor="middle" fontFamily="sans-serif" fontWeight="700">CUTE</text>
        <g className="wheel" style={{ transformOrigin: "267px 153px" }}>
          <circle cx="267" cy="153" r="9" fill="#FF69B4" stroke="#E05090" strokeWidth="1.5" />
          <line x1="267" y1="144" x2="267" y2="162" stroke="#E05090" strokeWidth="1.5" />
          <line x1="258" y1="153" x2="276" y2="153" stroke="#E05090" strokeWidth="1.5" />
          <circle cx="267" cy="153" r="2.5" fill="#FFF0FB" />
        </g>
        <g className="wheel" style={{ transformOrigin: "294px 153px" }}>
          <circle cx="294" cy="153" r="9" fill="#FF69B4" stroke="#E05090" strokeWidth="1.5" />
          <line x1="294" y1="144" x2="294" y2="162" stroke="#E05090" strokeWidth="1.5" />
          <line x1="285" y1="153" x2="303" y2="153" stroke="#E05090" strokeWidth="1.5" />
          <circle cx="294" cy="153" r="2.5" fill="#FFF0FB" />
        </g>

        {/* Coupler: Car4 → Car5 */}
        <line x1="307" y1="145" x2="315" y2="145" stroke="#E05090" strokeWidth="2.5" strokeLinecap="round" />

        {/* Car 5 (CHILL) x=315..365 */}
        <rect x="315" y="100" width="50" height="55" rx="5" fill="url(#carGrad)" stroke="#E05090" strokeWidth="1.5" />
        <rect x="315" y="90" width="50" height="17" rx="3" fill="#FF1493" stroke="#C71585" strokeWidth="1" />
        <rect x="319" y="107" width="16" height="18" rx="3" fill="#FFF0FB" stroke="#FF69B4" strokeWidth="1" />
        <text x="327" y="119" fontSize="9" fill="#FF69B4" textAnchor="middle" fontFamily="sans-serif">♡</text>
        <rect x="342" y="107" width="16" height="18" rx="3" fill="#FFF0FB" stroke="#FF69B4" strokeWidth="1" />
        <text x="350" y="119" fontSize="8" fill="#FF69B4" textAnchor="middle" fontFamily="sans-serif">✿</text>
        <text x="340" y="136" fontSize="9" fill="#FFF0FB" textAnchor="middle" fontFamily="sans-serif" fontWeight="700">CHILL</text>
        <g className="wheel" style={{ transformOrigin: "325px 153px" }}>
          <circle cx="325" cy="153" r="9" fill="#FF69B4" stroke="#E05090" strokeWidth="1.5" />
          <line x1="325" y1="144" x2="325" y2="162" stroke="#E05090" strokeWidth="1.5" />
          <line x1="316" y1="153" x2="334" y2="153" stroke="#E05090" strokeWidth="1.5" />
          <circle cx="325" cy="153" r="2.5" fill="#FFF0FB" />
        </g>
        <g className="wheel" style={{ transformOrigin: "352px 153px" }}>
          <circle cx="352" cy="153" r="9" fill="#FF69B4" stroke="#E05090" strokeWidth="1.5" />
          <line x1="352" y1="144" x2="352" y2="162" stroke="#E05090" strokeWidth="1.5" />
          <line x1="343" y1="153" x2="361" y2="153" stroke="#E05090" strokeWidth="1.5" />
          <circle cx="352" cy="153" r="2.5" fill="#FFF0FB" />
        </g>

        {/* Coupler: Car5 → Car6 */}
        <line x1="365" y1="145" x2="373" y2="145" stroke="#E05090" strokeWidth="2.5" strokeLinecap="round" />

        {/* Car 6 (STAR) x=373..423 */}
        <rect x="373" y="100" width="50" height="55" rx="5" fill="url(#carGrad)" stroke="#E05090" strokeWidth="1.5" />
        <rect x="373" y="90" width="50" height="17" rx="3" fill="#FF1493" stroke="#C71585" strokeWidth="1" />
        <rect x="377" y="107" width="16" height="18" rx="3" fill="#FFF0FB" stroke="#FF69B4" strokeWidth="1" />
        <text x="385" y="119" fontSize="9" fill="#FF69B4" textAnchor="middle" fontFamily="sans-serif">★</text>
        <rect x="400" y="107" width="16" height="18" rx="3" fill="#FFF0FB" stroke="#FF69B4" strokeWidth="1" />
        <text x="408" y="119" fontSize="8" fill="#FF69B4" textAnchor="middle" fontFamily="sans-serif">♡</text>
        <text x="398" y="136" fontSize="9" fill="#FFF0FB" textAnchor="middle" fontFamily="sans-serif" fontWeight="700">STAR</text>
        <g className="wheel" style={{ transformOrigin: "383px 153px" }}>
          <circle cx="383" cy="153" r="9" fill="#FF69B4" stroke="#E05090" strokeWidth="1.5" />
          <line x1="383" y1="144" x2="383" y2="162" stroke="#E05090" strokeWidth="1.5" />
          <line x1="374" y1="153" x2="392" y2="153" stroke="#E05090" strokeWidth="1.5" />
          <circle cx="383" cy="153" r="2.5" fill="#FFF0FB" />
        </g>
        <g className="wheel" style={{ transformOrigin: "410px 153px" }}>
          <circle cx="410" cy="153" r="9" fill="#FF69B4" stroke="#E05090" strokeWidth="1.5" />
          <line x1="410" y1="144" x2="410" y2="162" stroke="#E05090" strokeWidth="1.5" />
          <line x1="401" y1="153" x2="419" y2="153" stroke="#E05090" strokeWidth="1.5" />
          <circle cx="410" cy="153" r="2.5" fill="#FFF0FB" />
        </g>

        {/* Coupler: Car6 → Car7 */}
        <line x1="423" y1="145" x2="431" y2="145" stroke="#E05090" strokeWidth="2.5" strokeLinecap="round" />

        {/* Car 7 (PINK) x=431..481 */}
        <rect x="431" y="100" width="50" height="55" rx="5" fill="url(#carGrad)" stroke="#E05090" strokeWidth="1.5" />
        <rect x="431" y="90" width="50" height="17" rx="3" fill="#FF69B4" stroke="#E05090" strokeWidth="1" />
        <rect x="435" y="107" width="16" height="18" rx="3" fill="#FFF0FB" stroke="#FF69B4" strokeWidth="1" />
        <text x="443" y="119" fontSize="9" fill="#FF1493" textAnchor="middle" fontFamily="sans-serif">♡</text>
        <rect x="458" y="107" width="16" height="18" rx="3" fill="#FFF0FB" stroke="#FF69B4" strokeWidth="1" />
        <text x="466" y="119" fontSize="8" fill="#FF69B4" textAnchor="middle" fontFamily="sans-serif">✿</text>
        <text x="456" y="136" fontSize="9" fill="#FFF0FB" textAnchor="middle" fontFamily="sans-serif" fontWeight="700">PINK</text>
        <g className="wheel" style={{ transformOrigin: "441px 153px" }}>
          <circle cx="441" cy="153" r="9" fill="#FF69B4" stroke="#E05090" strokeWidth="1.5" />
          <line x1="441" y1="144" x2="441" y2="162" stroke="#E05090" strokeWidth="1.5" />
          <line x1="432" y1="153" x2="450" y2="153" stroke="#E05090" strokeWidth="1.5" />
          <circle cx="441" cy="153" r="2.5" fill="#FFF0FB" />
        </g>
        <g className="wheel" style={{ transformOrigin: "468px 153px" }}>
          <circle cx="468" cy="153" r="9" fill="#FF69B4" stroke="#E05090" strokeWidth="1.5" />
          <line x1="468" y1="144" x2="468" y2="162" stroke="#E05090" strokeWidth="1.5" />
          <line x1="459" y1="153" x2="477" y2="153" stroke="#E05090" strokeWidth="1.5" />
          <circle cx="468" cy="153" r="2.5" fill="#FFF0FB" />
        </g>

        {/* Coupler: Car7 → Car8 */}
        <line x1="481" y1="145" x2="489" y2="145" stroke="#E05090" strokeWidth="2.5" strokeLinecap="round" />

        {/* Car 8 (DREAM) x=489..539 */}
        <rect x="489" y="100" width="50" height="55" rx="5" fill="url(#carGrad)" stroke="#E05090" strokeWidth="1.5" />
        <rect x="489" y="90" width="50" height="17" rx="3" fill="#FF1493" stroke="#C71585" strokeWidth="1" />
        <rect x="493" y="107" width="16" height="18" rx="3" fill="#FFF0FB" stroke="#FF69B4" strokeWidth="1" />
        <text x="501" y="119" fontSize="8" fill="#FF1493" textAnchor="middle" fontFamily="sans-serif">★</text>
        <rect x="516" y="107" width="16" height="18" rx="3" fill="#FFF0FB" stroke="#FF69B4" strokeWidth="1" />
        <text x="524" y="119" fontSize="9" fill="#FF69B4" textAnchor="middle" fontFamily="sans-serif">♡</text>
        <text x="514" y="136" fontSize="8" fill="#FFF0FB" textAnchor="middle" fontFamily="sans-serif" fontWeight="700">DREAM</text>
        <g className="wheel" style={{ transformOrigin: "499px 153px" }}>
          <circle cx="499" cy="153" r="9" fill="#FF69B4" stroke="#E05090" strokeWidth="1.5" />
          <line x1="499" y1="144" x2="499" y2="162" stroke="#E05090" strokeWidth="1.5" />
          <line x1="490" y1="153" x2="508" y2="153" stroke="#E05090" strokeWidth="1.5" />
          <circle cx="499" cy="153" r="2.5" fill="#FFF0FB" />
        </g>
        <g className="wheel" style={{ transformOrigin: "526px 153px" }}>
          <circle cx="526" cy="153" r="9" fill="#FF69B4" stroke="#E05090" strokeWidth="1.5" />
          <line x1="526" y1="144" x2="526" y2="162" stroke="#E05090" strokeWidth="1.5" />
          <line x1="517" y1="153" x2="535" y2="153" stroke="#E05090" strokeWidth="1.5" />
          <circle cx="526" cy="153" r="2.5" fill="#FFF0FB" />
        </g>

        {/* Coupler: Car8 → Car9 */}
        <line x1="539" y1="145" x2="547" y2="145" stroke="#E05090" strokeWidth="2.5" strokeLinecap="round" />

        {/* Car 9 (GLTR) x=547..597 */}
        <rect x="547" y="100" width="50" height="55" rx="5" fill="url(#carGrad)" stroke="#E05090" strokeWidth="1.5" />
        <rect x="547" y="90" width="50" height="17" rx="3" fill="#FF69B4" stroke="#E05090" strokeWidth="1" />
        <rect x="551" y="107" width="16" height="18" rx="3" fill="#FFF0FB" stroke="#FF69B4" strokeWidth="1" />
        <text x="559" y="119" fontSize="9" fill="#FF69B4" textAnchor="middle" fontFamily="sans-serif">✦</text>
        <rect x="574" y="107" width="16" height="18" rx="3" fill="#FFF0FB" stroke="#FF69B4" strokeWidth="1" />
        <text x="582" y="119" fontSize="8" fill="#FF1493" textAnchor="middle" fontFamily="sans-serif">★</text>
        <text x="572" y="136" fontSize="9" fill="#FFF0FB" textAnchor="middle" fontFamily="sans-serif" fontWeight="700">GLTR</text>
        <g className="wheel" style={{ transformOrigin: "557px 153px" }}>
          <circle cx="557" cy="153" r="9" fill="#FF69B4" stroke="#E05090" strokeWidth="1.5" />
          <line x1="557" y1="144" x2="557" y2="162" stroke="#E05090" strokeWidth="1.5" />
          <line x1="548" y1="153" x2="566" y2="153" stroke="#E05090" strokeWidth="1.5" />
          <circle cx="557" cy="153" r="2.5" fill="#FFF0FB" />
        </g>
        <g className="wheel" style={{ transformOrigin: "584px 153px" }}>
          <circle cx="584" cy="153" r="9" fill="#FF69B4" stroke="#E05090" strokeWidth="1.5" />
          <line x1="584" y1="144" x2="584" y2="162" stroke="#E05090" strokeWidth="1.5" />
          <line x1="575" y1="153" x2="593" y2="153" stroke="#E05090" strokeWidth="1.5" />
          <circle cx="584" cy="153" r="2.5" fill="#FFF0FB" />
        </g>

        <circle className="sparkle1" cx="5" cy="100" r="3" fill="#FF1493" />
        <circle className="sparkle2" cx="-5" cy="115" r="2" fill="#FFB6D9" />
        <circle className="sparkle3" cx="2" cy="128" r="2.5" fill="#FF69B4" />
      </g>
      </svg>
    </AnimLayer>
  );
});

const TopNav = memo(({ navRef, handleLogout, loggingOut, authUser, hiddenNexuses, onReveal }) => {
  const navigate = useNavigate();

  const navBtnBase = {
    display: "flex", alignItems: "center", gap: 5,
    background: "rgba(255,255,255,0.4)",
    border: "1px solid rgba(242,196,208,0.4)",
    cursor: "pointer",
    fontSize: 11, fontWeight: 600, letterSpacing: "0.02em",
    color: "#8B6B8A", padding: "5px 12px", borderRadius: 6,
    fontFamily: "'DM Sans', inherit", transition: "all 0.18s",
    backdropFilter: "blur(4px)",
    boxShadow: "0 1px 4px rgba(200,169,212,0.1)",
  };

  return (
    <div ref={navRef} style={{
      position: "absolute", top: 0, left: 0, right: 0, height: 50,
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 18px", zIndex: 30,
      borderBottom: "1px solid rgba(242,196,208,0.35)",
      background: "rgba(247,232,240,0.62)",
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      boxShadow: "0 1px 16px rgba(200,169,212,0.12)",
    }}>

      {/* ── Left: Logo + user info ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
        {/* Logo pill */}
        <div style={{
          display: "flex", alignItems: "center", gap: 7,
          background: "linear-gradient(135deg, rgba(255,170,220,0.35), rgba(200,160,255,0.3))",
          borderRadius: 22, padding: "4px 12px 4px 6px",
          border: "1px solid rgba(255,180,220,0.4)",
          boxShadow: "0 2px 12px rgba(255,130,200,0.2)",
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: 9,
            background: "linear-gradient(135deg, #ffaad8, #cc88ff, #88ccff)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14, boxShadow: "0 2px 10px rgba(255,130,200,0.45)",
            flexShrink: 0,
          }}>🌸</div>
          <span style={{
            fontSize: 14, fontWeight: 900, letterSpacing: "0.04em",
            background: "linear-gradient(90deg, #e060b0, #a060e0)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
          }}>Orbit</span>
          <span style={{ fontSize: 11, marginTop: -6, opacity: 0.8 }}>👑</span>
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 22, background: "rgba(255,160,210,0.3)" }} />

        {/* User avatar + name */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ position: "relative" }}>
            <div style={{
              width: 30, height: 30, borderRadius: "50%",
              background: "linear-gradient(135deg, #ffaad8, #cc88ff)",
              border: "2px solid rgba(255,180,220,0.6)",
              overflow: "hidden", display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: 13, fontWeight: 900,
              color: "#fff", boxShadow: "0 2px 10px rgba(255,130,200,0.3)",
              flexShrink: 0,
            }}>
              {authUser?.profilePic
                ? <img src={authUser.profilePic} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : (authUser?.username?.[0]?.toUpperCase() || "✿")
              }
            </div>
            {/* Online dot */}
            <div style={{
              position: "absolute", bottom: 0, right: 0,
              width: 9, height: 9, borderRadius: "50%",
              background: "#5de0a0", border: "2px solid white",
              boxShadow: "0 0 6px rgba(93,224,160,0.7)",
            }} />
          </div>
          <span style={{
            fontSize: 12, fontWeight: 800,
            background: "linear-gradient(90deg, #d060a8, #9060d0)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
            maxWidth: 110, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {authUser?.username || "Dreamer"}
          </span>
        </div>
      </div>

      {/* ── Center: Barbie Train Animation + Hidden Sparks ── */}
      <div style={{ flex: 1, margin: "0 20px", height: "100%", position: "relative", overflow: "hidden", display: "flex", alignItems: "center" }}>
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity: 0.9 }}>
          <BarbieTrainAnimation />
        </div>
        <div style={{ position: "relative", zIndex: 5, display: "flex", gap: 50, marginLeft: 140, pointerEvents: "none" }}>
          {(hiddenNexuses || []).map(nexus => (
            <div key={nexus._id} style={{ pointerEvents: "auto" }}>
              <HiddenNexusSparkle nexus={nexus} onReveal={onReveal} />
            </div>
          ))}
        </div>
      </div>

      {/* ── Right: Nav links + logout ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
        {[
          { label: "Home", icon: "🏠", path: "/" },
          { label: "Spotify", icon: "🎵", path: "/spotify" },
          { label: "Settings", icon: "⚙️", path: "/settings" },
          { label: "Profile", icon: "👤", path: "/profile" },
        ].map(({ label, icon, path }) => (
          <button
            key={path}
            onClick={() => navigate(path)}
            style={navBtnBase}
            onMouseEnter={e => {
              e.currentTarget.style.background = "rgba(255,255,255,0.65)";
              e.currentTarget.style.borderColor = "rgba(200,169,212,0.5)";
              e.currentTarget.style.color = "#8B6B8A";
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(200,169,212,0.2)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = "rgba(255,255,255,0.4)";
              e.currentTarget.style.borderColor = "rgba(242,196,208,0.4)";
              e.currentTarget.style.color = "#8B6B8A";
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 1px 4px rgba(200,169,212,0.1)";
            }}
          >
            <span style={{ fontSize: 12 }}>{icon}</span>
            {label}
          </button>
        ))}

        {/* Divider */}
        <div style={{ width: 1, height: 20, background: "rgba(255,160,210,0.35)", margin: "0 2px" }} />

        {/* Logout */}
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          style={{
            display: "flex", alignItems: "center", gap: 5,
            background: loggingOut
              ? "rgba(255,200,220,0.3)"
              : "linear-gradient(135deg, rgba(255,120,170,0.2), rgba(220,100,160,0.15))",
            border: "1px solid rgba(255,120,170,0.4)",
            cursor: loggingOut ? "not-allowed" : "pointer",
            fontSize: 11, fontWeight: 800, letterSpacing: "0.05em",
            color: "#e0507a", padding: "5px 11px", borderRadius: 20,
            fontFamily: "inherit", transition: "all 0.22s",
            backdropFilter: "blur(4px)",
            boxShadow: "0 1px 6px rgba(255,100,150,0.15)",
            opacity: loggingOut ? 0.6 : 1,
          }}
          onMouseEnter={e => {
            if (!loggingOut) {
              e.currentTarget.style.background = "linear-gradient(135deg, rgba(255,100,150,0.35), rgba(220,60,120,0.3))";
              e.currentTarget.style.color = "#c03060";
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow = "0 4px 14px rgba(255,80,130,0.3)";
            }
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = "linear-gradient(135deg, rgba(255,120,170,0.2), rgba(220,100,160,0.15))";
            e.currentTarget.style.color = "#e0507a";
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 1px 6px rgba(255,100,150,0.15)";
          }}
        >
          <span style={{ fontSize: 12 }}>🚪</span>
          {loggingOut ? "Leaving…" : "Logout"}
        </button>
      </div>
    </div>
  );
});



// ── Hidden Nexus Sparkle ──────────────────────────────────────────────────
const HiddenNexusSparkle = memo(({ nexus, onReveal }) => {
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
                    ? 'drop-shadow(0 0 15px #ffaad8) drop-shadow(0 0 30px rgba(255,170,216,0.5))'
                    : 'drop-shadow(0 0 8px rgba(255,170,216,0.3))',
                transition: grabbed ? 'none' : 'filter 0.3s',
                fontSize: 22,
                width: 32,
                height: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                animation: grabbed ? 'none' : 'starPulse 2s ease-in-out infinite'
            }}
            onMouseDown={handleMouseDown}
            onClick={handleClick}
            onDragStart={(e) => e.preventDefault()}
        >
            ✨
        </div>
    );
});

/* ── cute online status pill ── */
const StatusPill = memo(() => {
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      background: "rgba(255,255,255,0.45)", backdropFilter: "blur(6px)",
      borderRadius: 20, padding: "3px 10px 3px 7px",
      border: "1px solid rgba(255,180,220,0.4)",
      marginBottom: 6,
      boxShadow: "0 1px 8px rgba(255,150,200,0.15)",
    }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#ff7eb8", boxShadow: "0 0 6px #ff7eb8", display: "inline-block", animation: "pulse 1.6s ease-in-out infinite" }} />
      <span style={{ fontSize: 8.5, fontWeight: 800, letterSpacing: "0.18em", color: "rgba(200,80,140,0.85)", textTransform: "uppercase" }}>STATUS: ONLINE ♡</span>
    </div>
  );
});

const Sidebar = memo(({ sidebarRef, nexuses, isNexusesLoading, setSelectedNexus, selectedNexus, users, setSelectedUser, selectedUser, nexusUnread, setNexusActionView, hiddenNexuses, toggleHide }) => {
  const [activeTab, setActiveTab] = useState("orbits");
  const { play } = useSoundManager();
  const navigate = useNavigate();

  const [pinnedNexuses, setPinnedNexuses] = useState(() => {
    return JSON.parse(localStorage.getItem('pastel_pinned_nexuses') || '[]');
  });
  const [nexusColors, setNexusColors] = useState(() => {
    return JSON.parse(localStorage.getItem('pastel_nexus_colors') || '{}');
  });
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [activeColorPickerId, setActiveColorPickerId] = useState(null);

  const togglePin = (id, e) => {
    e.stopPropagation();
    const next = pinnedNexuses.includes(id) ? pinnedNexuses.filter(pid => pid !== id) : [...pinnedNexuses, id];
    setPinnedNexuses(next);
    localStorage.setItem('pastel_pinned_nexuses', JSON.stringify(next));
    setActiveMenuId(null);
  };

  const updateColor = (id, color, e) => {
    e.stopPropagation();
    const next = { ...nexusColors, [id]: color };
    setNexusColors(next);
    localStorage.setItem('pastel_nexus_colors', JSON.stringify(next));
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
  const tabStyle = (active) => ({
    flex: 1, border: "none", cursor: "pointer", padding: "8px 0", borderRadius: 16,
    fontSize: 11, fontWeight: 900, letterSpacing: "0.08em", fontFamily: "inherit",
    background: active ? "linear-gradient(135deg, #eecbff, #d1ccff)" : "transparent",
    color: active ? "#8e44ad" : "#a1887f",
    transition: "all 0.25s ease",
    boxShadow: active ? "0 4px 15px rgba(220,180,255,0.4)" : "none",
  });

  return (
    <div ref={sidebarRef} className={`pastel-sidebar ${selectedNexus || selectedUser ? 'chat-active' : ''} w-[290px] flex-shrink-0 flex flex-col border-r border-[#ffb4dc]/15 bg-gradient-to-b from-[#ffdcf3] to-[#fef4f9] px-3 py-[14px]`}>
      {/* Sidebar Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 22, paddingLeft: 4 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: "linear-gradient(135deg, #ff9fd0, #90c8f8)",
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18
        }}>🌸</div>
        <span style={{ fontSize: 18, fontWeight: 900, color: "#ff479c", letterSpacing: "0.02em" }}>Orbit</span>
        <span style={{ fontSize: 15 }}>👑</span>
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
        <button onClick={() => setActiveTab("orbits")} style={tabStyle(activeTab === "orbits")}># ORBITS</button>
        <button onClick={() => setActiveTab("contacts")} style={{ ...tabStyle(activeTab === "contacts"), opacity: 0.6 }}>
          <span style={{ fontSize: 10, marginRight: 4 }}>💖</span>CONTACTS
        </button>
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
        <button
          onClick={() => setNexusActionView("join")}
          style={{
            flex: 1, border: "none", borderRadius: 14, padding: "8px 0",
            fontSize: 11, fontWeight: 900, letterSpacing: "0.08em",
            background: "#ffe4f2", color: "#e8338a", cursor: "pointer",
            boxShadow: "0 2px 8px rgba(255,180,220,0.2)"
          }}># JOIN</button>
        <button
          onClick={() => setNexusActionView("create")}
          style={{
            flex: 1, border: "none", borderRadius: 14, padding: "8px 0",
            fontSize: 11, fontWeight: 900, letterSpacing: "0.08em",
            background: "linear-gradient(90deg, #ff9fd0, #c890f8)",
            color: "white", cursor: "pointer", boxShadow: "0 4px 15px rgba(255,130,200,0.3)"
          }}>+ NEXUS ✨</button>
      </div>

      {/* Center Empty State */}
      <div className="flex-1 overflow-y-auto pr-1" style={{ position: "relative", zIndex: 2 }}>
        {activeTab === "orbits" ? (
          isNexusesLoading ? (
            <div style={{ padding: 12, fontSize: 11, color: "#d596ba", textAlign: "center" }}>💖 Syncing...</div>
          ) : nexuses.length === 0 ? (
            <div style={{ padding: 12, fontSize: 11, color: "#d596ba", textAlign: "center", lineHeight: 1.5 }}>
              No Orbits Yet!<br />Bloom One Below.
            </div>
          ) : (
            sortedNexuses.map(n => (
              <div
                key={n._id}
                onClick={() => { 
                  play("click"); 
                  setSelectedNexus(n); 
                  setSelectedUser(null);
                  setNexusActionView(null);
                  navigate(`/nexus/${n._id}`);
                }}
                style={{
                  display: "flex", flexDirection: "column", padding: "8px 10px", borderRadius: 14, cursor: "pointer", transition: "all 0.25s",
                  background: nexusColors[n._id] || "rgba(255,255,255,0.45)", position: "relative"
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.7)"; e.currentTarget.style.transform = "translateX(3px)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = nexusColors[n._id] || "rgba(255,255,255,0.45)"; e.currentTarget.style.transform = "translateX(0)"; }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, width: "100%" }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
                    {n.avatar ? (
                      <img src={n.avatar} alt={n.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      (() => {
                        const ANIMALS = ['dog', 'cat', 'bunny'];
                        const animal = ANIMALS[parseInt((n._id || "").toString().slice(-4) || '0', 16) % ANIMALS.length];
                        return (
                          <PixelAvatarBadge 
                            type={animal} 
                            state="idle" 
                            size={28} 
                            showDot={false} 
                            style={{ imageRendering: "pixelated" }} 
                          />
                        );
                      })()
                    )}
                  </div>
                  <div style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 13, fontWeight: 700, color: "#e880b8" }}>{n.name}</div>
                  {nexusUnread[n._id] > 0 && (
                    <div style={{ background: "#ff66aa", color: "#fff", fontSize: 9, fontWeight: 900, width: 18, height: 18, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 6px rgba(255,102,170,0.4)" }}>{nexusUnread[n._id]}</div>
                  )}

                  {pinnedNexuses.includes(n._id) && (
                    <div style={{ position: 'absolute', top: 2, left: 2, fontSize: 10 }}>📌</div>
                  )}

                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveMenuId(activeMenuId === n._id ? null : n._id);
                      setActiveColorPickerId(null);
                    }}
                    style={{ fontSize: 16, padding: "0 4px", opacity: 0.7, transition: "opacity 0.2s" }}
                    onMouseEnter={e => e.currentTarget.style.opacity = 1}
                    onMouseLeave={e => e.currentTarget.style.opacity = 0.7}
                  >
                    🌷
                  </div>
                </div>

                {/* Context Menu Inline Expansion */}
                {activeMenuId === n._id && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    style={{ width: '100%', marginTop: 10, paddingTop: 10, borderTop: `1px solid rgba(255,255,255,0.3)`, display: 'flex', flexDirection: 'column', gap: 8 }}
                  >
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveColorPickerId(activeColorPickerId === n._id ? null : n._id);
                        }}
                        style={{ flex: 1, padding: '6px', background: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,182,193,0.3)", borderRadius: 10, fontSize: 11, color: "#8a7585", fontFamily: "inherit", fontWeight: 700, cursor: 'pointer' }}
                      >
                        Mark 🎨
                      </button>
                      <button
                        onClick={(e) => togglePin(n._id, e)}
                        style={{ flex: 1, padding: '6px', background: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,182,193,0.3)", borderRadius: 10, fontSize: 11, color: "#8a7585", fontFamily: "inherit", fontWeight: 700, cursor: 'pointer' }}
                      >
                        {pinnedNexuses.includes(n._id) ? "Unpin 📌" : "Pin 📌"}
                      </button>
                      <button
                        onClick={(e) => toggleHide(n, e)}
                        style={{ flex: 1, padding: '6px', background: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,182,193,0.3)", borderRadius: 10, fontSize: 11, color: "#8a7585", fontFamily: "inherit", fontWeight: 700, cursor: 'pointer' }}
                      >
                        Hide ✨
                      </button>
                    </div>

                    {activeColorPickerId === n._id && (
                      <div style={{ display: 'flex', gap: 6, padding: '8px', background: "rgba(255,255,255,0.5)", borderRadius: 10, border: "1px solid rgba(255,182,193,0.2)", overflowX: 'auto', scrollbarWidth: 'none' }} className="custom-scrollbar">
                        {[
                          "transparent", // Default
                          "rgba(255,182,193,0.4)", // Light Pink
                          "rgba(255,228,225,0.5)", // Misty Rose
                          "rgba(240,230,140,0.4)", // Khaki/Yellowish
                          "rgba(152,251,152,0.4)", // Pale Green
                          "rgba(175,238,238,0.4)", // Pale Turquoise
                          "rgba(230,230,250,0.6)", // Lavender
                          "rgba(255,218,185,0.5)", // Peach
                        ].map(c => (
                          <div
                            key={c}
                            onClick={(e) => updateColor(n._id, c, e)}
                            style={{ minWidth: 20, height: 20, borderRadius: '50%', background: c, border: c === "transparent" ? "1px solid rgba(0,0,0,0.1)" : `1px solid rgba(255,255,255,0.8)`, cursor: 'pointer', flexShrink: 0 }}
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
            <div style={{ padding: 12, fontSize: 11, color: "#80b8e8", textAlign: "center" }}>No Companions Found.</div>
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
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 14, marginBottom: 5, cursor: "pointer", transition: "all 0.2s" }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.3)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#fff", border: "1.5px solid #bce4f8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, flexShrink: 0, overflow: "hidden" }}>
                  {u.profilePic ? <img src={u.profilePic} alt={u.username} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ color: "#80b8e8", fontWeight: 800 }}>{u.username?.[0]?.toUpperCase()}</span>}
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#80b8e8" }}>{u.username}</div>
              </div>
            ))
          )
        )}
      </div>

      {/* Orbit Footer Button */}
      <div 
        style={{ borderRadius: "24px", padding: "12px 14px", background: "rgba(0,0,0,0.05)", border: "2px solid rgba(255,255,255,0.4)", display: "flex", alignItems: "center", gap: 12, cursor: "not-allowed", opacity: 0.6, pointerEvents: "none" }}
      >
        <div style={{ width: 40, height: 40, borderRadius: "12px", background: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🔒</div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 900, color: "#8B6B8A", letterSpacing: "0.05em" }}>ORBIT: COMING SOON</div>
          <div style={{ fontSize: 9, fontWeight: 800, color: "rgba(139,107,138,0.6)", letterSpacing: "0.02em" }}>DIMENSIONAL SYNC</div>
        </div>
      </div>
    </div>
  );
});

const SpotifyCard = memo(({ cardRef }) => {
  const { 
    spotifyLinked, currentTrack, isPlaying, 
    pausePlayback, playTrack, skipNext, skipPrevious,
    positionMs, durationMs, seekTo
  } = useSpotifyStore();
  const navigate = useNavigate();

  const [localPos, setLocalPos] = useState(positionMs || 0);

  useEffect(() => {
    setLocalPos(positionMs || 0);
  }, [positionMs]);

  useEffect(() => {
    let t;
    if (isPlaying && durationMs) {
      t = setInterval(() => setLocalPos(p => Math.min(p + 1000, durationMs)), 1000);
    }
    return () => clearInterval(t);
  }, [isPlaying, durationMs]);

  const prog = durationMs ? (localPos / durationMs) * 100 : 0;

  const handleSeek = (e) => {
    e.stopPropagation();
    if (!durationMs) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    seekTo((percent / 100) * durationMs);
  };

  const handleConnect = async (e) => {
    e.stopPropagation();
    try {
      await spotifyService.initiateLogin();
    } catch (err) {
      console.error("Failed to connect Spotify:", err);
    }
  };

  const handleCardClick = (e) => {
    if (e.target.closest("button")) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    if (durationMs) seekTo((percent / 100) * durationMs);
  };

  return (
    <div
      ref={cardRef}
      onClick={(e) => {
        if (!spotifyLinked) {
          navigate("/spotify");
          return;
        }
        handleCardClick(e);
      }}
      style={{
        background: spotifyLinked 
          ? "linear-gradient(135deg, rgba(185,245,215,0.85) 0%, rgba(210,250,230,0.78) 100%)"
          : "linear-gradient(135deg, rgba(255,230,240,0.85) 0%, rgba(240,220,255,0.78) 100%)",
        border: spotifyLinked 
          ? "1px solid rgba(150,225,190,0.55)"
          : "1px solid rgba(244,114,182,0.35)", 
        borderRadius: 20,
        backdropFilter: "blur(12px)",
        padding: 0,
        display: "flex",
        flexDirection: "column",
        position: "relative",
        boxShadow: "0 4px 20px rgba(100,200,150,0.15)",
        cursor: "pointer",
        overflow: "hidden"
      }}
    >
      {spotifyLinked && (
        <>
          <div
            style={{
              position: "absolute",
              top: 0, left: 0, bottom: 0,
              width: `${prog}%`,
              background: "linear-gradient(90deg, rgba(61,186,120,0.2) 0%, rgba(61,186,120,0.1) 100%)",
              transition: "width 1s linear",
              zIndex: 0,
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 0, bottom: 0,
              left: `${prog}%`,
              width: 3,
              background: "rgba(61,186,120,0.4)",
              transition: "left 1s linear",
              zIndex: 1,
              pointerEvents: "none",
              filter: "blur(2px)",
            }}
          />
        </>
      )}

      <div style={{ position: "relative", zIndex: 2, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10, height: "100%" }}>
        <CuteBadge label={spotifyLinked ? "vibing" : "offline"} color={spotifyLinked ? "linear-gradient(90deg,#4cba88,#70d4a8)" : "linear-gradient(90deg,#f472b6,#c084fc)"} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span
              style={{
                width: 9,
                height: 9,
                borderRadius: "50%",
                background: spotifyLinked ? "#3dba78" : "#f472b6",
                boxShadow: spotifyLinked ? "0 0 6px #3dba78" : "0 0 6px #f472b6",
                display: "inline-block",
                animation: "pulse 1.8s ease-in-out infinite",
              }}
            />
            <span style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: "0.12em", color: spotifyLinked ? "#3dba78" : "#f472b6", textTransform: "uppercase" }}>
              {spotifyLinked ? "Spotify Active" : "Connect Spotify"}
            </span>
          </div>
          {spotifyLinked && (
            <button 
              onClick={(e) => { e.stopPropagation(); navigate("/spotify"); }}
              style={{ background: "none", border: "none", fontSize: 9.5, fontWeight: 700, letterSpacing: "0.1em", color: "rgba(60,160,100,0.6)", textTransform: "uppercase", cursor: "pointer" }}
            >
              EXPAND
            </button>
          )}
        </div>

        {spotifyLinked ? (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 56, height: 56, borderRadius: 12, flexShrink: 0, overflow: "hidden", boxShadow: "0 3px 10px rgba(0,0,0,0.18)", border: "1px solid rgba(60,180,120,0.2)" }}>
                {currentTrack?.imageUrl ? (
                  <img src={currentTrack.imageUrl} alt="Album Art" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <svg width="56" height="56" viewBox="0 0 56 56">
                    <rect width="56" height="56" fill="#9a8899" />
                    <rect x="0" y="10" width="56" height="18" fill="rgba(170,150,160,0.55)" />
                    <rect x="0" y="34" width="56" height="12" fill="rgba(130,110,125,0.4)" />
                    <rect x="14" y="0" width="14" height="56" fill="rgba(155,135,150,0.25)" />
                  </svg>
                )}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#2a5c3a", letterSpacing: "0.02em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{currentTrack?.name || "Awaiting..."}</div>
                <div style={{ fontSize: 11, color: "rgba(60,100,70,0.8)", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{currentTrack?.artist || "The silent choir"}</div>
                <div style={{ fontSize: 8, color: "rgba(60,180,120,0.5)", marginTop: 4, letterSpacing: 2 }}>♡ ♡ ♡</div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <button onClick={(e) => { e.stopPropagation(); skipPrevious(); }} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(60,160,100,0.6)", fontSize: 14, padding: 4, lineHeight: 1 }}>⏮</button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    isPlaying ? pausePlayback() : playTrack();
                  }}
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #3dba78, #60d4a0)",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontSize: 14,
                    boxShadow: "0 3px 12px rgba(60,180,100,0.45)",
                    transition: "transform 0.15s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.08)")}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                  onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.95)")}
                  onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1.08)")}
                >
                  {isPlaying ? "⏸" : "▶"}
                </button>
                <button onClick={(e) => { e.stopPropagation(); skipNext(); }} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(60,160,100,0.6)", fontSize: 14, padding: 4, lineHeight: 1 }}>⏭</button>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 9, color: "rgba(60,120,80,0.5)", fontWeight: 600 }}>
                  {Math.floor(localPos/60000)}:{String(Math.floor((localPos%60000)/1000)).padStart(2,"0")}
                </span>
                <span style={{ fontSize: 11, color: "rgba(60,160,100,0.5)" }}>🔊</span>
              </div>
            </div>
          </>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, gap: 10, textAlign: "center" }}>
          <div style={{ fontSize: 11, color: "#d060a8", fontWeight: 700, lineHeight: 1.4 }}>Link your Spotify to vibeee together! 🎀</div>
          <button
            onClick={handleConnect}
            style={{
              padding: "8px 20px",
              borderRadius: 20,
              background: "linear-gradient(135deg, #f472b6, #c084fc)",
              color: "white",
              border: "none",
              fontSize: 10,
              fontWeight: 900,
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(244,114,182,0.3)",
              letterSpacing: "0.05em",
            }}
          >
            INITIALIZE CONNECTION
          </button>
        </div>
      )}
    </div>
    </div>
  );
});

const CARDS = [
  {
    bg: "linear-gradient(135deg, rgba(252,210,235,0.85) 0%, rgba(255,225,245,0.78) 100%)",
    border: "1px solid rgba(235,175,215,0.55)",
    iconBg: "rgba(220,140,195,0.2)", accent: "#c060a8",
    icon: "🎮", title: "ORBIT GAMES 🔒",
    desc: "Coming soon. A new way to play together in our dreamscape.",
    bottomIcon: "🔒", line: "rgba(215,165,200,0.38)",
    badge: "soon", badgeColor: "linear-gradient(90deg,#e070b8,#c090e8)",
  },
  {
    bg: "linear-gradient(135deg, rgba(255,225,198,0.85) 0%, rgba(255,238,215,0.78) 100%)",
    border: "1px solid rgba(245,192,152,0.55)",
    iconBg: "rgba(230,138,88,0.2)", accent: "#d07840",
    icon: "🔔", title: "GET NOTIFICATIONS",
    desc: "Stay updated with real-time alerts and messages",
    bottomIcon: "↓", line: "rgba(232,188,158,0.38)",
    badge: null,
  },
  {
    bg: "linear-gradient(135deg, rgba(192,235,215,0.85) 0%, rgba(210,248,228,0.78) 100%)",
    border: "1px solid rgba(152,215,183,0.55)",
    iconBg: "rgba(68,168,118,0.18)", accent: "#3d9878",
    icon: "⚙️", title: "CUSTOMIZE",
    desc: "Configure your orbit behavior and preferences",
    bottomIcon: "↑", line: "rgba(158,215,188,0.38)",
    badge: null,
  },
];

const FeatureCard = memo(({ cfg, cardRef }) => {
  return (
    <div onClick={() => window.dispatchEvent(new CustomEvent("toggle-orbit-mode"))} ref={cardRef} style={{
      background: cfg.bg, border: cfg.border, borderRadius: 20,
      backdropFilter: "blur(12px)", padding: "16px 18px",
      display: "flex", flexDirection: "column", gap: 8,
      cursor: "pointer", position: "relative", minHeight: 130,
      transition: "transform 0.22s, box-shadow 0.22s",
      boxShadow: "0 4px 18px rgba(200,160,220,0.1)",
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.018)"; e.currentTarget.style.boxShadow = "0 8px 28px rgba(200,140,220,0.22)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 4px 18px rgba(200,160,220,0.1)"; }}
    >
      {cfg.badge && <CuteBadge label={cfg.badge} color={cfg.badgeColor} />}
      <div style={{ width: 36, height: 36, borderRadius: 12, background: cfg.iconBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>{cfg.icon}</div>
      <div style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: "0.13em", color: cfg.accent, textTransform: "uppercase", marginTop: 2 }}>{cfg.title}</div>
      <div style={{ fontSize: 11, color: "rgba(110,88,118,0.72)", lineHeight: 1.55 }}>{cfg.desc}</div>
      <div style={{ position: "absolute", bottom: 32, left: 18, right: 18, height: "0.5px", background: cfg.line }} />
      <div style={{ position: "absolute", bottom: 11, right: 14, fontSize: 13, color: cfg.accent, opacity: 0.38, fontWeight: "bold" }}>{cfg.bottomIcon}</div>
    </div>
  );
});

/* ── animated title with shimmer ── */
const HeroTitle = memo(() => {
  return (
    <h1 style={{
      margin: "0 0 5px 0", fontSize: 38, fontWeight: 600,
      fontFamily: "'Cormorant Garamond', 'Georgia', serif",
      fontStyle: "italic",
      letterSpacing: "0.02em", lineHeight: 1.1,
      color: "#8B6B8A",
      position: "relative", display: "inline-block",
    }}>Welcome to Orbit
      <span style={{
        position: "absolute", top: -4, right: -18,
        fontSize: 14, color: "#A8D5BA",
        animation: "starPulse 2.8s ease-in-out infinite",
      }}>✦</span>
    </h1>
  );
});

import { gsap } from "gsap";

export default function PastelApp({ children }) {
  const navRef = useRef(null), sidebarRef = useRef(null), heroRef = useRef(null);
  const c0 = useRef(null), c1 = useRef(null), c2 = useRef(null), c3 = useRef(null);
  const { authUser, logout } = useAuthStore();
  const [loggingOut, setLoggingOut] = useState(false);
  const { nexusActionView, setNexusActionView, nexuses, setSelectedNexus, isNexusesLoading, nexusUnread, selectedNexus, selectedNexusId } = useNexusStore();
  const nexusSelected = Boolean(selectedNexus || selectedNexusId);
  const { users, selectedUser, setSelectedUser } = useChatStore();
  const [mounted, setMounted] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try { await logout(); } finally { setLoggingOut(false); }
  };

  // ── Hidden Nexus State ──
  const [hiddenNexuses, setHiddenNexuses] = useState(() => {
      try {
          const saved = localStorage.getItem('pastel_hidden_nexuses');
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
      localStorage.setItem('pastel_hidden_nexuses', JSON.stringify(next));
  };

  const onReveal = (id) => {
      const next = hiddenNexuses.filter(h => h._id !== id);
      setHiddenNexuses(next);
      localStorage.setItem('pastel_hidden_nexuses', JSON.stringify(next));
  };


  useEffect(() => {
    setMounted(true);
    const ctx = gsap.context(() => {
      const cards = [c0, c1, c2, c3].map(r => r.current).filter(Boolean);
      const nav = navRef.current;
      const sidebar = sidebarRef.current;
      const hero = heroRef.current;

      if (nav) gsap.set(nav, { opacity: 0, y: -20 });
      if (sidebar) gsap.set(sidebar, { opacity: 0, x: -24 });
      if (hero) gsap.set(hero, { opacity: 0, y: 16 });
      if (cards.length > 0) gsap.set(cards, { opacity: 0, y: 22, scale: 0.95 });

      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      if (nav) tl.to(nav, { opacity: 1, y: 0, duration: 0.55 });
      if (sidebar) tl.to(sidebar, { opacity: 1, x: 0, duration: 0.5 }, "-=0.35");
      if (hero) tl.to(hero, { opacity: 1, y: 0, duration: 0.45 }, "-=0.3");
      if (cards.length > 0) {
        tl.to(cards, { opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.09 }, "-=0.25");
      }

      cards.forEach((c, i) => {
        gsap.to(c, { y: i % 2 === 0 ? -5 : 5, duration: 2.8 + i * 0.25, repeat: -1, yoyo: true, ease: "sine.inOut", delay: i * 0.5 });
      });
    });
    return () => ctx.revert();
  }, []);

  return (
    <div style={{
      position: "relative", width: "100%", height: "100vh", overflow: "hidden",
      fontFamily: "'DM Sans', 'Nunito', system-ui, sans-serif",
      background: "#F7E8F0",
      cursor: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Ccircle cx='12' cy='12' r='3' fill='%23C8A9D4' opacity='0.8'/%3E%3C/svg%3E\") 12 12, auto",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400;1,600&family=DM+Sans:wght@400;500;600;700;800&display=swap');
        @keyframes starPulse {
          0%,100%{ opacity:0.45; transform:scale(1) rotate(0deg); }
          50%{ opacity:0.9; transform:scale(1.18) rotate(14deg); }
        }
        @keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:0.38;} }
        @keyframes shimmer {
          0%{ left:-60%; }
          100%{ left:130%; }
        }
        @keyframes sparkFly {
          0%  { transform:translate(0,0) scale(1); opacity:1; }
          100%{ transform:translate(var(--dx),var(--dy)) scale(0); opacity:0; }
        }
        @keyframes float {
          0%,100%{ transform:translateY(0); }
          50%{ transform:translateY(-6px); }
        }
        *{ box-sizing:border-box; }
        button:focus{ outline:none; }
        ::-webkit-scrollbar{ width:4px; }
        ::-webkit-scrollbar-thumb{ background:rgba(200,169,212,0.4); border-radius:99px; }

        /* ── Pastel Dream Chat Theme ── */
        .pastel-chat-env .nexus-chat-container {
          background: rgba(255,255,255,0.6) !important;
          backdrop-filter: blur(20px) !important;
          border-radius: 30px !important; /* heavy border radius */
          overflow: hidden !important;
          border: 1px solid rgba(255,255,255,0.8) !important;
          box-shadow: 0 10px 40px rgba(255,150,200,0.1) !important;
        }
        .pastel-chat-env .nxc-messages {
          background-color: transparent !important;
          background-image: 
            radial-gradient(circle at 10% 20%, rgba(200, 180, 255, 0.4) 0%, transparent 60%),
            radial-gradient(circle at 90% 80%, rgba(180, 255, 200, 0.4) 0%, transparent 60%) !important;
        }
        .pastel-chat-env .nexus-chat-header { 
          background: rgba(255,255,255,0.4) !important; 
          border-bottom: 1px solid rgba(255,183,178,0.4) !important;
          backdrop-filter: blur(14px) !important;
          color: #8b5a2b !important; /* Coffee brown */
        }
        .pastel-chat-env .nexus-chat-header .nxc-name { color: #8b5a2b !important; font-weight: 800 !important; }
        .pastel-chat-env .nxc-utility-group, .pastel-chat-env .nxc-telemetry-capsule {
          background: transparent !important; border: none !important; box-shadow: none !important;
          color: #8b5a2b !important;
        }
        /* Claymorphic Buttons */
        .pastel-chat-env .nxc-hbtn, .pastel-chat-env .nxc-aero-btn {
          background: rgba(255,255,255,0.85) !important;
          border-radius: 50% !important;
          box-shadow: 4px 4px 10px rgba(255,183,178,0.3), -4px -4px 10px rgba(255,255,255,0.8), inset 2px 2px 4px rgba(255,255,255,1), inset -2px -2px 4px rgba(255,183,178,0.15) !important;
          color: #8b5a2b !important; 
          transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275) !important;
        }
        .pastel-chat-env .nxc-hbtn:hover, .pastel-chat-env .nxc-aero-btn:hover {
          transform: scale(1.15) !important; /* Popping */
          box-shadow: 6px 6px 12px rgba(255,183,178,0.35), -6px -6px 12px rgba(255,255,255,0.9), inset 2px 2px 4px rgba(255,255,255,1), inset -2px -2px 4px rgba(255,183,178,0.15) !important;
        }
        .pastel-chat-env .nxc-signal-bars .nxc-bar,
        .pastel-chat-env .text-[#5dcaa5] {
          background-color: #8b5a2b !important; /* Using coffee brown to keep grounded */
          color: #8b5a2b !important;
          text-shadow: none !important;
        }
        .pastel-chat-env .bg-white\\/20 { display: none !important; } /* Clear out white line dividers from general utility group layout */
        
        .pastel-chat-env .nxi-shell {
          background: rgba(255,255,255,0.4) !important;
          border-top: 1px solid rgba(255,183,178,0.4) !important;
          backdrop-filter: blur(14px) !important;
        }
        .pastel-chat-env .nxi-textarea {
          background: rgba(255,255,255,0.6) !important;
          border: 1px solid rgba(255,183,178,0.5) !important;
          color: #8b5a2b !important;
          border-radius: 18px !important;
        }
        .pastel-chat-env .nxi-textarea:focus {
          border-color: #ffb7b2 !important; box-shadow: 0 0 10px rgba(255,183,178,0.5) !important;
        }
        .pastel-chat-env .nxi-send.ready {
          background: rgba(255,255,255,0.85) !important;
          color: #8b5a2b !important;
          box-shadow: 4px 4px 10px rgba(255,183,178,0.3), inset 2px 2px 4px rgba(255,255,255,1) !important;
          border-radius: 50% !important;
        }
        .pastel-chat-env .nxi-tool-btn, .pastel-chat-env .nxi-mic { color: #8b5a2b !important; }

        /* Bubbles */
        .pastel-chat-env .msg-bubble-mine { 
          background: rgba(255,255,255,0.8) !important; 
          border: 1px solid rgba(255,183,178,0.6) !important; 
          color: #8b5a2b !important;
          box-shadow: 4px 4px 10px rgba(255,183,178,0.2) !important;
        }
        .pastel-chat-env .msg-bubble-other { 
          background: rgba(255,255,255,0.5) !important; 
          border: 1px solid rgba(255,255,255,0.8) !important; 
          color: #8b5a2b !important;
        }

        /* Responsive Overrides */
        @media (max-width: 768px) {
          .pastel-main-container { flex-direction: column !important; }
          .pastel-main-container.chat-inactive { overflow-y: auto; }
          .pastel-sidebar { width: 100% !important; max-width: 100% !important; border-right: none !important; border-bottom: 1px solid rgba(255,183,178,0.4); flex: none !important; }
          .pastel-sidebar.chat-active { display: none !important; }
          .pastel-chat-wrapper { min-height: 600px; }
        }
      `}</style>


      <style>{`
        @keyframes float {
          0%,100%{ transform:translateY(0); }
          50%{ transform:translateY(-6px); }
        }
        *{ box-sizing:border-box; }
        button:focus{ outline:none; }
        ::-webkit-scrollbar{ width:4px; }
        ::-webkit-scrollbar-thumb{ background:rgba(200,169,212,0.4); border-radius:99px; }

        /* ── Pastel Dream Chat Theme ── */
        .pastel-chat-env .nexus-chat-container {
          background: rgba(255,255,255,0.6) !important;
          backdrop-filter: blur(20px) !important;
          border-radius: 30px !important; /* heavy border radius */
          overflow: hidden !important;
          border: 1px solid rgba(255,255,255,0.8) !important;
          box-shadow: 0 10px 40px rgba(255,150,200,0.1) !important;
        }
        .pastel-chat-env .nxc-messages {
          background-color: transparent !important;
          background-image: 
            radial-gradient(circle at 10% 20%, rgba(200, 180, 255, 0.4) 0%, transparent 60%),
            radial-gradient(circle at 90% 80%, rgba(180, 255, 200, 0.4) 0%, transparent 60%) !important;
        }
        .pastel-chat-env .nexus-chat-header { 
          background: rgba(255,255,255,0.4) !important; 
          border-bottom: 1px solid rgba(255,183,178,0.4) !important;
          backdrop-filter: blur(14px) !important;
          color: #8b5a2b !important; /* Coffee brown */
        }
        .pastel-chat-env .nexus-chat-header .nxc-name { color: #8b5a2b !important; font-weight: 800 !important; }
        .pastel-chat-env .nxc-utility-group, .pastel-chat-env .nxc-telemetry-capsule {
          background: transparent !important; border: none !important; box-shadow: none !important;
          color: #8b5a2b !important;
        }
        /* Claymorphic Buttons */
        .pastel-chat-env .nxc-hbtn, .pastel-chat-env .nxc-aero-btn {
          background: rgba(255,255,255,0.85) !important;
          border-radius: 50% !important;
          box-shadow: 4px 4px 10px rgba(255,183,178,0.3), -4px -4px 10px rgba(255,255,255,0.8), inset 2px 2px 4px rgba(255,255,255,1), inset -4px -4px 4px rgba(255,183,178,0.15) !important;
          color: #8b5a2b !important; 
          transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275) !important;
        }
        .pastel-chat-env .nxc-hbtn:hover, .pastel-chat-env .nxc-aero-btn:hover {
          transform: scale(1.15) !important; /* Popping */
          box-shadow: 6px 6px 12px rgba(255,183,178,0.35), -6px -6px 12px rgba(255,255,255,0.9), inset 2px 2px 4px rgba(255,255,255,1), inset -2px -2px 4px rgba(255,183,178,0.15) !important;
        }
        .pastel-chat-env .nxc-signal-bars .nxc-bar,
        .pastel-chat-env .text-[#5dcaa5] {
          background-color: #8b5a2b !important; /* Using coffee brown to keep grounded */
          color: #8b5a2b !important;
          text-shadow: none !important;
        }
        .pastel-chat-env .bg-white\\/20 { display: none !important; } /* Clear out white line dividers from general utility group layout */
        
        .pastel-chat-env .nxi-shell {
          background: rgba(255,255,255,0.4) !important;
          border-top: 1px solid rgba(255,183,178,0.4) !important;
          backdrop-filter: blur(14px) !important;
        }
        .pastel-chat-env .nxi-textarea {
          background: rgba(255,255,255,0.6) !important;
          border: 1px solid rgba(255,183,178,0.5) !important;
          color: #8b5a2b !important;
          border-radius: 18px !important;
        }
        .pastel-chat-env .nxi-textarea:focus {
          border-color: #ffb7b2 !important; box-shadow: 0 0 10px rgba(255,183,178,0.5) !important;
        }
        .pastel-chat-env .nxi-send.ready {
          background: rgba(255,255,255,0.85) !important;
          color: #8b5a2b !important;
          box-shadow: 4px 4px 10px rgba(255,183,178,0.3), inset 2px 2px 4px rgba(255,255,255,1) !important;
          border-radius: 50% !important;
        }
        .pastel-chat-env .nxi-tool-btn, .pastel-chat-env .nxi-mic { color: #8b5a2b !important; }

        /* Bubbles */
        .pastel-chat-env .msg-bubble-mine { 
          background: rgba(255,255,255,0.8) !important; 
          border: 1px solid rgba(255,183,178,0.6) !important; 
          color: #8b5a2b !important;
          box-shadow: 4px 4px 10px rgba(255,183,178,0.2) !important;
        }
        .pastel-chat-env .msg-bubble-other { 
          background: rgba(255,255,255,0.5) !important; 
          border: 1px solid rgba(255,255,255,0.8) !important; 
          color: #8b5a2b !important;
        }

        /* Responsive Overrides */
        @media (max-width: 768px) {
          .pastel-main-container { flex-direction: column !important; }
          .pastel-main-container.chat-inactive { overflow-y: auto; }
          .pastel-sidebar { width: 100% !important; max-width: 100% !important; border-right: none !important; border-bottom: 1px solid rgba(255,183,178,0.4); flex: none !important; }
          .pastel-sidebar.chat-active { display: none !important; }
          .pastel-chat-wrapper { min-height: 600px; }
        }
      `}</style>

      <SparkleClick />
      <BgClouds />
      <Floaties />
      <TopNav navRef={navRef} authUser={authUser} handleLogout={handleLogout} loggingOut={loggingOut} hiddenNexuses={hiddenNexuses} onReveal={onReveal} />

      <div className={`pastel-main-container ${nexusSelected || selectedUser ? 'chat-active' : 'chat-inactive'}`} style={{ position: "absolute", top: 50, left: 0, right: 0, bottom: 0, display: "flex" }}>
        <Sidebar
          sidebarRef={sidebarRef}
          nexuses={nexuses}
          isNexusesLoading={isNexusesLoading}
          setSelectedNexus={setSelectedNexus}
          selectedNexus={selectedNexus}
          users={users || []}
          setSelectedUser={setSelectedUser}
          selectedUser={selectedUser}
          nexusUnread={nexusUnread || {}}
          setNexusActionView={setNexusActionView}
          hiddenNexuses={hiddenNexuses}
          toggleHide={toggleHide}
        />

        <div className="pastel-chat-wrapper" style={{ flex: 1, position: "relative", overflow: "hidden" }}>
          {nexusActionView && (
            <div style={{ position: "absolute", inset: 0, zIndex: 100 }}>
              <NexusActionOverlay
                mode={nexusActionView}
                onClose={() => setNexusActionView(null)}
                inline={true}
              />
            </div>
          )}
          <div style={{ height: "100%", display: "flex", flexDirection: "column", position: "relative" }}>
            {children ? children : nexusActionView ? (
              <div style={{ position: "absolute", inset: 0, zIndex: 100 }}>
                <NexusActionOverlay mode={nexusActionView} onClose={() => setNexusActionView(null)} inline={true} />
              </div>
            ) : nexusSelected ? (
              <div className="pastel-chat-env" style={{ position: "absolute", inset: 0, zIndex: 10, display: "flex", flexDirection: "column" }}>
                <UniversalChatContainer key={selectedNexus?._id || selectedNexusId} type="nexus" />
              </div>
            ) : selectedUser ? (
              <div className="pastel-chat-env" style={{ position: "absolute", inset: 0, zIndex: 10, display: "flex", flexDirection: "column" }}>
                <UniversalChatContainer key={selectedUser?._id} type="dm" />
              </div>
            ) : (
              <div style={{ padding: "20px 26px 18px 26px", height: "100%", display: "flex", flexDirection: "column", gap: 16, overflowY: "auto" }}>
                {/* Hero */}
                <div ref={heroRef}>
                  <StatusPill />
                  <HeroTitle />
                  <p style={{ margin: 0, fontSize: 11.5, color: "rgba(170,100,150,0.7)", letterSpacing: "0.02em" }}>
                    Choose a pathway to begin your mission. ✨
                  </p>
                </div>

                {/* Grid */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, flex: 1 }}>
                  <SpotifyCard cardRef={c0} />
                  <FeatureCard cfg={CARDS[0]} cardRef={c1} />
                  <FeatureCard cfg={CARDS[1]} cardRef={c2} />
                  <FeatureCard cfg={CARDS[2]} cardRef={c3} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function PastelProfile() {
  const navigate = useNavigate();
  const { authUser, isUpdatingProfile, updateProfile } = useAuthStore();

  const [profileDraft, setProfileDraft] = useState({
    username: "",
    email: "",
    bio: "",
    profilePic: "",
  });
  const [selectedImg, setSelectedImg] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!authUser) return;
    setProfileDraft({
      username: authUser.username || "",
      email: authUser.email || "",
      bio: authUser.bio || "",
      profilePic: authUser.profilePic || "",
    });
  }, [authUser]);

  const hasChanges = useMemo(() => {
    if (!authUser) return false;
    return (
      profileDraft.username !== authUser.username ||
      profileDraft.email !== authUser.email ||
      profileDraft.bio !== (authUser.bio || "") ||
      selectedImg !== null
    );
  }, [profileDraft, authUser, selectedImg]);

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      setSelectedImg(reader.result);
      setProfileDraft(p => ({ ...p, profilePic: reader.result }));
    };
  };

  const handleSave = async () => {
    if (!profileDraft.username.trim() || !profileDraft.email.trim()) return;
    const payload = {
      username: profileDraft.username.trim(),
      email: profileDraft.email.trim(),
      bio: profileDraft.bio,
    };
    if (selectedImg) payload.profilePic = selectedImg;
    await updateProfile(payload);
    setIsEditing(false);
    setSelectedImg(null);
  };

  if (!authUser) return <div style={{ padding: 40, color: "#d060a8", textAlign: "center" }}>Loading magical profile... ✨</div>;

  return (
    <div style={{ position: "relative", width: "100%", height: "100vh", background: "linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%)", overflow: "hidden", fontFamily: "'Nunito', sans-serif" }}>
      {/* Background decorations */}
      <BgClouds />
      <Floaties />
      <SparkleClick />

      {/* Top Nav */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 70, display: "flex", alignItems: "center", padding: "0 40px", background: "rgba(255,255,255,0.4)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(255,255,255,0.6)", zIndex: 50 }}>
        <button onClick={() => navigate("/")} style={{ background: "rgba(255,255,255,0.8)", border: "2px solid rgba(255,183,178,0.5)", color: "#d060a8", padding: "10px 20px", borderRadius: 25, cursor: "pointer", fontWeight: 800, fontSize: 13, boxShadow: "0 4px 15px rgba(255,183,178,0.2)", display: "flex", alignItems: "center", gap: 8, transition: "transform 0.2s" }} onMouseEnter={e => e.currentTarget.style.transform = "scale(1.05)"} onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>
          <span>◀</span> BACK TO DREAMLAND
        </button>
        <div style={{ flex: 1 }} />
        <div style={{ background: "rgba(255,255,255,0.6)", padding: "8px 20px", borderRadius: 20, color: "#d060a8", fontSize: 16, fontWeight: 800, letterSpacing: 1, border: "2px solid rgba(255,255,255,0.9)", boxShadow: "0 4px 15px rgba(230,190,220,0.3)" }}>
          {authUser.username}'s Profile 🌸
        </div>
      </div>

      <div style={{ position: "absolute", top: 70, bottom: 0, left: 0, right: 0, display: "flex", alignItems: "center", justifyContent: "center", padding: 40, zIndex: 10 }}>

        {/* Wrapper for Card + Animals so they scale and position together */}
        <div style={{ position: "relative", width: "100%", maxWidth: 1100, height: "100%", maxHeight: 650 }}>

          {/* Peeking Animals */}
          <div style={{ position: "absolute", top: -30, right: 80, fontSize: 50, animation: "peekTop 4s ease-in-out infinite", zIndex: 0, filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.1))" }}>🐱</div>
          <div style={{ position: "absolute", bottom: -30, left: 60, fontSize: 55, animation: "peekBottom 5s ease-in-out infinite 1s", zIndex: 0, filter: "drop-shadow(0 -4px 6px rgba(0,0,0,0.1))" }}>🐰</div>
          <div style={{ position: "absolute", top: -25, left: 240, fontSize: 45, animation: "peekTop 6s ease-in-out infinite 0.5s", zIndex: 0, filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.1))" }}>🐻</div>
          <div style={{ position: "absolute", top: "50%", right: -25, fontSize: 45, animation: "peekRight 4.5s ease-in-out infinite 2s", zIndex: 0, filter: "drop-shadow(-4px 0 6px rgba(0,0,0,0.1))" }}>🐸</div>

          <style>{`
            @keyframes peekTop {
              0%, 100% { transform: translateY(15px) rotate(10deg); opacity: 0.9; }
              50% { transform: translateY(-5px) rotate(-5deg); opacity: 1; }
            }
            @keyframes peekBottom {
              0%, 100% { transform: translateY(-15px) rotate(-10deg); opacity: 0.9; }
              50% { transform: translateY(5px) rotate(5deg); opacity: 1; }
            }
            @keyframes peekRight {
              0%, 100% { transform: translateX(-15px) rotate(-90deg); opacity: 0.9; }
              50% { transform: translateX(5px) rotate(-85deg); opacity: 1; }
            }
            @keyframes avatarPulse {
              0%, 100% { transform: scale(1); box-shadow: 0 15px 35px rgba(200,150,180,0.3); }
              50% { transform: scale(1.03); box-shadow: 0 20px 45px rgba(244,114,182,0.5); }
            }
          `}</style>

          {/* Main Horizontal Container */}
          <div style={{ position: "absolute", inset: 0, display: "flex", background: "rgba(255,255,255,0.65)", backdropFilter: "blur(25px)", borderRadius: 40, border: "3px solid rgba(255,255,255,0.9)", boxShadow: "0 25px 60px rgba(230,190,220,0.5)", overflow: "hidden", zIndex: 10 }}>

            {/* Left Column: Avatar & Quick Info */}
            <div style={{ width: 400, background: "linear-gradient(180deg, rgba(255,230,240,0.6) 0%, rgba(240,220,255,0.6) 100%)", padding: "40px 30px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", borderRight: "3px solid rgba(255,255,255,0.7)", position: "relative" }}>

              <div style={{ position: "relative", marginBottom: 20 }}>
                <div style={{ width: 190, height: 190, borderRadius: "50%", background: "linear-gradient(135deg, #fff, #fdebf3)", padding: 8, animation: isEditing ? "none" : "avatarPulse 3s infinite" }}>
                  <img src={profileDraft.profilePic || "/avatar.png"} alt="Avatar" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(244,114,182,0.2)" }} />
                </div>
                <label style={{ position: "absolute", bottom: 8, right: 8, background: "linear-gradient(135deg, #f472b6, #c084fc)", color: "#fff", width: 48, height: 48, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: isEditing ? "pointer" : "not-allowed", opacity: isEditing ? 1 : 0.6, border: "4px solid #fff", boxShadow: "0 4px 15px rgba(244,114,182,0.5)", fontSize: 22, transition: "transform 0.2s" }} onMouseEnter={e => { if (isEditing) e.currentTarget.style.transform = "scale(1.1) rotate(10deg)" }} onMouseLeave={e => { if (isEditing) e.currentTarget.style.transform = "scale(1) rotate(0deg)" }}>
                  📸
                  <input type="file" style={{ display: "none" }} onChange={handleImageUpload} disabled={!isEditing || isUpdatingProfile} />
                </label>
              </div>

              <h3 style={{ margin: "0 0 8px 0", fontSize: 32, color: "#a855f7", fontWeight: 900, textShadow: "0 2px 5px rgba(168,85,247,0.2)" }}>{authUser.username}</h3>
              <p style={{ margin: 0, color: "#d060a8", fontSize: 14, fontWeight: 800, background: "rgba(255,255,255,0.8)", padding: "6px 20px", borderRadius: 25, border: "2px solid rgba(255,255,255,0.9)", boxShadow: "0 4px 15px rgba(200,150,180,0.15)" }}>Status: Magical ✨</p>

              <div style={{ marginTop: 30, width: "100%", display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ background: "rgba(255,255,255,0.5)", borderRadius: 20, padding: "12px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid rgba(255,255,255,0.8)", boxShadow: "inset 0 2px 5px rgba(255,255,255,0.5)" }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: "#d060a8" }}>🎀 Charm Level</span>
                  <span style={{ fontSize: 14, fontWeight: 900, color: "#a855f7" }}>9,999</span>
                </div>
                <div style={{ background: "rgba(255,255,255,0.5)", borderRadius: 20, padding: "12px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid rgba(255,255,255,0.8)", boxShadow: "inset 0 2px 5px rgba(255,255,255,0.5)" }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: "#d060a8" }}>☁️ Cloud Jumps</span>
                  <span style={{ fontSize: 14, fontWeight: 900, color: "#a855f7" }}>42</span>
                </div>
              </div>

              <div style={{ marginTop: "auto", width: "100%", paddingTop: 20 }}>
                <button onClick={() => setIsEditing(!isEditing)} style={{ width: "100%", padding: 16, background: isEditing ? "linear-gradient(135deg, #c084fc, #a855f7)" : "rgba(255,255,255,0.9)", color: isEditing ? "#fff" : "#c084fc", border: isEditing ? "none" : "3px solid #c084fc", borderRadius: 25, fontWeight: 900, fontSize: 16, cursor: "pointer", transition: "all 0.3s", boxShadow: "0 8px 25px rgba(192,132,252,0.3)", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                  {isEditing ? "✨ VIEW MAGICAL PROFILE" : "🌸 EDIT PROFILE"}
                </button>
              </div>
            </div>

            {/* Right Column: Form Fields */}
            <div style={{ flex: 1, padding: "40px 50px", display: "flex", flexDirection: "column", justifyContent: "center", overflowY: "auto", position: "relative" }}>

              <div style={{ marginBottom: 20, position: "relative", zIndex: 1 }}>
                <h2 style={{ fontSize: 40, margin: "0 0 10px 0", color: "#d060a8", fontWeight: 900, textShadow: "0 4px 15px rgba(208,96,168,0.2)" }}>Identity Details</h2>
                <p style={{ margin: 0, color: "#a855f7", fontSize: 17, fontWeight: 700 }}>Sprinkle some magic on your persona! 🪄</p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 16, position: "relative", zIndex: 1 }}>
                <div>
                  <label style={{ display: "block", fontSize: 14, fontWeight: 900, color: "#d060a8", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 6 }}>Persona Name</label>
                  <input
                    value={profileDraft.username}
                    onChange={e => setProfileDraft({ ...profileDraft, username: e.target.value })}
                    disabled={!isEditing}
                    style={{ width: "100%", padding: "12px 18px", background: isEditing ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.5)", border: "3px solid rgba(244,114,182,0.3)", borderRadius: 20, color: "#a855f7", fontSize: 18, fontWeight: 800, outline: "none", transition: "all 0.3s", boxShadow: isEditing ? "inset 0 4px 10px rgba(244,114,182,0.1), 0 4px 15px rgba(255,255,255,0.5)" : "none" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 14, fontWeight: 900, color: "#d060a8", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 6 }}>Magical Mail (Email)</label>
                  <input
                    value={profileDraft.email}
                    onChange={e => setProfileDraft({ ...profileDraft, email: e.target.value })}
                    disabled={!isEditing}
                    style={{ width: "100%", padding: "12px 18px", background: isEditing ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.5)", border: "3px solid rgba(244,114,182,0.3)", borderRadius: 20, color: "#a855f7", fontSize: 18, fontWeight: 800, outline: "none", transition: "all 0.3s", boxShadow: isEditing ? "inset 0 4px 10px rgba(244,114,182,0.1), 0 4px 15px rgba(255,255,255,0.5)" : "none" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 14, fontWeight: 900, color: "#d060a8", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 6 }}>Dreamy Bio</label>
                  <textarea
                    value={profileDraft.bio}
                    onChange={e => setProfileDraft({ ...profileDraft, bio: e.target.value })}
                    disabled={!isEditing}
                    rows={3}
                    style={{ width: "100%", padding: "12px 18px", background: isEditing ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.5)", border: "3px solid rgba(244,114,182,0.3)", borderRadius: 20, color: "#a855f7", fontSize: 18, fontWeight: 800, outline: "none", resize: "none", transition: "all 0.3s", boxShadow: isEditing ? "inset 0 4px 10px rgba(244,114,182,0.1), 0 4px 15px rgba(255,255,255,0.5)" : "none" }}
                  />
                </div>
              </div>

              {isEditing && (
                <div style={{ marginTop: 20, display: "flex", gap: 20, justifyContent: "flex-end", position: "relative", zIndex: 1 }}>
                  <button
                    onClick={() => {
                      setProfileDraft({ username: authUser.username || "", email: authUser.email || "", bio: authUser.bio || "", profilePic: authUser.profilePic || "" });
                      setSelectedImg(null);
                      setIsEditing(false);
                    }}
                    style={{ padding: "16px 32px", background: "rgba(255,255,255,0.5)", border: "3px solid #f472b6", color: "#f472b6", borderRadius: 30, fontWeight: 900, fontSize: 15, cursor: "pointer", transition: "all 0.2s", backdropFilter: "blur(10px)" }}
                    onMouseEnter={e => { e.currentTarget.style.background = "rgba(244,114,182,0.15)" }}
                    onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.5)" }}
                  >
                    CANCEL
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={!hasChanges || isUpdatingProfile}
                    style={{ padding: "16px 40px", background: hasChanges ? "linear-gradient(90deg, #f472b6, #c084fc)" : "#e2e8f0", border: "none", color: "#fff", borderRadius: 30, fontWeight: 900, fontSize: 15, cursor: hasChanges ? "pointer" : "default", boxShadow: hasChanges ? "0 10px 30px rgba(192,132,252,0.5)" : "none", transition: "all 0.2s" }}
                    onMouseEnter={e => { if (hasChanges) e.currentTarget.style.transform = "translateY(-3px)" }}
                    onMouseLeave={e => { if (hasChanges) e.currentTarget.style.transform = "translateY(0)" }}
                  >
                    {isUpdatingProfile ? "SAVING MAGIC..." : "SAVE CHANGES ✨"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PastelSettings({
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

  const tabs = [
    { id: "profile", label: "Identity", icon: "🌸" },
    { id: "sound", label: "Acoustics", icon: "🎵" },
    { id: "appearance", label: "Aesthetics", icon: "🎀" },
    { id: "animations", label: "Motion", icon: "💨" },
    { id: "notifications", label: "Alerts", icon: "🔔" },
    { id: "orbit", label: "Magic Rules", icon: "✨" },
    { id: "security", label: "Protection", icon: "🛡️" }
  ];

  return (
    <div style={{ position: "relative", width: "100%", height: "100vh", background: "linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%)", overflow: "hidden", fontFamily: "'Nunito', sans-serif" }}>
      <BgClouds />
      <Floaties />
      <SparkleClick />

      {/* Top Nav */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 70, display: "flex", alignItems: "center", padding: "0 40px", background: "rgba(255,255,255,0.4)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(255,255,255,0.6)", zIndex: 50 }}>
        <button onClick={() => navigate("/")} style={{ background: "rgba(255,255,255,0.8)", border: "2px solid rgba(255,183,178,0.5)", color: "#d060a8", padding: "10px 20px", borderRadius: 25, cursor: "pointer", fontWeight: 800, fontSize: 13, boxShadow: "0 4px 15px rgba(255,183,178,0.2)", display: "flex", alignItems: "center", gap: 8, transition: "transform 0.2s" }} onMouseEnter={e => e.currentTarget.style.transform = "scale(1.05)"} onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>
          <span>◀</span> BACK TO DREAMLAND
        </button>
        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={handleReset} disabled={!isDirty} style={{ padding: "8px 24px", background: "rgba(255,255,255,0.6)", border: "2px solid #f472b6", color: "#f472b6", borderRadius: 20, fontWeight: 800, fontSize: 13, cursor: isDirty ? "pointer" : "default", opacity: isDirty ? 1 : 0.5 }}>
            RESET MAGIC
          </button>
          <button onClick={() => handleSave()} disabled={!isDirty} style={{ padding: "8px 24px", background: isDirty ? "linear-gradient(90deg, #f472b6, #c084fc)" : "rgba(255,255,255,0.8)", border: "none", color: isDirty ? "#fff" : "#cbd5e1", borderRadius: 20, fontWeight: 800, fontSize: 13, cursor: isDirty ? "pointer" : "default", boxShadow: isDirty ? "0 4px 15px rgba(192,132,252,0.4)" : "none" }}>
            SAVE DREAMS ✨
          </button>
        </div>
      </div>

      <div style={{ position: "absolute", top: 70, bottom: 0, left: 0, right: 0, display: "flex", alignItems: "center", justifyContent: "center", padding: "30px 40px", zIndex: 10 }}>
        <div style={{ position: "relative", width: "100%", maxWidth: 1100, height: "100%", maxHeight: 650 }}>
          {/* Peeking Animals */}
          <div style={{ position: "absolute", top: -30, right: 100, fontSize: 50, animation: "peekTop 4s ease-in-out infinite", zIndex: 0, filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.1))" }}>🐶</div>
          <div style={{ position: "absolute", bottom: -30, left: 100, fontSize: 55, animation: "peekBottom 5s ease-in-out infinite 1s", zIndex: 0, filter: "drop-shadow(0 -4px 6px rgba(0,0,0,0.1))" }}>🐼</div>
          <div style={{ position: "absolute", top: "50%", right: -25, fontSize: 45, animation: "peekRight 4.5s ease-in-out infinite 2s", zIndex: 0, filter: "drop-shadow(-4px 0 6px rgba(0,0,0,0.1))" }}>🦊</div>

          <style>{`
            @keyframes peekTop {
              0%, 100% { transform: translateY(15px) rotate(10deg); opacity: 0.9; }
              50% { transform: translateY(-5px) rotate(-5deg); opacity: 1; }
            }
            @keyframes peekBottom {
              0%, 100% { transform: translateY(-15px) rotate(-10deg); opacity: 0.9; }
              50% { transform: translateY(5px) rotate(5deg); opacity: 1; }
            }
            @keyframes peekRight {
              0%, 100% { transform: translateX(-15px) rotate(-90deg); opacity: 0.9; }
              50% { transform: translateX(5px) rotate(-85deg); opacity: 1; }
            }
          `}</style>

          {/* Main Horizontal Container */}
          <div style={{ position: "absolute", inset: 0, display: "flex", background: "rgba(255,255,255,0.65)", backdropFilter: "blur(25px)", borderRadius: 40, border: "3px solid rgba(255,255,255,0.9)", boxShadow: "0 25px 60px rgba(230,190,220,0.5)", overflow: "hidden", zIndex: 10 }}>

            {/* Sidebar */}
            <div style={{ width: 300, background: "linear-gradient(180deg, rgba(255,240,245,0.6) 0%, rgba(245,230,255,0.6) 100%)", padding: "40px 30px", display: "flex", flexDirection: "column", gap: 12, borderRight: "3px solid rgba(255,255,255,0.7)" }}>
              <h2 style={{ fontSize: 26, fontWeight: 900, color: "#d060a8", paddingLeft: 12, marginBottom: 20 }}>Settings 🎀</h2>
              {tabs.map(t => (
                <button key={t.id} onClick={() => setActiveSection(t.id)} style={{ padding: "16px 20px", background: activeSection === t.id ? "rgba(255,255,255,0.9)" : "transparent", border: "none", borderRadius: 20, color: activeSection === t.id ? "#a855f7" : "#d060a8", fontSize: 16, fontWeight: 800, textAlign: "left", display: "flex", alignItems: "center", gap: 16, cursor: "pointer", transition: "all 0.2s", boxShadow: activeSection === t.id ? "0 4px 15px rgba(200,150,180,0.2)" : "none" }}>
                  <span style={{ fontSize: 22 }}>{t.icon}</span> {t.label}
                </button>
              ))}
            </div>

            {/* Content Area */}
            <div style={{ flex: 1, padding: "50px 60px", overflowY: "auto", position: "relative" }}>
              <h2 style={{ fontSize: 36, fontWeight: 900, color: "#a855f7", marginBottom: 30, textShadow: "0 2px 10px rgba(168,85,247,0.2)" }}>
                {tabs.find(t => t.id === activeSection)?.label}
              </h2>

              {/* ANIMATIONS */}
              {activeSection === "animations" && (
                <AnimationSettingsPanel isPastel={true} />
              )}

              {/* PROFILE */}
              {activeSection === "profile" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 14, fontWeight: 900, color: "#d060a8", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 8 }}>Persona Name</label>
                    <input
                      value={draftDisplayName} onChange={e => setDraftDisplayName(e.target.value)}
                      style={{ width: "100%", padding: "16px 24px", background: "rgba(255,255,255,0.6)", border: "3px solid rgba(244,114,182,0.3)", borderRadius: 25, color: "#a855f7", fontSize: 18, fontWeight: 800, outline: "none", transition: "all 0.3s", boxShadow: "inset 0 4px 10px rgba(244,114,182,0.05)" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 14, fontWeight: 900, color: "#d060a8", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 8 }}>Dreamy Bio</label>
                    <textarea
                      value={draftBio} onChange={e => setDraftBio(e.target.value)} rows={4}
                      style={{ width: "100%", padding: "16px 24px", background: "rgba(255,255,255,0.6)", border: "3px solid rgba(244,114,182,0.3)", borderRadius: 25, color: "#a855f7", fontSize: 18, fontWeight: 800, outline: "none", resize: "none", transition: "all 0.3s", boxShadow: "inset 0 4px 10px rgba(244,114,182,0.05)" }}
                    />
                  </div>
                </div>
              )}

              {/* APPEARANCE */}
              {activeSection === "appearance" && (
                <div>
                  <label style={{ display: "block", fontSize: 14, fontWeight: 900, color: "#d060a8", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 20 }}>Select Your World</label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                    {THEMES.map(th => (
                      <div key={th} onClick={() => setDraftTheme(th)} style={{ padding: "20px", background: draftTheme === th ? "linear-gradient(135deg, #f472b6, #c084fc)" : "rgba(255,255,255,0.6)", borderRadius: 25, border: draftTheme === th ? "none" : "3px solid rgba(244,114,182,0.3)", color: draftTheme === th ? "#fff" : "#a855f7", fontSize: 16, fontWeight: 800, cursor: "pointer", transition: "all 0.2s", boxShadow: draftTheme === th ? "0 8px 20px rgba(192,132,252,0.4)" : "none", textAlign: "center" }}>
                        {THEME_LABELS[th] || th}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SOUND */}
              {activeSection === "sound" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                  <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "24px 30px", background: "rgba(255,255,255,0.6)", borderRadius: 25, border: "3px solid rgba(244,114,182,0.2)", cursor: "pointer" }}>
                    <div style={{ color: "#d060a8", fontWeight: 800, fontSize: 17 }}>Magical Sound Effects 🎵</div>
                    <input type="checkbox" checked={draftSoundSettings.effectsEnabled} onChange={e => { const v = e.target.checked; setDraftSoundSettings({ ...draftSoundSettings, effectsEnabled: v }); try { useSettingsStore.getState().updateSetting('sound.effectsEnabled', v); } catch (_) {} }} style={{ width: 26, height: 26, accentColor: "#f472b6", cursor: "pointer" }} />
                  </label>
                  <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "24px 30px", background: "rgba(255,255,255,0.6)", borderRadius: 25, border: "3px solid rgba(244,114,182,0.2)", cursor: "pointer" }}>
                    <div style={{ color: "#d060a8", fontWeight: 800, fontSize: 17 }}>Message Chimes 📩</div>
                    <input type="checkbox" checked={draftSoundSettings.messageSound} onChange={e => { const v = e.target.checked; setDraftSoundSettings({ ...draftSoundSettings, messageSound: v }); try { useSettingsStore.getState().updateSetting('sound.notificationEnabled', v); } catch (_) {} }} style={{ width: 26, height: 26, accentColor: "#f472b6", cursor: "pointer" }} />
                  </label>
                  <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "24px 30px", background: "rgba(255,255,255,0.6)", borderRadius: 25, border: "3px solid rgba(244,114,182,0.2)", cursor: "pointer" }}>
                    <div style={{ color: "#d060a8", fontWeight: 800, fontSize: 17 }}>Click Sparkles ✨</div>
                    <input type="checkbox" checked={draftSoundSettings.clickSound} onChange={e => { const v = e.target.checked; setDraftSoundSettings({ ...draftSoundSettings, clickSound: v }); try { useSettingsStore.getState().updateSetting('sound.clickEnabled', v); } catch (_) {} }} style={{ width: 26, height: 26, accentColor: "#f472b6", cursor: "pointer" }} />
                  </label>

                </div>
              )}

              {/* NOTIFICATIONS */}
              {activeSection === "notifications" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                  <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "24px 30px", background: "rgba(255,255,255,0.6)", borderRadius: 25, border: "3px solid rgba(244,114,182,0.2)", cursor: "pointer" }}>
                    <div style={{ color: "#d060a8", fontWeight: 800, fontSize: 17 }}>Desktop Alerts 🖥️</div>
                    <input type="checkbox" checked={draftNotifications.desktop} onChange={e => { const v = e.target.checked; setDraftNotifications({ ...draftNotifications, desktop: v }); try { useSettingsStore.getState().updateSetting('notifications.desktopEnabled', v); } catch (_) {} }} style={{ width: 26, height: 26, accentColor: "#f472b6", cursor: "pointer" }} />
                  </label>
                  <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "24px 30px", background: "rgba(255,255,255,0.6)", borderRadius: 25, border: "3px solid rgba(244,114,182,0.2)", cursor: "pointer" }}>
                    <div style={{ color: "#d060a8", fontWeight: 800, fontSize: 17 }}>Sound Alerts 🔊</div>
                    <input type="checkbox" checked={draftNotifications.sound} onChange={e => { const v = e.target.checked; setDraftNotifications({ ...draftNotifications, sound: v }); try { useSettingsStore.getState().updateSetting('notifications.soundEnabled', v); } catch (_) {} }} style={{ width: 26, height: 26, accentColor: "#f472b6", cursor: "pointer" }} />
                  </label>
                </div>
              )}

              {/* ORBIT */}
              {activeSection === "orbit" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                  <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "24px 30px", background: "rgba(255,255,255,0.6)", borderRadius: 25, border: "3px solid rgba(244,114,182,0.2)", cursor: "pointer" }}>
                    <div style={{ color: "#d060a8", fontWeight: 800, fontSize: 17 }}>Show Friendship Rings 🪐</div>
                    <input type="checkbox" checked={draftOrbitBehavior.showRings} onChange={e => setDraftOrbitBehavior({ ...draftOrbitBehavior, showRings: e.target.checked })} style={{ width: 26, height: 26, accentColor: "#f472b6", cursor: "pointer" }} />
                  </label>
                  <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "24px 30px", background: "rgba(255,255,255,0.6)", borderRadius: 25, border: "3px solid rgba(244,114,182,0.2)", cursor: "pointer" }}>
                    <div style={{ color: "#d060a8", fontWeight: 800, fontSize: 17 }}>Auto-pause on Hover ⏸️</div>
                    <input type="checkbox" checked={draftOrbitBehavior.autoPauseOnHover} onChange={e => setDraftOrbitBehavior({ ...draftOrbitBehavior, autoPauseOnHover: e.target.checked })} style={{ width: 26, height: 26, accentColor: "#f472b6", cursor: "pointer" }} />
                  </label>
                </div>
              )}

              {/* SECURITY */}
              {activeSection === "security" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                  <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "24px 30px", background: "rgba(255,255,255,0.6)", borderRadius: 25, border: "3px solid rgba(244,114,182,0.2)", cursor: "pointer" }}>
                    <div style={{ color: "#d060a8", fontWeight: 800, fontSize: 17 }}>Show Online Status 🟢</div>
                    <input type="checkbox" checked={draftShowOnlineStatus} onChange={e => setDraftShowOnlineStatus(e.target.checked)} style={{ width: 26, height: 26, accentColor: "#f472b6", cursor: "pointer" }} />
                  </label>
                  <div style={{ marginTop: 20 }}>
                    <button style={{ padding: "18px 40px", background: "rgba(255,100,150,0.1)", border: "3px solid #ff7799", borderRadius: 30, color: "#ff7799", fontWeight: 900, fontSize: 16, cursor: "not-allowed", transition: "all 0.2s" }} onMouseEnter={e => e.currentTarget.style.background = "rgba(255,100,150,0.2)"} onMouseLeave={e => e.currentTarget.style.background = "rgba(255,100,150,0.1)"}>
                      CHANGE PASSWORD 🔒 (SOON)
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
