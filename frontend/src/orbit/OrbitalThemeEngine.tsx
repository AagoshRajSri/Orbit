/**
 * OrbitalThemeEngine.tsx
 * ──────────────────────────────────────────────────────────────────────────────
 * Manages the living color system for Orbit.
 *
 * What it does:
 *  1. Derives a time-of-day color temperature (dawn → noon → dusk → midnight)
 *  2. Blends activity-level warmth based on Zustand chat/presence state
 *  3. Shifts hue when Spotify is playing (music-responsive ambience)
 *  4. Writes CSS custom properties directly to :root — ZERO React re-renders
 *  5. Subscribes to stores via getState().subscribe (not hooks) for perf safety
 *
 * Output custom properties (consumed by all CSS throughout the app):
 *   --orb-bg-primary        Deep background void
 *   --orb-bg-secondary      Secondary surface
 *   --orb-bg-glass          Glassmorphism surface (rgba)
 *   --orb-accent-warm       Human warmth accent (amber/copper)
 *   --orb-accent-cold       Tech precision accent (ice blue/silver)
 *   --orb-accent-music      Music-reactive hue shift
 *   --orb-text-primary      Primary text (luminant white)
 *   --orb-text-secondary    Secondary / metadata text
 *   --orb-glow-warm         Warm glow shadow color
 *   --orb-glow-cold         Cold glow shadow color
 *   --orb-particle-color    EnvironmentCanvas particle color
 *   --orb-star-opacity      Star field opacity
 *   --orb-hue-rotate        Global hue-rotate for music sync
 */

import { useEffect, useRef } from 'react';
import { useSpotifyStore } from '../store/useSpotifyStore';
import { useAuthStore } from '../store/useAuthStore';
import { useChatStore } from '../store/useChatStore';

// ── Time-of-day palette ──────────────────────────────────────────────────────
interface TimeSlot {
  label: string;
  /** HSL for deep background */
  bgPrimary: string;
  bgSecondary: string;
  accentWarm: string;
  accentCold: string;
  textPrimary: string;
  textSecondary: string;
  starOpacity: number;
}

const TIME_SLOTS: TimeSlot[] = [
  {
    label: 'dawn',      // 05:00–08:00
    bgPrimary:    'hsl(220, 35%, 6%)',
    bgSecondary:  'hsl(215, 28%, 10%)',
    accentWarm:   'hsl(28, 90%, 62%)',   // amber gold
    accentCold:   'hsl(195, 80%, 65%)',  // powder blue
    textPrimary:  'hsl(35, 80%, 93%)',
    textSecondary:'hsl(30, 40%, 65%)',
    starOpacity:  0.7,
  },
  {
    label: 'morning',   // 08:00–12:00
    bgPrimary:    'hsl(222, 30%, 8%)',
    bgSecondary:  'hsl(218, 24%, 12%)',
    accentWarm:   'hsl(35, 95%, 60%)',
    accentCold:   'hsl(200, 85%, 62%)',
    textPrimary:  'hsl(40, 70%, 94%)',
    textSecondary:'hsl(35, 35%, 67%)',
    starOpacity:  0.4,
  },
  {
    label: 'noon',      // 12:00–16:00
    bgPrimary:    'hsl(224, 28%, 9%)',
    bgSecondary:  'hsl(220, 22%, 13%)',
    accentWarm:   'hsl(42, 100%, 58%)',
    accentCold:   'hsl(205, 90%, 60%)',
    textPrimary:  'hsl(45, 60%, 96%)',
    textSecondary:'hsl(40, 30%, 68%)',
    starOpacity:  0.25,
  },
  {
    label: 'dusk',      // 16:00–20:00
    bgPrimary:    'hsl(218, 38%, 7%)',
    bgSecondary:  'hsl(214, 30%, 11%)',
    accentWarm:   'hsl(22, 95%, 58%)',   // ember orange
    accentCold:   'hsl(190, 80%, 58%)',
    textPrimary:  'hsl(30, 75%, 92%)',
    textSecondary:'hsl(25, 40%, 64%)',
    starOpacity:  0.55,
  },
  {
    label: 'midnight',  // 20:00–05:00
    bgPrimary:    'hsl(228, 42%, 5%)',
    bgSecondary:  'hsl(225, 35%, 9%)',
    accentWarm:   'hsl(30, 80%, 55%)',   // dim copper
    accentCold:   'hsl(210, 85%, 55%)',  // deep ice
    textPrimary:  'hsl(40, 60%, 90%)',
    textSecondary:'hsl(35, 30%, 60%)',
    starOpacity:  0.85,
  },
];

