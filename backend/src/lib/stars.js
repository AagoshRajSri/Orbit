/**
 * Orbit Auth: Star Identity System
 *
 * Multi-layer symbolic identity system combining:
 * - Semantic icons (user-memorable)
 * - Color attributes (visual distinctiveness)
 * - Procedural patterns (uniqueness)
 * - Hidden system IDs (cryptographic binding)
 */

import crypto from "crypto";

/**
 * SEMANTIC ICON REGISTRY
 *
 * 130+ base icons across 5 categories
 * Distributes across diverse domains to prevent prediction
 */
const SEMANTIC_CATEGORIES = {
  FRUITS: [
    {
      name: "banana",
      emoji: "🍌",
      primaryColor: "#FFD700",
      description: "Yellow fruit",
    },
    {
      name: "apple",
      emoji: "🍎",
      primaryColor: "#DC143C",
      description: "Red crisp fruit",
    },
    {
      name: "orange",
      emoji: "🍊",
      primaryColor: "#FF8C00",
      description: "Citrus fruit",
    },
    {
      name: "grape",
      emoji: "🍇",
      primaryColor: "#8B00FF",
      description: "Purple clusters",
    },
    {
      name: "strawberry",
      emoji: "🍓",
      primaryColor: "#FF1493",
      description: "Red seed berries",
    },
    {
      name: "kiwi",
      emoji: "🥝",
      primaryColor: "#7FBF00",
      description: "Green tropical",
    },
    {
      name: "watermelon",
      emoji: "🍉",
      primaryColor: "#1F9F1F",
      description: "Green striped",
    },
    {
      name: "blueberry",
      emoji: "🫐",
      primaryColor: "#4169E1",
      description: "Blue mound",
    },
    {
      name: "peach",
      emoji: "🍑",
      primaryColor: "#FFAB91",
      description: "Dusty orange",
    },
    {
      name: "coconut",
      emoji: "🥥",
      primaryColor: "#8B4513",
      description: "Brown hairy",
    },
    {
      name: "avocado",
      emoji: "🥑",
      primaryColor: "#6B8E23",
      description: "Green pear",
    },
    {
      name: "lemon",
      emoji: "🍋",
      primaryColor: "#FFFACD",
      description: "Sour yellow",
    },
    {
      name: "lime",
      emoji: "🟢",
      primaryColor: "#00FF00",
      description: "Bright green",
    },
    {
      name: "pineapple",
      emoji: "🍍",
      primaryColor: "#FFD700",
      description: "Tropical crown",
    },
    {
      name: "mango",
      emoji: "🥭",
      primaryColor: "#FF6347",
      description: "Stone fruit",
    },
    {
      name: "cherries",
      emoji: "🍒",
      primaryColor: "#DC143C",
      description: "Twin gems",
    },
    {
      name: "pear",
      emoji: "🍐",
      primaryColor: "#90EE90",
      description: "Green bulb",
    },
    {
      name: "pomegranate",
      emoji: "🍎",
      primaryColor: "#8B0000",
      description: "Dark red seeds",
    },
    {
      name: "tangerine",
      emoji: "🍊",
      primaryColor: "#FF7F50",
      description: "Mandarin orange",
    },
    {
      name: "dragon_fruit",
      emoji: "🐉",
      primaryColor: "#FF1493",
      description: "Spiky pink",
    },
  ],

  ANIMALS: [
    {
      name: "dog",
      emoji: "🐕",
      primaryColor: "#8B4513",
      description: "Canine friend",
    },
    {
      name: "cat",
      emoji: "🐈",
      primaryColor: "#FFB347",
      description: "Feline grace",
    },
    {
      name: "lion",
      emoji: "🦁",
      primaryColor: "#D4A017",
      description: "Majestic mane",
    },
    {
      name: "tiger",
      emoji: "🐯",
      primaryColor: "#FF8C00",
      description: "Striped predator",
    },
    {
      name: "bear",
      emoji: "🐻",
      primaryColor: "#8B6914",
      description: "Brown giant",
    },
    {
      name: "fox",
      emoji: "🦊",
      primaryColor: "#FF6347",
      description: "Red cunning",
    },
    {
      name: "elephant",
      emoji: "🐘",
      primaryColor: "#808080",
      description: "Gray wise",
    },
    {
      name: "giraffe",
      emoji: "🦒",
      primaryColor: "#DAA520",
      description: "Spotted tall",
    },
    {
      name: "zebra",
      emoji: "🦓",
      primaryColor: "#000000",
      description: "Striped herd",
    },
    {
      name: "monkey",
      emoji: "🐵",
      primaryColor: "#8B4513",
      description: "Playful primate",
    },
    {
      name: "penguin",
      emoji: "🐧",
      primaryColor: "#000000",
      description: "Tuxedo bird",
    },
    {
      name: "eagle",
      emoji: "🦅",
      primaryColor: "#8B4513",
      description: "Sky predator",
    },
    {
      name: "owl",
      emoji: "🦉",
      primaryColor: "#8B7355",
      description: "Wise nocturnal",
    },
    {
      name: "dolphin",
      emoji: "🐬",
      primaryColor: "#4169E1",
      description: "Ocean intelligent",
    },
    {
      name: "whale",
      emoji: "🐋",
      primaryColor: "#00008B",
      description: "Ocean giant",
    },
    {
      name: "shark",
      emoji: "🦈",
      primaryColor: "#696969",
      description: "Ocean predator",
    },
    {
      name: "butterfly",
      emoji: "🦋",
      primaryColor: "#FF69B4",
      description: "Winged beauty",
    },
    {
      name: "bee",
      emoji: "🐝",
      primaryColor: "#FFD700",
      description: "Striped worker",
    },
    {
      name: "dragon",
      emoji: "🐉",
      primaryColor: "#FF6347",
      description: "Mythical beast",
    },
    {
      name: "unicorn",
      emoji: "🦄",
      primaryColor: "#FFB6C1",
      description: "Magical horn",
    },
    {
      name: "rabbit",
      emoji: "🐰",
      primaryColor: "#FFF8DC",
      description: "Hoppy ears",
    },
    {
      name: "horse",
      emoji: "🐴",
      primaryColor: "#8B4513",
      description: "Noble steed",
    },
    {
      name: "sheep",
      emoji: "🐑",
      primaryColor: "#FFFFFF",
      description: "Woolly white",
    },
    {
      name: "pig",
      emoji: "🐷",
      primaryColor: "#FFB6C1",
      description: "Pink curly",
    },
    {
      name: "crocodile",
      emoji: "🐊",
      primaryColor: "#228B22",
      description: "Ancient scales",
    },
  ],

  OBJECTS: [
    {
      name: "book",
      emoji: "📖",
      primaryColor: "#8B4513",
      description: "Knowledge tome",
    },
    {
      name: "school",
      emoji: "🏫",
      primaryColor: "#DC143C",
      description: "Learning place",
    },
    {
      name: "rocket",
      emoji: "🚀",
      primaryColor: "#FF6347",
      description: "Space explorer",
    },
    {
      name: "computer",
      emoji: "💻",
      primaryColor: "#000000",
      description: "Tech machine",
    },
    {
      name: "phone",
      emoji: "📱",
      primaryColor: "#2E8B57",
      description: "Mobile device",
    },
    {
      name: "key",
      emoji: "🔑",
      primaryColor: "#FFD700",
      description: "Golden access",
    },
    {
      name: "lock",
      emoji: "🔒",
      primaryColor: "#FF4500",
      description: "Security closure",
    },
    {
      name: "telescope",
      emoji: "🔭",
      primaryColor: "#696969",
      description: "Star gazer",
    },
    {
      name: "microscope",
      emoji: "🔬",
      primaryColor: "#4169E1",
      description: "Tiny world",
    },
    {
      name: "camera",
      emoji: "📷",
      primaryColor: "#000000",
      description: "Memory capture",
    },
    {
      name: "watch",
      emoji: "⌚",
      primaryColor: "#FFD700",
      description: "Time keeper",
    },
    {
      name: "clock",
      emoji: "🕰️",
      primaryColor: "#8B4513",
      description: "Hour counter",
    },
    {
      name: "light_bulb",
      emoji: "💡",
      primaryColor: "#FFD700",
      description: "Bright idea",
    },
    {
      name: "candle",
      emoji: "🕯️",
      primaryColor: "#FFD700",
      description: "Flame light",
    },
    {
      name: "lamp",
      emoji: "🔦",
      primaryColor: "#FFD700",
      description: "Handheld glow",
    },
    {
      name: "gift",
      emoji: "🎁",
      primaryColor: "#FF1493",
      description: "Surprise box",
    },
    {
      name: "trophy",
      emoji: "🏆",
      primaryColor: "#FFD700",
      description: "Victory prize",
    },
    {
      name: "medal",
      emoji: "🏅",
      primaryColor: "#FFD700",
      description: "Achievement badge",
    },
    {
      name: "crown",
      emoji: "👑",
      primaryColor: "#FFD700",
      description: "Royal headgear",
    },
    {
      name: "sword",
      emoji: "⚔️",
      primaryColor: "#696969",
      description: "Warrior blade",
    },
    {
      name: "shield",
      emoji: "🛡️",
      primaryColor: "#FF4500",
      description: "Protective wall",
    },
    {
      name: "bow_arrow",
      emoji: "🏹",
      primaryColor: "#8B4513",
      description: "Archer weapon",
    },
    {
      name: "anchor",
      emoji: "⚓",
      primaryColor: "#696969",
      description: "Ocean hold",
    },
    {
      name: "compass",
      emoji: "🧭",
      primaryColor: "#8B4513",
      description: "Direction finder",
    },
    {
      name: "map",
      emoji: "🗺️",
      primaryColor: "#8B4513",
      description: "Route planner",
    },
  ],

  ABSTRACT_GLYPHS: [
    {
      name: "star",
      emoji: "⭐",
      primaryColor: "#FFD700",
      description: "Celestial point",
    },
    {
      name: "sparkle",
      emoji: "✨",
      primaryColor: "#FFD700",
      description: "Magic shimmer",
    },
    {
      name: "diamond",
      emoji: "💎",
      primaryColor: "#00BFFF",
      description: "Precious gem",
    },
    {
      name: "circle",
      emoji: "🔵",
      primaryColor: "#0000CD",
      description: "Perfect round",
    },
    {
      name: "triangle",
      emoji: "🔺",
      primaryColor: "#FF0000",
      description: "Three peak",
    },
    {
      name: "square",
      emoji: "🟦",
      primaryColor: "#0000FF",
      description: "Four corners",
    },
    {
      name: "heart",
      emoji: "❤️",
      primaryColor: "#FF1493",
      description: "Love emotion",
    },
    {
      name: "flame",
      emoji: "🔥",
      primaryColor: "#FF4500",
      description: "Burning heat",
    },
    {
      name: "snowflake",
      emoji: "❄️",
      primaryColor: "#87CEEB",
      description: "Ice crystal",
    },
    {
      name: "cloud",
      emoji: "☁️",
      primaryColor: "#FFFFFF",
      description: "Sky float",
    },
    {
      name: "rain",
      emoji: "🌧️",
      primaryColor: "#4169E1",
      description: "Water drops",
    },
    {
      name: "wind",
      emoji: "💨",
      primaryColor: "#B0E0E6",
      description: "Air movement",
    },
    {
      name: "sun",
      emoji: "☀️",
      primaryColor: "#FFD700",
      description: "Solar orb",
    },
    {
      name: "moon",
      emoji: "🌙",
      primaryColor: "#FFFACD",
      description: "Night light",
    },
    {
      name: "tree",
      emoji: "🌳",
      primaryColor: "#228B22",
      description: "Forest life",
    },
    {
      name: "flower",
      emoji: "🌸",
      primaryColor: "#FFB6C1",
      description: "Bloom beauty",
    },
    {
      name: "wave",
      emoji: "〰️",
      primaryColor: "#4169E1",
      description: "Water ripple",
    },
    {
      name: "spiral",
      emoji: "🌀",
      primaryColor: "#8B008B",
      description: "Swirling motion",
    },
    {
      name: "infinity",
      emoji: "∞",
      primaryColor: "#696969",
      description: "Endless loop",
    },
    {
      name: "yin_yang",
      emoji: "☯️",
      primaryColor: "#000000",
      description: "Balance duality",
    },
    {
      name: "hexagon",
      emoji: "⬡",
      primaryColor: "#FFD700",
      description: "Six sides",
    },
    {
      name: "lightning",
      emoji: "⚡",
      primaryColor: "#FFD700",
      description: "Electric strike",
    },
    {
      name: "hourglass",
      emoji: "⏳",
      primaryColor: "#8B4513",
      description: "Time Sand",
    },
    {
      name: "skull",
      emoji: "☠️",
      primaryColor: "#FFFFFF",
      description: "Danger symbol",
    },
    {
      name: "cross",
      emoji: "✝️",
      primaryColor: "#696969",
      description: "Crossing point",
    },
  ],

  NATURE: [
    {
      name: "mountain",
      emoji: "⛰️",
      primaryColor: "#8B7355",
      description: "Peak height",
    },
    {
      name: "volcano",
      emoji: "🌋",
      primaryColor: "#FF4500",
      description: "Hot eruption",
    },
    {
      name: "ocean",
      emoji: "🌊",
      primaryColor: "#4169E1",
      description: "Blue vast",
    },
    {
      name: "desert",
      emoji: "🏜️",
      primaryColor: "#DAA520",
      description: "Sand dunes",
    },
    {
      name: "forest",
      emoji: "🌲",
      primaryColor: "#228B22",
      description: "Green thick",
    },
    {
      name: "river",
      emoji: "🌊",
      primaryColor: "#4169E1",
      description: "Flowing water",
    },
    {
      name: "waterfall",
      emoji: "💦",
      primaryColor: "#4169E1",
      description: "Cascading drops",
    },
    {
      name: "glacier",
      emoji: "🧊",
      primaryColor: "#B0E0E6",
      description: "Ice mass",
    },
    {
      name: "coral",
      emoji: "🪸",
      primaryColor: "#FF7F50",
      description: "Ocean reef",
    },
    {
      name: "seaweed",
      emoji: "🌿",
      primaryColor: "#228B22",
      description: "Ocean plant",
    },
  ],
};

