// =============================================================================
// renderer.js — Draws one frame onto a <canvas> element
//
// Uses ctx.fillRect (not ImageData) for correct sub-pixel scaling at any size.
// Grid: 16 × 16 logical pixels → scaled to fill canvas.width × canvas.height.
// =============================================================================

import { PAL } from './sprites.js';

const ROWS = 16;
const COLS = 16;
const BG   = '#0d1018';

/**
 * Paint one animation frame onto the canvas.
 *
 * @param {HTMLCanvasElement} canvas
 * @param {string[]} rows      16-element array of 16-char palette strings
 * @param {object[]} overlays  Particle descriptors from animation.getFrame()
 */
export function renderFrame(canvas, rows, overlays = []) {
  const ctx = canvas.getContext('2d');
  const W   = canvas.width;
  const H   = canvas.height;
  const cw  = W / COLS;   // cell width  (may be fractional)
  const ch  = H / ROWS;   // cell height (may be fractional)

  // Background
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);

  // Bitmap rows
  const rowCount = Math.min(rows.length, ROWS);
  for (let r = 0; r < rowCount; r++) {
    const row = rows[r];
    const colCount = Math.min(row.length, COLS);
    for (let c = 0; c < colCount; c++) {
      const color = PAL[row[c]];
      if (!color) continue;
      ctx.fillStyle = color;
      // Round to avoid hairline gaps between cells
      const x = Math.round(c * cw);
      const y = Math.round(r * ch);
      const w = Math.round((c + 1) * cw) - x;
      const h = Math.round((r + 1) * ch) - y;
      ctx.fillRect(x, y, w, h);
    }
  }

  // Particle overlays
  for (const ov of overlays) {
    const alpha = Math.max(0, Math.min(1, ov.alpha));
    if (alpha < 0.01) continue;
    ctx.globalAlpha = alpha;
    const sc = ov.size ?? 1;
    _drawOverlay(ctx, ov.type, ov.x * cw, ov.y * ch, cw * sc);
  }
  ctx.globalAlpha = 1;
}

// ── Overlay shape helpers ─────────────────────────────────────────────────────

function _fill(ctx, color, x, y, u, cells) {
  ctx.fillStyle = color;
  for (const [dx, dy] of cells) {
    ctx.fillRect(x + dx * u, y + dy * u, u, u);
  }
}

function _drawOverlay(ctx, type, x, y, u) {
  switch (type) {
    case 'heart':
      _fill(ctx, PAL['H'], x, y, u, [
        [1,0],[2,0],
        [0,1],[1,1],[2,1],[3,1],
              [1,2],[2,2],
              [1,3],
      ]);
      break;

    case 'star':
      _fill(ctx, PAL['S'], x, y, u, [
             [1,0],
       [0,1],[1,1],[2,1],
             [1,2],
      ]);
      break;

    case 'zzz':
      _fill(ctx, PAL['Z'], x, y, u, [
       [0,0],[1,0],[2,0],
                   [2,1],
             [1,1],
       [0,2],[1,2],[2,2],
      ]);
      break;
  }
}
