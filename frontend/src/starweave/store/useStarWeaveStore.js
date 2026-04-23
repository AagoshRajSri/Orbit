/**
 * useStarWeaveStore — single source of truth for the StarWeave auth session.
 *
 * Design: Only slowly-changing state lives here (phase, selected stars, mode flags).
 * High-frequency render data (cursor position, dwell progress) stays in engine refs
 * to avoid React re-renders on every animation frame.
 */
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

export const useStarWeaveStore = create(
  subscribeWithSelector((set, get) => ({

    // ─── Auth flow phase ──────────────────────────────────────────────────
    // 'idle' | 'camera-prompt' | 'tracking' | 'awaiting-auth' | 'authenticated' | 'failed'
    phase: 'idle',

    // ─── Star selections (max 5, in order) ───────────────────────────────
    selectedStars: [],

    // ─── Anti-spoof snapshot (updated after each star selection) ─────────
    antiSpoof: {
      liveness: false,
      temporal: false,
      depth: true,          // default true in mouse-mode (no z to check)
      patternVariation: false,
      suspicionLevel: 'none',
      recommendation: 'allow',
    },

    // ─── Behavioral score ─────────────────────────────────────────────────
    behavioralScore: {
      score: 0,
      timingsMs: [],
      avgVelocity: 0,
      jitterRms: 0,
    },

    // ─── Mode flags ───────────────────────────────────────────────────────
    isMouseMode: false,
    isCameraActive: false,

    // ─── Error message ────────────────────────────────────────────────────
    error: null,

    // ─── Actions ──────────────────────────────────────────────────────────
    setPhase: (phase) => set({ phase }),

    /**
     * Add a star to the selection.
     * Returns true if added, false if already present or max reached.
     */
    addSelectedStar: (starName) => {
      const { selectedStars } = get();
      if (selectedStars.includes(starName) || selectedStars.length >= 5) return false;
      set({ selectedStars: [...selectedStars, starName] });
      return true;
    },

    clearSelectedStars: () => set({ selectedStars: [] }),

    setAntiSpoof: (antiSpoof) => set({ antiSpoof }),

    setBehavioralScore: ({ score, timingsMs, avgVelocity, jitterRms }) =>
      set({ behavioralScore: { score, timingsMs: timingsMs ?? [], avgVelocity: avgVelocity ?? 0, jitterRms: jitterRms ?? 0 } }),

    setMouseMode: (isMouseMode) => set({ isMouseMode }),
    setCameraActive: (isCameraActive) => set({ isCameraActive }),
    setError: (error) => set({ error }),

    /** Full reset — call between attempts */
    reset: () =>
      set({
        phase: 'idle',
        selectedStars: [],
        antiSpoof: {
          liveness: false,
          temporal: false,
          depth: true,
          patternVariation: false,
          suspicionLevel: 'none',
          recommendation: 'allow',
        },
        behavioralScore: { score: 0, timingsMs: [], avgVelocity: 0, jitterRms: 0 },
        error: null,
      }),
  })),
);
