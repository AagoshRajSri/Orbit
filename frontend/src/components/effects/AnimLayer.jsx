import React, { useEffect } from "react";
import { useAnimationStore } from "../store/useAnimationStore";

/**
 * AnimLayer is a wrapper component that conditionally renders animations
 * based on the user's global animation preferences.
 *
 * @param {string} category - "microInteractions", "transitions", or "atmospheric"
 * @param {React.ReactNode} fallback - What to render if animations are disabled
 */
export default function AnimLayer({ category, children, fallback = null }) {
  const { masterEnabled, config } = useAnimationStore();

  if (!masterEnabled) return fallback;
  if (!config[category]) return fallback;

  return <>{children}</>;
}

/**
 * Hook to inject CSS variables for animation speed/intensity
 */
export function useAnimationContext() {
  const { masterEnabled, config, setPreset } = useAnimationStore();

  useEffect(() => {
    const root = document.documentElement;
    if (masterEnabled) {
      root.style.setProperty("--anim-speed-multiplier", config.speedMultiplier.toString());
      // For accessibility reduced motion detection
      const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      const handleChange = () => {
        if (mediaQuery.matches) {
          setPreset("minimal");
        }
      };
      // Run once on mount if no preferences are set (ideally)
      // Here we just listen to changes dynamically
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    } else {
      root.style.setProperty("--anim-speed-multiplier", "0");
    }
  }, [masterEnabled, config.speedMultiplier, setPreset]);
}
