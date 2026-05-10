import React, { useState, memo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { useSpotifyStore } from "../store/useSpotifyStore";
import { spotifyService } from "../services/spotifyService";
import VampireThemeLayout from "../components/layout/themes/vampire/VampireThemeLayout";
import "./styles/vampire.css";

/* ─────────────────────────────────────────────
   INTERNAL COMPONENTS
───────────────────────────────────────────── */
const ToggleSwitch = ({ label, checked, onChange }) => (
  <div className="v-toggle" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", background: "rgba(139,0,0,0.03)", borderRadius: "8px", border: "1px solid rgba(139,0,0,0.08)", marginBottom: "10px" }}>
    <span className="v-label" style={{ margin: 0 }}>{label}</span>
    <div
      onClick={() => onChange(!checked)}
      style={{ width: 40, height: 20, borderRadius: 10, background: checked ? "var(--crimson)" : "rgba(255,255,255,0.1)", position: "relative", cursor: "pointer", transition: "all 0.3s" }}
    >
      <div style={{ width: 16, height: 16, borderRadius: "50%", background: checked ? "#000" : "#666", position: "absolute", top: 2, left: checked ? 22 : 2, transition: "all 0.3s" }} />
    </div>
  </div>
);

export default function OrbitVampire({ children }) {
  return <VampireThemeLayout children={children} />;
}

export function VampireProfile() {
    const navigate = useNavigate();
    const { authUser, updateProfile } = useAuthStore();
    const [draftBio, setDraftBio] = useState(authUser?.bio || "");

    return (
        <OrbitVampire>
            <div style={{ padding: 40, maxWidth: 800, margin: "0 auto" }}>
                <h1 className="v-label" style={{ fontSize: 24, marginBottom: 20 }}>VAMPIRE PROFILE</h1>
                <div className="card" style={{ padding: 30 }}>
                    <div style={{ display: "flex", gap: 30, alignItems: "center", marginBottom: 30 }}>
                        <img src={authUser?.profilePic || "/avatar.png"} style={{ width: 100, height: 100, borderRadius: "50%", border: "2px solid var(--crimson)" }} alt="avatar" />
                        <h2 className="v-label" style={{ fontSize: 32 }}>{authUser?.username}</h2>
                    </div>
                    <textarea
                        className="v-input"
                        value={draftBio}
                        onChange={e => setDraftBio(e.target.value)}
                        style={{ height: 120, marginBottom: 20, resize: "none" }}
                        placeholder="Enter your eternal bio..."
                    />
                    <div style={{ display: "flex", gap: 10 }}>
                        <button className="nav-btn" onClick={() => updateProfile({ bio: draftBio })} style={{ background: "var(--crimson)", color: "white" }}>SAVE RITUAL</button>
                        <button className="nav-btn" onClick={() => navigate("/")}>BACK</button>
                    </div>
                </div>
            </div>
        </OrbitVampire>
    );
}

export function VampireSettings({
  activeSection, setActiveSection,
  draftDisplayName, setDraftDisplayName,
  draftShowOnlineStatus, setDraftShowOnlineStatus,
  draftSoundSettings, setDraftSoundSettings,
  isDirty, handleSave, handleReset, navigate
}) {
    const sections = [
        { id: "profile", label: "IDENTITY" },
        { id: "sound", label: "AUDIO" },
    ];

    return (
        <OrbitVampire>
            <div style={{ padding: 40, maxWidth: 1000, margin: "0 auto" }}>
                <button onClick={() => navigate("/")} className="nav-btn" style={{ marginBottom: 20 }}>← RETURN</button>
                <div className="card" style={{ padding: 30 }}>
                    <h1 className="v-label" style={{ fontSize: 32, marginBottom: 30 }}>VAMPIRE PREFERENCES</h1>
                    <div style={{ display: "flex", gap: 40 }}>
                        <div style={{ width: 200, display: "flex", flexDirection: "column", gap: 10 }}>
                            {sections.map(s => (
                                <button
                                    key={s.id}
                                    onClick={() => setActiveSection(s.id)}
                                    className="nav-btn"
                                    style={{
                                        textAlign: "left",
                                        background: activeSection === s.id ? "rgba(220,20,60,0.1)" : "transparent",
                                        borderColor: activeSection === s.id ? "var(--crimson)" : "transparent"
                                    }}
                                >
                                    {s.label}
                                </button>
                            ))}
                            <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 10 }}>
                                <button onClick={() => handleSave()} disabled={!isDirty} className="nav-btn" style={{ background: isDirty ? "var(--crimson)" : "transparent", opacity: isDirty ? 1 : 0.5 }}>COMMIT</button>
                                <button onClick={() => handleReset()} disabled={!isDirty} className="nav-btn" style={{ opacity: isDirty ? 1 : 0.5 }}>ROLLBACK</button>
                            </div>
                        </div>
                        <div style={{ flex: 1 }}>
                            {activeSection === "profile" && (
                                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                                    <div>
                                        <label className="v-label">ALIAS</label>
                                        <input className="v-input" value={draftDisplayName} onChange={e => setDraftDisplayName(e.target.value)} />
                                    </div>
                                    <ToggleSwitch label="BROADCAST PRESENCE" checked={draftShowOnlineStatus} onChange={setDraftShowOnlineStatus} />
                                </div>
                            )}
                            {activeSection === "sound" && (
                                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                                    <ToggleSwitch label="GLOBAL EFFECTS" checked={draftSoundSettings.effectsEnabled} onChange={v => setDraftSoundSettings(p => ({ ...p, effectsEnabled: v }))} />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </OrbitVampire>
    );
}

export function VampireSpotify() {
    const { spotifyLinked, currentTrack, isPlaying, pausePlayback, playTrack } = useSpotifyStore();
    return (
        <OrbitVampire>
            <div style={{ padding: 40, textAlign: "center", maxWidth: 600, margin: "0 auto" }}>
                <h2 className="v-label" style={{ fontSize: 32, marginBottom: 40 }}>NOCTURNAL HARMONY</h2>
                <div className="card" style={{ padding: 40 }}>
                    {!spotifyLinked ? (
                        <button className="nav-btn" onClick={() => spotifyService.initiateLogin()} style={{ background: "#1DB954", color: "black", borderColor: "#1DB954" }}>LINK SPOTIFY</button>
                    ) : (
                        <div>
                            <img src={currentTrack?.imageUrl || "/spotify.png"} style={{ width: 280, height: 280, borderRadius: "50%", border: "4px solid var(--crimson)", marginBottom: 30 }} alt="track art" />
                            <h3 className="v-label" style={{ fontSize: 24, marginBottom: 10 }}>{currentTrack?.name || "Awaiting Signal..."}</h3>
                            <p className="v-label" style={{ color: "var(--mist)", marginBottom: 30 }}>{currentTrack?.artist || "Unknown Frequency"}</p>
                            <button onClick={() => isPlaying ? pausePlayback() : playTrack()} className="play-btn" style={{ margin: "0 auto", width: 80, height: 80, fontSize: 32, background: "var(--crimson)", borderRadius: "50%", border: "none", color: "white", cursor: "pointer" }}>{isPlaying ? "⏸" : "▶"}</button>
                        </div>
                    )}
                </div>
            </div>
        </OrbitVampire>
    );
}
