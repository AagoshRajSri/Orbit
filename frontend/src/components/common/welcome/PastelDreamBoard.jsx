import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useThemeStore } from "../../../store/useThemeStore";
import { useAuthStore } from "../../../store/useAuthStore";
import { useSpotifyStore } from "../../../store/useSpotifyStore";
import AnimalEasterEggs, { SittingBird, Flower, Snake } from "./AnimalEasterEggs";
import { useNexusStore } from "../../../store/useNexusStore";
import NexusActionOverlay from "../../nexus/NexusActionOverlay";

/* ── EXACT CODES FROM PASTEL THEME ── */

const FLOATIES = [
  { x: "12%", y: "15%", char: "✦", size: 28, color: "#f8c8e8", opacity: 0.85, dur: 2.8 },
  { x: "82%", y: "10%", char: "✦", size: 24, color: "#e8c8f8", opacity: 0.75, dur: 3.1 },
  { x: "92%", y: "25%", char: "✨", size: 36, color: "#ffd6f0", opacity: 0.8, dur: 2.5 },
  { x: "76%", y: "35%", char: "✺", size: 20, color: "#ffb8d8", opacity: 0.65, dur: 3.4 },
  { x: "85%", y: "45%", char: "🎀", size: 30, color: "#e0c8ff", opacity: 0.85, dur: 2.9 },
  { x: "90%", y: "60%", char: "☽", size: 48, color: "#f0d8ff", opacity: 0.7, dur: 4.0 },
  { x: "8%", y: "55%", char: "🦋", size: 24, color: "#c8f0e0", opacity: 0.8, dur: 3.2 },
  { x: "2%", y: "75%", char: "✦", size: 24, color: "#ffd8ee", opacity: 0.55, dur: 2.7 },
  { x: "32%", y: "85%", char: "💖", size: 28, color: "#ffaad0", opacity: 0.75, dur: 3.5 },
  { x: "65%", y: "12%", char: "🌸", size: 32, color: "#ffd0e8", opacity: 0.8, dur: 3.9 },
  { x: "55%", y: "88%", char: "⋆", size: 40, color: "#ffc8e8", opacity: 0.55, dur: 5.0 },
  { x: "20%", y: "30%", char: "🧚‍♀️", size: 30, color: "#d8c8ff", opacity: 0.65, dur: 4.5 },
  { x: "45%", y: "18%", char: "✨", size: 26, color: "#ffaadd", opacity: 0.85, dur: 3.8 },
  { x: "72%", y: "78%", char: "💕", size: 28, color: "#ffaadd", opacity: 0.85, dur: 3.3 },
  { x: "15%", y: "90%", char: "🎀", size: 26, color: "#ffaadd", opacity: 0.75, dur: 4.1 },
  { x: "25%", y: "5%", char: "🌷", size: 35, color: "#ffaadd", opacity: 0.85, dur: 3.6 },
];

export function SparkleClick() {
  const [sparks, setSparks] = useState([]);
  const containerRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const id = Date.now();
      const items = Array.from({length:8}, (_,i) => ({
        id: id+i,
        x, y,
        dx: (Math.random()-0.5)*120,
        dy: (Math.random()-1.2)*120,
        char: ["✦","♡","✿","⋆","★","✨"][Math.floor(Math.random()*6)],
        color: ["#ff8ec8","#cc88ff","#88ccff","#ffcc88","#88ffcc","#ff479c"][Math.floor(Math.random()*6)],
        size: Math.random() * 20 + 15
      }));
      setSparks(p => [...p, ...items]);
      setTimeout(() => setSparks(p => p.filter(s => !items.find(i=>i.id===s.id))), 2200);
    };
    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={containerRef} style={{ position:"absolute", inset:0, pointerEvents:"none", zIndex:9999, overflow:"hidden" }}>
      {sparks.map(s => (
        <span key={s.id} style={{
          position:"absolute", left:s.x, top:s.y,
          fontSize:s.size, color:s.color, lineHeight:1,
          animation:"sparkFly 2.2s cubic-bezier(0.1, 0.4, 0.2, 1) forwards",
          "--dx": s.dx+"px", "--dy": s.dy+"px",
          transformOrigin:"center",
          filter: "drop-shadow(0 0 5px rgba(255,255,255,0.8))"
        }}>{s.char}</span>
      ))}
    </div>
  );
}

