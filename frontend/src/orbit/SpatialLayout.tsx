/**
 * SpatialLayout.tsx
 * ──────────────────────────────────────────────────────────────────────────────
 * Root layer architecture for Orbit.
 *
 * Layer stack (z-index ascending):
 *  Layer 0 (z: 0)   — EnvironmentCanvas: Three.js scene (behind everything)
 *  Layer 1 (z: 10)  — AtmosphericField: backdrop-filter blur panels
 *  Layer 2 (z: 20)  — ContentStage: active conversation surfaces
 *  Layer 3 (z: 30)  — NavigationLayer: orbital nav system
 *  Layer 4 (z: 40)  — PresenceLayer: floating presence indicators
 *  Layer 5 (z: 50)  — OverlayLayer: modals, command surfaces
 *  Layer 6 (z: 100) — SystemLayer: toasts, connection status (not managed here)
 *
 * Usage:
 *   <SpatialLayout>
 *     <SpatialLayout.Content>...</SpatialLayout.Content>
 *     <SpatialLayout.Navigation>...</SpatialLayout.Navigation>
 *     <SpatialLayout.Presence>...</SpatialLayout.Presence>
 *     <SpatialLayout.Overlay>...</SpatialLayout.Overlay>
 *   </SpatialLayout>
 *
 * The EnvironmentCanvas is automatically mounted at Layer 0.
 * OrbitalThemeEngine is automatically mounted (renders null).
 */

