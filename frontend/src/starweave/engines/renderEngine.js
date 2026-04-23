/**
 * renderEngine v5 — Premium StarWeave Visuals
 *
 * Design philosophy:
 *   Cursor  = controlled energy (glowing orb, breathing, inertia, never jitters)
 *   Nodes   = responsive objects in space (float gently, react to proximity, compress on touch)
 *   Lines   = living connections (gradient filament, calm neon wire, subtle energy drift)
 *   Motion  = meaning, not decoration (everything purposeful)
 *
 * Layer architecture:
 *   Layer 1 (nebula):  Static deep-space background — repainted on resize only
 *   Layer 2 (field):   Parallax starfield (3 depth layers) + rare shooting stars
 *   Layer 3 (main):    Emoji nodes + gradient filament connections + verify spinner
 *   Layer 4 (fx):      Cursor orb + trail + particles + shockwaves
 */

import { getGlyphDraw, getGlyphHue } from './glyphEngine.js';

const NODE_BASE_R = 24;   // Smaller refined nodes
const FAR_N       = 220;
const MID_N       = 80;
const NEAR_N      = 30;
const SHOOT_MAX   = 2;

// ─── Background star factory ───────────────────────────────────────────────────
function mkBgStar(W, H, layer) {
  const cfg = [
    { rMin: 0.15, rMax: 0.7,  alphaMin: 0.12, alphaMax: 0.28, twinkleSpd: 0.35 },
    { rMin: 0.40, rMax: 1.1,  alphaMin: 0.28, alphaMax: 0.48, twinkleSpd: 0.65 },
    { rMin: 0.80, rMax: 1.6,  alphaMin: 0.50, alphaMax: 0.75, twinkleSpd: 0.95 },
  ][layer];
  return {
    x:         Math.random() * W,
    y:         Math.random() * H,
    r:         cfg.rMin + Math.random() * (cfg.rMax - cfg.rMin),
    phase:     Math.random() * Math.PI * 2,
    twSpd:     cfg.twinkleSpd * (0.6 + Math.random() * 0.8),
    aMin:      cfg.alphaMin,
    aMax:      cfg.alphaMax,
    scrollSpd: [0.002, 0.006, 0.012][layer],
  };
}

function mkShootingStar(W, H) {
  const angle  = Math.PI / 6 + Math.random() * (Math.PI / 5);
  const spd    = W * 0.0010;
  return {
    x:      Math.random() * W * 0.7,
    y:      Math.random() * H * 0.25,
    vx:     Math.cos(angle) * spd,
    vy:     Math.sin(angle) * spd,
    life:   1.0,
    decay:  1 / (75 + Math.random() * 45),
    active: true,
  };
}

// ─── Filament connection factory ───────────────────────────────────────────────
function makeFilament(aName, aHue, bName, bHue, ax, ay, bx, by) {
  // Gentle arc midpoint — raised slightly for elegance
  const mx   = (ax + bx) / 2;
  const my   = (ay + by) / 2 - 18;
  return {
    aName, bName, aHue, bHue,
    ax, ay, bx, by,
    cpx: mx, cpy: my,
    age:    0,
    dotT:   Math.random(),
    stable: false,
    energyDrift: 0,
  };
}

function bezierPoint(t, ax, ay, cpx, cpy, bx, by) {
  const mt = 1 - t;
  return {
    x: mt * mt * ax + 2 * mt * t * cpx + t * t * bx,
    y: mt * mt * ay + 2 * mt * t * cpy + t * t * by,
  };
}

