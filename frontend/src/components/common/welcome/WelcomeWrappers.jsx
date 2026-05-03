import { useThemeStore } from "../../store/useThemeStore";

const FLOATIES = [
  { x: "12%", y: "15%", char: "✦", size: 14, color: "#f8c8e8", opacity: 0.75, dur: 2.8 },
  { x: "82%", y: "10%", char: "✦", size: 12, color: "#e8c8f8", opacity: 0.65, dur: 3.1 },
  { x: "92%", y: "25%", char: "✦", size: 18, color: "#ffd6f0", opacity: 0.7, dur: 2.5 },
  { x: "76%", y: "35%", char: "✺", size: 10, color: "#ffb8d8", opacity: 0.55, dur: 3.4 },
  { x: "85%", y: "45%", char: "✦", size: 12, color: "#e0c8ff", opacity: 0.55, dur: 2.9 },
  { x: "90%", y: "60%", char: "☽", size: 24, color: "#f0d8ff", opacity: 0.6, dur: 4.0 },
  { x: "8%", y: "55%", char: "✦", size: 15, color: "#c8f0e0", opacity: 0.5, dur: 3.2 },
  { x: "2%", y: "75%", char: "✦", size: 12, color: "#ffd8ee", opacity: 0.45, dur: 2.7 },
  { x: "32%", y: "85%", char: "♡", size: 18, color: "#ffaad0", opacity: 0.55, dur: 3.5 },
  { x: "65%", y: "12%", char: "✿", size: 16, color: "#ffd0e8", opacity: 0.5, dur: 3.9 },
  { x: "55%", y: "88%", char: "⋆", size: 20, color: "#ffc8e8", opacity: 0.35, dur: 5.0 },
  { x: "20%", y: "30%", char: "⋆", size: 16, color: "#d8c8ff", opacity: 0.35, dur: 4.5 },
];

