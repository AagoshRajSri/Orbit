import { useEffect, useState, memo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { useSpotifyStore } from "../store/useSpotifyStore";
import { THEMES, THEME_LABELS } from "../constants";
import { useSettingsStore } from "../store/useSettingsStore";
import { spotifyService } from "../services/spotifyService";
import GamerThemeLayout from "../components/layout/themes/gamer/GamerThemeLayout";

/* ─────────────────────────────────────────────
   INTERNAL COMPONENTS
───────────────────────────────────────────── */
const NeonCard = ({ children, color = "#00cfff", style = {} }) => (
  <div style={{ background: "rgba(10, 10, 20, 0.8)", border: `1px solid ${color}33`, borderRadius: 16, position: "relative", padding: 20, ...style }}>
    {children}
  </div>
);

const ToggleSwitch = ({ label, checked, onChange, color = "#00cfff" }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", background: "rgba(255,255,255,0.02)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.05)" }}>
    <span style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", fontFamily: "'Orbitron', monospace", letterSpacing: "0.1em" }}>{label}</span>
    <div
      onClick={() => onChange(!checked)}
      style={{ width: 40, height: 20, borderRadius: 10, background: checked ? color : "rgba(255,255,255,0.1)", position: "relative", cursor: "pointer", transition: "all 0.3s" }}
    >
      <div style={{ width: 16, height: 16, borderRadius: "50%", background: checked ? "#000" : "#666", position: "absolute", top: 2, left: checked ? 22 : 2, transition: "all 0.3s" }} />
    </div>
  </div>
);

const AudioViz = ({ playing }) => (
  <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: "100%", justifyContent: "center" }}>
    {[...Array(12)].map((_, i) => (
      <div
        key={i}
        style={{
          width: 4,
          background: "#1DB954",
          height: playing ? `${Math.random() * 100}%` : "10%",
          transition: "height 0.2s ease",
          borderRadius: 2
        }}
      />
    ))}
  </div>
);

export default function OrbitGrind({ children }) {
  return <GamerThemeLayout children={children} />;
}

export function GamerSettings({
  activeSection, setActiveSection,
  draftTheme, setDraftTheme,
  draftDisplayName, setDraftDisplayName,
  isDirty, handleSave, handleReset
}) {
  const navigate = useNavigate();
  const sections = [
    { id: "profile", label: "IDENTITY" },
    { id: "appearance", label: "VISUALS" },
  ];

  return (
    <OrbitGrind>
      <div style={{ display: "flex", gap: 20, height: "100%", padding: 20 }}>
        <NeonCard color="#00cfff" style={{ width: 280, display: "flex", flexDirection: "column", gap: 12 }}>
          {sections.map(tab => (
            <button key={tab.id} onClick={() => setActiveSection(tab.id)} style={{ width: "100%", textAlign: "left", padding: "16px 20px", background: activeSection === tab.id ? "rgba(0,207,255,0.15)" : "transparent", border: "1px solid", borderColor: activeSection === tab.id ? "#00cfff" : "transparent", borderRadius: 8, color: activeSection === tab.id ? "#fff" : "rgba(0,207,255,0.6)", fontFamily: "'Orbitron', monospace", fontSize: 13, cursor: "pointer" }}>
              {tab.label}
            </button>
          ))}
          <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 12 }}>
            <button onClick={() => handleSave()} disabled={!isDirty} style={{ padding: 14, background: isDirty ? "#00cfff" : "transparent", color: isDirty ? "#000" : "#00cfff", border: "1px solid #00cfff", borderRadius: 8, cursor: isDirty ? "pointer" : "default" }}>COMMIT</button>
            <button onClick={() => handleReset()} disabled={!isDirty} style={{ padding: 14, background: "transparent", color: "#00cfff", border: "1px solid #00cfff", borderRadius: 8, cursor: isDirty ? "pointer" : "default" }}>ROLLBACK</button>
            <button onClick={() => navigate("/")} style={{ padding: 14, background: "transparent", border: "1px solid #ff2d78", color: "#ff2d78", borderRadius: 8, cursor: "pointer" }}>EXIT</button>
          </div>
        </NeonCard>

        <NeonCard color="#00cfff" style={{ flex: 1, overflowY: "auto" }}>
          <h2 style={{ fontSize: 24, fontWeight: 900, color: "#00cfff", fontFamily: "'Orbitron',monospace", marginBottom: 24 }}>SYSTEM_PREFERENCES // {activeSection.toUpperCase()}</h2>
          {activeSection === "profile" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <input value={draftDisplayName} onChange={e => setDraftDisplayName(e.target.value)} style={{ width: "100%", background: "rgba(0,0,0,0.5)", border: "1px solid #00cfff", color: "#fff", padding: 12, borderRadius: 8 }} />
            </div>
          )}
          {activeSection === "appearance" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10 }}>
              {THEMES.map(t => (
                <div key={t} onClick={() => setDraftTheme(t)} style={{ padding: 12, border: draftTheme === t ? "1px solid #00cfff" : "1px solid rgba(0,207,255,0.2)", borderRadius: 8, cursor: "pointer", textAlign: "center" }}>
                   <div style={{ fontSize: 11, color: "#00cfff" }}>{THEME_LABELS[t] || t}</div>
                </div>
              ))}
            </div>
          )}
        </NeonCard>
      </div>
    </OrbitGrind>
  );
}

