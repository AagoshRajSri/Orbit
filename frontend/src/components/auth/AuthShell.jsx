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
    <div className="relative h-full w-full overflow-hidden" style={{ background: "#05070f" }}>

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
      `}</style>

      {/* ── Layout grid ── */}
      <div className="relative z-10 h-full w-full flex lg:grid lg:grid-cols-2">

        {/* ─── LEFT: full-height form panel, children fill it ─── */}
        <div
          ref={leftRef}
          className="relative flex flex-col h-full overflow-hidden"
          style={{
            background: "rgba(6,8,20,0.88)",
            backdropFilter: "blur(32px)",
            WebkitBackdropFilter: "blur(32px)",
            borderRight: "1px solid rgba(109,40,217,0.12)",
          }}
        >
          {/* Top accent stripe */}
          <div style={{
            height: 2, flexShrink: 0,
            background: "linear-gradient(90deg, rgba(109,40,217,0.8) 0%, rgba(56,189,248,0.6) 60%, transparent 100%)",
          }} />

          {/* Children own ALL the space between stripes */}
          <div className="flex-1 min-h-0 overflow-hidden">
            {children}
          </div>

          {/* Bottom accent stripe */}
          <div style={{
            height: 1, flexShrink: 0,
            background: "linear-gradient(90deg, rgba(109,40,217,0.3) 0%, rgba(56,189,248,0.15) 60%, transparent 100%)",
          }} />
        </div>

        {/* ─── RIGHT: animation panel ─── */}
        <div ref={rightRef} className="hidden lg:flex items-center justify-center relative overflow-hidden">
          <div className="h-full w-full">
            <OrbitLoader blendWithParent />
          </div>
        </div>
      </div>
    </div>
  );
}
