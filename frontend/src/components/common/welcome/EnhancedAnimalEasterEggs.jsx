import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useThemeStore } from "../../../store/useThemeStore";
import { gsap } from "gsap";
import { FlowerDecoration } from "./FlowerDecoration";

/* ─────────────── NEW ANIMALS & FLOWERS ─────────────── */

// 🐱🐷🐙🐦🐕🐼 ANIMALS
export const SittingCat = ({ color = "#ffd6f0", className = "" }) => (
  <svg viewBox="0 0 200 200" className={`w-full h-full ${className}`} style={{ color }}>
    <path fill="currentColor" d="M100,180 Q60,180 60,130 Q60,80 100,80 Q140,80 140,130 Q140,180 100,180 Z" />
    <circle fill="currentColor" cx="100" cy="70" r="35" />
    <path fill="currentColor" className="cat-ear" d="M70,55 L75,20 L95,45 Z" />
    <path fill="currentColor" className="cat-ear" d="M130,55 L125,20 L105,45 Z" />
    <circle className="eye-blink" fill="#222" cx="85" cy="70" r="4" />
    <circle className="eye-blink" fill="#222" cx="115" cy="70" r="4" />
    <ellipse fill="#ffb7d5" cx="100" cy="80" rx="6" ry="4" />
    <circle fill="#ff85cc" cx="75" cy="80" r="3" opacity="0.7" />
    <circle fill="#ff85cc" cx="125" cy="80" r="3" opacity="0.7" />
    <path className="cat-tail" fill="none" stroke="currentColor" strokeWidth="12" strokeLinecap="round" d="M130,160 Q170,160 160,110" style={{ transformOrigin: "130px 160px" }} />
  </svg>
);

export const Penguin = ({ color = "#333", className = "" }) => (
  <svg viewBox="0 0 200 200" className={`w-full h-full ${className}`} style={{ color }}>
    <ellipse fill="currentColor" cx="100" cy="120" rx="45" ry="65" />
    <ellipse fill="#fff" cx="100" cy="125" rx="30" ry="50" />
    <circle fill="currentColor" cx="100" cy="70" r="30" />
    <circle fill="#fff" cx="100" cy="75" r="22" />
    <circle className="eye-blink" fill="#333" cx="92" cy="70" r="3" />
    <circle className="eye-blink" fill="#333" cx="108" cy="70" r="3" />
    <path fill="#ffa500" d="M95,80 L105,80 L100,90 Z" />
    <path fill="currentColor" d="M55,100 Q40,110 50,140 Q60,110 55,100" />
    <path fill="currentColor" d="M145,100 Q160,110 150,140 Q140,110 145,100" />
  </svg>
);

export const Fox = ({ color = "#ff7b3c", className = "" }) => (
  <svg viewBox="0 0 200 200" className={`w-full h-full ${className}`} style={{ color }}>
    <path fill="currentColor" d="M100,180 Q60,180 60,130 Q60,80 100,80 Q140,80 140,130 Q140,180 100,180 Z" />
    <path fill="#fff" d="M100,180 Q80,180 75,150 Q90,165 100,165 Q110,165 125,150 Q120,180 100,180 Z" opacity="0.6" />
    <circle fill="currentColor" cx="100" cy="75" r="38" />
    <path fill="currentColor" d="M68,55 L60,20 L90,45 Z" />
    <path fill="currentColor" d="M132,55 L140,20 L110,45 Z" />
    <circle className="eye-blink" fill="#222" cx="85" cy="75" r="4" />
    <circle className="eye-blink" fill="#222" cx="115" cy="75" r="4" />
    <circle fill="#111" cx="100" cy="85" r="4" />
    <path className="fox-tail" fill="currentColor" d="M140,130 Q180,110 170,160 Q150,170 140,130" style={{ transformOrigin: "140px 130px" }} />
  </svg>
);

