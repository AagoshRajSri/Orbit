/**
 * particlePool — Zero-allocation particle system.
 * All particles are pre-allocated; none are created during rAF.
 */

const POOL_SIZE   = 600;
const PARTICLE_DRAG = 0.962;

function newParticle() {
  return { x: 0, y: 0, vx: 0, vy: 0, size: 0, hue: 0, alpha: 0, life: 0, decay: 0, active: false };
}

function initParticle(p, cx, cy, hue) {
  const angle = Math.random() * Math.PI * 2;
  const spd   = Math.random() * 5.5 + 1.8;
  p.x     = cx;
  p.y     = cy;
  p.vx    = Math.cos(angle) * spd;
  p.vy    = Math.sin(angle) * spd;
  p.size  = Math.random() * 4.0 + 1.2;
  p.hue   = hue + (Math.random() - 0.5) * 70;
  p.alpha = 1.0;
  p.life  = 1.0;
  p.decay = Math.random() * 0.022 + 0.014;
  p.active = true;
}

export function createParticlePool() {
  const pool   = Array.from({ length: POOL_SIZE }, newParticle);
  const active = [];

  function burst(cx, cy, count, hue) {
    for (let i = 0; i < count; i++) {
      const p = pool.pop() ?? newParticle();
      initParticle(p, cx, cy, hue);
      active.push(p);
    }
  }

  function tick(dt) {
    const cappedDt = Math.min(dt, 50);
    for (let i = active.length - 1; i >= 0; i--) {
      const p = active[i];
      p.x    += p.vx;
      p.y    += p.vy;
      p.vx   *= PARTICLE_DRAG;
      p.vy   *= PARTICLE_DRAG;
      p.vy   += 0.06;
      p.life -= p.decay + cappedDt * 0.0012;
      p.alpha = Math.max(0, p.life * p.life);
      if (p.life <= 0) {
        p.active = false;
        pool.push(active.splice(i, 1)[0]);
      }
    }
  }

  /** Draw all active particles onto ctx */
  function draw(ctx) {
    if (active.length === 0) return;
    for (const p of active) {
      ctx.globalAlpha = p.alpha;
      const col = `hsla(${p.hue},100%,65%,1)`;
      ctx.fillStyle   = col;
      ctx.shadowColor = col;
      ctx.shadowBlur  = 6;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * Math.max(0, p.life), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur  = 0;
    ctx.globalAlpha = 1;
  }

  function reset() { active.length = 0; }

  return { burst, tick, draw, reset };
}
