import { useEffect, useState, memo } from "react";
import { useThemeStore } from "../store/useThemeStore";
import EnhancedAnimalEasterEggs from "./welcome/EnhancedAnimalEasterEggs";

/* =========================================================================
   PASTEL DREAM EFFECTS (Clouds, Floaties, SparkleClick) 
   ========================================================================= */
const FLOATIES = [
  { x:"24%", y:"12%",  char:"✦", size:9,  dur:2.8 },
  { x:"77%", y:"18%",  char:"✦", size:8,  dur:3.1 },
  { x:"95%", y:"25%",  char:"✦", size:10, dur:2.5 },
  { x:"76%", y:"20%",  char:"✺", size:7,  dur:3.4 },
  { x:"85%", y:"10%", char:"✦", size:7,  dur:2.9 },
  { x:"93%", y:"30%", char:"☽", size:18, dur:4.0 },
  { x:"95%", y:"70%", char:"✦", size:7,  dur:3.2 },
  { x:"76%", y:"60%", char:"✦", size:6,  dur:2.7 },
  { x:"25%", y:"60%", char:"✦", size:8,  dur:3.0 },
  { x:"26%", y:"31%", char:"✦", size:7,  dur:3.3 },
  { x:"96%", y:"32%", char:"✦", size:7,  dur:2.6 },
  { x:"97%", y:"46%", char:"✦", size:22, dur:3.8 },
  { x:"25%", y:"44%", char:"✦", size:7,  dur:2.9 },
  { x:"31%", y:"95%",  char:"♡", size:11,  dur:3.5 },
  { x:"69%", y:"20%", char:"♡", size:8,   dur:4.2 },
  { x:"82%", y:"40%", char:"♡", size:10,  dur:3.7 },
  { x:"40%", y:"50%",  char:"✿", size:12,  dur:3.9 },
  { x:"60%", y:"43%", char:"✿", size:9,   dur:3.1 },
  { x:"88%", y:"55%",  char:"✿", size:8,   dur:2.8 },
  { x:"50%", y:"24%", char:"⋆", size:14,  dur:5.0 },
  { x:"15%", y:"20%", char:"⋆", size:10,  dur:4.5 },
  // Barbie Extras
  { x:"5%", y:"40%", char:"💕", size:14, dur:4.5 },
  { x:"90%", y:"15%", char:"✨", size:16, dur:3.2 },
  { x:"45%", y:"88%", char:"🌸", size:18, dur:5.5 },
  { x:"12%", y:"75%", char:"💖", size:12, dur:3.8 },
];

function SparkleClick({ colorArray }) {
  const [sparks, setSparks] = useState([]);
  useEffect(() => {
    const handler = (e) => {
      const id = Date.now();
      const items = Array.from({length:10}, (_,i) => ({ // More sparks
        id: id+i,
        x: e.clientX, y: e.clientY,
        dx: (Math.random()-0.5)*100, // Faster sparks
        dy: (Math.random()-1.2)*100,
        char: ["✦","♡","✿","⋆","★","💖","✨"][Math.floor(Math.random()*7)],
        color: colorArray[Math.floor(Math.random()*colorArray.length)],
      }));
      setSparks(p => [...p, ...items]);
      setTimeout(() => setSparks(p => p.filter(s => !items.find(i=>i.id===s.id))), 1000);
    };
    window.addEventListener("click", handler);
    return () => window.removeEventListener("click", handler);
  }, [colorArray]);
  return (
    <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:9999 }}>
      {sparks.map(s => (
        <span key={s.id} style={{
          position:"absolute", left:s.x, top:s.y,
          fontSize:14, color:s.color, lineHeight:1,
          animation:"sparkFly 1s ease-out forwards",
          "--dx": s.dx+"px", "--dy": s.dy+"px",
          transformOrigin:"center",
          filter: "drop-shadow(0 0 8px currentColor)"
        }}>{s.char}</span>
      ))}
    </div>
  );
}