/**
 * COLOR PALETTE
 * 20–30 distinct, recognizable colors
 * Each with HSL variations for procedural modification
 */
const COLOR_PALETTE = [
  { name: "red", hex: "#FF0000", hsl: { h: 0, s: 100, l: 50 } },
  { name: "orange", hex: "#FF8C00", hsl: { h: 33, s: 100, l: 50 } },
  { name: "yellow", hex: "#FFD700", hsl: { h: 51, s: 100, l: 50 } },
  { name: "yellow_green", hex: "#9ACD32", hsl: { h: 60, s: 78, l: 48 } },
  { name: "green", hex: "#00AA00", hsl: { h: 120, s: 100, l: 33 } },
  { name: "teal", hex: "#00AA88", hsl: { h: 162, s: 100, l: 33 } },
  { name: "cyan", hex: "#00AAFF", hsl: { h: 195, s: 100, l: 50 } },
  { name: "blue", hex: "#0000FF", hsl: { h: 240, s: 100, l: 50 } },
  { name: "blue_violet", hex: "#8A2BE2", hsl: { h: 270, s: 100, l: 44 } },
  { name: "violet", hex: "#EE82EE", hsl: { h: 300, s: 100, l: 75 } },
  { name: "magenta", hex: "#FF00FF", hsl: { h: 300, s: 100, l: 50 } },
  { name: "hot_pink", hex: "#FF1493", hsl: { h: 330, s: 100, l: 50 } },
  { name: "rose", hex: "#FF007F", hsl: { h: 345, s: 100, l: 50 } },
  { name: "black", hex: "#000000", hsl: { h: 0, s: 0, l: 0 } },
  { name: "dark_gray", hex: "#333333", hsl: { h: 0, s: 0, l: 20 } },
  { name: "gray", hex: "#808080", hsl: { h: 0, s: 0, l: 50 } },
  { name: "light_gray", hex: "#CCCCCC", hsl: { h: 0, s: 0, l: 80 } },
  { name: "white", hex: "#FFFFFF", hsl: { h: 0, s: 0, l: 100 } },
  { name: "brown", hex: "#8B4513", hsl: { h: 25, s: 65, l: 47 } },
  { name: "gold", hex: "#FFD700", hsl: { h: 51, s: 100, l: 50 } },
  { name: "silver", hex: "#C0C0C0", hsl: { h: 0, s: 0, l: 75 } },
  { name: "copper", hex: "#B87333", hsl: { h: 25, s: 48, l: 55 } },
  { name: "indigo", hex: "#4B0082", hsl: { h: 274, s: 100, l: 25 } },
  { name: "navy", hex: "#000080", hsl: { h: 240, s: 100, l: 25 } },
  { name: "maroon", hex: "#800000", hsl: { h: 0, s: 100, l: 25 } },
  { name: "turquoise", hex: "#40E0D0", hsl: { h: 174, s: 72, l: 56 } },
  { name: "lime", hex: "#00FF00", hsl: { h: 120, s: 100, l: 50 } },
  { name: "olive", hex: "#808000", hsl: { h: 60, s: 100, l: 25 } },
  { name: "coral", hex: "#FF7F50", hsl: { h: 16, s: 100, l: 66 } },
  { name: "salmon", hex: "#FA8072", hsl: { h: 6, s: 93, l: 71 } },
];

