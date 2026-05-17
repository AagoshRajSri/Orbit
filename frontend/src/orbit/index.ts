/**
 * Orbit Foundation System — public barrel exports
 *
 * Import from here, not from individual files.
 * Tree-shaking friendly — only import what you use.
 *
 * @example
 *   import { OrbitalThemeEngine, SpatialLayout, variants, timing } from '../orbit';
 */

export { OrbitalThemeEngine }                       from './OrbitalThemeEngine';
export { EnvironmentCanvas }                         from './EnvironmentCanvas';
export type { EnvironmentCanvasHandle }              from './EnvironmentCanvas';
export { SpatialLayout, GlassSurface, DepthSeparator, useSpatialLayout } from './SpatialLayout';
export {
  variants,
  gestures,
  transitions,
  timing,
  easing,
  prefersReducedMotion,
} from './MotionSystem';

// Phase 2 — Navigation & Messaging
export { NavigationOrbit }                           from './NavigationOrbit';
export { AnimatedMessage }                           from './AnimatedMessage';

// Phase 3 — Presence
export { UserAura }                                  from './UserAura';
