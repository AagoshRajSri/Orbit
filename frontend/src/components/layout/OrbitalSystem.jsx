import { motion } from "framer-motion";
import { memo } from "react";

const RINGS = [
  { id: "r1", size: 180, duration: 120, opacity: 0.28 },
  { id: "r2", size: 240, duration: 160, opacity: 0.22 },
  { id: "r3", size: 300, duration: 200, opacity: 0.18 },
  { id: "r4", size: 360, duration: 260, opacity: 0.14 },
];

const PLANETS = [
  { id: "p1", ring: "r1", angle: 20, size: 10, tint: "cyan", depth: 1 },
  { id: "p2", ring: "r1", angle: 210, size: 8, tint: "purple", depth: 0.7 },
  { id: "p3", ring: "r2", angle: 120, size: 12, tint: "fuchsia", depth: 0.85 },
  { id: "p4", ring: "r2", angle: 300, size: 9, tint: "sky", depth: 0.65 },
  { id: "p5", ring: "r3", angle: 60, size: 14, tint: "cyan", depth: 0.9 },
  { id: "p6", ring: "r4", angle: 260, size: 16, tint: "purple", depth: 0.55 },
];

function planetClasses(tint) {
  switch (tint) {
    case "purple":
      return "bg-purple-300/55 shadow-[0_0_16px_rgba(168,85,247,0.55)]";
    case "fuchsia":
      return "bg-fuchsia-300/55 shadow-[0_0_18px_rgba(232,121,249,0.6)]";
    case "sky":
      return "bg-sky-300/55 shadow-[0_0_16px_rgba(56,189,248,0.55)]";
    case "cyan":
    default:
      return "bg-cyan-200/55 shadow-[0_0_18px_rgba(34,211,238,0.65)]";
  }
}

const OrbitalSystem = memo(() => {
  return (
    <motion.div
      className="relative w-[min(520px,92vw)] h-[min(320px,60vh)] md:w-[560px] md:h-[340px]"
      style={{
        transform: "perspective(900px) rotateX(55deg) rotateZ(-8deg)",
      }}
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      {/* wireframe glow */}
      <div className="absolute inset-0 blur-[0.2px] opacity-90" />

      {/* slow global drift */}
      <motion.div
        className="absolute inset-0"
        animate={{ rotate: 360 }}
        transition={{ duration: 420, repeat: Infinity, ease: "linear" }}
      >
        {/* core */}
        <motion.div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-5 rounded-full bg-cyan-200/70 shadow-[0_0_24px_rgba(34,211,238,0.75)]"
          style={{ willChange: "transform, opacity" }}
          animate={{ scale: [1, 1.18, 1], opacity: [0.75, 1, 0.75] }}
          transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* rings */}
        {RINGS.map((r, idx) => (
          <motion.div
            key={r.id}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border"
            style={{
              width: r.size,
              height: r.size,
              opacity: r.opacity,
              borderColor: idx % 2 === 0 ? "rgba(34,211,238,0.55)" : "rgba(168,85,247,0.5)",
              boxShadow:
                idx % 2 === 0
                  ? "0 0 18px rgba(34,211,238,0.15)"
                  : "0 0 18px rgba(168,85,247,0.14)",
              willChange: "transform",
            }}
            animate={{ rotate: 360 }}
            transition={{
              duration: r.duration,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        ))}

        {/* planets (anchored on rings, ring rotation handled by their own wrapper) */}
        {RINGS.map((r) => {
          const planetsOnRing = PLANETS.filter((p) => p.ring === r.id);
          const radius = r.size / 2;
          return (
            <motion.div
              key={`wrap-${r.id}`}
              className="absolute left-1/2 top-1/2"
              style={{ width: 0, height: 0, willChange: "transform" }}
              animate={{ rotate: 360 }}
              transition={{
                duration: r.duration,
                repeat: Infinity,
                ease: "linear",
              }}
            >
              {planetsOnRing.map((p) => (
                <motion.div
                  key={p.id}
                  className="absolute"
                  style={{
                    transform: `rotate(${p.angle}deg) translateY(-${radius}px)`,
                    transformOrigin: "center",
                    opacity: p.depth,
                    filter: p.depth < 0.7 ? "blur(0.6px)" : "blur(0px)",
                    willChange: "transform",
                  }}
                  animate={{ scale: [1, 1.08, 1] }}
                  transition={{
                    duration: 3.2 + (1 - p.depth) * 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <div
                    className={[
                      "rounded-full border border-white/25",
                      planetClasses(p.tint),
                    ].join(" ")}
                    style={{ width: p.size, height: p.size }}
                  />
                </motion.div>
              ))}
            </motion.div>
          );
        })}
      </motion.div>
    </motion.div>
  );
});

OrbitalSystem.displayName = "OrbitalSystem";

export default OrbitalSystem;

