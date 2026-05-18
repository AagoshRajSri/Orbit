/**
 * SpotifyWave.tsx
 * ──────────────────────────────────────────────────────────────────────────────
 * Renders a staggered vertical bar waveform visualization when Spotify is active.
 * Consumes the existing useSpotifyStore to track active playback.
 */

import { memo } from "react";
import { motion } from "framer-motion";
import { useSpotifyStore } from "../store/useSpotifyStore";
import { useAuthStore } from "../store/useAuthStore";
import { prefersReducedMotion, timing } from "../orbit/MotionSystem";

interface SpotifyWaveProps {
  userId: string;
  size?: "small" | "medium"; // small for nav nodes, medium for member lists
  className?: string;
}

export const SpotifyWave = memo(function SpotifyWave({
  userId,
  size = "small",
  className = "",
}: SpotifyWaveProps) {
  // Check if target user is current user
  const authUser = useAuthStore((s) => s.authUser);
  const isMe = authUser?._id?.toString() === userId?.toString();

  // Retrieve Spotify playback state
  const isPlaying = useSpotifyStore((s) => s.isPlaying);
  const spotifyLinked = useSpotifyStore((s) => s.spotifyLinked);
  const currentTrack = useSpotifyStore((s) => s.currentTrack);

  // We show the waveform if it's the current user playing music
  // OR if we're in solo play and it's the logged-in user
  const showWave = isMe && spotifyLinked && isPlaying && !!currentTrack;

  if (!showWave) return null;

  const barCount = 5;
  const barWidth = 2;
  const barGap = 2;
  const maxBarHeight = size === "small" ? 12 : 20;

  // Staggered heights for the bars
  const baseHeights = [0.4, 0.7, 0.5, 0.8, 0.45];

  // If prefers-reduced-motion is true, we just render static bars at 50% height
  const barVariants = {
    idle: (index: number) => ({
      height: maxBarHeight * baseHeights[index],
    }),
    animate: (index: number) => {
      if (prefersReducedMotion) {
        return { height: maxBarHeight * 0.5 };
      }
      return {
        height: [
          maxBarHeight * 0.3,
          maxBarHeight * baseHeights[index],
          maxBarHeight * 0.25,
          maxBarHeight * (baseHeights[index] * 1.2 > 1.0 ? 0.95 : baseHeights[index] * 1.2),
          maxBarHeight * 0.3,
        ],
        transition: {
          duration: 0.9 + index * 0.12,
          repeat: Infinity,
          repeatType: "reverse" as const,
          ease: "easeInOut",
        },
      };
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: timing.t3 }}
      className={`inline-flex items-end justify-center ${className}`}
      style={{
        gap: barGap,
        height: maxBarHeight,
        width: barCount * barWidth + (barCount - 1) * barGap,
      }}
      aria-label="Spotify music playing"
    >
      {Array.from({ length: barCount }).map((_, i) => (
        <motion.span
          key={i}
          custom={i}
          variants={barVariants}
          initial="idle"
          animate="animate"
          style={{
            width: barWidth,
            backgroundColor: "var(--orb-accent-warm, #c9a84c)",
            borderRadius: 1,
            transformOrigin: "bottom",
          }}
        />
      ))}
    </motion.div>
  );
});

export default SpotifyWave;