function ForegroundFloaties() {
  const foregroundItems = [
    { x:"2%", y:"15%", char:"✦", size:12, dur:3.5 },
    { x:"96%", y:"12%", char:"✿", size:14, dur:2.9 },
    { x:"5%", y:"85%", char:"♡", size:18, dur:4.2 },
    { x:"98%", y:"80%", char:"✦", size:11, dur:3.1 },
    { x:"48%", y:"2%", char:"🌸", size:22, dur:6.5 }, // Large floating flower
    { x:"92%", y:"45%", char:"✨", size:16, dur:2.5 },
  ];

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-[100]">
      {foregroundItems.map((s, i) => (
        <span key={`fg-${i}`} style={{
          position:"absolute", left:s.x, top:s.y,
          fontSize:s.size, color: "var(--color-primary)", opacity: 0.55, lineHeight:1,
          animation:`starPulse ${s.dur}s ease-in-out infinite`,
          animationDelay:`${i*0.4}s`, userSelect:"none", filter: 'drop-shadow(0 0 12px var(--color-primary)) blur(0.3px)'
        }}>{s.char}</span>
      ))}
    </div>
  );
}

function PastelDreamEffects() {
  return (
    <>
      <EnhancedAnimalEasterEggs />
      <ForegroundFloaties />
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <SparkleClick colorArray={["#ff479c","#ff8ec8","#cc88ff","#88ccff","#ffcc88"]} />

        <div className="absolute -left-[8%] top-[5%] w-[500px] h-[400px] rounded-full mix-blend-screen opacity-70 bg-[radial-gradient(ellipse,var(--color-accent)_0%,transparent_70%)] blur-[40px] animate-[pulse_4s_ease-in-out_infinite]" />
        <div className="absolute left-[10%] -top-[10%] w-[400px] h-[350px] rounded-full mix-blend-screen opacity-55 bg-[radial-gradient(ellipse,var(--color-primary)_0%,transparent_70%)] blur-[32px] animate-[pulse_6s_ease-in-out_infinite]" style={{ animationDelay: '1s' }} />
        <div className="absolute right-[8%] bottom-[5%] w-[450px] h-[380px] rounded-full mix-blend-screen opacity-45 bg-[radial-gradient(ellipse,var(--color-secondary)_0%,transparent_70%)] blur-[30px] animate-[pulse_5s_ease-in-out_infinite]" style={{ animationDelay: '2s' }} />
        
        {FLOATIES.map((s, i) => (
          <span key={i} style={{
            position:"absolute", left:s.x, top:s.y,
            fontSize:s.size, color: "var(--color-primary)", opacity: 0.7, lineHeight:1,
            animation:`starPulse ${s.dur}s ease-in-out infinite`,
            animationDelay:`${i*0.28}s`, userSelect:"none", filter: 'drop-shadow(0 0 8px var(--color-primary))'
          }}>{s.char}</span>
        ))}
      </div>
    </>
  );
}

/* =========================================================================
   GAMER & NEON EFFECTS (Circuits, Scanlines, Debris)
   ========================================================================= */
const SHARDS = [
  {x:"20%",y:"15%",w:8,h:14,rot:35,dur:4.2},{x:"25%",y:"19%",w:5,h:10,rot:-20,dur:3.8},
  {x:"50%",y:"12%",w:7,h:12,rot:15,dur:4.5},{x:"61%",y:"18%",w:4,h:8,rot:-40,dur:3.5},
  {x:"68%",y:"15%",w:6,h:10,rot:50,dur:4.0},{x:"75%",y:"24%",w:5,h:9,rot:-25,dur:3.9},
  {x:"82%",y:"17%",w:8,h:5,rot:60,dur:4.3},{x:"87%",y:"21%",w:4,h:8,rot:-15,dur:3.6},
  {x:"93%",y:"16%",w:6,h:11,rot:30,dur:4.1},{x:"96%",y:"19%",w:5,h:5,rot:-50,dur:3.7},
  {x:"10%",y:"85%",w:7,h:12,rot:-20,dur:3.9},{x:"85%",y:"80%",w:5,h:8,rot:35,dur:4.1},
];

function DebrisLayer() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {SHARDS.map((s,i)=>(
        <div key={i} style={{
          position:"absolute",left:s.x,top:s.y,width:s.w,height:s.h,
          background:(i%3===0?"var(--color-primary)":i%3===1?"var(--color-secondary)":"var(--color-accent)"),
          transform:`rotate(${s.rot}deg)`,opacity:0.6,
          boxShadow:`0 0 8px currentColor`,
          animation:`debrisFloat ${s.dur}s ease-in-out infinite`,animationDelay:`${i*0.18}s`
        }}/>
      ))}
    </div>
  );
}

