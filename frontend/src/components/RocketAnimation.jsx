import { useEffect, useRef, useState, memo } from "react";

const NAVBAR_HEIGHT = 44;
const METEOR_COUNT = 12;

function randomBetween(a, b) {
  return a + Math.random() * (b - a);
}

function createMeteor(id, containerWidth) {
  const size = randomBetween(2, 7);
  return {
    id,
    x: containerWidth + randomBetween(0, containerWidth),
    y: randomBetween(6, NAVBAR_HEIGHT - 6),
    w: size * randomBetween(1.4, 2.6),
    h: size * randomBetween(0.5, 1),
    speed: randomBetween(180, 380),
    opacity: randomBetween(0.55, 1),
    angle: randomBetween(-12, -4),
    color: Math.random() > 0.35 ? "#4a4845" : Math.random() > 0.5 ? "#b5830a" : "#6b6762",
    depth: randomBetween(0.5, 1),
  };
}

const Rocket = memo(({ x, y, tilt }) => {
  return (
    <g
      transform={`translate(${x}, ${y}) scale(0.5) rotate(${tilt})`}
      style={{ willChange: "transform" }}
    >
      {/* Glow halo */}
      <ellipse cx="24" cy="0" rx="38" ry="13" fill="#60a5fa" opacity="0.06" />

      {/* Outer flame */}
      <g transform="scale(1,1)" style={{ transformOrigin: "0px 0px" }}>
        <ellipse cx="-14" cy="0" rx="20" ry="5" fill="url(#flameOuter)" opacity="0.92" />
        <ellipse cx="-10" cy="0" rx="13" ry="3.2" fill="#fde68a" opacity="0.75" />
      </g>
      {/* Inner flame */}
      <ellipse cx="-7" cy="0" rx="11" ry="3" fill="url(#flameInner)" opacity="0.97" />
      <ellipse cx="-4" cy="0" rx="5.5" ry="1.8" fill="#e0f2fe" opacity="0.95" />

      {/* Body */}
      <rect x="0" y="-9" width="46" height="18" rx="3.5" fill="url(#rocketBody)" stroke="#a5b8d8" strokeWidth="0.5" />

      {/* Nose cone */}
      <path d="M46,-9 Q64,0 46,9 Z" fill="#dde5f7" stroke="#a5b8d8" strokeWidth="0.5" />

      {/* Cockpit */}
      <ellipse cx="36" cy="0" rx="7" ry="6" fill="url(#cockpit)" stroke="#7dd4fc" strokeWidth="0.8" />
      <ellipse cx="34.2" cy="-2.5" rx="2.2" ry="1.5" fill="#e0f9ff" opacity="0.65" />

      {/* Red accent */}
      <rect x="6" y="-9" width="5.5" height="18" rx="1.5" fill="#ef4444" opacity="0.88" stroke="#b91c1c" strokeWidth="0.3" />
      {/* Blue accent */}
      <rect x="15" y="-9" width="2.8" height="18" rx="1" fill="#3b82f6" opacity="0.78" stroke="#1d4ed8" strokeWidth="0.3" />

      {/* Top fin */}
      <path d="M8,-9 L17,-21 L27,-9 Z" fill="#dde5f7" stroke="#a5b8d8" strokeWidth="0.5" />
      <path d="M10,-9 L17,-17 L23,-9 Z" fill="#ef4444" opacity="0.62" />

      {/* Bottom fin */}
      <path d="M8,9 L17,21 L27,9 Z" fill="#dde5f7" stroke="#a5b8d8" strokeWidth="0.5" />
      <path d="M10,9 L17,17 L23,9 Z" fill="#ef4444" opacity="0.62" />

      {/* Nozzle */}
      <rect x="0" y="-5.5" width="8" height="11" rx="2.5" fill="#94a3b8" stroke="#64748b" strokeWidth="0.5" />
      <rect x="1.5" y="-4" width="5" height="8" rx="2" fill="#475569" />

      {/* Panel lines */}
      <line x1="26" y1="-8.5" x2="26" y2="8.5" stroke="#94a3b8" strokeWidth="0.4" opacity="0.55" />
      <line x1="44" y1="-7" x2="44" y2="7" stroke="#94a3b8" strokeWidth="0.4" opacity="0.45" />
    </g>
  );
});

