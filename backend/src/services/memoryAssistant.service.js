/**
 * Orbit Auth: Memory Assistant Service
 *
 * Backend service for generating memorable sentences
 * - Template-based story generation
 * - Caching for performance
 * - Rate limiting
 */

import crypto from "crypto";

/**
 * MEMORY SENTENCE TEMPLATES
 */
const TEMPLATES = [
  // Action stories
  "{icon1} chases {icon2} through {icon3}",
  "{icon1} befriends {icon2} at {icon3}",
  "{icon1} hides behind {icon2} by {icon3}",
  "{icon1} dances with {icon2} inside {icon3}",
  "{icon1} escapes with {icon2} to {icon3}",
  "{icon1} meets {icon2} under {icon3}",
  "{icon1} discovers {icon2} in {icon3}",
  "{icon1} protects {icon2} from {icon3}",
  "{icon1} tricks {icon2} near {icon3}",
  "{icon1} challenges {icon2} at {icon3}",

  // Emotional stories
  "{icon1} loves {icon2} at {icon3}",
  "{icon1} fears {icon2} from {icon3}",
  "{icon1} trusts {icon2} in {icon3}",
  "{icon1} misses {icon2} without {icon3}",
  "{icon1} remembers {icon2} by {icon3}",
  "{icon1} forgives {icon2} through {icon3}",

  // Transformation stories
  "{icon1} becomes {icon2} with {icon3}",
  "{icon1} transforms into {icon2} via {icon3}",
  "{icon1} merges with {icon2} creating {icon3}",
  "{icon1} unlocks {icon2} using {icon3}",
  "{icon1} awakens {icon2} near {icon3}",

  // Narrative stories
  "Once, {icon1} met {icon2}, then found {icon3}",
  "The {icon1} and {icon2} built a bridge to {icon3}",
  "A {icon1} saved {icon2} from {icon3}",
  "Long ago, {icon1} traveled with {icon2} to {icon3}",
  "The legend says {icon1} guards {icon2} at {icon3}",

  // Absurdist (memorable!)
  "{icon1} forgot to tell {icon2} about {icon3}",
  "{icon1} accidentally hired {icon2} as {icon3}",
  "{icon1} taught {icon2} to dance like {icon3}",
  "{icon1} asked {icon2} why {icon3} was purple",
  "{icon1} convinced {icon2} that {icon3} could fly",
];

/**
 * ICON NAMING VARIANTS
 * More natural language when used in sentences
 */
const ICON_ALIASES = {
  banana: "yellow banana",
  apple: "shiny apple",
  orange: "round orange",
  grape: "purple grape",
  strawberry: "red strawberry",
  watermelon: "juicy watermelon",
  lemon: "sour lemon",
  peach: "fuzzy peach",
  pear: "green pear",
  pineapple: "spiky pineapple",
  dog: "loyal dog",
  cat: "curious cat",
  elephant: "gentle elephant",
  lion: "fierce lion",
  tiger: "striped tiger",
  bear: "strong bear",
  wolf: "howling wolf",
  fox: "clever fox",
  rabbit: "quick rabbit",
  deer: "graceful deer",
  owl: "wise owl",
  butterfly: "colorful butterfly",
  book: "mysterious book",
  key: "golden key",
  rocket: "speeding rocket",
  clock: "ticking clock",
  lamp: "bright lamp",
  house: "cozy house",
  car: "speedy car",
  star: "shining star",
  heart: "loving heart",
  fire: "roaring fire",
  lightning: "electric lightning",
  moon: "silver moon",
  sun: "golden sun",
  tree: "ancient tree",
  flower: "blooming flower",
  ocean: "endless ocean",
  cloud: "floating cloud",
  mountain: "towering mountain",
  lake: "serene lake",
};

/**
 * MEMORY ASSISTANT SERVICE
 */
export class MemoryAssistantService {
  constructor() {
    this.cache = new Map();
    this.templateIndex = 0;
    this.rateLimitMap = new Map(); // Track generation attempts per user
  }