import React, {
  createContext,
  useContext,
  useRef,
  useCallback,
  type ReactNode,
  type CSSProperties,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { variants, timing, easing } from './MotionSystem';
import { EnvironmentCanvas, type EnvironmentCanvasHandle } from './EnvironmentCanvas';
import { OrbitalThemeEngine } from './OrbitalThemeEngine';

// ── Context: expose canvas pulse API to the tree ─────────────────────────────
interface SpatialContextValue {
  /** Trigger an activity pulse on the environment canvas */
  pulseEnvironment: (channelId?: string) => void;
}

const SpatialContext = createContext<SpatialContextValue>({
  pulseEnvironment: () => {},
});

export function useSpatialLayout(): SpatialContextValue {
  return useContext(SpatialContext);
}

// ── Layer style factories ─────────────────────────────────────────────────────
const layerBase: CSSProperties = {
  position: 'absolute',
  inset: 0,
  pointerEvents: 'none',
};

const layerStyles: Record<string, CSSProperties> = {
  atmospheric: {
    ...layerBase,
    zIndex: 10,
    // Atmospheric warmth vignette — edges breathe with the scene
    background: `
      radial-gradient(ellipse 80% 50% at 50% 100%,
        rgba(var(--orb-accent-warm-rgb, 180,110,50), 0.06) 0%,
        transparent 70%
      ),
      radial-gradient(ellipse 60% 40% at 10% 20%,
        rgba(var(--orb-accent-cold-rgb, 50,100,200), 0.04) 0%,
        transparent 60%
      )
    `,
    transition: 'background 6s ease',
  },
  content: {
    ...layerBase,
    zIndex: 20,
    pointerEvents: 'auto',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  navigation: {
    ...layerBase,
    zIndex: 30,
    pointerEvents: 'auto',
  },
  presence: {
    ...layerBase,
    zIndex: 40,
    pointerEvents: 'none',
  },
  overlay: {
    ...layerBase,
    zIndex: 50,
    pointerEvents: 'auto',
  },
};

// ── Root container ───────────────────────────────────────────────────────────
interface SpatialLayoutProps {
  children: ReactNode;
  /** Additional class names for the root element */
  className?: string;
}

/**
 * SpatialLayout — the root of the Orbit visual hierarchy.
 * 
 * Renders the EnvironmentCanvas and OrbitalThemeEngine automatically.
 * Children use the sub-components below to slot into the correct layer.
 */
export function SpatialLayout({ children, className }: SpatialLayoutProps) {
  const canvasRef = useRef<EnvironmentCanvasHandle>(null);

  const pulseEnvironment = useCallback((channelId?: string) => {
    canvasRef.current?.pulse(channelId);
  }, []);

  return (
    <SpatialContext.Provider value={{ pulseEnvironment }}>
      {/* Theme engine — renders null, manages CSS vars */}
      <OrbitalThemeEngine />

      <div
        className={className}
        style={{
          position: 'fixed',
          inset: 0,
          overflow: 'hidden',
          // Apply the orbital background color as CSS fallback
          backgroundColor: 'var(--orb-bg-primary, hsl(228, 42%, 5%))',
          // Isolation creates new stacking context
          isolation: 'isolate',
        }}
      >
        {/* Layer 0: Three.js environment */}
        <EnvironmentCanvas ref={canvasRef} />

        {/* Layer 1: Atmospheric field (vignette/depth layer) */}
        <div style={layerStyles.atmospheric} aria-hidden="true" />

        {/* Layer 2–5: Named slots for children */}
        {children}
      </div>
    </SpatialContext.Provider>
  );
}

// ── Named slot sub-components ────────────────────────────────────────────────

/** Layer 2 — Content: main conversation surfaces, chat views */
SpatialLayout.Content = function SpatialContent({
  children,
  animationKey,
  style,
}: {
  children: ReactNode;
  /** Change to trigger a spatial page transition */
  animationKey?: string;
  style?: CSSProperties;
}) {
  return (
    <div style={{ ...layerStyles.content, ...style }}>
      <AnimatePresence mode="wait">
        <motion.div
          key={animationKey ?? 'content'}
          variants={variants.stage}
          initial="hidden"
          animate="visible"
          exit="exit"
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

/** Layer 3 — Navigation: orbital nav, mobile thumb-arc */
SpatialLayout.Navigation = function SpatialNavigation({
  children,
  style,
}: {
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <div style={{ ...layerStyles.navigation, ...style }}>
      {children}
    </div>
  );
};

/** Layer 4 — Presence: floating user auras, typing indicators */
SpatialLayout.Presence = function SpatialPresence({
  children,
  style,
}: {
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{ ...layerStyles.presence, ...style }}
      aria-live="polite"
      aria-label="User presence indicators"
    >
      {children}
    </div>
  );
};

/** Layer 5 — Overlay: modals, dialogs, command surface */
SpatialLayout.Overlay = function SpatialOverlay({
  children,
  open,
  onClose,
  style,
}: {
  children: ReactNode;
  open: boolean;
  /** Called when backdrop is clicked */
  onClose?: () => void;
  style?: CSSProperties;
}) {
  return (
    <AnimatePresence>
      {open && (
        <div style={{ ...layerStyles.overlay, ...style }}>
          {/* Backdrop */}
          <motion.div
            variants={variants.backdrop}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(5, 4, 18, 0.65)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
            }}
            aria-hidden="true"
          />
          {/* Content */}
          <motion.div
            variants={variants.surface}
            initial="hidden"
            animate="visible"
            exit="exit"
            style={{
              position: 'relative',
              zIndex: 1,
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

// ── Glass surface primitive ───────────────────────────────────────────────────
/**
 * GlassSurface — a reusable frosted glass card for content surfaces.
 *
 * Uses --orb-bg-glass and --orb-accent-cold for adaptive styling.
 * All theme-specific surfaces should be built on this primitive.
 */
interface GlassSurfaceProps {
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
  /** Apply a subtle warm/cold glow border */
  glow?: 'warm' | 'cold' | 'none';
  /** Animate in as a surface variant */
  animate?: boolean;
  onClick?: () => void;
  role?: string;
  'aria-label'?: string;
}

export function GlassSurface({
  children,
  style,
  className,
  glow = 'none',
  animate = true,
  onClick,
  ...ariaProps
}: GlassSurfaceProps) {
  const glowStyle: CSSProperties =
    glow === 'warm'
      ? { boxShadow: '0 0 0 1px var(--orb-glow-warm, rgba(180,110,50,0.3)), 0 8px 32px var(--orb-glow-warm, rgba(180,110,50,0.15))' }
      : glow === 'cold'
      ? { boxShadow: '0 0 0 1px var(--orb-glow-cold, rgba(50,100,200,0.25)), 0 8px 32px var(--orb-glow-cold, rgba(50,100,200,0.12))' }
      : {};

  const baseStyle: CSSProperties = {
    background: 'var(--orb-bg-glass, rgba(12, 10, 30, 0.7))',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 20,
    ...glowStyle,
    ...style,
  };

  if (animate) {
    return (
      <motion.div
        className={className}
        style={baseStyle}
        variants={variants.surface}
        initial="hidden"
        animate="visible"
        exit="exit"
        whileHover={onClick ? { scale: 1.005, transition: { duration: timing.t1 } } : undefined}
        onClick={onClick}
        {...ariaProps}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div className={className} style={baseStyle} onClick={onClick} {...ariaProps}>
      {children}
    </div>
  );
}

// ── Depth separator ───────────────────────────────────────────────────────────
/** Subtle atmospheric separator — not a line, an environmental shift */
export function DepthSeparator({ style }: { style?: CSSProperties }) {
  return (
    <div
      aria-hidden="true"
      style={{
        height: 1,
        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.05) 30%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.05) 70%, transparent)',
        margin: '0 -8px',
        ...style,
      }}
    />
  );
}

export default SpatialLayout;