const Meteor = memo(({ x, y, w, h, angle, color, opacity, depth }) => {
  const blur = depth < 0.7 ? `blur(${(1 - depth) * 1.2}px)` : "none";
  return (
    <g
      transform={`translate(${x}, ${y}) rotate(${angle})`}
      opacity={opacity}
      style={{ filter: blur, willChange: "transform" }}
    >
      <ellipse cx="0" cy="0" rx={w / 2} ry={h / 2} fill={color} />
      <ellipse cx={-w * 0.28} cy="0" rx={w * 0.22} ry={h * 0.38} fill={color === "#4a4845" ? "#6b6762" : "#e4a820"} opacity={0.55} />
    </g>
  );
});

const GlowTrail = memo(({ x, y }) => {
  return (
    <g transform={`translate(${x - 28}, ${y}) scale(0.5)`} style={{ willChange: "transform" }}>
      <defs>
        <linearGradient id="trailG" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#60a5fa" stopOpacity="0" />
          <stop offset="100%" stopColor="#60a5fa" stopOpacity="0.55" />
        </linearGradient>
      </defs>
      <rect x="0" y="-1" width="52" height="2" rx="1" fill="url(#trailG)" />
      <rect x="10" y="-0.4" width="42" height="0.8" rx="0.5" fill="#93c5fd" opacity="0.35" />
    </g>
  );
});