/**
 * PROCEDURAL PATTERN TYPES
 * Define how visual patterns are generated
 */
const PATTERN_TYPES = {
  SMOOTH: { name: "smooth", intensity: 0, description: "Clean solid" },
  GRAIN: { name: "grain", intensity: 10, description: "Subtle texture" },
  NOISE: { name: "noise", intensity: 20, description: "Random speckle" },
  DITHER: { name: "dither", intensity: 15, description: "Patterned dots" },
  GLITCH: { name: "glitch", intensity: 25, description: "Distortion effect" },
};

/**
 * STAR REGISTRY
 * Maps semantic names to system IDs (A0–Z9 = 26×10 = 260 total possible)
 */
class StarRegistry {
  constructor() {
    this.registry = new Map();
    this.idToStar = new Map();
    this.initialize();
  }

  initialize() {
    // Build registry from all categories
    let idIndex = 0;

    // Generate IDs: A0–A9, B0–B9, ..., Z0–Z9
    Object.values(SEMANTIC_CATEGORIES).forEach((category) => {
      category.forEach((icon) => {
        const letter = String.fromCharCode(65 + Math.floor(idIndex / 10));
        const digit = idIndex % 10;
        const systemId = `${letter}${digit}`;

        const star = {
          semanticName: icon.name,
          emoji: icon.emoji,
          description: icon.description,
          baseColor: icon.primaryColor,
          systemId: systemId,
          hash: this.hashStar(systemId, icon.name),
        };

        this.registry.set(icon.name, star);
        this.idToStar.set(systemId, star);
        idIndex++;
      });
    });

    console.log(
      `[StarRegistry] Initialized with ${this.registry.size} stars (IDs: A0–${String.fromCharCode(65 + Math.floor((idIndex - 1) / 10))}${(idIndex - 1) % 10})`,
    );
  }