function getTimeSlot(hour: number): TimeSlot {
  if (hour >= 5  && hour < 8)  return TIME_SLOTS[0];
  if (hour >= 8  && hour < 12) return TIME_SLOTS[1];
  if (hour >= 12 && hour < 16) return TIME_SLOTS[2];
  if (hour >= 16 && hour < 20) return TIME_SLOTS[3];
  return TIME_SLOTS[4]; // midnight
}

// ── Interpolation helpers ────────────────────────────────────────────────────
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * Math.max(0, Math.min(1, t));
}

/** Parse 'hsl(h, s%, l%)' → [h, s, l] */
function parseHsl(hsl: string): [number, number, number] {
  const m = hsl.match(/hsl\((\d+(?:\.\d+)?),\s*(\d+(?:\.\d+)?)%,\s*(\d+(?:\.\d+)?)%\)/);
  if (!m) return [0, 0, 0];
  return [parseFloat(m[1]), parseFloat(m[2]), parseFloat(m[3])];
}

function lerpHsl(a: string, b: string, t: number): string {
  const [ah, as_, al] = parseHsl(a);
  const [bh, bs, bl]  = parseHsl(b);
  return `hsl(${lerp(ah, bh, t).toFixed(1)}, ${lerp(as_, bs, t).toFixed(1)}%, ${lerp(al, bl, t).toFixed(1)}%)`;
}

// ── Property writer ──────────────────────────────────────────────────────────
function writeVars(props: Record<string, string | number>): void {
  const root = document.documentElement;
  for (const [key, val] of Object.entries(props)) {
    root.style.setProperty(key, String(val));
  }
}

// ── Activity level sampler ───────────────────────────────────────────────────
/** Returns 0–1 based on recent messaging activity */
function sampleActivityLevel(): number {
  const chatState    = useChatStore.getState();
  const presenceMap  = useAuthStore.getState().presenceMap;

  const recentMessages = chatState.messages.filter(m => {
    const age = Date.now() - new Date(m.createdAt ?? 0).getTime();
    return age < 120_000; // messages in last 2 minutes
  }).length;

  const typingCount = chatState.users.filter(u => (u as any).isTyping).length;
  const onlineCount = Object.values(presenceMap).filter(Boolean).length;

  const raw = Math.min(1, (recentMessages * 0.08) + (typingCount * 0.3) + (onlineCount * 0.05));
  return raw;
}

// ── Component ────────────────────────────────────────────────────────────────
/**
 * OrbitalThemeEngine
 *
 * Renders nothing. Mounts once. Updates CSS custom properties via RAF loop.
 * Must be placed near the root of the app (inside providers, before content).
 */
