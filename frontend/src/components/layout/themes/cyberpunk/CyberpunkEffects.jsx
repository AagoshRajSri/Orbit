import { memo, useEffect, useRef } from "react";

const C = "#00fff5";   // neon cyan
const P = "#b026ff";   // neon purple

export const OrbitRain = memo(() => {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext("2d");
    c.width = c.offsetWidth; c.height = c.offsetHeight;
    const cols = Math.floor(c.width / 16);
    const drops = Array(cols).fill(1);
    const chars = "10ORBITНЕХУС//SYS//10101XYZ!@#$%^&*";
    const iv = setInterval(() => {
      ctx.fillStyle = "rgba(9,0,20,0.06)";
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.font = "13px 'Share Tech Mono'";
      drops.forEach((y, i) => {
        const ch = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillStyle = Math.random() > 0.97 ? P : `rgba(0,255,245,0.35)`;
        ctx.fillText(ch, i * 16, y * 16);
        if (y * 16 > c.height && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      });
    }, 50);
    return () => clearInterval(iv);
  }, []);
  return <canvas ref={ref} className="cyberpunk-orbit-rain" />;
});

export const DataStreams = memo(({ count = 5, color = P }) => {
  return (
    <div className="cyberpunk-data-streams">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{
          left: `${(i / count) * 100}%`,
          background: `linear-gradient(180deg, transparent, ${color}, transparent)`,
          animationDuration: `${2 + i * 0.4}s`,
          animationDelay: `${i * 0.6}s`,
        }} className="stream-line" />
      ))}
    </div>
  );
});

export const CyberpunkBackground = memo(() => (
    <div className="cyberpunk-background-root">
      <div className="ncb-nebula-bg" />
      <div className="ncb-stars-overlay" />
      <div className="ncb-scanlines-overlay" />
      <OrbitRain />
      <DataStreams count={6} />
    </div>
));