export const Bunny = ({ color = "#e2e2e2", className = "" }) => (
  <svg viewBox="0 0 200 200" className={`w-full h-full ${className}`} style={{ color }}>
    <circle fill="currentColor" cx="100" cy="130" r="50" />
    <circle fill="currentColor" cx="100" cy="80" r="35" />
    <path fill="currentColor" className="bunny-ear" d="M85,55 Q75,10 88,10 Q105,10 95,55" style={{ transformOrigin: "90px 45px" }} />
    <path fill="currentColor" className="bunny-ear" d="M115,55 Q125,10 112,10 Q95,10 105,55" style={{ transformOrigin: "110px 45px" }} />
    <circle className="eye-blink" fill="#333" cx="88" cy="75" r="3.5" />
    <circle className="eye-blink" fill="#333" cx="112" cy="75" r="3.5" />
    <circle fill="#ff1493" cx="100" cy="85" r="3" />
  </svg>
);

export const PenguinParade = () => {
  const [penguins, setPenguins] = useState([]);
  useEffect(() => {
    const paradeInterval = setInterval(() => {
      const id = Date.now();
      const direction = Math.random() > 0.5 ? 1 : -1;
      const startX = direction === 1 ? -100 : window.innerWidth + 100;
      const y = window.innerHeight * (0.8 + Math.random() * 0.15);
      setPenguins(prev => [...prev, { id, startX, y, direction }]);
      setTimeout(() => setPenguins(prev => prev.filter(p => p.id !== id)), 12000);
    }, 12000);
    return () => clearInterval(paradeInterval);
  }, []);
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 9999, overflow: "hidden" }}>
      {penguins.map(p => (
        <div key={p.id} style={{
          position: "absolute", left: p.startX, top: p.y, width: 50, height: 50,
          transform: `scaleX(${p.direction})`,
          animation: `penguinWalk 10s linear forwards`
        }}>
          <Penguin />
          <style>{`
            @keyframes penguinWalk {
              0% { left: ${p.startX}px; transform: scaleX(${p.direction}) rotate(0deg); }
              25% { transform: scaleX(${p.direction}) rotate(10deg); }
              50% { transform: scaleX(${p.direction}) rotate(0deg); }
              75% { transform: scaleX(${p.direction}) rotate(-10deg); }
              100% { left: ${p.direction === 1 ? window.innerWidth + 100 : -100}px; transform: scaleX(${p.direction}) rotate(0deg); }
            }
          `}</style>
        </div>
      ))}
    </div>
  );
};

export const Pig = ({ color = "#ffb3ba", className = "" }) => (
  <svg viewBox="0 0 200 200" className={`w-full h-full ${className}`} style={{ color }}>
    <ellipse fill="currentColor" cx="100" cy="120" rx="70" ry="60" />
    <circle fill="currentColor" cx="100" cy="70" r="40" />
    <ellipse fill="#ff6b9d" cx="100" cy="85" rx="12" ry="8" />
    <circle className="eye-blink" fill="#333" cx="85" cy="65" r="6" />
    <circle className="eye-blink" fill="#333" cx="115" cy="65" r="6" />
    <path fill="#ff6b9d" d="M75,85 Q70,95 75,105 Q80,95 85,85 Q80,95 85,105" />
    <path fill="#ff6b9d" d="M115,85 Q120,95 115,105 Q110,95 105,85 Q110,95 105,105" />
    <path fill="currentColor" d="M85,55 Q80,40 85,35 Q90,40 95,35 Q100,40 105,35 Q110,40 115,35 Q120,40 115,55" />
  </svg>
);

export const Octopus = ({ color = "#9b5de5", className = "" }) => (
  <svg viewBox="0 0 200 200" className={`w-full h-full ${className}`} style={{ color }}>
    <ellipse fill="currentColor" cx="100" cy="80" rx="50" ry="45" />
    <circle className="eye-blink" fill="#fff" cx="85" cy="75" r="8" />
    <circle className="eye-blink" fill="#fff" cx="115" cy="75" r="8" />
    <circle className="eye-blink" fill="#333" cx="85" cy="75" r="4" />
    <circle className="eye-blink" fill="#333" cx="115" cy="75" r="4" />
    <path fill="#ff6b9d" cx="100" cy="90" rx="8" ry="6" />
    {/* Tentacles */}
    <path fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round" d="M70,110 Q60,140 65,160" />
    <path fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round" d="M85,115 Q80,145 85,165" />
    <path fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round" d="M100,120 Q100,150 100,170" />
    <path fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round" d="M115,115 Q120,145 115,165" />
    <path fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round" d="M130,110 Q140,140 135,160" />
  </svg>
);