function Floaties() {
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 1 }}>
      {FLOATIES.map((s, i) => (
        <span key={i} className="absolute inline-block select-none" style={{
          left: s.x, top: s.y,
          fontSize: s.size, color: s.color, opacity: s.opacity, lineHeight: 1,
          animation: `pulse ${s.dur}s ease-in-out infinite`,
          animationDelay: `${i * 0.28}s`,
        }}>{s.char}</span>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────
   GAMER NEON CARD
───────────────────────────────────────────── */
export function GamerCard({ color = "#00f5d4", children, className = "", onClick }) {
  return (
    <div 
      onClick={onClick}
      className={`relative overflow-hidden group transition-all duration-300 hover:scale-[1.02] cursor-pointer ${className}`}
      style={{
        border: `1.5px solid ${color}`,
        borderRadius: 8,
        boxShadow: `0 0 8px ${color}, 0 0 20px ${color}44, inset 0 0 8px ${color}11`,
        background: "rgba(8,6,20,0.82)",
        backdropFilter: "blur(6px)",
      }}
    >
      <div style={{ position: "absolute", top: -1, left: -1, width: 14, height: 14, borderTop: `2.5px solid ${color}`, borderLeft: `2.5px solid ${color}`, borderRadius: "6px 0 0 0", zIndex: 5 }} />
      <div style={{ position: "absolute", top: -1, right: -1, width: 14, height: 14, borderTop: `2.5px solid ${color}`, borderRight: `2.5px solid ${color}`, borderRadius: "0 6px 0 0", zIndex: 5 }} />
      <div style={{ position: "absolute", bottom: -1, left: -1, width: 14, height: 14, borderBottom: `2.5px solid ${color}`, borderLeft: `2.5px solid ${color}`, borderRadius: "0 0 0 6px", zIndex: 5 }} />
      <div style={{ position: "absolute", bottom: -1, right: -1, width: 14, height: 14, borderBottom: `2.5px solid ${color}`, borderRight: `2.5px solid ${color}`, borderRadius: "0 0 6px 0", zIndex: 5 }} />
      
      {/* Internal Grid SVG Overlay for Gamer */}
      <svg className="absolute inset-0 w-full h-full opacity-10 pointer-events-none" preserveAspectRatio="none">
         <pattern id="g-grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke={color} strokeWidth="0.5" />
         </pattern>
         <rect width="100%" height="100%" fill="url(#g-grid)" />
      </svg>
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────────
   PASTEL CARD
───────────────────────────────────────────── */
export function PastelCard({ bg = "var(--color-base-100)", children, className = "", onClick }) {
  return (
    <div 
      onClick={onClick}
      className={`relative overflow-hidden group transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 cursor-pointer rounded-3xl p-5 border border-white/40 shadow-xl ${className}`}
      style={{
        background: bg,
        backdropFilter: "blur(12px)",
      }}
    >
      <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none mix-blend-overlay" />
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────────
   LIGHT/CINZEL CARD
───────────────────────────────────────────── */
export function LightCard({ children, className = "", onClick }) {
  return (
    <div 
      onClick={onClick}
      className={`relative overflow-hidden group transition-all duration-500 hover:scale-[1.02] cursor-pointer rounded-2xl p-6 shadow-lg ${className}`}
      style={{
        background: "rgba(255,255,255,0.72)",
        backdropFilter: "blur(14px)",
        border: "1px solid rgba(176, 141, 87, 0.15)",
        boxShadow: "0 4px 15px rgba(0,0,0,0.03)"
      }}
    >
      <div className="absolute inset-0 z-0 border border-[rgba(180,141,87,0.15)] rounded-2xl pointer-events-none" />
      <div className="absolute top-0 bottom-0 left-0 right-0 z-0 border-[3px] border-[rgba(180,141,87,0.08)] rounded-2xl pointer-events-none m-[2px]" />
      
      {/* Decorative corners */}
      <svg className="absolute top-0 left-0 w-8 h-8 pointer-events-none opacity-40 m-1" viewBox="0 0 32 32" fill="none">
        <path d="M 0 0 L 16 0 A 16 16 0 0 1 0 16 Z" fill="rgba(176,141,87,0.3)" />
      </svg>
      <svg className="absolute bottom-0 right-0 w-8 h-8 pointer-events-none opacity-40 m-1" viewBox="0 0 32 32" fill="none">
        <path d="M 32 32 L 16 32 A 16 16 0 0 1 32 16 Z" fill="rgba(176,141,87,0.3)" />
      </svg>

      <div className="relative z-10 w-full h-full">
        {children}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   AMOLED CARD — true black, hairline borders
───────────────────────────────────────────── */
export function AmoledCard({ color = "#00D4FF", children, className = "", onClick }) {
  return (
    <div
      onClick={onClick}
      className={`relative group flex flex-col transition-all duration-200 cursor-pointer ${className}`}
      style={{
        background: "var(--bg-elevation-1)",
        border: "1px solid var(--border-default)",
        borderRadius: "16px",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = "var(--bg-elevation-2)";
        e.currentTarget.style.borderColor = "var(--border-active)";
        e.currentTarget.style.boxShadow = "var(--shadows-glow-primary)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = "var(--bg-elevation-1)";
        e.currentTarget.style.borderColor = "var(--border-default)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <div className="relative z-10 w-full h-full">{children}</div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   DEFAULT NEBULA CARD
───────────────────────────────────────────── */
export function DefaultCard({ color = "var(--chat-primary)", children, className = "", onClick }) {
  return (
    <div 
      onClick={onClick}
      className={`relative group rounded-3xl border border-white/20 bg-white/20 p-6 transition-all duration-300 hover:bg-white/30 hover:border-white/40 shadow-[0_8px_32px_0_rgba(31,38,135,0.1)] backdrop-blur-xl flex flex-col ${className}`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-current to-transparent opacity-0 group-hover:opacity-10 transition-opacity blur-2xl rounded-3xl" style={{ color }} />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   GLOBAL CONTROLLER
───────────────────────────────────────────── */
export function ThemeCardWrapper({ themeColorMap, children, className, onClick }) {
  const { theme } = useThemeStore();

  if (theme === "gamer-high-energy" || theme === "neon-cyberpunk") {
     return <GamerCard color={themeColorMap.gamer} className={className} onClick={onClick}>{children}</GamerCard>;
  }
  if (theme === "light") {
     return <LightCard className={className} onClick={onClick}>{children}</LightCard>;
  }
  if (theme === "pastel-dream") {
     return <PastelCard bg={themeColorMap.pastel} className={`p-6 ${className}`} onClick={onClick}>{children}</PastelCard>;
  }
  if (theme === "amoled-dark") {
     return <AmoledCard color={themeColorMap.default} className={`p-6 ${className}`} onClick={onClick}>{children}</AmoledCard>;
  }
  return <DefaultCard color={themeColorMap.default} className={className} onClick={onClick}>{children}</DefaultCard>;
}

/* ─────────────────────────────────────────────
   GLOBAL BACKGROUND CONTAINER
───────────────────────────────────────────── */
export function ThemeMainContainer({ children, className = "" }) {
  const { theme } = useThemeStore();

  if (theme === "gamer-high-energy" || theme === "neon-cyberpunk") {
    return (
      <div className={`w-full max-w-4xl relative z-10 p-8 flex flex-col gap-6 ${className}`}>
        <div style={{ position: "absolute", inset: 0, border: "2px solid rgba(0, 245, 212, 0.4)", borderRadius: 12, background: "rgba(5, 11, 15, 0.7)", backdropFilter: "blur(4px)", pointerEvents: "none" }} />
        <div className="relative z-10 w-full h-full flex flex-col gap-8">{children}</div>
      </div>
    );
  }

  if (theme === "light") {
    return (
      <div className={`w-full max-w-4xl relative z-10 p-8 flex flex-col gap-6 ${className}`}>
        <div style={{ position: "absolute", inset: 0, border: "1.5px solid rgba(180, 140, 120, 0.5)", borderRadius: 24, background: "rgba(255, 255, 255, 0.5)", backdropFilter: "blur(12px)", pointerEvents: "none" }} />
        <div className="relative z-10 w-full h-full flex flex-col gap-8">{children}</div>
      </div>
    );
  }

  if (theme === "pastel-dream") {
    return (
      <div className={`w-full max-w-4xl relative z-10 p-8 rounded-[3rem] border border-white/40 bg-[rgba(255,250,252,0.35)] backdrop-blur-[24px] flex flex-col gap-8 shadow-[0_8px_32px_0_rgba(255,150,200,0.15)] ${className} overflow-hidden`}>
        {/* BgClouds Overlays */}
        <div style={{ position:"absolute", inset:0, overflow:"hidden", pointerEvents:"none", zIndex: 0 }}>
          <div style={{ position:"absolute", left:"-8%", top:"5%", width:420, height:340, background:"radial-gradient(ellipse, rgba(255,160,210,0.4) 0%, transparent 70%)", filter:"blur(32px)" }}/>
          <div style={{ position:"absolute", left:"5%", top:"-5%", width:320, height:260, background:"radial-gradient(ellipse, rgba(220,190,255,0.3) 0%, transparent 70%)", filter:"blur(26px)" }}/>
          <div style={{ position:"absolute", right:"-5%", top:"10%", width:300, height:320, background:"radial-gradient(ellipse, rgba(180,220,255,0.25) 0%, transparent 70%)", filter:"blur(26px)" }}/>
          <div style={{ position:"absolute", left:"-2%", bottom:"5%", width:370, height:260, background:"radial-gradient(ellipse, rgba(255,150,205,0.3) 0%, transparent 70%)", filter:"blur(30px)" }}/>
          <div style={{ position:"absolute", right:"15%", top:"-8%", width:260, height:200, background:"radial-gradient(ellipse, rgba(255,130,200,0.2) 0%, transparent 70%)", filter:"blur(28px)" }}/>
        </div>
        <Floaties />
        <div className="relative z-10 w-full h-full flex flex-col gap-8">{children}</div>
      </div>
    );
  }

  if (theme === "amoled-dark") {
    return (
      <div className={`w-full max-w-4xl relative z-10 p-8 flex flex-col gap-8 ${className}`}
        style={{
          background: "var(--bg-elevation-0)",
          border: "1px solid var(--border-default)",
          borderRadius: "24px",
        }}
      >
        {/* Subtle accent glow top-left */}
        <div style={{ position: "absolute", top: 0, left: 0, width: 300, height: 200, background: "radial-gradient(ellipse, rgba(0, 212, 255, 0.04) 0%, transparent 70%)", pointerEvents: "none", borderRadius: "24px 0 0 0" }} />
        <div className="relative z-10 w-full h-full flex flex-col gap-8">{children}</div>
      </div>
    );
  }

  return (
    <div className={`w-full max-w-4xl relative z-10 p-8 rounded-[2rem] border border-white/30 bg-white/20 backdrop-blur-2xl flex flex-col gap-8 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] ${className}`}>
      {children}
    </div>
  );
}

