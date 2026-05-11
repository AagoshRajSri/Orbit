import { useState, useEffect, memo, useMemo, useRef } from "react";
import UniversalChatContainer from "../components/chat/UniversalChatContainer";
import { useNavigate } from "react-router-dom";
import { Music } from "lucide-react";

import { useAuthStore } from "../store/useAuthStore";
import { useSpotifyStore } from "../store/useSpotifyStore";
import { useSettingsStore } from "../store/useSettingsStore";
import { useNexusStore } from "../store/useNexusStore";
import { useChatStore } from "../store/useChatStore";
import { spotifyService } from "../services/spotifyService";
import { THEMES, THEME_LABELS } from "../constants";
import toast from "../lib/toast";

import AmoledThemeLayout from "../components/layout/themes/amoled/AmoledThemeLayout";
import ReusableSpotifyPlayer from "../components/spotify/ReusableSpotifyPlayer";
import "./styles/amoled.css";

const CSS = `
@keyframes oa-cw       { from{transform:rotate(0deg)}   to{transform:rotate(360deg)} }
@keyframes oa-ccw      { from{transform:rotate(360deg)} to{transform:rotate(0deg)} }
@keyframes oa-float    { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
@keyframes oa-wave     { 0%,100%{height:4px} 50%{height:24px} }
@keyframes oa-shimmer  { 0%{background-position:-200% center} 100%{background-position:200% center} }
@keyframes oa-scan     { 0%{top:-2px;opacity:1} 100%{top:100%;opacity:0} }
@keyframes oa-stream   { 0%{transform:translateY(-120px);opacity:0} 8%{opacity:1} 92%{opacity:1} 100%{transform:translateY(110vh);opacity:0} }
@keyframes oa-twinkle  { 0%,100%{opacity:.15;transform:scale(1)} 50%{opacity:1;transform:scale(1.6)} }
@keyframes oa-nebula   { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(18px,-14px) scale(1.05)} 66%{transform:translate(-14px,10px) scale(.95)} }
@keyframes oa-blink    { 0%,100%{opacity:1} 50%{opacity:0} }
@keyframes oa-borderglow { 0%,100%{box-shadow:0 0 10px rgba(198,160,110,.3),inset 0 0 10px rgba(198,160,110,.05)} 50%{box-shadow:0 0 26px rgba(198,160,110,.65),inset 0 0 20px rgba(198,160,110,.12)} }
@keyframes oa-progressfill { 0%{background-position:-200% 0} 100%{background-position:200% 0} }

.oa-orbitron { font-family:'Orbitron',sans-serif; }
.oa-mono     { font-family:'Share Tech Mono',monospace; }
.oa-raj      { font-family:'Rajdhani',sans-serif; }

.oa-shimmer-text {
  background:linear-gradient(90deg,#C6A06E 0%,#F0D5A0 38%,#C6A06E 58%,#8B6914 100%);
  background-size:200% auto;
  -webkit-background-clip:text; -webkit-text-fill-color:transparent;
  background-clip:text;
  animation:oa-shimmer 3s linear infinite;
}

.oa-card {
  background:rgba(15,15,15,.88);
  backdrop-filter:blur(22px);
  border:1.5px solid rgba(198,160,110,.18);
  border-radius:12px; position:relative; overflow:hidden;
  transition:all .45s cubic-bezier(.16,1,.3,1);
}
.oa-card:hover {
  border-color:rgba(198,160,110,.52);
  box-shadow:0 0 32px rgba(198,160,110,.14),0 0 64px rgba(198,160,110,.05);
  transform:translateY(-4px) scale(1.01);
}
.oa-bracket::before,.oa-bracket::after {
  content:''; position:absolute; width:13px; height:13px;
  border-color:rgba(198,160,110,.65); border-style:solid; z-index:10;
}
.oa-bracket::before { top:0; left:0; border-width:1.5px 0 0 1.5px; }
.oa-bracket::after  { bottom:0; right:0; border-width:0 1.5px 1.5px 0; }
.oa-scan::after {
  content:''; position:absolute; left:0; right:0; height:2px;
  background:linear-gradient(90deg,transparent,rgba(78,205,196,.45),transparent);
  animation:oa-scan 4s linear infinite; pointer-events:none;
}
.oa-scan { position:absolute; inset:0; pointer-events:none; overflow:hidden; border-radius:12px; }
.oa-progress-fill {
  background:linear-gradient(90deg,#C6A06E,#E8C990,#C6A06E);
  background-size:200% auto;
  animation:oa-progressfill 2.2s linear infinite;
  border-radius:2px; height:100%;
}
.oa-star {
  position:absolute; width:2px; height:2px;
  background:rgba(198,160,110,.45); border-radius:50%;
  animation:oa-twinkle ease-in-out infinite;
}
.oa-nebula {
  position:absolute; border-radius:50%;
  filter:blur(80px); pointer-events:none;
  animation:oa-nebula 16s ease-in-out infinite;
}
.oa-stream-char {
  position:absolute; font-family:'Share Tech Mono',monospace; font-size:11px;
  color:rgba(198,160,110,.16); pointer-events:none; user-select:none;
  animation:oa-stream linear infinite;
}
.oa-borderglow { animation:oa-borderglow 3.2s ease-in-out infinite; }
.oa-float      { animation:oa-float 4s ease-in-out infinite; }

/* ── Subtle Scrollbar ── */
::-webkit-scrollbar { width: 5px; height: 5px; }
::-webkit-scrollbar-track { background: #000; }
::-webkit-scrollbar-thumb { 
  background: rgba(198, 160, 110, 0.2); 
  border-radius: 0;
  border-left: 1px solid rgba(198,160,110,0.08);
}
::-webkit-scrollbar-thumb:hover { background: rgba(198, 160, 110, 0.4); }

.oa-scroll-hide::-webkit-scrollbar { display: none; }
.oa-scroll-hide { -ms-overflow-style: none; scrollbar-width: none; }

/* ── AMOLED Void Chat Theme ── */
.amoled-chat-env .nxc-shell {
  background: #000000 !important;
  border: none !important;
  box-shadow: 0 0 100px rgba(0,0,0,1) !important;
  background-image: radial-gradient(circle at 50% 0%, rgba(198,160,110,0.08) 0%, transparent 500px) !important;
}
.amoled-chat-env .nexus-chat-header { 
  background: #000000 !important; 
  border-bottom: none !important;
}
.amoled-chat-env .nexus-chat-header * { color: #C6A06E !important; font-family: 'Rajdhani', sans-serif !important; }
.amoled-chat-env .nexus-chat-header .nxc-name { font-family: 'Orbitron', sans-serif !important; letter-spacing: 2px !important; font-weight: 900 !important; text-shadow: 0 0 10px rgba(198,160,110,0.3); }

/* Pinned Banner Visibility */
.amoled-chat-env div[style*="background: var(--tag)"] {
  background: rgba(198,160,110,0.12) !important;
  border-bottom: 2px solid rgba(198,160,110,0.4) !important;
  backdrop-filter: blur(10px);
}
.amoled-chat-env div[style*="background: var(--tag)"] * {
  color: #F0D5A0 !important;
  font-weight: 600 !important;
}

.amoled-chat-env .nxc-utility-group, .amoled-chat-env .nxc-telemetry-capsule {
  background: rgba(198,160,110,0.08) !important;
  border: 1px solid rgba(198,160,110,0.2) !important;
  padding: 4px 8px !important;
  border-radius: 12px !important;
}
.amoled-chat-env .nxc-hbtn, .amoled-chat-env .nxc-aero-btn {
  background: transparent !important; color: #F0D5A0 !important; border: none !important;
  opacity: 0.9 !important; transition: all 0.2s;
}
.amoled-chat-env .nxc-hbtn:hover { transform: translateY(-1px); text-shadow: 0 0 10px #C6A06E; }

.amoled-chat-env .nxi-shell { 
  background: #000000 !important; 
  border-top: none !important;
  padding: 20px !important;
}
.amoled-chat-env .nxi-textarea-wrapper {
  background: rgba(198,160,110,0.03) !important;
  border: 1.5px solid rgba(198,160,110,0.5) !important;
  border-radius: 14px !important;
}
.amoled-chat-env .nxi-textarea { 
  background: transparent !important; 
  color: #F0D5A0 !important; 
  font-family: 'Share Tech Mono', monospace !important; 
  font-size: 15px !important;
}
.amoled-chat-env .nxi-textarea::placeholder {
  color: rgba(198,160,110,0.4) !important;
}

.amoled-chat-env .nxi-send.ready { 
  background: #C6A06E !important; 
  border: 1px solid #F0D5A0 !important;
  color: #000 !important;
  box-shadow: 0 0 20px rgba(198,160,110,0.5) !important;
}
.amoled-chat-env .nxi-tool-btn, .amoled-chat-env .nxi-mic { 
  color: #C6A06E !important; 
  opacity: 1 !important;
}

/* Empty State & Dividers */
.amoled-chat-env div[style*="textAlign: center"][style*="padding: 48px 0"] * {
  color: #F0D5A0 !important;
  opacity: 1 !important;
  font-weight: 700 !important;
  text-shadow: 0 0 15px rgba(198,160,110,0.2);
}
.amoled-chat-env div[style*="height: 1px"] {
  background: rgba(198,160,110,0.5) !important;
  box-shadow: 0 0 8px rgba(198,160,110,0.3);
}

.amoled-chat-env .msg-bubble-mine { 
  background: #000000 !important; 
  border: 2px solid #C6A06E !important; 
  color: #F0D5A0 !important;
  box-shadow: 0 4px 25px rgba(0,0,0,1), 0 0 15px rgba(198,160,110,0.15) !important;
}
.amoled-chat-env .msg-bubble-other { 
  background: #000000 !important; 
  border: 1.5px solid rgba(198,160,110,0.4) !important; 
  color: #F0D5A0 !important;
}


@media (max-width: 800px) {
  .oa-main-grid { grid-template-columns: 1fr !important; }
  .oa-desktop-nav { flex-wrap: wrap !important; height: auto !important; padding: 10px !important; gap: 8px !important; }
  .oa-main-wrapper { flex-direction: column !important; }
  .oa-app-container.chat-inactive .oa-main-wrapper { overflow-y: auto; overflow-x: hidden; display: block !important; }
  .oa-app-container.chat-inactive .oa-main-content { display: none !important; }
  .oa-sidebar { width: 100% !important; border-right: none !important; border-bottom: 1px solid rgba(198,160,110,.12) !important; max-height: none !important; flex: none !important; }
  .oa-app-container.chat-active .oa-sidebar { display: none !important; }
  .oa-main-content { min-height: 600px; flex: none !important; display: flex; flex-direction: column; }
  .oa-app-container.chat-active .oa-main-content { min-height: auto; flex: 1 !important; }
  .oa-settings-wrapper { flex-direction: column !important; gap: 16px !important; }
  .oa-settings-nav { width: 100% !important; }
  .oa-profile-wrapper { flex-direction: column !important; gap: 16px !important; }
}

.lm-mobile-canvas {
  position: fixed; inset: 0; z-index: 9999;
  display: flex; flex-direction: column; background: #000;
  overflow: hidden;
}
.lm-mobile-only { display: none !important; }
.lm-desktop-only { display: flex; }

@media (max-width: 768px) {
  .lm-mobile-only { display: flex !important; }
  .lm-desktop-only { display: none !important; }
}
`;

