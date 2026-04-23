/**
 * Orbit Auth: Icon Library
 *
 * HIGH-ENTROPY ICON SYSTEM
 * - 80+ icons for attack surface expansion
 * - Session-based dynamic replacement (login mode)
 * - Deterministic positioning (signup mode)
 * - Credential icons ALWAYS visible, non-credentials RANDOMIZED
 */

/**
 * ICON DATABASE (80+ items)
 * - Mapped to backend labels (A0-H9 = 16*8 = 128 possible)
 * - Diverse categories to prevent pattern memorization
 */
export const ICON_DATABASE = {
  fruits: [
    {
      name: "apple",
      emoji: "🍎",
      color: "#DC143C",
      secondaryColor: "#FF6347",
      difficulty: "easy",
      memorability: 0.98,
    },
    {
      name: "banana",
      emoji: "🍌",
      color: "#FFD700",
      secondaryColor: "#FFC700",
      difficulty: "easy",
      memorability: 0.95,
    },
    {
      name: "orange",
      emoji: "🍊",
      color: "#FF8C00",
      secondaryColor: "#FFA500",
      difficulty: "easy",
      memorability: 0.92,
    },
    {
      name: "grape",
      emoji: "🍇",
      color: "#663399",
      secondaryColor: "#8B008B",
      difficulty: "medium",
      memorability: 0.85,
    },
    {
      name: "strawberry",
      emoji: "🍓",
      color: "#FF1493",
      secondaryColor: "#FF69B4",
      difficulty: "easy",
      memorability: 0.96,
    },
    {
      name: "watermelon",
      emoji: "🍉",
      color: "#DC143C",
      secondaryColor: "#228B22",
      difficulty: "easy",
      memorability: 0.91,
    },
    {
      name: "kiwi",
      emoji: "🥝",
      color: "#228B22",
      secondaryColor: "#32CD32",
      difficulty: "medium",
      memorability: 0.84,
    },
    {
      name: "pineapple",
      emoji: "🍍",
      color: "#FFD700",
      secondaryColor: "#FF8C00",
      difficulty: "easy",
      memorability: 0.89,
    },
  ],
  animals: [
    {
      name: "dog",
      emoji: "🐕",
      color: "#8B4513",
      secondaryColor: "#A0522D",
      difficulty: "easy",
      memorability: 0.99,
    },
    {
      name: "cat",
      emoji: "🐱",
      color: "#FF8C00",
      secondaryColor: "#FFB347",
      difficulty: "easy",
      memorability: 0.97,
    },
    {
      name: "owl",
      emoji: "🦉",
      color: "#696969",
      secondaryColor: "#A9A9A9",
      difficulty: "medium",
      memorability: 0.88,
    },
    {
      name: "fox",
      emoji: "🦊",
      color: "#FF6347",
      secondaryColor: "#FF8C00",
      difficulty: "medium",
      memorability: 0.9,
    },
    {
      name: "butterfly",
      emoji: "🦋",
      color: "#FF1493",
      secondaryColor: "#DDA0DD",
      difficulty: "medium",
      memorability: 0.86,
    },
    {
      name: "lion",
      emoji: "🦁",
      color: "#FFB347",
      secondaryColor: "#FF8C00",
      difficulty: "easy",
      memorability: 0.92,
    },
    {
      name: "penguin",
      emoji: "🐧",
      color: "#000000",
      secondaryColor: "#FFFFFF",
      difficulty: "easy",
      memorability: 0.93,
    },
    {
      name: "elephant",
      emoji: "🐘",
      color: "#808080",
      secondaryColor: "#A9A9A9",
      difficulty: "easy",
      memorability: 0.91,
    },
    {
      name: "eagle",
      emoji: "🦅",
      color: "#8B4513",
      secondaryColor: "#FFD700",
      difficulty: "medium",
      memorability: 0.87,
    },
    {
      name: "rabbit",
      emoji: "🐰",
      color: "#FFB6C1",
      secondaryColor: "#FFFFFF",
      difficulty: "easy",
      memorability: 0.94,
    },
  ],
  objects: [
    {
      name: "book",
      emoji: "📚",
      color: "#8B0000",
      secondaryColor: "#DC143C",
      difficulty: "easy",
      memorability: 0.93,
    },
    {
      name: "key",
      emoji: "🔑",
      color: "#FFD700",
      secondaryColor: "#FFA500",
      difficulty: "easy",
      memorability: 0.96,
    },
    {
      name: "rocket",
      emoji: "🚀",
      color: "#FF4500",
      secondaryColor: "#FF6347",
      difficulty: "medium",
      memorability: 0.89,
    },
    {
      name: "clock",
      emoji: "🕐",
      color: "#4169E1",
      secondaryColor: "#1E90FF",
      difficulty: "medium",
      memorability: 0.84,
    },
    {
      name: "lamp",
      emoji: "💡",
      color: "#FFD700",
      secondaryColor: "#FFA500",
      difficulty: "easy",
      memorability: 0.91,
    },
    {
      name: "lock",
      emoji: "🔒",
      color: "#DC143C",
      secondaryColor: "#FFD700",
      difficulty: "easy",
      memorability: 0.95,
    },
    {
      name: "crown",
      emoji: "👑",
      color: "#FFD700",
      secondaryColor: "#FF4500",
      difficulty: "easy",
      memorability: 0.94,
    },
    {
      name: "diamond",
      emoji: "💎",
      color: "#00CED1",
      secondaryColor: "#1E90FF",
      difficulty: "easy",
      memorability: 0.92,
    },
    {
      name: "gift",
      emoji: "🎁",
      color: "#DC143C",
      secondaryColor: "#FFD700",
      difficulty: "easy",
      memorability: 0.9,
    },
    {
      name: "map",
      emoji: "🗺️",
      color: "#8B4513",
      secondaryColor: "#FFD700",
      difficulty: "medium",
      memorability: 0.85,
    },
    {
      name: "compass",
      emoji: "🧭",
      color: "#8B4513",
      secondaryColor: "#FFD700",
      difficulty: "medium",
      memorability: 0.83,
    },
    {
      name: "telescope",
      emoji: "🔭",
      color: "#708090",
      secondaryColor: "#A9A9A9",
      difficulty: "medium",
      memorability: 0.81,
    },
  ],
  abstract: [
    {
      name: "star",
      emoji: "⭐",
      color: "#FFD700",
      secondaryColor: "#FFA500",
      difficulty: "easy",
      memorability: 0.94,
    },
    {
      name: "heart",
      emoji: "❤️",
      color: "#DC143C",
      secondaryColor: "#FF1493",
      difficulty: "easy",
      memorability: 0.99,
    },
    {
      name: "fire",
      emoji: "🔥",
      color: "#FF4500",
      secondaryColor: "#FFD700",
      difficulty: "easy",
      memorability: 0.95,
    },
    {
      name: "lightning",
      emoji: "⚡",
      color: "#FFD700",
      secondaryColor: "#FFA500",
      difficulty: "medium",
      memorability: 0.87,
    },
    {
      name: "moon",
      emoji: "🌙",
      color: "#FFFACD",
      secondaryColor: "#FFD700",
      difficulty: "medium",
      memorability: 0.85,
    },
    {
      name: "sun",
      emoji: "☀️",
      color: "#FFD700",
      secondaryColor: "#FFA500",
      difficulty: "easy",
      memorability: 0.96,
    },
    {
      name: "snowflake",
      emoji: "❄️",
      color: "#87CEEB",
      secondaryColor: "#1E90FF",
      difficulty: "medium",
      memorability: 0.86,
    },
    {
      name: "sparkle",
      emoji: "✨",
      color: "#FFD700",
      secondaryColor: "#FF1493",
      difficulty: "easy",
      memorability: 0.88,
    },
    {
      name: "bomb",
      emoji: "💣",
      color: "#000000",
      secondaryColor: "#FF4500",
      difficulty: "medium",
      memorability: 0.82,
    },
    {
      name: "gear",
      emoji: "⚙️",
      color: "#708090",
      secondaryColor: "#A9A9A9",
      difficulty: "medium",
      memorability: 0.8,
    },
  ],
  nature: [
    {
      name: "tree",
      emoji: "🌳",
      color: "#228B22",
      secondaryColor: "#00AA00",
      difficulty: "easy",
      memorability: 0.9,
    },
    {
      name: "flower",
      emoji: "🌸",
      color: "#FF69B4",
      secondaryColor: "#FF1493",
      difficulty: "easy",
      memorability: 0.92,
    },
    {
      name: "ocean",
      emoji: "🌊",
      color: "#0080FF",
      secondaryColor: "#1E90FF",
      difficulty: "medium",
      memorability: 0.83,
    },
    {
      name: "cloud",
      emoji: "☁️",
      color: "#E0E0E0",
      secondaryColor: "#D3D3D3",
      difficulty: "medium",
      memorability: 0.8,
    },
    {
      name: "mountain",
      emoji: "⛰️",
      color: "#A9A9A9",
      secondaryColor: "#696969",
      difficulty: "medium",
      memorability: 0.86,
    },
    {
      name: "tornado",
      emoji: "🌪️",
      color: "#696969",
      secondaryColor: "#A9A9A9",
      difficulty: "medium",
      memorability: 0.79,
    },
    {
      name: "rain",
      emoji: "🌧️",
      color: "#4169E1",
      secondaryColor: "#87CEEB",
      difficulty: "medium",
      memorability: 0.81,
    },
    {
      name: "cactus",
      emoji: "🌵",
      color: "#228B22",
      secondaryColor: "#FFD700",
      difficulty: "medium",
      memorability: 0.84,
    },
  ],
  tech: [
    {
      name: "computer",
      emoji: "💻",
      color: "#000000",
      secondaryColor: "#808080",
      difficulty: "medium",
      memorability: 0.85,
    },
    {
      name: "phone",
      emoji: "📱",
      color: "#000000",
      secondaryColor: "#FFFFFF",
      difficulty: "easy",
      memorability: 0.93,
    },
    {
      name: "camera",
      emoji: "📷",
      color: "#696969",
      secondaryColor: "#A9A9A9",
      difficulty: "medium",
      memorability: 0.83,
    },
    {
      name: "headphones",
      emoji: "🎧",
      color: "#DC143C",
      secondaryColor: "#000000",
      difficulty: "medium",
      memorability: 0.86,
    },
    {
      name: "battery",
      emoji: "🔋",
      color: "#32CD32",
      secondaryColor: "#DC143C",
      difficulty: "medium",
      memorability: 0.82,
    },
    {
      name: "bulb",
      emoji: "🔦",
      color: "#FFD700",
      secondaryColor: "#FF8C00",
      difficulty: "easy",
      memorability: 0.89,
    },
  ],
  food: [
    {
      name: "pizza",
      emoji: "🍕",
      color: "#FF8C00",
      secondaryColor: "#FFD700",
      difficulty: "easy",
      memorability: 0.94,
    },
    {
      name: "cake",
      emoji: "🍰",
      color: "#FFB6C1",
      secondaryColor: "#FF69B4",
      difficulty: "easy",
      memorability: 0.91,
    },
    {
      name: "cookie",
      emoji: "🍪",
      color: "#8B4513",
      secondaryColor: "#A0522D",
      difficulty: "easy",
      memorability: 0.9,
    },
    {
      name: "candy",
      emoji: "🍬",
      color: "#FF1493",
      secondaryColor: "#FFD700",
      difficulty: "easy",
      memorability: 0.92,
    },
    {
      name: "ice-cream",
      emoji: "🍦",
      color: "#FFB6C1",
      secondaryColor: "#FF8C00",
      difficulty: "easy",
      memorability: 0.93,
    },
  ],
  symbols: [
    {
      name: "check",
      emoji: "✅",
      color: "#228B22",
      secondaryColor: "#00AA00",
      difficulty: "easy",
      memorability: 0.95,
    },
    {
      name: "cross",
      emoji: "❌",
      color: "#DC143C",
      secondaryColor: "#FF6347",
      difficulty: "easy",
      memorability: 0.94,
    },
    {
      name: "question",
      emoji: "❓",
      color: "#FFD700",
      secondaryColor: "#FF8C00",
      difficulty: "easy",
      memorability: 0.91,
    },
    {
      name: "exclamation",
      emoji: "❗",
      color: "#DC143C",
      secondaryColor: "#FFD700",
      difficulty: "easy",
      memorability: 0.93,
    },
    {
      name: "skull",
      emoji: "💀",
      color: "#FFFFFF",
      secondaryColor: "#000000",
      difficulty: "medium",
      memorability: 0.88,
    },
  ],
};