function MainCircuits() {
  return (
    <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none" viewBox="0 0 1000 600" preserveAspectRatio="none">
      <g stroke="var(--color-primary)" strokeWidth="1" fill="none">
        <line x1="0" y1="50" x2="60" y2="50"/><line x1="60" y1="50" x2="80" y2="30"/><line x1="80" y1="30" x2="300" y2="30"/>
        <line x1="1000" y1="120" x2="930" y2="120"/><line x1="930" y1="120" x2="910" y2="100"/><line x1="910" y1="100" x2="800" y2="100"/>
        <line x1="0" y1="500" x2="80" y2="500"/><line x1="80" y1="500" x2="100" y2="520"/>
        <circle cx="60" cy="50" r="3" fill="var(--color-primary)"/>
        <circle cx="930" cy="120" r="3" fill="var(--color-primary)"/>
        <circle cx="80" cy="500" r="3" fill="var(--color-primary)"/>
      </g>
    </svg>
  );
}

function Scanlines() {
  return <div className="absolute inset-0 pointer-events-none z-50 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.05)_2px,rgba(0,0,0,0.05)_4px)] mix-blend-overlay"/>;
}

function NeonGamerEffects() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      <DebrisLayer />
      <MainCircuits />
      <Scanlines />
    </div>
  );
}

/* =========================================================================
   LIGHT / CINZEL EFFECTS (GlowCurves, Elegant Sparkles)
   ========================================================================= */
function GlowCurve() {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible z-0" viewBox="0 0 860 480" preserveAspectRatio="none" style={{ opacity: 0.15 }}>
      <defs>
        <linearGradient id="cg" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0" />
          <stop offset="25%" stopColor="var(--color-primary)" stopOpacity="0.5" />
          <stop offset="60%" stopColor="var(--color-primary)" stopOpacity="0.75" />
          <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
        </linearGradient>
        <filter id="gl"><feGaussianBlur stdDeviation="6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      <path d="M 30 380 C 120 300 260 200 430 255 C 570 295 660 210 780 180" fill="none" stroke="url(#cg)" strokeWidth="2.5" filter="url(#gl)" style={{ animation: "glowPulse 4s ease-in-out infinite alternate" }} />
      <path d="M -50 395 C 130 310 270 210 445 260 C 585 298 670 215 890 185" fill="none" stroke="var(--color-secondary)" strokeOpacity="0.4" strokeWidth="6" filter="url(#gl)" />
    </svg>
  );
}

function ElegantSparkles() {
  return (
    <>
      {[{x:"93%",y:"88%",s:6,d:0},{x:"87%",y:"79%",s:4,d:0.5},{x:"14%",y:"73%",s:4,d:1},{x:"79%",y:"13%",s:5,d:1.5},{x:"4%",y:"34%",s:5,d:2},{x:"97%",y:"42%",s:4,d:0.3}].map((d,i)=>(
        <div key={i} style={{
          position:"absolute",left:d.x,top:d.y,
          width:d.s,height:d.s,borderRadius:"50%",
          background:"var(--color-primary)",opacity:0.65,zIndex:0,
          boxShadow: '0 0 8px var(--color-primary)',
          animation:`sparkle ${1.4+i*0.35}s ${d.d}s ease-in-out infinite alternate`
        }}/>
      ))}
      <div className="absolute right-[5%] bottom-[5%] text-2xl text-primary opacity-40 animate-[sparkle_2.2s_ease-in-out_infinite_alternate]">✦</div>
      <div className="absolute right-[10%] bottom-[15%] text-sm text-secondary opacity-30 animate-[sparkle_1.8s_0.6s_ease-in-out_infinite_alternate]">✦</div>
      <div className="absolute left-[10%] top-[15%] text-lg text-accent opacity-50 animate-[sparkle_2.5s_0.1s_ease-in-out_infinite_alternate]">✦</div>
    </>
  );
}

function LightThemeEffects() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      <GlowCurve />
      <ElegantSparkles />
      <SparkleClick colorArray={["#0084ff","#0ea5e9","#8b5cf6"]} />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(0,132,255,0.05),transparent_50%)]" />
    </div>
  );
}


/* =========================================================================
   MAIN CONTROLLER EXPORT
   ========================================================================= */
const ThemeEffects = memo(() => {
  const { theme } = useThemeStore();

  return (
    <>
      {theme === "pastel-dream" && <PastelDreamEffects />}
      {(theme === "gamer-high-energy" || theme === "neon-cyberpunk") && <NeonGamerEffects />}
      {theme === "light" && null}
    </>
  );
});

ThemeEffects.displayName = "ThemeEffects";

export default ThemeEffects;