/* ─────────────────────────── SUB-COMPONENTS ─────────────────────────── */
const StarField = memo(({ count = 40 }) => {
  const stars = Array.from({ length: count }, (_, i) => ({
    x: (i * 37 + 13) % 100,
    y: (i * 61 + 7) % 100,
    delay: (i * 0.31) % 5,
    dur: 2 + (i % 4),
  }));
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {stars.map((s, i) => (
        <div key={i} className="oa-star" style={{ left: `${s.x}%`, top: `${s.y}%`, animationDelay: `${s.delay}s`, animationDuration: `${s.dur}s` }} />
      ))}
    </div>
  );
});
StarField.displayName = "StarField";

const DataStream = memo(({ x, delay, dur }) => {
  const chars = "01ABCDEFâ€»â–³â–½â—†â– â˜…";
  const stream = Array.from({ length: 14 }, (_, i) => chars[(i * 7) % chars.length]);
  return (
    <div className="oa-stream-char" style={{ left: x, top: "-90px", animationDuration: dur, animationDelay: delay }}>
      {stream.map((c, i) => <div key={i}>{c}</div>)}
    </div>
  );
});
DataStream.displayName = "DataStream";

// OrbitLogo is now imported from ../components/OrbitLogo

const Waveform = memo(({ playing }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 2, height: 28 }}>
    {Array.from({ length: 28 }).map((_, i) => (
      <div key={i} style={{
        width: 3, borderRadius: 2,
        background: "linear-gradient(to top,#C6A06E,#4ECDC4)",
        animationName: playing ? "oa-wave" : "none",
        animationDuration: `${0.4 + (i % 5) * 0.12}s`,
        animationDelay: `${(i * 0.055) % 0.6}s`,
        animationTimingFunction: "ease-in-out",
        animationIterationCount: "infinite",
        animationDirection: "alternate",
        height: playing ? undefined : 3,
        minHeight: 3, maxHeight: 24,
      }} />
    ))}
  </div>
));
Waveform.displayName = "Waveform";

