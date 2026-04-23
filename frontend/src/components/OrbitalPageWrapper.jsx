import { memo, useEffect, useState } from "react";
import { useThemeStore } from "../store/useThemeStore";
import StarfieldBackground from "./StarfieldBackground";
import HexagonalGridOverlay from "./HexagonalGridOverlay";
import ThemeEffects from "./ThemeEffects";

/**
 * OrbitalPageWrapper - Provides consistent orbital/space theme for all pages
 * Includes starfield background, hexagonal grid overlay, and glassmorphism styling
 */
const OrbitalPageWrapper = memo(({ children, className = "" }) => {
  const { theme } = useThemeStore();
  // amoled-dark manages its own visuals inside AmoledDashboard; skip legacy overlays
  const isLightPastel = ["light", "pastel-dream"].includes(theme);
  const isDarkThemed = !["light", "pastel-dream", "amoled-dark"].includes(theme);

  return (
    <div
      className={`${!isLightPastel ? "orbital-nebula-bg orbital-overlay" : ""} flex-1 min-h-0 w-full flex flex-col relative ${className}`}
    >
      {/* Legacy overlays specifically for dark themes */}
      {isDarkThemed && (
        <>
          <StarfieldBackground />
          <HexagonalGridOverlay />
        </>
      )}

      {/* Global Asthetic Overlays per Theme */}
      <ThemeEffects />

      {/* Content with higher z-index */}
      <div className="relative z-10 flex-1 flex flex-col min-h-0 w-full overflow-hidden">
        {children}
      </div>
    </div>
  );
});

OrbitalPageWrapper.displayName = "OrbitalPageWrapper";

export default OrbitalPageWrapper;
