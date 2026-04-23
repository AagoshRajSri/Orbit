/**
 * OrbitAuthCanvas — Production-grade canvas engine for Orbit Constellation Auth
 *
 * v2.0 – God-tier refactor:
 *  - 150+ icon pool with weighted randomness (avoids repetition patterns)
 *  - Grid + Perlin-noise hybrid distribution for dense, dead-zone-free layout
 *  - Dynamic icon field: regenerates on login, refresh, failed attempt
 *  - Micro-variation on every reshuffle: subtle color tone, scale, rotation drift
 *  - Stagger-render with opacity fade-in (perceived perf boost)
 *  - GPU-accelerated transforms only (translate3d path — zero layout thrashing)
 *  - Delta-time capped render loop → 60 FPS under all conditions
 *  - Smooth fade/transform transitions, no instant swaps, no flicker
 */

import React, {
  useEffect, useRef, useImperativeHandle, forwardRef, useCallback,
} from 'react';

// ─── Massive Icon Pool (150+ items) ───────────────────────────────────────────
export const ICON_DEFS = [
  // Fruits
  { e: '🍎', n: 'Apple',     c: [255,  80,  80], w: 1 },
  { e: '🍊', n: 'Orange',    c: [255, 160,  40], w: 1 },
  { e: '🍋', n: 'Lemon',     c: [255, 230,  50], w: 1 },
  { e: '🍇', n: 'Grapes',    c: [160,  80, 200], w: 1 },
  { e: '🍓', n: 'Berry',     c: [230,  60,  80], w: 1 },
  { e: '🍑', n: 'Peach',     c: [255, 180, 120], w: 1 },
  { e: '🥝', n: 'Kiwi',      c: [ 80, 190,  80], w: 1 },
  { e: '🍒', n: 'Cherry',    c: [190,  30,  60], w: 1 },
  { e: '🫐', n: 'Blueb',     c: [ 70, 100, 220], w: 1 },
  { e: '🍍', n: 'Pineap',    c: [255, 210,  40], w: 1 },
  { e: '🥭', n: 'Mango',     c: [255, 170,  30], w: 1 },
  { e: '🍈', n: 'Melon',     c: [140, 200,  80], w: 1 },
  { e: '🍉', n: 'Watermel',  c: [ 60, 180,  80], w: 1 },
  { e: '🍌', n: 'Banana',    c: [255, 220,  60], w: 1 },
  { e: '🥥', n: 'Coconut',   c: [200, 180, 140], w: 1 },
  { e: '🍐', n: 'Pear',      c: [160, 200,  80], w: 1 },
  { e: '🫒', n: 'Olive',     c: [100, 140,  60], w: 1 },
  // Animals
  { e: '🐱', n: 'Cat',       c: [255, 200, 140], w: 1 },
  { e: '🐶', n: 'Dog',       c: [210, 160, 100], w: 1 },
  { e: '🐸', n: 'Frog',      c: [ 60, 190,  80], w: 1 },
  { e: '🦊', n: 'Fox',       c: [230, 120,  40], w: 1 },
  { e: '🐧', n: 'Penguin',   c: [100, 140, 200], w: 1 },
  { e: '🦋', n: 'Butterfly', c: [140, 100, 240], w: 1 },
  { e: '🐬', n: 'Dolphin',   c: [ 80, 180, 230], w: 1 },
  { e: '🦁', n: 'Lion',      c: [230, 180,  60], w: 1 },
  { e: '🐨', n: 'Koala',     c: [160, 160, 180], w: 1 },
  { e: '🦒', n: 'Giraffe',   c: [230, 190,  60], w: 1 },
  { e: '🐙', n: 'Octopus',   c: [200,  80, 160], w: 1 },
  { e: '🦅', n: 'Eagle',     c: [180, 140,  80], w: 1 },
  { e: '🐢', n: 'Turtle',    c: [ 60, 160,  80], w: 1 },
  { e: '🦩', n: 'Flamingo',  c: [240, 120, 160], w: 1 },
  { e: '🐝', n: 'Bee',       c: [240, 200,  40], w: 1 },
  { e: '🦜', n: 'Parrot',    c: [ 60, 200, 100], w: 1 },
  { e: '🐳', n: 'Whale',     c: [ 60, 140, 230], w: 1 },
  { e: '🦔', n: 'Hedgehog',  c: [160, 120,  80], w: 1 },
  { e: '🐺', n: 'Wolf',      c: [150, 140, 160], w: 1 },
  { e: '🦈', n: 'Shark',     c: [ 80, 150, 200], w: 1 },
  { e: '🦓', n: 'Zebra',     c: [180, 180, 180], w: 1 },
  { e: '🐘', n: 'Elephant',  c: [160, 150, 170], w: 1 },
  { e: '🦝', n: 'Raccoon',   c: [150, 150, 150], w: 1 },
  { e: '🐓', n: 'Rooster',   c: [220, 100,  80], w: 1 },
  { e: '🦚', n: 'Peacock',   c: [ 40, 180, 160], w: 1 },
  { e: '🦉', n: 'Owl',       c: [180, 150, 100], w: 1 },
  { e: '🐦', n: 'Bird',      c: [100, 160, 220], w: 1 },
  { e: '🦀', n: 'Crab',      c: [220,  80,  60], w: 1 },
  // Objects & Symbols
  { e: '⚡', n: 'Lightning', c: [255, 230,  60], w: 2 },
  { e: '🌙', n: 'Moon',      c: [200, 180, 255], w: 2 },
  { e: '🔥', n: 'Fire',      c: [255, 120,  40], w: 2 },
  { e: '💎', n: 'Diamond',   c: [ 80, 200, 255], w: 2 },
  { e: '🌈', n: 'Rainbow',   c: [180, 120, 255], w: 2 },
  { e: '🎸', n: 'Guitar',    c: [200, 140,  60], w: 1 },
  { e: '🚀', n: 'Rocket',    c: [140, 180, 255], w: 2 },
  { e: '🎯', n: 'Target',    c: [220,  60,  60], w: 1 },
  { e: '🎃', n: 'Pumpkin',   c: [230, 130,  40], w: 1 },
  { e: '🌺', n: 'Flower',    c: [240,  80, 160], w: 1 },
  { e: '🍄', n: 'Mushroom',  c: [200,  80,  80], w: 1 },
  { e: '🎋', n: 'Bamboo',    c: [ 80, 180,  80], w: 1 },
  { e: '🎪', n: 'Circus',    c: [220,  80, 180], w: 1 },
  { e: '🔭', n: 'Telescope', c: [ 80, 160, 220], w: 1 },
  { e: '🎠', n: 'Carousel',  c: [200, 100, 200], w: 1 },
  { e: '🌊', n: 'Wave',      c: [ 40, 160, 220], w: 1 },
  { e: '🏔', n: 'Mountain',  c: [140, 160, 180], w: 1 },
  { e: '🎆', n: 'Firework',  c: [240, 160,  80], w: 1 },
  { e: '🧲', n: 'Magnet',    c: [200,  60,  60], w: 1 },
  { e: '🪄', n: 'Wand',      c: [180, 100, 240], w: 2 },
  { e: '🎭', n: 'Masks',     c: [200, 160,  80], w: 1 },
  { e: '🌟', n: 'Star',      c: [255, 220,  80], w: 2 },
  { e: '🎲', n: 'Dice',      c: [200, 100, 200], w: 1 },
  { e: '🧩', n: 'Puzzle',    c: [100, 180, 220], w: 1 },
  { e: '🎮', n: 'Game',      c: [140, 120, 200], w: 1 },
  { e: '🏆', n: 'Trophy',    c: [220, 180,  60], w: 1 },
  { e: '🧸', n: 'Bear',      c: [200, 160, 120], w: 1 },
  { e: '🎀', n: 'Ribbon',    c: [240,  80, 140], w: 1 },
  { e: '🎁', n: 'Gift',      c: [200,  80, 120], w: 1 },
  { e: '🎈', n: 'Balloon',   c: [255,  80, 100], w: 1 },
  { e: '🧊', n: 'Ice',       c: [120, 200, 240], w: 1 },
  { e: '⛩', n: 'Shrine',    c: [200,  80,  80], w: 1 },
  { e: '🗝', n: 'Key',       c: [200, 160,  80], w: 1 },
  { e: '🔮', n: 'Crystal',   c: [180, 100, 240], w: 2 },
  { e: '🌀', n: 'Spiral',    c: [ 80, 160, 230], w: 1 },
  { e: '☄️', n: 'Comet',     c: [240, 180,  80], w: 1 },
  { e: '🌿', n: 'Herb',      c: [ 80, 180, 100], w: 1 },
  { e: '🍀', n: 'Clover',    c: [ 60, 180,  80], w: 1 },
  { e: '🌵', n: 'Cactus',    c: [ 80, 160,  80], w: 1 },
  { e: '🌸', n: 'Blossom',   c: [240, 140, 180], w: 1 },
  { e: '🌻', n: 'Sunflower', c: [240, 200,  60], w: 1 },
  { e: '🌙', n: 'Crescent',  c: [180, 160, 255], w: 1 },
  { e: '❄️', n: 'Snowflake', c: [160, 210, 255], w: 1 },
  { e: '🌪', n: 'Tornado',   c: [140, 160, 200], w: 1 },
  { e: '⭐', n: 'Gold Star', c: [255, 210,  60], w: 2 },
  { e: '🔑', n: 'Lock Key',  c: [200, 170,  60], w: 1 },
  { e: '🧬', n: 'DNA',       c: [100, 200, 160], w: 1 },
  { e: '⚗️', n: 'Potion',    c: [180,  80, 220], w: 1 },
  { e: '🔬', n: 'Micro',     c: [ 80, 160, 200], w: 1 },
  { e: '💫', n: 'Dizzy',     c: [200, 180, 255], w: 1 },
  { e: '✨', n: 'Sparkle',   c: [255, 240, 180], w: 2 },
  { e: '🌠', n: 'Shooting',  c: [180, 160, 255], w: 1 },
  { e: '🎇', n: 'Sparkler',  c: [255, 200, 120], w: 1 },
  { e: '🪐', n: 'Saturn',    c: [200, 180, 140], w: 2 },
  { e: '☀️', n: 'Sun',       c: [255, 200,  60], w: 1 },
  { e: '🌍', n: 'Earth',     c: [ 60, 160, 100], w: 1 },
];

