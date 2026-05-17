/**
 * useCanvasTelemetry.ts
 * ──────────────────────────────────────────────────────────────────────────────
 * Phase 5A: WebGL Performance & Canvas Telemetry
 *
 * Measures live frame-rate using a sliding window of RAF timestamps.
 * When average FPS drops below the LOW_FPS_THRESHOLD for a sustained period,
 * it broadcasts a custom DOM event so EnvironmentCanvas can gracefully degrade
 * to a CSS gradient fallback — preserving the aesthetic without GPU-burning.
 *
 * Architecture:
 *  - Runs entirely in a RAF loop; zero React renders during measurement
 *  - Sliding window of 60 frames for stable FPS reading
 *  - Hysteresis: must sustain LOW_FPS for 3s before flagging (avoids flicker)
 *  - Recovery: sustained HIGH_FPS for 10s re-enables WebGL
 */

import { useEffect, useRef, useCallback } from 'react';

// ── Thresholds ────────────────────────────────────────────────────────────────
const LOW_FPS_THRESHOLD   = 28;  // below this → switch to CSS fallback
const HIGH_FPS_THRESHOLD  = 50;  // above this → re-enable WebGL
const DEGRADATION_DELAY   = 3000; // ms of low FPS before degrading
const RECOVERY_DELAY      = 10000; // ms of high FPS before recovering
const FRAME_WINDOW        = 60;   // rolling window size

// ── Events ───────────────────────────────────────────────────────────────────
export const CANVAS_TELEMETRY_EVENT = 'orbit:canvas-telemetry';
export type CanvasTelemetryPayload  = {
  fps: number;
  degraded: boolean;
  reason: 'fps-drop' | 'webgl-unavailable' | 'reduced-motion' | 'ok';
};

function dispatchTelemetry(payload: CanvasTelemetryPayload) {
  window.dispatchEvent(
    new CustomEvent<CanvasTelemetryPayload>(CANVAS_TELEMETRY_EVENT, {
      detail: payload,
      bubbles: false,
    })
  );
}

// ── Hook ─────────────────────────────────────────────────────────────────────
export function useCanvasTelemetry() {
  const rafRef          = useRef<number>(0);
  const frameTimesRef   = useRef<number[]>([]);
  const degradedRef     = useRef(false);
  const lowSinceRef     = useRef<number | null>(null);
  const highSinceRef    = useRef<number | null>(null);
  const lastFpsRef      = useRef(60);

  const measure = useCallback((now: number) => {
    const times = frameTimesRef.current;
    times.push(now);

    // Keep only the last FRAME_WINDOW frames
    if (times.length > FRAME_WINDOW) {
      times.splice(0, times.length - FRAME_WINDOW);
    }

    // Need at least 10 frames to get a meaningful reading
    if (times.length >= 10) {
      const elapsed = times[times.length - 1] - times[0];
      const fps     = ((times.length - 1) / elapsed) * 1000;
      lastFpsRef.current = fps;

      const nowMs = performance.now();

      if (fps < LOW_FPS_THRESHOLD) {
        highSinceRef.current = null;
        if (lowSinceRef.current === null) {
          lowSinceRef.current = nowMs;
        } else if (!degradedRef.current && nowMs - lowSinceRef.current >= DEGRADATION_DELAY) {
          // Transition to degraded mode
          degradedRef.current = true;
          dispatchTelemetry({ fps: Math.round(fps), degraded: true, reason: 'fps-drop' });
        }
      } else if (fps > HIGH_FPS_THRESHOLD) {
        lowSinceRef.current = null;
        if (degradedRef.current) {
          if (highSinceRef.current === null) {
            highSinceRef.current = nowMs;
          } else if (nowMs - highSinceRef.current >= RECOVERY_DELAY) {
            // Recover WebGL
            degradedRef.current  = false;
            highSinceRef.current = null;
            dispatchTelemetry({ fps: Math.round(fps), degraded: false, reason: 'ok' });
          }
        }
      } else {
        // FPS is in mid-range — reset both timers
        lowSinceRef.current  = null;
        highSinceRef.current = null;
      }
    }

    rafRef.current = requestAnimationFrame(measure);
  }, []);

  useEffect(() => {
    // Check for WebGL availability immediately
    try {
      const canvas = document.createElement('canvas');
      const ctx    = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!ctx) {
        dispatchTelemetry({ fps: 0, degraded: true, reason: 'webgl-unavailable' });
        return;
      }
    } catch {
      dispatchTelemetry({ fps: 0, degraded: true, reason: 'webgl-unavailable' });
      return;
    }

    // Check prefers-reduced-motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      dispatchTelemetry({ fps: 60, degraded: true, reason: 'reduced-motion' });
      return;
    }

    rafRef.current = requestAnimationFrame(measure);

    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, [measure]);

  return lastFpsRef;
}