export function BgClouds() {
  return (
    <div style={{ position:"absolute", inset:0, overflow:"hidden", pointerEvents:"none", animation: "cloudShift 18s ease-in-out infinite alternate" }}>
      <div style={{ position:"absolute", left:"-10%", top:"-5%", width:"50vw", height:"50vh", background:"radial-gradient(ellipse, rgba(255,160,210,0.7) 0%, transparent 70%)", filter:"blur(40px)", animation: "breathe 8s ease-in-out infinite alternate" }}/>
      <div style={{ position:"absolute", right:"-10%", top:"-10%", width:"50vw", height:"50vh", background:"radial-gradient(ellipse, rgba(220,190,255,0.65) 0%, transparent 70%)", filter:"blur(40px)", animation: "breathe 10s ease-in-out infinite alternate-reverse" }}/>
      <div style={{ position:"absolute", left:"10%", bottom:"-10%", width:"60vw", height:"50vh", background:"radial-gradient(ellipse, rgba(180,240,255,0.6) 0%, transparent 70%)", filter:"blur(45px)", animation: "breathe 12s ease-in-out infinite alternate" }}/>
      <div style={{ position:"absolute", right:"5%", bottom:"0%", width:"50vw", height:"45vh", background:"radial-gradient(ellipse, rgba(255,180,225,0.55) 0%, transparent 70%)", filter:"blur(38px)" }}/>
      <div style={{ position:"absolute", left:"35%", top:"20%", width:"40vw", height:"40vh", background:"radial-gradient(ellipse, rgba(255,235,180,0.4) 0%, transparent 70%)", filter:"blur(50px)" }}/>
    </div>
  );
}

export function Floaties() {
  return (
    <div style={{ position:"absolute", inset:0, pointerEvents:"none" }}>
      {FLOATIES.map((s, i) => (
        <span key={i} style={{
          position:"absolute", left:s.x, top:s.y,
          fontSize:s.size, color:s.color, opacity:s.opacity, lineHeight:1,
          animation:`starPulse ${s.dur}s ease-in-out infinite`,
          animationDelay:`${i*0.28}s`,
          userSelect:"none",
        }}>{s.char}</span>
      ))}
    </div>
  );
}

export function CuteBadge({ label, color }) {
  return (
    <div style={{
      position:"absolute", top:10, right:10,
      background: color,
      borderRadius:20, padding:"2px 8px",
      fontSize:8.5, fontWeight:800, letterSpacing:"0.1em",
      color:"white", textTransform:"uppercase",
      boxShadow:"0 1px 6px rgba(0,0,0,0.08)",
      display:"flex", alignItems:"center", gap:3,
    }}>✨ {label}</div>
  );
}

export function StatusPill() {
  return (
    <div style={{
      display:"inline-flex", alignItems:"center", gap:8,
      background:"rgba(255,255,255,0.65)", backdropFilter:"blur(12px)",
      borderRadius:30, padding:"6px 16px 6px 10px",
      border:"1.5px solid rgba(255,180,220,0.8)",
      marginBottom:12,
      boxShadow:"0 2px 14px rgba(255,150,200,0.3), inset 0 0 10px rgba(255,255,255,1)",
    }}>
      <span style={{ width:10, height:10, borderRadius:"50%", background:"#ff479c", boxShadow:"0 0 10px #ff479c", display:"inline-block", animation:"pulse 1.2s ease-in-out infinite" }}/>
      <span style={{ fontSize:11, fontWeight:900, letterSpacing:"0.22em", color:"#e8338a", textTransform:"uppercase" }}>STATUS: GLOWING 💖</span>
    </div>
  );
}

