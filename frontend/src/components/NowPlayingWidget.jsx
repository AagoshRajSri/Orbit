import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useSettingsStore } from "../store/useSettingsStore";
import { useThemeStore } from "../store/useThemeStore";

const THEME_TRACK_INFO = {
  "dark": { title: "Dark Electropop", artist: "PoorArtistt", color: "var(--crimson, #dc143c)", bg: "linear-gradient(135deg, #100000 0%, #2a0000 100%)", text: "#ffebf0" },
  "gamer-high-energy": { title: "Retro Synthwave", artist: "UsefulPix", color: "#00f5d4", bg: "linear-gradient(135deg, #0c0a1f 0%, #17113a 100%)", text: "#00f5d4" },
  "pastel-dream": { title: "Pastel Dreamscape", artist: "Orbit Ambience", color: "#ffb7b2", bg: "linear-gradient(135deg, rgba(255,255,255,0.7) 0%, rgba(255,240,245,0.9) 100%)", text: "#e27396" },
  "amoled-dark": null,
  "light": null
};

export default function NowPlayingWidget() {
  const containerRef = useRef(null);
  const progressRef = useRef(null);
  const { theme } = useThemeStore();
  const rawSettings = useSettingsStore(s => s.settings);
  const [currentTrack, setCurrentTrack] = useState(null);

  // Derive ambient enablement
  const ambientEnabled = rawSettings?.sound?.enabled && rawSettings?.sound?.orbitAmbientEnabled;

  // Decide whether to show based on settings + theme
  useEffect(() => {
    if (!ambientEnabled || !THEME_TRACK_INFO[theme]) {
      // If already mounted, animate out; if not yet mounted, just clear track
      if (containerRef.current) {
        gsap.to(containerRef.current, { y: 150, opacity: 0, duration: 0.5, ease: "power3.in",
          onComplete: () => setCurrentTrack(null)
        });
      } else {
        setCurrentTrack(null);
      }
      return;
    }

    setCurrentTrack(THEME_TRACK_INFO[theme]);
  }, [theme, ambientEnabled]);

  // Run the entrance animation only once refs are attached (i.e. after currentTrack is set and JSX mounts)
  useEffect(() => {
    if (!currentTrack) return;
    
    let tl;
    // nextTick — ensure refs are populated after state-driven render
    const raf = requestAnimationFrame(() => {
      if (!containerRef.current || !progressRef.current) return;

      tl = gsap.timeline();

      // Reset progress bar
      gsap.set(progressRef.current, { width: "0%" });

      // Pop up from bottom
      tl.fromTo(
        containerRef.current,
        { y: 150, opacity: 0, scale: 0.9 },
        { y: 0, opacity: 1, scale: 1, duration: 0.8, ease: "back.out(1.2)" }
      );

      // Simulate progress bar moving for 3.5 seconds
      tl.to(progressRef.current, { width: "100%", duration: 3.5, ease: "none" });

      // Fade out after completing
      tl.to(containerRef.current, {
        y: 50, opacity: 0, duration: 0.8, ease: "power2.in",
        onComplete: () => setCurrentTrack(null)
      });
    });

    return () => {
      cancelAnimationFrame(raf);
      if (tl) tl.kill();
    };
  }, [currentTrack]);

  if (!currentTrack) return null;

  return (
    <div
      ref={containerRef}
      className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[9999] rounded-2xl shadow-2xl overflow-hidden pointer-events-none"
      style={{
        background: currentTrack.bg,
        border: `1px solid ${currentTrack.color}40`,
        width: 320,
        boxShadow: `0 10px 40px ${currentTrack.color}30, 0 0 10px ${currentTrack.color}20 inset`,
        padding: "16px 20px",
        backdropFilter: "blur(10px)",
        transform: "translateY(150px)",
        opacity: 0
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{
          width: 44, height: 44, borderRadius: '50%', background: currentTrack.color,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          boxShadow: `0 0 15px ${currentTrack.color}80`
        }}>
          <span style={{ fontSize: 20, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}>♫</span>
        </div>

        <div style={{ flex: 1, overflow: 'hidden' }}>
          <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 2, color: currentTrack.text, opacity: 0.7, marginBottom: 2 }}>
            Now Playing
          </div>
          <div style={{ fontSize: 15, fontWeight: 800, color: currentTrack.text, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
            {currentTrack.title}
          </div>
          <div style={{ fontSize: 11, color: currentTrack.text, opacity: 0.6, marginTop: 1 }}>
            {currentTrack.artist}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 16, height: 3, background: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' }}>
        <div
          ref={progressRef}
          style={{ height: '100%', background: currentTrack.color, width: '0%', boxShadow: `0 0 10px ${currentTrack.color}` }}
        />
      </div>
    </div>
  );
}
