// =============================================================================
// PixelAvatar.jsx — Core animated pixel avatar React component
//
// Props:
//   type      'dog' | 'cat' | 'bunny'       default 'dog'
//   state     'idle' | 'typing' | 'talking'  default 'idle'
//             'happy' | 'excited' | 'sleeping'
//   size      number (px, square)            default 32
//   speed     number (animation multiplier)  default 1
//   rounded   boolean | number               default true  (auto border-radius)
//   bg        string (css color)             default '#0d1018'
//   className string
//   style     React.CSSProperties
//
// Example:
//   <PixelAvatar type="bunny" state="happy" size={64} speed={1.2} />
// =============================================================================

import React, { useRef, useEffect, useCallback, memo } from 'react';
import { getFrame }    from './animation.js';
import { renderFrame } from './renderer.js';

const PixelAvatar = memo(function PixelAvatar({
  type      = 'dog',
  state     = 'idle',
  size      = 32,
  speed     = 1,
  rounded   = true,
  bg,
  className,
  style,
}) {
  const canvasRef = useRef(null);
  const rafRef    = useRef(null);
  const startRef  = useRef(performance.now());

  // ── Stable refs so the rAF loop never needs to restart ───────────────────
  const typeRef  = useRef(type);
  const stateRef = useRef(state);
  const speedRef = useRef(speed);
  useEffect(() => { typeRef.current  = type;  }, [type]);
  useEffect(() => { stateRef.current = state; }, [state]);
  useEffect(() => { speedRef.current = speed; }, [speed]);

  // ── Resize canvas when size changes ──────────────────────────────────────
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    cv.width  = size;
    cv.height = size;
  }, [size]);

  // ── Single persistent rAF loop ────────────────────────────────────────────
  const loop = useCallback(() => {
    const cv = canvasRef.current;
    if (cv) {
      const elapsed = (performance.now() - startRef.current) * speedRef.current;
      const { rows, overlays } = getFrame(typeRef.current, stateRef.current, elapsed);
      renderFrame(cv, rows, overlays);
    }
    rafRef.current = requestAnimationFrame(loop);
  }, []); // intentionally empty — all reads through stable refs

  useEffect(() => {
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [loop]);

  // ── Border radius logic ───────────────────────────────────────────────────
  let borderRadius = 0;
  if (rounded === true)  borderRadius = Math.round(size * 0.18); // 18% of size
  else if (typeof rounded === 'number') borderRadius = rounded;

  return (
    <div
      className={className}
      style={{ display: 'inline-flex', lineHeight: 0, flexShrink: 0, ...style }}
    >
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        style={{
          display:         'block',
          imageRendering:  'pixelated',
          borderRadius:    borderRadius ? `${borderRadius}px` : undefined,
          background:      bg ?? '#0d1018',
        }}
        aria-label={`${type} pixel avatar, state: ${state}`}
        role="img"
      />
    </div>
  );
});

export { PixelAvatar };
export default PixelAvatar;
