/**
 * trailPool — Ring-buffer cursor trail.
 * Fixed-size, zero allocation during rAF.
 */
const TRAIL_CAP = 55;

export function createTrailPool() {
  const buf   = Array.from({ length: TRAIL_CAP }, () => ({ x: 0, y: 0, spd: 0, hue: 270 }));
  let head    = 0;
  let count   = 0;

  function push(x, y, speed, hue) {
    buf[head].x   = x;
    buf[head].y   = y;
    buf[head].spd = speed;
    buf[head].hue = hue;
    head = (head + 1) % TRAIL_CAP;
    if (count < TRAIL_CAP) count++;
  }

  /** Draw trail. Oldest points are most transparent. */
  function draw(ctx) {
    if (count < 2) return;
    ctx.save();
    ctx.lineCap = 'round';
    const startIdx = count < TRAIL_CAP ? 0 : head;
    const pts = [];
    for (let i = 0; i < count; i++) {
      pts.push(buf[(startIdx + i) % TRAIL_CAP]);
    }
    for (let i = 1; i < pts.length; i++) {
      const frac = i / pts.length;
      const p    = pts[i];
      const alpha = frac * frac * 0.48;
      const width = 1.5 + frac * 3.5;
      ctx.strokeStyle = `hsla(${p.hue},100%,70%,${alpha})`;
      ctx.lineWidth   = width;
      ctx.beginPath();
      ctx.moveTo(pts[i - 1].x, pts[i - 1].y);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
    }
    ctx.restore();
  }

  function reset() { head = 0; count = 0; }

  return { push, draw, reset };
}
