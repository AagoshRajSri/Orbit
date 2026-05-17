/**
 * UserAura.jsx — Phase 3: Presence Engine
 * ──────────────────────────────────────────────────────────────────────────────
 * A dynamic presence aura ring that wraps any avatar element.
 *
 * Visualises user state (online/idle/dnd/typing/syncing/offline) using
 * breathing + rotation animations drawn from MotionSystem.
 *
 * Designed to be dropped around any existing avatar without layout changes:
 *   <UserAura state="online" size={40}>
 *     <img src={avatarUrl} />
 *   </UserAura>
 *
 * Zero backend dependencies — reads state from props only.
 */

import { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { prefersReducedMotion } from "./MotionSystem";

// ── State → visual mapping ───────────────────────────────────────────────────

const STATE_CONFIG = {
  online:   { color: "#10b981", label: "Active",    shadow: "rgba(16,185,129,0.6)" },
  idle:     { color: "#f59e0b", label: "Idle",      shadow: "rgba(245,158,11,0.6)"  },
  dnd:      { color: "#ef4444", label: "DND",       shadow: "rgba(239,68,68,0.6)"   },
  invisible:{ color: "#6b7280", label: "Invisible", shadow: "rgba(107,114,128,0.3)" },
  offline:  { color: "#374151", label: "Offline",   shadow: "none"                  },
  typing:   { color: "#818cf8", label: "Typing",    shadow: "rgba(129,140,248,0.7)" },
  syncing:  { color: "#c9a84c", label: "Syncing",   shadow: "rgba(201,168,76,0.6)"  },
};

// ── Aura ring variants ───────────────────────────────────────────────────────

function auraVariants(color) {
  if (prefersReducedMotion) {
    return { idle: { opacity: 0.5 }, active: { opacity: 0.5 }, typing: { opacity: 0.8 }, syncing: {} };
  }
  return {
    idle: {
      opacity: 0,
      scale: 1,
    },
    active: {
      opacity: [0.3, 0.7, 0.3],
      scale: [1, 1.08, 1],
      transition: {
        duration: 3,
        ease: "easeInOut",
        repeat: Infinity,
        repeatType: "loop",
      },
    },
    typing: {
      opacity: [0.6, 1, 0.6],
      scale: [1, 1.14, 1],
      boxShadow: [
        `0 0 0 1.5px ${color}`,
        `0 0 0 3px ${color}, 0 0 16px ${color}`,
        `0 0 0 1.5px ${color}`,
      ],
      transition: {
        duration: 0.7,
        ease: "easeInOut",
        repeat: Infinity,
        repeatType: "loop",
      },
    },
    syncing: {
      rotate: [0, 360],
      transition: {
        duration: 2,
        ease: "linear",
        repeat: Infinity,
      },
    },
  };
}

// ── Dot indicator ────────────────────────────────────────────────────────────

function StatusDot({ state, color, shadow, size }) {
  const dotSize = Math.max(8, Math.floor(size * 0.22));
  const offset = Math.floor(dotSize * 0.1);

  if (state === "offline" || state === "invisible") return null;

  return (
    <span
      style={{
        position: "absolute",
        bottom: -offset,
        right: -offset,
        width: dotSize,
        height: dotSize,
        borderRadius: "50%",
        background: color,
        border: "2px solid var(--orb-bg, #09080f)",
        boxShadow: `0 0 ${dotSize}px ${shadow}`,
        zIndex: 10,
      }}
    />
  );
}

// ── Main component ───────────────────────────────────────────────────────────

/**
 * @param {"online"|"idle"|"dnd"|"invisible"|"offline"|"typing"|"syncing"} state
 * @param {number}  size      - Total avatar size in px (ring sizes relative to this)
 * @param {boolean} showDot   - Show the corner status dot
 * @param {string}  className - Extra classes on the wrapper
 * @param children
 */
export const UserAura = memo(function UserAura({
  state = "offline",
  size = 40,
  showDot = true,
  className = "",
  children,
}) {
  const cfg = STATE_CONFIG[state] || STATE_CONFIG.offline;
  const { color, shadow } = cfg;
  const ringVars = auraVariants(color);

  // Determine aura animation state
  const auraState =
    state === "typing"   ? "typing" :
    state === "syncing"  ? "syncing" :
    (state === "online" || state === "idle") ? "active" :
    "idle";

  const isAnimated = auraState !== "idle";

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Outer aura ring — animates based on state */}
      <AnimatePresence>
        {isAnimated && (
          <motion.span
            key={`aura-${state}`}
            animate={auraState}
            variants={ringVars}
            initial="idle"
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            style={{
              position: "absolute",
              inset: -4,
              borderRadius: "inherit",
              border: `1.5px solid ${color}`,
              pointerEvents: "none",
            }}
          />
        )}
      </AnimatePresence>

      {/* Inner glow layer — static, very subtle */}
      {state !== "offline" && (
        <span
          style={{
            position: "absolute",
            inset: -1,
            borderRadius: "inherit",
            boxShadow: `0 0 12px ${shadow}`,
            pointerEvents: "none",
            opacity: 0.5,
          }}
        />
      )}

      {/* Content (avatar, icon, etc.) */}
      {children}

      {/* Status dot */}
      {showDot && (
        <StatusDot state={state} color={color} shadow={shadow} size={size} />
      )}
    </div>
  );
});

export default UserAura;