export const Bird = ({ color = "#87ceeb", className = "" }) => (
  <svg viewBox="0 0 200 200" className={`w-full h-full ${className}`} style={{ color }}>
    <ellipse fill="currentColor" cx="100" cy="100" rx="35" ry="45" />
    <circle fill="currentColor" cx="100" cy="60" r="25" />
    <circle className="eye-blink" fill="#333" cx="92" cy="55" r="5" />
    <circle className="eye-blink" fill="#333" cx="108" cy="55" r="5" />
    <path fill="#ffa500" d="M115,60 L130,58 L120,65 Q115,62 115,60 Z" />
    <path fill="currentColor" d="M65,90 Q40,85 30,95 Q40,100 65,95" />
    <path fill="currentColor" d="M135,90 Q160,85 170,95 Q160,100 135,95" />
    <path fill="#ff69b4" cx="100" cy="75" rx="6" ry="4" />
  </svg>
);

export const Dog = ({ color = "#d2691e", className = "" }) => (
  <svg viewBox="0 0 200 200" className={`w-full h-full ${className}`} style={{ color }}>
    <ellipse fill="currentColor" cx="100" cy="120" rx="65" ry="55" />
    <circle fill="currentColor" cx="100" cy="70" r="35" />
    <path fill="currentColor" className="dog-ear" d="M60,60 L45,30 L75,50 Z" />
    <path fill="currentColor" className="dog-ear" d="M140,60 L155,30 L125,50 Z" />
    <circle className="eye-blink" fill="#333" cx="85" cy="65" r="6" />
    <circle className="eye-blink" fill="#333" cx="115" cy="65" r="6" />
    <ellipse fill="#333" cx="100" cy="85" rx="10" ry="8" />
    <path fill="#ff69b4" cx="100" cy="100" rx="8" ry="6" />
    <path fill="currentColor" d="M75,110 Q70,130 75,140" />
    <path fill="currentColor" d="M125,110 Q130,130 125,140" />
  </svg>
);

export const Panda = ({ color = "#fff", className = "" }) => (
  <svg viewBox="0 0 200 200" className={`w-full h-full ${className}`} style={{ color }}>
    <circle fill="#fff" cx="100" cy="105" r="75" />
    <circle fill="#333" cx="65" cy="65" r="25" />
    <circle fill="#333" cx="135" cy="65" r="25" />
    <circle className="eye-blink" fill="#222" cx="70" cy="100" r="9" />
    <circle className="eye-blink" fill="#222" cx="130" cy="100" r="9" />
    <ellipse fill="#ffb7d5" cx="100" cy="118" rx="12" ry="8" />
    <circle fill="#333" cx="100" cy="135" r="6" />
  </svg>
);

// 🌸🌺🌷🌹🌻 FLOWERS
export const SakuraFlower = ({ color = "#ffb7d5", className = "" }) => (
  <svg viewBox="0 0 100 100" className={`w-full h-full ${className}`}>
    <circle cx="50" cy="50" r="8" fill="#fff" />
    {[0, 72, 144, 216, 288].map((deg, i) => (
      <ellipse
        key={i}
        cx={50 + 15 * Math.cos(deg * Math.PI / 180)}
        cy={50 + 15 * Math.sin(deg * Math.PI / 180)}
        rx={12}
        ry={8}
        fill={color}
        transform={`rotate(${deg} 50 50)`}
        opacity={0.8}
      />
    ))}
  </svg>
);

