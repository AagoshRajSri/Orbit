import { useState, useEffect, memo, useMemo } from "react";
import UniversalChatContainer from "../components/UniversalChatContainer";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import toast from "../lib/toast";
import { THEMES, THEME_LABELS } from "../constants";
import { useSpotifyStore } from "../store/useSpotifyStore";
import { useNexusStore } from "../store/useNexusStore";
import { useChatStore } from "../store/useChatStore";
import NexusActionOverlay from "../components/NexusActionOverlay";
import { Music } from "lucide-react";
import { API_URL } from "../config";


/* ─────────────────────────────── KEYFRAMES ─────────────────────────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;900&family=Rajdhani:wght@300;400;500;600;700&family=Share+Tech+Mono&family=Inter:wght@300;400;500;600&display=swap');

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
  border:1px solid rgba(198,160,110,.2);
  border-radius:12px;
  transition:all .32s cubic-bezier(.23,1,.32,1);
  position:relative; overflow:hidden;
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

/* ── AMOLED Void Chat Theme ── */
.amoled-chat-env .nxc-shell {
  background: #000000 !important;
  border: none !important;
  box-shadow: 0 0 0 1px #6F00FF inset, 0 0 40px rgba(111,0,255,0.2) !important;
  background-image: radial-gradient(circle at 120px 20px, rgba(111,0,255,0.15) 0%, transparent 300px) !important;
}
.amoled-chat-env .nexus-chat-header { 
  background: transparent !important; 
  border-bottom: none !important;
}
.amoled-chat-env .nexus-chat-header * { color: #ffffff !important; font-family: 'Rajdhani', sans-serif !important; }
.amoled-chat-env .nexus-chat-header .nxc-name { font-family: 'Orbitron', sans-serif !important; letter-spacing: 2px !important; }

.amoled-chat-env .nxc-utility-group, .amoled-chat-env .nxc-telemetry-capsule {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
}
.amoled-chat-env .nxc-hbtn, .amoled-chat-env .nxc-aero-btn {
  background: transparent !important; color: #fff !important; border: none !important;
}
.amoled-chat-env .bg-white\/20 { display: none !important; }

.amoled-chat-env .nxi-shell { 
  background: rgba(20,0,40,0.8) !important; 
  backdrop-filter: blur(10px) !important;
  border-top: 1px solid #6F00FF !important;
}
.amoled-chat-env .nxi-textarea { 
  background: rgba(198,160,110,0.05) !important; border: 1px solid rgba(198,160,110,0.1) !important; 
  color: #F0D5A0 !important; 
  font-family: 'Rajdhani', sans-serif !important; 
  font-size: 16px !important; 
}
.amoled-chat-env .nxi-textarea:focus { border-color: #C6A06E !important; box-shadow: 0 0 15px rgba(198,160,110,0.2) !important; }
.amoled-chat-env .nxi-send.ready { 
  background: linear-gradient(135deg, #C6A06E, #8B6914) !important; 
  border: 1px solid #C6A06E !important;
  color: #000 !important;
}
.amoled-chat-env .nxi-tool-btn, .amoled-chat-env .nxi-mic { color: #C6A06E !important; }

.amoled-chat-env .msg-bubble-mine { 
  background: linear-gradient(135deg, #C6A06E, #8B6914) !important; 
  border: 1px solid #C6A06E !important; 
  color: #000 !important;
  font-family: 'Rajdhani', sans-serif !important;
  font-weight: 500 !important;
}
.amoled-chat-env .msg-bubble-other { 
  background: rgba(30,30,30,0.9) !important; 
  border: 1px solid rgba(198,160,110,0.2) !important; 
  color: #C6A06E !important;
  font-family: 'Rajdhani', sans-serif !important;
}


@media (max-width: 800px) {
  .oa-main-grid { grid-template-columns: 1fr !important; }
  .oa-desktop-nav { flex-wrap: wrap !important; height: auto !important; padding: 10px !important; gap: 8px !important; }
  .oa-sidebar { width: 100% !important; border-right: none !important; border-bottom: 1px solid rgba(198,160,110,.12) !important; max-height: 240px !important; }
  .oa-main-wrapper { flex-direction: column !important; }
  .oa-settings-wrapper { flex-direction: column !important; gap: 16px !important; }
  .oa-settings-nav { width: 100% !important; }
  .oa-profile-wrapper { flex-direction: column !important; gap: 16px !important; }
}
`;

/* ─────────────────────────────── SUB-COMPONENTS ────────────────────────── */
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

const DataStream = ({ x, delay, dur }) => {
  const chars = "01ABCDEF※△▽◆■★";
  const stream = Array.from({ length: 14 }, (_, i) => chars[(i * 7) % chars.length]);
  return (
    <div className="oa-stream-char" style={{ left: x, top: "-90px", animationDuration: dur, animationDelay: delay }}>
      {stream.map((c, i) => <div key={i}>{c}</div>)}
    </div>
  );
};

const OrbitLogo = () => (
  <div style={{ position: "relative", width: 28, height: 28, flexShrink: 0 }}>
    <div style={{ position: "absolute", inset: 0, border: "1.2px solid rgba(198,160,110,.55)", borderRadius: "50%", animation: "oa-cw 12s linear infinite" }} />
    <div style={{ position: "absolute", inset: 4.5, border: "1px solid rgba(78,205,196,.45)", borderRadius: "50%", animation: "oa-ccw 8s linear infinite" }} />
    <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 7, height: 7, background: "#C6A06E", borderRadius: "50%", boxShadow: "0 0 8px #C6A06E,0 0 15px rgba(198,160,110,.4)" }} />
    <div style={{ position: "absolute", top: "50%", left: "-2px", width: 5, height: 5, background: "#4ECDC4", borderRadius: "50%", boxShadow: "0 0 6px #4ECDC4", marginTop: -2.5, animation: "oa-cw 12s linear infinite", transformOrigin: "16px 0" }} />
  </div>
);

const Waveform = ({ playing }) => (
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
);

/* ── Spotify mock card ── */
const SpotifyCard = () => {
  const [playing, setPlaying] = useState(true);
  const [progress, setProgress] = useState(38);
  const [vol, setVol] = useState(70);
  const [hov, setHov] = useState(false);

  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => setProgress(p => p >= 100 ? 0 : +(p + 0.22).toFixed(2)), 200);
    return () => clearInterval(t);
  }, [playing]);

  const handleVol = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    setVol(Math.round(Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100))));
  };

  const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  const totalSec = 214;
  const currSec = (progress / 100) * totalSec;
  const navigate = useNavigate();

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
            <div style={{ width: 80, height: 80, borderRadius: 16, background: "linear-gradient(135deg,#4ECDC4,#121212)", border: `1.5px solid ${hov ? "#4ECDC4" : "rgba(198,160,110,.4)"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, animation: "oa-float 4s ease-in-out infinite", transition: "all .4s" }}>🎵</div>
            <div style={{ position: "absolute", inset: -5, border: `1px solid ${hov ? "rgba(78,205,196,.3)" : "rgba(198,160,110,.2)"}`, borderRadius: 20, animation: "oa-cw 12s linear infinite" }} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <div style={{ width: 8, height: 8, background: "#4ECDC4", borderRadius: "50%", boxShadow: "0 0 10px #4ECDC4" }} />
              <span className="oa-mono" style={{ fontSize: 10, color: "#4ECDC4", letterSpacing: 2 }}>SPOTIFY // {playing ? "ACTIVE" : "PAUSED"}</span>
            </div>
            <div className="oa-orbitron" style={{ fontSize: 22, color: "#fff", fontWeight: 800, letterSpacing: 2, marginBottom: 4 }}>Reflections</div>
            <div className="oa-raj" style={{ fontSize: 16, color: "rgba(198,160,110,.5)", letterSpacing: 1.5 }}>The Neighbourhood</div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
           <Waveform playing={playing} />
        </div>
      </div>

      <div style={{ marginTop: 28, position: "relative", zIndex: 1 }}>
        <div style={{ height: 4, background: "rgba(198,160,110,.1)", borderRadius: 4, marginBottom: 16, position: "relative" }}>
          <div className="oa-progress-fill" style={{ width: `${progress}%`, background: "#4ECDC4" }} />
          <div style={{ position: "absolute", top: "50%", left: `${progress}%`, width: 12, height: 12, background: "#fff", borderRadius: "50%", transform: "translate(-50%,-50%)", boxShadow: "0 0 15px #4ECDC4" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", gap: 30, alignItems: "center" }}>
            {[["⏮", false], [playing ? "⏸" : "▶", true], ["⏭", false]].map(([icon, primary], i) => (
              <button key={i} onClick={(e) => { e.stopPropagation(); if (i === 1) setPlaying(p => !p); }} style={{ background: "none", border: "none", cursor: "pointer", color: primary ? "#4ECDC4" : "rgba(198,160,110,.4)", fontSize: primary ? 26 : 18, transition: "all .2s" }}>{icon}</button>
            ))}
            <span className="oa-mono" style={{ fontSize: 11, color: "rgba(198,160,110,.3)", letterSpacing: 2 }}>{fmt(currSec)} / {fmt(totalSec)}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 14, color: "rgba(198,160,110,.3)" }}>🔊</span>
            <div onClick={(e) => { e.stopPropagation(); handleVol(e); }} style={{ width: 100, height: 4, background: "rgba(198,160,110,.15)", borderRadius: 4, cursor: "pointer", position: "relative" }}>
              <div style={{ width: `${vol}%`, background: "#4ECDC4", borderRadius: 4, height: "100%" }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── Generic action card ── */
export const ActionCard = ({ icon, title, subtitle, color = "#C6A06E", badge, teal, onClick }) => {
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
          <div style={{ fontSize: 28, fontWeight: 300 }}>◹</div>
        </div>
      </div>

      {/* Edge highlight on hover */}
      <div style={{ position: "absolute", left: 0, top: "20%", bottom: "20%", width: 2, background: color, opacity: hov ? 1 : 0, transition: "all .4s ease" }} />
    </div>
  );
};

/* ── Sidebar ── */
const Sidebar = ({ activeTab, setActiveTab, setShowOrbitExplorer, onJoin, onNexus, nexuses, isNexusesLoading, setSelectedNexus, users, setSelectedUser, nexusUnread, setNexusActionView }) => {
  const navigate = useNavigate();
  const { authUser } = useAuthStore();
  const orbits = ["# NEXUS PRIME", "# DARKWEB", "# CONSTELLATION", "# SHADOW OPS"];
  const contacts = [["CIPHER", "⚡", "#C6A06E"], ["NOVA", "◈", "#4ECDC4"], ["PHANTOM", "☽", "#9B59B6"], ["AXIOM", "▲", "#E74C3C"]];

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
    return [...nexuses].sort((a, b) => {
      const aPinned = pinnedNexuses.includes(a._id);
      const bPinned = pinnedNexuses.includes(b._id);
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;
      return 0;
    });
  }, [nexuses, pinnedNexuses]);

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
          {[["orbits", "◈ ORBITS", "teal"], ["contacts", "◉ CONTACTS", "gold"]].map(([tab, label, c]) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              style={{
                flex: 1, padding: "10px 6px", borderRadius: 8, fontSize: 11, letterSpacing: 2, cursor: "pointer", fontFamily: "Orbitron,sans-serif",
                background: activeTab === tab ? (c === "teal" ? "rgba(78,205,196,.18)" : "rgba(198,160,110,.16)") : (c === "teal" ? "rgba(78,205,196,.06)" : "rgba(198,160,110,.06)"),
                border: `1px solid ${activeTab === tab ? (c === "teal" ? "rgba(78,205,196,.7)" : "rgba(198,160,110,.7)") : (c === "teal" ? "rgba(78,205,196,.3)" : "rgba(198,160,110,.3)")}`,
                color: c === "teal" ? "#4ECDC4" : "#C6A06E",
                boxShadow: activeTab === tab ? (c === "teal" ? "0 0 15px rgba(78,205,196,.3)" : "0 0 15px rgba(198,160,110,.3)") : "none",
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
                <div key={n._id} onClick={() => { setSelectedNexus(n); }} style={{ display: "flex", flexDirection: "column", padding: "10px 12px", borderRadius: 8, marginBottom: 4, cursor: "pointer", color: "#C6A06E", background: nexusColors[n._id] || "rgba(198,160,110,.05)", border: "1px solid rgba(198,160,110,.1)", transition: "all .2s", fontFamily: "Rajdhani,sans-serif", fontSize: 15, fontWeight: 600, letterSpacing: 1, position: "relative" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(198,160,110,.3)"; e.currentTarget.style.boxShadow = "inset 0 0 10px rgba(198,160,110,.2)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(198,160,110,.1)"; e.currentTarget.style.boxShadow = "none"; }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10, width: "100%" }}>
                    <div style={{ width: 24, height: 24, borderRadius: "50%", background: "rgba(198,160,110,0.1)", border: "1px solid rgba(198,160,110,0.3)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
                      {n.avatar ? <img src={n.avatar} alt={n.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : "◈"}
                    </div>
                    <div style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n.name}</div>
                    {nexusUnread[n._id] > 0 && (
                       <div style={{ background: "#C6A06E", color: "#000", fontSize: 10, fontWeight: 900, padding: "1px 6px", borderRadius: 4, boxShadow: "0 0 10px rgba(198,160,110,0.4)" }}>{nexusUnread[n._id]}</div>
                    )}
                    <span style={{ fontSize: 10, color: "rgba(198,160,110,0.5)", background: "rgba(198,160,110,.1)", padding: "2px 6px", borderRadius: 4 }}>{n.members?.length || 0}</span>
                  
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
                        💎
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
                                  Mark 🎨
                              </button>
                              <button 
                                  onClick={(e) => togglePin(n._id, e)}
                                  style={{ flex: 1, padding: '6px', background: "rgba(198,160,110,.1)", border: "1px solid rgba(198,160,110,.4)", borderRadius: 4, fontSize: 11, color: "#C6A06E", fontFamily: "Orbitron, sans-serif", cursor: 'pointer' }}
                              >
                                  {pinnedNexuses.includes(n._id) ? "Unpin 📌" : "Pin 📌"}
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
                <div key={u._id} onClick={() => { setSelectedUser(u); }} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 8, marginBottom: 4, cursor: "pointer", transition: "all .2s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(78,205,196,.08)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <div style={{ width: 38, height: 38, borderRadius: "50%", background: "linear-gradient(135deg,rgba(78,205,196,0.1),transparent)", border: "1.5px solid rgba(78,205,196,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0, overflow: "hidden" }}>
                    {u.profilePic ? <img src={u.profilePic} alt={u.username} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ color: "#4ECDC4" }}>{u.username?.[0]?.toUpperCase()}</div>}
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
      <div onClick={() => window.dispatchEvent(new CustomEvent("toggle-orbit-mode"))} 
        style={{ padding: "16px 18px", borderTop: "1px solid rgba(198,160,110,.1)", background: "linear-gradient(0deg,rgba(198,160,110,.04),transparent)", position: "relative", zIndex: 10, cursor: "pointer", transition: "all .2s" }} 
        onMouseEnter={e => e.currentTarget.style.background = "linear-gradient(0deg,rgba(198,160,110,.08),transparent)"} 
        onMouseLeave={e => e.currentTarget.style.background = "linear-gradient(0deg,rgba(198,160,110,.04),transparent)"}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ position: "relative" }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: "linear-gradient(135deg,#3d1a00,#1a0a00)", border: "2px solid rgba(198,160,110,.5)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, animation: "oa-float 4s ease-in-out infinite" }}>🚀</div>
            <div style={{ position: "absolute", bottom: 2, right: 2, width: 12, height: 12, background: "#00FF88", borderRadius: "50%", border: "2px solid #000", boxShadow: "0 0 8px #00FF88" }} />
          </div>
          <div>
            <div className="oa-orbitron" style={{ fontSize: 13, color: "#C6A06E", letterSpacing: 2, fontWeight: 900 }}>
              ENTER YOUR ORBIT
            </div>
            <div className="oa-mono" style={{ fontSize: 10, color: "rgba(78,205,196,.55)", letterSpacing: 2 }}>INITIATE HYPERSPACE</div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── Topbar ── */
const TopBar = () => {
  const [time, setTime] = useState(() => new Date().toLocaleTimeString());
  const navigate = useNavigate();
  const { logout } = useAuthStore();

  useEffect(() => {
    const t = setInterval(() => setTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="oa-desktop-nav" style={{ height: 44, background: "rgba(2,2,2,.96)", borderBottom: "1px solid rgba(198,160,110,.14)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", backdropFilter: "blur(22px)", flexShrink: 0, zIndex: 20, position: "relative" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={() => navigate("/")} style={{ background: "transparent", border: "none", color: "rgba(198,160,110,.5)", cursor: "pointer", fontSize: 16, padding: "0 10px 0 0", display: location.pathname === "/" ? "none" : "block" }} onMouseEnter={e => e.currentTarget.style.color = "#C6A06E"} onMouseLeave={e => e.currentTarget.style.color = "rgba(198,160,110,.5)"}>
          ←
        </button>
        <OrbitLogo />
        <span className="oa-shimmer-text oa-orbitron" style={{ fontSize: 14, fontWeight: 700, letterSpacing: 3 }}>ORBIT</span>
        <div className="oa-mono" style={{ fontSize: 9, color: "rgba(198,160,110,.3)", letterSpacing: 2, paddingLeft: 12, borderLeft: "1px solid rgba(198,160,110,.18)" }}>v2.4.1</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div className="oa-mono" style={{ fontSize: 10, color: "rgba(78,205,196,.65)", letterSpacing: 2, paddingRight: 16 }}>
          {time}<span style={{ animation: "oa-blink 1s step-end infinite", display: "inline-block" }}>_</span>
        </div>
        {[["⚙", "SETTINGS", () => navigate("/settings")], ["◉", "PROFILE", () => navigate("/profile")], ["⏻", "LOGOUT", logout]].map(([icon, label, action]) => (
          <button key={label} onClick={action} style={{ padding: "5px 10px", borderRadius: 6, fontSize: 8, letterSpacing: 1.5, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontFamily: "Orbitron,sans-serif", background: "rgba(198,160,110,.08)", border: "1px solid rgba(198,160,110,.35)", color: "#C6A06E", transition: "all .25s" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(198,160,110,.18)"; e.currentTarget.style.boxShadow = "0 0 12px rgba(198,160,110,.3)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(198,160,110,.08)"; e.currentTarget.style.boxShadow = "none"; }}>
            <span>{icon}</span>{label}
          </button>
        ))}
      </div>
    </div>
  );
};

/* ─────────────────────────────── MAIN EXPORT ────────────────────────────── */
export default function OrbitApp({ children, title = "SECURE TERMINAL" }) {
  const [activeTab, setActiveTab] = useState("orbits");
  const [showOrbitExplorer, setShowOrbitExplorer] = useState(false);
  const [mounted, setMounted] = useState(false);
  const navigate = useNavigate();
  const { nexusActionView, setNexusActionView, nexuses, setSelectedNexus, isNexusesLoading, nexusUnread, selectedNexus, selectedNexusId } = useNexusStore();
  const nexusSelected = Boolean(selectedNexus || selectedNexusId);
  const { users, selectedUser, setSelectedUser } = useChatStore();

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80);
    return () => clearTimeout(t);
  }, []);

  const fade = (delay) => ({
    opacity: mounted ? 1 : 0,
    transform: mounted ? "translateY(0)" : "translateY(20px)",
    transition: `all .6s ease ${delay}s`,
  });

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* Root */}
      <div style={{ width: "100%", height: "100vh", background: "#000", display: "flex", flexDirection: "column", overflow: "hidden", fontFamily: "'Inter','Rajdhani',sans-serif", position: "relative" }}>

        <TopBar title={title} />

        <div className="oa-main-wrapper" style={{ display: "flex", flex: 1, overflow: "hidden" }}>
          <Sidebar 
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
            setShowOrbitExplorer={setShowOrbitExplorer} 
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

          {/* ── Main content ── */}
          <div style={{ flex: 1, overflow: "hidden", position: "relative", background: "#000", display: "flex", flexDirection: "column" }}>

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
                <UniversalChatContainer type="nexus" />
              </div>
            ) : selectedUser ? (
              <div className="amoled-chat-env" style={{ position: "absolute", inset: 0, zIndex: 50, display: "flex", flexDirection: "column", background: "#000" }}>
                <UniversalChatContainer type="dm" />
              </div>
            ) : (
              <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: 28, position: "relative" }}>
                <StarField count={40} />
                <div className="oa-nebula" style={{ width: 420, height: 420, background: "rgba(198,160,110,.04)", top: "18%", left: "28%", animationDelay: "0s" }} />
                <div className="oa-nebula" style={{ width: 300, height: 300, background: "rgba(78,205,196,.035)", top: "58%", right: "12%", animationDelay: "-5s" }} />
                <div className="oa-nebula" style={{ width: 240, height: 240, background: "rgba(155,89,182,.03)", top: "8%", right: "38%", animationDelay: "-10s" }} />
                <div style={{ maxWidth: 1100 }}>

                {/* Header */}
                <div style={{ marginBottom: 28, position: "relative", zIndex: 5, ...fade(.1) }}>
                  <div className="oa-mono" style={{ fontSize: 10, color: "rgba(78,205,196,.65)", letterSpacing: 3, marginBottom: 6, display: "flex", alignItems: "center", gap: 9 }}>
                    <div style={{ width: 6, height: 6, background: "#00FF88", borderRadius: "50%", boxShadow: "0 0 8px #00FF88" }} />
                    STATUS: ONLINE — GALAXY ENGINE ACTIVE
                  </div>
                  <h1 className="oa-shimmer-text oa-orbitron" style={{ fontSize: 32, fontWeight: 900, letterSpacing: 5, marginBottom: 6 }}>WELCOME TO ORBIT</h1>
                  <p className="oa-raj" style={{ fontSize: 13, color: "rgba(198,160,110,.45)", letterSpacing: 3, margin: 0, textTransform: "uppercase" }}>SECURE ACCESS TERMINAL</p>
                </div>

                {/* Card Configuration - Change these to update everything at once */}
                {(() => {
                  const GRID_MAX_WIDTH = 1600;  // Expanded for luxury feel
                  const CARD_HEIGHT_VH = "31vh"; // Reduced height to fit bottom status bar

                  return (
                    <div
                      className="oa-main-grid"
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(2, 1fr)",
                        gap: "1.5vh", // Slightly tighter gaps
                        width: "100%",
                        maxWidth: GRID_MAX_WIDTH,
                        position: "relative",
                        zIndex: 5,
                        marginTop: "1vh"
                      }}
                    >
                      {/* Spotify Sync */}
                      <div style={{ ...fade(.2), height: CARD_HEIGHT_VH, display: "flex" }}>
                        <SpotifyCard />
                      </div>

                      {/* Direct Mission */}
                      <div style={{ ...fade(.3), height: CARD_HEIGHT_VH, display: "flex" }}>
                        <ActionCard
                          icon="💬"
                          title="DIRECT MISSION"
                          subtitle="Initiate secure peer-to-peer frequencies with elite contacts"
                          color="#4ECDC4"
                          onClick={() => window.dispatchEvent(new CustomEvent("toggle-orbit-mode"))}
                        />
                      </div>

                      {/* Priority Alerts */}
                      <div style={{ ...fade(.4), height: CARD_HEIGHT_VH, display: "flex" }}>
                        <ActionCard
                          icon="🔔"
                          title="PRIORITY ALERTS"
                          subtitle="Real-time synchronization with your professional orbit"
                          color="#C6A06E"
                          badge={3}
                        />
                      </div>

                      {/* Atelier */}
                      <div style={{ ...fade(.5), height: CARD_HEIGHT_VH, display: "flex" }}>
                        <ActionCard
                          icon="⚙"
                          title="ATELIER"
                          subtitle="Fine-tune your workspace aesthetic and behavior"
                          color="#9B59B6"
                          onClick={() => navigate("/settings")}
                        />
                      </div>
                    </div>
                  );
                })()}

                {/* Status bar */}
                <div style={{ marginTop: 26, width: "100%", display: "flex", alignItems: "center", gap: 22, flexWrap: "wrap", position: "relative", zIndex: 5, ...fade(.7) }}>
                  {[
                    { label: "LATENCY", value: "12ms", color: "#00FF88" },
                    { label: "ENCRYPTION", value: "AES-256", color: "#4ECDC4" },
                    { label: "NODES", value: "2,847", color: "#C6A06E" },
                    { label: "UPTIME", value: "99.98%", color: "#C6A06E" },
                  ].map((s) => (
                    <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 4, height: 4, background: s.color, borderRadius: "50%", boxShadow: `0 0 5px ${s.color}` }} />
                      <span className="oa-mono" style={{ fontSize: 9, color: "rgba(198,160,110,.32)", letterSpacing: 2 }}>{s.label}:</span>
                      <span className="oa-mono" style={{ fontSize: 9, color: s.color, letterSpacing: 1 }}>{s.value}</span>
                    </div>
                  ))}
                  <div style={{ marginLeft: "auto" }}>
                    <span className="oa-mono" style={{ fontSize: 9, color: "rgba(198,160,110,.2)", letterSpacing: 2 }}>✦ 80 FPS GALAXY ENGINE ✦</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

        {/* Fixed sparkle */}
        <div style={{ position: "fixed", bottom: 20, right: 22, fontSize: 22, color: "rgba(198,160,110,.45)", animation: "oa-float 3s ease-in-out infinite", filter: "drop-shadow(0 0 8px rgba(198,160,110,.4))", pointerEvents: "none" }}>✦</div>
      </div>
    </>
  );
}

const ToggleRow = ({ label, description, checked, onChange }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 0", borderBottom: "1px solid rgba(198,160,110,.1)", flexWrap: "wrap", gap: 16 }}>
    <div style={{ flex: 1, minWidth: 200 }}>
      <div className="oa-orbitron" style={{ fontSize: 13, color: "#C6A06E", letterSpacing: 1 }}>{label}</div>
      <div className="oa-raj" style={{ fontSize: 12, color: "rgba(198,160,110,.5)", marginTop: 4, lineHeight: 1.4 }}>{description}</div>
    </div>
    <div
      onClick={() => onChange(!checked)}
      style={{ width: 44, height: 22, borderRadius: 11, background: checked ? "rgba(78,205,196,.2)" : "rgba(10,10,10,.8)", border: checked ? "1px solid #4ECDC4" : "1px solid rgba(198,160,110,.2)", position: "relative", cursor: "pointer", transition: "all .3s" }}
    >
      <div style={{ position: "absolute", top: 2, left: checked ? 24 : 2, width: 16, height: 16, borderRadius: "50%", background: checked ? "#4ECDC4" : "rgba(198,160,110,.4)", transition: "all .3s", boxShadow: checked ? "0 0 8px #4ECDC4" : "none" }} />
    </div>
  </div>
);

export function AmoledSettings({
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
  return (
    <OrbitApp>
      <div style={{ maxWidth: 1000, margin: "0 auto", paddingBottom: 40 }}>
        <button onClick={() => navigate("/")} style={{ marginBottom: 20, background: "transparent", color: "rgba(198,160,110,.6)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontFamily: "'Share Tech Mono', monospace", transition: "color 0.2s" }} onMouseEnter={e => e.currentTarget.style.color = "#C6A06E"} onMouseLeave={e => e.currentTarget.style.color = "rgba(198,160,110,.6)"}>
          ← RETURN TO ORBIT
        </button>

        {/* Header */}
        <div style={{ marginBottom: 30, display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button onClick={() => navigate("/")} style={{ background: "transparent", border: "1px solid rgba(198,160,110,.4)", color: "#C6A06E", width: 44, height: 44, borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, transition: "all 0.3s" }} onMouseEnter={e => { e.currentTarget.style.background = "rgba(198,160,110,.1)"; e.currentTarget.style.borderColor = "#C6A06E"; }} onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "rgba(198,160,110,.4)"; }}>
              ◂
            </button>
            <div>
              <div className="oa-mono" style={{ fontSize: 10, color: "rgba(198,160,110,.65)", letterSpacing: 3, marginBottom: 8 }}>
                SYSTEM // CONFIGURATION
              </div>
              <h1 className="oa-shimmer-text oa-orbitron" style={{ fontSize: 32, fontWeight: 900, letterSpacing: 4, marginBottom: 6 }}>
                PREFERENCES
              </h1>
            </div>
          </div>

          {/* Action Bar */}
          <div style={{ display: "flex", gap: 12 }}>
            <button onClick={handleReset} disabled={!isDirty} style={{ padding: "8px 16px", background: "rgba(198,160,110,.05)", border: "1px solid rgba(198,160,110,.2)", color: isDirty ? "#C6A06E" : "rgba(198,160,110,.4)", borderRadius: 6, fontFamily: "Orbitron, sans-serif", fontSize: 10, letterSpacing: 1.5, cursor: isDirty ? "pointer" : "default" }}>
              RESET
            </button>
            <button onClick={handleSave} disabled={!isDirty} style={{ padding: "8px 16px", background: isDirty ? "rgba(78,205,196,.1)" : "rgba(78,205,196,.02)", border: isDirty ? "1px solid #4ECDC4" : "1px solid rgba(78,205,196,.2)", color: isDirty ? "#4ECDC4" : "rgba(78,205,196,.4)", borderRadius: 6, fontFamily: "Orbitron, sans-serif", fontSize: 10, letterSpacing: 1.5, cursor: isDirty ? "pointer" : "default", boxShadow: isDirty ? "0 0 10px rgba(78,205,196,.2)" : "none" }}>
              COMMIT CHANGES
            </button>
            <button onClick={useAuthStore.getState().logout} style={{ padding: "8px 16px", background: "rgba(255,85,85,.05)", border: "1px solid rgba(255,85,85,.3)", color: "#FF5555", borderRadius: 6, fontFamily: "Orbitron, sans-serif", fontSize: 10, letterSpacing: 1.5, cursor: "pointer" }}>
              LOGOUT
            </button>
          </div>
        </div>

        <div className="oa-settings-wrapper" style={{ display: "flex", gap: 30, alignItems: "flex-start", flexWrap: "wrap", position: "relative", zIndex: 5 }}>
          {/* Settings Nav */}
          <div className="oa-card oa-settings-nav" style={{ width: 220, padding: 12, flexShrink: 0 }}>
            {[
              { id: "profile", label: "IDENTITY", icon: "◈" },
              { id: "sound", label: "ACOUSTICS", icon: "🔊" },
              { id: "appearance", label: "APPEARANCE", icon: "✨" },
              { id: "notifications", label: "NOTIFICATIONS", icon: "🔔" },
              { id: "orbit", label: "ORBIT ENGINE", icon: "🪐" },
              { id: "security", label: "SECURITY", icon: "🔒" }
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveSection(tab.id)} style={{ width: "100%", textAlign: "left", padding: "12px 14px", background: activeSection === tab.id ? "rgba(198,160,110,.1)" : "transparent", border: "none", borderLeft: activeSection === tab.id ? "2px solid #C6A06E" : "2px solid transparent", color: activeSection === tab.id ? "#C6A06E" : "rgba(198,160,110,.6)", fontFamily: "'Orbitron', sans-serif", fontSize: 11, letterSpacing: 1.5, cursor: "pointer", transition: "all .2s", display: "flex", alignItems: "center", gap: 10, marginBottom: 2 }}>
                <span>{tab.icon}</span> {tab.label}
              </button>
            ))}
          </div>

          {/* Settings Content */}
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
                <h3 className="oa-orbitron" style={{ fontSize: 16, color: "#E8C990", letterSpacing: 2, marginBottom: 20 }}>ACOUSTIC FEEDBACK</h3>
                <ToggleRow label="GLOBAL EFFECTS" description="Enable or disable all acoustic signals." checked={draftSoundSettings.effectsEnabled} onChange={v => setDraftSoundSettings(p => ({ ...p, effectsEnabled: v }))} />
                <ToggleRow label="TRANSMISSION SOUNDS" description="Auditory ping when a direct message is received." checked={draftSoundSettings.messageSound} onChange={v => setDraftSoundSettings(p => ({ ...p, messageSound: v }))} />
                <ToggleRow label="HAPTIC CLICKS" description="Subtle acoustic clicks on UI interactions." checked={draftSoundSettings.clickSound} onChange={v => setDraftSoundSettings(p => ({ ...p, clickSound: v }))} />

                <div style={{ marginTop: 20 }}>
                  <label className="oa-mono" style={{ fontSize: 11, color: "rgba(198,160,110,.6)", letterSpacing: 2, display: "block", marginBottom: 10 }}>MASTER GAIN {(draftSoundSettings.volume * 100).toFixed(0)}%</label>
                  <input type="range" min="0" max="1" step="0.05" value={draftSoundSettings.volume} onChange={(e) => setDraftSoundSettings(p => ({ ...p, volume: parseFloat(e.target.value) }))} style={{ width: "100%", accentColor: "#C6A06E" }} />
                </div>
              </div>
            )}

            {activeSection === "appearance" && (
              <div>
                <h3 className="oa-orbitron" style={{ fontSize: 16, color: "#E8C990", letterSpacing: 2, marginBottom: 20 }}>VISUAL THEME</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 16 }}>
                  {THEMES.map(t => {
                    const isSelected = draftTheme === t;
                    
                    // Fixed preview colors for each theme
                    let previewPrimary = "#E8C990"; // default (gold)
                    let previewBg = "#000000";
                    
                    if (t === "light") { previewPrimary = "#3b82f6"; previewBg = "#ffffff"; }
                    else if (t === "dark") { previewPrimary = "#ef4444"; previewBg = "#0a0a0a"; }
                    else if (t === "neon-cyberpunk") { previewPrimary = "#8b5cf6"; previewBg = "#0c0e14"; }
                    else if (t === "gamer-high-energy") { previewPrimary = "#ff2d78"; previewBg = "#080614"; }
                    else if (t === "pastel-dream") { previewPrimary = "#e060b0"; previewBg = "#ffd4ee"; }
                    else if (t === "amoled-dark") { previewPrimary = "#E8C990"; previewBg = "#000000"; }

                    return (
                      <div key={t} onClick={() => setDraftTheme(t)} style={{ padding: 16, borderRadius: 8, border: isSelected ? "1px solid #4ECDC4" : "1px solid rgba(198,160,110,.2)", background: isSelected ? "rgba(78,205,196,.05)" : "rgba(10,10,10,.6)", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 10, transition: "all .2s" }}>
                        {/* Tiny Preview Box */}
                        <div style={{ width: "100%", height: 30, borderRadius: 4, background: previewBg, border: "1px solid rgba(198,160,110,.2)", display: "flex", overflow: "hidden" }}>
                          <div style={{ flex: 1, background: previewPrimary }} />
                          <div style={{ flex: 1, background: previewBg }} />
                        </div>
                        <span className="oa-mono" style={{ fontSize: 10, color: isSelected ? "#4ECDC4" : "rgba(198,160,110,.6)", letterSpacing: 1.5, textAlign: "center" }}>
                          {THEME_LABELS[t] || t.toUpperCase()}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {activeSection === "notifications" && (
              <div>
                <h3 className="oa-orbitron" style={{ fontSize: 16, color: "#E8C990", letterSpacing: 2, marginBottom: 20 }}>ALERT SYSTEMS</h3>
                <ToggleRow label="DESKTOP OVERLAYS" description="Show visual toast notifications on your HUD." checked={draftNotifications.desktop} onChange={v => setDraftNotifications(p => ({ ...p, desktop: v }))} />
                <ToggleRow label="AUDIO CUES" description="Play auditory pings for incoming waves." checked={draftNotifications.sound} onChange={v => setDraftNotifications(p => ({ ...p, sound: v }))} />
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
        </div>
      </div>
    </OrbitApp>
  );
}

export function AmoledProfile() {
  const navigate = useNavigate();
  const { authUser, isUpdatingProfile, updateProfile } = useAuthStore();
  const [profileDraft, setProfileDraft] = useState({
    username: "",
    email: "",
    bio: "",
    profilePic: "",
  });
  const [selectedImg, setSelectedImg] = useState(null);

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
      const base64Image = reader.result;
      setSelectedImg(base64Image);
      setProfileDraft((prev) => ({ ...prev, profilePic: base64Image }));
    };
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!profileDraft.username.trim() || !profileDraft.email.trim()) {
      toast.error("Username and email are required.");
      return;
    }

    try {
      const payload = {
        username: profileDraft.username.trim(),
        email: profileDraft.email.trim(),
        bio: profileDraft.bio,
      };
      if (selectedImg) payload.profilePic = selectedImg;

      await updateProfile(payload);
      setSelectedImg(null);
      toast.success("Profile updated successfully.");
    } catch (error) {
      toast.error("Profile update failed.");
    }
  };

  return (
    <OrbitApp>
      <div style={{ maxWidth: 800, margin: "0 auto", paddingBottom: 40 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <button onClick={() => navigate("/")} style={{ background: "transparent", color: "rgba(198,160,110,.6)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontFamily: "'Share Tech Mono', monospace", transition: "color 0.2s" }} onMouseEnter={e => e.currentTarget.style.color = "#C6A06E"} onMouseLeave={e => e.currentTarget.style.color = "rgba(198,160,110,.6)"}>
            ← RETURN TO ORBIT
          </button>
          <button onClick={useAuthStore.getState().logout} style={{ padding: "8px 16px", background: "rgba(255,85,85,.05)", border: "1px solid rgba(255,85,85,.3)", color: "#FF5555", borderRadius: 6, fontFamily: "Orbitron, sans-serif", fontSize: 10, letterSpacing: 1.5, cursor: "pointer" }}>
            LOGOUT
          </button>
        </div>

        {/* Header */}
        <div style={{ marginBottom: 30 }}>
          <div className="oa-mono" style={{ fontSize: 10, color: "rgba(198,160,110,.65)", letterSpacing: 3, marginBottom: 8 }}>
            IDENTITY // OVERRIDE
          </div>
          <h1 className="oa-shimmer-text oa-orbitron" style={{ fontSize: 32, fontWeight: 900, letterSpacing: 4, marginBottom: 6 }}>
            USER PROFILE
          </h1>
        </div>

        <form onSubmit={handleSave}>
          <div className="oa-card oa-borderglow" style={{ padding: 30, display: "flex", flexDirection: "column", gap: 24 }}>
            <div className="oa-scan" />

            <div style={{ display: "flex", gap: 30, flexWrap: "wrap", alignItems: "flex-start" }}>
              {/* Avatar Section */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "center" }}>
                <div style={{ position: "relative", width: 120, height: 120, borderRadius: "50%", background: "linear-gradient(135deg,#3d1a00,#1a0a00)", border: "2px solid #C6A06E", boxShadow: "0 0 20px rgba(198,160,110,.3)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                  <img src={profileDraft.profilePic || "/avatar.png"} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  <label htmlFor="avatar-upload" style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 35, background: "rgba(0,0,0,.7)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", backdropFilter: "blur(4px)" }}>
                    <span className="oa-mono" style={{ fontSize: 10, color: "#C6A06E", letterSpacing: 1 }}>EDIT</span>
                    <input type="file" id="avatar-upload" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={isUpdatingProfile} />
                  </label>
                </div>
              </div>

              {/* Form Fields */}
              <div style={{ flex: 1, minWidth: 260, display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label className="oa-mono" style={{ fontSize: 11, color: "rgba(198,160,110,.6)", letterSpacing: 2, display: "block", marginBottom: 6 }}>DISPLAY NAME</label>
                  <input type="text" value={profileDraft.username} onChange={e => setProfileDraft(p => ({ ...p, username: e.target.value }))} style={{ width: "100%", background: "rgba(10,10,10,.6)", border: "1px solid rgba(198,160,110,.2)", padding: "12px 14px", color: "#E8C990", borderRadius: 6, outline: "none", fontSize: 14, fontFamily: "'Rajdhani', sans-serif" }} onFocus={e => e.target.style.borderColor = "#C6A06E"} onBlur={e => e.target.style.borderColor = "rgba(198,160,110,.2)"} />
                </div>
                <div>
                  <label className="oa-mono" style={{ fontSize: 11, color: "rgba(198,160,110,.6)", letterSpacing: 2, display: "block", marginBottom: 6 }}>EMAIL DIRECTIVE</label>
                  <input type="email" value={profileDraft.email} onChange={e => setProfileDraft(p => ({ ...p, email: e.target.value }))} style={{ width: "100%", background: "rgba(10,10,10,.6)", border: "1px solid rgba(198,160,110,.2)", padding: "12px 14px", color: "#E8C990", borderRadius: 6, outline: "none", fontSize: 14, fontFamily: "'Rajdhani', sans-serif" }} onFocus={e => e.target.style.borderColor = "#C6A06E"} onBlur={e => e.target.style.borderColor = "rgba(198,160,110,.2)"} />
                </div>
                <div>
                  <label className="oa-mono" style={{ fontSize: 11, color: "rgba(198,160,110,.6)", letterSpacing: 2, display: "block", marginBottom: 6 }}>BIOGRAPHY / LOG</label>
                  <textarea value={profileDraft.bio} onChange={e => setProfileDraft(p => ({ ...p, bio: e.target.value }))} rows={4} style={{ width: "100%", background: "rgba(10,10,10,.6)", border: "1px solid rgba(198,160,110,.2)", padding: "12px 14px", color: "#E8C990", borderRadius: 6, outline: "none", fontSize: 14, fontFamily: "'Rajdhani', sans-serif", resize: "none" }} onFocus={e => e.target.style.borderColor = "#C6A06E"} onBlur={e => e.target.style.borderColor = "rgba(198,160,110,.2)"} />
                </div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", borderTop: "1px solid rgba(198,160,110,.1)", paddingTop: 20 }}>
              <button type="submit" disabled={!hasChanges || isUpdatingProfile} style={{ padding: "10px 24px", background: hasChanges ? "linear-gradient(135deg,rgba(198,160,110,.2),rgba(198,160,110,.05))" : "rgba(198,160,110,.05)", border: hasChanges ? "1px solid #C6A06E" : "1px solid rgba(198,160,110,.2)", color: hasChanges ? "#E8C990" : "rgba(198,160,110,.4)", borderRadius: 6, cursor: hasChanges ? "pointer" : "default", fontFamily: "'Orbitron', sans-serif", fontSize: 11, letterSpacing: 2, transition: "all .3s", boxShadow: hasChanges ? "0 0 15px rgba(198,160,110,.2)" : "none" }}>
                {isUpdatingProfile ? "SAVING..." : "COMMIT CHANGES"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </OrbitApp>
  );
}

/* ─────────────────────────────────────────────
   AMOLED SPOTIFY
───────────────────────────────────────────── */
export function AmoledSpotify() {
  const { spotifyLinked, currentTrack, isPlaying, pausePlayback, playTrack, skipNext, skipPrevious } = useSpotifyStore();
  const [playing, setPlaying] = useState(isPlaying || false);
  useEffect(() => { setPlaying(isPlaying); }, [isPlaying]);

  return (
    <OrbitApp>
      <div style={{ maxWidth: 800, margin: "0 auto", paddingBottom: 40, height: "100%", display: "flex", flexDirection: "column" }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <button onClick={() => window.location.href = "/"} style={{ background: "transparent", color: "rgba(198,160,110,.6)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontFamily: "'Share Tech Mono', monospace", transition: "color 0.2s" }} onMouseEnter={e => e.currentTarget.style.color = "#C6A06E"} onMouseLeave={e => e.currentTarget.style.color = "rgba(198,160,110,.6)"}>
            ← RETURN TO ORBIT
          </button>
          <button onClick={useAuthStore.getState().logout} style={{ padding: "8px 16px", background: "rgba(255,85,85,.05)", border: "1px solid rgba(255,85,85,.3)", color: "#FF5555", borderRadius: 6, fontFamily: "Orbitron, sans-serif", fontSize: 10, letterSpacing: 1.5, cursor: "pointer" }}>
            LOGOUT
          </button>
        </div>

        {/* Header */}
        <div style={{ marginBottom: 30 }}>
          <div className="oa-mono" style={{ fontSize: 10, color: "rgba(198,160,110,.65)", letterSpacing: 3, marginBottom: 8 }}>
            AUDIO // OVERRIDE
          </div>
          <h1 className="oa-shimmer-text oa-orbitron" style={{ fontSize: 32, fontWeight: 900, letterSpacing: 4, marginBottom: 6 }}>
            SPOTIFY SYNC
          </h1>
        </div>

        <div className="oa-card oa-borderglow" style={{ flex: 1, padding: 30, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 24, textAlign: "center" }}>
          <div className="oa-scan" />
          
          {!spotifyLinked ? (
            <>
              <div style={{ position: "relative", width: 140, height: 140, borderRadius: "50%", background: "linear-gradient(135deg,#0a2a2a, #000)", border: "2px solid rgba(78,205,196,0.6)", boxShadow: "0 0 40px rgba(78,205,196,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, margin: "0 auto" }}>
                🎵
              </div>
              <div style={{ maxWidth: 400, margin: "0 auto" }}>
                <p style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 15, color: "rgba(198,160,110,0.5)", letterSpacing: 2, lineHeight: 1.7, marginBottom: 32, textTransform: "uppercase" }}>
                  Link your Spotify account to the orbital network. Sync music across the grid in real-time.
                </p>
                <button
                  onClick={() => window.location.href = `${API_URL}/api/spotify/login`}
                  style={{
                    width: "100%", padding: "16px 24px",
                    background: "linear-gradient(135deg, rgba(78,205,196,0.15) 0%, rgba(78,205,196,0.05) 100%)",
                    border: "1px solid rgba(78,205,196,0.5)",
                    borderRadius: 12, cursor: "pointer",
                    fontFamily: "'Orbitron', sans-serif",
                    fontSize: 12, fontWeight: 900,
                    color: "#4ECDC4", letterSpacing: 3,
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
                    boxShadow: "0 0 30px rgba(78,205,196,0.15), inset 0 1px 0 rgba(78,205,196,0.1)",
                    transition: "all 0.3s",
                    textTransform: "uppercase",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = "linear-gradient(135deg, rgba(78,205,196,0.25) 0%, rgba(78,205,196,0.1) 100%)"; e.currentTarget.style.boxShadow = "0 0 50px rgba(78,205,196,0.3), inset 0 1px 0 rgba(78,205,196,0.2)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "linear-gradient(135deg, rgba(78,205,196,0.15) 0%, rgba(78,205,196,0.05) 100%)"; e.currentTarget.style.boxShadow = "0 0 30px rgba(78,205,196,0.15), inset 0 1px 0 rgba(78,205,196,0.1)"; }}
                >
                  <Music style={{ width: 16, height: 16 }} />
                  INITIATE LINK
                </button>
              </div>
            </>
          ) : (
            <>
              <div style={{ position: "relative", width: 280, height: 280, borderRadius: "50%", background: "linear-gradient(135deg,#121212, #000)", border: "2px solid rgba(78,205,196,0.4)", boxShadow: "0 0 40px rgba(78,205,196,0.15)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto", overflow: "hidden" }}>
                {currentTrack ? (
                  <img src={currentTrack.imageUrl} style={{ width: "100%", height: "100%", objectFit: "cover", filter: playing ? "none" : "grayscale(0.6)" }} alt="Album Art" />
                ) : (
                  <div style={{ fontSize: 60 }}>🎵</div>
                )}
                {playing && <div style={{ position: 'absolute', inset: -1, borderRadius: '50%', border: '1.5px solid #4ECDC4', animation: 'oa-twinkle 3s infinite', pointerEvents: 'none' }} />}
              </div>

              <div style={{ textAlign: "center", minHeight: 64 }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: "#fff", fontFamily: "'Orbitron',sans-serif", letterSpacing: '2px', textShadow: '0 0 10px rgba(78,205,196,0.3)' }}>{currentTrack ? currentTrack.name : "Awaiting Frequency..."}</div>
                <div style={{ fontSize: 16, color: "rgba(198,160,110,0.7)", marginTop: 8, fontFamily: "'Rajdhani', sans-serif" }}>{currentTrack ? currentTrack.artist : "Unknown Signal"}</div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 36, marginTop: 20 }}>
                <button onClick={skipPrevious} style={{ background: "none", border: "none", cursor: "pointer", color: "#4ECDC4", fontSize: 24, opacity: 0.6, transition: "opacity 0.2s" }} onMouseEnter={e => e.currentTarget.style.opacity = 1} onMouseLeave={e => e.currentTarget.style.opacity = 0.6}>⏮</button>
                <button onClick={() => playing ? pausePlayback() : playTrack()} style={{ width: 72, height: 72, borderRadius: "50%", background: "linear-gradient(135deg,#0a2a2a,rgba(78,205,196,0.2))", border: "2px solid #4ECDC4", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 24, boxShadow: "0 0 24px rgba(78,205,196,0.4)", transition: "transform 0.2s" }} onMouseEnter={e => e.currentTarget.style.transform = "scale(1.05)"} onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>
                  {playing ? "⏸" : "▶"}
                </button>
                <button onClick={skipNext} style={{ background: "none", border: "none", cursor: "pointer", color: "#4ECDC4", fontSize: 24, opacity: 0.6, transition: "opacity 0.2s" }} onMouseEnter={e => e.currentTarget.style.opacity = 1} onMouseLeave={e => e.currentTarget.style.opacity = 0.6}>⏭</button>
              </div>
            </>
          )}
        </div>
      </div>
    </OrbitApp>
  );
}