/**
 * GET ICON BY NAME
 */
export function getIcon(name) {
  for (const category of Object.values(ICON_DATABASE)) {
    const icon = category.find((i) => i.name === name);
    if (icon) return icon;
  }
  return null;
}

/**
 * GET ALL ICONS
 */
export function getAllIcons() {
  return Object.values(ICON_DATABASE).flat();
}

/**
 * ICON RENDERER
 * Creates SVG representation of an icon
 */
export function renderIconSVG(
  name,
  size = 60,
  animated = false,
  animationDelay = 0,
) {
  const icon = getIcon(name);
  if (!icon) return null;

  return {
    emoji: icon.emoji,
    color: icon.color,
    secondaryColor: icon.secondaryColor,
    size,
    animated,
    animationDelay,
    shadowBlur: size * 0.5,
    glowIntensity: animated ? 1 : 0.3,
  };
}

/**
 * SESSION-BASED VARIATION ENGINE
 * Ensures same icon appears in same position but with session-based variations
 */
export class IconVariationEngine {
  constructor(sessionId) {
    this.sessionId = sessionId;
    this.seed = this.hashSessionId(sessionId);
  }

  hashSessionId(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  // Get color variation for icon (same session = same color)
  varyColor(baseColor, iconName) {
    const iconHash = this.hashSessionId(iconName);
    const combined = this.seed ^ iconHash;
    const hueShift = (combined % 40) - 20; // ±20° hue shift

    return {
      base: baseColor,
      hueShift,
      opacity: 0.85 + (combined % 15) / 100,
    };
  }

  // Get rotation variation
  getRotation(iconName) {
    const iconHash = this.hashSessionId(iconName);
    const combined = this.seed ^ iconHash;
    return combined % 360;
  }

  // Get animation states
  getAnimationState(iconName) {
    const iconHash = this.hashSessionId(iconName);
    const combined = this.seed ^ iconHash;

    return {
      delay: (combined % 2000) / 1000, // 0-2s delay
      duration: 2 + ((combined >> 8) % 3), // 2-4s duration
      intensity: ((combined >> 16) % 100) / 100, // 0-1 intensity
    };
  }

  // Get scale variation for non-selected icons
  getScale(iconName, isSelected = false) {
    if (isSelected) return 1;

    const iconHash = this.hashSessionId(iconName);
    const combined = this.seed ^ iconHash;
    return 0.85 + (combined % 30) / 100; // 0.85-1.15
  }

  // Get shadow depth
  getShadowDepth(iconName, isSelected = false) {
    if (isSelected) return 8;

    const iconHash = this.hashSessionId(iconName);
    const combined = this.seed ^ iconHash;
    return 2 + (combined % 6);
  }
}

/**
 * ICON POSITIONING ENGINE
 * Deterministic layout for verification
 */
export class IconPositioner {
  constructor(sessionId, containerWidth = 800, containerHeight = 600) {
    this.sessionId = sessionId;
    this.containerWidth = containerWidth;
    this.containerHeight = containerHeight;
    this.seed = this.hashSessionId(sessionId);
  }

