/**
 * GlobalMiniPlayer — Fully reactive Spotify card for the chat environment.
 * 
 * Features:
 * - High-performance time-anchored progress engine (no drift)
 * - requestAnimationFrame for smooth fill without React re-renders
 * - Precision hover-seek preview with tooltip
 * - Dynamic text contrast protection
 * - Beat-reactive card scale illusion
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { useSpotifyStore } from "../store/useSpotifyStore";
import { useThemeStore } from "../store/useThemeStore";
import { useNavigate, useLocation } from "react-router-dom";
import { Play, Pause, SkipForward, SkipBack, Music, Volume2, VolumeX } from "lucide-react";

// Per-theme accent palette
const THEME_PALETTE = {
  "dark": { accent: "#dc143c", bg: "rgba(8,0,0,0.95)", border: "rgba(220,20,60,0.3)", text: "#fff", fill: "rgba(220,20,60,0.18)" },
  "neon-cyberpunk": { accent: "#00fff5", bg: "rgba(4,2,20,0.95)", border: "rgba(0,255,245,0.25)", text: "#fff", fill: "rgba(0,255,245,0.13)" },
  "gamer-high-energy": { accent: "#00f5d4", bg: "rgba(8,6,20,0.95)", border: "rgba(0,245,212,0.25)", text: "#fff", fill: "rgba(0,245,212,0.13)" },
  "amoled-dark": { accent: "#4ECDC4", bg: "rgba(0,0,0,0.97)", border: "rgba(78,205,196,0.3)", text: "#fff", fill: "rgba(78,205,196,0.15)" },
  "light": { accent: "#22c55e", bg: "rgba(255,255,255,0.95)", border: "rgba(34,197,94,0.35)", text: "#1C2431", fill: "rgba(34,197,94,0.12)" },
  "pastel-dream": { accent: "#d464b0", bg: "rgba(255,245,252,0.95)", border: "rgba(212,100,176,0.3)", text: "#4a2040", fill: "rgba(212,100,176,0.13)" },
};

function MusicBars({ color }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "flex-end", gap: 2, height: 12 }}>
      {[1, 2, 3].map(i => (
        <span
          key={i}
          style={{
            display: "block",
            width: 2.5,
            background: color,
            borderRadius: 2,
            animation: `gmb-bar-${i} ${0.55 + i * 0.12}s ease-in-out infinite alternate`,
          }}
        />
      ))}
      <style>{`
        @keyframes gmb-bar-1 { from { height: 3px } to { height: 12px } }
        @keyframes gmb-bar-2 { from { height: 7px } to { height: 9px } }
        @keyframes gmb-bar-3 { from { height: 2px } to { height: 12px } }
      `}</style>
    </span>
  );
}

const formatTime = (ms) => {
  if (!ms || isNaN(ms)) return "0:00";
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
};

export default function GlobalMiniPlayer() {
  const {
    spotifyLinked,
    currentTrack,
    isPlaying,
    pausePlayback,
    playTrack,
    skipNext,
    skipPrevious,
    seekTo,
    setVolume,
    positionMsAtSync,
    lastSyncTimestamp,
    durationMs,
  } = useSpotifyStore();

  const { theme } = useThemeStore();
  const navigate = useNavigate();
  const location = useLocation();

  const [visible, setVisible] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [volume, setLocalVolume] = useState(70);
  const [isMuted, setIsMuted] = useState(false);

  // Seek preview state
  const [hoverSeekPos, setHoverSeekPos] = useState(null);
  const [hoverSeekP, setHoverSeekP] = useState(0);

  // Optimistic anchor for seek
  const [optimisticAnchor, setOptimisticAnchor] = useState(null);
  const [isResetting, setIsResetting] = useState(false);

  const prevTrackIdRef = useRef(null);
  const prevVolRef = useRef(70);
  const cardRef = useRef(null);

  // Refs for high-performance DOM manipulation
  const fillRef = useRef(null);
  const glowRef = useRef(null);
  const timeRef = useRef(null);
  const cardScaleRef = useRef(null);

  const palette = THEME_PALETTE[theme] || THEME_PALETTE["amoled-dark"];

  // Page visibility guards
  const isSpotifyPage = location.pathname === "/spotify";
  const isAuthPage = ["/login", "/signup", "/forgot-password", "/verify-email"].some(p =>
    location.pathname.startsWith(p)
  );
  const shouldShow = spotifyLinked && currentTrack && !isSpotifyPage && !isAuthPage && durationMs > 0;

  // Entrance / exit animation
  useEffect(() => {
    const t = setTimeout(() => setVisible(shouldShow), shouldShow ? 200 : 0);
    return () => clearTimeout(t);
  }, [shouldShow]);

  // Track change → transition logic
  useEffect(() => {
    if (!currentTrack?.id) return;
    if (currentTrack.id !== prevTrackIdRef.current) {
      prevTrackIdRef.current = currentTrack.id;
      setOptimisticAnchor(null); // Clear optimistic state on new track
      setIsResetting(true);
      const t = setTimeout(() => {
        setIsResetting(false);
      }, 300);
      return () => clearTimeout(t);
    }
  }, [currentTrack]);

  // High-performance animation loop
  useEffect(() => {
    let frameId;
    let lastBeat = 0;

    const tick = () => {
      if (isResetting || !durationMs) {
        if (fillRef.current) fillRef.current.style.width = "0%";
        if (glowRef.current) glowRef.current.style.left = "0%";
        if (timeRef.current) timeRef.current.innerText = "0:00";
        if (cardScaleRef.current && isPlaying) cardScaleRef.current.style.transform = "scale(1)";
        frameId = requestAnimationFrame(tick);
        return;
      }

      // Compute exact position
      let currentPos = 0;
      if (optimisticAnchor) {
        currentPos = optimisticAnchor.pos + (isPlaying ? Date.now() - optimisticAnchor.ts : 0);
      } else if (lastSyncTimestamp) {
        currentPos = positionMsAtSync + (isPlaying ? Date.now() - lastSyncTimestamp : 0);
      } else {
        currentPos = positionMsAtSync;
      }

      currentPos = Math.max(0, Math.min(currentPos, durationMs));
      const p = (currentPos / durationMs) * 100;

      if (fillRef.current) fillRef.current.style.width = `${p}%`;
      if (glowRef.current) glowRef.current.style.left = `calc(${p}% - 10px)`;
      if (timeRef.current) timeRef.current.innerText = formatTime(currentPos);

      // Beat-reactive illusion (lightweight scale pulse every ~600ms if playing)
      if (isPlaying && cardScaleRef.current && !hovered) {
        const now = Date.now();
        if (now - lastBeat > 600) {
          lastBeat = now;
          cardScaleRef.current.style.transform = "scale(1.005)";
          setTimeout(() => {
            if (cardScaleRef.current) cardScaleRef.current.style.transform = "scale(1)";
          }, 150);
        }
      } else if (cardScaleRef.current && hovered) {
        cardScaleRef.current.style.transform = "scale(1.02)"; // slight hover lift
      } else if (cardScaleRef.current) {
        cardScaleRef.current.style.transform = "scale(1)";
      }

      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [isPlaying, isResetting, durationMs, positionMsAtSync, lastSyncTimestamp, optimisticAnchor, hovered]);

  // Click-to-seek
  const handleCardSeek = useCallback((e) => {
    if (!cardRef.current || !durationMs) return;
    if (e.target.closest("button") || e.target.closest("[data-no-seek]")) return;
    const rect = cardRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const newPos = ratio * durationMs;

    // Optimistic local update instantly
    setOptimisticAnchor({ pos: newPos, ts: Date.now() });
    setIsResetting(false);
    seekTo(newPos).catch(() => { });
  }, [durationMs, seekTo]);

  const handleMouseMove = useCallback((e) => {
    if (!cardRef.current || !durationMs) return;
    if (e.target.closest("button") || e.target.closest("[data-no-seek]")) {
      setHoverSeekPos(null);
      return;
    }
    const rect = cardRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setHoverSeekP(ratio * 100);
    setHoverSeekPos(ratio * durationMs);
  }, [durationMs]);

  const handleVolumeClick = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const newVol = Math.round(Math.max(0, Math.min(100, (x / rect.width) * 100)));
    setLocalVolume(newVol);
    prevVolRef.current = newVol;
    setIsMuted(false);
    setVolume(newVol).catch(() => { });
  }, [setVolume]);

  const handleMuteToggle = useCallback((e) => {
    e.stopPropagation();
    if (isMuted) {
      setLocalVolume(prevVolRef.current || 50);
      setVolume(prevVolRef.current || 50).catch(() => { });
    } else {
      prevVolRef.current = volume;
      setLocalVolume(0);
      setVolume(0).catch(() => { });
    }
    setIsMuted(v => !v);
  }, [isMuted, volume, setVolume]);

  if (!shouldShow) return null;

  const fillGreen = "#1DB954";

  return (
    <div
      ref={cardScaleRef}
      style={{
        position: "fixed",
        bottom: 16,
        right: 20,
        zIndex: 9000,
        transformOrigin: "bottom right",
        transition: "transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        pointerEvents: visible ? "auto" : "none"
      }}
    >
      <div
        ref={cardRef}
        role="region"
        aria-label="Now Playing"
        onMouseEnter={() => setHovered(true)}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => { setHovered(false); setHoverSeekPos(null); }}
        onClick={handleCardSeek}
        style={{
          width: hovered ? 330 : 248,
          borderRadius: 18,
          background: palette.bg,
          border: `1px solid ${palette.border}`,
          boxShadow: `0 8px 40px rgba(0,0,0,0.5), 0 0 0 1px ${palette.border}, inset 0 1px 0 rgba(255,255,255,0.06)`,
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          padding: "12px 14px 10px",
          transform: visible ? "translateY(0) scale(1)" : "translateY(80px) scale(0.9)",
          opacity: visible ? 1 : 0,
          transition: "transform 0.4s cubic-bezier(0.34,1.56,0.64,1), opacity 0.3s ease, width 0.3s cubic-bezier(0.4,0,0.2,1)",
          cursor: "crosshair",
          userSelect: "none",
          overflow: "hidden",
          isolation: "isolate",
        }}
      >
        {/* ── Green energy fill — animated via refs ── */}
        <div
          ref={fillRef}
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 0,
            background: `linear-gradient(90deg, ${fillGreen}26 0%, ${fillGreen}14 60%, transparent 100%)`,
            width: "0%",
            transition: isResetting ? "width 0.2s ease-out" : "none",
            pointerEvents: "none",
            borderRadius: "inherit",
          }}
        />

        {/* Subtle leading glow edge with pulsing blur */}
        <div
          ref={glowRef}
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            zIndex: 1,
            width: 20,
            left: "0%",
            background: `radial-gradient(ellipse at center, ${fillGreen}60 0%, transparent 100%)`,
            transition: isResetting ? "left 0.2s ease-out" : "none",
            pointerEvents: "none",
            opacity: isPlaying ? 1 : 0.3,
            filter: isPlaying ? "blur(4px)" : "blur(2px)",
            animation: isPlaying ? "pulse-glow 2s infinite alternate" : "none"
          }}
        />
        <style>{`
          @keyframes pulse-glow {
            from { filter: blur(4px); opacity: 0.7; }
            to { filter: blur(6px); opacity: 1; }
          }
        `}</style>

        {/* Hover Seek Preview Line & Tooltip */}
        {hoverSeekPos !== null && (
          <div style={{
            position: "absolute", top: 0, bottom: 0, left: `${hoverSeekP}%`,
            width: 2, background: "rgba(255,255,255,0.7)", zIndex: 5,
            pointerEvents: "none", boxShadow: "0 0 6px rgba(255,255,255,0.5)",
            transition: "left 0.05s linear"
          }}>
            <div style={{
              position: "absolute", top: -24, left: "50%", transform: "translateX(-50%)",
              background: "rgba(0,0,0,0.8)", color: "white", padding: "2px 6px",
              borderRadius: 4, fontSize: 10, fontWeight: "bold",
              border: "1px solid rgba(255,255,255,0.2)",
              whiteSpace: "nowrap"
            }}>
              {formatTime(hoverSeekPos)}
            </div>
          </div>
        )}

        {/* ── Content above fill ── */}
        <div style={{ position: "relative", zIndex: 2, display: "flex", flexDirection: "column", gap: 10 }}>
          {/* Row 1: Album art + track info + play-state indicator */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Album Art */}
            <div
              data-no-seek="1"
              onClick={(e) => { e.stopPropagation(); navigate("/spotify"); }}
              style={{
                width: 40, height: 40, borderRadius: 10, overflow: "hidden", flexShrink: 0,
                background: `${palette.accent}22`, border: `1px solid ${palette.border}`,
                position: "relative", cursor: "pointer", transition: "transform 0.2s",
              }}
              onMouseEnter={e => e.currentTarget.style.transform = "scale(1.06)"}
              onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
            >
              {currentTrack.imageUrl ? (
                <img src={currentTrack.imageUrl} alt="Album art" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <Music size={18} color={palette.accent} style={{ margin: "auto", display: "block", marginTop: 11 }} />
              )}
              {isPlaying && (
                <div style={{
                  position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
                  background: "rgba(0,0,0,0.35)", transition: "opacity 0.2s",
                }}>
                  <MusicBars color={fillGreen} />
                </div>
              )}
            </div>

            {/* Track Info */}
            <div
              data-no-seek="1"
              onClick={(e) => { e.stopPropagation(); navigate("/spotify"); }}
              style={{ flex: 1, minWidth: 0, cursor: "pointer", textShadow: "0px 1px 4px rgba(0,0,0,0.8)" }}
            >
              <div style={{
                fontSize: 12, fontWeight: 700, color: palette.text,
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", lineHeight: 1.25,
              }}>
                {currentTrack.name || "Unknown Track"}
              </div>
              <div style={{
                fontSize: 10, color: palette.text, opacity: 0.7,
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginTop: 2, lineHeight: 1.2,
              }}>
                {currentTrack.artist || "Unknown Artist"}
              </div>
            </div>

            {/* Compact state indicator or active controls */}
            {!hovered ? (
              <div data-no-seek="1" style={{ flexShrink: 0, paddingLeft: 4 }}>
                {isPlaying
                  ? <MusicBars color={palette.accent} />
                  : <div style={{ width: 6, height: 6, borderRadius: "50%", background: palette.accent, opacity: 0.5 }} />
                }
              </div>
            ) : (
              <div data-no-seek="1" style={{ display: "flex", alignItems: "center", gap: 2, flexShrink: 0 }}>
                <button
                  onClick={(e) => { e.stopPropagation(); skipPrevious().catch(() => { }); }}
                  title="Previous"
                  style={{ background: "none", border: "none", cursor: "pointer", padding: "4px 3px", color: palette.text, opacity: 0.8, transition: "opacity 0.15s, transform 0.15s" }}
                  onMouseEnter={e => { e.currentTarget.style.opacity = 1; e.currentTarget.style.transform = "scale(1.15)"; }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = 0.8; e.currentTarget.style.transform = "scale(1)"; }}
                >
                  <SkipBack size={13} fill="currentColor" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    (isPlaying ? pausePlayback() : playTrack()).catch(() => { });
                  }}
                  title={isPlaying ? "Pause" : "Play"}
                  style={{
                    width: 28, height: 28, borderRadius: "50%",
                    background: fillGreen, border: "none", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#000", flexShrink: 0, boxShadow: `0 2px 14px ${fillGreen}60`,
                    transition: "transform 0.15s, box-shadow 0.15s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.1)"; e.currentTarget.style.boxShadow = `0 4px 20px ${fillGreen}80`; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = `0 2px 14px ${fillGreen}60`; }}
                >
                  {isPlaying
                    ? <Pause size={12} fill="currentColor" />
                    : <Play size={12} fill="currentColor" style={{ marginLeft: 1 }} />
                  }
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); skipNext().catch(() => { }); }}
                  title="Next"
                  style={{ background: "none", border: "none", cursor: "pointer", padding: "4px 3px", color: palette.text, opacity: 0.8, transition: "opacity 0.15s, transform 0.15s" }}
                  onMouseEnter={e => { e.currentTarget.style.opacity = 1; e.currentTarget.style.transform = "scale(1.15)"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.opacity = 0.8; }}
                >
                  <SkipForward size={13} fill="currentColor" />
                </button>
              </div>
            )}
          </div>

          {/* Row 2: Time + volume (only when hovered) */}
          {hovered && (
            <div data-no-seek="1" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {/* Elapsed Time (updated via ref) */}
              <span ref={timeRef} style={{ fontSize: 9, color: palette.text, opacity: 0.6, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap", width: 22, textShadow: "0 1px 2px rgba(0,0,0,0.8)" }}>
                0:00
              </span>

              {/* Thin progress track */}
              <div style={{ flex: 1, height: 2, background: `${palette.text}15`, borderRadius: 2, position: "relative", overflow: "hidden" }} />

              <span style={{ fontSize: 9, color: palette.text, opacity: 0.5, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap", textShadow: "0 1px 2px rgba(0,0,0,0.8)" }}>
                {formatTime(durationMs)}
              </span>

              {/* Volume mute toggle */}
              <button
                onClick={handleMuteToggle}
                title={isMuted ? "Unmute" : "Mute"}
                style={{ background: "none", border: "none", cursor: "pointer", padding: "2px", color: palette.text, opacity: 0.7, flexShrink: 0, transition: "opacity 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.opacity = 1}
                onMouseLeave={e => e.currentTarget.style.opacity = 0.7}
              >
                {isMuted || volume === 0 ? <VolumeX size={11} /> : <Volume2 size={11} />}
              </button>

              {/* Volume slider */}
              <div
                onClick={handleVolumeClick}
                title="Volume"
                style={{
                  width: 52, height: 3, background: `${palette.text}15`,
                  borderRadius: 2, position: "relative", cursor: "pointer", flexShrink: 0,
                  transition: "height 0.15s",
                }}
                onMouseEnter={e => e.currentTarget.style.height = "5px"}
                onMouseLeave={e => e.currentTarget.style.height = "3px"}
              >
                <div style={{
                  position: "absolute", left: 0, top: 0, height: "100%",
                  width: `${isMuted ? 0 : volume}%`, background: fillGreen, borderRadius: 2,
                }} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
