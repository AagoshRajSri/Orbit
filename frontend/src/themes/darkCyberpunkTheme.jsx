import { useEffect, useRef, useState, useCallback, useMemo, memo, Fragment } from "react";
import UniversalChatContainer from "../components/chat/UniversalChatContainer";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { useSpotifyStore } from "../store/useSpotifyStore";
import { THEMES, THEME_LABELS } from "../constants";
import { useSoundManager } from "../hooks/useSoundManager";
import { useChatStore } from "../store/useChatStore";
import { gsap } from "gsap";
import { useNexusStore } from "../store/useNexusStore";
import { useSettingsStore } from "../store/useSettingsStore";
import NexusActionOverlay from "../components/nexus/NexusActionOverlay";
import { PixelAvatarBadge } from "../components/avatar/PixelAvatar/PixelAvatarBadge.jsx";
import { spotifyService } from "../services/spotifyService";
import { API_URL } from "../config";
import CyberpunkThemeLayout from "../components/layout/themes/cyberpunk/CyberpunkThemeLayout";
import "./styles/cyberpunk.css";

/* ─────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────── */
const C = "#00fff5";   // neon cyan
const M = "#ff00c8";   // neon magenta
const P = "#b026ff";   // neon purple
const Y = "#ffe600";   // neon yellow

/* ─────────────────────────────────────────────
   INTERNAL COMPONENTS
───────────────────────────────────────────── */
const NeonCard = ({ children, color = C, style = {}, className = "" }) => (
  <div
    className={`neon-card-base ${className}`}
    style={{
      background: "rgba(0, 0, 0, 0.7)",
      border: `1px solid ${color}44`,
      boxShadow: `0 0 20px ${color}15`,
      borderRadius: "12px",
      position: "relative",
      overflow: "hidden",
      ...style
    }}
  >
    <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "2px", background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />
    {children}
  </div>
);

const ToggleSwitch = ({ label, checked, onChange, color = C }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "rgba(255,255,255,0.02)", borderRadius: 8, border: "1px solid rgba(255,255,255,0.05)" }}>
    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", fontFamily: "'Orbitron', monospace", letterSpacing: "0.1em" }}>{label}</span>
    <div
      onClick={() => onChange(!checked)}
      style={{ width: 34, height: 18, borderRadius: 9, background: checked ? color : "rgba(255,255,255,0.1)", position: "relative", cursor: "pointer", transition: "all 0.3s", boxShadow: checked ? `0 0 10px ${color}66` : "none" }}
    >
      <div style={{ width: 14, height: 14, borderRadius: "50%", background: checked ? "#000" : "#666", position: "absolute", top: 2, left: checked ? 18 : 2, transition: "all 0.3s" }} />
    </div>
  </div>
);

const OrbitalViz = ({ playing }) => (
  <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#050505" }}>
    <div className={`orbit-spinner ${playing ? "running" : "paused"}`} style={{ width: 60, height: 60, border: `2px solid ${C}22`, borderRadius: "50%", borderTopColor: C, animation: "ncb-spin 2s linear infinite" }} />
  </div>
);

export default function OrbitNeonCyberpunk({ children }) {
  return <CyberpunkThemeLayout children={children} />;
}