const RocketAnimation = memo(() => {
  const rafRef = useRef(null);
  const lastTimeRef = useRef(null);
  const meteorsRef = useRef([]);
  const containerRef = useRef(null);
  const [width, setWidth] = useState(680);

  const rocketRef = useRef({ x: -80, y: NAVBAR_HEIGHT / 2, tilt: 0, phase: 0, opacity: 0 });
  const [rocketState, setRocketState] = useState({ x: -80, y: NAVBAR_HEIGHT / 2, tilt: 0, opacity: 0 });
  const [meteorStates, setMeteorStates] = useState([]);
  const [trailState, setTrailState] = useState({ x: -80, y: NAVBAR_HEIGHT / 2 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver(entries => {
      const w = entries[0].contentRect.width;
      setWidth(w);
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    meteorsRef.current = Array.from({ length: METEOR_COUNT }, (_, i) => createMeteor(i, width));
    setMeteorStates(meteorsRef.current.map(m => ({ ...m })));
  }, [width]);

  useEffect(() => {
    const ROCKET_DURATION = 20000;
    const LOOP_INTERVAL = 120000;
    let elapsed = 0;

    const waypoints = [
      [0, -0.12, 0],
      [0.12, 0.08, -0.04],
      [0.30, 0.26, 0.02],
      [0.50, 0.46, -0.02],
      [0.68, 0.64, 0.03],
      [0.84, 0.80, -0.01],
      [1.0, 1.10, 0],
    ];

    function getRocketPos(t) {
      let i = 0;
      for (let j = 0; j < waypoints.length - 1; j++) {
        if (t >= waypoints[j][0] && t <= waypoints[j + 1][0]) { i = j; break; }
      }
      const [t0, x0, y0] = waypoints[i];
      const [t1, x1, y1] = waypoints[Math.min(i + 1, waypoints.length - 1)];
      const f = t1 === t0 ? 1 : (t - t0) / (t1 - t0);
      const ef = f < 0.5 ? 2 * f * f : 1 - Math.pow(-2 * f + 2, 2) / 2;
      return {
        x: (x0 + (x1 - x0) * ef) * width,
        y: NAVBAR_HEIGHT / 2 + (y0 + (y1 - y0) * ef) * (NAVBAR_HEIGHT * 0.28),
      };
    }

    function tick(now) {
      if (!lastTimeRef.current) lastTimeRef.current = now;
      const dt = Math.min((now - lastTimeRef.current) / 1000, 0.05);
      lastTimeRef.current = now;

      elapsed += dt * 1000;
      const cycleTime = elapsed % LOOP_INTERVAL;
      const isFlying = cycleTime < ROCKET_DURATION;
      const t = isFlying ? cycleTime / ROCKET_DURATION : 1;

      // Rocket position
      const pos = getRocketPos(t);
      const posNext = getRocketPos(Math.min(t + 0.005, 1));
      const dy = posNext.y - pos.y;
      const tilt = Math.max(-12, Math.min(12, dy * 3));

      // Opacity: fade in/out during flight, hide otherwise
      let op = 0;
      if (isFlying) {
        op = 1;
        if (t < 0.05) op = t / 0.05;
        else if (t > 0.92) op = (1 - t) / 0.08;
      }

      rocketRef.current = { x: pos.x, y: pos.y, tilt, opacity: op };
      setRocketState({ x: pos.x, y: pos.y, tilt, opacity: op });
      setTrailState({ x: pos.x, y: pos.y });

      const updated = meteorsRef.current.map(m => {
        let nx = m.x - m.speed * dt;
        if (nx < -40) {
          nx = width + randomBetween(20, width * 0.6);
          m.y = randomBetween(6, NAVBAR_HEIGHT - 6);
          m.speed = randomBetween(180, 380);
          m.opacity = randomBetween(0.55, 1);
        }
        m.x = nx;
        return { ...m };
      });
      meteorsRef.current = updated.map(m => ({ ...m }));
      setMeteorStates(updated);

      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafRef.current);
      lastTimeRef.current = null;
    };
  }, [width]);

  return (
    <div
      ref={containerRef}
      style={{
        flex: 1,
        height: NAVBAR_HEIGHT,
        overflow: "hidden",
        background: "transparent",
        position: "relative",
        minWidth: 0,
      }}
    >
      <svg
        width="100%"
        height={NAVBAR_HEIGHT}
        viewBox={`0 0 ${width} ${NAVBAR_HEIGHT}`}
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: "block" }}
      >
        <defs>
          <linearGradient id="rocketBody" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#f0f4ff" />
            <stop offset="60%" stopColor="#dde5f7" />
            <stop offset="100%" stopColor="#b8c8ee" />
          </linearGradient>
          <linearGradient id="cockpit" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#7dd4fc" />
            <stop offset="100%" stopColor="#0ea5e9" />
          </linearGradient>
          <linearGradient id="flameOuter" x1="100%" y1="0%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#fb923c" stopOpacity="0" />
            <stop offset="40%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#fde68a" />
          </linearGradient>
          <linearGradient id="flameInner" x1="100%" y1="0%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#60a5fa" stopOpacity="0" />
            <stop offset="50%" stopColor="#93c5fd" />
            <stop offset="100%" stopColor="#e0f2fe" />
          </linearGradient>
        </defs>

        {/* Stars */}
        {[
          [0.12, 0.25], [0.29, 0.72], [0.50, 0.30], [0.72, 0.78],
          [0.85, 0.38], [0.22, 0.55], [0.60, 0.62], [0.94, 0.28],
        ].map(([fx, fy], i) => (
          <circle
            key={i}
            cx={fx * width}
            cy={fy * NAVBAR_HEIGHT}
            r={0.6 + (i % 3) * 0.2}
            fill="#94a3b8"
            opacity={0.25 + (i % 4) * 0.05}
          />
        ))}

        {/* Meteors */}
        {meteorStates.map(m => (
          <Meteor key={m.id} {...m} />
        ))}

        {/* Trail */}
        <g opacity={rocketState.opacity}>
          <GlowTrail x={trailState.x} y={trailState.y} />
        </g>

        {/* Rocket */}
        <g opacity={rocketState.opacity}>
          <Rocket x={rocketState.x} y={rocketState.y} tilt={rocketState.tilt} />
        </g>
      </svg>
    </div>
  );
});

export default RocketAnimation;
