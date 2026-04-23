import { motion } from "framer-motion";
import { memo, useMemo } from "react";

const FooterVisualizer = memo(() => {
  const bars = useMemo(
    () =>
      Array.from({ length: 96 }).map((_, i) => ({
        id: i,
        phase: (i / 96) * Math.PI * 2,
      })),
    [],
  );

  return (
    <div className="w-full h-10 flex items-end gap-[2px] px-6">
      {bars.map((b) => (
        <motion.div
          key={b.id}
          className="flex-1 rounded-t-[2px] bg-gradient-to-t from-cyan-400/80 via-fuchsia-400/70 to-transparent shadow-[0_0_10px_rgba(34,211,238,0.35)]"
          initial={{ height: "10%" }}
          animate={{
            height: [
              `${18 + 20 * Math.abs(Math.sin(b.phase))}%`,
              `${25 + 35 * Math.abs(Math.cos(b.phase * 1.2))}%`,
              `${16 + 28 * Math.abs(Math.sin(b.phase * 1.8))}%`,
            ],
            opacity: [0.55, 0.9, 0.55],
          }}
          transition={{
            duration: 1.1,
            repeat: Infinity,
            repeatType: "mirror",
            ease: "easeInOut",
            delay: (b.id % 24) * 0.01,
          }}
        />
      ))}
    </div>
  );
});

FooterVisualizer.displayName = "FooterVisualizer";

export default FooterVisualizer;