export const RoseFlower = ({ color = "#ff69b4", className = "" }) => (
  <svg viewBox="0 0 100 100" className={`w-full h-full ${className}`}>
    {[...Array(8)].map((_, i) => (
      <ellipse
        key={i}
        cx={50 + 12 * Math.cos(i * 45 * Math.PI / 180)}
        cy={50 + 12 * Math.sin(i * 45 * Math.PI / 180)}
        rx={10}
        ry={15}
        fill={color}
        transform={`rotate(${i * 45} 50 50)`}
        opacity={0.7}
      />
    ))}
    <circle cx="50" cy="50" r="6" fill="#8b0000" />
  </svg>
);

export const Sunflower = ({ color = "#ffd700", className = "" }) => (
  <svg viewBox="0 0 100 100" className={`w-full h-full ${className}`}>
    <circle cx="50" cy="50" r="12" fill="#8b4513" />
    {[...Array(12)].map((_, i) => (
      <ellipse
        key={i}
        cx={50 + 18 * Math.cos(i * 30 * Math.PI / 180)}
        cy={50 + 18 * Math.sin(i * 30 * Math.PI / 180)}
        rx={8}
        ry={15}
        fill={color}
        transform={`rotate(${i * 30} 50 50)`}
      />
    ))}
  </svg>
);

export const TulipFlower = ({ color = "#ff6b9d", className = "" }) => (
  <svg viewBox="0 0 100 100" className={`w-full h-full ${className}`}>
    <path d="M50,80 Q45,60 50,40 Q55,60 50,80" fill="#228b22" />
    <ellipse cx="50" cy="35" rx="15" ry="20" fill={color} />
    <ellipse cx="50" cy="30" rx="8" ry="12" fill="#ff1493" opacity={0.7} />
  </svg>
);

export const DaisyFlower = ({ color = "#ffffff", className = "" }) => (
  <svg viewBox="0 0 100 100" className={`w-full h-full ${className}`}>
    <circle cx="50" cy="50" r="8" fill="#ffd700" />
    {[...Array(8)].map((_, i) => (
      <ellipse
        key={i}
        cx={50 + 14 * Math.cos(i * 45 * Math.PI / 180)}
        cy={50 + 14 * Math.sin(i * 45 * Math.PI / 180)}
        rx={6}
        ry={12}
        fill={color}
        transform={`rotate(${i * 45} 50 50)`}
      />
    ))}
  </svg>
);

export const LavenderFlower = ({ color = "#9370db", className = "" }) => (
  <svg viewBox="0 0 100 100" className={`w-full h-full ${className}`}>
    <path d="M50,80 Q48,60 50,40 Q52,60 50,80" fill="#228b22" />
    {[...Array(6)].map((_, i) => (
      <ellipse
        key={i}
        cx={50 + 8 * Math.cos((i * 60 + 30) * Math.PI / 180)}
        cy={35 + 8 * Math.sin((i * 60 + 30) * Math.PI / 180)}
        rx={4}
        ry={8}
        fill={color}
        opacity={0.8}
      />
    ))}
  </svg>
);

/* ─────────────── ENHANCED COMPONENTS ─────────────── */

const CUTE_MESSAGES = [
  "uwu", "✨", "🌸", "hii!", "♡", "purr", "paws!", "zZz", 
  "boop!", "🎀", "cute!", "🌙", "hehe~", "⋆｡°✩"
];

