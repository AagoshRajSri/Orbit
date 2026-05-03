import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useThemeStore } from "../../../store/useThemeStore";

/* ─────────────── ANIMATIONS ─────────────── */

const ANIMAL_STYLES = `
  @keyframes blink {
    0%, 90%, 100% { transform: scaleY(1); }
    95% { transform: scaleY(0.1); }
  }
  @keyframes tailWiggle {
    0%, 100% { transform: rotate(0deg); }
    25% { transform: rotate(-15deg); }
    75% { transform: rotate(15deg); }
  }
  @keyframes earWiggle {
    0%, 100% { transform: rotate(0deg); }
    50% { transform: rotate(-10deg); }
  }
  
  .eye-blink {
    transform-origin: center;
    animation: blink 4s infinite;
  }
  .tail-wiggle {
    transform-origin: bottom center;
  }
  .ear-wiggle {
    transform-origin: center;
  }
  .group:hover .tail-wiggle {
    animation: tailWiggle 0.6s infinite ease-in-out;
  }
  .group:hover .ear-wiggle {
    animation: earWiggle 0.4s infinite ease-in-out;
  }
`;

/* ─────────────── SVG ANIMALS (Updated with classes) ─────────────── */

export const SittingCat = ({ color = "#ffd6f0" }) => (
  <svg viewBox="0 0 200 200" style={{ width: "100%", height: "100%", color }}>
    <path fill="currentColor" d="M100,180 Q60,180 60,130 Q60,80 100,80 Q140,80 140,130 Q140,180 100,180 Z" />
    <circle fill="currentColor" cx="100" cy="70" r="35" />
    <path fill="currentColor" className="ear-wiggle" d="M70,55 L75,20 L95,45 Z" />
    <path fill="currentColor" className="ear-wiggle" d="M130,55 L125,20 L105,45 Z" />
    <circle className="eye-blink" fill="#222" cx="85" cy="70" r="4" />
    <circle className="eye-blink" fill="#222" cx="115" cy="70" r="4" />
    <path className="tail-wiggle" fill="none" stroke="currentColor" strokeWidth="12" strokeLinecap="round" d="M130,160 Q170,160 160,110" style={{ transformOrigin: "130px 160px" }} />
  </svg>
);

export const Bunny = ({ color = "#fff0f5" }) => (
  <svg viewBox="0 0 200 200" style={{ width: "100%", height: "100%", color }}>
    <circle fill="currentColor" cx="100" cy="110" r="70" />
    <ellipse fill="currentColor" className="ear-wiggle" cx="70" cy="50" rx="22" ry="55" style={{ transform: "rotate(-10deg)", transformOrigin: "70px 50px" }} />
    <ellipse fill="currentColor" className="ear-wiggle" cx="130" cy="50" rx="22" ry="55" style={{ transform: "rotate(10deg)", transformOrigin: "130px 50px" }} />
    <circle className="eye-blink" fill="#333" cx="80" cy="100" r="6" />
    <circle className="eye-blink" fill="#333" cx="120" cy="100" r="6" />
    <ellipse fill="#ffb7ce" cx="100" cy="115" rx="8" ry="6" />
  </svg>
);

export const Panda = ({ color = "#fff" }) => (
  <svg viewBox="0 0 200 200" style={{ width: "100%", height: "100%", color }}>
    <circle fill="#fff" cx="100" cy="105" r="75" />
    <circle fill="#333" cx="65" cy="65" r="25" />
    <circle fill="#333" cx="135" cy="65" r="25" />
    <circle className="eye-blink" fill="#222" cx="70" cy="100" r="9" />
    <circle className="eye-blink" fill="#222" cx="130" cy="100" r="9" />
    <ellipse fill="#ffb7d5" cx="100" cy="118" rx="12" ry="8" />
  </svg>
);

export const Bear = ({ color = "#c8a882" }) => (
  <svg viewBox="0 0 200 200" style={{ width: "100%", height: "100%", color }}>
    <circle fill="currentColor" cx="100" cy="115" r="70" />
    <circle fill="currentColor" className="ear-wiggle" cx="60" cy="60" r="28" />
    <circle fill="currentColor" className="ear-wiggle" cx="140" cy="60" r="28" />
    <circle className="eye-blink" fill="#333" cx="82" cy="105" r="8" />
    <circle className="eye-blink" fill="#333" cx="118" cy="105" r="8" />
    <ellipse fill="#333" cx="100" cy="126" rx="8" ry="6" />
  </svg>
);