  /**
   * Get star by semantic name
   */
  getBySemantic(name) {
    const star = this.registry.get(name);
    if (!star) {
      throw new Error(`Unknown semantic star: ${name}`);
    }
    return star;
  }

  /**
   * Get star by system ID
   */
  getById(systemId) {
    const star = this.idToStar.get(systemId);
    if (!star) {
      throw new Error(`Unknown system ID: ${systemId}`);
    }
    return star;
  }

  /**
   * Get all available semantic names (for UI dropdown, etc.)
   */
  getAllSemanticNames() {
    return Array.from(this.registry.keys());
  }

  /**
   * Count total stars
   */
  count() {
    return this.registry.size;
  }

  /**
   * Immutable hash for star (maps semantic → hash for verification)
   */
  hashStar(systemId, semanticName) {
    const input = `${systemId}:${semanticName}`;
    return crypto
      .createHash("sha256")
      .update(input)
      .digest("hex")
      .substring(0, 16);
  }
}

/**
 * STAR COLOR VARIATION ENGINE
 * Applies procedural color shifts while maintaining recognizability
 */
class ColorVariationEngine {
  constructor() {
    this.palette = COLOR_PALETTE;
  }

  /**
   * Get random color from palette
   */
  getRandomColor(rng) {
    return this.palette[rng.nextInt(this.palette.length)];
  }

