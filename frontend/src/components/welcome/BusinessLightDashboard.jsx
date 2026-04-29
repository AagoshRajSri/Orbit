import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSpotifyStore } from "../../store/useSpotifyStore";
import { useNexusStore } from "../../store/useNexusStore";
import { ThemeCardWrapper } from "./WelcomeWrappers";
import Saturn from "../Saturn";
import NexusActionOverlay from "../NexusActionOverlay";

/* ── elegant visual elements ── */
export function GlowCurve() {
  return (
    <svg style={{ position:"absolute",inset:0,width:"100%",height:"100%",pointerEvents:"none",overflow:"visible",zIndex:0, opacity:0.6 }}
      viewBox="0 0 860 480" preserveAspectRatio="none">
      <defs>
        <linearGradient id="curveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(176,141,87,0)" />
          <stop offset="50%" stopColor="rgba(176,141,87,0.4)" />
          <stop offset="100%" stopColor="rgba(176,141,87,0)" />
        </linearGradient>
      </defs>
      <path d="M 0 320 C 150 280 300 400 450 320 C 600 240 750 350 900 300"
        fill="none" stroke="url(#curveGrad)" strokeWidth="1.5"
        style={{ animation: "breathe 6s ease-in-out infinite alternate" }} />
    </svg>
  );
}

export function FloatingDust() {
  return (
    <div style={{ position:"absolute", inset:0, pointerEvents:"none", zIndex:1, overflow:"hidden" }}>
      <div className="water-bg w-[800px] h-[800px] -top-40 -left-40 bg-[var(--chat-primary)] opacity-[0.05]" />
      <div className="water-bg w-[600px] h-[600px] bottom-0 -right-20 bg-[var(--color-secondary)] opacity-[0.04]" style={{ animationDelay: '-7s' }} />
      {[...Array(8)].map((_, i) => (
        <div key={i} style={{
          position:"absolute",
          top: Math.random()*100+"%",
          left: Math.random()*100+"%",
          width: 3, height: 3,
          background: "var(--chat-primary)",
          borderRadius: "50%",
          opacity: 0.1,
          animation: `float ${Math.random()*5+5}s linear infinite alternate`,
        }} />
      ))}
    </div>
  );
}