export function CyberpunkSettings({
  activeSection, setActiveSection,
  draftTheme, setDraftTheme,
  draftDisplayName, setDraftDisplayName,
  draftBio, setDraftBio,
  draftNotifications, setDraftNotifications,
  draftShowOnlineStatus, setDraftShowOnlineStatus,
  draftOrbitBehavior, setDraftOrbitBehavior,
  draftSoundSettings, setDraftSoundSettings,
  isDirty, handleSave, handleReset, authUser,
}) {
  const [focusedTheme, setFocusedTheme] = useState(draftTheme);
  const { play } = useSoundManager();

  const sections = [
    { id: "profile", label: "IDENTITY", icon: "👤" },
    { id: "sound", label: "AUDIO", icon: "🔊" },
    { id: "appearance", label: "VISUALS", icon: "🎨" },
    { id: "notifications", label: "ALERTS", icon: "🔔" },
    { id: "orbit", label: "ENGINE", icon: "🪐" },
  ];

  return (
    <OrbitNeonCyberpunk>
      <div className="ncb-settings-layout" style={{ display: "flex", gap: 20, height: "100%", padding: "20px" }}>
        {/* Settings Nav */}
        <NeonCard color={C} style={{ width: 260, padding: 20, display: "flex", flexDirection: "column", gap: 10, flexShrink: 0 }} className="ncb-settings-nav">
          <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: "0.25em", color: `${C}88`, fontFamily: "'Orbitron',monospace", marginBottom: 4 }}>// SYS.PREFERENCES</div>
          {sections.map(s => (
            <button key={s.id} onClick={() => { play?.("click"); setActiveSection(s.id); }} style={{ width: "100%", textAlign: "left", padding: "12px 16px", background: activeSection === s.id ? `${C}14` : "transparent", border: "1px solid", borderColor: activeSection === s.id ? C : "transparent", borderRadius: 6, color: activeSection === s.id ? "#fff" : `${C}66`, fontFamily: "'Orbitron', monospace", fontSize: 11, letterSpacing: "0.15em", cursor: "pointer", transition: "all 0.2s", display: "flex", alignItems: "center", gap: 10, boxShadow: activeSection === s.id ? `0 0 10px ${C}33` : "none" }}>
              <span style={{ fontSize: 16 }}>{s.icon}</span>{s.label}
            </button>
          ))}
          <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
            <button onClick={() => { play?.("click"); handleReset(); }} disabled={!isDirty} style={{ width: "100%", padding: "12px", borderRadius: 6, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: isDirty ? "#fff" : "rgba(255,255,255,0.25)", fontSize: 11, fontFamily: "'Orbitron', monospace", cursor: isDirty ? "pointer" : "default", letterSpacing: "0.1em" }}>ROLLBACK</button>
            <button onClick={() => { play?.("click"); handleSave(); }} disabled={!isDirty} style={{ width: "100%", padding: "12px", borderRadius: 6, background: isDirty ? `linear-gradient(90deg,${C},${P})` : `${C}15`, border: `1px solid ${isDirty ? C : `${C}22`}`, color: isDirty ? "#000" : `${C}44`, fontWeight: 900, fontSize: 11, fontFamily: "'Orbitron', monospace", cursor: isDirty ? "pointer" : "default", boxShadow: isDirty ? `0 0 15px ${C}55` : "none", letterSpacing: "0.1em" }}>COMMIT</button>
          </div>
        </NeonCard>

        {/* Settings Content */}
        <NeonCard color={P} style={{ flex: 1, padding: 28, overflowY: "auto" }}>
          <h2 style={{ fontSize: 20, fontWeight: 900, color: C, fontFamily: "'Orbitron',monospace", marginBottom: 24, textShadow: `0 0 10px ${C}`, letterSpacing: "0.15em" }}>
            SYS_PREF // {activeSection.toUpperCase()}
          </h2>

          {activeSection === "appearance" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 14 }}>
                  {THEMES.map(t => {
                    const isSelected = focusedTheme === t;
                    const isApplied = draftTheme === t;
                    
                    // Fixed preview colors for each theme
                    let previewPrimary = "#8b5cf6"; // default (cyber purple)
                    let previewBg = "#0c0e14";
                    
                    if (t === "light") { previewPrimary = "#3b82f6"; previewBg = "#ffffff"; }
                    else if (t === "dark") { previewPrimary = "#ef4444"; previewBg = "#0a0a0a"; }
                    else if (t === "neon-cyberpunk") { previewPrimary = "#8b5cf6"; previewBg = "#0c0e14"; }
                    else if (t === "gamer-high-energy") { previewPrimary = "#ff2d78"; previewBg = "#080614"; }
                    else if (t === "pastel-dream") { previewPrimary = "#e060b0"; previewBg = "#ffd4ee"; }
                    else if (t === "amoled-dark") { previewPrimary = "#E8C990"; previewBg = "#000000"; }

                    return (
                        <div key={t} onClick={() => { play?.("click"); setFocusedTheme(t); }} style={{ padding: 14, borderRadius: 10, border: isSelected ? `2px solid ${C}` : `1px solid rgba(255,255,255,0.08)`, background: isSelected ? `${C}10` : "rgba(255,255,255,0.02)", display: "flex", flexDirection: "column", gap: 10, cursor: "pointer", transition: "all 0.2s", boxShadow: isSelected ? `0 0 15px ${C}33` : "none" }}>
                          <div style={{ width: "100%", height: 36, borderRadius: 5, border: "1px solid rgba(255,255,255,0.06)", overflow: "hidden", display: "flex", background: previewBg }}>
                            <div style={{ flex: 1, background: previewPrimary }} />
                            <div style={{ flex: 1, background: previewBg }} />
                          </div>

                          <div style={{ textAlign: "center" }}>
                            <div style={{ fontSize: 9, color: isSelected ? C : "rgba(255,255,255,0.4)", fontFamily: "'Orbitron', monospace", letterSpacing: "0.05em" }}>{THEME_LABELS[t] || t.toUpperCase()}</div>
                            {isSelected && !isApplied && (
                              <button onClick={e => { e.stopPropagation(); play?.("click"); setDraftTheme(t); }} style={{ marginTop: 6, padding: "5px 8px", width: "100%", background: C, border: "none", color: "#000", fontSize: 8, fontWeight: 900, fontFamily: "'Orbitron', monospace", cursor: "pointer", borderRadius: 4, letterSpacing: "0.1em", boxShadow: `0 0 8px ${C}66` }}>DEPLOY</button>
                            )}
                            {isApplied && <div style={{ marginTop: 6, fontSize: 9, color: C, fontWeight: 700, fontFamily: "'Orbitron', monospace" }}>✓ ACTIVE</div>}
                          </div>

                        </div>

                    );
                  })}
            </div>
          )}

          {activeSection === "sound" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ background: "rgba(255,255,255,0.02)", padding: 16, borderRadius: 10, border: "1px solid rgba(255,255,255,0.05)" }}>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", marginBottom: 12, fontFamily: "'Orbitron', monospace", letterSpacing: "0.1em" }}>MASTER GAIN: {(draftSoundSettings.volume * 100).toFixed(0)}%</div>
                <input type="range" min="0" max="1" step="0.01" value={draftSoundSettings.volume} onChange={e => { const v = parseFloat(e.target.value); setDraftSoundSettings(p => ({ ...p, volume: v })); try { useSettingsStore.getState().updateSetting('sound.volume', v); } catch (_) {} }} style={{ width: "100%", accentColor: C }} />
              </div>

              <ToggleSwitch label="GLOBAL EFFECTS" checked={draftSoundSettings.effectsEnabled} onChange={v => { setDraftSoundSettings(p => ({ ...p, effectsEnabled: v })); try { useSettingsStore.getState().updateSetting('sound.enabled', v); } catch (_) {} }} />
              <ToggleSwitch label="TRANSMISSION PINGS" checked={draftSoundSettings.messageSound} onChange={v => { setDraftSoundSettings(p => ({ ...p, messageSound: v })); try { useSettingsStore.getState().updateSetting('sound.notificationEnabled', v); } catch (_) {} }} />
              <ToggleSwitch label="HAPTIC CLICKS" checked={draftSoundSettings.clickSound} onChange={v => { setDraftSoundSettings(p => ({ ...p, clickSound: v })); try { useSettingsStore.getState().updateSetting('sound.clickEnabled', v); } catch (_) {} }} />

            </div>
          )}

          {activeSection === "profile" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ background: "rgba(255,255,255,0.02)", padding: 16, borderRadius: 10, border: "1px solid rgba(255,255,255,0.05)" }}>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", fontFamily: "'Orbitron', monospace", letterSpacing: "0.06em", display: "block", marginBottom: 10 }}>HANDLE ALIAS</span>
                <input type="text" value={draftDisplayName} onChange={e => setDraftDisplayName(e.target.value)} placeholder={authUser?.username || "Ghost"} style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: `1px solid ${C}44`, color: C, padding: "10px 14px", borderRadius: 6, fontFamily: "'Rajdhani', monospace", fontSize: 15, outline: "none", boxShadow: `inset 0 0 10px ${C}11` }} />
              </div>


              <div style={{ background: "rgba(255,255,255,0.02)", padding: 16, borderRadius: 10, border: "1px solid rgba(255,255,255,0.05)" }}>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", fontFamily: "'Orbitron', monospace", letterSpacing: "0.06em", display: "block", marginBottom: 10 }}>DIRECTIVE BIO</span>
                <textarea value={draftBio} onChange={e => setDraftBio(e.target.value)} placeholder="Initialise directive..." style={{ width: "100%", height: 80, background: "rgba(0,0,0,0.4)", border: `1px solid ${C}44`, color: C, padding: "10px 14px", borderRadius: 6, fontFamily: "'Rajdhani', monospace", fontSize: 14, outline: "none", boxShadow: `inset 0 0 10px ${C}11`, resize: "none" }} />
              </div>

              <ToggleSwitch label="BROADCAST PRESENCE" checked={draftShowOnlineStatus} onChange={setDraftShowOnlineStatus} color={M} />
            </div>
          )}

          {activeSection === "notifications" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <ToggleSwitch label="DESKTOP OVERLAYS" checked={draftNotifications.desktop} onChange={v => { setDraftNotifications(p => ({ ...p, desktop: v })); try { useSettingsStore.getState().updateSetting('notifications.desktopEnabled', v); } catch (_) {} }} color={Y} />
              <ToggleSwitch label="AUDIO CUES" checked={draftNotifications.sound} onChange={v => { setDraftNotifications(p => ({ ...p, sound: v })); try { useSettingsStore.getState().updateSetting('notifications.enabled', v); } catch (_) {} }} color={Y} />
              <ToggleSwitch label="EMAIL DIGESTS" checked={draftNotifications.email} onChange={v => setDraftNotifications(p => ({ ...p, email: v }))} color={Y} />
            </div>
          )}

          {activeSection === "orbit" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <ToggleSwitch label="RENDER RINGS" checked={draftOrbitBehavior.showRings} onChange={v => setDraftOrbitBehavior(p => ({ ...p, showRings: v }))} color={P} />
              <ToggleSwitch label="MOMENTUM PAUSE" checked={draftOrbitBehavior.autoPauseOnHover} onChange={v => setDraftOrbitBehavior(p => ({ ...p, autoPauseOnHover: v }))} color={P} />
              <div style={{ background: "rgba(255,255,255,0.02)", padding: 16, borderRadius: 10, border: "1px solid rgba(255,255,255,0.05)", display: "flex", flexDirection: "column", gap: 10 }}>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", fontFamily: "'Orbitron', monospace", letterSpacing: "0.06em" }}>INTERACTION FILTER</span>
                <select value={draftOrbitBehavior.interactionFilter} onChange={e => setDraftOrbitBehavior(p => ({ ...p, interactionFilter: e.target.value }))} style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: `1px solid ${P}44`, color: P, padding: "10px 14px", borderRadius: 6, fontFamily: "'Rajdhani', monospace", fontSize: 15, outline: "none" }}>
                  <option value="all">ALL NODES</option>
                  <option value="active">ACTIVE NODES ONLY</option>
                  <option value="mutual">MUTUAL ORBITS ONLY</option>
                </select>
              </div>

            </div>
          )}
        </NeonCard>
      </div>
    </OrbitNeonCyberpunk>
  );
}