/* â”€â”€ Spotify mock card â”€â”€ */
const SpotifyCard = memo(() => {
  const { 
    spotifyLinked, currentTrack, isPlaying, 
    pausePlayback, playTrack, skipNext, skipPrevious,
    positionMs, durationMs, seekTo, setVolume
  } = useSpotifyStore();

  const [localPos, setLocalPos] = useState(positionMs || 0);
  const [vol, setVol] = useState(70);
  const [hov, setHov] = useState(false);

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

  const progress = durationMs ? (localPos / durationMs) * 100 : 0;

  const handleSeek = (e) => {
    e.stopPropagation();
    if (!durationMs) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    seekTo((percent / 100) * durationMs);
  };

  const handleVol = (e) => {
    e.stopPropagation();
    const r = e.currentTarget.getBoundingClientRect();
    const v = Math.round(Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100)));
    setVol(v);
    if (setVolume) setVolume(v);
  };

  const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  const currSec = localPos / 1000;
  const totalSec = (durationMs || 0) / 1000;
  const navigate = useNavigate();

  if (!spotifyLinked) {
    return (
      <div className="oa-card oa-bracket oa-borderglow" 
        onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
        style={{ padding: "24px 40px", cursor: "pointer", height: "100%", width: "100%", display: "flex", flexDirection: "column", justifyContent: "center", boxSizing: "border-box", background: `linear-gradient(135deg,rgba(78,205,196,${hov ? 0.08 : 0.03}),rgba(2,2,2,.98))`, borderColor: hov ? "rgba(78,205,196,.4)" : "rgba(198,160,110,.2)", transition: "all .4s ease" }} 
        onClick={() => navigate("/spotify")}
      >
        <div className="oa-scan" />
        <div style={{ flex:1, display:"flex", flexDirection:"column", justifyContent:"center", alignItems:"center", position:"relative", zIndex:1 }}>
           <span className="oa-orbitron" style={{ fontSize:22, fontWeight:800, letterSpacing:2, color:"#fff" }}>Connect Spotify</span>
           <span className="oa-raj" style={{ fontSize:16, color:"rgba(198,160,110,.5)", letterSpacing:1.5, marginTop:8 }}>Share your listening experience</span>
        </div>
      </div>
    );
  }

  return (
    <div className="oa-card oa-bracket oa-borderglow" 
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ padding: "24px 40px", cursor: "pointer", height: "100%", width: "100%", display: "flex", flexDirection: "column", justifyContent: "center", boxSizing: "border-box", background: `linear-gradient(135deg,rgba(78,205,196,${hov ? 0.08 : 0.03}),rgba(2,2,2,.98))`, borderColor: hov ? "rgba(78,205,196,.4)" : "rgba(198,160,110,.2)", transition: "all .4s ease" }} 
      onClick={() => navigate("/spotify")}
    >
      <div className="oa-scan" />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 30, position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", gap: 24, alignItems: "center", flex: 1 }}>
          <div style={{ position: "relative", flexShrink: 0 }}>
            {currentTrack?.imageUrl ? (
              <img src={currentTrack.imageUrl} alt="" style={{ width: 80, height: 80, borderRadius: 16, border: `1.5px solid ${hov ? "#4ECDC4" : "rgba(198,160,110,.4)"}`, objectFit: "cover" }} />
            ) : (
              <div style={{ width: 80, height: 80, borderRadius: 16, background: "linear-gradient(135deg,#4ECDC4,#121212)", border: `1.5px solid ${hov ? "#4ECDC4" : "rgba(198,160,110,.4)"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, animation: "oa-float 4s ease-in-out infinite", transition: "all .4s" }}>ðŸŽµ</div>
            )}
            <div style={{ position: "absolute", inset: -5, border: `1px solid ${hov ? "rgba(78,205,196,.3)" : "rgba(198,160,110,.2)"}`, borderRadius: 20, animation: "oa-cw 12s linear infinite" }} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <div style={{ width: 8, height: 8, background: "#4ECDC4", borderRadius: "50%", boxShadow: isPlaying ? "0 0 10px #4ECDC4" : "none" }} />
              <span className="oa-mono" style={{ fontSize: 10, color: "#4ECDC4", letterSpacing: 2 }}>SPOTIFY // {isPlaying ? "ACTIVE" : "PAUSED"}</span>
            </div>
            <div className="oa-orbitron" style={{ fontSize: 22, color: "#fff", fontWeight: 800, letterSpacing: 2, marginBottom: 4, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{currentTrack ? currentTrack.name : "Orbit Anthems"}</div>
            <div className="oa-raj" style={{ fontSize: 16, color: "rgba(198,160,110,.5)", letterSpacing: 1.5, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{currentTrack ? currentTrack.artist : "Premium Audio"}</div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
           <Waveform playing={isPlaying} />
        </div>
      </div>

      <div style={{ marginTop: 28, position: "relative", zIndex: 1 }}>
        <div onClick={handleSeek} style={{ height: 4, background: "rgba(198,160,110,.1)", borderRadius: 4, marginBottom: 16, position: "relative", cursor: "pointer" }}>
          <div className="oa-progress-fill" style={{ width: `${progress}%`, background: "#4ECDC4", height:"100%" }} />
          <div style={{ position: "absolute", top: "50%", left: `${progress}%`, width: 12, height: 12, background: "#fff", borderRadius: "50%", transform: "translate(-50%,-50%)", boxShadow: "0 0 15px #4ECDC4" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", gap: 30, alignItems: "center" }}>
            <button onClick={(e) => { e.stopPropagation(); skipPrevious(); }} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(198,160,110,.4)", fontSize: 18, transition: "all .2s" }}>â®</button>
            <button onClick={(e) => { e.stopPropagation(); isPlaying ? pausePlayback() : playTrack(); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#4ECDC4", fontSize: 26, transition: "all .2s" }}>{isPlaying ? "â¸" : "â–¶"}</button>
            <button onClick={(e) => { e.stopPropagation(); skipNext(); }} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(198,160,110,.4)", fontSize: 18, transition: "all .2s" }}>â­</button>
            <span className="oa-mono" style={{ fontSize: 11, color: "rgba(198,160,110,.3)", letterSpacing: 2 }}>{fmt(currSec)} / {fmt(totalSec)}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 14, color: "rgba(198,160,110,.3)" }}>ðŸ”Š</span>
            <div onClick={handleVol} style={{ width: 100, height: 4, background: "rgba(198,160,110,.15)", borderRadius: 4, cursor: "pointer", position: "relative" }}>
              <div style={{ width: `${vol}%`, background: "#4ECDC4", borderRadius: 4, height: "100%" }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
SpotifyCard.displayName = "SpotifyCard";

/* â”€â”€ Generic action card â”€â”€ */
export const ActionCard = memo(({ icon, title, subtitle, color = "#C6A06E", badge, teal, onClick }) => {
  const [hov, setHov] = useState(false);
  return (
    <div className={`oa-card oa-bracket${teal ? " oa-teal-card" : ""}`}
      onClick={onClick}
      style={{ padding: "24px 40px", cursor: "pointer", borderColor: hov ? `${color}80` : `${color}25`, background: teal ? `linear-gradient(135deg,${color}08,rgba(5,5,5,.98))` : `linear-gradient(135deg,rgba(15,15,15,.95),rgba(2,2,2,.99))`, display: "flex", flexDirection: "column", gap: 16, height: "100%", width: "100%", boxSizing: "border-box", justifyContent: "center", transition: "all .4s cubic-bezier(.23,1,.32,1)", boxShadow: hov ? `0 15px 40px -10px ${color}15, 0 0 20px -5px ${color}10` : "none" }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
    >
      <div className="oa-scan" />
      {/* Dynamic Background Glow */}
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at ${hov ? "60%" : "30%"} 50%,${color}06 0%,transparent 70%)`, pointerEvents: "none", transition: "all 0.8s ease" }} />
      
      <div style={{ display: "flex", gap: 32, alignItems: "center", position: "relative", zIndex: 1 }}>
        {/* Reinforced Icon Area */}
        <div style={{ position: "relative", width: 72, height: 72, borderRadius: 16, background: `linear-gradient(135deg,${color}18,transparent)`, border: `1.5px solid ${color}35`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, flexShrink: 0, boxShadow: hov ? `0 0 30px ${color}20` : "inset 0 0 15px rgba(0,0,0,.5)", transition: "all .5s cubic-bezier(.23,1,.32,1)", transform: hov ? "scale(1.05) rotate(-3deg)" : "scale(1)" }}>
          {icon}
          {badge && <div style={{ position: "absolute", top: -10, right: -10, background: color, borderRadius: "50%", width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#000", fontWeight: 900, boxShadow: `0 0 15px ${color}` }}>{badge}</div>}
        </div>
        
        {/* Content with Improved Typography */}
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
             <div style={{ width: 12, height: 1.5, background: color, opacity: hov ? 1 : 0.3, transition: "width .4s, opacity .4s" }} />
             <div className="oa-mono" style={{ fontSize: 10, color: hov ? `${color}` : "rgba(198,160,110,.5)", letterSpacing: 4, textTransform: "uppercase", transition: "color .3s" }}>SYSTEM // {title}</div>
          </div>
          <div className="oa-orbitron" style={{ fontSize: 20, color: hov ? "#fff" : "#E8C990", fontWeight: 800, letterSpacing: 2, marginBottom: 10, transition: "all .4s" }}>{title}</div>
          <p className="oa-raj" style={{ fontSize: 15, color: hov ? "rgba(198,160,110,.8)" : "rgba(198,160,110,.35)", letterSpacing: 1, lineHeight: 1.6, margin: 0, maxWidth: "85%", transition: "color .4s" }}>{subtitle}</p>
        </div>

        {/* Right Interaction Element */}
        <div style={{ opacity: hov ? 0.8 : 0, transform: hov ? "translateX(0)" : "translateX(-20px)", transition: "all .5s cubic-bezier(.23,1,.32,1)", color }}>
          <div style={{ fontSize: 28, fontWeight: 300 }}>â—¹</div>
        </div>
      </div>

      {/* Edge highlight on hover */}
      <div style={{ position: "absolute", left: 0, top: "20%", bottom: "20%", width: 2, background: color, opacity: hov ? 1 : 0, transition: "all .4s ease" }} />
    </div>
  );
});
ActionCard.displayName = "ActionCard";

/* â”€â”€ Sidebar â”€â”€ */
const Sidebar = memo(({ activeTab, setActiveTab, onJoin, onNexus, nexuses, isNexusesLoading, setSelectedNexus, users, setSelectedUser, nexusUnread, setNexusActionView, toggleHide, hiddenNexuses, forcedTab }) => {
  const navigate = useNavigate();
  const [internalTab, setInternalTab] = useState(null);
  const currentTab = internalTab || forcedTab || activeTab;

  const handleTabClick = (t) => {
    if (forcedTab) {
      setInternalTab(t);
    } else {
      setActiveTab(t);
    }
  };

  const orbits = ["# NEXUS PRIME", "# DARKWEB", "# CONSTELLATION", "# SHADOW OPS"];
  const contacts = [["CIPHER", "âš¡", "#C6A06E"], ["NOVA", "â—ˆ", "#4ECDC4"], ["PHANTOM", "â˜½", "#9B59B6"], ["AXIOM", "â–²", "#E74C3C"]];

  const [pinnedNexuses, setPinnedNexuses] = useState(() => {
    return JSON.parse(localStorage.getItem('amoled_pinned_nexuses') || '[]');
  });
  const [nexusColors, setNexusColors] = useState(() => {
    return JSON.parse(localStorage.getItem('amoled_nexus_colors') || '{}');
  });
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [activeColorPickerId, setActiveColorPickerId] = useState(null);

  const togglePin = (id, e) => {
    e.stopPropagation();
    const next = pinnedNexuses.includes(id) ? pinnedNexuses.filter(pid => pid !== id) : [...pinnedNexuses, id];
    setPinnedNexuses(next);
    localStorage.setItem('amoled_pinned_nexuses', JSON.stringify(next));
    setActiveMenuId(null);
  };

  const updateColor = (id, color, e) => {
    e.stopPropagation();
    const next = { ...nexusColors, [id]: color };
    setNexusColors(next);
    localStorage.setItem('amoled_nexus_colors', JSON.stringify(next));
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
  return (
    <div className="oa-sidebar" style={{ width: 280, background: "#020202", borderRight: "1px solid rgba(198,160,110,.12)", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden", flexShrink: 0 }}>
      <StarField count={30} />
      {[{ x: "10%", delay: "0s", dur: "20s" }, { x: "55%", delay: "8s", dur: "26s" }, { x: "82%", delay: "14s", dur: "19s" }].map((s, i) => (
        <DataStream key={i} x={s.x} delay={s.delay} dur={s.dur} />
      ))}
      {/* Tab buttons */}
      <div style={{ padding: "16px 14px 12px", borderBottom: "1px solid rgba(198,160,110,.1)", position: "relative", zIndex: 5 }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          {[["orbits", "â—ˆ ORBITS", "teal"], ["contacts", "â—‰ CONTACTS", "gold"]].map(([tab, label, c]) => (
            <button key={tab} onClick={() => handleTabClick(tab)}
              style={{
                flex: 1, padding: "10px 6px", borderRadius: 8, fontSize: 11, letterSpacing: 2, cursor: "pointer", fontFamily: "Orbitron,sans-serif",
                background: currentTab === tab ? (c === "teal" ? "rgba(78,205,196,.18)" : "rgba(198,160,110,.16)") : (c === "teal" ? "rgba(78,205,196,.06)" : "rgba(198,160,110,.06)"),
                border: `1px solid ${currentTab === tab ? (c === "teal" ? "rgba(78,205,196,.7)" : "rgba(198,160,110,.7)") : (c === "teal" ? "rgba(78,205,196,.3)" : "rgba(198,160,110,.3)")}`,
                color: c === "teal" ? "#4ECDC4" : "#C6A06E",
                boxShadow: currentTab === tab ? (c === "teal" ? "0 0 15px rgba(78,205,196,.3)" : "0 0 15px rgba(198,160,110,.3)") : "none",
                transition: "all .3s"
              }}>{label}</button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {[["+ JOIN ENGINE", "gold", onJoin], ["✦ NEXUS HUB", "teal", onNexus]].map(([l, c, handler]) => (
            <button key={l} onClick={handler} style={{
              flex: 1, padding: "8px 6px", borderRadius: 7, fontSize: 9.5, letterSpacing: 1.8, cursor: "pointer", fontFamily: "Orbitron,sans-serif",
              background: c === "teal" ? "rgba(78,205,196,.1)" : "rgba(198,160,110,.1)", border: `1px solid ${c === "teal" ? "rgba(78,205,196,.4)" : "rgba(198,160,110,.4)"}`, color: c === "teal" ? "#4ECDC4" : "#C6A06E", transition: "all .2s"
            }}>{l}</button>
          ))}
        </div>
      </div>
      {/* List */}
      <div style={{ flex: 1, padding: "12px 10px", overflowY: "auto", position: "relative", zIndex: 5 }}>
        {activeTab === "orbits" ? (
          <>
            <div className="oa-mono" style={{ fontSize: 10, color: "rgba(198,160,110,.3)", letterSpacing: 3, padding: "6px 10px", marginBottom: 6 }}>— ACTIVE CHANNELS —</div>
            {isNexusesLoading ? (
               <div style={{ color: "rgba(198,160,110,.4)", fontSize: 12, textAlign: "center", padding: "20px 0" }}>SYNCING...</div>
            ) : nexuses.length === 0 ? (
               <div style={{ color: "rgba(198,160,110,.3)", fontSize: 11, textAlign: "center", padding: "20px 10px", lineHeight: 1.5 }}>NO CHANNELS DETECTED.<br/>INITIALIZE NEXUS.</div>
            ) : (
              sortedNexuses.map((n) => (
                <div key={n._id} onClick={() => { 
                  setSelectedNexus(n); 
                  setSelectedUser(null);
                  setNexusActionView(null);
                  navigate(`/nexus/${n._id}`);
                }} style={{ display: "flex", flexDirection: "column", padding: "10px 12px", borderRadius: 8, marginBottom: 4, cursor: "pointer", color: "#C6A06E", background: nexusColors[n._id] || "rgba(198,160,110,.05)", border: "1px solid rgba(198,160,110,.1)", transition: "all .2s", fontFamily: "Rajdhani,sans-serif", fontSize: 15, fontWeight: 600, letterSpacing: 1, position: "relative" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(198,160,110,.3)"; e.currentTarget.style.boxShadow = "inset 0 0 10px rgba(198,160,110,.2)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(198,160,110,.1)"; e.currentTarget.style.boxShadow = "none"; }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10, width: "100%" }}>
                    <div style={{ width: 24, height: 24, borderRadius: "50%", background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
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
                              size={24} 
                              showDot={false} 
                              style={{ imageRendering: "pixelated" }} 
                            />
                          );
                        })()
                      )}
                    </div>
                    <div style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n.name}</div>
                    {nexusUnread[n._id] > 0 && (
                       <div style={{ background: "#C6A06E", color: "#000", fontSize: 10, fontWeight: 900, padding: "1px 6px", borderRadius: 4, boxShadow: "0 0 10px rgba(198,160,110,0.4)" }}>{nexusUnread[n._id]}</div>
                    )}
                    <span style={{ fontSize: 10, color: "rgba(198,160,110,0.5)", background: "rgba(198,160,110,.1)", padding: "2px 6px", borderRadius: 4 }}>{n.members?.length || 0}</span>
                  
                    {pinnedNexuses.includes(n._id) && (
                        <div style={{ position: 'absolute', top: 2, left: 2, fontSize: 10 }}>ðŸ“Œ</div>
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
                        ðŸ’Ž
                    </div>
                  </div>

                  {/* Context Menu Inline Expansion */}
                  {activeMenuId === n._id && (
                      <div 
                          onClick={(e) => e.stopPropagation()}
                          style={{ width: '100%', marginTop: 10, paddingTop: 10, borderTop: `1px solid rgba(198,160,110,.2)`, display: 'flex', flexDirection: 'column', gap: 8 }}
                      >
                          <div style={{ display: 'flex', gap: 8 }}>
                              <button 
                                  onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveColorPickerId(activeColorPickerId === n._id ? null : n._id);
                                  }}
                                  style={{ flex: 1, padding: '6px', background: "rgba(198,160,110,.1)", border: "1px solid rgba(198,160,110,.4)", borderRadius: 4, fontSize: 11, color: "#C6A06E", fontFamily: "Orbitron, sans-serif", cursor: 'pointer' }}
                              >
                                  Mark ðŸŽ¨
                              </button>
                              <button 
                                  onClick={(e) => togglePin(n._id, e)}
                                  style={{ flex: 1, padding: '6px', background: "rgba(198,160,110,.1)", border: "1px solid rgba(198,160,110,.4)", borderRadius: 4, fontSize: 11, color: "#C6A06E", fontFamily: "Orbitron, sans-serif", cursor: 'pointer' }}
                              >
                                  {pinnedNexuses.includes(n._id) ? "Unpin ðŸ“Œ" : "Pin ðŸ“Œ"}
                              </button>
                              <button 
                                  onClick={(e) => toggleHide(n, e)}
                                  style={{ flex: 1, padding: '6px', background: "rgba(198,160,110,.1)", border: "1px solid rgba(198,160,110,.4)", borderRadius: 4, fontSize: 11, color: "#C6A06E", fontFamily: "Orbitron, sans-serif", cursor: 'pointer' }}
                              >
                                  Hide ðŸ’Ž
                              </button>
                          </div>

                          {activeColorPickerId === n._id && (
                              <div style={{ display: 'flex', gap: 6, padding: '8px', background: "rgba(0,0,0,0.5)", borderRadius: 4, border: "1px solid rgba(198,160,110,.2)", overflowX: 'auto', scrollbarWidth: 'none' }} className="custom-scrollbar">
                                  {[
                                      "transparent", // Default
                                      "rgba(198,160,110,.2)", // Gold
                                      "rgba(78,205,196,.2)", // Teal
                                      "rgba(155,89,182,.2)", // Purple
                                      "rgba(255,100,100,.2)", // Red
                                      "rgba(100,150,255,.2)", // Blue
                                      "rgba(50,255,150,.2)", // Green
                                      "rgba(10,10,10,0.8)", // Black void
                                  ].map(c => (
                                      <div 
                                          key={c}
                                          onClick={(e) => updateColor(n._id, c, e)}
                                          style={{ minWidth: 20, height: 20, borderRadius: '50%', background: c, border: c === "transparent" ? "1px solid rgba(255,255,255,0.2)" : `1px solid rgba(198,160,110,.5)`, cursor: 'pointer', flexShrink: 0 }}
                                      />
                                  ))}
                              </div>
                          )}
                      </div>
                  )}
                </div>
              ))
            )}
          </>
        ) : (
          <>
            {users.length === 0 ? (
               <div style={{ color: "rgba(198,160,110,.3)", fontSize: 11, textAlign: "center", padding: "20px 0" }}>NO CONTACTS SEARCHED.</div>
            ) : (
              users.map((u) => (
                <div key={u._id} onClick={() => { 
                  setSelectedUser(u); 
                  setSelectedNexus(null);
                  setNexusActionView(null);
                  navigate(`/chat/${u._id}`);
                }} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 8, marginBottom: 4, cursor: "pointer", transition: "all .2s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(78,205,196,.08)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <div style={{ width: 38, height: 38, borderRadius: "50%", background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0, overflow: "hidden" }}>
                    {u.profilePic ? (
                      <img src={u.profilePic} alt={u.username} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      (() => {
                        const ANIMALS = ['dog', 'cat', 'bunny'];
                        const animal = ANIMALS[parseInt((u._id || "").toString().slice(-4) || '0', 16) % ANIMALS.length];
                        return (
                          <PixelAvatarBadge 
                            type={animal} 
                            state="idle" 
                            size={38} 
                            showDot={false} 
                            style={{ imageRendering: "pixelated" }} 
                          />
                        );
                      })()
                    )}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div className="oa-orbitron" style={{ fontSize: 12, color: "#C6A06E", letterSpacing: 1.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.username}</div>
                    <div className="oa-mono" style={{ fontSize: 10, color: "rgba(78,205,196,.7)", letterSpacing: 1 }}>{u.status === "online" ? "CONNECTED" : "OFFLINE"}</div>
                  </div>
                </div>
              ))
            )}
          </>
        )}
      </div>
      {/* Footer trigger for Orbit Explorer */}
      <div 
        style={{ padding: "16px 18px", borderTop: "1px solid rgba(198,160,110,.1)", background: "rgba(0,0,0,0.5)", position: "relative", zIndex: 10, cursor: "not-allowed", opacity: 0.5, pointerEvents: "none" }} 
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ position: "relative" }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: "linear-gradient(135deg,#3d1a00,#1a0a00)", border: "2px solid rgba(198,160,110,.5)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>ðŸ”’</div>
          </div>
          <div>
            <div className="oa-orbitron" style={{ fontSize: 13, color: "#C6A06E", letterSpacing: 2, fontWeight: 900 }}>
              ORBIT: COMING SOON
            </div>
            <div className="oa-mono" style={{ fontSize: 10, color: "rgba(78,205,196,.35)", letterSpacing: 2 }}>SEQUENCING DIMENSION</div>
          </div>
        </div>
      </div>
    </div>
  );
});
Sidebar.displayName = "Sidebar";

const AmoledMobileNav = memo(({ authUser, navigate }) => (
  <div style={{
    height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 20px', background: '#000', borderBottom: '1.5px solid rgba(198,160,110,0.3)',
    backdropFilter: 'blur(10px)', flexShrink: 0, zIndex: 100
  }}>
    <div style={{ width: 34, height: 34, borderRadius: "20%", overflow: "hidden", border: "1.5px solid #C6A06E", cursor: "pointer" }} onClick={() => navigate("/profile")}>
      <img src={authUser?.profilePic || "/avatar.png"} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
    </div>
    <div className="oa-shimmer-text oa-orbitron" style={{ fontSize: 18, fontWeight: 900, letterSpacing: 3 }}>ORBIT</div>
    <div style={{ width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 20, color: '#C6A06E' }} onClick={() => navigate("/settings")}>⚙</div>
  </div>
));

const AmoledMobileTabBar = memo(({ currentTab, onTabChange }) => (
  <div style={{
    height: 72, display: 'flex', alignItems: 'center', justifyContent: 'space-around',
    background: '#000', borderTop: '1.5px solid rgba(198,160,110,0.3)',
    backdropFilter: 'blur(15px)', paddingBottom: 'env(safe-area-inset-bottom)', flexShrink: 0, zIndex: 100
  }}>
    {[
      { id: 'orbits', label: 'ORBITS', icon: '✦', color: '#4ECDC4' },
      { id: 'contacts', label: 'CONTACTS', icon: '👤', color: '#C6A06E' }
    ].map(t => {
      const active = currentTab === t.id;
      return (
        <div key={t.id} onClick={() => onTabChange(t.id)} style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
          cursor: 'pointer', opacity: active ? 1 : 0.4, transition: 'all 0.3s'
        }}>
          <div style={{ 
            fontSize: 20, color: active ? t.color : 'rgba(198,160,110,0.5)',
            textShadow: active ? `0 0 10px ${t.color}` : 'none'
          }}>{t.icon}</div>
          <div className="oa-orbitron" style={{ fontSize: 8, fontWeight: 900, letterSpacing: 1.5, color: active ? '#fff' : 'rgba(198,160,110,0.5)' }}>{t.label}</div>
        </div>
      );
    })}
  </div>
));

const AmoledMobileDash = memo(({ 
  activeTab, 
  setActiveTab, 
  setNexusActionView, 
  isNexusesLoading, 
  nexuses, 
  setSelectedNexus, 
  setSelectedUser, 
  nexusUnread, 
  users, 
  hiddenNexuses, 
  toggleHide 
}) => {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#000' }}>
      <Sidebar 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onJoin={() => setNexusActionView("join")}
        onNexus={() => setNexusActionView("create")}
        nexuses={nexuses}
        isNexusesLoading={isNexusesLoading}
        setSelectedNexus={setSelectedNexus}
        users={users || []}
        setSelectedUser={setSelectedUser}
        nexusUnread={nexusUnread || {}}
        setNexusActionView={setNexusActionView}
        toggleHide={toggleHide}
        hiddenNexuses={hiddenNexuses}
        forcedTab={activeTab}
      />
    </div>
  );
});

// â”€â”€ Hidden Nexus Diamond â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const HiddenNexusDiamond = memo(({ nexus, onReveal }) => {
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
        filter: grabbed ? "drop-shadow(0 0 20px #C6A06E)" : "drop-shadow(0 0 8px rgba(198,160,110,.4))",
        transition: grabbed ? "none" : "filter 0.3s",
        width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center",
        pointerEvents: "auto"
      }}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
    >
      <div style={{ width: 14, height: 14, border: "2.5px solid #C6A06E", transform: "rotate(45deg)", boxShadow: "0 0 10px #C6A06E" }} />
    </div>
  );
});

