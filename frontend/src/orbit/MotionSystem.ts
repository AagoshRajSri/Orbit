/**
 * MotionSystem.ts
 * ──────────────────────────────────────────────────────────────────────────────
 * Single source of truth for ALL animation in Orbit.
 *
 * Design principles:
 *  - Enter from depth (scale + opacity), never from edges
 *  - Exit into depth (scale down + fade)
 *  - All durations drawn from the canonical timing scale
 *  - prefers-reduced-motion degrades every variant gracefully
 *  - Named easing curves — never inline cubic-bezier strings
 *
 * Usage:
 *   import { variants, timing, easing } from '../orbit/MotionSystem';
 *   <motion.div variants={variants.surface} initial="hidden" animate="visible" />
 */

// ── Reduced-motion detection (evaluated once at module load) ─────────────────
export const prefersReducedMotion: boolean =
  typeof window !== 'undefined'
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ── Timing scale (ms) ────────────────────────────────────────────────────────
export const timing = {
  /** Micro-feedback: icon pops, button states */
  t1: 0.08,
  /** Element state transitions: hover, focus */
  t2: 0.16,
  /** UI enter / exit animations */
  t3: 0.32,
  /** Spatial camera moves, page transitions */
  t4: 0.64,
  /** Atmospheric, ambient sequences */
  t5: 1.2,
} as const;

// ── Named easing curves ──────────────────────────────────────────────────────
export const easing = {
  /** iOS-style spring feel — fast start, soft landing */
  orbital:     [0.16, 1, 0.3, 1] as [number, number, number, number],
  /** Dramatic entrance, slow ease-out */
  emerge:      [0.0, 0.0, 0.2, 1] as [number, number, number, number],
  /** Swift exit */
  dissolve:    [0.4, 0, 1, 1] as [number, number, number, number],
  /** Standard material ease */
  smooth:      [0.4, 0, 0.2, 1] as [number, number, number, number],
  /** Elastic micro-bounce for feedback */
  springLight: { type: 'spring', stiffness: 400, damping: 30 } as const,
  /** Heavier spring for spatial moves */
  springDeep:  { type: 'spring', stiffness: 200, damping: 28, mass: 1.2 } as const,
} as const;

// ── Framer Motion variant factory ────────────────────────────────────────────
/** Degrades to a simple opacity fade when reduced-motion is preferred */
function makeVariant(
  full: Record<string, unknown>,
  reduced: Record<string, unknown>
) {
  return prefersReducedMotion ? reduced : full;
}

