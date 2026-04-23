/**
 * HoverBackButton — activates after 3 seconds of continuous hovering.
 * Shows a circular progress ring that fills clockwise, then triggers navigation.
 */
import { useRef, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const SIZE   = 72;   // larger button diameter px
const RADIUS = 28;   // larger progress ring
const CIRC   = 2 * Math.PI * RADIUS;
const HOLD_MS = 2500; // slightly faster activation

export default function HoverBackButton({ to = '/login', label = '← BACK', onFire, id = "sw-back-btn", styleOverrides = {}, icon = "←", tooltipPosition = "right", firedLabel = "NAVIGATING…" }) {
  const navigate         = useNavigate();
  const [progress, setProgress] = useState(0); 
  const [hovered, setHovered]  = useState(false);
  const [fired, setFired]      = useState(false);
  const startRef = useRef(null);
  const rafRef   = useRef(null);
  const btnRef   = useRef(null);

  const tick = useCallback(() => {
    const elapsed = Date.now() - startRef.current;
    const p = Math.min(elapsed / HOLD_MS, 1);
    setProgress(p);
    if (p < 1) {
      rafRef.current = requestAnimationFrame(tick);
    } else {
      setFired(true);
    }
  }, []);

  const handleEnter = useCallback(() => {
    if (fired) return;
    setHovered(true);
    startRef.current = Date.now();
    rafRef.current = requestAnimationFrame(tick);
  }, [fired, tick]);

  const handleLeave = useCallback(() => {
    setHovered(false);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setProgress(0);
  }, []);

  useEffect(() => {
    const el = btnRef.current;
    if (!el) return;
    el.addEventListener('sw-btn-enter', handleEnter);
    el.addEventListener('sw-btn-leave', handleLeave);
    return () => {
      el.removeEventListener('sw-btn-enter', handleEnter);
      el.removeEventListener('sw-btn-leave', handleLeave);
    };
  }, [handleEnter, handleLeave]);

  // Navigate or trigger callback when fully filled
  useEffect(() => {
    if (fired) {
      const t = setTimeout(() => {
        if (onFire) {
          onFire();
          setFired(false);
          setHovered(false);
          setProgress(0);
        } else {
          navigate(to);
        }
      }, 240); 
      return () => clearTimeout(t);
    }
  }, [fired, navigate, to, onFire]);

  const dashOffset = CIRC * (1 - progress);
  const ringColor  = fired ? '#00ffcc' : hovered ? '#00e5ff' : 'rgba(0,229,255,0.3)';
  const glowIntensity = progress * 18;

  return (
    <div
      id={id}
      data-sw-btn="true"
      ref={btnRef}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      title={`Hold to activate`}
      style={{
        position: 'fixed',
        zIndex: 9999,
        width: SIZE,
        height: SIZE,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        userSelect: 'none',
        background: hovered ? 'rgba(0,229,255,0.05)' : 'transparent',
        borderRadius: '50%',
        transition: 'background 0.3s',
        ...styleOverrides
      }}
    >
      {/* Progress ring SVG */}
      <svg
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        style={{
          position: 'absolute',
          top: 0, left: 0,
          transform: 'rotate(-90deg)',
        }}
      >
        {/* Track */}
        <circle
          cx={SIZE / 2} cy={SIZE / 2} r={RADIUS}
          fill="none"
          stroke="rgba(0,229,255,0.15)"
          strokeWidth="3"
        />
        {/* Fill */}
        <circle
          cx={SIZE / 2} cy={SIZE / 2} r={RADIUS}
          fill="none"
          stroke={ringColor}
          strokeWidth={fired ? 5 : 4}
          strokeDasharray={CIRC}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          style={{
            transition: fired ? 'stroke 0.2s' : 'none',
            filter: `drop-shadow(0 0 ${glowIntensity}px ${ringColor})`,
          }}
        />
      </svg>

      {/* Arrow icon */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          fontFamily: "'Orbitron', sans-serif",
          fontSize: 12,
          fontWeight: 700,
          color: hovered
            ? `rgba(0,229,255,${0.5 + progress * 0.5})`
            : 'rgba(0,229,255,0.25)',
          letterSpacing: '0.05em',
          transition: 'color 0.2s',
          textShadow: hovered
            ? `0 0 ${6 + progress * 12}px rgba(0,229,255,${0.4 + progress * 0.6})`
            : 'none',
          pointerEvents: 'none',
        }}
      >
        {icon}
      </div>

      {/* Tooltip label on hover */}
      {hovered && (
        <div
          style={{
            position: 'absolute',
            ...(tooltipPosition === 'left' ? { right: SIZE + 8 } : { left: SIZE + 8 }),
            top: '50%',
            transform: 'translateY(-50%)',
            fontFamily: "'Orbitron', sans-serif",
            fontSize: 8,
            letterSpacing: '0.18em',
            color: `rgba(0,229,255,${0.4 + progress * 0.6})`,
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            textShadow: `0 0 ${4 + progress * 10}px rgba(0,229,255,0.5)`,
          }}
        >
          {fired ? firedLabel : `${label} · ${Math.round((1 - progress) * 3)}s`}
        </div>
      )}
    </div>
  );
}