/* ── Topbar ── */
const AmoledTopNav = memo(({ logout, hiddenNexuses, onReveal }) => {
  const [time, setTime] = useState(() => new Date().toLocaleTimeString());
  const navigate = useNavigate();

  useEffect(() => {
    const t = setInterval(() => setTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="oa-desktop-nav lm-desktop-only" style={{ height: 44, background: "rgba(2,2,2,.96)", borderBottom: "1px solid rgba(198,160,110,.14)", display: "flex", alignItems: "center", padding: "0 20px", backdropFilter: "blur(22px)", flexShrink: 0, zIndex: 20, position: "relative", gap: 0 }}>
      {/* Left: Logo + Title */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
        <button onClick={() => navigate("/")} style={{ background: "transparent", border: "none", color: "rgba(198,160,110,.5)", cursor: "pointer", fontSize: 16, padding: "0 10px 0 0", display: location.pathname === "/" ? "none" : "block" }} onMouseEnter={e => e.currentTarget.style.color = "#C6A06E"} onMouseLeave={e => e.currentTarget.style.color = "rgba(198,160,110,.5)"}>
          ←
        </button>
        <OrbitLogo />
        <span className="oa-shimmer-text oa-orbitron" style={{ fontSize: 14, fontWeight: 700, letterSpacing: 3 }}>ORBIT</span>
        <div className="oa-mono" style={{ fontSize: 9, color: "rgba(198,160,110,.3)", letterSpacing: 2, paddingLeft: 12, borderLeft: "1px solid rgba(198,160,110,.18)" }}>v2.4.1</div>
      </div>

      {/* Centre: Rocket Animation + Hidden Diamonds */}
      <div style={{ flex: 1, position: "relative", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <RocketAnimation />
        <div style={{ position: "absolute", inset: 0, display: "flex", justifyContent: "center", alignItems: "center", gap: 60, pointerEvents: "none" }}>
          {(hiddenNexuses || []).map((nexus) => (
            <div key={nexus._id} style={{ pointerEvents: "auto" }}>
              <HiddenNexusDiamond nexus={nexus} onReveal={onReveal} />
             </div>
          ))}
        </div>
      </div>

      {/* Right: Clock + Buttons */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        <div className="oa-mono" style={{ fontSize: 10, color: "rgba(78,205,196,.65)", letterSpacing: 2, paddingRight: 16 }}>
          {time}<span style={{ animation: "oa-blink 1s step-end infinite", display: "inline-block" }}>_</span>
        </div>
        {[["⚙", "SETTINGS", () => navigate("/settings")], ["◉", "PROFILE", () => navigate("/profile")], ["»", "LOGOUT", logout]].map(([icon, label, action]) => (
          <button key={label} onClick={action} style={{ padding: "5px 10px", borderRadius: 6, fontSize: 8, letterSpacing: 1.5, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontFamily: "Orbitron,sans-serif", background: "rgba(198,160,110,.08)", border: "1px solid rgba(198,160,110,.35)", color: "#C6A06E", transition: "all .25s" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(198,160,110,.18)"; e.currentTarget.style.boxShadow = "0 0 12px rgba(198,160,110,.3)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(198,160,110,.08)"; e.currentTarget.style.boxShadow = "none"; }}>
            <span>{icon}</span>{label}
          </button>
        ))}
      </div>
    </div>
  );
});
AmoledTopNav.displayName = "AmoledTopNav";

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ MAIN EXPORT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
export function AmoledThemeLayoutBase({ children, title = "SECURE TERMINAL" }) {
  const [activeTab, setActiveTab] = useState("orbits");
  const [mounted, setMounted] = useState(false);
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const { nexusActionView, setNexusActionView, nexuses, setSelectedNexus, isNexusesLoading, nexusUnread, selectedNexus, selectedNexusId } = useNexusStore();
  const nexusSelected = Boolean(selectedNexus || selectedNexusId);
  const { users, selectedUser, setSelectedUser } = useChatStore();

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80);
    return () => clearTimeout(t);
  }, []);

  // â”€â”€ Hidden Nexus State â”€â”€
  const [hiddenNexuses, setHiddenNexuses] = useState(() => {
      try {
          const saved = localStorage.getItem('amoled_hidden_nexuses');
          return saved ? JSON.parse(saved) : [];
      } catch { return []; }
  });

  const [showAddMenu, setShowAddMenu] = useState(false);

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
      localStorage.setItem('amoled_hidden_nexuses', JSON.stringify(next));
  };

  const onReveal = (id) => {
      const next = hiddenNexuses.filter(h => h._id !== id);
      setHiddenNexuses(next);
      localStorage.setItem('amoled_hidden_nexuses', JSON.stringify(next));
  };

  const fade = (delay) => ({
    opacity: mounted ? 1 : 0,
    transform: mounted ? "translateY(0)" : "translateY(20px)",
    transition: `all .6s ease ${delay}s`,
  });

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* Root */}
      <div className={`oa-app-container ${nexusSelected || selectedUser ? 'chat-active' : 'chat-inactive'}`} style={{ width: "100%", height: "100vh", background: "#000", display: "flex", flexDirection: "column", overflow: "hidden", fontFamily: "'Inter','Rajdhani',sans-serif", position: "relative" }}>

        {/* ── Desktop Canvas ── */}
        <div className="lm-desktop-only" style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100vh' }}>
          <AmoledTopNav logout={logout} hiddenNexuses={hiddenNexuses} onReveal={onReveal} />

          <div className="oa-main-wrapper" style={{ display: "flex", flex: 1, overflow: "hidden" }}>
            <Sidebar 
              activeTab={activeTab} 
              setActiveTab={setActiveTab} 
              onJoin={() => setNexusActionView("join")}
              onNexus={() => setNexusActionView("create")}
              nexuses={nexuses}
              isNexusesLoading={isNexusesLoading}
              setSelectedNexus={setSelectedNexus}
              users={users || []}
              setSelectedUser={setSelectedUser}
              nexusUnread={nexusUnread || {}}
              setNexusActionView={setNexusActionView}
              toggleHide={toggleHide}
              hiddenNexuses={hiddenNexuses}
            />

            {/* ── Main content ── */}
            <div className="oa-main-content" style={{ flex: 1, overflow: "hidden", position: "relative", background: "#000", display: "flex", flexDirection: "column" }}>
              {children ? (
                <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: 28, position: "relative" }}>
                  <StarField count={40} />
                  <div className="oa-nebula" style={{ width: 420, height: 420, background: "rgba(198,160,110,.04)", top: "18%", left: "28%", animationDelay: "0s" }} />
                  <div className="oa-nebula" style={{ width: 300, height: 300, background: "rgba(78,205,196,.035)", top: "58%", right: "12%", animationDelay: "-5s" }} />
                  <div className="oa-nebula" style={{ width: 240, height: 240, background: "rgba(155,89,182,.03)", top: "8%", right: "38%", animationDelay: "-10s" }} />
                  {children}
                </div>
              ) : nexusActionView ? (
                <div style={{ position: "absolute", inset: 0, zIndex: 50 }}>
                  <NexusActionOverlay mode={nexusActionView} onClose={() => setNexusActionView(null)} inline={true} />
                </div>
              ) : nexusSelected ? (
                <div className="amoled-chat-env" style={{ position: "absolute", inset: 0, zIndex: 50, display: "flex", flexDirection: "column", background: "#000" }}>
                  <UniversalChatContainer key={selectedNexus?._id || selectedNexusId} type="nexus" />
                </div>
              ) : selectedUser ? (
                <div className="amoled-chat-env" style={{ position: "absolute", inset: 0, zIndex: 50, display: "flex", flexDirection: "column", background: "#000" }}>
                  <UniversalChatContainer key={selectedUser?._id} type="dm" />
                </div>
              ) : (
                <div style={{ flex: 1, display: "flex", flexDirection: "column", overflowX: "hidden", padding: "12px 20px 10px", position: "relative", minHeight: 0, overflow: "hidden" }}>
                  <StarField count={40} />
                  <div
                    className="oa-main-grid"
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gridTemplateRows: "1fr 1fr",
                      gap: 10,
                      width: "100%",
                      flex: 1,
                      minHeight: 0,
                      position: "relative",
                      zIndex: 5,
                    }}
                  >
                    <div style={{ ...fade(.2), height: "100%", display: "flex" }}>
                      <SpotifyCard />
                    </div>
                    <div style={{ ...fade(.3), height: "100%", display: "flex", opacity: 0.7 }}>
                      <ActionCard
                        icon="ðŸŽ®"
                        title="ORBIT GAMES ðŸ”’"
                        subtitle="Coming soon. A new way to play together across the elite grid."
                        color="#4ECDC4"
                      />
                    </div>
                    <div style={{ ...fade(.4), height: "100%", display: "flex" }}>
                      <ActionCard
                        icon="ðŸ””"
                        title="PRIORITY ALERTS"
                        subtitle="Real-time synchronization with your professional orbit"
                        color="#C6A06E"
                        badge={3}
                      />
                    </div>
                    <div style={{ ...fade(.5), height: "100%", display: "flex" }}>
                      <ActionCard
                        icon="âš™"
                        title="ATELIER"
                        subtitle="Fine-tune your workspace aesthetic and behavior"
                        color="#9B59B6"
                        onClick={() => navigate("/settings")}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Mobile Canvas ── */}
        <div className="lm-mobile-only lm-mobile-canvas">
          {nexusActionView ? (
            <div style={{ position: 'fixed', inset: 0, zIndex: 10000 }}>
              <NexusActionOverlay mode={nexusActionView} onClose={() => setNexusActionView(null)} />
            </div>
          ) : nexusSelected ? (
            <div className="amoled-chat-env" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <UniversalChatContainer key={selectedNexus?._id || selectedNexusId} type="nexus" />
            </div>
          ) : selectedUser ? (
            <div className="amoled-chat-env" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <UniversalChatContainer key={selectedUser?._id} type="dm" />
            </div>
          ) : (
            <>
              <AmoledMobileNav authUser={useAuthStore.getState().authUser} navigate={navigate} />
              <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <AmoledMobileDash
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                  setNexusActionView={setNexusActionView}
                  isNexusesLoading={isNexusesLoading}
                  nexuses={nexuses}
                  setSelectedNexus={setSelectedNexus}
                  setSelectedUser={setSelectedUser}
                  nexusUnread={nexusUnread}
                  users={users}
                  hiddenNexuses={hiddenNexuses}
                  toggleHide={toggleHide}
                />
              </div>
              <AmoledMobileTabBar currentTab={activeTab} onTabChange={setActiveTab} />
            </>
          )}
        </div>

      </div>
    </>
  );
}