const SpeechBubble = ({ message, visible, animalRef }) => {
  const bubbleRef = useRef(null);
  
  useEffect(() => {
    if (visible && bubbleRef.current && animalRef.current) {
      gsap.fromTo(bubbleRef.current, 
        { scale: 0, opacity: 0, rotation: -5 },
        { scale: 1, opacity: 1, rotation: 0, duration: 0.3, ease: "back.out(1.7)" }
      );
    }
  }, [visible, animalRef]);

  if (!visible) return null;

  return (
    <div 
      ref={bubbleRef}
      style={{
        position: "absolute",
        bottom: "100%",
        left: "50%",
        transform: "translateX(-50%) translateY(-8px)",
        background: "linear-gradient(135deg, rgba(255,255,255,0.95), rgba(255,240,245,0.9))",
        border: "2px solid #ffb3d9",
        borderRadius: 12,
        padding: "4px 10px",
        fontSize: 11,
        fontWeight: 700,
        color: "#d63883",
        whiteSpace: "nowrap",
        pointerEvents: "none",
        zIndex: 100,
        boxShadow: "0 4px 12px rgba(255,150,200,0.3)",
        backdropFilter: "blur(8px)",
      }}
    >
      {message}
      <div style={{
        position: "absolute",
        bottom: -8,
        left: "50%",
        transform: "translateX(-50%)",
        width: 0,
        height: 0,
        borderLeft: "8px solid transparent",
        borderRight: "8px solid transparent",
        borderTop: "8px solid #ffb3d9",
      }} />
    </div>
  );
};

export const EnhancedAnimal = ({ 
  type = "cat", 
  top, left, right, bottom, 
  rotate = "0deg", 
  scale = 1,
  messageOverride,
  animationType = "gentleFloat"
}) => {
  const [showBubble, setShowBubble] = useState(false);
  const [message, setMessage] = useState(messageOverride || CUTE_MESSAGES[0]);
  const animalRef = useRef(null);
  const containerRef = useRef(null);
  const hoverAnimationRef = useRef(null);

  const animals = {
    cat: <SittingCat />, pig: <Pig />, octopus: <Octopus />, 
    bird: <Bird />, dog: <Dog />, panda: <Panda />,
    penguin: <Penguin />, fox: <Fox />, bunny: <Bunny />
  };

  const handleClick = (e) => {
    e.stopPropagation();
    setMessage(messageOverride || CUTE_MESSAGES[Math.floor(Math.random() * CUTE_MESSAGES.length)]);
    setShowBubble(true);
    gsap.to(animalRef.current, { scale: 1.25, rotation: "+=12", duration: 0.15, yoyo: true, repeat: 1, ease: "power2.out" });
    setTimeout(() => setShowBubble(false), 2000);
  };

  const handleMouseEnter = () => {
    if (animalRef.current) {
      if (hoverAnimationRef.current) hoverAnimationRef.current.kill();
      hoverAnimationRef.current = gsap.to(animalRef.current, { scale: 1.15, rotation: "+=3", duration: 0.3, ease: "power2.out" });
      const parts = animalRef.current.querySelectorAll('.cat-tail, .fox-tail, .dog-tail, .bunny-ear');
      parts.forEach(part => gsap.to(part, { rotation: part.classList.contains('bunny-ear') ? "+=10" : "+=35", duration: 0.25, yoyo: true, repeat: -1, ease: "sine.inOut" }));
    }
  };

  const handleMouseLeave = () => {
    if (animalRef.current) {
      if (hoverAnimationRef.current) hoverAnimationRef.current.kill();
      hoverAnimationRef.current = gsap.to(animalRef.current, { scale: 1, rotation: rotate, duration: 0.5, ease: "elastic.out(1, 0.4)" });
      const parts = animalRef.current.querySelectorAll('.cat-tail, .fox-tail, .dog-tail, .bunny-ear');
      parts.forEach(part => gsap.killTweensOf(part));
    }
  };

  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(containerRef.current, { opacity: 0, scale: 0.5 }, { opacity: 0.8, scale: 1, duration: 0.8, ease: "back.out(1.7)", delay: Math.random() * 0.5 });
    }
  }, []);

  return (
    <div ref={containerRef} style={{ position: "fixed", top, left, right, bottom, width: 55, height: 55, zIndex: 90, cursor: "pointer", pointerEvents: "auto" }} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} onClick={handleClick}>
      <div ref={animalRef} className={animationType} style={{ width: "100%", height: "100%", transform: `rotate(${rotate}) scale(${scale})`, transformOrigin: "center", filter: "drop-shadow(0 6px 12px rgba(255,150,200,0.4))" }}>
        <SpeechBubble message={message} visible={showBubble} animalRef={animalRef} />
        {animals[type] || animals.cat}
      </div>
    </div>
  );
};