export function CyberpunkProfile() {
  const authUser = useAuthStore(s => s.authUser);
  const navigate = useNavigate();
  return (
    <OrbitNeonCyberpunk>
      <div className="ncb-profile-layout" style={{ display: "flex", gap: 20, height: "100%", padding: "20px" }}>
        <NeonCard color={M} style={{ width: 280, padding: 24, display: "flex", flexDirection: "column", alignItems: "center", gap: 16, flexShrink: 0 }} className="ncb-profile-card">
          <div style={{ position: "relative" }}>
            <div style={{ width: 120, height: 120, borderRadius: "50%", border: `2px solid ${M}`, overflow: "hidden", boxShadow: `0 0 24px ${M}66` }}>
              <img src={authUser?.profilePic || "https://api.dicebear.com/7.x/avataaars/svg?seed=Cyber"} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="avatar" />
            </div>
            <div style={{ position: "absolute", bottom: 4, right: 4, width: 16, height: 16, borderRadius: "50%", border: `2px solid ${C}`, background: C, boxShadow: `0 0 8px ${C}` }} />
          </div>
          <div style={{ textAlign: "center" }}>
            <h2 style={{ fontSize: 18, fontWeight: 900, color: "#fff", fontFamily: "'Orbitron',monospace", letterSpacing: "0.1em", textShadow: `0 0 10px ${C}66` }}>
              {authUser?.username || "GHOST_USER"}
            </h2>
            <div style={{ fontSize: 10, color: C, fontFamily: "'Share Tech Mono'", marginTop: 4, letterSpacing: "0.15em" }}>SYNC RANK: ALPHA</div>
          </div>
          <div style={{ width: "100%", height: 1, background: `${M}33` }} />
          {[["NEXUS NODES", "1,337"], ["CONSTELLATIONS", "14"], ["UPTIME", "99.9%"]].map(([l, v]) => (
            <div key={l} style={{ width: "100%", display: "flex", justifyContent: "space-between", fontSize: 12, fontFamily: "'Rajdhani',monospace", color: "rgba(255,255,255,0.65)" }}>
              <span>{l}</span><span style={{ color: C, fontWeight: "bold" }}>{v}</span>
            </div>
          ))}
        </NeonCard>
        <NeonCard color={C} style={{ flex: 1, padding: 24 }}>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: C, fontFamily: "'Orbitron',monospace", marginBottom: 20, textShadow: `0 0 10px ${C}`, letterSpacing: "0.1em" }}>NODE RECORD</h2>
          <div style={{ fontSize: 14, color: "rgba(255,255,255,0.55)", fontFamily: "'Rajdhani',monospace", lineHeight: 1.7 }}>
            {authUser?.bio || "No mission logs recorded. Initialize your profile to begin transmitting."}
          </div>
          <button onClick={() => navigate("/")} style={{ marginTop: "auto", padding: "10px 20px", background: "transparent", border: `1px solid ${C}`, color: C, borderRadius: 6, cursor: "pointer", fontFamily: "'Orbitron', monospace", fontSize: 11 }}>BACK</button>
        </NeonCard>
      </div>
    </OrbitNeonCyberpunk>
  );
}

