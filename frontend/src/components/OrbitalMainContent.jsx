import { motion } from "framer-motion";
import OrbitalSystem from "./OrbitalSystem";
import RadarWidget from "./RadarWidget";

export default function OrbitalMainContent() {
  return (
    <div className="relative flex-1 overflow-hidden">
      {/* Subtle center glow for readability */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(0,0,0,0.15),rgba(0,0,0,0.62))]" />

      {/* Main holographic system */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative w-full max-w-[1100px] h-[560px]">
          <div className="absolute left-1/2 top-[92px] -translate-x-1/2">
            <OrbitalSystem />
          </div>

          {/* Center text block */}
          <div className="absolute left-1/2 top-[310px] -translate-x-1/2 text-center w-[640px]">
            <h2 className="text-[28px] font-semibold tracking-tight bg-[linear-gradient(120deg,#22d3ee,#a855f7)] bg-clip-text text-transparent drop-shadow-[0_0_14px_rgba(56,189,248,0.35)]">
              Orbit Connect
            </h2>
            <p className="mt-2 text-[12px] text-white/55">
              Join a conversation or visit your favorite Orbit to start chatting.
            </p>

            {/* Signal line */}
            <div className="mt-6 flex items-center justify-center gap-3">
              <div className="relative overflow-hidden w-[190px] h-4">
                <motion.div
                  className="absolute left-0 top-0 whitespace-nowrap font-mono text-[10px] tracking-wide text-cyan-200/40"
                  animate={{ x: ["0%", "-50%"] }}
                  transition={{
                    duration: 10,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                >
                  {`CODES: D0D0S DATA-STREAM ... `.repeat(3)}
                </motion.div>
              </div>

              <div className="flex items-center gap-2">
                <div className="h-px w-10 bg-white/12" />
                <div className="text-[10px] uppercase tracking-[0.35em] text-fuchsia-200/70">
                  Waiting For Signal
                </div>
                <div className="h-px w-10 bg-white/12" />
              </div>

              <div className="relative overflow-hidden w-[190px] h-4">
                <motion.div
                  className="absolute left-0 top-0 whitespace-nowrap font-mono text-[10px] tracking-wide text-cyan-200/40"
                  animate={{ x: ["0%", "-50%"] }}
                  transition={{
                    duration: 10,
                    repeat: Infinity,
                    ease: "linear",
                    delay: 1.5,
                  }}
                >
                  {`COILNG 12E6H R0T0D STREAM ... `.repeat(3)}
                </motion.div>
              </div>
            </div>
          </div>

          {/* bottom-right control */}
          <RadarWidget />
        </div>
      </div>
    </div>
  );
}