export function GamerProfile() {
  const authUser = useAuthStore(s => s.authUser);
  const navigate = useNavigate();
  return (
    <OrbitGrind>
      <div style={{ display: "flex", gap: 20, height: "100%", padding: 20 }}>
        <NeonCard color="#ff2d78" style={{ width: 300, display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
          <img src={authUser?.profilePic || "/avatar.png"} style={{ width: 120, height: 120, borderRadius: "50%", border: "2px solid #ff2d78" }} alt="avatar" />
          <h2 style={{ fontSize: 20, color: "#fff" }}>{authUser?.username}</h2>
          <p style={{ color: "#ff2d78" }}>{authUser?.bio || "No mission bio."}</p>
          <button onClick={() => navigate("/")} style={{ marginTop: 20, padding: "10px 20px", background: "transparent", border: "1px solid #ff2d78", color: "#ff2d78", cursor: "pointer" }}>BACK</button>
        </NeonCard>
      </div>
    </OrbitGrind>
  );
}

export function GamerSpotify() {
  const { spotifyLinked, currentTrack, isPlaying, pausePlayback, playTrack } = useSpotifyStore();
  return (
    <OrbitGrind>
      <div style={{ padding: 40, textAlign: "center" }}>
        <h2 style={{ fontSize: 32, color: "#1DB954", marginBottom: 40 }}>SPOTIFY SYNC</h2>
        <NeonCard color="#1DB954" style={{ maxWidth: 500, margin: "0 auto" }}>
          {!spotifyLinked ? (
            <button onClick={() => spotifyService.initiateLogin()} style={{ padding: "12px 24px", background: "#1DB954", color: "#000", border: "none", borderRadius: 8, fontWeight: "bold", cursor: "pointer" }}>INITIALIZE LINK</button>
          ) : (
            <div>
              <img src={currentTrack?.imageUrl || "/spotify.png"} style={{ width: 240, height: 240, borderRadius: 16, border: "2px solid #1DB954" }} alt="track art" />
              <div style={{ fontSize: 24, color: "#fff", marginTop: 20 }}>{currentTrack?.name || "Awaiting Signal..."}</div>
              <div style={{ height: 60, marginTop: 20 }}>
                <AudioViz playing={isPlaying} />
              </div>
              <button onClick={() => isPlaying ? pausePlayback() : playTrack()} style={{ width: 64, height: 64, borderRadius: "50%", background: "#1DB954", border: "none", color: "#fff", fontSize: 24, cursor: "pointer", marginTop: 20 }}>{isPlaying ? "⏸" : "▶"}</button>
            </div>
          )}
        </NeonCard>
      </div>
    </OrbitGrind>
  );
}