  /**
   * Vary a base color by ±degrees
   * Preserves hue family but creates visual variety
   */
  varyColor(baseHex, sessionSeed, rng) {
    // Find closest palette color
    const baseColor = this.findClosestColor(baseHex);

    // Hue shift: ±20 degrees (keeps color "family")
    const hueShift = -20 + rng.next() * 40;
    const newHue = (baseColor.hsl.h + hueShift + 360) % 360;

    // Saturation shift: ±10
    const satShift = -10 + rng.next() * 20;
    const newSat = Math.max(30, Math.min(100, baseColor.hsl.s + satShift));

    // Lightness shift: ±5 (keep visible)
    const lightShift = -5 + rng.next() * 10;
    const newLight = Math.max(35, Math.min(65, baseColor.hsl.l + lightShift));

    return {
      hex: this.hslToHex(newHue, newSat, newLight),
      hsl: { h: newHue, s: newSat, l: newLight },
    };
  }

  /**
   * Find closest palette color to hex value
   */
  findClosestColor(hex) {
    // Simple: return first match or default
    const match = this.palette.find((c) => c.hex === hex);
    return match || this.palette[0];
  }

  /**
   * Convert HSL to hex
   */
  hslToHex(h, s, l) {
    const a = (s * Math.min(l, 100 - l)) / 100;
    const f = (n) => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color)
        .toString(16)
        .padStart(2, "0");
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  }
}