/* ─────────────────────────────────────────────
   INTERNAL COMPONENTS
───────────────────────────────────────────── */
const ToggleRow = ({ label, description, checked, onChange }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px", background: "rgba(198,160,110,.03)", border: "1px solid rgba(198,160,110,.08)", borderRadius: 8, marginBottom: 12 }}>
    <div style={{ flex: 1, paddingRight: 16 }}>
      <div className="oa-orbitron" style={{ fontSize: 11, color: "#C6A06E", letterSpacing: 1.5, marginBottom: 4 }}>{label}</div>
      <div className="oa-raj" style={{ fontSize: 12, color: "rgba(198,160,110,.5)" }}>{description}</div>
    </div>
    <div
      onClick={() => onChange(!checked)}
      style={{ width: 44, height: 22, borderRadius: 11, background: checked ? "#C6A06E" : "rgba(0,0,0,.6)", border: "1px solid rgba(198,160,110,.3)", position: "relative", cursor: "pointer", transition: "all .3s" }}
    >
      <div style={{ width: 16, height: 16, borderRadius: "50%", background: checked ? "#000" : "rgba(198,160,110,.4)", position: "absolute", top: 2, left: checked ? 24 : 3, transition: "all .3s" }} />
    </div>
  </div>
);

export default function OrbitApp({ children }) {
  return <AmoledThemeLayout children={children} />;
}

