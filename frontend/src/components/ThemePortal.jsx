import { useEffect, useState, useRef } from "react";
import { gsap } from "gsap";
import { useThemeStore } from "../store/useThemeStore";
import { THEME_LABELS } from "../constants";
import { Palette } from "lucide-react";

export default function ThemePortal() {
  const { isConfirming, pendingTheme, setIsConfirming, setTheme } = useThemeStore();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const irisRef = useRef(null);
  const textRef = useRef(null);

  const initiateTransition = () => {
    const targetTheme = pendingTheme;
    setIsConfirming(false);
    setIsTransitioning(true);
    
    const tl = gsap.timeline({
      onComplete: () => {
        // Transition mid-point
        setTheme(targetTheme);
        
        // Wait and then fade out
        setTimeout(() => {
          gsap.timeline({
            onComplete: () => setIsTransitioning(false)
          })
          .to(textRef.current, { opacity: 0, y: -20, duration: 0.4 })
          .to(irisRef.current, { opacity: 0, duration: 0.8, ease: "power2.inOut" })
          .set(irisRef.current, { clipPath: "circle(0% at 50% 50%)", opacity: 0 });
        }, 800);
      }
    });

    tl.to(irisRef.current, {
      clipPath: "circle(150% at 50% 50%)",
      duration: 1.2,
      ease: "expo.inOut"
    });
    
    tl.to(textRef.current, {
      opacity: 1,
      y: 0,
      duration: 0.6,
      ease: "power2.out"
    }, "-=0.4");
  };

  return (
    <>
      {/* 1. Confirmation Modal */}
      {isConfirming && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="w-full max-w-sm rounded-[2.5rem] border border-white/10 bg-[#050505] shadow-2xl overflow-hidden">
            <div className="p-10 text-center">
              <div className="size-20 rounded-3xl bg-gradient-to-br from-white/15 to-transparent border border-white/10 flex items-center justify-center mx-auto mb-8 rotate-12 scale-110 shadow-2xl shadow-white/5">
                <Palette className="size-10 text-white" />
              </div>
              <h3 className="text-2xl font-black text-white tracking-[0.2em] uppercase mb-4 font-cinzel">
                Reconfigure?
              </h3>
              <p className="text-sm text-white/40 leading-relaxed mb-10 font-medium">
                Syncing nodal frequencies to the{" "}
                <span className="text-white font-bold underline decoration-white/20 underline-offset-4 pointer-events-none">
                  {THEME_LABELS[pendingTheme] || pendingTheme}
                </span>{" "}
                dimension.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setIsConfirming(false)}
                  className="px-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-white/50 text-[10px] font-black uppercase tracking-[0.3em] hover:bg-white/10 hover:text-white transition-all active:scale-95"
                >
                  Abort
                </button>
                <button
                  onClick={initiateTransition}
                  className="px-6 py-4 rounded-2xl bg-white text-black text-[10px] font-black uppercase tracking-[0.3em] hover:bg-white/90 shadow-xl shadow-white/5 transition-all active:scale-95"
                >
                  Sync
                </button>
              </div>
            </div>
            <div className="h-1 bg-white/5 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent w-full animate-[theme-shimmer_2s_infinite]" />
            </div>
          </div>
          <style>{`
            @font-face { font-family: 'Cinzel'; src: url('https://fonts.googleapis.com/css2?family=Cinzel:wght@900&display=swap'); }
            .font-cinzel { font-family: 'Cinzel', serif; }
            @keyframes theme-shimmer {
              0% { transform: translateX(-100%); }
              100% { transform: translateX(100%); }
            }
          `}</style>
        </div>
      )}

      {isTransitioning && (
        <div 
          className="fixed inset-0 z-[10001] pointer-events-none flex items-center justify-center overflow-hidden"
        >
          <div 
            ref={irisRef}
            className="absolute inset-0 bg-white"
            style={{ clipPath: "circle(0% at 50% 50%)", opacity: 0 }}
          />
          
          <div 
            ref={textRef}
            className="relative z-[2] opacity-0 translate-y-5 text-center px-10"
          >
            <div className="text-[10px] font-black tracking-[1em] text-black/40 mb-6 uppercase">Initializing Dimension</div>
            <div className="text-5xl font-black tracking-[0.2em] text-black uppercase font-cinzel">
              {THEME_LABELS[pendingTheme] || pendingTheme}
            </div>
            <div className="w-32 h-0.5 bg-black/10 mx-auto my-10" />
            <div className="text-[9px] font-bold tracking-[0.5em] text-black/30 uppercase">Neural Link Synchronized</div>
          </div>
        </div>
      )}
    </>
  );
}
