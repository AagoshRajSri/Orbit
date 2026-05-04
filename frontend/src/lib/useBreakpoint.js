import { useState, useEffect } from "react";

/**
 * Shared breakpoint hook — matches ResponsiveLayouts.jsx foundation exactly.
 * mobile:  ≤ 480px
 * tablet:  481–768px
 * ipad:    769–1024px
 * desktop: 1025px+
 */
export function useBreakpoint() {
  const [bp, setBp] = useState("desktop");

  useEffect(() => {
    const check = () => {
      const w = window.innerWidth;
      if (w < 481) setBp("mobile");
      else if (w < 769) setBp("tablet");
      else if (w < 1025) setBp("ipad");
      else setBp("desktop");
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return bp;
}

export const isMobileOrTablet = (bp) => bp === "mobile" || bp === "tablet";
export const isCompact       = (bp) => bp === "mobile" || bp === "tablet";
export const isMobile        = (bp) => bp === "mobile";
