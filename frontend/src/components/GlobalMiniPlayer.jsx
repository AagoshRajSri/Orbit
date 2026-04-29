/**
 * GlobalMiniPlayer — floats at the bottom of every page.
 * Appears only when Spotify is linked and a track is playing.
 * Tiny, tasteful, theme-aware.
 */
import { useState, useEffect, useRef } from "react";
import { useSpotifyStore } from "../store/useSpotifyStore";
import { useThemeStore } from "../store/useThemeStore";
import { useNavigate, useLocation } from "react-router-dom";
import { Play, Pause, SkipForward, SkipBack, Music } from "lucide-react";

// Per-theme accent palette
const THEME_PALETTE = {
  "dark":              { accent: "#dc143c", bg: "rgba(10,0,0,0.92)", border: "rgba(220,20,60,0.25)", text: "#fff" },
  "neon-cyberpunk":    { accent: "#00fff5", bg: "rgba(4,2,20,0.93)", border: "rgba(0,255,245,0.20)", text: "#fff" },
  "gamer-high-energy": { accent: "#00f5d4", bg: "rgba(8,6,20,0.93)", border: "rgba(0,245,212,0.20)", text: "#fff" },
  "amoled-dark":       { accent: "#4ECDC4", bg: "rgba(0,0,0,0.96)",  border: "rgba(78,205,196,0.25)", text: "#fff" },
  "light":             { accent: "#6DA37A", bg: "rgba(255,255,255,0.92)", border: "rgba(109,163,122,0.30)", text: "#1C2431" },
  "pastel-dream":      { accent: "#d464b0", bg: "rgba(255,245,252,0.93)", border: "rgba(212,100,176,0.25)", text: "#4a2040" },
};

function MusicBars({ color }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "flex-end", gap: 2, height: 14 }}>
      {[1, 2, 3].map(i => (
        <span
          key={i}
          style={{
            display: "block",
            width: 3,
            background: color,
            borderRadius: 2,
            animation: `orbit-bar-${i} ${0.6 + i * 0.15}s ease-in-out infinite alternate`,
          }}
        />
      ))}
      <style>{`
        @keyframes orbit-bar-1 { from { height: 4px } to { height: 14px } }
        @keyframes orbit-bar-2 { from { height: 8px } to { height: 10px } }
        @keyframes orbit-bar-3 { from { height: 3px } to { height: 14px } }
      `}</style>
    </span>
  );
}

export default function GlobalMiniPlayer() {
  const {
    spotifyLinked,
    currentTrack,
    isPlaying,
    pausePlayback,
    playTrack,
    skipNext,
    skipPrevious,
    positionMs,
    durationMs,
  } = useSpotifyStore();

  const { theme } = useThemeStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [visible, setVisible] = useState(false);
  const [hovered, setHovered] = useState(false);
  const prevTrackId = useRef(null);

  const palette = THEME_PALETTE[theme] || THEME_PALETTE["amoled-dark"];

  // Don't show on spotify page itself
  const isSpotifyPage = location.pathname === "/spotify";
  const isAuthPage = ["/login", "/signup", "/forgot-password", "/verify-email"].some(p =>
    location.pathname.startsWith(p)
  );

  const shouldShow = spotifyLinked && currentTrack && !isSpotifyPage && !isAuthPage;

  // Animate in/out
  useEffect(() => {
    if (shouldShow) {
      const t = setTimeout(() => setVisible(true), 200);
      return () => clearTimeout(t);
    } else {
      setVisible(false);
    }
  }, [shouldShow]);

  // Animate when track changes
  useEffect(() => {
    if (currentTrack?.id && currentTrack.id !== prevTrackId.current) {
      prevTrackId.current = currentTrack.id;
    }
  }, [currentTrack]);

  if (!shouldShow) return null;

  const progress = durationMs > 0 ? (positionMs / durationMs) * 100 : 0;

  return (
    <div
      role="region"
      aria-label="Now Playing"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "fixed",
        bottom: 16,
        right: 20,
        zIndex: 9000,
        width: hovered ? 320 : 240,
        borderRadius: 16,
        background: palette.bg,
        border: `1px solid ${palette.border}`,
        boxShadow: `0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px ${palette.border}`,
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        padding: "10px 14px 8px",
        transform: visible ? "translateY(0) scale(1)" : "translateY(80px) scale(0.9)",
        opacity: visible ? 1 : 0,
        transition: "transform 0.35s cubic-bezier(0.34,1.56,0.64,1), opacity 0.3s ease, width 0.25s ease",
        cursor: "pointer",
        userSelect: "none",
      }}
    >
      {/* Progress bar at very top */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, borderRadius: "16px 16px 0 0", background: `${palette.accent}22`, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${progress}%`, background: palette.accent, borderRadius: 4, transition: "width 1s linear" }} />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {/* Album Art */}
        <div
          onClick={() => navigate("/spotify")}
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            overflow: "hidden",
            flexShrink: 0,
            background: `${palette.accent}22`,
            border: `1px solid ${palette.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          }}
        >
          {currentTrack.imageUrl ? (
            <img
              src={currentTrack.imageUrl}
              alt="Album art"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <Music size={18} color={palette.accent} />
          )}
          {isPlaying && (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.3)" }}>
              <MusicBars color={palette.accent} />
            </div>
          )}
        </div>

        {/* Track Info */}
        <div
          onClick={() => navigate("/spotify")}
          style={{ flex: 1, minWidth: 0 }}
        >
          <div style={{
            fontSize: 12,
            fontWeight: 700,
            color: palette.text,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            lineHeight: 1.2,
          }}>
            {currentTrack.name}
          </div>
          <div style={{
            fontSize: 10,
            color: palette.text,
            opacity: 0.55,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            marginTop: 2,
          }}>
            {currentTrack.artist}
          </div>
        </div>

        {/* Controls - only show when hovered */}
        {hovered ? (
          <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
            <button
              onClick={(e) => { e.stopPropagation(); skipPrevious().catch(() => {}); }}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: palette.text, opacity: 0.6, transition: "opacity 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.opacity = 1}
              onMouseLeave={e => e.currentTarget.style.opacity = 0.6}
              title="Previous"
            >
              <SkipBack size={14} fill="currentColor" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (isPlaying) {
                  pausePlayback().catch(() => {});
                } else {
                  playTrack().catch(() => {});
                }
              }}
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: palette.accent,
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: theme === "light" || theme === "pastel-dream" ? "#fff" : "#000",
                flexShrink: 0,
                boxShadow: `0 2px 12px ${palette.accent}60`,
              }}
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying
                ? <Pause size={12} fill="currentColor" />
                : <Play size={12} fill="currentColor" style={{ marginLeft: 1 }} />
              }
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); skipNext().catch(() => {}); }}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: palette.text, opacity: 0.6, transition: "opacity 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.opacity = 1}
              onMouseLeave={e => e.currentTarget.style.opacity = 0.6}
              title="Next"
            >
              <SkipForward size={14} fill="currentColor" />
            </button>
          </div>
        ) : (
          /* Compact state — just show play/pause dot */
          <div style={{ flexShrink: 0, display: "flex", alignItems: "center" }}>
            {isPlaying ? (
              <MusicBars color={palette.accent} />
            ) : (
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: palette.accent, opacity: 0.6 }} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
