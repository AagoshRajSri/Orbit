import { motion } from "framer-motion";

export default function RadarWidget() {
  return (
    <div className="absolute bottom-6 right-8 z-30">
      <div className="relative size-20 rounded-full bg-white/5 backdrop-blur-xl border border-white/12 shadow-[0_0_35px_rgba(168,85,247,0.35)]">
        {/* outer glow ring */}
        <div className="absolute inset-[-6px] rounded-full border border-fuchsia-400/25 blur-[0.5px]" />

        <motion.div
          className="absolute inset-2 rounded-full border border-cyan-300/25"
          animate={{ rotate: 360 }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute inset-4 rounded-full border border-fuchsia-300/20"
          animate={{ rotate: -360 }}
          transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
        />

        {/* sweep */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              "conic-gradient(from 0deg, rgba(34,211,238,0.0), rgba(34,211,238,0.0), rgba(34,211,238,0.16), rgba(168,85,247,0.0), rgba(168,85,247,0.0))",
            filter: "drop-shadow(0 0 12px rgba(34,211,238,0.35))",
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 5.5, repeat: Infinity, ease: "linear" }}
        />

        {/* center reticle */}
        <div className="absolute inset-0 grid place-items-center">
          <div className="size-2 rounded-full bg-cyan-200/80 shadow-[0_0_12px_rgba(34,211,238,0.9)]" />
          <div className="absolute w-10 h-px bg-cyan-200/25" />
          <div className="absolute h-10 w-px bg-cyan-200/25" />
        </div>
      </div>
    </div>
  );
}