export function HeroTitle() {
  return (
    <div className="relative">
      <h1 style={{
        margin:"0 0 4px 0", fontSize:44, fontWeight:900,
        letterSpacing:"0.04em", textTransform:"uppercase", lineHeight:1,
        background:"linear-gradient(90deg, #ff479c 0%, #ff85cc 30%, #e860ff 60%, #9b72ff 100%)",
        WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text",
        backgroundSize: "200% auto",
        animation: "shimmer 5s linear infinite",
        filter:"drop-shadow(0 4px 10px rgba(255,100,200,0.3))",
        position:"relative", display:"inline-block"
      }}>Welcome to Orbit
        <span style={{
          position:"absolute", top:-12, right:-32,
          fontSize:32, WebkitTextFillColor:"initial", color:"#ffcc44",
          filter:"drop-shadow(0 2px 6px rgba(255,180,0,0.6))",
          animation:"starPulse 1.5s ease-in-out infinite",
        }}>👑</span>
        <span style={{
          position:"absolute", bottom:-5, left:-20,
          fontSize:24, WebkitTextFillColor:"initial", 
          animation:"float 3s ease-in-out infinite alternate"
        }}>🌸</span>
      </h1>
    </div>
  );
}

export function TruePastelSpotifyCard({ cardRef, onClick }) {
  const { 
    spotifyLinked, currentTrack, isPlaying, 
    pausePlayback, playTrack, skipNext, skipPrevious,
    positionMsAtSync, lastSyncTimestamp, durationMs, seekTo
  } = useSpotifyStore();

  const [isResetting, setIsResetting] = useState(false);
  const [optimisticAnchor, setOptimisticAnchor] = useState(null);

  const prevTrackIdRef = useRef(null);
  const fillRef = useRef(null);
  const glowRef = useRef(null);

  useEffect(() => {
    if (!currentTrack?.id) return;
    if (currentTrack.id !== prevTrackIdRef.current) {
      prevTrackIdRef.current = currentTrack.id;
      setOptimisticAnchor(null);
      setIsResetting(true);
      const t = setTimeout(() => {
        setIsResetting(false);
      }, 300);
      return () => clearTimeout(t);
    }
  }, [currentTrack]);

  useEffect(() => {
    let frameId;
    const tick = () => {
      if (isResetting || !durationMs) {
        if (fillRef.current) fillRef.current.style.width = "0%";
        if (glowRef.current) glowRef.current.style.left = "0%";
        frameId = requestAnimationFrame(tick);
        return;
      }

      let currentPos = 0;
      if (optimisticAnchor) {
        currentPos = optimisticAnchor.pos + (isPlaying ? Date.now() - optimisticAnchor.ts : 0);
      } else if (lastSyncTimestamp) {
        currentPos = positionMsAtSync + (isPlaying ? Date.now() - lastSyncTimestamp : 0);
      } else {
        currentPos = positionMsAtSync;
      }

      currentPos = Math.max(0, Math.min(currentPos, durationMs));
      const p = (currentPos / durationMs) * 100;

      if (fillRef.current) fillRef.current.style.width = `${p}%`;
      if (glowRef.current) glowRef.current.style.left = `calc(${p}% - 7.5px)`;

      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [isPlaying, isResetting, durationMs, positionMsAtSync, lastSyncTimestamp, optimisticAnchor]);

  const handleSeek = (e) => {
    if (e.target.closest("button") || !durationMs) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const newPos = (percent / 100) * durationMs;
    setOptimisticAnchor({ pos: newPos, ts: Date.now() });
    setIsResetting(false);
    seekTo(newPos).catch(() => {});
  };

  const handlePlayPause = (e) => {
    e.stopPropagation();
    if (isPlaying) pausePlayback(); else playTrack();
  };

  if (!spotifyLinked) {
    return (
      <div ref={cardRef} onClick={onClick} style={{
        background:"linear-gradient(135deg, #ffd6f0 0%, #f0d8ff 100%)",
        border:"2px solid rgba(255,180,220,0.8)", borderRadius:24,
        backdropFilter:"blur(16px)", padding:"18px 20px",
        display:"flex", flexDirection:"column", gap:12, position:"relative",
        boxShadow:"0 8px 32px rgba(255,150,200,0.25), inset 0 0 15px rgba(255,255,255,0.6)",
        cursor: "pointer", transition: "transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.25), box-shadow 0.3s",
        height: "100%", minHeight: 140
      }}
      onMouseEnter={e=>{e.currentTarget.style.transform="scale(1.025) translateY(-5px)"; e.currentTarget.style.boxShadow="0 15px 45px rgba(255,100,180,0.4), inset 0 0 20px rgba(255,255,255,1)"}}
      onMouseLeave={e=>{e.currentTarget.style.transform="scale(1) translateY(0)"; e.currentTarget.style.boxShadow="0 8px 32px rgba(255,150,200,0.25), inset 0 0 15px rgba(255,255,255,0.6)"}}
      >
        <CuteBadge label="spotify" color="linear-gradient(90deg,#ff479c,#ff85cc)" />
        <div style={{ flex:1, display:"flex", flexDirection:"column", justifyContent:"center", alignItems:"center", padding: "10px 0" }}>
           <span className="luxury-text transition-all duration-300 group-hover:tracking-widest" style={{ fontSize:22, fontWeight:700, color:"#9c27b0" }}>Connect Spotify</span>
           <span style={{ fontSize:14, color:"#e91e63", marginTop:6, fontWeight:700 }}>Share your listening experience 🎀</span>
        </div>
      </div>
    );
  }

  return (
    <div ref={cardRef} onClick={handleSeek} style={{
      background:"linear-gradient(135deg, #ffd6f0 0%, #f0d8ff 100%)",
      border:"2px solid rgba(255,180,220,0.8)", borderRadius:24,
      backdropFilter:"blur(16px)", padding:"18px 20px",
      display:"flex", flexDirection:"column", gap:12, position:"relative",
      boxShadow:"0 8px 32px rgba(255,150,200,0.25), inset 0 0 15px rgba(255,255,255,0.6)",
      cursor: "pointer",
      transition: "transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.25), box-shadow 0.3s",
      height: "100%", minHeight: 140,
      overflow: "hidden"
    }}
    onMouseEnter={e=>{e.currentTarget.style.transform="scale(1.025) translateY(-5px)"; e.currentTarget.style.boxShadow="0 15px 45px rgba(255,100,180,0.4), inset 0 0 20px rgba(255,255,255,1)"}}
    onMouseLeave={e=>{e.currentTarget.style.transform="scale(1) translateY(0)"; e.currentTarget.style.boxShadow="0 8px 32px rgba(255,150,200,0.25), inset 0 0 15px rgba(255,255,255,0.6)"}}
    >
    {/* Background Progress Fill */}
    <div
      ref={fillRef}
      style={{
        position: "absolute", inset: 0, zIndex: 0,
        background: "linear-gradient(90deg, rgba(255, 71, 156, 0.25) 0%, rgba(232, 96, 255, 0.1) 100%)",
        width: "0%", transition: isResetting ? "width 0.2s ease-out" : "none", pointerEvents: "none",
        borderRadius: "inherit"
      }}
    />
    <div
      ref={glowRef}
      style={{
        position: "absolute", top: 0, bottom: 0, zIndex: 0, width: 15,
        left: "0%", background: "radial-gradient(ellipse at center, rgba(255, 71, 156, 0.5) 0%, transparent 100%)",
        transition: isResetting ? "left 0.2s ease-out" : "none", pointerEvents: "none", opacity: isPlaying ? 1 : 0.3
      }}
    />

    <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", height: "100%", gap: 12 }}>
      <CuteBadge label="vibing" color="linear-gradient(90deg,#ff479c,#ff85cc)" />
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ fontSize: 14 }}>💝</span>
          <span style={{ fontSize:11, fontWeight:900, letterSpacing:"0.14em", color:"#e8338a", textTransform:"uppercase" }}>Spotify Jam Session</span>
        </div>
        <span style={{ fontSize:10, fontWeight:900, letterSpacing:"0.1em", color:"#ff479c", textTransform:"uppercase", cursor:"pointer", padding:"4px 8px", background:"rgba(255,255,255,0.4)", borderRadius:12 }}>OPEN ✨</span>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:16 }}>
        <div style={{ width:72, height:72, borderRadius:16, flexShrink:0, overflow:"hidden", boxShadow:"0 5px 15px rgba(255,100,180,0.3)", border:"3px solid white" }}>
          {currentTrack?.imageUrl ? (
            <img src={currentTrack.imageUrl} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-pink-300 to-purple-400 flex items-center justify-center relative">
              <span style={{fontSize: 32, animation: "float 2s ease-in-out infinite"}}>🎵</span>
              <div style={{position:"absolute", top:4, right:4, fontSize:12}}>✨</div>
            </div>
          )}
        </div>
        <div className="flex-1" style={{ minWidth:0 }}>
          <div style={{ fontSize:18, fontWeight:900, color:"#9c27b0", letterSpacing:"0.01em", textShadow: "0 1px 2px rgba(255,255,255,0.8)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
            {currentTrack ? currentTrack.name : "Orbit Anthems"}
          </div>
          <div style={{ fontSize:13, color:"#e91e63", marginTop:2, fontWeight:700, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
            {currentTrack ? currentTrack.artist : "Listening with the squad 🎀"}
          </div>
          <div style={{ fontSize:12, color:"#ff85cc", marginTop:4, letterSpacing:4, animation: isPlaying ? "pulse 2s infinite" : "none" }}>♡ ♡ ♡ ♡</div>
        </div>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:10, flex: 1, justifyContent: "flex-end" }}>
        <div style={{ display:"flex", justifyContent:"center", alignItems:"center", gap:24 }}>
          <button onClick={(e) => { e.stopPropagation(); skipPrevious(); }} style={{ background:"none", border:"none", cursor:"pointer", color:"#ff85cc", fontSize:18, padding:0, lineHeight:1, transition: "transform 0.2s" }} onMouseEnter={e=>e.currentTarget.style.transform="scale(1.2)"} onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>⏮</button>
          <button onClick={handlePlayPause} style={{
            width:44, height:44, borderRadius:"50%",
            background:"linear-gradient(135deg, #ff479c, #e860ff)",
            border:"3px solid white", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
            color:"white", fontSize:18, boxShadow:"0 4px 15px rgba(255,71,156,0.5)",
            transition:"transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
          }}
          onMouseEnter={e=>e.currentTarget.style.transform="scale(1.15)"}
          onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}
          >{isPlaying ? "⏸" : "▶"}</button>
          <button onClick={(e) => { e.stopPropagation(); skipNext(); }} style={{ background:"none", border:"none", cursor:"pointer", color:"#ff85cc", fontSize:18, padding:0, lineHeight:1, transition: "transform 0.2s" }} onMouseEnter={e=>e.currentTarget.style.transform="scale(1.2)"} onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>⏭</button>
        </div>
      </div>
      </div>
    </div>
  );
}


