/**
 * glyphEngine.js — Ancient Rune System for StarWeave
 *
 * 9 hand-crafted ancient glyphs spanning:
 *  • Sanskrit / Vedic: ॐ (Om), ∞ (Ananta), Chakra wheel
 *  • Norse Elder Futhark: ᚠ (Fehu), ᚢ (Uruz), ᚦ (Thurisaz), ᛟ (Othala), ᛉ (Algiz), ᛏ (Tiwaz)
 *  • Greek esoteric: Φ (Phi), Ψ (Psi), Ω (Omega), Δ (Delta), Θ (Theta), Σ (Sigma), Λ (Lambda)
 *
 * Design rules for sharpness:
 *  1. lineWidth always ≥ 2, drawn in crisp strokes — no hairlines
 *  2. All paths start anchored to the center (0,0) in a radius-R grid
 *  3. lineCap = 'round', lineJoin = 'round' — organic but precise
 *  4. NO complex transforms — simple coords, maximum browser canvas precision
 *
 * Each draw(ctx, R) receives ctx already translated/scaled by the caller.
 */

export const STELLAR_GLYPHS = [

  // ── 1. Om (ॐ) — Sanskrit, the primordial sound ─────────────────────────────
  {
    label: 'Om',
    hue:   55,    // warm gold
    baseX: 0.50,
    baseY: 0.18,
    draw(ctx, R) {
      const s = R * 0.62;
      ctx.lineWidth = 2.2;
      ctx.lineCap  = 'round';
      ctx.lineJoin = 'round';
      // Lower curve (the "3" shape base of Om)
      ctx.beginPath();
      ctx.arc(s * 0.12, s * 0.25, s * 0.50, Math.PI * 1.05, Math.PI * 0.05, false);
      ctx.stroke();
      // Upper smaller curve
      ctx.beginPath();
      ctx.arc(s * 0.12, -s * 0.18, s * 0.30, Math.PI * 1.1, Math.PI * 0.0, false);
      ctx.stroke();
      // Left descent hook
      ctx.beginPath();
      ctx.moveTo(-s * 0.40, s * 0.75);
      ctx.bezierCurveTo(-s * 0.40, s * 0.40, s * 0.55, s * 0.38, s * 0.55, s * 0.72);
      ctx.stroke();
      // Virama (the diacritical curve above + dot)
      ctx.beginPath();
      ctx.arc(-s * 0.10, -s * 0.72, s * 0.22, Math.PI * 1.15, Math.PI * 0.0, false);
      ctx.stroke();
      ctx.globalAlpha *= 0.85;
      ctx.beginPath();
      ctx.arc(s * 0.16, -s * 0.90, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha /= 0.85;
    },
  },

  // ── 2. Fehu (ᚠ) — Norse rune of wealth & cattle ───────────────────────────
  {
    label: 'Fehu',
    hue:   195,   // ocean cyan
    baseX: 0.22,
    baseY: 0.34,
    draw(ctx, R) {
      const s = R * 0.62;
      ctx.lineWidth = 2.2;
      ctx.lineCap  = 'round';
      ctx.lineJoin = 'round';
      // Vertical stave
      ctx.beginPath();
      ctx.moveTo(-s * 0.25, -s * 1.0);
      ctx.lineTo(-s * 0.25,  s * 1.0);
      ctx.stroke();
      // Upper branch (angled right)
      ctx.beginPath();
      ctx.moveTo(-s * 0.25, -s * 0.55);
      ctx.lineTo( s * 0.65, -s * 0.10);
      ctx.stroke();
      // Lower branch (angled right, shallower)
      ctx.beginPath();
      ctx.moveTo(-s * 0.25,  s * 0.05);
      ctx.lineTo( s * 0.65,  s * 0.50);
      ctx.stroke();
      // Subtle accent dot at branching origin
      ctx.globalAlpha *= 0.55;
      ctx.beginPath();
      ctx.arc(-s * 0.25, -s * 0.25, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha /= 0.55;
    },
  },

  // ── 3. Thurisaz (ᚦ) — Norse rune of the thorn & giants ───────────────────
  {
    label: 'Thurisaz',
    hue:   340,   // crimson
    baseX: 0.78,
    baseY: 0.34,
    draw(ctx, R) {
      const s = R * 0.62;
      ctx.lineWidth = 2.2;
      ctx.lineCap  = 'round';
      ctx.lineJoin = 'round';
      // Vertical stave
      ctx.beginPath();
      ctx.moveTo(-s * 0.18, -s * 1.0);
      ctx.lineTo(-s * 0.18,  s * 1.0);
      ctx.stroke();
      // Large thorn (triangle pointing right)
      ctx.beginPath();
      ctx.moveTo(-s * 0.18, -s * 0.55);
      ctx.lineTo( s * 0.70,  0);
      ctx.lineTo(-s * 0.18,  s * 0.55);
      ctx.closePath();
      ctx.stroke();
    },
  },

  // ── 4. Algiz (ᛉ) — Norse rune of protection & the elk ────────────────────
  {
    label: 'Algiz',
    hue:   160,   // emerald
    baseX: 0.15,
    baseY: 0.58,
    draw(ctx, R) {
      const s = R * 0.62;
      ctx.lineWidth = 2.2;
      ctx.lineCap  = 'round';
      ctx.lineJoin = 'round';
      // Central vertical stave
      ctx.beginPath();
      ctx.moveTo(0, s * 0.9);
      ctx.lineTo(0, -s * 0.4);
      ctx.stroke();
      // Left upper arm
      ctx.beginPath();
      ctx.moveTo(0, -s * 0.4);
      ctx.lineTo(-s * 0.6, -s * 1.0);
      ctx.stroke();
      // Right upper arm
      ctx.beginPath();
      ctx.moveTo(0, -s * 0.4);
      ctx.lineTo( s * 0.6, -s * 1.0);
      ctx.stroke();
      // Subtle center dot at fork
      ctx.globalAlpha *= 0.6;
      ctx.beginPath();
      ctx.arc(0, -s * 0.4, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha /= 0.6;
    },
  },

  // ── 5. Othala (ᛟ) — Norse rune of heritage & ancestral home ──────────────
  {
    label: 'Othala',
    hue:   30,    // amber
    baseX: 0.85,
    baseY: 0.58,
    draw(ctx, R) {
      const s = R * 0.60;
      ctx.lineWidth = 2.2;
      ctx.lineCap  = 'round';
      ctx.lineJoin = 'round';
      // Diamond top (rotated square)
      ctx.beginPath();
      ctx.moveTo(0,      -s * 0.95);
      ctx.lineTo( s * 0.62, -s * 0.05);
      ctx.lineTo(0,       s * 0.25);
      ctx.lineTo(-s * 0.62, -s * 0.05);
      ctx.closePath();
      ctx.stroke();
      // Left descending foot
      ctx.beginPath();
      ctx.moveTo(-s * 0.62, -s * 0.05);
      ctx.lineTo(-s * 0.62,  s * 0.90);
      ctx.stroke();
      // Right descending foot
      ctx.beginPath();
      ctx.moveTo( s * 0.62, -s * 0.05);
      ctx.lineTo( s * 0.62,  s * 0.90);
      ctx.stroke();
    },
  },

  // ── 6. Tiwaz (ᛏ) — Norse rune of Tyr, justice & the spear ───────────────
  {
    label: 'Tiwaz',
    hue:   210,   // deep sapphire
    baseX: 0.35,
    baseY: 0.76,
    draw(ctx, R) {
      const s = R * 0.62;
      ctx.lineWidth = 2.2;
      ctx.lineCap  = 'round';
      ctx.lineJoin = 'round';
      // Arrow up (spear)
      ctx.beginPath();
      ctx.moveTo(-s * 0.55, -s * 0.20);
      ctx.lineTo(0,         -s * 0.95);
      ctx.lineTo( s * 0.55, -s * 0.20);
      ctx.stroke();
      // Vertical shaft
      ctx.beginPath();
      ctx.moveTo(0, -s * 0.95);
      ctx.lineTo(0,  s * 0.95);
      ctx.stroke();
    },
  },

  // ── 7. Phi (Φ) — Greek letter, golden ratio & philosophy ─────────────────
  {
    label: 'Phi',
    hue:   280,   // violet
    baseX: 0.65,
    baseY: 0.76,
    draw(ctx, R) {
      const s = R * 0.60;
      ctx.lineWidth = 2.2;
      ctx.lineCap  = 'round';
      // Circle
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.72, 0, Math.PI * 2);
      ctx.stroke();
      // Vertical line through center
      ctx.beginPath();
      ctx.moveTo(0, -s * 1.0);
      ctx.lineTo(0,  s * 1.0);
      ctx.stroke();
    },
  },

  // ── 8. Psi (Ψ) — Greek letter, soul, parapsychology ─────────────────────
  {
    label: 'Psi',
    hue:   125,   // green
    baseX: 0.28,
    baseY: 0.50,
    draw(ctx, R) {
      const s = R * 0.60;
      ctx.lineWidth = 2.2;
      ctx.lineCap  = 'round';
      ctx.lineJoin = 'round';
      // Central vertical
      ctx.beginPath();
      ctx.moveTo(0, -s * 0.4);
      ctx.lineTo(0,  s * 1.0);
      ctx.stroke();
      // Horizontal base bar
      ctx.beginPath();
      ctx.moveTo(-s * 0.55, s * 0.70);
      ctx.lineTo( s * 0.55, s * 0.70);
      ctx.stroke();
      // Left arc arm
      ctx.beginPath();
      ctx.moveTo(-s * 0.55, s * 0.70);
      ctx.lineTo(-s * 0.55, -s * 0.25);
      ctx.bezierCurveTo(-s * 0.55, -s * 1.02, s * 0.55, -s * 1.02, s * 0.55, -s * 0.25);
      ctx.lineTo( s * 0.55, s * 0.70);
      ctx.stroke();
    },
  },

  // ── 9. Theta (Θ) — Greek letter, divine & the unknown ────────────────────
  {
    label: 'Theta',
    hue:   300,   // magenta
    baseX: 0.72,
    baseY: 0.50,
    draw(ctx, R) {
      const s = R * 0.62;
      ctx.lineWidth = 2.2;
      ctx.lineCap  = 'round';
      // Outer ellipse
      ctx.beginPath();
      ctx.ellipse(0, 0, s * 0.72, s * 0.95, 0, 0, Math.PI * 2);
      ctx.stroke();
      // Horizontal crossbar
      ctx.beginPath();
      ctx.moveTo(-s * 0.72, 0);
      ctx.lineTo( s * 0.72, 0);
      ctx.stroke();
    },
  },

];

// ─────────────────────────────────────────────────────────────────────────────
// Additional glyphs pool (used when server sends extended config)
// Drawn the same way — ancient & sharp.
// ─────────────────────────────────────────────────────────────────────────────
const EXTENDED_GLYPHS = [

  // Omega (Ω) — Greek, the end, omega point
  {
    label: 'Omega',
    hue:   15,
    baseX: 0.50, baseY: 0.50,
    draw(ctx, R) {
      const s = R * 0.60;
      ctx.lineWidth = 2.2; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.arc(0, -s * 0.15, s * 0.72, Math.PI * 0.15, Math.PI * 0.85, false);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-s * 0.75, s * 0.60);
      ctx.lineTo(-s * 0.40, s * 0.60);
      ctx.moveTo( s * 0.75, s * 0.60);
      ctx.lineTo( s * 0.40, s * 0.60);
      ctx.stroke();
      // Feet touching arc endpoints
      ctx.beginPath();
      const ax = Math.cos(Math.PI * 0.85) * s * 0.72;
      const ay = Math.sin(Math.PI * 0.85) * s * 0.72 - s * 0.15;
      ctx.moveTo(-ax, ay);
      ctx.lineTo(-s * 0.40, s * 0.60);
      ctx.moveTo( ax, ay);
      ctx.lineTo( s * 0.40, s * 0.60);
      ctx.stroke();
    },
  },

  // Delta (Δ) — Greek, change & the triangle
  {
    label: 'Delta',
    hue:   45,
    baseX: 0.50, baseY: 0.50,
    draw(ctx, R) {
      const s = R * 0.65;
      ctx.lineWidth = 2.2; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(0, -s * 0.95);
      ctx.lineTo( s * 0.82, s * 0.78);
      ctx.lineTo(-s * 0.82, s * 0.78);
      ctx.closePath();
      ctx.stroke();
      // Inner horizontal detail
      ctx.globalAlpha *= 0.4;
      ctx.beginPath();
      ctx.moveTo(-s * 0.38, s * 0.10);
      ctx.lineTo( s * 0.38, s * 0.10);
      ctx.stroke();
      ctx.globalAlpha /= 0.4;
    },
  },

  // Uruz (ᚢ) — Norse rune of primal strength
  {
    label: 'Uruz',
    hue:   80,
    baseX: 0.50, baseY: 0.50,
    draw(ctx, R) {
      const s = R * 0.62;
      ctx.lineWidth = 2.2; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(-s * 0.45, -s * 1.0);
      ctx.lineTo(-s * 0.45,  s * 0.45);
      ctx.bezierCurveTo(-s * 0.45, s * 1.05, s * 0.55, s * 1.05, s * 0.55, s * 0.45);
      ctx.lineTo( s * 0.55, -s * 1.0);
      ctx.stroke();
    },
  },

  // Sigma (Σ) — Greek, summation & entropy
  {
    label: 'Sigma',
    hue:   110,
    baseX: 0.50, baseY: 0.50,
    draw(ctx, R) {
      const s = R * 0.60;
      ctx.lineWidth = 2.2; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo( s * 0.60, -s * 0.95);
      ctx.lineTo(-s * 0.60, -s * 0.95);
      ctx.lineTo( s * 0.35,  0);
      ctx.lineTo(-s * 0.60,  s * 0.95);
      ctx.lineTo( s * 0.60,  s * 0.95);
      ctx.stroke();
    },
  },

  // Lambda (Λ) — Greek, cosmological constant
  {
    label: 'Lambda',
    hue:   240,
    baseX: 0.50, baseY: 0.50,
    draw(ctx, R) {
      const s = R * 0.65;
      ctx.lineWidth = 2.2; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(-s * 0.82, s * 0.95);
      ctx.lineTo(0,         -s * 0.95);
      ctx.lineTo( s * 0.82,  s * 0.95);
      ctx.stroke();
      ctx.globalAlpha *= 0.45;
      ctx.beginPath();
      ctx.moveTo(-s * 0.35, s * 0.30);
      ctx.lineTo( s * 0.35, s * 0.30);
      ctx.stroke();
      ctx.globalAlpha /= 0.45;
    },
  },
];

// Full pool for random selection
export const ALL_GLYPHS = [...STELLAR_GLYPHS, ...EXTENDED_GLYPHS];

/**
 * Returns the canonical glyph color for a given label.
 */
export function getGlyphHue(label) {
  const g = ALL_GLYPHS.find(g => g.label === label);
  return g?.hue ?? 270;
}

/**
 * Returns the draw function for a given glyph label.
 */
export function getGlyphDraw(label) {
  const g = ALL_GLYPHS.find(g => g.label === label);
  return g?.draw ?? null;
}

/**
 * GLYPH_NODES — the 9 canonical nodes used per session.
 * Exported for gestureEngine compatibility.
 */
export const GLYPH_NODES = STELLAR_GLYPHS.map(({ label, hue, baseX, baseY }) => ({
  emoji: null,
  label,
  hue,
  baseX,
  baseY,
  isSignature: false,
}));
