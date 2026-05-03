import { motion } from "framer-motion";

export default function OrbitCard({
  title,
  membersText,
  orbitId,
  active = false,
  onClick,
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: active ? 1.01 : 1.02 }}
      whileTap={{ scale: 0.97 }}
      className={[
        "w-full text-left rounded-2xl px-3 py-3",
        "border backdrop-blur-xl",
        "transition-all",
        active
          ? "bg-white/10 border-cyan-300/45 shadow-[0_0_28px_rgba(34,211,238,0.35)]"
          : "bg-white/6 border-white/10 hover:border-cyan-200/25 hover:bg-white/8",
      ].join(" ")}
    >
      <div className="flex items-center gap-3">
        <div
          className={[
            "size-10 rounded-full flex items-center justify-center",
            "bg-gradient-to-br from-purple-500/60 to-cyan-400/40",
            "ring-2 ring-cyan-200/40",
            "shadow-[0_0_18px_rgba(168,85,247,0.25)]",
          ].join(" ")}
        >
          <span className="text-sm font-bold text-white/90">
            {String(title ?? "?").trim().charAt(0).toUpperCase()}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-white/90 truncate">
            {title}
          </div>
          <div className="mt-0.5 text-[11px] text-white/55 flex items-center gap-2">
            <span className="truncate">{membersText}</span>
            <span className="text-cyan-200/55 font-mono tracking-wider">
              - {orbitId}
            </span>
          </div>
        </div>
      </div>
    </motion.button>
  );
}

