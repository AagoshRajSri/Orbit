import React from "react";

export const FlowerDecoration = ({ 
  type = "sakura", 
  top, left, right, bottom, 
  rotate = "0deg", 
  scale = 1,
  animationType = "gentle-float"
}) => {
  const flowers = {
    sakura: (
      <svg viewBox="0 0 100 100" className="w-full h-full" style={{ color: "#ffb7d5" }}>
        <circle cx="50" cy="50" r="6" fill="#fff" />
        {[0, 72, 144, 216, 288].map((deg, i) => (
          <ellipse
            key={i}
            cx={50 + 12 * Math.cos(deg * Math.PI / 180)}
            cy={50 + 12 * Math.sin(deg * Math.PI / 180)}
            rx={10}
            ry={6}
            fill="currentColor"
            transform={`rotate(${deg} 50 50)`}
            opacity={0.8}
          />
        ))}
      </svg>
    ),
    rose: (
      <svg viewBox="0 0 100 100" className="w-full h-full" style={{ color: "#ff69b4" }}>
        {[...Array(8)].map((_, i) => (
          <ellipse
            key={i}
            cx={50 + 10 * Math.cos(i * 45 * Math.PI / 180)}
            cy={50 + 10 * Math.sin(i * 45 * Math.PI / 180)}
            rx={8}
            ry={12}
            fill="currentColor"
            transform={`rotate(${i * 45} 50 50)`}
            opacity={0.7}
          />
        ))}
        <circle cx="50" cy="50" r="5" fill="#8b0000" />
      </svg>
    ),
    sunflower: (
      <svg viewBox="0 0 100 100" className="w-full h-full" style={{ color: "#ffd700" }}>
        <circle cx="50" cy="50" r="10" fill="#8b4513" />
        {[...Array(12)].map((_, i) => (
          <ellipse
            key={i}
            cx={50 + 15 * Math.cos(i * 30 * Math.PI / 180)}
            cy={50 + 15 * Math.sin(i * 30 * Math.PI / 180)}
            rx={6}
            ry={12}
            fill="currentColor"
            transform={`rotate(${i * 30} 50 50)`}
          />
        ))}
      </svg>
    ),
    tulip: (
      <svg viewBox="0 0 100 100" className="w-full h-full" style={{ color: "#ff6b9d" }}>
        <path d="M50,75 Q47,60 50,45 Q53,60 50,75" fill="#228b22" />
        <ellipse cx="50" cy="40" rx="12" ry="18" fill="currentColor" />
        <ellipse cx="50" cy="35" rx="6" ry="10" fill="#ff1493" opacity={0.7} />
      </svg>
    ),
    daisy: (
      <svg viewBox="0 0 100 100" className="w-full h-full" style={{ color: "#ffffff" }}>
        <circle cx="50" cy="50" r="6" fill="#ffd700" />
        {[...Array(8)].map((_, i) => (
          <ellipse
            key={i}
            cx={50 + 12 * Math.cos(i * 45 * Math.PI / 180)}
            cy={50 + 12 * Math.sin(i * 45 * Math.PI / 180)}
            rx={5}
            ry={10}
            fill="currentColor"
            transform={`rotate(${i * 45} 50 50)`}
          />
        ))}
      </svg>
    ),
    lavender: (
      <svg viewBox="0 0 100 100" className="w-full h-full" style={{ color: "#9370db" }}>
        <path d="M50,75 Q48,60 50,45 Q52,60 50,75" fill="#228b22" />
        {[...Array(6)].map((_, i) => (
          <ellipse
            key={i}
            cx={50 + 6 * Math.cos((i * 60 + 30) * Math.PI / 180)}
            cy={40 + 6 * Math.sin((i * 60 + 30) * Math.PI / 180)}
            rx={3}
            ry={6}
            fill="currentColor"
            opacity={0.8}
          />
        ))}
      </svg>
    )
  };

  return (
    <div 
      className="flower-decoration"
      style={{
        position: "fixed",
        top, left, right, bottom,
        width: 30, height: 30,
        zIndex: 0,
        opacity: 0.6,
        transform: `rotate(${rotate}) scale(${scale})`,
        transformOrigin: "center",
        pointerEvents: "none",
      }}
    >
      <div className={animationType}>
        {flowers[type] || flowers.sakura}
      </div>
    </div>
  );
};