// ── Core variant set ─────────────────────────────────────────────────────────
export const variants = {
  /**
   * Generic surface: panels, cards, dialogs.
   * Arrives from below + depth, exits into depth.
   */
  surface: {
    hidden: makeVariant(
      { opacity: 0, scale: 0.96, y: 12, filter: 'blur(4px)' },
      { opacity: 0 }
    ),
    visible: makeVariant(
      {
        opacity: 1, scale: 1, y: 0, filter: 'blur(0px)',
        transition: { duration: timing.t3, ease: easing.orbital },
      },
      { opacity: 1, transition: { duration: timing.t2 } }
    ),
    exit: makeVariant(
      {
        opacity: 0, scale: 0.94, y: -8, filter: 'blur(2px)',
        transition: { duration: timing.t2, ease: easing.dissolve },
      },
      { opacity: 0, transition: { duration: timing.t1 } }
    ),
  },

  /**
   * Message surface: individual messages in the ribbon.
   * Subtle — must not be distracting in active conversations.
   */
  message: {
    hidden: makeVariant(
      { opacity: 0, y: 6, scale: 0.99 },
      { opacity: 0 }
    ),
    visible: makeVariant(
      {
        opacity: 1, y: 0, scale: 1,
        transition: { duration: timing.t2, ease: easing.orbital },
      },
      { opacity: 1, transition: { duration: timing.t1 } }
    ),
    exit: makeVariant(
      { opacity: 0, scale: 0.98, transition: { duration: timing.t1 } },
      { opacity: 0, transition: { duration: timing.t1 } }
    ),
    hover: makeVariant(
      { scale: 1.005, transition: easing.springLight },
      {}
    ),
  },

  /**
   * Orbital node: navigation nodes drifting in the nav ring.
   * Each node staggers in from the void.
   */
  orbitalNode: {
    hidden: makeVariant(
      { opacity: 0, scale: 0.6, filter: 'blur(8px)' },
      { opacity: 0 }
    ),
    visible: makeVariant(
      {
        opacity: 1, scale: 1, filter: 'blur(0px)',
        transition: { duration: timing.t4, ease: easing.emerge },
      },
      { opacity: 1, transition: { duration: timing.t2 } }
    ),
    exit: makeVariant(
      {
        opacity: 0, scale: 0.5, filter: 'blur(12px)',
        transition: { duration: timing.t3, ease: easing.dissolve },
      },
      { opacity: 0, transition: { duration: timing.t1 } }
    ),
    hover: makeVariant(
      { scale: 1.12, filter: 'brightness(1.2)', transition: easing.springLight },
      { scale: 1.05 }
    ),
    selected: makeVariant(
      {
        scale: 1.2, filter: 'brightness(1.3)',
        transition: easing.springDeep,
      },
      { scale: 1.1 }
    ),
  },

  /**
   * Page / route transition: the stage for content areas.
   * Full spatial move — most dramatic variant.
   */
  stage: {
    hidden: makeVariant(
      { opacity: 0, scale: 0.92, filter: 'blur(8px)' },
      { opacity: 0 }
    ),
    visible: makeVariant(
      {
        opacity: 1, scale: 1, filter: 'blur(0px)',
        transition: { duration: timing.t4, ease: easing.orbital, delay: 0.05 },
      },
      { opacity: 1, transition: { duration: timing.t3 } }
    ),
    exit: makeVariant(
      {
        opacity: 0, scale: 1.04, filter: 'blur(4px)',
        transition: { duration: timing.t3, ease: easing.dissolve },
      },
      { opacity: 0, transition: { duration: timing.t2 } }
    ),
  },

  /**
   * Presence aura: ambient glow ring around user nodes.
   * Breathes continuously when active.
   */
  aura: {
    idle: { opacity: 0.4, scale: 1 },
    active: makeVariant(
      {
        opacity: [0.4, 0.8, 0.4],
        scale: [1, 1.06, 1],
        transition: {
          duration: timing.t5,
          ease: 'easeInOut',
          repeat: Infinity,
          repeatType: 'loop',
        },
      },
      { opacity: 0.6, scale: 1 }
    ),
    typing: makeVariant(
      {
        opacity: [0.6, 1, 0.6],
        scale: [1, 1.12, 1],
        transition: {
          duration: 0.8,
          ease: 'easeInOut',
          repeat: Infinity,
          repeatType: 'loop',
        },
      },
      { opacity: 0.8, scale: 1 }
    ),
    syncing: makeVariant(
      {
        rotate: [0, 360],
        transition: {
          duration: 2,
          ease: 'linear',
          repeat: Infinity,
        },
      },
      {}
    ),
  },

  /**
   * Overlay / modal backdrop: full-screen semi-transparent layer.
   */
  backdrop: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: timing.t2, ease: easing.smooth },
    },
    exit: {
      opacity: 0,
      transition: { duration: timing.t2, ease: easing.dissolve },
    },
  },

  /**
   * Stagger container: wraps lists of items so they cascade in.
   * Apply to parent; children use 'item' variant.
   */
  staggerContainer: {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.06,
        delayChildren: 0.04,
      },
    },
    exit: {
      transition: { staggerChildren: 0.03, staggerDirection: -1 },
    },
  },

  /**
   * Stagger item: child of staggerContainer.
   */
  staggerItem: {
    hidden: makeVariant(
      { opacity: 0, y: 8, scale: 0.98 },
      { opacity: 0 }
    ),
    visible: makeVariant(
      {
        opacity: 1, y: 0, scale: 1,
        transition: { duration: timing.t3, ease: easing.orbital },
      },
      { opacity: 1 }
    ),
    exit: makeVariant(
      { opacity: 0, y: -4, transition: { duration: timing.t1 } },
      { opacity: 0 }
    ),
  },

  /**
   * Notification / toast: slides in from top-right.
   */
  notification: {
    hidden: makeVariant(
      { opacity: 0, x: 40, scale: 0.95 },
      { opacity: 0 }
    ),
    visible: makeVariant(
      {
        opacity: 1, x: 0, scale: 1,
        transition: { duration: timing.t3, ease: easing.orbital },
      },
      { opacity: 1 }
    ),
    exit: makeVariant(
      {
        opacity: 0, x: 40, scale: 0.9,
        transition: { duration: timing.t2, ease: easing.dissolve },
      },
      { opacity: 0 }
    ),
  },
} as const;

// ── Gesture presets ─────────────────────────────────────────────────────────
/** Apply as `whileHover` / `whileTap` directly on motion elements */
export const gestures = {
  /** Subtle lift for buttons, links */
  lift: prefersReducedMotion ? {} : {
    scale: 1.04,
    transition: easing.springLight,
  },
  /** Press compression for buttons */
  press: prefersReducedMotion ? {} : {
    scale: 0.96,
    transition: easing.springLight,
  },
  /** Glow pulse for active orbital nodes */
  glow: prefersReducedMotion ? {} : {
    filter: 'brightness(1.3) saturate(1.2)',
    transition: { duration: timing.t1 },
  },
} as const;

// ── Transition presets ───────────────────────────────────────────────────────
/** Standalone transition configs for `useAnimate` / direct motion props */
export const transitions = {
  fast:    { duration: timing.t1, ease: easing.smooth },
  normal:  { duration: timing.t2, ease: easing.smooth },
  spatial: { duration: timing.t3, ease: easing.orbital },
  deep:    { duration: timing.t4, ease: easing.orbital },
  spring:  easing.springLight,
  springDeep: easing.springDeep,
} as const;
