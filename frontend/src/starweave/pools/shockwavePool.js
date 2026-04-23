/**
 * shockwavePool — Expanding ring effects on star selection.
 * Pool of 20. Zero allocation during rAF.
 */

const POOL_SIZE = 20;

function newWave() {
  return { x: 0, y: 0, r: 0, life: 0, hue: 270, active: false };
}

function initWave(w, x, y, hue) {
  w.x      = x;
  w.y      = y;
  w.r      = 0;
  w.life   = 1.0;
  w.hue    = hue;
  w.active = true;
}

export function createShockwavePool() {
  const pool   = Array.from({ length: POOL_SIZE }, newWave);
  const active = [];

  function emit(x, y, hue = 270) {
    const w = pool.pop() ?? newWave();
    initWave(w, x, y, hue);
    active.push(w);
  }

  function tick() {
    for (let i = active.length - 1; i >= 0; i--) {
      const w = active[i];
      w.r    += 90 / 28;          // expand to 90px over 28 frames
      w.life -= 1 / 28;
      if (w.life <= 0) {
        w.active = false;
        pool.push(active.splice(i, 1)[0]);
      }
    }
  }

  function draw(ctx) {
    for (const w of active) {
      ctx.save();
      ctx.strokeStyle = `hsla(${w.hue},100%,70%,${w.life * 0.55})`;
      ctx.lineWidth   = 2.5 * w.life;
      ctx.shadowColor = `hsla(${w.hue},100%,70%,1)`;
      ctx.shadowBlur  = 14 * w.life;
      ctx.beginPath();
      ctx.arc(w.x, w.y, w.r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  function reset() { active.length = 0; }

  return { emit, tick, draw, reset };
}
