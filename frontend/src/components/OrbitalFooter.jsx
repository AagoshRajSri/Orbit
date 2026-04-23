import FooterVisualizer from "./FooterVisualizer";
import { useThemeStore } from "../store/useThemeStore";
import Saturn from "./Saturn";

export default function OrbitalFooter() {
  const { theme } = useThemeStore();
  const isLight = theme === "light";

  return (
    <div className="relative w-full">
      <div className={`h-[46px] border-t border-white/10 backdrop-blur-xl flex items-center px-8 transition-all duration-300 ${isLight ? "bg-white/40 border-[rgba(176,141,87,0.15)]" : "bg-black/15"}`}>
        {isLight ? (
          <div className="w-full flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Saturn size={24} tilt={-15} />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--chat-primary)]">80 FPS GALAXY ENGINE</span>
              </div>
              <div className="h-4 w-px bg-[var(--chat-primary)]/20" />
              <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--chat-muted)]">ENTER YOUR ORBIT</span>
            </div>
            <div className="flex items-center gap-4 text-[10px] font-bold text-[var(--chat-muted)]">
              <span className="opacity-60 uppercase tracking-widest">System Latency: 4ms</span>
              <div className="size-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
            </div>
          </div>
        ) : (
          <FooterVisualizer />
        )}
      </div>
    </div>
  );
}