/**
 * SEEDED RANDOM NUMBER GENERATOR
 * Deterministic RNG for reproducible procedural generation
 */
class SeededRandom {
  constructor(seed) {
    this.seed = this.hashSeed(seed);
    this.state = this.seed;
  }

  hashSeed(seed) {
    const hash = crypto.createHash("sha256").update(String(seed)).digest();
    return hash.readUInt32BE(0);
  }

  /**
   * Linear congruential generator (deterministic, reproducible)
   */
  next() {
    this.state = (this.state * 1103515245 + 12345) & 0x7fffffff;
    return this.state / 0x7fffffff;
  }

  /**
   * Random integer in [0, max)
   */
  nextInt(max) {
    return Math.floor(this.next() * max);
  }

  /**
   * Random boolean
   */
  nextBool() {
    return this.next() > 0.5;
  }
}

/**
 * STAR GENERATION SYSTEM
 * Combines semantic identity with procedural variation
 */
class StarGenerator {
  constructor(registryInstance) {
    this.registry = registryInstance;
    this.colorEngine = new ColorVariationEngine();
  }

  /**
   * Generate a complete star with all attributes
   *
   * Parameters:
   * - semanticName: User-memorable name (e.g., "banana")
   * - sessionSeed: Session-specific seed (for reproducibility)
   * - variationLevel: How much procedural variation (0–1)
   */
  generateStar(semanticName, sessionSeed = null, variationLevel = 0.5) {
    const base = this.registry.getBySemantic(semanticName);

    const rng = new SeededRandom(sessionSeed || Math.random());

    // Select random color from palette
    const selectedColor = this.colorEngine.getRandomColor(rng);

    // Optionally vary the color within its family
    const finalColor =
      variationLevel > rng.next()
        ? this.colorEngine.varyColor(selectedColor.hex, sessionSeed, rng)
        : selectedColor;

    // Select procedural pattern
    const patternTypes = Object.values(PATTERN_TYPES);
    const pattern = patternTypes[rng.nextInt(patternTypes.length)];

    // Add visual properties (size, opacity, rotation)
    const sizeVariation = 0.85 + rng.next() * 0.3; // ±15%
    const opacityVariation = 0.9 + rng.next() * 0.1; // ±5%
    const rotationVariation = rng.next() * 360; // 0–360°

    return {
      // User-visible (semantic layer)
      semanticName: base.semanticName,
      emoji: base.emoji,
      description: base.description,
      color: finalColor,
      pattern: pattern,

      // System-internal (cryptographic layer)
      systemId: base.systemId,
      hash: base.hash,

      // Visual rendering
      size: 40 * sizeVariation,
      opacity: opacityVariation,
      rotation: rotationVariation,

      // Metadata
      timestamp: new Date(),
      sessionSeed: sessionSeed,
      variationLevel: variationLevel,
    };
  }