// ─── Engine factory ────────────────────────────────────────────────────────────
export function createRenderEngine(
  nebulaCanvas, fieldCanvas, mainCanvas, fxCanvas,
  particlePool, trailPool, shockwavePool,
) {
  const ctxN = nebulaCanvas.getContext('2d');
  const ctxF = fieldCanvas.getContext('2d');
  const ctxM = mainCanvas.getContext('2d');
  const ctxX = fxCanvas.getContext('2d');

  let W = mainCanvas.width;
  let H = mainCanvas.height;
  let t = 0;
  let prevTime  = performance.now();
  let scrollY   = 0;

  // Field layers
  let farStars, midStars, nearStars;
  let shooters       = [];
  let nextShooterIn  = (10 + Math.random() * 8) * 60;

  // Filament connections map
  const filaments = new Map(); // key: "A→B"

  // Completion state
  let completionFrame  = -1;
  let convergenceLines = [];

  // Verification spinner angles
  let verifyAngle1 = 0, verifyAngle2 = 0, verifyAngle3 = 0;

  // ── Display cursor — Direct mapping (Zero Lag) ─────────────────────────
  let displayX = 0.5, displayY = 0.5;
  let dispVX = 0, dispVY = 0;

  function _updateDisplayCursor(cx, cy) {
    if (cx == null) return;
    // Gesture engine already handles filtering perfectly. 
    // Do NOT add a second layer of lag here. Be 1:1 direct.
    dispVX = cx - displayX;
    dispVY = cy - displayY;
    
    displayX = cx;
    displayY = cy;
  }

  // ── Node animation state ─────────────────────────────────────────────────────
  // Per-node: float offset, compress state, selection flash
  const nodeState = {};

  function _getNodeState(id) {
    if (!nodeState[id]) {
      nodeState[id] = {
        floatX: 0, floatY: 0,
        compressT: 0,     // 0→1→0 compress on dwell contact
        selectFlash: 0,   // 0→1 bright flash on selection
        dwellRing: 0,     // 0→1 dwell progress ring
      };
    }
    return nodeState[id];
  }

  function _initField() {
    farStars  = Array.from({ length: FAR_N  }, () => mkBgStar(W, H, 0));
    midStars  = Array.from({ length: MID_N  }, () => mkBgStar(W, H, 1));
    nearStars = Array.from({ length: NEAR_N }, () => mkBgStar(W, H, 2));
  }

  // ── Layer 1: Nebula (static) ──────────────────────────────────────────────
  function _paintNebula() {
    ctxN.clearRect(0, 0, W, H);
    // Deep dark blue/purple space void
    ctxN.fillStyle = '#0a0d16';
    ctxN.fillRect(0, 0, W, H);

    const blobs = [
      { x: 0.50, y: 0.50, r: 0.65, h: 200, s: 60, l: 10, a: 0.25 }, // Massive teal core nebula
      { x: 0.20, y: 0.30, r: 0.50, h: 260, s: 70, l: 15, a: 0.15 }, // Purple edge
      { x: 0.80, y: 0.70, r: 0.45, h: 180, s: 80, l: 12, a: 0.18 }, // Deep cyan edge
      { x: 0.50, y: 0.90, r: 0.40, h: 190, s: 40, l:  8, a: 0.15 }, 
    ];
    
    for (const b of blobs) {
      const cx = b.x * W, cy = b.y * H, r = b.r * Math.min(W, H);
      const g  = ctxN.createRadialGradient(cx, cy, 0, cx, cy, r);
      g.addColorStop(0, `hsla(${b.h},${b.s}%,${b.l}%,${b.a})`);
      g.addColorStop(1, 'hsla(0,0%,0%,0)');
      ctxN.fillStyle = g;
      ctxN.beginPath();
      ctxN.arc(cx, cy, r, 0, Math.PI * 2);
      ctxN.fill();
    }

    // Astral Grid Overlay (delicate high-tech graph)
    ctxN.save();
    ctxN.strokeStyle = 'rgba(100, 180, 255, 0.05)';
    ctxN.lineWidth = 0.5;
    const step = 80;
    
    ctxN.beginPath();
    for (let x = (W / 2) % step; x < W; x += step) {
      ctxN.moveTo(x, 0); ctxN.lineTo(x, H);
    }
    for (let y = (H / 2) % step; y < H; y += step) {
      ctxN.moveTo(0, y); ctxN.lineTo(W, y);
    }
    ctxN.stroke();
    
    // Grid crosses at intersections
    ctxN.strokeStyle = 'rgba(150, 200, 255, 0.15)';
    ctxN.lineWidth = 1;
    ctxN.beginPath();
    for (let x = (W / 2) % step; x < W; x += step) {
      for (let y = (H / 2) % step; y < H; y += step) {
        ctxN.moveTo(x - 3, y); ctxN.lineTo(x + 3, y);
        ctxN.moveTo(x, y - 3); ctxN.lineTo(x, y + 3);
      }
    }
    ctxN.stroke();
    ctxN.restore();
  }

  // ── Layer 2: Parallax starfield ───────────────────────────────────────────
  function _drawField(dt) {
    ctxF.clearRect(0, 0, W, H);
    scrollY += dt * 0.004;

    function drawLayer(stars) {
      for (const s of stars) {
        const yy  = (s.y + scrollY * s.scrollSpd * 60) % H;
        const bri = s.aMin + (s.aMax - s.aMin) * (0.5 + 0.5 * Math.sin(t * s.twSpd + s.phase));
        ctxF.globalAlpha = bri;
        ctxF.fillStyle   = '#ffffff';
        ctxF.beginPath();
        ctxF.arc(s.x, yy, s.r, 0, Math.PI * 2);
        ctxF.fill();
      }
    }
    drawLayer(farStars);
    drawLayer(midStars);
    drawLayer(nearStars);
    ctxF.globalAlpha = 1;

    // Shooting stars (rare, elegant)
    nextShooterIn--;
    if (nextShooterIn <= 0 && shooters.filter(s => s.active).length < SHOOT_MAX) {
      shooters.push(mkShootingStar(W, H));
      nextShooterIn = (10 + Math.random() * 9) * 60;
    }
    for (let i = shooters.length - 1; i >= 0; i--) {
      const s = shooters[i];
      s.x += s.vx; s.y += s.vy;
      s.life -= s.decay;
      if (s.life <= 0) { shooters.splice(i, 1); continue; }
      const tailLen = 65;
      ctxF.save();
      const grad = ctxF.createLinearGradient(s.x - s.vx * tailLen, s.y - s.vy * tailLen, s.x, s.y);
      grad.addColorStop(0, 'rgba(255,255,255,0)');
      grad.addColorStop(1, `rgba(255,255,255,${s.life * 0.6})`);
      ctxF.strokeStyle = grad;
      ctxF.lineWidth   = 1.2 * s.life;
      ctxF.beginPath();
      ctxF.moveTo(s.x - s.vx * tailLen, s.y - s.vy * tailLen);
      ctxF.lineTo(s.x, s.y);
      ctxF.stroke();
      ctxF.globalAlpha = s.life * 0.7;
      ctxF.fillStyle   = '#fff';
      ctxF.beginPath();
      ctxF.arc(s.x, s.y, 1.2, 0, Math.PI * 2);
      ctxF.fill();
      ctxF.restore();
    }
  }

  // ── Layer 3: Emoji nodes + filament lines ─────────────────────────────────
  function _drawMain(stars, selectedStars, dwellTarget, dwellProgress, isVerifying, cursorX, cursorY, ghostPattern) {
    ctxM.clearRect(0, 0, W, H);

    // Render ghost pattern (echo from pass 1) if available
    if (ghostPattern && ghostPattern.length >= 2) {
      _drawGhostPattern(stars, ghostPattern);
    }

    // Sync filament map with current selection sequence
    if (selectedStars.length >= 2) {
      for (let i = 0; i < selectedStars.length - 1; i++) {
        const aName = selectedStars[i];
        const bName = selectedStars[i + 1];
        const key   = `${aName}→${bName}`;
        if (!filaments.has(key)) {
          const sa = stars.find(s => s.name === aName);
          const sb = stars.find(s => s.name === bName);
          if (sa && sb) {
            filaments.set(key, makeFilament(
              aName, sa.hue ?? getGlyphHue(aName),
              bName, sb.hue ?? getGlyphHue(bName),
              sa.nx * W + (_getNodeState(sa.id).floatX),
              sa.ny * H + (_getNodeState(sa.id).floatY),
              sb.nx * W + (_getNodeState(sb.id).floatX),
              sb.ny * H + (_getNodeState(sb.id).floatY),
            ));
          }
        }
      }
    }

    // Draw live preview line: last selected node → current cursor position
    if (selectedStars.length >= 1 && selectedStars.length < 5 && cursorX != null) {
      const lastName = selectedStars[selectedStars.length - 1];
      const lastStar = stars.find(s => s.name === lastName);
      if (lastStar) {
        _drawLivePreviewLine(
          lastStar.nx * W + _getNodeState(lastStar.id).floatX,
          lastStar.ny * H + _getNodeState(lastStar.id).floatY,
          cursorX * W,
          cursorY * H,
          lastStar.hue ?? getGlyphHue(lastStar.name),
        );
      }
    }

    // Draw established filaments
    for (const filament of filaments.values()) {
      _drawFilament(filament);
    }

    // Completion bloom
    if (completionFrame >= 0) {
      completionFrame++;
      const bloomA = Math.max(0, 0.25 - (completionFrame / 80) * 0.25);
      if (bloomA > 0) {
        const bloom = ctxM.createRadialGradient(W/2, H/2, 0, W/2, H/2, Math.min(W, H) * 0.5);
        bloom.addColorStop(0, `rgba(180,100,255,${bloomA})`);
        bloom.addColorStop(1, 'rgba(0,0,0,0)');
        ctxM.fillStyle = bloom;
        ctxM.fillRect(0, 0, W, H);
      }
      if (completionFrame < 4) {
        ctxM.fillStyle = `rgba(255,255,255,${0.025 * (4 - completionFrame) / 4})`;
        ctxM.fillRect(0, 0, W, H);
      }
      if (completionFrame >= 1 && completionFrame < 28) {
        const prog = completionFrame / 28;
        for (const cl of convergenceLines) {
          ctxM.save();
          ctxM.strokeStyle = `rgba(192,100,255,${(1 - prog) * 0.45})`;
          ctxM.lineWidth   = 0.8;
          ctxM.beginPath();
          ctxM.moveTo(cl.sx, cl.sy);
          ctxM.lineTo(cl.sx + cl.vx * prog * 160, cl.sy + cl.vy * prog * 160);
          ctxM.stroke();
          ctxM.restore();
        }
      }
    }

    // Draw Stellar Cipher glyph nodes
    for (const star of stars) {
      const selIdx    = selectedStars.indexOf(star.name);
      const isSelected = selIdx >= 0;
      const isDwell    = star.name === dwellTarget;
      // Proximity factor: how close cursor is to this node (0–1)
      let proximity = 0;
      if (cursorX != null) {
        const dpx = Math.hypot((cursorX - star.nx) * W, (cursorY - star.ny) * H);
        proximity  = Math.max(0, 1 - dpx / (NODE_BASE_R * 4.5));
      }
      _drawGlyphNode(ctxM, star, selIdx, isSelected, isDwell, dwellProgress, proximity);
    }

    if (isVerifying) _drawVerifySpinner(ctxM);
  }

  // Draw the straight dashed filament between two connected nodes
  function _drawFilament(fil) {
    fil.age = Math.min(1, fil.age + 0.15); // reveal rapidly
    if (fil.age <= 0) return;

    const age = fil.age;
    const { ax, ay, bx, by, aHue, bHue } = fil;
    const ex = { x: ax + (bx - ax) * age, y: ay + (by - ay) * age };

    ctxM.save();
    
    // Core dashed line
    ctxM.beginPath();
    ctxM.moveTo(ax, ay);
    ctxM.lineTo(ex.x, ex.y);
    
    // Gradient matching hues
    const grad = ctxM.createLinearGradient(ax, ay, bx, by);
    grad.addColorStop(0, `hsla(${aHue}, 90%, 80%, ${0.6 * age})`);
    grad.addColorStop(1, `hsla(${bHue}, 90%, 80%, ${0.6 * age})`);
    
    ctxM.strokeStyle = grad;
    ctxM.lineWidth   = 1.5;
    ctxM.setLineDash([4, 6]);
    ctxM.stroke();
    ctxM.setLineDash([]);
    ctxM.restore();
  }

  // Live preview line: from last node to current spaceship
  function _drawLivePreviewLine(ax, ay, bx, by, hue) {
    ctxM.save();
    ctxM.beginPath();
    ctxM.moveTo(ax, ay);
    ctxM.lineTo(bx, by);
    
    ctxM.strokeStyle = `hsla(${hue}, 90%, 80%, 0.4)`;
    ctxM.lineWidth   = 1.5;
    ctxM.setLineDash([4, 6]);
    ctxM.shadowColor = `hsla(${hue}, 100%, 75%, 0.6)`;
    ctxM.shadowBlur  = 4;
    ctxM.stroke();
    
    ctxM.shadowBlur  = 0;
    ctxM.setLineDash([]);
    ctxM.restore();
  }

  // Stellar Cipher glyph node renderer
  function _drawGlyphNode(ctx, star, selIdx, isSelected, isDwell, dwellProg, proximity) {
    const ns      = _getNodeState(star.id);
    const hue     = star.hue ?? getGlyphHue(star.name);
    const drawFn  = getGlyphDraw(star.name);

    // Floating animation — slow Lissajous per node
    const floatAmpX = 4.5;
    const floatAmpY = 3.8;
    ns.floatX = Math.sin(t * 0.45 + star.floatPhaseX) * floatAmpX;
    ns.floatY = Math.cos(t * 0.38 + star.floatPhaseY) * floatAmpY;

    if (ns.selectFlash > 0) ns.selectFlash = Math.max(0, ns.selectFlash - 0.04);

    if (isDwell) {
      ns.compressT = Math.min(1, ns.compressT + 0.06);
    } else {
      ns.compressT = Math.max(0, ns.compressT - 0.05);
    }

    const cx  = star.nx * W + ns.floatX;
    const cy  = star.ny * H + ns.floatY;

    const breathe    = 0.96 + 0.04 * Math.sin(t * 1.2 + star.phase);
    const proxScale  = 1 + proximity * 0.08;
    const compScale  = 1 - ns.compressT * 0.12;
    const selectScale = isSelected ? (1 + ns.selectFlash * 0.15) : 1;
    const finalScale  = breathe * proxScale * compScale * selectScale;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(finalScale, finalScale);

    const R = NODE_BASE_R;

    if (star.isSignature) {
      _drawSignatureVFX(ctx, hue, R, t, proximity, isSelected, isDwell);
    }

    if (isSelected) {
      const pulseMod = 1 + 0.05 * Math.sin(t * 2.0 + selIdx * 1.1);
      const glowR    = R * 3.2 * pulseMod;
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, glowR);
      g.addColorStop(0,   `hsla(${hue},90%,65%,0.30)`);
      g.addColorStop(0.5, `hsla(${hue},80%,60%,0.12)`);
      g.addColorStop(1,   'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, glowR, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = `hsla(${hue},90%,75%,${0.7 + 0.3 * Math.sin(t * 1.8)})`;
      ctx.lineWidth   = 1.5;
      ctx.shadowColor = `hsla(${hue},100%,70%,0.8)`;
      ctx.shadowBlur  = 10;
      ctx.beginPath();
      ctx.arc(0, 0, R + 10, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur  = 0;
      ctx.strokeStyle = `hsla(${hue},100%,88%,0.4)`;
      ctx.lineWidth   = 0.8;
      ctx.beginPath();
      ctx.arc(0, 0, R + 5, 0, Math.PI * 2);
      ctx.stroke();

    } else if (isDwell) {
      const dwelling = dwellProg;
      const haloR    = R * (2.5 + proximity * 0.8 + dwelling * 1.2);
      const g        = ctx.createRadialGradient(0, 0, 0, 0, 0, haloR);
      g.addColorStop(0,   `hsla(${hue},95%,70%,${0.25 + dwelling * 0.20})`);
      g.addColorStop(0.6, `hsla(${hue},85%,65%,0.08)`);
      g.addColorStop(1,   'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, haloR, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = `hsla(${hue},100%,78%,${0.6 + dwelling * 0.4})`;
      ctx.lineWidth   = 2;
      ctx.lineCap     = 'round';
      ctx.shadowColor = `hsla(${hue},100%,75%,0.8)`;
      ctx.shadowBlur  = 10;
      ctx.beginPath();
      ctx.arc(0, 0, R + 14, -Math.PI / 2, -Math.PI / 2 + dwelling * Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur  = 0;
      const pr = R + 8 + 3 * Math.sin(t * 3.5);
      ctx.strokeStyle = `hsla(${hue},80%,70%,${0.25 + 0.15 * Math.sin(t * 3.5)})`;
      ctx.lineWidth   = 1;
      ctx.beginPath();
      ctx.arc(0, 0, pr, 0, Math.PI * 2);
      ctx.stroke();

    } else if (proximity > 0.05) {
      const haloR = R * (1.8 + proximity * 1.4);
      const g     = ctx.createRadialGradient(0, 0, 0, 0, 0, haloR);
      g.addColorStop(0,   `hsla(${hue},85%,65%,${proximity * 0.18})`);
      g.addColorStop(1,   'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, haloR, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = `hsla(${hue},80%,70%,${proximity * 0.20})`;
      ctx.lineWidth   = 0.8;
      ctx.beginPath();
      ctx.arc(0, 0, R + 6, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      const breatheA = 0.08 + 0.04 * Math.sin(t * 0.9 + star.phase);
      const gR       = R * 2.2;
      const g        = ctx.createRadialGradient(0, 0, 0, 0, 0, gR);
      g.addColorStop(0,   `hsla(${hue},70%,55%,${breatheA})`);
      g.addColorStop(1,   'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, gR, 0, Math.PI * 2);
      ctx.fill();
    }

    // ── Draw Astral Node Orbs (Replaces Glyphs) ─────────────────────────────
    const glyphAlpha = isSelected ? 1.0 : (0.55 + proximity * 0.35 + 0.10 * Math.sin(t * 0.8 + star.phase));
    ctx.globalAlpha  = Math.min(1, glyphAlpha);

    const glowIntensity = isSelected ? 18 : (isDwell ? 10 : proximity * 6);
    ctx.strokeStyle  = `hsla(${hue},100%,${isSelected ? 92 : 78}%,1)`;
    ctx.fillStyle    = `hsla(${hue},100%,${isSelected ? 92 : 78}%,1)`;
    if (glowIntensity > 0) {
      ctx.shadowColor  = `hsla(${hue},100%,80%,0.9)`;
      ctx.shadowBlur   = glowIntensity;
    }

    // Planetary sphere core
    ctx.beginPath();
    const planetG = ctx.createRadialGradient(-R * 0.2, -R * 0.2, 0, 0, 0, R * 0.45);
    planetG.addColorStop(0, `hsla(${hue},100%,92%,1)`);
    planetG.addColorStop(0.5, `hsla(${hue},90%,${isSelected ? 75 : 60}%,1)`);
    planetG.addColorStop(1, `hsla(${hue},80%,30%,1)`);
    ctx.fillStyle = planetG;
    ctx.arc(0, 0, R * 0.45, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur  = 0;
    ctx.globalAlpha = 1;

    // ── Outer Ring Crosshairs (Tech Aesthetic) ──────────────────────────────
    if (proximity > 0.1 || isSelected) {
      ctx.strokeStyle = `hsla(${hue},60%,60%,${0.2 + proximity * 0.3})`;
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(-R * 1.5, 0); ctx.lineTo(-R * 0.5, 0);
      ctx.moveTo(R * 0.5, 0); ctx.lineTo(R * 1.5, 0);
      ctx.moveTo(0, -R * 1.5); ctx.lineTo(0, -R * 0.5);
      ctx.moveTo(0, R * 0.5); ctx.lineTo(0, R * 1.5);
      ctx.stroke();
    }

    // ── Node Name Label — Clean High-Contrast ──────────────────
    const labelAlpha = isSelected ? 1.0 : Math.max(0.85, proximity * 0.15 + 0.85);
    const displayName = star.name.toUpperCase();
    const labelY = -R * 1.15;

    ctx.font         = `700 12px 'Outfit', sans-serif`;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'bottom';

    // 1. Dark silhouette behind text to separate from star glow
    ctx.globalAlpha  = labelAlpha;
    ctx.shadowColor  = 'rgba(0,0,0,0.9)';
    ctx.shadowBlur   = 5;
    ctx.shadowOffsetY = 1;
    ctx.fillStyle    = 'rgba(0,0,0,0.7)';
    ctx.fillText(displayName, 0, labelY);
    
    // 2. Main text (very bright, slightly tinted to the star's hue)
    ctx.shadowOffsetY = 0;
    ctx.shadowBlur   = isSelected ? 8 : 2;
    ctx.shadowColor  = `hsla(${hue}, 100%, 65%, 0.8)`;
    ctx.fillStyle    = isSelected 
      ? `hsl(${hue}, 100%, 98%)`  // almost white
      : `hsl(${hue}, 50%, 90%)`;  // bright pastel
    ctx.fillText(displayName, 0, labelY);

    ctx.globalAlpha  = 1;
    ctx.shadowBlur   = 0;

    // ── Selection order badge ───────────────────────────────────────────────
    if (isSelected) {
      ctx.font         = 'bold 11px Outfit, sans-serif';
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.globalAlpha  = 1;
      ctx.shadowColor  = `hsla(${hue},100%,80%,1)`;
      ctx.shadowBlur   = 12;
      ctx.fillStyle    = `hsla(${hue},80%,95%,1)`;
      ctx.fillText(`[${selIdx + 1}]`, R * 1.1, -R * 0.65);
      ctx.shadowBlur = 0;
    }

    ctx.restore();
  }


  // Request: Make signature stars look like normal stars (no extra circles)
  function _drawSignatureVFX(ctx, hue, R, t, proximity, isSelected, isDwell) {
    // Logic kept but drawing removed to satisfy "no circles" request
  }

  function _drawVerifySpinner(ctx) {
    const cx = W / 2, cy = H / 2;
    verifyAngle1 += 0.038;
    verifyAngle2 -= 0.022;
    verifyAngle3 += 0.012;

    const arcs = [
      { r: 44, angle: verifyAngle1, sweep: Math.PI * 0.55, h: 270, a: 0.65 },
      { r: 60, angle: verifyAngle2, sweep: Math.PI * 0.38, h: 255, a: 0.45 },
      { r: 76, angle: verifyAngle3, sweep: Math.PI * 0.72, h: 240, a: 0.30 },
    ];

    ctx.save();
    ctx.translate(cx, cy);
    for (const arc of arcs) {
      ctx.save();
      ctx.rotate(arc.angle);
      ctx.strokeStyle = `hsla(${arc.h},80%,70%,${arc.a})`;
      ctx.lineWidth   = 1.8;
      ctx.lineCap     = 'round';
      ctx.shadowColor = `hsla(${arc.h},100%,70%,0.8)`;
      ctx.shadowBlur  = 7;
      ctx.beginPath();
      ctx.arc(0, 0, arc.r, 0, arc.sweep);
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();

    ctx.fillStyle    = 'rgba(192,100,255,0.45)';
    ctx.font         = '500 11px Inter, sans-serif';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('VERIFYING…', cx, cy + 88);
  }

  // ── Layer 4 draw: cursor + commit zone ────────────────────────────────────
  function _drawFX(cursorX, cursorY, cursorHue, cursorSpd, isVerifying, commitZone, selectedStars) {
    ctxX.clearRect(0, 0, W, H);

    // Draw ASTRAL_NAV HUD
    _drawAstralHUD(ctxX, selectedStars || []);

    // Draw commit zone (verify link button)
    if (commitZone) {
      _drawCommitZone(commitZone);
    }

    if (cursorX == null) return;

    // Update the heavy-inertia display cursor
    _updateDisplayCursor(cursorX, cursorY);
    const dcx = displayX * W;
    const dcy = displayY * H;

    // Trail follows the display cursor (not raw)
    trailPool.push(dcx, dcy, cursorSpd, cursorHue);
    trailPool.draw(ctxX);

    shockwavePool.tick();
    shockwavePool.draw(ctxX);

    ctxX.save();
    particlePool.draw(ctxX);
    ctxX.restore();

    // ── Glowing Dot Cursor ───────────────────────────────────────────────────
    const isNear = cursorHue !== 270;
    
    ctxX.save();
    ctxX.translate(dcx, dcy);
    
    // Core of the dot
    ctxX.beginPath();
    ctxX.arc(0, 0, isNear ? 4.5 : 3.5, 0, Math.PI * 2);
    ctxX.fillStyle = '#ffffff';
    
    // Outer neon glow
    ctxX.shadowColor = `hsla(${cursorHue}, 100%, 65%, 1)`;
    ctxX.shadowBlur = isNear ? 16 : 12;
    ctxX.fill();
    
    // An inner halo for intensity
    ctxX.shadowBlur = 4;
    ctxX.fill();

    // (Spaceship shape removed in favor of glowing dot)
    ctxX.restore();
  }

  // ── Public API ──────────────────────────────────────────────────────────────
  function renderFrame({ stars, cursor, selectedStars, dwellTarget, dwellProgress, isVerifying, ghostPattern, commitZone }) {
    const now  = performance.now();
    const dt   = Math.min(now - prevTime, 50);
    prevTime   = now;
    t         += dt * 0.001;

    particlePool.tick(dt);
    _drawField(dt);
    _drawMain(stars, selectedStars, dwellTarget, dwellProgress, isVerifying, cursor?.x, cursor?.y, ghostPattern);
    _drawFX(cursor?.x, cursor?.y, cursor?.hue ?? 270, cursor?.speed ?? 0, isVerifying, commitZone, selectedStars);
  }

  function _drawGhostPattern(stars, pattern) {
    ctxM.save();
    ctxM.globalAlpha = 0.08; // very faint ghost
    ctxM.setLineDash([4, 6]);
    ctxM.strokeStyle = 'rgba(180, 160, 255, 0.4)';
    ctxM.lineWidth   = 1.0;

    for (let i = 0; i < pattern.length - 1; i++) {
      const sa = stars.find(s => s.name === pattern[i]);
      const sb = stars.find(s => s.name === pattern[i + 1]);
      if (sa && sb) {
        const ax = sa.nx * W, ay = sa.ny * H;
        const bx = sb.nx * W, by = sb.ny * H;
        const mx = (ax + bx) / 2;
        const my = (ay + by) / 2 - 12;

        ctxM.beginPath();
        ctxM.moveTo(ax, ay);
        ctxM.quadraticCurveTo(mx, my, bx, by);
        ctxM.stroke();

        // Node echo
        ctxM.beginPath();
        ctxM.arc(ax, ay, NODE_BASE_R * 0.8, 0, Math.PI * 2);
        ctxM.stroke();
        if (i === pattern.length - 2) {
          ctxM.beginPath();
          ctxM.arc(bx, by, NODE_BASE_R * 0.8, 0, Math.PI * 2);
          ctxM.stroke();
        }
      }
    }
    ctxM.restore();
  }

  // ── Dwell-to-commit zone: VERIFY LINK ─────────────────────────────
  function _drawCommitZone({ cx, cy, r, progress }) {
    const zx = cx * W;
    const zy = cy * H;

    // Fixed width and height for cinematic button
    const bw = 240;
    const bh = 56;
    const bx = zx - bw / 2;
    const by = zy - bh / 2;

    ctxX.save();

    // Box outline and base
    ctxX.strokeStyle = 'rgba(100, 200, 255, 0.4)';
    ctxX.lineWidth = 1;
    ctxX.fillStyle = 'rgba(10, 20, 30, 0.8)';
    
    // Draw rounded rect path
    ctxX.beginPath();
    ctxX.roundRect(bx, by, bw, bh, 6);
    ctxX.fill();
    ctxX.stroke();

    // Progress fill
    if (progress > 0) {
      ctxX.save();
      ctxX.beginPath();
      ctxX.roundRect(bx, by, bw * progress, bh, 6);
      ctxX.clip();
      
      const grad = ctxX.createLinearGradient(bx, by, bx + bw, by);
      grad.addColorStop(0, '#2b9ea6'); // cyan
      grad.addColorStop(1, '#5de6ec'); // bright cyan
      ctxX.fillStyle = grad;
      ctxX.fill();
      ctxX.restore();
      
      // Intense glow on hover
      ctxX.shadowColor = '#5de6ec';
      ctxX.shadowBlur = 15;
      ctxX.strokeStyle = '#5de6ec';
      ctxX.lineWidth = 2;
      ctxX.stroke();
    }

    // Button Label
    ctxX.shadowBlur = 0;
    ctxX.font = `600 13px 'Outfit', sans-serif`;
    ctxX.textAlign = 'center';
    ctxX.textBaseline = 'middle';
    ctxX.letterSpacing = '1px';
    ctxX.fillStyle = progress > 0.5 ? '#111' : '#f8fafc';
    
    const secsLeft = Math.ceil((1 - progress) * 3);
    const text = progress > 0 ? `VERIFYING [${secsLeft}s]` : 'VERIFY LINK';
    ctxX.fillText(text, zx, zy);

    ctxX.restore();
  }

  function _drawAstralHUD(ctx, selectedStars) {
    ctx.save();
    
    // Single Unique Title in Center
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = "500 20px 'Outfit', sans-serif";
    ctx.fillStyle = '#f8fafc';
    ctx.letterSpacing = '8px';
    ctx.shadowBlur = 0;
    
    // "STELLAR_RESONANCE" feels unique and "smart" for a biometric link
    ctx.fillText("STELLAR_RESONANCE_v3", W / 2, 60);

    ctx.restore();
  }

  function emitParticles(star) {
    const ns   = _getNodeState(star.id);
    const hue  = star.hue ?? getGlyphHue(star.name);
    const cx   = star.nx * W + ns.floatX;
    const cy   = star.ny * H + ns.floatY;

    // Trigger selection flash on the node
    ns.selectFlash    = 1.0;
    ns.compressT      = 0; // release compression instantly on selection

    particlePool.burst(cx, cy, 22, hue);
    shockwavePool.emit(cx, cy, hue);
    setTimeout(() => shockwavePool.emit(cx, cy, hue), 70);
  }

  function triggerCompletionEffect(stars, selectedStars) {
    completionFrame  = 0;
    convergenceLines = [];
    for (const name of selectedStars) {
      const star = stars.find(s => s.name === name);
      if (!star) continue;
      const ns  = _getNodeState(star.id);
      const sx  = star.nx * W + ns.floatX;
      const sy  = star.ny * H + ns.floatY;
      for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2;
        convergenceLines.push({ sx, sy, vx: Math.cos(angle), vy: Math.sin(angle) });
      }
    }
  }

  function triggerFailure() {
    filaments.clear();
    particlePool.reset();
    shockwavePool.reset();
    // Reset display cursor inertia
    dispVX = 0; dispVY = 0;
  }

  function onResize() {
    W = mainCanvas.width;
    H = mainCanvas.height;
    _initField();
    _paintNebula();
    trailPool.reset();
    filaments.clear();
    completionFrame = -1;
  }

  _initField();
  _paintNebula();

  return { renderFrame, emitParticles, triggerCompletionEffect, triggerFailure, onResize };
}
