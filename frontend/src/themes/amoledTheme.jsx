import { useState, useEffect, memo, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Music } from "lucide-react";

import { useAuthStore } from "../store/useAuthStore";
import { useSpotifyStore } from "../store/useSpotifyStore";
import { useSettingsStore } from "../store/useSettingsStore";
import { spotifyService } from "../services/spotifyService";
import { THEMES, THEME_LABELS } from "../constants";
import toast from "../lib/toast";

import AmoledThemeLayout from "../components/layout/themes/amoled/AmoledThemeLayout";
import ReusableSpotifyPlayer from "../components/spotify/ReusableSpotifyPlayer";
import "./styles/amoled.css";

/* ─────────────────────────────────────────────
   INTERNAL COMPONENTS
───────────────────────────────────────────── */

const ToggleRow = ({ label, description, checked, onChange }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px", background: "rgba(198,160,110,.03)", border: "1px solid rgba(198,160,110,.08)", borderRadius: 8, marginBottom: 12 }}>
    <div style={{ flex: 1, paddingRight: 16 }}>
      <div className="oa-orbitron" style={{ fontSize: 11, color: "#C6A06E", letterSpacing: 1.5, marginBottom: 4 }}>{label}</div>
      <div className="oa-raj" style={{ fontSize: 12, color: "rgba(198,160,110,.5)" }}>{description}</div>
    </div>
    <div
      onClick={() => onChange(!checked)}
      style={{ width: 44, height: 22, borderRadius: 11, background: checked ? "#C6A06E" : "rgba(0,0,0,.6)", border: "1px solid rgba(198,160,110,.3)", position: "relative", cursor: "pointer", transition: "all .3s" }}
    >
      <div style={{ width: 16, height: 16, borderRadius: "50%", background: checked ? "#000" : "rgba(198,160,110,.4)", position: "absolute", top: 2, left: checked ? 24 : 3, transition: "all .3s" }} />
    </div>
  </div>
);

export default function OrbitApp({ children }) {
  return <AmoledThemeLayout children={children} />;
}

