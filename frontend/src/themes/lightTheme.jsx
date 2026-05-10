import React, { useState, memo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { useSpotifyStore } from "../store/useSpotifyStore";
import { THEMES, THEME_LABELS } from "../constants";
import { spotifyService } from "../services/spotifyService";
import LightThemeLayout from "../components/layout/themes/light/LightThemeLayout";

export default function LightTheme({ children }) {
  return <LightThemeLayout children={children} />;
}

export function LightSpotify() {
  const navigate = useNavigate();
  const { spotifyLinked, currentTrack, isPlaying, pausePlayback, playTrack } = useSpotifyStore();

  return (
    <LightTheme>
      <div style={{ padding: 60, textAlign: 'center', maxWidth: 600, margin: '0 auto' }}>
        <h2 style={{ fontSize: 36, color: "#1C2431", marginBottom: 32 }}>Musical Resonance</h2>
        {!spotifyLinked ? (
          <button className="btn btn-primary" onClick={() => spotifyService.initiateLogin()}>LINK SPOTIFY</button>
        ) : (
          <div style={{ padding: 40, background: 'white', borderRadius: 20, boxShadow: '0 20px 50px rgba(0,0,0,0.05)' }}>
            <img src={currentTrack?.imageUrl || "/spotify.png"} style={{ width: 280, height: 280, borderRadius: 20, marginBottom: 20 }} alt="track" />
            <div style={{ fontSize: 24, fontWeight: 700, color: '#1C2431' }}>{currentTrack ? currentTrack.name : "Awaiting..."}</div>
            <button onClick={() => isPlaying ? pausePlayback() : playTrack()} style={{ marginTop: 20, width: 80, height: 80, borderRadius: '50%', background: '#6DA37A', color: 'white', border: 'none', cursor: 'pointer' }}>{isPlaying ? "⏸" : "▶"}</button>
          </div>
        )}
      </div>
    </LightTheme>
  );
}

export function LightProfile() {
  const { authUser } = useAuthStore();
  const navigate = useNavigate();

  return (
    <LightTheme>
      <div style={{ padding: 60, textAlign: 'center', maxWidth: 600, margin: '0 auto' }}>
        <div style={{ padding: 40, background: 'white', borderRadius: 20, boxShadow: '0 20px 50px rgba(0,0,0,0.05)' }}>
          <img src={authUser?.profilePic || "/avatar.png"} style={{ width: 140, height: 140, borderRadius: '50%', border: '4px solid #F7F5F0', marginBottom: 20 }} alt="profile" />
          <h1 style={{ fontSize: 32, color: '#1C1C1C' }}>{authUser?.username}</h1>
          <p style={{ color: '#6B6560', fontStyle: 'italic', marginTop: 10 }}>{authUser?.bio || "No bio provided."}</p>
          <button onClick={() => navigate("/")} style={{ marginTop: 30, padding: '10px 24px', borderRadius: 12, border: '1px solid #EAE4D8', background: 'transparent', cursor: 'pointer' }}>BACK</button>
        </div>
      </div>
    </LightTheme>
  );
}

export function LightSettings({
  activeSection, setActiveSection,
  draftTheme, setDraftTheme,
  draftDisplayName, setDraftDisplayName,
  isDirty, handleSave, handleReset, navigate
}) {
  const sections = [
    { id: "profile", label: "Identity" },
    { id: "appearance", label: "Visuals" },
  ];

  return (
    <LightTheme>
      <div style={{ padding: 60, maxWidth: 1000, margin: '0 auto' }}>
        <button onClick={() => navigate("/")} style={{ marginBottom: 20, background: 'transparent', border: 'none', cursor: 'pointer', color: '#6B6560' }}>← BACK</button>
        <div style={{ padding: 40, background: 'white', borderRadius: 20, boxShadow: '0 20px 50px rgba(0,0,0,0.05)' }}>
          <h1 style={{ fontSize: 32, marginBottom: 30 }}>Preferences</h1>
          <div style={{ display: 'flex', gap: 40 }}>
            <div style={{ width: 220, display: "flex", flexDirection: "column", gap: 10 }}>
              {sections.map(s => (
                <button key={s.id} onClick={() => setActiveSection(s.id)} style={{ textAlign: 'left', padding: '12px 20px', borderRadius: 12, border: activeSection === s.id ? '1px solid #1C1C1C' : '1px solid transparent', background: activeSection === s.id ? '#F7F5F0' : 'transparent', cursor: 'pointer' }}>{s.label}</button>
              ))}
              <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button onClick={() => handleSave()} disabled={!isDirty} style={{ padding: 12, borderRadius: 12, background: isDirty ? '#1C1C1C' : '#E0E0E0', color: 'white', border: 'none', cursor: isDirty ? 'pointer' : 'default' }}>SAVE</button>
                <button onClick={() => handleReset()} disabled={!isDirty} style={{ padding: 12, borderRadius: 12, background: 'transparent', border: '1px solid #EAE4D8', cursor: isDirty ? 'pointer' : 'default' }}>RESET</button>
              </div>
            </div>
            <div style={{ flex: 1 }}>
               {activeSection === "profile" && (
                 <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                   <label style={{ fontSize: 12, fontWeight: 700, color: '#1C1C1C' }}>ALIAS</label>
                   <input value={draftDisplayName} onChange={e => setDraftDisplayName(e.target.value)} style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #EAE4D8' }} />
                 </div>
               )}
               {activeSection === "appearance" && (
                 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
                   {THEMES.map(t => (
                     <div key={t} onClick={() => setDraftTheme(t)} style={{ padding: 12, borderRadius: 12, border: draftTheme === t ? '1px solid #1C1C1C' : '1px solid #EAE4D8', cursor: 'pointer', textAlign: 'center' }}>
                       <div style={{ fontSize: 11, fontWeight: 600 }}>{THEME_LABELS[t] || t}</div>
                     </div>
                   ))}
                 </div>
               )}
            </div>
          </div>
        </div>
      </div>
    </LightTheme>
  );
}