export function ElegantSpotifyCard({ onClick }) {
  const { 
    spotifyLinked, currentTrack, isPlaying, 
    pausePlayback, playTrack, skipNext, skipPrevious,
    positionMs, durationMs, seekTo, setVolume
  } = useSpotifyStore();

  const [localPos, setLocalPos] = useState(positionMs);
  const [vol, setVol] = useState(70);

  useEffect(() => {
    setLocalPos(positionMs);
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
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    seekTo((percent / 100) * durationMs);
  };

  const handleVol = (e) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const v = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    setVol(v);
    if (setVolume) setVolume(v);
  };

  if (!spotifyLinked) {
    return (
      <ThemeCardWrapper onClick={onClick} className="flex flex-col h-full relative p-6">
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:18 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ width:44, height:44, background:"#1DB954", borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, color:"white", boxShadow:"0 4px 12px rgba(0,0,0,0.08)" }}>🎵</div>
            <span style={{ fontSize:11, fontWeight:800, letterSpacing:"0.15em", color:"color-mix(in srgb, var(--color-base-content) 65%, transparent)", textTransform:"uppercase" }}>SPOTIFY SYNC</span>
          </div>
        </div>
        <div style={{ flex:1, display:"flex", flexDirection:"column", justifyContent:"center", alignItems:"center", padding: "10px 0" }}>
           <span className="luxury-text transition-all duration-300 group-hover:tracking-widest" style={{ fontSize:22, fontWeight:700, color:"var(--color-base-content)" }}>Connect Spotify</span>
           <span style={{ fontSize:14, color:"color-mix(in srgb, var(--color-base-content) 65%, transparent)", fontFamily:"Georgia, serif", fontStyle:"italic", marginTop:6 }}>Share your listening experience</span>
        </div>
      </ThemeCardWrapper>
    );
  }

  const handlePlayPause = (e) => {
    e.stopPropagation();
    if (isPlaying) pausePlayback(); else playTrack();
  };

  return (
    <ThemeCardWrapper className="flex flex-col h-full relative p-6 cursor-pointer group" onClick={onClick}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:18 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <div style={{ width:44, height:44, background:"#1DB954", borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, color:"white", boxShadow:"0 4px 12px rgba(0,0,0,0.08)" }}>🎵</div>
          <span style={{ fontSize:11, fontWeight:800, letterSpacing:"0.15em", color:"color-mix(in srgb, var(--color-base-content) 65%, transparent)", textTransform:"uppercase" }}>SPOTIFY ACTIVE</span>
        </div>
        <button style={{ fontSize:10, fontWeight:700, background:"transparent", border:`1px solid var(--chat-border)`, padding:"4px 12px", borderRadius:8, color:"color-mix(in srgb, var(--color-base-content) 65%, transparent)", letterSpacing:"0.05em" }}>EXPAND</button>
      </div>

      <div style={{ display:"flex", alignItems:"center", gap:18, marginBottom: 16 }}>
        <div style={{ width:80, height:80, borderRadius:12, background:"#221f1d", border:`1px solid var(--chat-border)`, overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 8px 25px rgba(0,0,0,0.15)" }}>
          {currentTrack?.imageUrl ? (
             <img src={currentTrack.imageUrl} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
          ) : (
             <span style={{ fontSize:32, opacity:0.8 }}>🎵</span>
          )}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div className="luxury-text transition-all duration-300 group-hover:tracking-widest" style={{ fontSize:20, fontWeight:700, color:"var(--color-base-content)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
            {currentTrack ? currentTrack.name : "Select Track"}
          </div>
          <div style={{ fontSize:14, color:"color-mix(in srgb, var(--color-base-content) 65%, transparent)", fontFamily:"Georgia, serif", fontStyle:"italic", marginTop:4 }}>
            {currentTrack ? currentTrack.artist : "Premium Audio Experience"}
          </div>
        </div>
        {isPlaying && (
          <div style={{ width:60, opacity:0.4 }}>
             <svg viewBox="0 0 100 20" style={{ width:"100%" }}>
               <path d="M0,10 Q25,0 50,10 T100,10" fill="none" stroke="var(--chat-primary)" strokeWidth="1.5" />
             </svg>
          </div>
        )}
      </div>

      <div style={{ marginTop:"auto", paddingTop:14, display:"flex", alignItems:"center", gap:8 }}>
        <button onClick={(e) => { e.stopPropagation(); skipPrevious(); }} style={{ fontSize:14, color:"color-mix(in srgb, var(--color-base-content) 65%, transparent)", background:"none", border:"none", cursor:"pointer", transition:"color 0.2s" }} onMouseEnter={e => e.currentTarget.style.color="var(--chat-primary)"} onMouseLeave={e => e.currentTarget.style.color="color-mix(in srgb, var(--color-base-content) 65%, transparent)"}>⏮</button>
        <button onClick={handlePlayPause} style={{ width:32, height:32, borderRadius:"50%", background:"var(--chat-primary)", display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontSize:11, border:"none", cursor:"pointer", boxShadow:"0 4px 8px rgba(176,141,87,0.3)", transform:"scale(1)", transition:"transform 0.1s active:scale-95" }} onMouseDown={e=>e.currentTarget.style.transform="scale(0.95)"} onMouseUp={e=>e.currentTarget.style.transform="scale(1)"}>
          {isPlaying ? "⏸" : "▶"}
        </button>
        <button onClick={(e) => { e.stopPropagation(); skipNext(); }} style={{ fontSize:14, color:"color-mix(in srgb, var(--color-base-content) 65%, transparent)", background:"none", border:"none", cursor:"pointer", transition:"color 0.2s" }} onMouseEnter={e => e.currentTarget.style.color="var(--chat-primary)"} onMouseLeave={e => e.currentTarget.style.color="color-mix(in srgb, var(--color-base-content) 65%, transparent)"}>⏭</button>
        <div onClick={handleSeek} style={{ flex:1, height:4, background:"rgba(0,0,0,0.06)", borderRadius:2, position:"relative", margin:"0 10px", cursor:"pointer" }}>
          <div style={{ position:"absolute", top:0, left:0, width:`${progress}%`, height:"100%", background:"var(--chat-primary)", borderRadius:2, transition:"width 1s linear" }} />
          <div style={{ position:"absolute", left:`${progress}%`, top:-2, width:8, height:8, background:"#fff", border:"1px solid var(--chat-primary)", borderRadius:"50%", transform:"translateX(-50%)", opacity:0 }} className="group-hover:opacity-100 transition-opacity" />
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
          <span style={{ fontSize:12, color:"color-mix(in srgb, var(--color-base-content) 65%, transparent)" }}>🔊</span>
          <div onClick={handleVol} style={{ width: 40, height: 4, background:"rgba(0,0,0,0.06)", borderRadius:2, cursor:"pointer", position:"relative" }}>
             <div style={{ width:`${vol}%`, height:"100%", background:"var(--chat-primary)", borderRadius:2 }} />
          </div>
        </div>
      </div>
    </ThemeCardWrapper>
  );
}

function ElegantActionCard({ title, subtitle, icon, iconBg, badge, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <div onClick={onClick} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)} className="group" style={{
      background:"rgba(255,255,255,0.65)", backdropFilter:"blur(10px)", border: hov ? `1.5px solid var(--chat-primary)` : `1px solid var(--chat-border)`,
      borderRadius:16, padding:"24px 22px", transition:"all 0.4s cubic-bezier(0.2, 1, 0.3, 1)", cursor:"pointer",
      transform: hov ? "translateY(-6px)" : "none",
      boxShadow: hov ? "0 15px 35px rgba(176,141,87,0.15)" : "0 4px 15px rgba(0,0,0,0.03)",
      position: "relative",
      display: "flex", flexDirection: "column", height: "100%"
    }}>
      <div style={{ position:"absolute", top:-1, right:-1, width:24, height:24, borderBottomLeftRadius:12, background:"var(--color-base-100)", borderLeft:`1px solid var(--chat-border)`, borderBottom:`1px solid var(--chat-border)` }} />

      <div style={{ position:"relative", width:44, height:44, marginBottom:20 }}>
        <div style={{ width:44, height:44, borderRadius:12, background:iconBg, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 4px 12px rgba(0,0,0,0.08)" }}>
          <span style={{ fontSize:22, filter:"drop-shadow(0 2px 4px rgba(0,0,0,0.2))" }}>{icon}</span>
        </div>
        {badge && <div style={{ position:"absolute", top:-6, right:-6, background:"var(--color-accent)", color:"white", fontSize:10, fontWeight:700, width:20, height:20, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", border:"2.5px solid white" }}>{badge}</div>}
      </div>
      <div className="luxury-text transition-all duration-300 group-hover:tracking-widest" style={{ fontSize:14, fontWeight:900, color:"var(--color-base-content)", letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:10 }}>{title}</div>
      <div style={{ fontSize:15, color:"color-mix(in srgb, var(--color-base-content) 65%, transparent)", lineHeight:1.6, fontFamily:"Georgia, serif", fontStyle:"italic" }}>{subtitle}</div>
    </div>
  );
}

export function BusinessLightDashboard() {
  const navigate = useNavigate();
  const { nexusActionView, setNexusActionView } = useNexusStore();

  return (
    <div style={{
      width:"100%", height:"100%", position:"relative", overflow:"hidden",
      fontFamily:"'Inter', system-ui, sans-serif",
      padding: "36px 40px",
      display:"flex", flexDirection:"column",
      background: "var(--color-base-100)",
      borderRadius: "1.5rem",
      boxShadow: "inset 0 0 100px rgba(176,141,87,0.03)"
    }}>
      <GlowCurve />
      <FloatingDust />

      {nexusActionView ? (
        <div style={{ position: "absolute", inset: 0, zIndex: 20 }}>
          <NexusActionOverlay mode={nexusActionView} onClose={() => setNexusActionView(null)} inline={true} />
        </div>
      ) : (
        <>
          <div style={{ position:"relative", zIndex:2, marginBottom:40, textAlign: "center" }}>
            <div style={{ fontSize:11, fontWeight:800, letterSpacing:"0.4em", color:"var(--chat-primary)", textTransform:"uppercase", marginBottom:20, display:"flex", alignItems:"center", justifyContent: "center", gap:20 }}>
              <div style={{ width:60, height:1, background:"var(--chat-primary)", opacity:0.3 }} />
              <Saturn size={32} tilt={-20} />
              <span>Status: Elegant & Active</span>
              <div style={{ width:60, height:1, background:"var(--chat-primary)", opacity:0.3 }} />
            </div>
            <h1 className="luxury-text" style={{ fontSize:56, fontWeight:700, color:"var(--color-base-content)", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:12, textShadow: "0 2px 20px rgba(0,0,0,0.04)" }}>Welcome to Orbit</h1>
            <p style={{ fontSize:18, color:"color-mix(in srgb, var(--color-base-content) 65%, transparent)", fontFamily:"Georgia, serif", fontStyle:"italic", opacity:0.85, letterSpacing: "0.02em" }}>An exclusive space for refined conversations.</p>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"repeat(2, 1fr)", gap:24, position:"relative", zIndex:2, flex:1 }}>
            <ElegantSpotifyCard onClick={() => navigate("/spotify")} />
            <ElegantActionCard 
              title="Direct Mission" 
              subtitle="Initiate secure peer-to-peer frequencies with elite contacts" 
              icon="💬" 
              iconBg="linear-gradient(135deg, #1a1512, #3d2b2b)" 
              onClick={() => navigate("/")}
            />
            <ElegantActionCard 
              title="Priority Alerts" 
              subtitle="Real-time synchronization with your professional orbit" 
              icon="🔔" 
              iconBg="linear-gradient(135deg, #b08d57, #8c7e73)" 
              badge="3" 
              onClick={() => navigate("/settings")}
            />
            <ElegantActionCard 
              title="Atelier" 
              subtitle="Fine-tune your workspace aesthetic and behavior" 
              icon="🔱" 
              iconBg="linear-gradient(135deg, #708264, #4a5e2e)" 
              onClick={() => navigate("/settings")}
            />
          </div>
          
          {/* Elegant corner star */}
          <div style={{ position:"absolute", bottom:30, right:34, fontSize:28, color:"var(--chat-primary)", opacity:0.3, animation:"starPulse 8s infinite", zIndex:1 }} className="font-cinzel">✦</div>
        </>
      )}
    </div>
  );
}
