import { useState, memo } from "react";
import { THEMES, THEME_LABELS } from "../constants";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { useSpotifyStore } from "../store/useSpotifyStore";
import { spotifyService } from "../services/spotifyService";
import PastelThemeLayout from "../components/layout/themes/pastel/PastelThemeLayout";
import "./styles/pastel.css";

export default function PastelApp({ children }) {
  return <PastelThemeLayout children={children} />;
}

export function PastelProfile() {
  const navigate = useNavigate();
  const { authUser } = useAuthStore();

  return (
    <PastelApp>
      <div style={{ padding: 40, textAlign: "center", maxWidth: 600, margin: "0 auto" }}>
        <div style={{ padding: 40, background: "rgba(255,255,255,0.6)", backdropFilter: "blur(20px)", borderRadius: 40, border: "3px solid #fff", boxShadow: "0 20px 40px rgba(230,190,220,0.3)" }}>
          <img src={authUser?.profilePic || "/avatar.png"} style={{ width: 140, height: 140, borderRadius: "50%", border: "4px solid #fff", marginBottom: 20 }} alt="profile" />
          <h1 style={{ fontSize: 32, color: "#d060a8", fontWeight: 900 }}>{authUser?.username}</h1>
          <p style={{ color: "#a855f7", fontStyle: "italic", marginTop: 10 }}>{authUser?.bio || "No bio yet! ✨"}</p>
          <button onClick={() => navigate("/")} style={{ marginTop: 30, padding: "10px 24px", background: "#f472b6", color: "#fff", border: "none", borderRadius: 25, fontWeight: "bold", cursor: "pointer" }}>BACK</button>
        </div>
      </div>
    </PastelApp>
  );
}

export function PastelSettings({
  activeSection, setActiveSection,
  draftTheme, setDraftTheme,
  isDirty, handleSave, handleReset, authUser, navigate
}) {
  const sections = [
    { id: "profile", label: "Identity" },
    { id: "appearance", label: "Visuals" },
  ];

  return (
    <PastelApp>
      <div style={{ padding: 40, maxWidth: 1000, margin: "0 auto" }}>
        <button onClick={() => navigate("/")} style={{ marginBottom: 20, background: "transparent", border: "none", color: "#d060a8", cursor: "pointer", fontWeight: "bold" }}>← RETURN</button>
        <div style={{ padding: 40, background: "rgba(255,255,255,0.6)", backdropFilter: "blur(20px)", borderRadius: 40, border: "3px solid #fff", boxShadow: "0 20px 40px rgba(230,190,220,0.3)" }}>
          <h1 style={{ fontSize: 32, color: "#d060a8", marginBottom: 30, fontWeight: 900 }}>Preferences 🎀</h1>
          <div style={{ display: "flex", gap: 40 }}>
            <div style={{ width: 220, display: "flex", flexDirection: "column", gap: 10 }}>
              {sections.map(s => (
                <button key={s.id} onClick={() => setActiveSection(s.id)} style={{ textAlign: "left", padding: "12px 20px", borderRadius: 20, border: activeSection === s.id ? "2px solid #f472b6" : "none", background: activeSection === s.id ? "#fff" : "transparent", color: "#d060a8", fontWeight: "bold", cursor: "pointer" }}>{s.label}</button>
              ))}
              <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 10 }}>
                <button onClick={handleSave} disabled={!isDirty} style={{ padding: 12, borderRadius: 20, background: isDirty ? "#f472b6" : "#cbd5e1", color: "#fff", border: "none", fontWeight: "bold", cursor: isDirty ? "pointer" : "default" }}>SAVE ✨</button>
                <button onClick={handleReset} disabled={!isDirty} style={{ padding: 12, borderRadius: 20, background: "transparent", border: "2px solid #f472b6", color: "#f472b6", fontWeight: "bold", cursor: isDirty ? "pointer" : "default" }}>RESET</button>
              </div>
            </div>
            <div style={{ flex: 1 }}>
               {activeSection === "profile" && (
                 <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                   <label style={{ fontWeight: "bold", color: "#d060a8" }}>PERSONA NAME</label>
                   <input value={authUser?.username} readOnly style={{ width: "100%", padding: 12, borderRadius: 15, border: "2px solid #fff", background: "rgba(255,255,255,0.8)", outline: "none" }} />
                 </div>
               )}
               {activeSection === "appearance" && (
                 <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 10 }}>
                   {THEMES.map(th => (
                     <div key={th} onClick={() => setDraftTheme(th)} style={{ padding: 10, background: draftTheme === th ? "#f472b6" : "#fff", color: draftTheme === th ? "#fff" : "#d060a8", borderRadius: 15, textAlign: "center", cursor: "pointer", fontWeight: "bold" }}>
                        {THEME_LABELS[th] || th}
                     </div>
                   ))}
                 </div>
               )}
            </div>
          </div>
        </div>
      </div>
    </PastelApp>
  );
}

export function PastelSpotify() {
  const { spotifyLinked, currentTrack, isPlaying, pausePlayback, playTrack } = useSpotifyStore();
  return (
    <PastelApp>
      <div style={{ padding: 40, textAlign: "center", maxWidth: 600, margin: "0 auto" }}>
        <h1 style={{ fontSize: 32, color: "#d060a8", marginBottom: 40, fontWeight: 900 }}>Musical Magic 🎵</h1>
        <div style={{ padding: 40, background: "rgba(255,255,255,0.6)", backdropFilter: "blur(20px)", borderRadius: 40, border: "3px solid #fff", boxShadow: "0 20px 40px rgba(230,190,220,0.3)" }}>
          {!spotifyLinked ? (
            <button onClick={() => spotifyService.initiateLogin()} style={{ padding: "12px 24px", background: "#1DB954", color: "#fff", border: "none", borderRadius: 25, fontWeight: "bold", cursor: "pointer" }}>LINK SPOTIFY</button>
          ) : (
            <div>
              <img src={currentTrack?.imageUrl || "/spotify.png"} style={{ width: 280, height: 280, borderRadius: 30, marginBottom: 20 }} alt="track" />
              <h2 style={{ fontSize: 24, color: "#d060a8", fontWeight: 900 }}>{currentTrack ? currentTrack.name : "Awaiting..."}</h2>
              <button onClick={() => isPlaying ? pausePlayback() : playTrack()} style={{ marginTop: 20, width: 80, height: 80, borderRadius: "50%", background: "#f472b6", color: "white", border: "none", fontSize: 32, cursor: "pointer" }}>{isPlaying ? "⏸" : "▶"}</button>
            </div>
          )}
        </div>
      </div>
    </PastelApp>
  );
}