export function CyberpunkSpotify() {
  const { spotifyLinked, currentTrack, isPlaying, pausePlayback, playTrack } = useSpotifyStore();
  const [playing, setPlaying] = useState(isPlaying || false);
  const { play } = useSoundManager();
  useEffect(() => { setPlaying(isPlaying); }, [isPlaying]);

  return (
    <OrbitNeonCyberpunk>
      <div style={{ padding: 40, height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <NeonCard color={C} style={{ flex: 1, maxWidth: 600, padding: 40, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 28 }}>
          <h2 style={{ fontSize: 28, fontWeight: 900, color: C, fontFamily: "'Orbitron',monospace", textShadow: `0 0 20px ${C}88`, letterSpacing: "0.15em" }}>AUDIO SYNC</h2>
          {!spotifyLinked ? (
            <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
              <div style={{ fontSize: 15, color: "rgba(255,255,255,0.6)", fontFamily: "'Rajdhani',monospace", maxWidth: 400, lineHeight: 1.6 }}>
                Link your Spotify account to sync spatial audio across all active dimensions and orbit sessions.
              </div>
              <button
                onClick={async () => {
                  try {
                    await spotifyService.initiateLogin();
                  } catch (error) {
                    console.error("Failed to connect Spotify:", error);
                  }
                }}
                style={{ padding: "12px 28px", borderRadius: 6, background: `linear-gradient(90deg,${C},${P})`, color: "#000", border: "none", fontSize: 14, fontWeight: 900, fontFamily: "'Orbitron',monospace", letterSpacing: "0.1em", cursor: "pointer", boxShadow: `0 0 24px ${C}66` }}
              >
                INITIALIZE LINK
              </button>
            </div>
          ) : (
            <>
              <div style={{ width: 220, height: 220, borderRadius: 12, border: `2px solid ${C}`, overflow: "hidden", boxShadow: `0 0 40px ${C}55`, position: "relative" }}>
                <div style={{ position: "absolute", inset: 0, background: `linear-gradient(135deg,${C}22,transparent)` }} />
                {currentTrack ? <img src={currentTrack.imageUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="Album Art" /> : <OrbitalViz playing={playing} />}
              </div>
              <div style={{ textAlign: "center", minHeight: 56 }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#fff", fontFamily: "'Rajdhani',monospace", textShadow: `0 0 10px ${C}44` }}>{currentTrack ? currentTrack.name : "Awaiting Signal..."}</div>
                <div style={{ fontSize: 14, color: `${C}cc`, marginTop: 4, fontFamily: "'Share Tech Mono'" }}>{currentTrack ? currentTrack.artist : "Unknown Frequency"}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
                <button style={{ background: "none", border: "none", cursor: "pointer", color: `${C}88`, fontSize: 22, transition: "color 0.2s" }} onMouseEnter={e => e.currentTarget.style.color = C} onMouseLeave={e => e.currentTarget.style.color = `${C}88`}>⏮</button>
                <button onClick={() => playing ? pausePlayback() : playTrack()} style={{ width: 60, height: 60, borderRadius: "50%", background: `linear-gradient(135deg,${C},${P})`, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 22, boxShadow: `0 0 20px ${C}66`, transition: "transform 0.1s" }} onMouseEnter={e => e.currentTarget.style.transform = "scale(1.1)"} onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>
                  {playing ? "⏸" : "▶"}
                </button>
                <button style={{ background: "none", border: "none", cursor: "pointer", color: `${C}88`, fontSize: 22, transition: "color 0.2s" }} onMouseEnter={e => e.currentTarget.style.color = C} onMouseLeave={e => e.currentTarget.style.color = `${C}88`}>⏭</button>
              </div>
            </>
          )}
        </NeonCard>
      </div>
    </OrbitNeonCyberpunk>
  );
}
