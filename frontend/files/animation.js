// =============================================================================
// animation.js — Maps (animal, state, elapsed_ms) → { rows, overlays }
//
// rows:     string[16] — bitmap rows passed to renderFrame()
// overlays: Overlay[]  — particle effects painted on top
//   Overlay = { type: 'heart'|'star'|'zzz', x: number, y: number,
//               alpha: number (0-1), size?: number }
// =============================================================================

import { FRAME_SETS } from './sprites.js';

const BLANK = '................';

// Clamp a value to [0, 1]
const clamp01 = (v) => Math.max(0, Math.min(1, v));

/** Shift the 16-row bitmap up (-1) or down (+1) by one pixel row */
function shiftRows(rows, dir) {
  if (dir === 0) return rows;
  if (dir > 0)  return [BLANK, ...rows.slice(0, 15)];  // shift down (breathe)
  return [...rows.slice(1), BLANK];                     // shift up   (jump)
}

/**
 * Compute which frame to display and any particle overlays.
 *
 * @param {'dog'|'cat'|'bunny'} animal
 * @param {'idle'|'typing'|'talking'|'happy'|'excited'|'sleeping'} state
 * @param {number} t  Elapsed ms (speed-adjusted by caller)
 * @returns {{ rows: string[], overlays: object[] }}
 */
export function getFrame(animal, state, t) {
  const F        = FRAME_SETS[animal] ?? FRAME_SETS.dog;
  const overlays = [];

  // ── Shared time signals ─────────────────────────────────────────────────
  const breathe     = Math.sin(t * 0.0020);            // 0.32 Hz — slow breath
  const bob         = Math.sin(t * 0.0140);            // ~2.2 Hz — typing bob
  const bounce      = Math.abs(Math.sin(t * 0.0090));  // 1.4 Hz — happy bounce
  const jump        = Math.abs(Math.sin(t * 0.0200));  // 3.2 Hz — excited jump
  const blinkOn     = (t % 3200) < 140;                // blink every 3.2 s
  const mouthOpen   = Math.floor(t / 230) % 2 === 0;  // 4.3 Hz talk cycle
  const heartPulse  = clamp01(0.35 + 0.65 * Math.abs(Math.sin(t * 0.003)));
  const starA       = clamp01(0.35 + 0.65 * Math.abs(Math.sin(t * 0.0050)));
  const starB       = clamp01(0.35 + 0.65 * Math.abs(Math.sin(t * 0.0050 + 1.6)));
  const zPhase      = (t * 0.001) % 5.5;              // zzz drift period

  let rows;
  let yShift = 0;

  switch (state) {

    // ── IDLE ──────────────────────────────────────────────────────────────
    case 'idle':
      rows   = blinkOn ? F.blink : F.idle0;
      yShift = breathe > 0.72 ? 1 : 0;
      break;

    // ── TYPING ────────────────────────────────────────────────────────────
    case 'typing':
      // Alternate between normal and leaned-forward feel via faster bob
      rows   = (Math.floor(t / 180) % 4 === 0) ? F.blink : F.idle0;
      yShift = bob > 0.55 ? 1 : 0;
      break;

    // ── TALKING ───────────────────────────────────────────────────────────
    case 'talking':
      rows   = mouthOpen ? F.mouth : F.idle0;
      yShift = Math.sin(t * 0.0055) > 0.55 ? 1 : 0;
      break;

    // ── HAPPY ─────────────────────────────────────────────────────────────
    case 'happy':
      rows   = F.happyBlink ?? F.blink;
      yShift = bounce > 0.72 ? -1 : 0;
      overlays.push({ type: 'heart', x: 11, y: 0, alpha: heartPulse });
      overlays.push({ type: 'heart', x: 1,  y: 2, alpha: heartPulse * 0.5 });
      break;

    // ── EXCITED ───────────────────────────────────────────────────────────
    case 'excited':
      rows   = (Math.floor(t / 160) % 3 === 0) ? F.mouth : F.happyBlink ?? F.mouth;
      yShift = jump > 0.70 ? -1 : 0;
      overlays.push({ type: 'star', x: 11, y: 0, alpha: starA });
      overlays.push({ type: 'star', x: 1,  y: 1, alpha: starB });
      overlays.push({ type: 'star', x: 12, y: 3, alpha: starA * 0.6 });
      break;

    // ── SLEEPING ──────────────────────────────────────────────────────────
    case 'sleeping':
      rows = F.sleep;
      // First Z rises and fades  (phase 0 → 1.8)
      if (zPhase > 0.1 && zPhase < 1.9)
        overlays.push({
          type: 'zzz', x: 10, y: 1, size: 0.50,
          alpha: clamp01(Math.sin((zPhase / 1.9) * Math.PI)),
        });
      // Second Z (slightly larger, offset) (phase 2.1 → 4.2)
      if (zPhase > 2.1 && zPhase < 4.3)
        overlays.push({
          type: 'zzz', x: 11, y: 0, size: 0.70,
          alpha: clamp01(Math.sin(((zPhase - 2.1) / 2.2) * Math.PI)),
        });
      break;

    default:
      rows = F.idle0;
  }

  return { rows: shiftRows(rows, yShift), overlays };
}