  hashSessionId(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  // Get position for icon (deterministic)
  getPosition(iconName, index, totalIcons) {
    const iconHash = this.hashSessionId(iconName);
    const combined = (this.seed ^ iconHash) + index;

    // Fibonacci-like spiral positioning
    const angle = (combined * 2.4) % 360; // Golden angle
    const radius = 150 + (combined % 150);

    const centerX = this.containerWidth / 2;
    const centerY = this.containerHeight / 2;

    const x = centerX + radius * Math.cos((angle * Math.PI) / 180);
    const y = centerY + radius * Math.sin((angle * Math.PI) / 180);

    return {
      x: Math.max(40, Math.min(this.containerWidth - 40, x)),
      y: Math.max(40, Math.min(this.containerHeight - 40, y)),
    };
  }

  // Get bounds for click detection
  getIconBounds(position, size = 60) {
    return {
      x: position.x - size / 2,
      y: position.y - size / 2,
      width: size,
      height: size,
    };
  }

  // Check if click hits icon
  isClickOnIcon(clickX, clickY, position, size = 60) {
    const distance = Math.sqrt(
      Math.pow(clickX - position.x, 2) + Math.pow(clickY - position.y, 2),
    );
    return distance <= size / 2 + 5; // 5px tolerance
  }
}

/**
 * ICON SELECTOR
 * Helper for picking random icons with support for credential pinning
 */
export function selectRandomIcons(count = 40, credentialIconNames = []) {
  const allIcons = getAllIcons();
  const selected = [];
  const used = new Set();

  // ALWAYS include credential icons if provided (these are user's actual auth icons)
  credentialIconNames.forEach((name) => {
    const icon = getIcon(name);
    if (icon && !selected.some((i) => i.name === name)) {
      selected.push(name);
      used.add(allIcons.findIndex((i) => i.name === name));
    }
  });

  // Fill remainder with random icons
  while (selected.length < Math.min(count, allIcons.length)) {
    const idx = Math.floor(Math.random() * allIcons.length);
    if (!used.has(idx)) {
      selected.push(allIcons[idx].name);
      used.add(idx);
    }
  }

  return selected;
}

/**
 * DYNAMIC ICON REPLACEMENT FOR LOGIN MODE
 *
 * Rule: Replace ~50% of NON-CREDENTIAL icons each session
 * - Credential icons ALWAYS present and recognizable
 * - Non-credential icons randomized dynamically
 * - Attack surface expanded — attacker cannot build pattern memory
 */
export function selectIconsForLogin(
  count = 70,
  credentialIconNames = [],
  sessionSeed = null,
) {
  const allIcons = getAllIcons();
  const selectedSet = new Set();
  const seed = sessionSeed || Math.random();

  // ALWAYS include credential icons first
  credentialIconNames.forEach((name) => {
    if (selectedSet.size < allIcons.length) {
      selectedSet.add(name);
    }
  });

  // Calculate how many more we need
  const credentialCount = selectedSet.size;
  const needed = Math.min(count, allIcons.length) - credentialCount;

  // Randomly select from ALL remaining icons (deterministic if seedmapped)
  const remaining = allIcons.filter((icon) => !selectedSet.has(icon.name));

  // Shuffle remaining with seed
  const shuffled = remainingShuffleWithSeed(remaining, seed);

  for (let i = 0; i < needed && i < shuffled.length; i++) {
    selectedSet.add(shuffled[i].name);
  }

  return Array.from(selectedSet);
}

/**
 * SEEDED SHUFFLE - FOR REPRODUCIBLE RANDOMIZATION
 * Same seed = same shuffle (for testing)
 * Different seed = different shuffle (per login attempt)
 */
function remainingShuffleWithSeed(array, seed) {
  const arr = [...array];
  let random = simpleSeededRandom(seed);

  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }

  return arr;
}

/**
 * SIMPLE SEEDED RANDOM NUMBER GENERATOR
 * Deterministic for testing, but different per call
 */
function simpleSeededRandom(seed) {
  let x = Math.sin(seed) * 10000;
  return function () {
    x = Math.sin(x) * 10000;
    return x - Math.floor(x);
  };
}

export default {
  ICON_DATABASE,
  getIcon,
  getAllIcons,
  renderIconSVG,
  IconVariationEngine,
  IconPositioner,
  selectRandomIcons,
};