export function AmoledSettings({
  activeSection, setActiveSection,
  draftTheme, setDraftTheme,
  draftDisplayName, setDraftDisplayName,
  draftBio, setDraftBio,
  draftNotifications, setDraftNotifications,
  draftShowOnlineStatus, setDraftShowOnlineStatus,
  draftOrbitBehavior, setDraftOrbitBehavior,
  draftSoundSettings, setDraftSoundSettings,
  isDirty, handleSave, handleReset
}) {
  const navigate = useNavigate();

  return (
    <AmoledThemeLayoutBase>
      <div style={{ maxWidth: 1000, margin: "0 auto", paddingBottom: 100 }}>
        <button onClick={() => navigate("/")} style={{ marginBottom: 20, background: "transparent", color: "rgba(198,160,110,.6)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontFamily: "'Share Tech Mono', monospace", transition: "color 0.2s" }} onMouseEnter={e => e.currentTarget.style.color = "#C6A06E"} onMouseLeave={e => e.currentTarget.style.color = "rgba(198,160,110,.6)"}>
          ← RETURN TO ORBIT
        </button>

        {/* Header */}
        <div style={{ marginBottom: 30, display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button onClick={() => navigate("/")} style={{ background: "transparent", border: "1px solid rgba(198,160,110,.4)", color: "#C6A06E", width: 44, height: 44, borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, transition: "all 0.3s" }} onMouseEnter={e => { e.currentTarget.style.background = "rgba(198,160,110,.1)"; e.currentTarget.style.borderColor = "#C6A06E"; }} onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "rgba(198,160,110,.4)"; }}>
              ◀
            </button>
            <div>
              <div className="oa-mono" style={{ fontSize: 10, color: "rgba(198,160,110,.65)", letterSpacing: 3, marginBottom: 8 }}>
                ⚙ SYSTEM PREFERENCES
              </div>
              <h1 className="oa-orbitron" style={{ fontSize: 26, color: "#C6A06E", letterSpacing: 2, margin: 0 }}>ATELIER</h1>
            </div>
          </div>
        </div>

        {/* Main Settings Layout */}
        <div style={{ display: "flex", gap: 20, minHeight: "calc(100vh - 200px)" }}>
          {/* Settings Nav */}
          <div style={{ width: 220, padding: 12, flexShrink: 0, background: "rgba(15,15,15,.88)", backdropFilter: "blur(22px)", border: "1px solid rgba(198,160,110,.2)", borderRadius: 12, display: "flex", flexDirection: "column", gap: 2 }}>
            {[
              { id: "profile", label: "IDENTITY", icon: "❖" },
              { id: "sound", label: "ACOUSTICS", icon: "🔊" },
              { id: "appearance", label: "APPEARANCE", icon: "✨" },
              { id: "notifications", label: "NOTIFICATIONS", icon: "🔔" },
              { id: "orbit", label: "ORBIT ENGINE", icon: "🪐" },
              { id: "security", label: "SECURITY", icon: "🔒" }
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveSection(activeSection === tab.id ? null : tab.id)} style={{ width: "100%", textAlign: "left", padding: "12px 14px", background: activeSection === tab.id ? "rgba(198,160,110,.1)" : "transparent", border: "none", borderLeft: activeSection === tab.id ? "2px solid #C6A06E" : "2px solid transparent", color: activeSection === tab.id ? "#C6A06E" : "rgba(198,160,110,.6)", fontFamily: "'Orbitron', sans-serif", fontSize: 11, letterSpacing: 1.5, cursor: "pointer", transition: "all .2s", display: "flex", alignItems: "center", gap: 10, marginBottom: 2 }}>
                <span>{tab.icon}</span> {tab.label}
              </button>
            ))}
          </div>

          {/* Settings Content */}
          {activeSection && (
          <div className="oa-card oa-borderglow" style={{ flex: 1, minWidth: 280, padding: 30 }}>
            {activeSection === "profile" && (
              <div>
                <h3 className="oa-orbitron" style={{ fontSize: 16, color: "#E8C990", letterSpacing: 2, marginBottom: 20 }}>PUBLIC IDENTITY</h3>
                <div style={{ marginBottom: 20 }}>
                  <label className="oa-mono" style={{ fontSize: 11, color: "rgba(198,160,110,.6)", letterSpacing: 2, display: "block", marginBottom: 6 }}>DISPLAY ALIAS</label>
                  <input type="text" value={draftDisplayName} onChange={e => setDraftDisplayName(e.target.value)} style={{ width: "100%", background: "rgba(10,10,10,.6)", border: "1px solid rgba(198,160,110,.2)", padding: "14px 16px", color: "#E8C990", borderRadius: 8, outline: "none", fontSize: 15, fontFamily: "'Rajdhani', sans-serif" }} onFocus={e => e.target.style.borderColor = "#C6A06E"} onBlur={e => e.target.style.borderColor = "rgba(198,160,110,.2)"} />
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label className="oa-mono" style={{ fontSize: 11, color: "rgba(198,160,110,.6)", letterSpacing: 2, display: "block", marginBottom: 6 }}>PERSONAL BIO</label>
                  <textarea value={draftBio} onChange={e => setDraftBio(e.target.value)} style={{ width: "100%", height: 80, background: "rgba(10,10,10,.6)", border: "1px solid rgba(198,160,110,.2)", padding: "14px 16px", color: "#E8C990", borderRadius: 8, outline: "none", fontSize: 14, fontFamily: "'Rajdhani', sans-serif", resize: "none" }} onFocus={e => e.target.style.borderColor = "#C6A06E"} onBlur={e => e.target.style.borderColor = "rgba(198,160,110,.2)"} />
                </div>

                <ToggleRow label="BROADCAST PRESENCE" description="Allow other nodes to see your online status." checked={draftShowOnlineStatus} onChange={setDraftShowOnlineStatus} />

                <div style={{ marginTop: 24, padding: 16, background: "rgba(198,160,110,.03)", border: "1px solid rgba(198,160,110,.1)", borderRadius: 8 }}>
                  <div className="oa-orbitron" style={{ fontSize: 12, color: "#C6A06E", marginBottom: 12 }}>LIVE TRANSMISSION PREVIEW</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 44, height: 44, borderRadius: "20%", background: "rgba(78,205,196,.1)", border: "1px solid rgba(78,205,196,.4)", display: "flex", alignItems: "center", justifyContent: "center", color: "#4ECDC4", fontSize: 18, fontWeight: "bold" }}>
                      {(draftDisplayName || "O")[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="oa-orbitron" style={{ fontSize: 14, color: "#E8C990" }}>{draftDisplayName || "Unknown Object"}</div>
                      <div className="oa-mono" style={{ fontSize: 10, color: draftShowOnlineStatus ? "#00FF88" : "rgba(198,160,110,.5)" }}>{draftShowOnlineStatus ? "ONLINE" : "STEALTH MODE"}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {activeSection === "sound" && (
              <div>
                <h2 className="oa-orbitron" style={{ fontSize: 18, color: "#C6A06E", letterSpacing: 2, marginBottom: 20 }}>AUDIO SETTINGS</h2>
                <ToggleRow label="TRANSMISSION SOUNDS" description="Auditory ping when a direct message is received." checked={draftSoundSettings.messageSound} onChange={v => { setDraftSoundSettings(p => ({ ...p, messageSound: v })); try { useSettingsStore.getState().updateSetting('sound.notificationEnabled', v); } catch (_) {} }} />
                <ToggleRow label="HAPTIC CLICKS" description="Subtle acoustic clicks on UI interactions." checked={draftSoundSettings.clickSound} onChange={v => { setDraftSoundSettings(p => ({ ...p, clickSound: v })); try { useSettingsStore.getState().updateSetting('sound.clickEnabled', v); } catch (_) {} }} />

                <div style={{ marginTop: 20 }}>
                  <label className="oa-mono" style={{ fontSize: 11, color: "rgba(198,160,110,.6)", letterSpacing: 2, display: "block", marginBottom: 10 }}>MASTER GAIN {(draftSoundSettings.volume * 100).toFixed(0)}%</label>
                  <input type="range" min="0" max="1" step="0.05" value={draftSoundSettings.volume} onChange={(e) => { const v = parseFloat(e.target.value); setDraftSoundSettings(p => ({ ...p, volume: v })); try { useSettingsStore.getState().updateSetting('sound.volume', v); } catch (_) {} }} style={{ width: "100%", accentColor: "#C6A06E" }} />
                </div>
              </div>
            )}

            {activeSection === "appearance" && (
              <div>
                <h2 className="oa-orbitron" style={{ fontSize: 18, color: "#C6A06E", letterSpacing: 2, marginBottom: 20 }}>THEME SELECTION</h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
                  {THEMES.map(t => {
                    const isSelected = draftTheme === t;

                    let previewPrimary = "#E8C990";
                    let previewBg = "#000000";

                    if (t === "light") { previewPrimary = "#3b82f6"; previewBg = "#ffffff"; }
                    else if (t === "pastel") { previewPrimary = "#ff69b4"; previewBg = "#fff0f5"; }
                    else if (t === "dark") { previewPrimary = "#00ff88"; previewBg = "#111"; }
                    else if (t === "cyberpunk") { previewPrimary = "#00fff5"; previewBg = "#050010"; }
                    else if (t === "gamer") { previewPrimary = "#ff00ff"; previewBg = "#0a0e27"; }
                    else if (t === "vampire") { previewPrimary = "#dc143c"; previewBg = "#1a0a1a"; }

                    return (
                      <div key={t} onClick={() => { setDraftTheme(t); handleSave(t); }} style={{ padding: 16, borderRadius: 8, border: isSelected ? "1px solid #4ECDC4" : "1px solid rgba(198,160,110,.2)", background: isSelected ? "rgba(78,205,196,.05)" : "rgba(10,10,10,.6)", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 10, transition: "all .2s" }}>
                        {/* Tiny Preview Box */}
                        <div style={{ width: "100%", height: 30, borderRadius: 4, background: previewBg, border: "1px solid rgba(198,160,110,.2)", display: "flex", overflow: "hidden" }}>
                          <div style={{ flex: 1, background: previewPrimary }} />
                          <div style={{ flex: 1, background: previewBg }} />
                        </div>
                        <div style={{ textAlign: "center" }}>
                          <div style={{ fontSize: 10, color: isSelected ? "#4ECDC4" : "rgba(198,160,110,.6)", fontFamily: "'Orbitron', monospace", letterSpacing: 1 }}>{THEME_LABELS[t] || t.toUpperCase()}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeSection === "notifications" && (
              <div>
                <h3 className="oa-orbitron" style={{ fontSize: 16, color: "#E8C990", letterSpacing: 2, marginBottom: 20 }}>ALERT SYSTEMS</h3>
                <ToggleRow label="DESKTOP OVERLAYS" description="Show visual toast notifications on your HUD." checked={draftNotifications.desktop} onChange={v => { setDraftNotifications(p => ({ ...p, desktop: v })); try { useSettingsStore.getState().updateSetting('notifications.desktopEnabled', v); } catch (_) {} }} />
                <ToggleRow label="AUDIO CUES" description="Play auditory pings for incoming waves." checked={draftNotifications.sound} onChange={v => { setDraftNotifications(p => ({ ...p, sound: v })); try { useSettingsStore.getState().updateSetting('notifications.enabled', v); } catch (_) {} }} />
                <ToggleRow label="EMAIL DIGESTS" description="Periodic email summaries (if allowed by server)." checked={draftNotifications.email} onChange={v => setDraftNotifications(p => ({ ...p, email: v }))} />
              </div>
            )}

            {activeSection === "orbit" && (
              <div>
                <h3 className="oa-orbitron" style={{ fontSize: 16, color: "#E8C990", letterSpacing: 2, marginBottom: 20 }}>ENGINE KINEMATICS</h3>
                <ToggleRow label="RENDER RINGS" description="Draw background constellation orbits in 3D." checked={draftOrbitBehavior.showRings} onChange={v => setDraftOrbitBehavior(p => ({ ...p, showRings: v }))} />
                <ToggleRow label="MOMENTUM PAUSE" description="Halt background rendering while inspecting a node." checked={draftOrbitBehavior.autoPauseOnHover} onChange={v => setDraftOrbitBehavior(p => ({ ...p, autoPauseOnHover: v }))} />

                <div style={{ marginTop: 20 }}>
                  <label className="oa-mono" style={{ fontSize: 11, color: "rgba(198,160,110,.6)", letterSpacing: 2, display: "block", marginBottom: 6 }}>INTERACTION FILTER</label>
                  <select value={draftOrbitBehavior.interactionFilter} onChange={(e) => setDraftOrbitBehavior(p => ({ ...p, interactionFilter: e.target.value }))} style={{ width: "100%", background: "rgba(10,10,10,.8)", border: "1px solid rgba(198,160,110,.3)", color: "#E8C990", padding: "10px", outline: "none", fontFamily: "'Rajdhani', sans-serif", fontSize: 14 }}>
                    <option value="all">ALL NODES</option>
                    <option value="active">ACTIVE NODES ONLY</option>
                    <option value="mutual">MUTUAL ORBITS ONLY</option>
                  </select>
                </div>

                <div style={{ marginTop: 20 }}>
                  <label className="oa-mono" style={{ fontSize: 11, color: "rgba(198,160,110,.6)", letterSpacing: 2, display: "block", marginBottom: 6 }}>KINEMATIC THEME</label>
                  <select value={draftOrbitBehavior.theme} onChange={(e) => setDraftOrbitBehavior(p => ({ ...p, theme: e.target.value }))} style={{ width: "100%", background: "rgba(10,10,10,.8)", border: "1px solid rgba(198,160,110,.3)", color: "#E8C990", padding: "10px", outline: "none", fontFamily: "'Rajdhani', sans-serif", fontSize: 14 }}>
                    <option value="nebula">NEBULA</option>
                    <option value="aurora">AURORA</option>
                    <option value="cosmic">COSMIC</option>
                  </select>
                </div>
              </div>
            )}

            {activeSection === "security" && (
              <div>
                <h3 className="oa-orbitron" style={{ fontSize: 16, color: "#E8C990", letterSpacing: 2, marginBottom: 20 }}>SYSTEM SECURITY</h3>
                <p className="oa-raj" style={{ color: "rgba(198,160,110,.6)", fontSize: 15, lineHeight: 1.5 }}>
                  Password reset capabilities require cryptographic isolation and are executed through the standard application framework.
                </p>
                <button onClick={() => setDraftTheme("default")} style={{ marginTop: 20, padding: "10px 20px", background: "rgba(198,160,110,.1)", border: "1px solid rgba(198,160,110,.3)", color: "#C6A06E", borderRadius: 4, fontFamily: "Orbitron, sans-serif", fontSize: 11, letterSpacing: 1.5, cursor: "pointer" }}>
                  REVERT TO STANDARD ENGINE
                </button>
              </div>
            )}
          </div>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{ marginTop: 30, display: "flex", gap: 12, justifyContent: "flex-end" }}>
          <button onClick={handleReset} disabled={!isDirty} style={{ padding: "12px 24px", background: "rgba(198,160,110,.1)", border: "1px solid rgba(198,160,110,.3)", color: isDirty ? "#C6A06E" : "rgba(198,160,110,.4)", borderRadius: 6, fontFamily: "'Orbitron', sans-serif", fontSize: 11, letterSpacing: 1.5, cursor: isDirty ? "pointer" : "default" }}>
            RESET
          </button>
          <button onClick={handleSave} disabled={!isDirty} style={{ padding: "12px 24px", background: isDirty ? "#C6A06E" : "rgba(198,160,110,.1)", border: "1px solid rgba(198,160,110,.3)", color: isDirty ? "#000" : "rgba(198,160,110,.4)", borderRadius: 6, fontFamily: "'Orbitron', sans-serif", fontSize: 11, letterSpacing: 1.5, fontWeight: 900, cursor: isDirty ? "pointer" : "default" }}>
            SAVE CHANGES
          </button>
        </div>
      </div>
    </AmoledThemeLayoutBase>
  );
}

export function AmoledProfile() {
  const navigate = useNavigate();
  const authUser = useAuthStore(s => s.authUser);

  return (
    <AmoledThemeLayoutBase>
      <div style={{ maxWidth: 800, margin: "0 auto", paddingBottom: 40 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <button onClick={() => navigate("/")} style={{ background: "transparent", color: "rgba(198,160,110,.6)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontFamily: "'Share Tech Mono', monospace", transition: "color 0.2s" }} onMouseEnter={e => e.currentTarget.style.color = "#C6A06E"} onMouseLeave={e => e.currentTarget.style.color = "rgba(198,160,110,.6)"}>
            ← RETURN TO ORBIT
          </button>
          <button onClick={useAuthStore.getState().logout} style={{ padding: "8px 16px", background: "rgba(255,85,85,.05)", border: "1px solid rgba(255,85,85,.3)", color: "#FF5555", borderRadius: 6, fontFamily: "Orbitron, sans-serif", fontSize: 10, letterSpacing: 1.5, cursor: "pointer" }}>
            LOGOUT
          </button>
        </div>

        <div style={{ background: "rgba(15,15,15,.88)", backdropFilter: "blur(22px)", border: "1px solid rgba(198,160,110,.2)", borderRadius: 12, padding: 40, textAlign: "center" }}>
          <div style={{ width: 100, height: 100, borderRadius: "50%", background: "linear-gradient(135deg, #C6A06E, #4ECDC4)", margin: "0 auto 24px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40 }}>
            {authUser?.username?.charAt(0).toUpperCase() || "U"}
          </div>

          <h1 className="oa-orbitron" style={{ fontSize: 24, color: "#C6A06E", letterSpacing: 2, marginBottom: 8 }}>
            {authUser?.username || "USER_UNKNOWN"}
          </h1>

          <p className="oa-mono" style={{ fontSize: 12, color: "rgba(198,160,110,.5)", marginBottom: 24 }}>
            {authUser?.email || "no-email@orbit.local"}
          </p>

          <div style={{ fontSize: 14, color: "rgba(198,160,110,.55)", fontFamily: "'Rajdhani',monospace", lineHeight: 1.7 }}>
            {authUser?.bio || "No mission logs recorded. Initialize your profile to begin transmitting."}
          </div>
        </div>
      </div>
    </AmoledThemeLayoutBase>
  );
}

export function AmoledSpotify() {
  const navigate = useNavigate();

  return (
    <AmoledThemeLayoutBase>
      <div style={{ maxWidth: 800, margin: "0 auto", paddingBottom: 40, height: "100%", display: "flex", flexDirection: "column" }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <button onClick={() => window.location.href = "/"} style={{ background: "transparent", color: "rgba(198,160,110,.6)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontFamily: "'Share Tech Mono', monospace", transition: "color 0.2s" }} onMouseEnter={e => e.currentTarget.style.color = "#C6A06E"} onMouseLeave={e => e.currentTarget.style.color = "rgba(198,160,110,.6)"}>
            ← RETURN TO ORBIT
          </button>
          <button onClick={useAuthStore.getState().logout} style={{ padding: "8px 16px", background: "rgba(255,85,85,.05)", border: "1px solid rgba(255,85,85,.3)", color: "#FF5555", borderRadius: 6, fontFamily: "Orbitron, sans-serif", fontSize: 10, letterSpacing: 1.5, cursor: "pointer" }}>
            LOGOUT
          </button>
        </div>

        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <ReusableSpotifyPlayer theme="amoled" className="oa-card oa-bracket oa-borderglow" />
        </div>
      </div>
    </AmoledThemeLayoutBase>
  );
}