  /**
   * Generate multiple stars for a star field layout
   * Ensures diversity, prevents duplication
   */
  generateStarField(count = 20, sessionSeed = null) {
    const rng = new SeededRandom(sessionSeed || Math.random());
    const semanticNames = this.registry.getAllSemanticNames();
    const field = [];
    const used = new Set();

    for (let i = 0; i < count; i++) {
      let name;

      // Avoid duplicates in same field
      do {
        name = semanticNames[rng.nextInt(semanticNames.length)];
      } while (
        used.has(name) &&
        used.size < Math.min(count, semanticNames.length)
      );

      used.add(name);

      const star = this.generateStar(name, `${sessionSeed}:star_${i}`, 0.5);

      field.push(star);
    }

    return field;
  }

  /**
   * Get a specific star with procedural variation
   * Used when verifying user's remembered star
   */
  getRecognitionStar(semanticName) {
    return this.registry.getBySemantic(semanticName);
  }
}

/**
 * PATTERN/TEXTURE GENERATION
 * Procedurally create visual patterns for star uniqueness
 */
class PatternGenerator {
  constructor() {
    this.patterns = PATTERN_TYPES;
  }

  /**
   * Generate pattern metadata for rendering
   * (Actual rendering happens on frontend with Canvas/WebGL)
   */
  generatePatternMetadata(patternType, seed, intensity) {
    return {
      type: patternType,
      intensity: intensity || 0.5,
      seed: seed,
      // Additional metadata for procedural rendering
      noiseScale: 4 + Math.random() * 16,
      frequency: 0.5 + Math.random() * 2,
      octaves: Math.floor(2 + Math.random() * 3),
    };
  }
}

/**
 * SINGLETON INSTANCES
 */
let registryInstance = null;
let generatorInstance = null;

export function getStarRegistry() {
  if (!registryInstance) {
    registryInstance = new StarRegistry();
  }
  return registryInstance;
}

export function getStarGenerator() {
  if (!generatorInstance) {
    generatorInstance = new StarGenerator(getStarRegistry());
  }
  return generatorInstance;
}

/**
 * UTILITY EXPORTS
 */
export {
  StarRegistry,
  StarGenerator,
  SeededRandom,
  ColorVariationEngine,
  PatternGenerator,
  SEMANTIC_CATEGORIES,
  COLOR_PALETTE,
  PATTERN_TYPES,
};

/**
 * Export constants for client-side usage
 */
export const STAR_SYSTEM_CONSTANTS = {
  TOTAL_STARS: getStarRegistry().count(),
  COLOR_COUNT: COLOR_PALETTE.length,
  PATTERN_TYPES: Object.keys(PATTERN_TYPES),
  MAX_STAR_ID: "Z9", // 260 possible IDs (A0–Z9)
  SEMANTIC_CATEGORIES: Object.keys(SEMANTIC_CATEGORIES),
};
