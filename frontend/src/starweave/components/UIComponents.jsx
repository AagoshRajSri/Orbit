/**
 * UIComponents v4 — StarWeave UI overlays. Wild redesign.
 *
 * Philosophy:
 *   - No basic Unicode glyphs — every "icon" is an animated SVG
 *   - Breathing room: only the essential floats over the canvas
 *   - Commit button is a cinematic warp gate, not a rectangle
 *   - Auth result = full-screen moment, not a modal card
 */

import { useEffect, useRef, useState } from 'react';

// ─── Design tokens ─────────────────────────────────────────────────────────────
const FONT_MONO = "'Space Mono', monospace";
const C = {
  purple:  '#b560ff',
  cyan:    '#00e5ff',
  red:     '#ff4466',
  green:   '#00ffaa',
  gold:    '#ffd700',
  muted:   'rgba(200,185,255,0.55)',
  dim:     'rgba(200,185,255,0.20)',
  glass:   'rgba(8,4,20,0.88)',
};

// ─── Animated SVG Icons ────────────────────────────────────────────────────────

/** Orbital ring — 3 ellipses rotating at different speeds */
function OrbitalRingIcon({ color = C.purple, size = 48, spin = true }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!spin) return;
    let frame, a = 0;
    const loop = () => {
      a += 0.012;
      if (ref.current) {
        const rings = ref.current.querySelectorAll('.orb-ring');
        rings[0].setAttribute('transform', `rotate(${a * 57.3} 24 24)`);
        rings[1].setAttribute('transform', `rotate(${-a * 57.3 * 0.7} 24 24)`);
        rings[2].setAttribute('transform', `rotate(${a * 57.3 * 1.4} 24 24)`);
      }
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [spin]);

  return (
    <svg ref={ref} width={size} height={size} viewBox="0 0 48 48" fill="none" style={{ display: 'block' }}>
      <ellipse className="orb-ring" cx="24" cy="24" rx="20" ry="8" stroke={color} strokeWidth="1" opacity="0.7" strokeDasharray="4 3"/>
      <ellipse className="orb-ring" cx="24" cy="24" rx="20" ry="8" stroke={color} strokeWidth="0.7" opacity="0.4"
        transform="rotate(60 24 24)" strokeDasharray="2 5"/>
      <ellipse className="orb-ring" cx="24" cy="24" rx="20" ry="8" stroke={C.cyan} strokeWidth="0.5" opacity="0.3"
        transform="rotate(120 24 24)" strokeDasharray="6 2"/>
      <circle cx="24" cy="24" r="3.5" fill={color} style={{ filter: `drop-shadow(0 0 6px ${color})` }}/>
      <circle cx="24" cy="24" r="1.5" fill="#fff" opacity="0.9"/>
    </svg>
  );
}