export const Fox = ({ color = "#ff8c00" }) => (
  <svg viewBox="0 0 200 200" style={{ width: "100%", height: "100%", color }}>
    <path fill="currentColor" d="M100,180 Q40,180 40,110 L60,30 L100,20 L140,30 L160,110 Q160,180 100,180 Z" />
    <circle className="eye-blink" fill="#222" cx="80" cy="100" r="7" />
    <circle className="eye-blink" fill="#222" cx="120" cy="100" r="7" />
    <ellipse fill="#333" cx="100" cy="118" rx="7" ry="5" />
    <path className="tail-wiggle" fill="currentColor" d="M160,140 Q190,160 170,110" style={{ transformOrigin: "160px 140px" }} />
  </svg>
);

export const Chick = ({ color = "#ffe066" }) => (
  <svg viewBox="0 0 200 200" style={{ width: "100%", height: "100%", color }}>
    <circle fill="currentColor" cx="100" cy="120" r="65" />
    <circle fill="currentColor" cx="100" cy="65" r="45" />
    <circle className="eye-blink" fill="#333" cx="84" cy="58" r="7" />
    <circle className="eye-blink" fill="#333" cx="116" cy="58" r="7" />
    <path fill="#ff9933" d="M88,75 L100,88 L112,75 Q100,68 88,75 Z" />
  </svg>
);

/* ─────────────── COMPONENTS ─────────────── */

const MESSAGES = ["uwu", "✨", "🌸", "hii!", "♡", "purr", "paws!", "zZz"];

const SpeechBubble = ({ message, visible }) => (
  <div style={{
    position: "absolute",
    bottom: "100%",
    left: "50%",
    transform: "translateX(-50%) translateY(-5px)",
    background: "rgba(255,255,255,0.95)",
    border: "2px solid #ffb3d9",
    borderRadius: 10,
    padding: "2px 8px",
    fontSize: 10,
    fontWeight: 700,
    color: "#d63883",
    whiteSpace: "nowrap",
    pointerEvents: "none",
    opacity: visible ? 1 : 0,
    transition: "opacity 0.2s, transform 0.2s",
    zIndex: 100,
    boxShadow: "0 2px 8px rgba(255,150,200,0.3)",
  }}>
    {message}
  </div>
);