  /**
   * GENERATE MEMORY STORIES
   * Main entry point
   */
  generateMemories(iconSequence, options = {}) {
    if (!iconSequence || iconSequence.length < 2) {
      return {
        success: false,
        error: "At least 2 icons required",
        options: [],
      };
    }

    // Check rate limiting
    const userId = options.userId || "anonymous";
    if (!this.checkRateLimit(userId)) {
      return {
        success: false,
        error: "Too many requests. Please wait before generating more stories.",
        retryAfter: 60,
      };
    }

    // Check cache
    const cacheKey = this.getCacheKey(iconSequence);
    if (this.cache.has(cacheKey)) {
      return {
        success: true,
        options: this.cache.get(cacheKey),
        fromCache: true,
      };
    }

    // Generate new stories
    const stories = [];
    const maxAttempts = 10;
    let attempts = 0;

    while (stories.length < 3 && attempts < maxAttempts) {
      const story = this.generateSingleStory(iconSequence);

      // Avoid duplicates
      if (!stories.includes(story)) {
        stories.push(story);
      }

      attempts++;
    }

    // Cache results
    this.cache.set(cacheKey, stories);

    return {
      success: true,
      options: stories,
      count: stories.length,
      icons: iconSequence,
      timestamp: new Date().toISOString(),
      memorability: this.calculateMemorability(iconSequence),
    };
  }

  /**
   * GENERATE SINGLE STORY
   */
  generateSingleStory(iconSequence) {
    const template = this.getTemplate();
    const placeholders = (template.match(/{icon\d}/g) || []).length;

    // Extend sequence if needed, randomizing order
    let icons = [...iconSequence];
    while (icons.length < placeholders) {
      const randomIcon =
        iconSequence[Math.floor(Math.random() * iconSequence.length)];
      if (!icons.includes(randomIcon) || Math.random() > 0.5) {
        icons.push(randomIcon);
      }
    }

    // Shuffle remaining icons randomly
    icons = icons.slice(0, placeholders).sort(() => Math.random() - 0.5);

    // Build story
    let story = template;
    for (let i = 1; i <= placeholders; i++) {
      const placeholder = `{icon${i}}`;
      const iconName = icons[i - 1];
      const alias = ICON_ALIASES[iconName] || iconName;
      story = story.replace(placeholder, alias);
    }

    // Capitalize and cleanup
    story = this.cleanupStory(story);
    return story;
  }

  /**
   * GET TEMPLATE (ROUND-ROBIN)
   * Uses rotation to get variety
   */
  getTemplate() {
    const template = TEMPLATES[this.templateIndex % TEMPLATES.length];
    this.templateIndex++;
    return template;
  }

  /**
   * CLEANUP STORY
   */
  cleanupStory(story) {
    // Fix grammar
    story = story.replace(/a a /g, "a ");
    story = story.replace(/a ([aeiouAEIOU])/g, "an $1");
    story = story.replace(/the a /g, "the ");
    story = story.replace(/the an /g, "the ");

    // Capitalize first letter
    story = story.charAt(0).toUpperCase() + story.slice(1);

    // Add period
    if (!story.endsWith(".")) {
      story += ".";
    }

    return story;
  }

  /**
   * CALCULATE MEMORABILITY SCORE
   */
  calculateMemorability(iconSequence) {
    if (!iconSequence || iconSequence.length === 0) return 0;

    // Higher for longer sequences (more distinctive)
    const lengthScore = Math.min(iconSequence.length / 10, 1);

    // Bonus for diversity (different icons)
    const uniqueIcons = new Set(iconSequence).size;
    const diversityScore = uniqueIcons / iconSequence.length;

    // Combined score
    const score = (lengthScore * 0.4 + diversityScore * 0.6) * 100;

    return Math.round(Math.max(60, Math.min(99, score)));
  }

  /**
   * GET CACHE KEY
   */
  getCacheKey(iconSequence) {
    return crypto
      .createHash("sha256")
      .update(iconSequence.join(","))
      .digest("hex");
  }

  /**
   * RATE LIMITING
   */
  checkRateLimit(userId, limit = 10, windowMs = 60000) {
    const now = Date.now();
    const userKey = `ratelimit:${userId}`;

    if (!this.rateLimitMap.has(userKey)) {
      this.rateLimitMap.set(userKey, { count: 1, resetAt: now + windowMs });
      return true;
    }

    const record = this.rateLimitMap.get(userKey);

    if (now > record.resetAt) {
      this.rateLimitMap.set(userKey, { count: 1, resetAt: now + windowMs });
      return true;
    }

    record.count++;
    return record.count <= limit;
  }

  /**
   * CLEAR OLD CACHE
   * Call periodically to prevent memory bloat
   */
  clearOldCache(maxAge = 3600000) {
    // Simple implementation - just clear everything
    // In production, track timestamps per entry
    if (this.cache.size > 100) {
      this.cache.clear();
    }
  }
}

/**
 * SINGLETON INSTANCE
 */
let memoryAssistantInstance = null;

export function getMemoryAssistant() {
  if (!memoryAssistantInstance) {
    memoryAssistantInstance = new MemoryAssistantService();
  }
  return memoryAssistantInstance;
}

export default MemoryAssistantService;
