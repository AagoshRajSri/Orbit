import { useEffect, useRef } from "react";
import gsap from "gsap";
import "./StarrySky.css";

const LAYERS = [
  { count: 40, minSize: 1, maxSize: 2, minOpacity: 0.25, maxOpacity: 0.55 },
  { count: 28, minSize: 1.2, maxSize: 2.6, minOpacity: 0.3, maxOpacity: 0.7 },
  { count: 14, minSize: 1.8, maxSize: 3.2, minOpacity: 0.45, maxOpacity: 0.85 },
];

export default function StarrySky({ variant = "default" }) {
  const rootRef = useRef(null);
  const starsRef = useRef(null);
  const shootingRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    const starsRoot = starsRef.current;
    const shootingRoot = shootingRef.current;
    if (!root || !starsRoot || !shootingRoot) return;

    const ctx = gsap.context(() => {
      const random = gsap.utils.random;

      const spawnStars = () => {
        starsRoot.innerHTML = "";
        const { width, height } = root.getBoundingClientRect();
        const isMobile = window.innerWidth <= 768;

        LAYERS.forEach((layer, layerIndex) => {
          // Reduce star count slightly on mobile for max frame rate
          const count = isMobile ? Math.floor(layer.count * 0.6) : layer.count;

          for (let i = 0; i < count; i += 1) {
            const star = document.createElement("span");
            star.className = "starry-sky__star";

            const size = random(layer.minSize, layer.maxSize, 0.1);
            const x = random(0, width);
            const y = random(0, height);
            const baseOpacity = random(layer.minOpacity, layer.maxOpacity, 0.01);

            star.style.width = `${size}px`;
            star.style.height = `${size}px`;
            
            // hardware accelerated positioning
            gsap.set(star, {
              x,
              y,
              opacity: baseOpacity,
              force3D: true, // triggers GPU
              // Add a static box-shadow for glow instead of animating it
              boxShadow: Math.random() < 0.15 ? "0 0 6px rgba(191,219,254,0.6)" : "none"
            });
            
            star.style.willChange = "opacity, transform";

            starsRoot.appendChild(star);

            gsap.to(star, {
              opacity: random(0.2, 1, 0.01),
              scale: random(0.8, 1.2, 0.01),
              duration: random(1.5, 4, 0.01),
              delay: random(0, 4, 0.01),
              ease: "sine.inOut",
              yoyo: true,
              repeat: -1,
            });
            // Removed expensive dynamic box-shadow animations entirely.
            // Star twinkle is now handled purely by GPU-friendly opacity/scale.
          }
        });
      };

      const createShootingStar = () => {
        const shooting = document.createElement("span");
        shooting.className = "starry-sky__shooting";

        const tail = document.createElement("span");
        tail.className = "starry-sky__shooting-tail";
        shooting.appendChild(tail);

        const { width, height } = root.getBoundingClientRect();
        const directionLeftToRight = Math.random() > 0.5;

        const startX = directionLeftToRight
          ? random(-40, width * 0.2)
          : random(width * 0.8, width + 40);
        const startY = random(-20, height * 0.35);
        const distanceX = directionLeftToRight
          ? random(width * 0.35, width * 0.68)
          : -random(width * 0.35, width * 0.68);
        const distanceY = random(height * 0.2, height * 0.46);
        const endX = startX + distanceX;
        const endY = startY + distanceY;
        const angleDeg = (Math.atan2(distanceY, distanceX) * 180) / Math.PI;

        gsap.set(shooting, {
          x: startX,
          y: startY,
          opacity: 0,
          scale: 0.9,
          rotation: angleDeg,
          force3D: true, // hardware acceleration
          willChange: "transform, opacity"
        });

        shootingRoot.appendChild(shooting);

        const tl = gsap.timeline({
          onComplete: () => shooting.remove(),
        });

        tl.to(shooting, {
          opacity: 1,
          duration: 0.12,
          ease: "power1.out",
        }).to(
          shooting,
          {
            x: endX,
            y: endY,
            scale: 1.1,
            duration: random(0.6, 1.0, 0.01), // Slightly faster, looks better & spends less time computing
            ease: "power2.out",
          },
          "<"
        ).to(
          shooting,
          {
            opacity: 0,
            duration: 0.28,
            ease: "power1.in",
          },
          ">-0.18"
        );
      };

      const shootingLoop = () => {
        createShootingStar();
        if (Math.random() < 0.3) {
          gsap.delayedCall(random(0.6, 1.4, 0.01), createShootingStar);
        }
        gsap.delayedCall(random(5, 10, 0.01), shootingLoop);
      };

      spawnStars();
      gsap.delayedCall(random(1.2, 3, 0.01), shootingLoop);

      const onResize = () => spawnStars();
      window.addEventListener("resize", onResize);

      return () => window.removeEventListener("resize", onResize);
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <div
      className={`starry-sky${variant === "soft" ? " starry-sky--soft" : ""}`}
      ref={rootRef}
      aria-hidden="true"
    >
      <div className="starry-sky__grain" />
      <div className="starry-sky__stars" ref={starsRef} />
      <div className="starry-sky__shooting-layer" ref={shootingRef} />
    </div>
  );
}
