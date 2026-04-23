import { useEffect, useRef } from "react";
import gsap from "gsap";
import OrbitLoader from "./OrbitLoader";
import StarrySky from "./StarrySky";
import GalaxyDust from "./GalaxyDust";

export default function AuthShell({ children, animationKey }) {
  const panelRef = useRef(null);
  const cardRef = useRef(null);

  useEffect(() => {
    if (!panelRef.current || !cardRef.current) return;

    // Entrance animation: panel slides up, card pops in
    gsap.fromTo(
      panelRef.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.45, ease: "power3.out" },
    );
    gsap.fromTo(
      cardRef.current,
      { opacity: 0, scale: 0.97, y: 16 },
      { opacity: 1, scale: 1, y: 0, duration: 0.5, ease: "back.out(1.4)", delay: 0.05 },
    );
  }, [animationKey]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-[radial-gradient(ellipse_90%_80%_at_72%_46%,#0d2247_0%,#06132a_55%,#020810_100%)]">
      
      {/* ── ONE CONTINUOUS BACKGROUND ──────────────────────── */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <StarrySky />
        <GalaxyDust />
        {/* Unified dark overlay to ensure the form card pops without creating a seam */}
        <div className="absolute inset-0 bg-black/25" />
      </div>

      {/* ── FOREGROUND GRID ────────────────────────────────── */}
      <div className="relative z-10 h-full w-full grid lg:grid-cols-2">
        
        {/* ── LEFT: Form side ──────────────────────────────── */}
        <div className="flex flex-col justify-center items-center px-4 py-4 sm:px-12 h-full no-scrollbar overflow-y-auto">
          <div ref={panelRef} className="w-full max-w-[26rem] flex flex-col items-center my-auto">

            {/* ── Glass card ── */}
            <div
              ref={cardRef}
              className="w-full rounded-[24px] border shadow-[0_30px_80px_-10px_rgba(0,0,0,0.8),0_0_0_1px_rgba(255,255,255,0.04)] overflow-hidden"
              style={{
                background: "rgba(8,10,20,0.92)",
                border: "1px solid rgba(139,92,246,0.15)",
                backdropFilter: "blur(24px)",
                WebkitBackdropFilter: "blur(24px)",
              }}
            >
              {/* Subtle top accent bar */}
              <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />

              <div className="px-6 py-5 sm:px-7 sm:py-6 flex flex-col gap-5">
                {children}
              </div>
            </div>

          </div>
        </div>

        {/* ── RIGHT: Animation side ─────────────────────────── */}
        <div className="hidden lg:flex items-center justify-center relative">
          <div className="h-full w-full">
            <OrbitLoader blendWithParent />
          </div>
        </div>
      </div>
    </div>
  );
}
