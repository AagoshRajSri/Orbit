import { useEffect, useRef } from "react";
import gsap from "gsap";

export default function GalaxyDust() {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const clouds = containerRef.current.querySelectorAll(".galaxy-dust-cloud");
    const isMobile = window.innerWidth <= 768;
    
    // Reduce animation complexity on mobile
    clouds.forEach((cloud, i) => {
      // Force GPU acceleration
      gsap.set(cloud, { force3D: true, z: 0.1 });

      gsap.to(cloud, {
        x: isMobile ? "random(-10, 10)" : "random(-25, 25)",
        y: isMobile ? "random(-10, 10)" : "random(-25, 25)",
        rotation: "random(-3, 3)",
        duration: "random(14, 22)",
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
        delay: i * 0.5,
      });

      gsap.to(cloud, {
        opacity: "random(0.4, 0.9)",
        duration: "random(8, 12)",
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
      });
    });
  }, []);

  return (
    <div 
      ref={containerRef}
      className="absolute inset-0 overflow-hidden pointer-events-none z-0"
      style={{
        // Using screen blend mode on the parent is slightly better but still costly
        // Setting isolate keeps it contained
        isolation: "isolate"
      }}
    >
      {/* Container - rotating the whole container once is cheap */}
      <div 
        className="absolute w-[200%] h-[150%] top-[-25%] left-[-50%] opacity-90 mix-blend-screen"
        style={{
          transform: "rotate(40deg) translateZ(0)",
          willChange: "transform"
        }}
      >
        {/* Core of the milky way band using a soft linear gradient fading to transparent */}
        <div 
          className="galaxy-dust-cloud absolute w-full h-[30%] top-[35%]"
          style={{
            background: "linear-gradient(90deg, rgba(168,85,247,0) 0%, rgba(168,85,247,0.3) 20%, rgba(59,130,246,0.4) 40%, rgba(6,182,212,0.3) 60%, rgba(16,185,129,0.1) 80%, rgba(16,185,129,0) 100%)",
            maskImage: "linear-gradient(to bottom, transparent, black 40%, black 60%, transparent)",
            WebkitMaskImage: "linear-gradient(to bottom, transparent, black 40%, black 60%, transparent)",
            willChange: "transform, opacity"
          }}
        />
        
        {/* Supporting clouds using radial gradients (No expensive CSS blur!) */}
        <div 
          className="galaxy-dust-cloud absolute w-[35%] h-[40%] top-[20%] left-[5%]"
          style={{ 
            background: "radial-gradient(ellipse at center, rgba(236,72,153,0.35) 0%, transparent 65%)",
            willChange: "transform, opacity"
          }}
        />
        <div 
          className="galaxy-dust-cloud absolute w-[40%] h-[45%] top-[30%] left-[35%]"
          style={{ 
            background: "radial-gradient(ellipse at center, rgba(14,165,233,0.4) 0%, transparent 65%)",
            willChange: "transform, opacity"
          }}
        />
        <div 
          className="galaxy-dust-cloud absolute w-[40%] h-[35%] top-[40%] left-[60%]"
          style={{ 
            background: "radial-gradient(ellipse at center, rgba(52,211,153,0.2) 0%, transparent 65%)",
            willChange: "transform, opacity"
          }}
        />
      </div>

      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_50%,rgba(0,0,0,0)_0%,rgba(2,8,16,0.8)_100%)]" />
    </div>
  );
}
