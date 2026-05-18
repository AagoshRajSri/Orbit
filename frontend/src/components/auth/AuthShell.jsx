import { useEffect, useRef } from "react";
import gsap from "gsap";
import OrbitLoader from "../common/OrbitLoader";
import StarrySky from "../effects/StarrySky";
import GalaxyDust from "../effects/GalaxyDust";

export default function AuthShell({ children, animationKey }) {
  const leftRef = useRef(null);
  const rightRef = useRef(null);

  useEffect(() => {
    if (!leftRef.current) return;
    gsap.fromTo(leftRef.current,
      { opacity: 0, x: -20 },
      { opacity: 1, x: 0, duration: 0.55, ease: "power3.out" }
    );
    if (rightRef.current) {
      gsap.fromTo(rightRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.8, ease: "power2.out", delay: 0.1 }
      );
    }
  }, [animationKey]);

  return (
    <div className="relative w-full overflow-hidden" style={{ background: "#05070f", minHeight: "100dvh", display: "flex", flexDirection: "column" }}>

      {/* ── Global starfield background ── */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <StarrySky />
        <GalaxyDust />
        {/* Deep ambient glow top-left */}
        <div style={{
          position: "absolute", borderRadius: "50%",
          width: "70%", height: "80%", top: "-20%", left: "-15%",
          background: "radial-gradient(circle, rgba(109,40,217,0.13) 0%, transparent 65%)",
          animation: "shellGlow 9s ease-in-out infinite alternate",
        }} />
        {/* Deep ambient glow bottom-right */}
        <div style={{
          position: "absolute", borderRadius: "50%",
          width: "60%", height: "70%", bottom: "-20%", right: "-10%",
          background: "radial-gradient(circle, rgba(14,165,233,0.09) 0%, transparent 65%)",
          animation: "shellGlow 12s ease-in-out infinite alternate-reverse",
        }} />
      </div>

      <style>{`
        @keyframes shellGlow {
          from { transform: scale(1); opacity: 0.7; }
          to   { transform: scale(1.15) translate(20px, -15px); opacity: 1; }
        }
        .no-scrollbar::-webkit-scrollbar,
        .lp-root::-webkit-scrollbar,
        .sp-root::-webkit-scrollbar {
          display: none !important;
          width: 0 !important;
          height: 0 !important;
        }
        .no-scrollbar {
          -ms-overflow-style: none !important;
          scrollbar-width: none !important;
          overflow-x: hidden !important;
          overflow-y: auto !important;
        }
        .lp-root, .sp-root {
          -ms-overflow-style: none !important;
          scrollbar-width: none !important;
          overflow-x: hidden !important;
          overflow-y: auto !important;
        }
        @media (min-width: 1280px) {
          * {
            scrollbar-width: none !important;
            -ms-overflow-style: none !important;
          }
          *::-webkit-scrollbar {
            display: none !important;
            width: 0 !important;
            height: 0 !important;
          }
          .left-panel, .no-scrollbar, .lp-root, .sp-root, .lp-page, .sp-page {
            overflow: hidden !important;
            overflow-y: hidden !important;
            min-height: 0 !important;
            height: 100% !important;
          }
        }
      `}</style>

      {/* ── Layout grid ── */}
      <div className="relative z-10 w-full flex-1 flex xl:grid xl:grid-cols-2" style={{ minHeight: "100dvh" }}>

        {/* ─── LEFT: full-height form panel, children fill it ─── */}
        <div
          ref={leftRef}
          className="relative flex flex-col overflow-x-hidden w-full xl:w-auto left-panel"
          style={{
            minHeight: "100dvh",
            background: "rgba(5,7,15,0.45)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
          }}
        >
          {/* Top accent stripe */}
          <div style={{
            height: 2, flexShrink: 0,
            background: "linear-gradient(90deg, rgba(109,40,217,0.8) 0%, rgba(56,189,248,0.6) 60%, transparent 100%)",
          }} />

          {/* Children own ALL the space between stripes */}
          <div className="flex-1 no-scrollbar" style={{ minHeight: 0 }}>
            {children}
          </div>

          {/* Bottom accent stripe */}
          <div style={{
            height: 1, flexShrink: 0,
            background: "linear-gradient(90deg, rgba(109,40,217,0.3) 0%, rgba(56,189,248,0.15) 60%, transparent 100%)",
          }} />
        </div>

        {/* ─── RIGHT: animation panel — only shown on xl+ (≥1280px) ─── */}
        <div ref={rightRef} className="hidden xl:flex items-center justify-center relative overflow-hidden">
          <div className="h-full w-full">
            <OrbitLoader blendWithParent />
          </div>
        </div>
      </div>
    </div>
  );
}