export function AmoledSettings({
  activeSection, setActiveSection,
  draftTheme, setDraftTheme,
  draftSoundSettings, setDraftSoundSettings,
  isDirty, handleSave, handleReset
}) {
  const navigate = useNavigate();

  return (
    <OrbitApp>
      <div style={{ maxWidth: 1000, margin: "0 auto", paddingBottom: 40 }}>
        <button onClick={() => navigate("/")} style={{ marginBottom: 20, background: "transparent", color: "rgba(198,160,110,.6)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontFamily: "'Share Tech Mono', monospace", transition: "color 0.2s" }} onMouseEnter={e => e.currentTarget.style.color = "#C6A06E"} onMouseLeave={e => e.currentTarget.style.color = "rgba(198,160,110,.6)"}>
          ← RETURN TO ORBIT
        </button>

        {/* Header */}
        <div style={{ marginBottom: 30, display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button onClick={() => navigate("/")} style={{ background: "transparent", border: "1px solid rgba(198,160,110,.4)", color: "#C6A06E", width: 44, height: 44, borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, transition: "all 0.3s" }} onMouseEnter={e => { e.currentTarget.style.background = "rgba(198,160,110,.1)"; e.currentTarget.style.borderColor = "#C6A06E"; }} onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "rgba(198,160,110,.4)"; }}>
              ◀
            </button>
            <div>
              <div className="oa-mono" style={{ fontSize: 10, color: "rgba(198,160,110,.65)", letterSpacing: 3, marginBottom: 8 }}>
                ⚙ SYSTEM PREFERENCES
              </div>
              <h1 className="oa-orbitron" style={{ fontSize: 26, color: "#C6A06E", letterSpacing: 2, margin: 0 }}>ATELIER</h1>
            </div>
          </div>
        </div>

        {/* Main Settings Layout */}
        <div style={{ display: "flex", gap: 20, minHeight: "calc(100vh - 200px)" }}>
          {/* Settings Nav */}
          <div style={{ width: 220, padding: 12, flexShrink: 0, background: "rgba(15,15,15,.88)", backdropFilter: "blur(22px)", border: "1px solid rgba(198,160,110,.2)", borderRadius: 12, display: "flex", flexDirection: "column", gap: 2 }}>
            {[
              { id: "profile", label: "IDENTITY", icon: "❖" },
              { id: "sound", label: "ACOUSTICS", icon: "🔊" },
              { id: "appearance", label: "APPEARANCE", icon: "✨" },
              { id: "notifications", label: "NOTIFICATIONS", icon: "🔔" },
              { id: "orbit", label: "ORBIT ENGINE", icon: "🪐" },
              { id: "security", label: "SECURITY", icon: "🔒" }
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveSection(tab.id)} style={{ width: "100%", textAlign: "left", padding: "12px 14px", background: activeSection === tab.id ? "rgba(198,160,110,.1)" : "transparent", border: "none", borderLeft: activeSection === tab.id ? "2px solid #C6A06E" : "2px solid transparent", color: activeSection === tab.id ? "#C6A06E" : "rgba(198,160,110,.6)", fontFamily: "'Orbitron', sans-serif", fontSize: 11, letterSpacing: 1.5, cursor: "pointer", transition: "all .2s", display: "flex", alignItems: "center", gap: 10, marginBottom: 2 }}>
                <span>{tab.icon}</span> {tab.label}
              </button>
            ))}
          </div>

          {/* Settings Content */}
          <div style={{ flex: 1 }}>
            {activeSection === "sound" && (
              <div>
                <h2 className="oa-orbitron" style={{ fontSize: 18, color: "#C6A06E", letterSpacing: 2, marginBottom: 20 }}>AUDIO SETTINGS</h2>
                <ToggleRow label="TRANSMISSION SOUNDS" description="Auditory ping when a direct message is received." checked={draftSoundSettings.messageSound} onChange={v => { setDraftSoundSettings(p => ({ ...p, messageSound: v })); try { useSettingsStore.getState().updateSetting('sound.notificationEnabled', v); } catch (_) {} }} />
                <ToggleRow label="HAPTIC CLICKS" description="Subtle acoustic clicks on UI interactions." checked={draftSoundSettings.clickSound} onChange={v => { setDraftSoundSettings(p => ({ ...p, clickSound: v })); try { useSettingsStore.getState().updateSetting('sound.clickEnabled', v); } catch (_) {} }} />

                <div style={{ marginTop: 20 }}>
                  <label className="oa-mono" style={{ fontSize: 11, color: "rgba(198,160,110,.6)", letterSpacing: 2, display: "block", marginBottom: 10 }}>MASTER GAIN {(draftSoundSettings.volume * 100).toFixed(0)}%</label>
                  <input type="range" min="0" max="1" step="0.05" value={draftSoundSettings.volume} onChange={(e) => { const v = parseFloat(e.target.value); setDraftSoundSettings(p => ({ ...p, volume: v })); try { useSettingsStore.getState().updateSetting('sound.volume', v); } catch (_) {} }} style={{ width: "100%", accentColor: "#C6A06E" }} />
                </div>
              </div>
            )}

            {activeSection === "appearance" && (
              <div>
                <h2 className="oa-orbitron" style={{ fontSize: 18, color: "#C6A06E", letterSpacing: 2, marginBottom: 20 }}>THEME SELECTION</h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
                  {THEMES.map(t => {
                    const isSelected = draftTheme === t;

                    let previewPrimary = "#E8C990";
                    let previewBg = "#000000";

                    if (t === "light") { previewPrimary = "#3b82f6"; previewBg = "#ffffff"; }
                    else if (t === "pastel") { previewPrimary = "#ff69b4"; previewBg = "#fff0f5"; }
                    else if (t === "dark") { previewPrimary = "#00ff88"; previewBg = "#111"; }
                    else if (t === "cyberpunk") { previewPrimary = "#00fff5"; previewBg = "#050010"; }
                    else if (t === "gamer") { previewPrimary = "#ff00ff"; previewBg = "#0a0e27"; }
                    else if (t === "vampire") { previewPrimary = "#dc143c"; previewBg = "#1a0a1a"; }

                    return (
                      <div key={t} onClick={() => setDraftTheme(t)} style={{ padding: 16, borderRadius: 8, border: isSelected ? "1px solid #4ECDC4" : "1px solid rgba(198,160,110,.2)", background: isSelected ? "rgba(78,205,196,.05)" : "rgba(10,10,10,.6)", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 10, transition: "all .2s" }}>
                        <div style={{ width: "100%", height: 30, borderRadius: 4, background: previewBg, border: "1px solid rgba(198,160,110,.2)", display: "flex", overflow: "hidden" }}>
                          <div style={{ flex: 1, background: previewPrimary }} />
                          <div style={{ flex: 1, background: previewBg }} />
                        </div>
                        <div style={{ textAlign: "center" }}>
                          <div style={{ fontSize: 10, color: isSelected ? "#4ECDC4" : "rgba(198,160,110,.6)", fontFamily: "'Orbitron', monospace", letterSpacing: 1 }}>{THEME_LABELS[t] || t.toUpperCase()}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ marginTop: 30, display: "flex", gap: 12, justifyContent: "flex-end" }}>
          <button onClick={handleReset} disabled={!isDirty} style={{ padding: "12px 24px", background: "rgba(198,160,110,.1)", border: "1px solid rgba(198,160,110,.3)", color: isDirty ? "#C6A06E" : "rgba(198,160,110,.4)", borderRadius: 6, fontFamily: "'Orbitron', sans-serif", fontSize: 11, letterSpacing: 1.5, cursor: isDirty ? "pointer" : "default" }}>
            RESET
          </button>
          <button onClick={handleSave} disabled={!isDirty} style={{ padding: "12px 24px", background: isDirty ? "#C6A06E" : "rgba(198,160,110,.1)", border: "1px solid rgba(198,160,110,.3)", color: isDirty ? "#000" : "rgba(198,160,110,.4)", borderRadius: 6, fontFamily: "'Orbitron', sans-serif", fontSize: 11, letterSpacing: 1.5, fontWeight: 900, cursor: isDirty ? "pointer" : "default" }}>
            SAVE CHANGES
          </button>
        </div>
      </div>
    </OrbitApp>
  );
}

export function AmoledProfile() {
  const navigate = useNavigate();
  const authUser = useAuthStore(s => s.authUser);

  return (
    <OrbitApp>
      <div style={{ maxWidth: 800, margin: "0 auto", paddingBottom: 40 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <button onClick={() => navigate("/")} style={{ background: "transparent", color: "rgba(198,160,110,.6)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontFamily: "'Share Tech Mono', monospace", transition: "color 0.2s" }} onMouseEnter={e => e.currentTarget.style.color = "#C6A06E"} onMouseLeave={e => e.currentTarget.style.color = "rgba(198,160,110,.6)"}>
            ← RETURN TO ORBIT
          </button>
          <button onClick={useAuthStore.getState().logout} style={{ padding: "8px 16px", background: "rgba(255,85,85,.05)", border: "1px solid rgba(255,85,85,.3)", color: "#FF5555", borderRadius: 6, fontFamily: "Orbitron, sans-serif", fontSize: 10, letterSpacing: 1.5, cursor: "pointer" }}>
            LOGOUT
          </button>
        </div>

        <div style={{ background: "rgba(15,15,15,.88)", backdropFilter: "blur(22px)", border: "1px solid rgba(198,160,110,.2)", borderRadius: 12, padding: 40, textAlign: "center" }}>
          <div style={{ width: 100, height: 100, borderRadius: "50%", background: "linear-gradient(135deg, #C6A06E, #4ECDC4)", margin: "0 auto 24px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40 }}>
            {authUser?.username?.charAt(0).toUpperCase() || "U"}
          </div>

          <h1 className="oa-orbitron" style={{ fontSize: 24, color: "#C6A06E", letterSpacing: 2, marginBottom: 8 }}>
            {authUser?.username || "USER_UNKNOWN"}
          </h1>

          <p className="oa-mono" style={{ fontSize: 12, color: "rgba(198,160,110,.5)", marginBottom: 24 }}>
            {authUser?.email || "no-email@orbit.local"}
          </p>

          <div style={{ fontSize: 14, color: "rgba(198,160,110,.55)", fontFamily: "'Rajdhani',monospace", lineHeight: 1.7 }}>
            {authUser?.bio || "No mission logs recorded. Initialize your profile to begin transmitting."}
          </div>
        </div>
      </div>
    </OrbitApp>
  );
}

export function AmoledSpotify() {
  const navigate = useNavigate();

  return (
    <OrbitApp>
      <div style={{ maxWidth: 600, margin: "0 auto", paddingBottom: 40, height: "100%", display: "flex", flexDirection: "column" }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <button onClick={() => window.location.href = "/"} style={{ background: "transparent", color: "rgba(198,160,110,.6)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontFamily: "'Share Tech Mono', monospace", transition: "color 0.2s" }} onMouseEnter={e => e.currentTarget.style.color = "#C6A06E"} onMouseLeave={e => e.currentTarget.style.color = "rgba(198,160,110,.6)"}>
            ← RETURN TO ORBIT
          </button>
          <button onClick={useAuthStore.getState().logout} style={{ padding: "8px 16px", background: "rgba(255,85,85,.05)", border: "1px solid rgba(255,85,85,.3)", color: "#FF5555", borderRadius: 6, fontFamily: "Orbitron, sans-serif", fontSize: 10, letterSpacing: 1.5, cursor: "pointer" }}>
            LOGOUT
          </button>
        </div>

        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <ReusableSpotifyPlayer theme="amoled" className="oa-card oa-bracket oa-borderglow" />
        </div>
      </div>
    </OrbitApp>
  );
}
