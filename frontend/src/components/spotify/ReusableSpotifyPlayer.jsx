import { useEffect, useRef, useState, memo, useMemo } from "react";
import { useSpotifyStore } from "../../store/useSpotifyStore";
import { useNavigate } from "react-router-dom";

const Waveform = memo(({ playing, color1 = "#C6A06E", color2 = "#4ECDC4" }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 2, height: 28 }}>
    {Array.from({ length: 28 }).map((_, i) => (
      <div key={i} style={{
        width: 3, borderRadius: 2,
        background: `linear-gradient(to top, ${color1}, ${color2})`,
        animationName: playing ? "oa-wave" : "none",
        animationDuration: `${0.4 + (i % 5) * 0.12}s`,
        animationDelay: `${(i * 0.055) % 0.6}s`,
        animationTimingFunction: "ease-in-out",
        animationIterationCount: "infinite",
        animationDirection: "alternate",
        height: playing ? undefined : 3,
        minHeight: 3, maxHeight: 24,
      }} />
    ))}
  </div>
));
Waveform.displayName = "Waveform";

const ReusableSpotifyPlayer = ({
  theme = "default",
  onNavigate,
  className = ""
}) => {
  const navigate = useNavigate();
  const {
    spotifyLinked, currentTrack, isPlaying,
    pausePlayback, playTrack, skipNext, skipPrevious,
    positionMs, durationMs, seekTo, setVolume
  } = useSpotifyStore();

  const [localPos, setLocalPos] = useState(positionMs || 0);
  const [vol, setVol] = useState(70);

  useEffect(() => {
    setLocalPos(positionMs || 0);
  }, [positionMs]);

  useEffect(() => {
    let t;
    if (isPlaying && durationMs) {
      t = setInterval(() => setLocalPos(p => Math.min(p + 1000, durationMs)), 1000);
    }
    return () => clearInterval(t);
  }, [isPlaying, durationMs]);

  const progress = durationMs ? (localPos / durationMs) * 100 : 0;

  const handleSeek = (e) => {
    e.stopPropagation();
    if (!durationMs) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    seekTo((percent / 100) * durationMs);
  };

  const handleVol = (e) => {
    e.stopPropagation();
    const r = e.currentTarget.getBoundingClientRect();
    const v = Math.round(Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100)));
    setVol(v);
    if (setVolume) setVolume(v);
  };

  const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

  if (!spotifyLinked) {
    return (
      <div className={`spotify-card-container ${className}`} onClick={() => navigate("/spotify")}>
         <div className="spotify-connect-content">
            <span className="spotify-title">Connect Spotify</span>
            <span className="spotify-subtitle">Share your listening experience</span>
         </div>
      </div>
    );
  }

  return (
    <div className={`spotify-card-container ${className}`} onClick={() => navigate("/spotify")}>
      <div className="spotify-active-header">
        <div className="spotify-track-info">
          {currentTrack?.imageUrl ? (
            <img src={currentTrack.imageUrl} alt="" className="track-art" />
          ) : (
            <div className="track-art-placeholder">🎼</div>
          )}
          <div className="track-details">
            <div className="track-name">{currentTrack ? currentTrack.name : "Orbit Anthems"}</div>
            <div className="track-artist">{currentTrack ? currentTrack.artist : "Premium Audio"}</div>
          </div>
        </div>
        <Waveform playing={isPlaying} />
      </div>

      <div className="spotify-controls-area">
        <div className="progress-bar-container" onClick={handleSeek}>
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="controls-row">
          <div className="playback-btns">
            <button className="ctrl-btn" onClick={(e) => { e.stopPropagation(); skipPrevious(); }}>⏮</button>
            <button className="play-btn" onClick={(e) => { e.stopPropagation(); isPlaying ? pausePlayback() : playTrack(); }}>
              {isPlaying ? "⏸" : "▶"}
            </button>
            <button className="ctrl-btn" onClick={(e) => { e.stopPropagation(); skipNext(); }}>⏭</button>
          </div>
          <div className="volume-control">
            <span className="vol-icon">🔊</span>
            <div className="vol-slider-container" onClick={handleVol}>
               <div className="vol-fill" style={{ width: `${vol}%` }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(ReusableSpotifyPlayer);