/** Eye of the machine — animated iris that pulses */
function MachineEyeIcon({ color = C.cyan, size = 80 }) {
  const irisRef = useRef(null);
  const pupilRef = useRef(null);
  useEffect(() => {
    let frame, t = 0;
    const loop = () => {
      t += 0.025;
      const scale = 0.88 + 0.12 * Math.sin(t);
      const pupilScale = 0.7 + 0.3 * Math.abs(Math.sin(t * 0.6));
      if (irisRef.current)  irisRef.current.setAttribute('r', String(10 * scale));
      if (pupilRef.current) pupilRef.current.setAttribute('r', String(5 * pupilScale));
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      {/* Outer eye shape */}
      <path d="M8 40 C20 18 60 18 72 40 C60 62 20 62 8 40Z" stroke={color} strokeWidth="1.2" fill="none" opacity="0.8"/>
      {/* Scan lines */}
      <path d="M8 40 C20 18 60 18 72 40" stroke={color} strokeWidth="0.4" opacity="0.3" strokeDasharray="3 4"/>
      {/* Iris */}
      <circle ref={irisRef} cx="40" cy="40" r="10" stroke={color} strokeWidth="1.5" fill="none" opacity="0.9"/>
      {/* Iris inner detail */}
      <circle cx="40" cy="40" r="13" stroke={color} strokeWidth="0.5" fill="none" opacity="0.25" strokeDasharray="2 3"/>
      {/* Pupil */}
      <circle ref={pupilRef} cx="40" cy="40" r="5" fill={color} opacity="0.9" style={{ filter: `drop-shadow(0 0 8px ${color})` }}/>
      {/* Corner crosshairs */}
      <line x1="8" y1="36" x2="8" y2="44" stroke={color} strokeWidth="1" opacity="0.5"/>
      <line x1="4" y1="40" x2="12" y2="40" stroke={color} strokeWidth="1" opacity="0.5"/>
      <line x1="72" y1="36" x2="72" y2="44" stroke={color} strokeWidth="1" opacity="0.5"/>
      <line x1="68" y1="40" x2="76" y2="40" stroke={color} strokeWidth="1" opacity="0.5"/>
    </svg>
  );
}

/** Warp gate — radial burst that pulses outward */
function WarpGateIcon({ color = C.purple, size = 60, active = false }) {
  const ref = useRef(null);
  useEffect(() => {
    let frame, t = 0;
    const loop = () => {
      t += active ? 0.06 : 0.02;
      if (ref.current) {
        const rings = ref.current.querySelectorAll('.warp-ring');
        rings.forEach((r, i) => {
          const s = 1 + 0.06 * Math.sin(t - i * 0.8);
          r.style.transform = `scale(${s})`;
          r.style.opacity = String(0.3 + 0.2 * Math.sin(t - i * 0.6));
        });
      }
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [active]);

  const rays = Array.from({ length: 8 }, (_, i) => i * 45);

  return (
    <svg ref={ref} width={size} height={size} viewBox="0 0 60 60" fill="none">
      <circle className="warp-ring" cx="30" cy="30" r="26" stroke={color} strokeWidth="0.8"
        fill="none" opacity="0.3" style={{ transformOrigin: '30px 30px' }}/>
      <circle className="warp-ring" cx="30" cy="30" r="20" stroke={color} strokeWidth="1"
        fill="none" opacity="0.4" style={{ transformOrigin: '30px 30px', animationDelay: '0.2s' }}/>
      <circle className="warp-ring" cx="30" cy="30" r="13" stroke={C.cyan} strokeWidth="1.2"
        fill="none" opacity="0.6" style={{ transformOrigin: '30px 30px' }}/>
      {/* Rays */}
      {rays.map(angle => {
        const rad = (angle * Math.PI) / 180;
        const x1 = 30 + 14 * Math.cos(rad);
        const y1 = 30 + 14 * Math.sin(rad);
        const x2 = 30 + 27 * Math.cos(rad);
        const y2 = 30 + 27 * Math.sin(rad);
        return <line key={angle} x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth="0.6" opacity="0.3"/>;
      })}
      {/* Core */}
      <circle cx="30" cy="30" r="4" fill={color} style={{ filter: `drop-shadow(0 0 8px ${color})` }}/>
      <circle cx="30" cy="30" r="1.5" fill="#fff"/>
    </svg>
  );
}

/** Helix strand — "DNA" biometric readout icon */
function HelixIcon({ size = 20, color = C.cyan }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <path d="M4 2 C4 2 10 7 16 2" stroke={color} strokeWidth="1" fill="none" opacity="0.8"/>
      <path d="M4 7 C4 7 10 12 16 7" stroke={color} strokeWidth="1" fill="none" opacity="0.6"/>
      <path d="M4 12 C4 12 10 17 16 12" stroke={color} strokeWidth="1" fill="none" opacity="0.4"/>
      <line x1="7" y1="2" x2="7" y2="12" stroke={color} strokeWidth="0.5" opacity="0.4"/>
      <line x1="13" y1="2" x2="13" y2="12" stroke={color} strokeWidth="0.5" opacity="0.4"/>
    </svg>
  );
}

/** Shield lock icon for success */
function ShieldIcon({ color = C.green, size = 64 }) {
  const ref = useRef(null);
  useEffect(() => {
    let frame, t = 0;
    const loop = () => {
      t += 0.02;
      if (ref.current) {
        const s = 0.94 + 0.06 * Math.sin(t);
        ref.current.style.transform = `scale(${s})`;
      }
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, []);
  return (
    <div ref={ref} style={{ display: 'inline-block', transformOrigin: 'center' }}>
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
        <path d="M32 4 L56 14 L56 32 C56 46 44 58 32 62 C20 58 8 46 8 32 L8 14 Z"
          stroke={color} strokeWidth="1.5" fill="none" opacity="0.9"
          style={{ filter: `drop-shadow(0 0 12px ${color})` }}/>
        <path d="M32 8 L52 17 L52 32 C52 44 41 55 32 58 C23 55 12 44 12 32 L12 17 Z"
          stroke={color} strokeWidth="0.7" fill="none" opacity="0.3"/>
        {/* Checkmark */}
        <path d="M22 32 L28 38 L42 24" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          style={{ filter: `drop-shadow(0 0 6px ${color})` }}/>
      </svg>
    </div>
  );
}

/** Broken skull / error icon */
function ErrorIcon({ size = 64 }) {
  const ref = useRef(null);
  const [shake, setShake] = useState(false);
  useEffect(() => {
    const iv = setInterval(() => {
      setShake(v => {
        if (!v) {
          setTimeout(() => setShake(false), 400);
          return true;
        }
        return false;
      });
    }, 2000);
    return () => clearInterval(iv);
  }, []);

  return (
    <div ref={ref}
      style={{
        display: 'inline-block',
        animation: shake ? 'sw-shake 0.4s ease' : 'none',
        transformOrigin: 'center',
      }}
    >
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
        {/* Outer broken ring */}
        <circle cx="32" cy="32" r="26" stroke={C.red} strokeWidth="1.2" fill="none" opacity="0.5"
          strokeDasharray="6 3"/>
        {/* X */}
        <line x1="20" y1="20" x2="44" y2="44" stroke={C.red} strokeWidth="2.5" strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 8px ${C.red})` }}/>
        <line x1="44" y1="20" x2="20" y2="44" stroke={C.red} strokeWidth="2.5" strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 8px ${C.red})` }}/>
        {/* Corner marks */}
        <line x1="8" y1="8" x2="14" y2="8" stroke={C.red} strokeWidth="1" opacity="0.5"/>
        <line x1="8" y1="8" x2="8" y2="14"  stroke={C.red} strokeWidth="1" opacity="0.5"/>
        <line x1="56" y1="8" x2="50" y2="8" stroke={C.red} strokeWidth="1" opacity="0.5"/>
        <line x1="56" y1="8" x2="56" y2="14" stroke={C.red} strokeWidth="1" opacity="0.5"/>
        <line x1="8" y1="56" x2="14" y2="56" stroke={C.red} strokeWidth="1" opacity="0.5"/>
        <line x1="8" y1="56" x2="8" y2="50"  stroke={C.red} strokeWidth="1" opacity="0.5"/>
        <line x1="56" y1="56" x2="50" y2="56" stroke={C.red} strokeWidth="1" opacity="0.5"/>
        <line x1="56" y1="56" x2="56" y2="50" stroke={C.red} strokeWidth="1" opacity="0.5"/>
      </svg>
      <style>{`
        @keyframes sw-shake {
          0%,100% { transform: translateX(0); }
          15%  { transform: translateX(-6px) rotate(-2deg); }
          30%  { transform: translateX(6px)  rotate(2deg); }
          45%  { transform: translateX(-4px); }
          60%  { transform: translateX(4px); }
          75%  { transform: translateX(-2px); }
        }
      `}</style>
    </div>
  );
}

// ─── Arc Progress indicator ────────────────────────────────────────────────────
function ArcProgress({ value, max, color = C.purple, size = 56 }) {
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const fraction = value / Math.max(max, 1);
  const dash = circumference * fraction;
  const gap  = circumference - dash;

  return (
    <svg width={size} height={size} viewBox="0 0 56 56" style={{ transform: 'rotate(-90deg)' }}>
      {/* Track */}
      <circle cx="28" cy="28" r={radius} stroke="rgba(255,255,255,0.06)" strokeWidth="3" fill="none"/>
      {/* Progress */}
      <circle cx="28" cy="28" r={radius} stroke={color} strokeWidth="3" fill="none"
        strokeDasharray={`${dash} ${gap}`}
        strokeLinecap="round"
        style={{
          transition: 'stroke-dasharray 0.4s cubic-bezier(0.34,1.56,0.64,1)',
          filter: `drop-shadow(0 0 5px ${color})`,
        }}
      />
    </svg>
  );
}

// ─── DNA strand biometric bar ─────────────────────────────────────────────────
function DNAStrand({ signals, isMouseMode }) {
  const nodes = [
    { key: 'liveness',        label: 'LIV', glyph: '◉' },
    { key: 'temporal',        label: 'TMP', glyph: '◷' },
    { key: 'depth',           label: 'DPT', glyph: '◈' },
    { key: 'patternVariation',label: 'VAR', glyph: '◌' },
  ];

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 5,
      padding: '12px 16px',
      background: 'rgba(0,0,0,0.35)',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(0,229,255,0.08)',
      borderRadius: 10,
    }}>
      <div style={{
        fontSize: 7, letterSpacing: '0.3em', color: 'rgba(0,229,255,0.3)',
        marginBottom: 3, display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <HelixIcon size={12} color="rgba(0,229,255,0.4)"/>
        BIOMETRIC
      </div>
      {nodes.map(n => {
        const ok = (isMouseMode && n.key === 'depth') ? true : (signals?.[n.key] ?? false);
        const col = ok ? C.cyan : 'rgba(255,255,255,0.12)';
        return (
          <div key={n.key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 10, color: col, transition: 'color 0.4s', width: 12 }}>{n.glyph}</span>
            <div style={{
              flex: 1, height: 2, borderRadius: 1,
              background: ok
                ? `linear-gradient(90deg, ${C.cyan}, rgba(0,229,255,0.2))`
                : 'rgba(255,255,255,0.06)',
              boxShadow: ok ? `0 0 6px ${C.cyan}60` : 'none',
              transition: 'all 0.5s ease',
            }}/>
            <span style={{ fontSize: 7, letterSpacing: '0.18em', color: col, opacity: 0.7, width: 24, textAlign: 'right' }}>
              {n.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── CameraPrompt ─────────────────────────────────────────────────────────────
export function CameraPrompt({ onGrant, onDeny }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { requestAnimationFrame(() => setVisible(true)); }, []);

  return (
    <div style={{
      position: 'fixed', inset: 0, display: 'flex', alignItems: 'center',
      justifyContent: 'center', zIndex: 40,
      background: 'radial-gradient(ellipse 80% 70% at 50% 40%, rgba(0,80,200,0.14) 0%, rgba(4,2,14,0.95) 70%)',
      backdropFilter: 'blur(20px)',
      opacity: visible ? 1 : 0,
      transition: 'opacity 0.5s ease',
    }}>
      {/* Animated corner brackets */}
      {[
        { top: 40, left: 40, bt: true, bl: true },
        { top: 40, right: 40, bt: true, br: true },
        { bottom: 40, left: 40, bb: true, bl: true },
        { bottom: 40, right: 40, bb: true, br: true },
      ].map((pos, i) => (
        <div key={i} style={{
          position: 'absolute',
          ...Object.fromEntries(Object.entries(pos).filter(([k]) => ['top','bottom','left','right'].includes(k))),
          width: 32, height: 32,
          borderTop:    pos.bt ? `1px solid ${C.cyan}40` : 'none',
          borderBottom: pos.bb ? `1px solid ${C.cyan}40` : 'none',
          borderLeft:   pos.bl ? `1px solid ${C.cyan}40` : 'none',
          borderRight:  pos.br ? `1px solid ${C.cyan}40` : 'none',
        }}/>
      ))}

      <div style={{
        width: '100%', maxWidth: 380,
        background: C.glass,
        border: '1px solid rgba(0,229,255,0.18)',
        borderRadius: 20,
        padding: '48px 44px 40px',
        textAlign: 'center',
        boxShadow: '0 0 80px rgba(0,229,255,0.08), 0 40px 80px rgba(0,0,0,0.6)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Top glow line */}
        <div style={{
          position: 'absolute', top: 0, left: '20%', right: '20%', height: 1,
          background: `linear-gradient(90deg, transparent, ${C.cyan}60, transparent)`,
        }}/>

        {/* Icon */}
        <div style={{ marginBottom: 28, display: 'flex', justifyContent: 'center' }}>
          <MachineEyeIcon color={C.cyan} size={80}/>
        </div>

        <div style={{
          fontFamily: FONT_MONO, fontSize: 9, letterSpacing: '0.42em',
          color: C.cyan, marginBottom: 6, opacity: 0.8,
        }}>
          STARWEAVE // BIOMETRIC AUTH
        </div>

        <h2 style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 22, fontWeight: 800,
          color: '#fff', margin: '0 0 16px',
          letterSpacing: '-0.02em',
        }}>
          Enable Hand Tracking?
        </h2>

        <p style={{
          fontFamily: FONT_MONO, fontSize: 11, color: C.muted,
          lineHeight: 1.8, marginBottom: 36, letterSpacing: '0.04em',
        }}>
          Your gesture data is processed locally.<br/>
          No video ever leaves your device.
        </p>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onGrant}
            onMouseEnter={e => e.currentTarget.style.boxShadow = `0 0 28px ${C.cyan}50`}
            onMouseLeave={e => e.currentTarget.style.boxShadow = `0 0 14px ${C.cyan}20`}
            style={{
              flex: 1, fontFamily: FONT_MONO, fontSize: 9, letterSpacing: '0.28em',
              padding: '13px 0', border: `1px solid ${C.cyan}50`, borderRadius: 10,
              background: `${C.cyan}18`, color: C.cyan, cursor: 'pointer',
              transition: 'box-shadow 0.25s',
              boxShadow: `0 0 14px ${C.cyan}20`,
            }}
          >
            ◎ ENABLE
          </button>
          <button
            onClick={onDeny}
            onMouseEnter={e => e.currentTarget.style.color = C.muted}
            onMouseLeave={e => e.currentTarget.style.color = C.dim}
            style={{
              flex: 1, fontFamily: FONT_MONO, fontSize: 9, letterSpacing: '0.28em',
              padding: '13px 0', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10,
              background: 'rgba(255,255,255,0.02)', color: C.dim, cursor: 'pointer',
              transition: 'color 0.25s',
            }}
          >
            ▷ CURSOR
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── StatusHUD ─────────────────────────────────────────────────────────────────
export function StatusHUD({ selectedStars, maxStars, isMouseMode, antiSpoof, phase, instructionKey = 'login' }) {
  const [active, setActive] = useState(false);
  useEffect(() => { const t = setTimeout(() => setActive(true), 400); return () => clearTimeout(t); }, []);

  const phaseMeta = {
    idle:         { label: 'READY',     color: C.muted },
    tracking:     { label: 'SCANNING',  color: C.cyan },
    weaving:      { label: 'WEAVING',   color: C.purple },
    verifying:    { label: 'VERIFYING', color: C.gold },
    authenticated:{ label: 'VERIFIED',  color: C.green },
    failed:       { label: 'REJECTED',  color: C.red },
    'camera-prompt': { label: 'STANDBY', color: C.dim },
  };
  const pm = phaseMeta[phase] || { label: phase?.toUpperCase(), color: C.muted };

  const instructions = {
    practice: ['PRACTICE MODE — CONNECT THE STARS', 'HOVER OVER A STAR TO SELECT IT', 'PRACTICE COMPLETE ✓'],
    create:   ['DRAW YOUR UNIQUE CONSTELLATION', 'HOVER OVER A STAR TO SELECT IT', 'PATTERN RECORDED —'],
    login:    ['WEAVE YOUR CONSTELLATION', 'HOVER OVER A STAR TO SELECT IT', 'VERIFYING SIGNATURE…'],
  };
  const ins = instructions[instructionKey] || instructions.login;
  const insText = selectedStars.length === 0 ? ins[0]
    : selectedStars.length < maxStars ? ins[1]
    : ins[2];

  const progress = selectedStars.length / maxStars;
  const anyActivity = selectedStars.length > 0 || (antiSpoof?.liveness);

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 30, fontFamily: FONT_MONO }}>

      {/* ── Top-right phase badge ─────────────────────────────────── */}
      <div style={{
        position: 'absolute', top: 24, right: 24,
        display: 'flex', alignItems: 'center', gap: 8,
        opacity: active ? 1 : 0, transition: 'opacity 0.6s ease',
      }}>
        {/* Pulsing dot */}
        <div style={{
          width: 5, height: 5, borderRadius: '50%',
          background: pm.color,
          boxShadow: `0 0 10px ${pm.color}`,
          animation: 'sw-hud-blink 1.8s infinite ease-in-out',
        }}/>
        <span style={{ fontSize: 9, letterSpacing: '0.32em', color: pm.color, opacity: 0.8 }}>
          {pm.label}
        </span>
      </div>

      {/* ── Top-left DNA biometric panel — appears after first interaction ── */}
      <div style={{
        position: 'absolute', top: 24, left: 24,
        opacity: active && anyActivity ? 1 : 0,
        transform: active && anyActivity ? 'translateX(0)' : 'translateX(-8px)',
        transition: 'opacity 0.5s ease, transform 0.5s ease',
      }}>
        <DNAStrand signals={antiSpoof} isMouseMode={isMouseMode}/>
      </div>

      {/* ── Bottom center — arc + instruction ────────────────────────── */}
      <div style={{
        position: 'absolute', bottom: 48, left: '50%',
        transform: 'translateX(-50%)',
        textAlign: 'center',
        opacity: active ? 1 : 0, transition: 'opacity 0.6s ease',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
      }}>
        {/* Arc progress ring with count inside */}
        <div style={{ position: 'relative', width: 56, height: 56 }}>
          <ArcProgress value={selectedStars.length} max={maxStars} color={C.purple} size={56}/>
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexDirection: 'column',
          }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#fff', lineHeight: 1 }}>
              {selectedStars.length}
            </span>
            <span style={{ fontSize: 7, color: C.dim, letterSpacing: '0.1em' }}>/{maxStars}</span>
          </div>
        </div>

        {/* Instruction */}
        <div style={{
          fontSize: 9, letterSpacing: '0.26em', color: C.muted,
          maxWidth: 240,
          padding: '6px 16px',
          borderRadius: 20,
          background: 'rgba(0,0,0,0.25)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.04)',
        }}>
          {insText}
        </div>

        {isMouseMode && (
          <div style={{ fontSize: 7, letterSpacing: '0.22em', color: 'rgba(150,140,200,0.3)' }}>
            CURSOR MODE
          </div>
        )}
      </div>

      <style>{`
        @keyframes sw-hud-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}

// ─── CommitButton ─────────────────────────────────────────────────────────────
// A standalone warp gate commit button — imported and rendered in StarWeaveAuth
export function CommitButton({ onClick }) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);

  return (
    <button
      onClick={() => { setPressed(true); setTimeout(() => { setPressed(false); onClick?.(); }, 180); }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'fixed', bottom: 40, left: '50%',
        background: 'none', border: 'none', cursor: 'pointer',
        zIndex: 100, pointerEvents: 'auto',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
        transition: 'transform 0.15s ease',
        transform: `translateX(-50%) scale(${pressed ? 0.93 : 1})`,
      }}
    >
      {/* The warp gate */}
      <div style={{
        position: 'relative',
        width: 72, height: 72,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {/* Outer glow ring */}
        <div style={{
          position: 'absolute', inset: -4,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${C.purple}30 0%, transparent 70%)`,
          opacity: hovered ? 1 : 0.4,
          transition: 'opacity 0.3s ease',
          animation: 'sw-commit-outer 3s infinite ease-in-out',
        }}/>
        <WarpGateIcon color={hovered ? C.cyan : C.purple} size={72} active={hovered}/>
      </div>

      {/* Label */}
      <div style={{
        fontFamily: FONT_MONO,
        fontSize: 8, letterSpacing: '0.38em',
        color: hovered ? C.cyan : C.purple,
        transition: 'color 0.3s ease',
        textShadow: hovered ? `0 0 12px ${C.cyan}` : `0 0 8px ${C.purple}`,
        padding: '5px 14px',
        border: `1px solid ${hovered ? C.cyan : C.purple}40`,
        borderRadius: 20,
        background: 'rgba(0,0,0,0.4)',
        backdropFilter: 'blur(8px)',
        whiteSpace: 'nowrap',
      }}>
        COMMIT CONSTELLATION
      </div>

      <style>{`
        @keyframes sw-commit-outer {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.08); }
        }
      `}</style>
    </button>
  );
}

// ─── AuthResult ────────────────────────────────────────────────────────────────
export function AuthResult({ result, behavioralScore = 0, onReset }) {
  const isSuccess = result === 'success';
  const [visible, setVisible] = useState(false);
  const scanRef = useRef(null);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  // Scan line animation for success
  useEffect(() => {
    if (!isSuccess || !scanRef.current) return;
    let frame, t = 0;
    const loop = () => {
      t += 0.008;
      const y = ((Math.sin(t) + 1) / 2) * 100;
      if (scanRef.current) scanRef.current.style.top = `${y}%`;
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [isSuccess]);

  const accentColor = isSuccess ? C.green : C.red;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      background: isSuccess
        ? 'radial-gradient(ellipse 60% 60% at 50% 50%, rgba(0,255,170,0.07) 0%, rgba(2,1,10,0.94) 70%)'
        : 'radial-gradient(ellipse 60% 60% at 50% 50%, rgba(255,40,80,0.07) 0%, rgba(2,1,10,0.96) 70%)',
      backdropFilter: 'blur(14px)',
      opacity: visible ? 1 : 0,
      transition: 'opacity 0.4s ease',
      overflow: 'hidden',
    }}>
      {/* Scan line — success only */}
      {isSuccess && (
        <div ref={scanRef} style={{
          position: 'absolute', left: 0, right: 0, height: 1,
          background: `linear-gradient(90deg, transparent, ${C.green}40, transparent)`,
          pointerEvents: 'none',
        }}/>
      )}

      {/* Corner brackets */}
      {[
        { top: 48, left: 48, bt: true, bl: true },
        { top: 48, right: 48, bt: true, br: true },
        { bottom: 48, left: 48, bb: true, bl: true },
        { bottom: 48, right: 48, bb: true, br: true },
      ].map((pos, i) => (
        <div key={i} style={{
          position: 'absolute',
          ...Object.fromEntries(Object.entries(pos).filter(([k]) => ['top','bottom','left','right'].includes(k))),
          width: 40, height: 40,
          borderTop:    pos.bt ? `1px solid ${accentColor}30` : 'none',
          borderBottom: pos.bb ? `1px solid ${accentColor}30` : 'none',
          borderLeft:   pos.bl ? `1px solid ${accentColor}30` : 'none',
          borderRight:  pos.br ? `1px solid ${accentColor}30` : 'none',
          transition: 'border-color 1s',
        }}/>
      ))}

      {/* Main content */}
      <div style={{ textAlign: 'center', position: 'relative' }}>
        {/* Icon */}
        <div style={{ marginBottom: 28 }}>
          {isSuccess
            ? <ShieldIcon color={C.green} size={72}/>
            : <ErrorIcon size={72}/>
          }
        </div>

        {/* Title */}
        <div style={{
          fontFamily: FONT_MONO, fontSize: 11, letterSpacing: '0.44em',
          color: accentColor, marginBottom: 10,
          textShadow: `0 0 20px ${accentColor}60`,
        }}>
          {isSuccess ? 'IDENTITY CONFIRMED' : 'ACCESS DENIED'}
        </div>

        {/* Subtitle */}
        <div style={{
          fontFamily: FONT_MONO, fontSize: 9, letterSpacing: '0.18em',
          color: isSuccess ? C.muted : 'rgba(255,100,130,0.55)',
          marginBottom: 32,
        }}>
          {isSuccess
            ? `Behavioral confidence: ${Math.min(100, Math.round(behavioralScore))}%`
            : 'Pattern not recognized — constellation mismatch'
          }
        </div>

        {/* Horizontal line */}
        <div style={{
          width: 120, height: 1, margin: '0 auto 28px',
          background: `linear-gradient(90deg, transparent, ${accentColor}50, transparent)`,
        }}/>

        {/* Reset button (failure only) */}
        {!isSuccess && (
          <button
            onClick={onReset}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,68,102,0.14)'; e.currentTarget.style.borderColor = 'rgba(255,68,102,0.4)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(255,68,102,0.2)'; }}
            style={{
              fontFamily: FONT_MONO, fontSize: 9, letterSpacing: '0.3em',
              padding: '12px 28px', borderRadius: 10, cursor: 'pointer',
              border: '1px solid rgba(255,68,102,0.2)',
              background: 'transparent', color: C.red,
              transition: 'all 0.25s',
            }}
          >
            ↩ WEAVE AGAIN
          </button>
        )}
      </div>
    </div>
  );
}

// ─── LoadingOverlay ────────────────────────────────────────────────────────────
export function LoadingOverlay({ message = 'LOADING…' }) {
  const ref = useRef(null);
  useEffect(() => {
    let frame, a = 0;
    const loop = () => {
      a += 0.04;
      if (ref.current) ref.current.style.transform = `rotate(${a}rad)`;
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div style={{
      position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', zIndex: 40,
      background: 'rgba(4,2,14,0.80)', backdropFilter: 'blur(10px)',
    }}>
      {/* Spinning orbital */}
      <div ref={ref} style={{ marginBottom: 20 }}>
        <OrbitalRingIcon color={C.cyan} size={48} spin={false}/>
      </div>
      <div style={{
        fontFamily: FONT_MONO, fontSize: 9, letterSpacing: '0.35em',
        color: C.muted,
      }}>
        {message}
      </div>
    </div>
  );
}
