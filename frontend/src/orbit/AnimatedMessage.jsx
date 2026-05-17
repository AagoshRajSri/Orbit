/**
 * AnimatedMessage.jsx
 * ──────────────────────────────────────────────────────────────────────────────
 * Drop-in animation wrapper for ALL message types (DM + Nexus).
 *
 * Replaces the existing `animation: isLatest ? "fadeUpMsg 0.25s ease-out" : "none"`
 * pattern with a smooth, depth-aware Framer Motion spring that never disrupts
 * the reading flow regardless of whether it's the latest or an older message.
 *
 * Usage:
 *   // Wrap any existing message component:
 *   <AnimatedMessage id={msg._id} isMine={mine} isNew={isLatest}>
 *     <OrbitMsgBubble ... />
 *   </AnimatedMessage>
 *
 *   // For lists, wrap the container with AnimatePresence:
 *   <AnimatePresence initial={false} mode="append">
 *     {messages.map(msg => (
 *       <AnimatedMessage key={msg._id || msg.idempotencyKey} id={msg._id} isMine={...} isNew={...}>
 *         ...
 *       </AnimatedMessage>
 *     ))}
 *   </AnimatePresence>
 *
 * Animation philosophy:
 *  - Messages arrive FROM DEPTH (scale up + fade) — never slide from edges
 *  - Sent messages: subtle rightward bloom
 *  - Received messages: subtle leftward bloom
 *  - Older messages on initial load: instant (no animation) to avoid cascade flash
 *  - Reduced motion: simple opacity fade only
 */

import { memo } from "react";
import { motion } from "framer-motion";
import { prefersReducedMotion } from "./MotionSystem";

// ── Variant definitions ──────────────────────────────────────────────────────

const SPRING = { type: "spring", stiffness: 380, damping: 30, mass: 0.8 };
const FAST   = { duration: 0.12, ease: [0.0, 0.0, 0.2, 1] };

/**
 * Full-motion variants — used when prefers-reduced-motion is false
 * @param {boolean} isMine - true if the current user sent this message
 */
function makeVariants(isMine) {
  return {
    hidden: {
      opacity: 0,
      scale: 0.96,
      y: 6,
      x: isMine ? 4 : -4,
      filter: "blur(2px)",
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      x: 0,
      filter: "blur(0px)",
      transition: SPRING,
    },
    exit: {
      opacity: 0,
      scale: 0.97,
      y: -3,
      filter: "blur(1px)",
      transition: { duration: 0.14, ease: [0.4, 0, 1, 1] },
    },
  };
}

/** Accessibility-safe variants — only opacity changes */
const reducedVariants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: FAST },
  exit:    { opacity: 0, transition: { duration: 0.08 } },
};

// ── Hover micro-physics ──────────────────────────────────────────────────────
const hoverAnim = prefersReducedMotion ? {} : {
  scale: 1.005,
  transition: { type: "spring", stiffness: 600, damping: 40 },
};

// ── Component ────────────────────────────────────────────────────────────────

/**
 * AnimatedMessage
 *
 * @param {string}   id       - Unique message id (used as React key externally)
 * @param {boolean}  isMine   - True for sent messages
 * @param {boolean}  isNew    - True only for the freshly-arrived message
 *                              (pass false for messages loaded from history)
 * @param {ReactNode} children
 */
export const AnimatedMessage = memo(function AnimatedMessage({
  id,
  isMine = false,
  isNew = false,
  children,
}) {
  const variants = prefersReducedMotion
    ? reducedVariants
    : makeVariants(isMine);

  return (
    <motion.div
      layout="position"
      layoutId={id ? `msg-${id}` : undefined}
      variants={variants}
      /**
       * History messages (isNew=false) skip the enter animation entirely
       * by starting as "visible". This prevents a massive cascade flash
       * when 50 messages load at once.
       */
      initial={isNew ? "hidden" : false}
      animate="visible"
      exit="exit"
      whileHover={isNew ? undefined : hoverAnim}
      style={{
        willChange: isNew ? "opacity, transform" : "auto",
        // Ensure layout shifts don't cause reflows during animation
        position: "relative",
      }}
    >
      {children}
    </motion.div>
  );
});

export default AnimatedMessage;