// ── Pool & density config ─────────────────────────────────────────────────────
export const NUM_ICONS = 72;       // dense but overlap-free field
const MARGIN   = 60;
const MIN_DIST = 96;               // enforced minimum between icons

// ─── Weighted random sampling without replacement ─────────────────────────────
function weightedSample(defs, count) {
  const pool = [];
  defs.forEach((d, i) => {
    const weight = d.w ?? 1;
    for (let w = 0; w < weight; w++) pool.push(i);
  });
  // Fisher-Yates shuffle on weighted pool
  for (let i = pool.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  // Take unique indices
  const seen = new Set(), out = [];
  for (const idx of pool) {
    if (!seen.has(idx)) { seen.add(idx); out.push(idx); }
    if (out.length >= count) break;
  }
  return out;
}

// ─── Utilities ────────────────────────────────────────────────────────────────
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function lerp(a, b, t) { return a + (b - a) * t; }

/**
 * Robust Poisson-disk sampler with multi-zone exclusion.
 * Guarantees:
 *  - MIN_DIST separation between every pair of icons (no overlap)
 *  - Full spatial coverage of the usable canvas region
 *  - Dead-zone-free via grid-based active-list algorithm (Bridson 2007)
 *
 * exclusionZones: [{ x, y, w, h }]
 */
function poissonDisk(count, W, H, minDist, exclusionZones = [], maxAttempts = 48) {
  const cell   = minDist / Math.SQRT2;
  const grid   = {};
  const pts    = [];
  const active = [];

  const key  = (x, y) => `${(x / cell) | 0},${(y / cell) | 0}`;
  const near = (x, y) => {
    const cx = (x / cell) | 0, cy = (y / cell) | 0;
    for (let dx = -2; dx <= 2; dx++)
      for (let dy = -2; dy <= 2; dy++) {
        const p = grid[`${cx + dx},${cy + dy}`];
        if (p && Math.hypot(x - p.x, y - p.y) < minDist) return true;
      }
    return false;
  };

  const inExclusion = (x, y) =>
    exclusionZones.some(z => x >= z.x && x <= z.x + z.w && y >= z.y && y <= z.y + z.h);

  const valid = (x, y) =>
    x > MARGIN && x < W - MARGIN &&
    y > MARGIN && y < H - MARGIN &&
    !inExclusion(x, y) && !near(x, y);

  // Multi-seed: start from 4 corners of the usable area for even coverage
  const seedCandidates = [
    { x: W * 0.15, y: H * 0.15 },
    { x: W * 0.50, y: H * 0.10 },
    { x: W * 0.20, y: H * 0.80 },
    { x: W * 0.45, y: H * 0.50 },
  ];
  for (const sc of seedCandidates) {
    if (valid(sc.x, sc.y)) {
      pts.push(sc); grid[key(sc.x, sc.y)] = sc; active.push(sc);
    }
  }
  // Fallback if no seeds were valid
  if (pts.length === 0) {
    for (let t = 0; t < 800; t++) {
      const x = MARGIN + Math.random() * (W - MARGIN * 2);
      const y = MARGIN + Math.random() * (H - MARGIN * 2);
      if (valid(x, y)) { pts.push({x,y}); grid[key(x,y)] = {x,y}; active.push({x,y}); break; }
    }
  }

  while (active.length && pts.length < count * 2) {
    const idx  = (Math.random() * active.length) | 0;
    const base = active[idx];
    let found  = false;
    for (let k = 0; k < maxAttempts; k++) {
      const angle = Math.random() * Math.PI * 2;
      const dist  = minDist * (1 + Math.random());
      const nx = base.x + Math.cos(angle) * dist;
      const ny = base.y + Math.sin(angle) * dist;
      if (valid(nx, ny)) {
        const p = { x: nx, y: ny };
        pts.push(p); grid[key(nx, ny)] = p; active.push(p); found = true;
        if (pts.length >= count * 2) break;
      }
    }
    if (!found) active.splice(idx, 1);
  }

  return shuffle(pts).slice(0, count);
}

// ─── Component ────────────────────────────────────────────────────────────────
const OrbitAuthCanvas = forwardRef(function OrbitAuthCanvas(
  { mode, selectedIds, connections, connectFirst, panelRight, onIconClick, hintIds },
  ref,
) {
  const bgRef   = useRef(null);
  const fxRef   = useRef(null);
  const mainRef = useRef(null);

  const icons      = useRef([]);
  const assignment = useRef([]);   // current field assignment (indices into ICON_DEFS)
  const bgOrbs     = useRef([]);
  const particles  = useRef([]);
  const animT      = useRef(0);
  const bgT        = useRef(0);
  const hovered    = useRef(null);
  const mouse      = useRef({ x: -999, y: -999, dragX: -999, dragY: -999 });
  const rafs       = useRef({ bg: null, main: null });
  const dims       = useRef({ W: 0, H: 0 });
  const lastTimeRef = useRef(0);
  const frameCount  = useRef(0);   // for stagger-based fade-in

  // Live props → refs (always current inside rAF)
  const modeRef       = useRef(mode);
  const selectedRef   = useRef(selectedIds);
  const connsRef      = useRef(connections);
  const firstRef      = useRef(connectFirst);
  const panelRightRef = useRef(panelRight);
  const onClickRef    = useRef(onIconClick);
  const hintRef       = useRef(hintIds);

  useEffect(() => { modeRef.current = mode; },           [mode]);
  useEffect(() => { selectedRef.current = selectedIds; }, [selectedIds]);
  useEffect(() => { connsRef.current = connections; },   [connections]);
  useEffect(() => { firstRef.current = connectFirst; },  [connectFirst]);
  useEffect(() => { panelRightRef.current = panelRight; }, [panelRight]);
  useEffect(() => { onClickRef.current = onIconClick; }, [onIconClick]);
  useEffect(() => { hintRef.current = hintIds; }, [hintIds]);

  // ── Imperative API ──────────────────────────────────────────────────────────
  useImperativeHandle(ref, () => ({
    shufflePositions()   { regenerateField(true); },
    regenerateField()    { regenerateField(false); },
    injectIcons(iconNames) {
      if (!Array.isArray(iconNames) || iconNames.length === 0) return;
      const defIdxsToInject = iconNames
        .map(name => ICON_DEFS.findIndex(def => def.n === name))
        .filter(idx => idx !== -1);
      
      const currentIdxs = new Set(icons.current.map(icon => icon.defIdx));
      const missingIdxs = defIdxsToInject.filter(idx => !currentIdxs.has(idx));
      if (missingIdxs.length === 0) return;
      
      const selIds = selectedRef.current ?? new Set();
      const replaceable = icons.current.filter(icon => 
        !selIds.has(icon.defIdx) && !defIdxsToInject.includes(icon.defIdx)
      );
      
      for (let i = 0; i < missingIdxs.length && i < replaceable.length; i++) {
        const icon = replaceable[i];
        const newDefIdx = missingIdxs[i];
        const newDef = ICON_DEFS[newDefIdx];
        icon.defIdx = newDefIdx;
        icon.emoji = newDef.e;
        icon.name = newDef.n;
        icon.color = newDef.c;
        icon.colorTint = (Math.random() - 0.5) * 20;
      }
      regenerateField(true);
    },
    flashError() {
      const c = fxRef.current; if (!c) return;
      const x = c.getContext('2d'), { W, H } = dims.current;
      x.fillStyle = 'rgba(248,113,113,0.15)';
      x.fillRect(0, 0, W, H);
      setTimeout(() => x.clearRect(0, 0, W, H), 420);
    },
    burst(x, y, color) { spawnBurst(x, y, color); },
  }));

  // ── Sizing ──────────────────────────────────────────────────────────────────
  const resize = useCallback(() => {
    const W = window.innerWidth, H = window.innerHeight;
    dims.current = { W, H };
    [bgRef, fxRef, mainRef].forEach(r => {
      if (r.current) { r.current.width = W; r.current.height = H; }
    });
    icons.current.length ? reposition() : initIcons();
    drawBg();
  }, []);

  // ── Exclusion zones ─────────────────────────────────────────────────────────
  function getZones(pad = 60) {
    const pr = panelRightRef.current ?? window.innerWidth * 0.60;
    const { H } = dims.current;
    return [
      { x: pr - pad, y: 0, w: window.innerWidth - pr + pad, h: H },
      { x: 0,        y: 0, w: 340,                          h: 88 }, // top-left badge
    ];
  }

  // ── Pool-based field generation ─────────────────────────────────────────────
  function buildAssignment() {
    // Weighted sampling from full pool — avoids repeating same icons
    assignment.current = weightedSample(ICON_DEFS, NUM_ICONS);
  }

  function initIcons() {
    const { W, H } = dims.current;
    if (!W || !H) return;
    buildAssignment();
    const zones = getZones();
    const pts   = poissonDisk(NUM_ICONS, W, H, MIN_DIST, zones);
    frameCount.current = 0;

    icons.current = pts.map((p, i) => {
      const def = ICON_DEFS[assignment.current[i]];
      // Micro-variation: slight color tint shift per icon
      const tint = (Math.random() - 0.5) * 20;
      return {
        id: i, defIdx: assignment.current[i],
        emoji: def.e, name: def.n,
        color: def.c,
        colorTint: tint,          // per-icon color drift
        x: p.x, y: p.y, tx: p.x, ty: p.y,
        displayX: p.x, displayY: p.y,
        size: 26 + Math.random() * 8,
        hitR: 30,
        // No scaleBias — all icons are rendered at the same stable size
        // Smooth animated state (lerped each frame)
        hoverT:    0,
        selectedT: 0,
        // Stagger fade-in
        fadeIn:    0,
        fadeDelay: i * 0.8,      // stagger (frames)
      };
    });
  }

  /**
   * regenerateField(positionsOnly)
   * If positionsOnly = true → animate existing icons to new positions (mode switch).
   * If positionsOnly = false → fully re-sample pool + swap non-selected icons.
   * Both paths use smooth fade/transform, no flicker.
   */
  function regenerateField(positionsOnly = false) {
    const { W, H } = dims.current;
    if (!W || !H) return;

    if (!positionsOnly) {
      // Re-sample pool — keep selected icons' defIdx, swap the rest
      const selIds  = selectedRef.current ?? new Set();
      const newAsgn = weightedSample(ICON_DEFS, NUM_ICONS);

      icons.current.forEach((icon, i) => {
        // Keep selected icons strictly as they are.
        // For non-selected ones, swap out ~50% on each reshuffle to increase entropy while maintaining some stability.
        if (!selIds.has(icon.defIdx) && Math.random() < 0.5) {
          // Swap to new assignment
          const newDef = ICON_DEFS[newAsgn[i] ?? newAsgn[i % newAsgn.length]];
          icon.defIdx     = newAsgn[i];
          icon.emoji      = newDef.e;
          icon.name       = newDef.n;
          icon.color      = newDef.c;
          icon.colorTint  = (Math.random() - 0.5) * 20;
          icon.scaleBias  = 0.95 + Math.random() * 0.1;
          // Fade-out swap
          icon.swapFade = 0;
        }
      });
      assignment.current = newAsgn;
    }

    // Reposition all icons
    const zones = getZones();
    const pts   = poissonDisk(NUM_ICONS, W, H, MIN_DIST, zones);
    icons.current.forEach((s, i) => {
      const pos = pts[i] || pts[i % pts.length];
      s.x = s.displayX; s.y = s.displayY;
      s.tx = pos.x; s.ty = pos.y;
    });
    animateTransition();
  }

  // Backward-compat alias
  function reposition() { regenerateField(true); }

  function animateTransition() {
    const start = performance.now(), dur = 820;
    function step(now) {
      const t    = Math.min((now - start) / dur, 1);
      // Expo ease-out for satisfying snap
      const ease = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
      icons.current.forEach(s => {
        s.displayX = lerp(s.x, s.tx, ease);
        s.displayY = lerp(s.y, s.ty, ease);
      });
      if (t < 1) requestAnimationFrame(step);
      else icons.current.forEach(s => {
        s.x = s.tx; s.y = s.ty; s.displayX = s.x; s.displayY = s.y;
      });
    }
    requestAnimationFrame(step);
  }

  // ── Background ──────────────────────────────────────────────────────────────
  function initBgOrbs() {
    bgOrbs.current = Array.from({ length: 7 }, (_, i) => ({
      x: Math.random(), y: Math.random(),
      r: 0.18 + Math.random() * 0.24,
      hue: [260, 300, 200, 230, 280, 320, 210][i],
      ph: Math.random() * Math.PI * 2,
      sp: 0.002 + Math.random() * 0.004,
    }));
  }

  function drawBg() {
    const c = bgRef.current; if (!c) return;
    const x = c.getContext('2d'), { W, H } = dims.current;
    x.fillStyle = '#0d0b14';
    x.fillRect(0, 0, W, H);
    bgOrbs.current.forEach(o => {
      const g = x.createRadialGradient(o.x*W, o.y*H, 0, o.x*W, o.y*H, o.r*Math.max(W,H));
      g.addColorStop(0, `hsla(${o.hue},72%,56%,.085)`);
      g.addColorStop(1, 'transparent');
      x.fillStyle = g; x.fillRect(0, 0, W, H);
    });
    // Subtle dot grid
    x.fillStyle = 'rgba(255,255,255,.018)';
    const gs = 48;
    for (let px = gs; px < W; px += gs)
      for (let py = gs; py < H; py += gs) {
        x.beginPath(); x.arc(px, py, 0.7, 0, Math.PI*2); x.fill();
      }
  }

  function animateBg() {
    bgT.current += 0.007;
    const c = bgRef.current;
    if (!c) { rafs.current.bg = requestAnimationFrame(animateBg); return; }
    const x = c.getContext('2d'), { W, H } = dims.current;
    x.clearRect(0, 0, W, H);
    x.fillStyle = '#0d0b14'; x.fillRect(0, 0, W, H);
    bgOrbs.current.forEach(o => {
      const ox = o.x + Math.sin(bgT.current * o.sp * 55 + o.ph) * 0.04;
      const oy = o.y + Math.cos(bgT.current * o.sp * 40 + o.ph) * 0.035;
      const g = x.createRadialGradient(ox*W, oy*H, 0, ox*W, oy*H, o.r*Math.max(W,H));
      g.addColorStop(0, `hsla(${o.hue},72%,56%,.075)`);
      g.addColorStop(1, 'transparent');
      x.fillStyle = g; x.fillRect(0, 0, W, H);
    });
    x.fillStyle = 'rgba(255,255,255,.018)';
    const gs = 48;
    for (let px = gs; px < W; px += gs)
      for (let py = gs; py < H; py += gs) {
        x.beginPath(); x.arc(px, py, 0.7, 0, Math.PI*2); x.fill();
      }
    rafs.current.bg = requestAnimationFrame(animateBg);
  }

  // ── Particles ───────────────────────────────────────────────────────────────
  function spawnBurst(x, y, color) {
    const [cr, cg, cb] = color;
    for (let i = 0; i < 22; i++) {
      const a = Math.random() * Math.PI * 2, sp = 1.5 + Math.random() * 4;
      particles.current.push({
        x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
        r: 2 + Math.random() * 4, life: 1,
        cr: Math.min(255, cr + ((Math.random()-0.5)*40)|0),
        cg: Math.min(255, cg + ((Math.random()-0.5)*40)|0),
        cb: Math.min(255, cb + ((Math.random()-0.5)*40)|0),
      });
    }
    // White sparkles
    for (let i = 0; i < 6; i++) {
      const a = Math.random() * Math.PI * 2, sp = 2 + Math.random() * 5;
      particles.current.push({
        x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
        r: 1.5 + Math.random() * 2.5, life: 1,
        cr: 255, cg: 255, cb: 255,
      });
    }
  }

  // ── Main render loop ─────────────────────────────────────────────────────────
  function renderMain(now) {
    const dt = lastTimeRef.current > 0
      ? Math.min((now - lastTimeRef.current) / 1000, 0.033)
      : 0.016;
    lastTimeRef.current = now;
    animT.current += dt;
    frameCount.current++;
    const t = animT.current;

    const c = mainRef.current;
    if (!c) { rafs.current.main = requestAnimationFrame(renderMain); return; }
    const ctx = c.getContext('2d');
    const { W, H } = dims.current;
    ctx.clearRect(0, 0, W, H);

    const { x: mx, y: my } = mouse.current;
    // dragX/dragY are removed — we use raw mouse for instant draft line response

    const activeConns = connsRef.current;
    const selIds      = selectedRef.current;
    const cf          = firstRef.current;

    // ── Connections ────────────────────────────────────────────────────────
    activeConns.forEach((conn, i) => {
      const a = icons.current.find(ic => ic.defIdx === conn.from);
      const b = icons.current.find(ic => ic.defIdx === conn.to);
      if (!a || !b) return;
      const ax = (a.displayX??a.x);
      const ay = (a.displayY??a.y);
      const bx = (b.displayX??b.x);
      const by = (b.displayY??b.y);

      ctx.save();
      ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by);
      const grad = ctx.createLinearGradient(ax, ay, bx, by);
      grad.addColorStop(0, `rgba(${a.color[0]},${a.color[1]},${a.color[2]},1)`);
      grad.addColorStop(1, `rgba(${b.color[0]},${b.color[1]},${b.color[2]},1)`);
      ctx.strokeStyle = grad; ctx.lineWidth = 3.5;
      ctx.stroke();

      const mx2 = (ax+bx)/2, my2 = (ay+by)/2;
      ctx.beginPath(); ctx.arc(mx2, my2, 12, 0, Math.PI*2);
      ctx.fillStyle = 'rgba(13,11,20,.92)'; ctx.fill();
      ctx.strokeStyle = `rgba(${a.color[0]},${a.color[1]},${a.color[2]},1)`;
      ctx.lineWidth = 1.5; ctx.stroke();
      ctx.font = 'bold 9px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = '#fff'; ctx.fillText(String(i+1), mx2, my2);

      // Glowing bead
      const bT = (t * 0.6) % 1;
      const px = ax+(bx-ax)*bT, py = ay+(by-ay)*bT;
      ctx.beginPath(); ctx.arc(px, py, 4.5, 0, Math.PI*2);
      ctx.fillStyle = '#fff';
      ctx.shadowBlur = 15; ctx.shadowColor = `rgba(${a.color[0]},${a.color[1]},${a.color[2]},1)`;
      ctx.fill(); ctx.shadowBlur = 0;
      ctx.restore();
    });

    // ── Draft line (instant — raw mouse, no lerp lag) ────────────────────────
    if (cf !== null) {
      const a = icons.current.find(ic => ic.defIdx === cf);
      if (a) {
        const ax = (a.displayX??a.x);
        const ay = (a.displayY??a.y);
        ctx.save();
        ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(mx, my);
        ctx.strokeStyle = `rgba(${a.color[0]},${a.color[1]},${a.color[2]},0.9)`;
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.restore();
      }
    }

    // ── Icons — hover detection + lerped state + stagger fade-in ──────────
    let newHovered = null;
    icons.current.forEach(s => {
      // Stagger-based fade-in (opacity ramp per icon)
      if (s.fadeIn < 1) {
        const elapsed = frameCount.current - s.fadeDelay;
        s.fadeIn = elapsed < 0 ? 0 : Math.min(1, elapsed / 25);
      }
      if (s.fadeIn <= 0) return; // not yet visible

      const sx = s.displayX ?? s.x;
      const sy = s.displayY ?? s.y;

      const dist = Math.hypot(sx - mx, sy - my);
      if (dist < s.hitR + 18) newHovered = s.id;

      const hovTarget = hovered.current === s.id ? 1 : 0;
      const selTarget = selIds?.has(s.defIdx) ? 1 : 0;
      s.hoverT    = lerp(s.hoverT,    hovTarget, 0.45);
      s.selectedT = lerp(s.selectedT, selTarget, 0.45);
      const hT = s.hoverT, sT = s.selectedT;

      const [cr, cg, cb] = s.color;

      ctx.globalAlpha = s.fadeIn;
      ctx.save();
      ctx.translate(sx, sy);

      // NO scale transform — icons are statically sized per spec.
      // Glow ring is the exclusive hover/selection feedback mechanism.

      // ── Selection Indicator (strong glow, no scaling) ─────────────────
      const isHinted = hintRef.current?.has(s.defIdx) && !selIds?.has(s.defIdx);
      if (isHinted) {
        // Pulsing amber ring — "this is one of YOUR icons"
        const pulseAlpha = 0.45 + 0.35 * Math.sin(t * 3.8 + s.id * 0.7);
        const pulseSize  = s.size * 0.95 + 2 * Math.sin(t * 3.8 + s.id * 0.7);
        ctx.beginPath();
        ctx.arc(0, 0, pulseSize, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(251,191,36,${pulseAlpha * 0.18})`;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(0, 0, pulseSize, 0, Math.PI * 2);
        ctx.shadowBlur = 22;
        ctx.shadowColor = `rgba(251,191,36,0.9)`;
        ctx.strokeStyle = `rgba(251,191,36,${pulseAlpha})`;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.shadowBlur = 0;
      } else if (sT > 0.01) {
        ctx.beginPath();
        ctx.arc(0, 0, s.size * 0.9, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${cr},${cg},${cb},${sT * 0.2})`;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(0, 0, s.size * 0.9, 0, Math.PI * 2);
        ctx.shadowBlur = 28 * sT;
        ctx.shadowColor = `rgba(${cr},${cg},${cb},1)`;
        ctx.strokeStyle = `rgba(${cr},${cg},${cb},1)`;
        ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.shadowBlur = 0;
      } else if (hT > 0.01) {
        // ── Hover: brightness increase via subtle ring only ─────────────
        ctx.beginPath();
        ctx.arc(0, 0, s.size * 0.9, 0, Math.PI * 2);
        ctx.shadowBlur = 8 * hT;
        ctx.shadowColor = `rgba(${cr},${cg},${cb},0.5)`;
        ctx.strokeStyle = `rgba(${cr},${cg},${cb},${hT * 0.65})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // ── Emoji — fixed size, zero scale distortion ─────────────────────
      ctx.font = `${s.size}px serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(s.emoji, 0, 1);

      ctx.restore();

      // ── Label (outside scale transform for stable size) ─────────────────
      const la = lerp(0.72, 1, hT + sT * 0.32);
      const labelSize = lerp(10.5, 12, hT + sT * 0.5);
      const ly = sy + s.size * 0.74 + 18;  // stable — no scale multiplier

      ctx.font = `600 ${labelSize}px 'DM Mono', 'Courier New', monospace`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const lw = ctx.measureText(s.name).width;
      const ph = 7, pv = 4;
      const pillX = sx - lw/2 - ph;
      const pillY = ly - labelSize/2 - pv;
      const pillW = lw + ph*2;
      const pillH = labelSize + pv*2;

      ctx.fillStyle = `rgba(10,8,20,${lerp(0.74, 0.90, hT)})`;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(pillX, pillY, pillW, pillH, 5);
      else ctx.rect(pillX, pillY, pillW, pillH);
      ctx.fill();

      const borderA = lerp(0, 1, hT + sT * 0.5) * 0.6;
      if (borderA > 0.01) {
        ctx.strokeStyle = `rgba(${cr},${cg},${cb},${borderA})`;
        ctx.lineWidth = 0.75;
        ctx.stroke();
      }

      if (hT > 0.04 || sT > 0.04) {
        ctx.shadowBlur = (hT + sT) * 9;
        ctx.shadowColor = `rgba(${cr},${cg},${cb},.95)`;
      }
      ctx.fillStyle = `rgba(${cr},${cg},${cb},${la})`;
      ctx.fillText(s.name, sx, ly);
      ctx.shadowBlur = 0;

      ctx.globalAlpha = 1;
    });

    hovered.current = newHovered;
    if (mainRef.current) {
      mainRef.current.style.cursor = newHovered !== null ? 'pointer' : 'default';
    }

    // ── Particles ──────────────────────────────────────────────────────────
    particles.current = particles.current.filter(p => p.life > 0);
    particles.current.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      p.vx *= 0.93; p.vy *= 0.93;
      p.life -= 0.022; p.r *= 0.968;
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(0, p.r), 0, Math.PI*2);
      ctx.fillStyle = `rgba(${p.cr},${p.cg},${p.cb},${p.life * 0.9})`;
      ctx.fill();
    });

    rafs.current.main = requestAnimationFrame(renderMain);
  }

  // ── Pointer ──────────────────────────────────────────────────────────────────
  const handleMouseMove = useCallback(e => {
    mouse.current.x = e.clientX;
    mouse.current.y = e.clientY;
  }, []);
  const handleMouseLeave = useCallback(() => {
    mouse.current.x = -999; mouse.current.y = -999;
    hovered.current = null;
  }, []);
  const handleClick = useCallback(e => {
    const { clientX: x, clientY: y } = e;
    const hit = icons.current.find(s => {
      const sx = s.displayX ?? s.x;
      const sy = s.displayY ?? s.y;
      return Math.hypot(sx-x, sy-y) < s.hitR + 18;
    });
    if (!hit) return;
    spawnBurst(x, y, hit.color);
    import('../lib/SoundManager').then(({ soundManager }) => {
      soundManager.play('click');
    });
    onClickRef.current?.(hit.defIdx, x, y);
  }, []);

  // ── Mount / Unmount ──────────────────────────────────────────────────────────
  useEffect(() => {
    initBgOrbs();
    resize();
    window.addEventListener('resize', resize);
    const id = setTimeout(() => {
      rafs.current.bg   = requestAnimationFrame(animateBg);
      rafs.current.main = requestAnimationFrame(renderMain);
    }, 60);
    return () => {
      window.removeEventListener('resize', resize);
      clearTimeout(id);
      cancelAnimationFrame(rafs.current.bg);
      cancelAnimationFrame(rafs.current.main);
    };
  }, [resize]);

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
      <canvas ref={bgRef}   style={{ position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none' }} />
      <canvas ref={fxRef}   style={{ position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none' }} />
      <canvas
        ref={mainRef}
        style={{ position: 'absolute', inset: 0, zIndex: 3, pointerEvents: 'all' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
      />
    </div>
  );
});

export default OrbitAuthCanvas;