export const StaticAnimal = ({ 
  type = "cat", 
  top, left, right, bottom, 
  rotate = "0deg", 
  scale = 1,
  peeking = false,
  revealOnHover = false,
  messageOverride
}) => {
  const [showBubble, setShowBubble] = useState(false);
  const [message, setMessage] = useState(messageOverride || MESSAGES[0]);

  const animals = {
    cat: <SittingCat />, bunny: <Bunny />, panda: <Panda />, 
    bear: <Bear />, fox: <Fox />, chick: <Chick />
  };

  const handleClick = () => {
    setMessage(messageOverride || MESSAGES[Math.floor(Math.random() * MESSAGES.length)]);
    setShowBubble(true);
    setTimeout(() => setShowBubble(false), 1500);
  };

  const baseTransform = `rotate(${rotate}) scale(${scale})`;
  
  return (
    <div 
      className="group"
      style={{
        position: "fixed",
        top, left, right, bottom,
        width: 64, height: 64,
        zIndex: 9999,
        cursor: "pointer",
        transition: "transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s",
        opacity: revealOnHover ? 0 : 1,
        pointerEvents: "auto",
      }}
      onMouseEnter={(e) => {
        if (revealOnHover) e.currentTarget.style.opacity = 1;
      }}
      onMouseLeave={(e) => {
        if (revealOnHover) e.currentTarget.style.opacity = 0;
      }}
      onClick={handleClick}
    >
      <div 
        style={{
          width: "100%", height: "100%",
          transform: baseTransform,
          transition: "transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
        className={peeking ? "translate-y-6 group-hover:translate-y-0" : ""}
      >
        <SpeechBubble message={message} visible={showBubble} />
        {animals[type] || animals.cat}
      </div>
    </div>
  );
};

export default function AnimalEasterEggs() {
  const { theme } = useThemeStore();
  const location = useLocation();
  
  if (theme !== "pastel-dream") return null;

  const isProfile = location.pathname === "/profile";
  const isSettings = location.pathname === "/settings";
  const isHome = location.pathname === "/";

  return (
    <>
      <style>{ANIMAL_STYLES}</style>
      
      {/* ───── HOME PAGE ───── */}
      {isHome && (
        <>
          <StaticAnimal type="cat" bottom="12%" left="2%" rotate="-10deg" messageOverride="hi bestie! ✨" />
          <StaticAnimal type="bunny" top="15%" right="2%" peeking={true} rotate="10deg" />
          <StaticAnimal type="panda" bottom="5%" right="40%" peeking={true} revealOnHover={true} />
          <StaticAnimal type="chick" top="70%" left="40%" peeking={true} revealOnHover={true} />
        </>
      )}

      {/* ───── PROFILE PAGE ───── */}
      {isProfile && (
        <>
          <StaticAnimal type="fox" top="10%" left="20%" rotate="180deg" peeking={true} messageOverride="vogue mode 💅" />
          <StaticAnimal type="panda" top="30%" right="15%" peeking={true} revealOnHover={true} />
          <StaticAnimal type="bunny" bottom="20%" left="5%" rotate="-15deg" />
          <StaticAnimal type="cat" bottom="5%" left="45%" peeking={true} revealOnHover={true} />
        </>
      )}

      {/* ───── SETTINGS PAGE ───── */}
      {isSettings && (
        <>
          <StaticAnimal type="bear" top="20%" left="2%" rotate="90deg" peeking={true} messageOverride="so many options! 🧸" />
          <StaticAnimal type="chick" bottom="10%" right="5%" rotate="-10deg" />
          <StaticAnimal type="bunny" top="5%" right="25%" peeking={true} revealOnHover={true} />
          <StaticAnimal type="cat" bottom="80%" left="40%" peeking={true} revealOnHover={true} />
        </>
      )}

      {/* ───── GLOBAL (Always present) ───── */}
      <StaticAnimal type="chick" bottom="2%" right="20%" peeking={true} revealOnHover={true} />
    </>
  );
}

// Basic components for compatibility with other files (like PastelDreamBoard)
export const Flower = ({ color = "#ff9fd0", ...props }) => (
  <svg viewBox="0 0 100 100" {...props}>
    <circle cx="50" cy="50" r="20" fill={color} opacity="0.6" />
    {[0, 60, 120, 180, 240, 300].map(deg => (
      <circle key={deg} cx={50 + 25 * Math.cos(deg * Math.PI / 180)} cy={50 + 25 * Math.sin(deg * Math.PI / 180)} r="15" fill={color} />
    ))}
  </svg>
);

export const SittingBird = ({ color = "#ff8ec8", ...props }) => (
  <svg viewBox="0 0 100 100" width="40" height="40" {...props}>
    <path fill={color} d="M30,80 Q30,40 50,40 Q70,40 70,80 Z" />
    <circle fill={color} cx="50" cy="35" r="15" />
    <path fill="#ffcc44" d="M60,35 L75,35 L60,45 Z" />
    <circle fill="#333" cx="45" cy="32" r="2" />
  </svg>
);

export const Snake = ({ color = "#88ffcc", ...props }) => (
  <svg viewBox="0 0 100 100" width="40" height="40" {...props}>
    <path fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" d="M20,80 Q40,40 60,80 T100,80" />
    <circle fill={color} cx="20" cy="75" r="10" />
  </svg>
);

/* ── FLYING BIRD TRIGGER ── */
export const FlyingBirdTrigger = () => {
  const [birds, setBirds] = useState([]);

  const trigger = () => {
    const id = Date.now();
    const newBird = {
      id,
      top: Math.random() * 60 + 10 + "%",
      delay: Math.random() * 0.5,
      duration: Math.random() * 2 + 3,
    };
    setBirds((prev) => [...prev, newBird]);
    setTimeout(() => {
      setBirds((prev) => prev.filter((b) => b.id !== id));
    }, 6000);
  };

  useEffect(() => {
    // Expose trigger globally for interaction-based easter eggs
    window.triggerFlyingBird = trigger;
    // Auto-trigger occasionally for life
    const interval = setInterval(() => {
      if (Math.random() > 0.7) trigger();
    }, 10000);
    return () => {
      delete window.triggerFlyingBird;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[10000] overflow-hidden">
      <style>{`
        @keyframes flyAcross {
          0% { transform: translateX(-100px) scaleX(1); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateX(calc(100vw + 100px)) scaleX(1); opacity: 0; }
        }
      `}</style>
      {birds.map((bird) => (
        <div
          key={bird.id}
          style={{
            position: "absolute",
            top: bird.top,
            left: 0,
            animation: `flyAcross ${bird.duration}s linear forwards`,
            animationDelay: `${bird.delay}s`,
          }}
        >
          <SittingBird color="#ff8ec8" />
        </div>
      ))}
    </div>
  );
};