export default function EnhancedAnimalEasterEggs() {
  const { theme } = useThemeStore();
  const location = useLocation();
  if (theme !== "pastel-dream") return null;
  const isProfile = location.pathname === "/profile";
  const isSettings = location.pathname === "/settings";
  const isHome = location.pathname === "/";

  return (
    <>
      <PenguinParade />
      {isHome && (
        <>
          <EnhancedAnimal type="cat" bottom="6%" left="4%" rotate="-8deg" messageOverride="meow! 🐱" animationType="subtle-bounce" />
          <EnhancedAnimal type="pig" top="18%" right="6%" rotate="12deg" messageOverride="oink! 🐷" animationType="gentle-float" />
          <EnhancedAnimal type="panda" bottom="15%" right="12%" scale={0.75} messageOverride="bamboo! 🐼" animationType="subtle-bounce" />
          <EnhancedAnimal type="fox" top="22%" left="12%" scale={0.7} rotate="-15deg" messageOverride="yip! 🦊" animationType="gentle-float" />
          <FlowerDecoration type="sakura" top="25%" left="5%" scale={0.9} />
          <FlowerDecoration type="rose" top="10%" right="22%" scale={0.7} />
          <FlowerDecoration type="sunflower" bottom="25%" left="12%" scale={0.8} />
        </>
      )}
      {isProfile && (
        <>
          <EnhancedAnimal type="dog" top="70%" left="8%" rotate="15deg" messageOverride="woof! 🐕" animationType="gentle-float" />
          <EnhancedAnimal type="bunny" bottom="20%" right="12%" scale={0.85} rotate="-10deg" messageOverride="hop hop! 🐰" animationType="subtle-bounce" />
          <EnhancedAnimal type="bird" top="18%" right="18%" rotate="5deg" scale={0.65} messageOverride="tweet! 🐦" animationType="gentle-float" />
          <EnhancedAnimal type="cat" top="35%" left="4%" rotate="95deg" messageOverride="guardian! 🐱" animationType="subtle-bounce" />
          <FlowerDecoration type="daisy" top="25%" left="10%" scale={0.75} />
          <FlowerDecoration type="lavender" bottom="30%" right="15%" scale={0.65} />
        </>
      )}
      {isSettings && (
        <>
          <EnhancedAnimal type="octopus" top="72%" left="6%" rotate="-10deg" messageOverride="ink blot! 🐙" animationType="subtle-bounce" />
          <EnhancedAnimal type="cat" bottom="15%" right="12%" scale={0.8} messageOverride="purr! 🐱" animationType="gentle-float" />
          <EnhancedAnimal type="fox" top="12%" right="25%" rotate="8deg" scale={0.65} messageOverride="sneaky! 🦊" animationType="subtle-bounce" />
          <EnhancedAnimal type="bunny" top="28%" left="5%" scale={0.75} rotate="-95deg" messageOverride="nose wiggle! 🐰" animationType="gentle-float" />
          <FlowerDecoration type="sunflower" top="30%" left="15%" scale={0.85} />
          <FlowerDecoration type="tulip" bottom="25%" right="20%" scale={0.7} />
        </>
      )}
      <EnhancedAnimal type="dog" bottom="5%" right="4%" scale={0.7} messageOverride="boop! 🐕" animationType="gentle-float" />
    </>
  );
}

// Export compatibility components
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
export const FlyingBirdTrigger = ({ children }) => {
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
    window.triggerFlyingBird = trigger;
    const interval = setInterval(() => {
      if (Math.random() > 0.7) trigger();
    }, 10000);
    return () => {
      delete window.triggerFlyingBird;
      clearInterval(interval);
    };
  }, []);

  return (
    <>
      <div onClick={trigger} className="cursor-pointer inline-block">
        {children}
      </div>
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
    </>
  );
};
