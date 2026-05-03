// =============================================================================
// OrbitChatTheme.js
// Maps existing Orbit theme store IDs → CSS variable sets for the new chat UI.
// Derived from orbit-messaging.html theme engine + ChatCoreUI.jsx token palette.
// =============================================================================

export const ORBIT_CHAT_THEMES = {
  // ── Vampire / Dark ──────────────────────────────────────────────────────────
  vampire: {
    id: "vampire",
    font: "'Syne', 'Cinzel', sans-serif",
    fontMono: "'Space Mono', monospace",
    "--acc":       "#e879f9",
    "--acc2":      "#a855f7",
    "--bg":        "#0d0d1a",
    "--bg2":       "#13132b",
    "--bg3":       "#1a1a3e",
    "--glass":     "rgba(255,255,255,0.06)",
    "--glass2":    "rgba(255,255,255,0.12)",
    "--border":    "rgba(232,121,249,0.28)",
    "--text":      "#f0e6ff",
    "--text2":     "#c4b5fd",
    "--sent-bg":   "rgba(168,85,247,0.22)",
    "--recv-bg":   "rgba(26,26,62,0.85)",
    "--shadow":    "0 8px 32px rgba(168,85,247,0.18)",
    "--radius":    "20px",
    "--blur":      "20px",
    scanlines: false,
    clouds: false,
    glowBorders: true,
    cyberPrefix: false,
    reactions: ["🩸","🦇","💀","🌹","🔮","⚰️"],
    decorator: "🦇",
  },

  // ── Amoled / Vault Obsidian ─────────────────────────────────────────────────
  amoled: {
    id: "amoled",
    font: "'Playfair Display', serif",
    fontMono: "'Space Mono', monospace",
    "--acc":       "#c9a84c",
    "--acc2":      "#e8c96a",
    "--bg":        "#000000",
    "--bg2":       "#050400",
    "--bg3":       "#0e0a00",
    "--glass":     "rgba(201,168,76,0.05)",
    "--glass2":    "rgba(201,168,76,0.1)",
    "--border":    "rgba(201,168,76,0.25)",
    "--text":      "#f0e6c0",
    "--text2":     "#8a7440",
    "--sent-bg":   "rgba(90,66,0,0.5)",
    "--recv-bg":   "rgba(6,4,0,0.95)",
    "--shadow":    "0 8px 32px rgba(201,168,76,0.18)",
    "--radius":    "18px",
    "--blur":      "16px",
    scanlines: false,
    clouds: false,
    glowBorders: true,
    cyberPrefix: false,
    reactions: ["💎","👑","🥇","✨","🔑","🏆"],
    decorator: "💎",
  },

  // ── Neon Cyberpunk ──────────────────────────────────────────────────────────
  cyberpunk: {
    id: "cyberpunk",
    font: "'Space Mono', monospace",
    fontMono: "'Space Mono', monospace",
    "--acc":       "#00ff9d",
    "--acc2":      "#00d4ff",
    "--bg":        "#000a06",
    "--bg2":       "#001408",
    "--bg3":       "#00200d",
    "--glass":     "rgba(0,255,157,0.05)",
    "--glass2":    "rgba(0,255,157,0.1)",
    "--border":    "rgba(0,255,157,0.4)",
    "--text":      "#ccffe8",
    "--text2":     "#00ff9d",
    "--sent-bg":   "rgba(0,255,157,0.1)",
    "--recv-bg":   "rgba(0,20,8,0.94)",
    "--shadow":    "0 8px 32px rgba(0,255,157,0.12)",
    "--radius":    "4px",
    "--blur":      "10px",
    scanlines: true,
    clouds: false,
    glowBorders: true,
    cyberPrefix: true,
    reactions: ["⚡","🔮","💜","🕹️","🌐","☠️"],
    decorator: "⚡",
  },

  // ── Gamer / Overdrive ───────────────────────────────────────────────────────
  gamer: {
    id: "gamer",
    font: "'Orbitron', 'Space Mono', sans-serif",
    fontMono: "'Orbitron', monospace",
    "--acc":       "#00ff41",
    "--acc2":      "#ff3131",
    "--bg":        "#010308",
    "--bg2":       "#020409",
    "--bg3":       "#030c06",
    "--glass":     "rgba(0,255,65,0.04)",
    "--glass2":    "rgba(0,255,65,0.1)",
    "--border":    "rgba(0,255,65,0.35)",
    "--text":      "#d4ffdc",
    "--text2":     "#5aaa6a",
    "--sent-bg":   "rgba(0,255,65,0.12)",
    "--recv-bg":   "rgba(3,12,6,0.94)",
    "--shadow":    "0 8px 32px rgba(0,255,65,0.15)",
    "--radius":    "6px",
    "--blur":      "12px",
    scanlines: true,
    clouds: false,
    glowBorders: true,
    cyberPrefix: true,
    reactions: ["🔥","💀","🎮","⚡","🏆","🎯"],
    decorator: "🎮",
  },

  // ── Pastel Dream / Barbie ───────────────────────────────────────────────────
  pastel: {
    id: "pastel",
    font: "'Nunito', 'Quicksand', sans-serif",
    fontMono: "'Nunito', sans-serif",
    "--acc":       "#f472b6",
    "--acc2":      "#c084fc",
    "--bg":        "#fef0f8",
    "--bg2":       "#fff5fb",
    "--bg3":       "#fce7f3",
    "--glass":     "rgba(255,255,255,0.7)",
    "--glass2":    "rgba(255,255,255,0.9)",
    "--border":    "rgba(244,114,182,0.4)",
    "--text":      "#4a1942",
    "--text2":     "#9d174d",
    "--sent-bg":   "rgba(244,114,182,0.2)",
    "--recv-bg":   "rgba(255,255,255,0.88)",
    "--shadow":    "0 8px 32px rgba(244,114,182,0.2)",
    "--radius":    "30px",
    "--blur":      "15px",
    scanlines: false,
    clouds: true,
    glowBorders: false,
    cyberPrefix: false,
    reactions: ["💖","✨","🌸","💅","🦄","🍭"],
    decorator: "🌸",
  },

  // ── Premium / Light ─────────────────────────────────────────────────────────
  premium: {
    id: "premium",
    font: "'Cormorant Garamond', serif",
    fontMono: "'Space Mono', monospace",
    "--acc":       "#8b6914",
    "--acc2":      "#c8a84b",
    "--bg":        "#f7f4ee",
    "--bg2":       "#ffffff",
    "--bg3":       "#f0ebe0",
    "--glass":     "rgba(255,255,255,0.8)",
    "--glass2":    "rgba(255,255,255,0.95)",
    "--border":    "rgba(139,105,20,0.25)",
    "--text":      "#1a140a",
    "--text2":     "#6b5a3a",
    "--sent-bg":   "rgba(200,168,75,0.18)",
    "--recv-bg":   "rgba(255,255,255,0.95)",
    "--shadow":    "0 8px 32px rgba(139,105,20,0.12)",
    "--radius":    "22px",
    "--blur":      "14px",
    scanlines: false,
    clouds: false,
    glowBorders: false,
    cyberPrefix: false,
    reactions: ["✨","💎","👑","🥂","🌹","⚜️"],
    decorator: "⚜️",
  },
};