export function TruePastelFeatureCard({ cfg, cardRef, onClick }) {
  return (
    <div ref={cardRef} onClick={onClick} style={{
      background:cfg.bg, border:cfg.border, borderRadius:20,
      backdropFilter:"blur(12px)", padding:"16px 18px",
      display:"flex", flexDirection:"column", gap:8,
      cursor:"pointer", position:"relative", height:"100%", minHeight:140,
      transition:"transform 0.22s, box-shadow 0.22s",
      boxShadow:"0 4px 18px rgba(200,160,220,0.15)",
    }}
    onMouseEnter={e=>{ e.currentTarget.style.transform="scale(1.022) translateY(-3px)"; e.currentTarget.style.boxShadow="0 10px 30px rgba(200,140,220,0.35)"; }}
    onMouseLeave={e=>{ e.currentTarget.style.transform="scale(1)";      e.currentTarget.style.boxShadow="0 4px 18px rgba(200,160,220,0.15)"; }}
    >
      {cfg.badge && <CuteBadge label={cfg.badge} color={cfg.badgeColor} />}
      <div style={{ width:36, height:36, borderRadius:12, background:cfg.iconBg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>{cfg.icon}</div>
      <div style={{ fontSize:9.5, fontWeight:800, letterSpacing:"0.13em", color:cfg.accent, textTransform:"uppercase", marginTop:2 }}>{cfg.title}</div>
      <div style={{ fontSize:11, color:"rgba(110,88,118,0.72)", lineHeight:1.55 }}>{cfg.desc}</div>
      <div style={{ position:"absolute", bottom:32, left:18, right:18, height:"0.5px", background:cfg.line }}/>
      <div style={{ position:"absolute", bottom:11, right:14, fontSize:13, color:cfg.accent, opacity:0.38, fontWeight:"bold" }}>{cfg.bottomIcon}</div>
    </div>
  );
}

export const PASTEL_CARDS = [
  {
    bg:"linear-gradient(135deg, rgba(252,210,235,0.85) 0%, rgba(255,225,245,0.78) 100%)",
    border:"1px solid rgba(235,175,215,0.55)",
    iconBg:"rgba(220,140,195,0.2)", accent:"#c060a8",
    icon:"🎮", title:"ORBIT GAMES",
    desc:"Coming soon. A new way to play together.",
    bottomIcon:"🔒", line:"rgba(215,165,200,0.38)",
    badge:"locked", badgeColor:"linear-gradient(90deg,#b0b0b0,#808080)",
    route: null
  },
  {
    bg:"linear-gradient(135deg, rgba(255,225,198,0.85) 0%, rgba(255,238,215,0.78) 100%)",
    border:"1px solid rgba(245,192,152,0.55)",
    iconBg:"rgba(230,138,88,0.2)", accent:"#d07840",
    icon:"🔔", title:"GET NOTIFICATIONS",
    desc:"Stay updated with real-time alerts and messages",
    bottomIcon:"↓", line:"rgba(232,188,158,0.38)",
    badge:null,
    route: "/settings"
  },
  {
    bg:"linear-gradient(135deg, rgba(192,235,215,0.85) 0%, rgba(210,248,228,0.78) 100%)",
    border:"1px solid rgba(152,215,183,0.55)",
    iconBg:"rgba(68,168,118,0.18)", accent:"#3d9878",
    icon:"⚙️", title:"CUSTOMIZE",
    desc:"Configure your orbit behavior and preferences",
    bottomIcon:"↑", line:"rgba(158,215,188,0.38)",
    badge:null,
    route: "/settings"
  },
];

export function TruePastelDashboard() {
  const navigate = useNavigate();
  const { nexusActionView, setNexusActionView } = useNexusStore();

  return (
    <div style={{
      position:"relative", width:"100%", height:"100%", overflow:"hidden",
      fontFamily:"'Nunito', 'Varela Round', system-ui, sans-serif",
      background:"linear-gradient(145deg, #ffd4ee 0%, #f8c0dc 8%, #f0ccf8 18%, #d0d4f8 32%, #bce4f8 46%, #c0eee8 62%, #ccf0d8 78%, #d8f4e4 100%)",
      backgroundSize: "200% 200%",
      animation: "bgShift 12s ease-in-out infinite alternate",
      cursor:"url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'%3E%3Ctext y='24' font-size='24'%3E✨%3C/text%3E%3C/svg%3E\") 16 16, auto",
      borderRadius: "2rem",
      padding: "50px 26px 18px 26px",
      display:"flex", flexDirection:"column", gap:12,
      border: "4px solid rgba(255,255,255,0.6)",
      boxShadow: "0 0 40px rgba(255,150,210,0.5)"
    }}>
      <style>{`
        @keyframes starPulse {
          0%,100%{ opacity:0.45; transform:scale(1) rotate(0deg); }
          50%{ opacity:0.9; transform:scale(1.18) rotate(14deg); }
        }
        @keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:0.38;} }
        @keyframes shimmer { 0%{ background-position: 200% center; } 100%{ background-position: -200% center; } }
        @keyframes bgShift { 0%{ background-position: 0% 50%; } 100%{ background-position: 100% 50%; } }
        @keyframes breathe { 0%{ opacity: 0.5; transform: scale(0.95) translateZ(0); } 100%{ opacity: 0.9; transform: scale(1.05) translateZ(0); } }
        @keyframes cloudShift { 0%{ transform: translate3d(0,0,0) rotate(0.1deg); } 100%{ transform: translate3d(5px,-5px,0) rotate(1deg); } }
        @keyframes float { 0% { transform: translateY(0px) rotate(0deg); } 100% { transform: translateY(-8px) rotate(4deg); } }
        @keyframes sparkFly {
          0%  { transform:translate(0,0) scale(1) rotate(0deg); opacity:1; }
          100%{ transform:translate(var(--dx),var(--dy)) scale(0) rotate(90deg); opacity:0; }
        }
      `}</style>
      
      <SparkleClick />
      <BgClouds />
      <Floaties />
      <AnimalEasterEggs />

      {/* Side Decorative Plants */}
      <div style={{ position:"absolute", left:-15, bottom:"20%", opacity:0.35, pointerEvents:"none" }}>
        <svg width="120" height="200" viewBox="0 0 100 200" style={{ transform:"rotate(10deg)" }}>
          <path d="M20,200 Q10,150 20,100 Q30,50 20,0" fill="none" stroke="#A8E6CF" strokeWidth="6" />
          {[40, 80, 120, 160].map(y => <ellipse key={y} cx="25" cy={y} rx="20" ry="10" fill="#DCEDC1" style={{ transform:`rotate(${y/4}deg)` }} />)}
        </svg>
      </div>
      <div style={{ position:"absolute", right:-15, top:"15%", opacity:0.35, pointerEvents:"none" }}>
        <svg width="120" height="200" viewBox="0 0 100 200" style={{ transform:"rotate(-10deg) scaleX(-1)" }}>
          <path d="M20,200 Q10,150 20,100 Q30,50 20,0" fill="none" stroke="#A8E6CF" strokeWidth="6" />
          {[30, 70, 110, 150].map(y => <ellipse key={y} cx="25" cy={y} rx="20" ry="10" fill="#DCEDC1" style={{ transform:`rotate(${y/3}deg)` }} />)}
        </svg>
      </div>

      {nexusActionView ? (
        <div style={{ position: "absolute", inset: 0, zIndex: 20 }}>
          <NexusActionOverlay mode={nexusActionView} onClose={() => setNexusActionView(null)} inline={true} />
        </div>
      ) : (
        <>
          <div className="relative z-10 text-center mb-4">
            <div className="relative inline-block">
              <Flower color="#ff9fd0" style={{ position:"absolute", top:"-50%", left:"50%", transform:"translate(-50%, -50%)", opacity:0.1, width:300, height:300, zIndex:-1 }} />
              <HeroTitle />
            </div>
            <p style={{ margin:"6px 0 0 0", fontSize:14, color:"#ff6bb0", letterSpacing:"0.04em", fontWeight:800, textShadow:"0 2px 4px rgba(255,255,255,0.8)" }}>
              Choose a pathway to begin your mission, bestie. 💅✨
            </p>
          </div>

          <div className="relative z-10 w-full mb-2 flex justify-start pl-2">
            <StatusPill />
          </div>
          
          <div className="relative z-10 w-full" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gridAutoRows:"1fr", gap:14, flex:1 }}>
            <div className="relative flex flex-col">
              <SittingBird style={{ position:"absolute", top:-30, right:10, zIndex:20 }} />
              <TruePastelSpotifyCard onClick={() => navigate("/spotify")} />
            </div>
            <div className="relative flex flex-col">
              <SittingBird color="#ff9fd0" style={{ position:"absolute", top:-35, left:20, zIndex:20, transform:"scaleX(-1)" }} />
              <TruePastelFeatureCard cfg={PASTEL_CARDS[0]} />
            </div>
            <div className="relative flex flex-col">
              <SittingBird color="#c890f8" style={{ position:"absolute", top:-30, left:"40%", zIndex:20 }} />
              <TruePastelFeatureCard onClick={() => navigate("/settings")} cfg={PASTEL_CARDS[1]} />
            </div>
            <div className="relative flex flex-col">
              <SittingBird color="#90c8f8" style={{ position:"absolute", top:-35, right:40, zIndex:20, transform:"scaleX(-1)" }} />
              <TruePastelFeatureCard onClick={() => navigate("/settings")} cfg={PASTEL_CARDS[2]} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