export function OrbitalThemeEngine(): null {
  const rafRef           = useRef<number>(0);
  const lastSlotRef      = useRef<string>('');
  const activityRef      = useRef<number>(0);
  const musicHueRef      = useRef<number>(0);
  const musicHueTargetRef= useRef<number>(0);

  // Subscribe to Spotify for music hue shift — no React re-renders
  useEffect(() => {
    const unsub = useSpotifyStore.subscribe(
      state => ({ isPlaying: state.isPlaying, currentTrack: state.currentTrack }),
      ({ isPlaying, currentTrack }) => {
        if (!isPlaying || !currentTrack) {
          musicHueTargetRef.current = 0;
          return;
        }
        // Derive a gentle hue shift from track name hash
        let hash = 0;
        for (const ch of (currentTrack.name ?? '')) {
          hash = (hash * 31 + ch.charCodeAt(0)) & 0xffff;
        }
        // Map to ±20° hue rotation
        musicHueTargetRef.current = ((hash % 40) - 20);
      },
    );
    return unsub;
  }, []);

  // Sample activity level every 10 seconds (no store subscription needed)
  useEffect(() => {
    const id = setInterval(() => {
      activityRef.current = sampleActivityLevel();
    }, 10_000);
    activityRef.current = sampleActivityLevel();
    return () => clearInterval(id);
  }, []);

  // RAF loop — smooth property interpolation
  useEffect(() => {
    let prevTime = performance.now();

    function tick(now: number): void {
      const dt = Math.min((now - prevTime) / 1000, 0.1); // cap at 100ms
      prevTime = now;

      const hour     = new Date().getHours();
      const slot     = getTimeSlot(hour);
      const activity = activityRef.current;

      // Smoothly interpolate music hue
      const hueTarget = musicHueTargetRef.current;
      musicHueRef.current = lerp(musicHueRef.current, hueTarget, dt * 1.5);

      // Blend background slightly warmer with activity
      const bgPrimary    = slot.bgPrimary;
      const accentWarm   = slot.accentWarm;
      const accentCold   = slot.accentCold;

      // Activity lightens bg subtly (more alive feel)
      const [bh, bs, bl] = parseHsl(bgPrimary);
      const activeBl     = bl + activity * 1.5;
      const activeBg     = `hsl(${bh}, ${bs}%, ${activeBl.toFixed(1)}%)`;

      // Glass surface with dynamic opacity
      const glassAlpha   = (0.55 + activity * 0.1).toFixed(2);

      // Particle color blends toward warm under activity
      const particleColor = lerpHsl(accentCold, accentWarm, activity * 0.4);

      if (slot.label !== lastSlotRef.current) {
        lastSlotRef.current = slot.label;
      }

      writeVars({
        '--orb-bg-primary':     activeBg,
        '--orb-bg-secondary':   slot.bgSecondary,
        '--orb-bg-glass':       `rgba(${hslToRgbStr(activeBg)}, ${glassAlpha})`,
        '--orb-accent-warm':    accentWarm,
        '--orb-accent-cold':    accentCold,
        '--orb-text-primary':   slot.textPrimary,
        '--orb-text-secondary': slot.textSecondary,
        '--orb-glow-warm':      `${accentWarm}55`,
        '--orb-glow-cold':      `${accentCold}44`,
        '--orb-particle-color': particleColor,
        '--orb-star-opacity':   slot.starOpacity,
        '--orb-hue-rotate':     `${musicHueRef.current.toFixed(1)}deg`,
        '--orb-activity':       activity.toFixed(3),
      });

      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return null;
}

// ── hsl → rgb string helper ──────────────────────────────────────────────────
function hslToRgbStr(hsl: string): string {
  const [h, s, l] = parseHsl(hsl);
  const s1 = s / 100, l1 = l / 100;
  const c = (1 - Math.abs(2 * l1 - 1)) * s1;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l1 - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60)       { r = c; g = x; b = 0; }
  else if (h < 120) { r = x; g = c; b = 0; }
  else if (h < 180) { r = 0; g = c; b = x; }
  else if (h < 240) { r = 0; g = x; b = c; }
  else if (h < 300) { r = x; g = 0; b = c; }
  else              { r = c; g = 0; b = x; }
  const ri = Math.round((r + m) * 255);
  const gi = Math.round((g + m) * 255);
  const bi = Math.round((b + m) * 255);
  return `${ri}, ${gi}, ${bi}`;
}

export default OrbitalThemeEngine;