// Maps the useThemeStore IDs → ORBIT_CHAT_THEMES keys
export const THEME_ID_MAP = {
  "dark":              "vampire",
  "amoled-dark":       "amoled",
  "neon-cyberpunk":    "cyberpunk",
  "gamer-high-energy": "gamer",
  "pastel-dream":      "pastel",
  "light":             "premium",
  // fallbacks for direct matches
  "vampire":   "vampire",
  "amoled":    "amoled",
  "cyberpunk": "cyberpunk",
  "gamer":     "gamer",
  "pastel":    "pastel",
  "barbie":    "pastel",
  "premium":   "premium",
};

/**
 * Resolves a useThemeStore id → ORBIT_CHAT_THEMES token object.
 */
export function resolveTheme(storeThemeId) {
  const key = THEME_ID_MAP[storeThemeId] || "vampire";
  return ORBIT_CHAT_THEMES[key] || ORBIT_CHAT_THEMES.vampire;
}

/**
 * Injects CSS variables for the given theme onto a DOM element (default: :root).
 */
export function injectOrbitChatVars(themeObj, el = document.documentElement) {
  Object.entries(themeObj).forEach(([k, v]) => {
    if (k.startsWith("--")) el.style.setProperty(k, v);
  });
  el.style.setProperty("--orbit-font", themeObj.font);
  el.style.setProperty("--orbit-mono", themeObj.fontMono);
}
