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
  draftDisplayName, setDraftDisplayName,
  draftBio, setDraftBio,
  draftNotifications, setDraftNotifications,
  draftShowOnlineStatus, setDraftShowOnlineStatus,
  draftOrbitBehavior, setDraftOrbitBehavior,
  draftSoundSettings, setDraftSoundSettings,
  isDirty, handleSave, handleReset, authUser
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
                SYSTEM // CONFIGURATION
              </div>
              <h1 className="oa-shimmer-text oa-orbitron" style={{ fontSize: 32, fontWeight: 900, letterSpacing: 4, marginBottom: 6 }}>
                PREFERENCES
              </h1>
            </div>
          </div>

          {/* Action Bar */}
          <div style={{ display: "flex", gap: 12 }}>
            <button onClick={handleReset} disabled={!isDirty} style={{ padding: "8px 16px", background: "rgba(198,160,110,.05)", border: "1px solid rgba(198,160,110,.2)", color: isDirty ? "#C6A06E" : "rgba(198,160,110,.4)", borderRadius: 6, fontFamily: "Orbitron, sans-serif", fontSize: 10, letterSpacing: 1.5, cursor: isDirty ? "pointer" : "default" }}>
              RESET
            </button>
            <button onClick={handleSave} disabled={!isDirty} style={{ padding: "8px 16px", background: isDirty ? "rgba(78,205,196,.1)" : "rgba(78,205,196,.02)", border: isDirty ? "1px solid #4ECDC4" : "1px solid rgba(78,205,196,.2)", color: isDirty ? "#4ECDC4" : "rgba(78,205,196,.4)", borderRadius: 6, fontFamily: "Orbitron, sans-serif", fontSize: 10, letterSpacing: 1.5, cursor: isDirty ? "pointer" : "default", boxShadow: isDirty ? "0 0 10px rgba(78,205,196,.2)" : "none" }}>
              COMMIT CHANGES
            </button>
            <button onClick={useAuthStore.getState().logout} style={{ padding: "8px 16px", background: "rgba(255,85,85,.05)", border: "1px solid rgba(255,85,85,.3)", color: "#FF5555", borderRadius: 6, fontFamily: "Orbitron, sans-serif", fontSize: 10, letterSpacing: 1.5, cursor: "pointer" }}>
              LOGOUT
            </button>
          </div>
        </div>

        <div className="oa-settings-wrapper" style={{ display: "flex", gap: 30, alignItems: "flex-start", flexWrap: "wrap", position: "relative", zIndex: 5 }}>
          {/* Settings Nav */}
          <div className="oa-card oa-settings-nav" style={{ width: 220, padding: 12, flexShrink: 0 }}>
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
          <div className="oa-card oa-borderglow" style={{ flex: 1, minWidth: 280, padding: 30 }}>
            {activeSection === "profile" && (
              <div>
                <h3 className="oa-orbitron" style={{ fontSize: 16, color: "#E8C990", letterSpacing: 2, marginBottom: 20 }}>PUBLIC IDENTITY</h3>
                <div style={{ marginBottom: 20 }}>
                  <label className="oa-mono" style={{ fontSize: 11, color: "rgba(198,160,110,.6)", letterSpacing: 2, display: "block", marginBottom: 6 }}>DISPLAY ALIAS</label>
                  <input type="text" value={draftDisplayName} onChange={e => setDraftDisplayName(e.target.value)} style={{ width: "100%", background: "rgba(10,10,10,.6)", border: "1px solid rgba(198,160,110,.2)", padding: "14px 16px", color: "#E8C990", borderRadius: 8, outline: "none", fontSize: 15, fontFamily: "'Rajdhani', sans-serif" }} onFocus={e => e.target.style.borderColor = "#C6A06E"} onBlur={e => e.target.style.borderColor = "rgba(198,160,110,.2)"} />
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label className="oa-mono" style={{ fontSize: 11, color: "rgba(198,160,110,.6)", letterSpacing: 2, display: "block", marginBottom: 6 }}>PERSONAL BIO</label>
                  <textarea value={draftBio} onChange={e => setDraftBio(e.target.value)} style={{ width: "100%", height: 80, background: "rgba(10,10,10,.6)", border: "1px solid rgba(198,160,110,.2)", padding: "14px 16px", color: "#E8C990", borderRadius: 8, outline: "none", fontSize: 14, fontFamily: "'Rajdhani', sans-serif", resize: "none" }} onFocus={e => e.target.style.borderColor = "#C6A06E"} onBlur={e => e.target.style.borderColor = "rgba(198,160,110,.2)"} />
                </div>

                <ToggleRow label="BROADCAST PRESENCE" description="Allow other nodes to see your online status." checked={draftShowOnlineStatus} onChange={setDraftShowOnlineStatus} />

                <div style={{ marginTop: 24, padding: 16, background: "rgba(198,160,110,.03)", border: "1px solid rgba(198,160,110,.1)", borderRadius: 8 }}>
                  <div className="oa-orbitron" style={{ fontSize: 12, color: "#C6A06E", marginBottom: 12 }}>LIVE TRANSMISSION PREVIEW</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 44, height: 44, borderRadius: "20%", background: "rgba(78,205,196,.1)", border: "1px solid rgba(78,205,196,.4)", display: "flex", alignItems: "center", justifyContent: "center", color: "#4ECDC4", fontSize: 18, fontWeight: "bold" }}>
                      {(draftDisplayName || "O")[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="oa-orbitron" style={{ fontSize: 14, color: "#E8C990" }}>{draftDisplayName || "Unknown Object"}</div>
                      <div className="oa-mono" style={{ fontSize: 10, color: draftShowOnlineStatus ? "#00FF88" : "rgba(198,160,110,.5)" }}>{draftShowOnlineStatus ? "ONLINE" : "STEALTH MODE"}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === "sound" && (
              <div>
                <h3 className="oa-orbitron" style={{ fontSize: 16, color: "#E8C990", letterSpacing: 2, marginBottom: 20 }}>ACOUSTIC FEEDBACK</h3>
                <ToggleRow label="GLOBAL EFFECTS" description="Enable or disable all acoustic signals." checked={draftSoundSettings.effectsEnabled} onChange={v => { setDraftSoundSettings(p => ({ ...p, effectsEnabled: v })); try { useSettingsStore.getState().updateSetting('sound.enabled', v); } catch (_) {} }} />
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
                <h3 className="oa-orbitron" style={{ fontSize: 16, color: "#E8C990", letterSpacing: 2, marginBottom: 20 }}>VISUAL THEME</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 16 }}>
                  {THEMES.map(t => {
                    const isSelected = draftTheme === t;
                    
                    let previewPrimary = "#E8C990";
                    let previewBg = "#000000";
                    
                    if (t === "light") { previewPrimary = "#3b82f6"; previewBg = "#ffffff"; }
                    else if (t === "dark") { previewPrimary = "#ef4444"; previewBg = "#0a0a0a"; }
                    else if (t === "neon-cyberpunk") { previewPrimary = "#8b5cf6"; previewBg = "#0c0e14"; }
                    else if (t === "gamer-high-energy") { previewPrimary = "#ff2d78"; previewBg = "#080614"; }
                    else if (t === "pastel-dream") { previewPrimary = "#e060b0"; previewBg = "#ffd4ee"; }
                    else if (t === "amoled-dark") { previewPrimary = "#E8C990"; previewBg = "#000000"; }

                    return (
                      <div key={t} onClick={() => setDraftTheme(t)} style={{ padding: 16, borderRadius: 8, border: isSelected ? "1px solid #4ECDC4" : "1px solid rgba(198,160,110,.2)", background: isSelected ? "rgba(78,205,196,.05)" : "rgba(10,10,10,.6)", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 10, transition: "all .2s" }}>
                        <div style={{ width: "100%", height: 30, borderRadius: 4, background: previewBg, border: "1px solid rgba(198,160,110,.2)", display: "flex", overflow: "hidden" }}>
                          <div style={{ flex: 1, background: previewPrimary }} />
                          <div style={{ flex: 1, background: previewBg }} />
                        </div>
                        <span className="oa-mono" style={{ fontSize: 10, color: isSelected ? "#4ECDC4" : "rgba(198,160,110,.6)", letterSpacing: 1.5, textAlign: "center" }}>
                          {THEME_LABELS[t] || t.toUpperCase()}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {activeSection === "notifications" && (
              <div>
                <h3 className="oa-orbitron" style={{ fontSize: 16, color: "#E8C990", letterSpacing: 2, marginBottom: 20 }}>ALERT SYSTEMS</h3>
                <ToggleRow label="DESKTOP OVERLAYS" description="Show visual toast notifications on your HUD." checked={draftNotifications.desktop} onChange={v => { setDraftNotifications(p => ({ ...p, desktop: v })); try { useSettingsStore.getState().updateSetting('notifications.desktopEnabled', v); } catch (_) {} }} />
                <ToggleRow label="AUDIO CUES" description="Play auditory pings for incoming waves." checked={draftNotifications.sound} onChange={v => { setDraftNotifications(p => ({ ...p, sound: v })); try { useSettingsStore.getState().updateSetting('notifications.enabled', v); } catch (_) {} }} />
                <ToggleRow label="EMAIL DIGESTS" description="Periodic email summaries (if allowed by server)." checked={draftNotifications.email} onChange={v => setDraftNotifications(p => ({ ...p, email: v }))} />
              </div>
            )}

            {activeSection === "orbit" && (
              <div>
                <h3 className="oa-orbitron" style={{ fontSize: 16, color: "#E8C990", letterSpacing: 2, marginBottom: 20 }}>ENGINE KINEMATICS</h3>
                <ToggleRow label="RENDER RINGS" description="Draw background constellation orbits in 3D." checked={draftOrbitBehavior.showRings} onChange={v => setDraftOrbitBehavior(p => ({ ...p, showRings: v }))} />
                <ToggleRow label="MOMENTUM PAUSE" description="Halt background rendering while inspecting a node." checked={draftOrbitBehavior.autoPauseOnHover} onChange={v => setDraftOrbitBehavior(p => ({ ...p, autoPauseOnHover: v }))} />

                <div style={{ marginTop: 20 }}>
                  <label className="oa-mono" style={{ fontSize: 11, color: "rgba(198,160,110,.6)", letterSpacing: 2, display: "block", marginBottom: 6 }}>INTERACTION FILTER</label>
                  <select value={draftOrbitBehavior.interactionFilter} onChange={(e) => setDraftOrbitBehavior(p => ({ ...p, interactionFilter: e.target.value }))} style={{ width: "100%", background: "rgba(10,10,10,.8)", border: "1px solid rgba(198,160,110,.3)", color: "#E8C990", padding: "10px", outline: "none", fontFamily: "'Rajdhani', sans-serif", fontSize: 14 }}>
                    <option value="all">ALL NODES</option>
                    <option value="active">ACTIVE NODES ONLY</option>
                    <option value="mutual">MUTUAL ORBITS ONLY</option>
                  </select>
                </div>

                <div style={{ marginTop: 20 }}>
                  <label className="oa-mono" style={{ fontSize: 11, color: "rgba(198,160,110,.6)", letterSpacing: 2, display: "block", marginBottom: 6 }}>KINEMATIC THEME</label>
                  <select value={draftOrbitBehavior.theme} onChange={(e) => setDraftOrbitBehavior(p => ({ ...p, theme: e.target.value }))} style={{ width: "100%", background: "rgba(10,10,10,.8)", border: "1px solid rgba(198,160,110,.3)", color: "#E8C990", padding: "10px", outline: "none", fontFamily: "'Rajdhani', sans-serif", fontSize: 14 }}>
                    <option value="nebula">NEBULA</option>
                    <option value="aurora">AURORA</option>
                    <option value="cosmic">COSMIC</option>
                  </select>
                </div>
              </div>
            )}

            {activeSection === "security" && (
              <div>
                <h3 className="oa-orbitron" style={{ fontSize: 16, color: "#E8C990", letterSpacing: 2, marginBottom: 20 }}>SYSTEM SECURITY</h3>
                <p className="oa-raj" style={{ color: "rgba(198,160,110,.6)", fontSize: 15, lineHeight: 1.5 }}>
                  Password reset capabilities require cryptographic isolation and are executed through the standard application framework.
                </p>
                <button onClick={() => setDraftTheme("default")} style={{ marginTop: 20, padding: "10px 20px", background: "rgba(198,160,110,.1)", border: "1px solid rgba(198,160,110,.3)", color: "#C6A06E", borderRadius: 4, fontFamily: "Orbitron, sans-serif", fontSize: 11, letterSpacing: 1.5, cursor: "pointer" }}>
                  REVERT TO STANDARD ENGINE
                </button>
              </div>
            )}

          </div>
        </div>
      </div>
    </OrbitApp>
  );
}

export function AmoledProfile() {
  const navigate = useNavigate();
  const { authUser, isUpdatingProfile, updateProfile } = useAuthStore();
  const [profileDraft, setProfileDraft] = useState({
    username: "",
    email: "",
    bio: "",
    profilePic: "",
  });
  const [selectedImg, setSelectedImg] = useState(null);

  useEffect(() => {
    if (!authUser) return;
    setProfileDraft({
      username: authUser.username || "",
      email: authUser.email || "",
      bio: authUser.bio || "",
      profilePic: authUser.profilePic || "",
    });
  }, [authUser]);

  const hasChanges = useMemo(() => {
    if (!authUser) return false;
    return (
      profileDraft.username !== authUser.username ||
      profileDraft.email !== authUser.email ||
      profileDraft.bio !== (authUser.bio || "") ||
      selectedImg !== null
    );
  }, [profileDraft, authUser, selectedImg]);

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64Image = reader.result;
      setSelectedImg(base64Image);
      setProfileDraft((prev) => ({ ...prev, profilePic: base64Image }));
    };
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!profileDraft.username.trim() || !profileDraft.email.trim()) {
      toast.error("Username and email are required.");
      return;
    }

    try {
      const payload = {
        username: profileDraft.username.trim(),
        email: profileDraft.email.trim(),
        bio: profileDraft.bio,
      };
      if (selectedImg) payload.profilePic = selectedImg;

      await updateProfile(payload);
      setSelectedImg(null);
      toast.success("Profile updated successfully.");
    } catch (error) {
      toast.error("Profile update failed.");
    }
  };

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

        {/* Header */}
        <div style={{ marginBottom: 30 }}>
          <div className="oa-mono" style={{ fontSize: 10, color: "rgba(198,160,110,.65)", letterSpacing: 3, marginBottom: 8 }}>
            IDENTITY // OVERRIDE
          </div>
          <h1 className="oa-shimmer-text oa-orbitron" style={{ fontSize: 32, fontWeight: 900, letterSpacing: 4, marginBottom: 6 }}>
            USER PROFILE
          </h1>
        </div>

        <form onSubmit={handleSave}>
          <div className="oa-card oa-borderglow" style={{ padding: 30, display: "flex", flexDirection: "column", gap: 24 }}>
            <div className="oa-scan" />

            <div style={{ display: "flex", gap: 30, flexWrap: "wrap", alignItems: "flex-start" }}>
              {/* Avatar Section */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "center" }}>
                <div style={{ position: "relative", width: 120, height: 120, borderRadius: "50%", background: "linear-gradient(135deg,#3d1a00,#1a0a00)", border: "2px solid #C6A06E", boxShadow: "0 0 20px rgba(198,160,110,.3)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                  <img src={profileDraft.profilePic || "/avatar.png"} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  <label htmlFor="avatar-upload" style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 35, background: "rgba(0,0,0,.7)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", backdropFilter: "blur(4px)" }}>
                    <span className="oa-mono" style={{ fontSize: 10, color: "#C6A06E", letterSpacing: 1 }}>EDIT</span>
                    <input type="file" id="avatar-upload" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={isUpdatingProfile} />
                  </label>
                </div>
              </div>

              {/* Form Fields */}
              <div style={{ flex: 1, minWidth: 260, display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label className="oa-mono" style={{ fontSize: 11, color: "rgba(198,160,110,.6)", letterSpacing: 2, display: "block", marginBottom: 6 }}>DISPLAY NAME</label>
                  <input type="text" value={profileDraft.username} onChange={e => setProfileDraft(p => ({ ...p, username: e.target.value }))} style={{ width: "100%", background: "rgba(10,10,10,.6)", border: "1px solid rgba(198,160,110,.2)", padding: "12px 14px", color: "#E8C990", borderRadius: 6, outline: "none", fontSize: 14, fontFamily: "'Rajdhani', sans-serif" }} onFocus={e => e.target.style.borderColor = "#C6A06E"} onBlur={e => e.target.style.borderColor = "rgba(198,160,110,.2)"} />
                </div>
                <div>
                  <label className="oa-mono" style={{ fontSize: 11, color: "rgba(198,160,110,.6)", letterSpacing: 2, display: "block", marginBottom: 6 }}>EMAIL DIRECTIVE</label>
                  <input type="email" value={profileDraft.email} onChange={e => setProfileDraft(p => ({ ...p, email: e.target.value }))} style={{ width: "100%", background: "rgba(10,10,10,.6)", border: "1px solid rgba(198,160,110,.2)", padding: "12px 14px", color: "#E8C990", borderRadius: 6, outline: "none", fontSize: 14, fontFamily: "'Rajdhani', sans-serif" }} onFocus={e => e.target.style.borderColor = "#C6A06E"} onBlur={e => e.target.style.borderColor = "rgba(198,160,110,.2)"} />
                </div>
                <div>
                  <label className="oa-mono" style={{ fontSize: 11, color: "rgba(198,160,110,.6)", letterSpacing: 2, display: "block", marginBottom: 6 }}>BIOGRAPHY / LOG</label>
                  <textarea value={profileDraft.bio} onChange={e => setProfileDraft(p => ({ ...p, bio: e.target.value }))} rows={4} style={{ width: "100%", background: "rgba(10,10,10,.6)", border: "1px solid rgba(198,160,110,.2)", padding: "12px 14px", color: "#E8C990", borderRadius: 6, outline: "none", fontSize: 14, fontFamily: "'Rajdhani', sans-serif", resize: "none" }} onFocus={e => e.target.style.borderColor = "#C6A06E"} onBlur={e => e.target.style.borderColor = "rgba(198,160,110,.2)"} />
                </div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", borderTop: "1px solid rgba(198,160,110,.1)", paddingTop: 20 }}>
              <button type="submit" disabled={!hasChanges || isUpdatingProfile} style={{ padding: "10px 24px", background: hasChanges ? "linear-gradient(135deg,rgba(198,160,110,.2),rgba(198,160,110,.05))" : "rgba(198,160,110,.05)", border: hasChanges ? "1px solid #C6A06E" : "1px solid rgba(198,160,110,.2)", color: hasChanges ? "#E8C990" : "rgba(198,160,110,.4)", borderRadius: 6, cursor: hasChanges ? "pointer" : "default", fontFamily: "'Orbitron', sans-serif", fontSize: 11, letterSpacing: 2, transition: "all .3s", boxShadow: hasChanges ? "0 0 15px rgba(198,160,110,.2)" : "none" }}>
                {isUpdatingProfile ? "SAVING..." : "COMMIT CHANGES"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </OrbitApp>
  );
}

export function AmoledSpotify() {
  const { spotifyLinked, currentTrack, isPlaying, pausePlayback, playTrack, skipNext, skipPrevious } = useSpotifyStore();
  const [playing, setPlaying] = useState(isPlaying || false);
  useEffect(() => { setPlaying(isPlaying); }, [isPlaying]);

  return (
    <OrbitApp>
      <div style={{ maxWidth: 800, margin: "0 auto", paddingBottom: 40, height: "100%", display: "flex", flexDirection: "column" }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <button onClick={() => window.location.href = "/"} style={{ background: "transparent", color: "rgba(198,160,110,.6)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontFamily: "'Share Tech Mono', monospace", transition: "color 0.2s" }} onMouseEnter={e => e.currentTarget.style.color = "#C6A06E"} onMouseLeave={e => e.currentTarget.style.color = "rgba(198,160,110,.6)"}>
            ← RETURN TO ORBIT
          </button>
          <button onClick={useAuthStore.getState().logout} style={{ padding: "8px 16px", background: "rgba(255,85,85,.05)", border: "1px solid rgba(255,85,85,.3)", color: "#FF5555", borderRadius: 6, fontFamily: "Orbitron, sans-serif", fontSize: 10, letterSpacing: 1.5, cursor: "pointer" }}>
            LOGOUT
          </button>
        </div>

        {/* Header */}
        <div style={{ marginBottom: 30 }}>
          <div className="oa-mono" style={{ fontSize: 10, color: "rgba(198,160,110,.65)", letterSpacing: 3, marginBottom: 8 }}>
            AUDIO // OVERRIDE
          </div>
          <h1 className="oa-shimmer-text oa-orbitron" style={{ fontSize: 32, fontWeight: 900, letterSpacing: 4, marginBottom: 6 }}>
            SPOTIFY SYNC
          </h1>
        </div>

        <div className="oa-card oa-borderglow" style={{ flex: 1, padding: 30, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 24, textAlign: "center" }}>
          <div className="oa-scan" />
          
          {!spotifyLinked ? (
            <>
              <div style={{ position: "relative", width: 140, height: 140, borderRadius: "50%", background: "linear-gradient(135deg,#0a2a2a, #000)", border: "2px solid rgba(78,205,196,0.6)", boxShadow: "0 0 40px rgba(78,205,196,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, margin: "0 auto" }}>
                🎵
              </div>
              <div style={{ maxWidth: 400, margin: "0 auto" }}>
                <p style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 15, color: "rgba(198,160,110,0.5)", letterSpacing: 2, lineHeight: 1.7, marginBottom: 32, textTransform: "uppercase" }}>
                  Link your Spotify account to the orbital network. Sync music across the grid in real-time.
                </p>
                <button
                  onClick={async () => {
                    try {
                      await spotifyService.initiateLogin();
                    } catch (error) {
                      console.error("Failed to connect Spotify:", error);
                    }
                  }}
                  className="amoled-btn"
                  style={{
                    width: "100%", padding: "16px 24px",
                    background: "linear-gradient(135deg, rgba(78,205,196,0.15) 0%, rgba(78,205,196,0.05) 100%)",
                    border: "1px solid rgba(78,205,196,0.5)",
                    borderRadius: 12, cursor: "pointer",
                    fontFamily: "'Orbitron', sans-serif",
                    fontSize: 12, fontWeight: 900,
                    color: "#4ECDC4", letterSpacing: 3,
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
                    boxShadow: "0 0 30px rgba(78,205,196,0.15), inset 0 1px 0 rgba(78,205,196,0.1)",
                    transition: "all 0.3s",
                    textTransform: "uppercase",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = "linear-gradient(135deg, rgba(78,205,196,0.25) 0%, rgba(78,205,196,0.1) 100%)"; e.currentTarget.style.boxShadow = "0 0 50px rgba(78,205,196,0.3), inset 0 1px 0 rgba(78,205,196,0.2)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "linear-gradient(135deg, rgba(78,205,196,0.15) 0%, rgba(78,205,196,0.05) 100%)"; e.currentTarget.style.boxShadow = "0 0 30px rgba(78,205,196,0.15), inset 0 1px 0 rgba(78,205,196,0.1)"; }}
                >
                  <Music style={{ width: 16, height: 16 }} />
                  INITIATE LINK
                </button>
              </div>
            </>
          ) : (
            <>
              <div style={{ position: "relative", width: 280, height: 280, borderRadius: "50%", background: "linear-gradient(135deg,#121212, #000)", border: "2px solid rgba(78,205,196,0.4)", boxShadow: "0 0 40px rgba(78,205,196,0.15)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto", overflow: "hidden" }}>
                {currentTrack ? (
                  <img src={currentTrack.imageUrl} style={{ width: "100%", height: "100%", objectFit: "cover", filter: playing ? "none" : "grayscale(0.6)" }} alt="Album Art" />
                ) : (
                  <div style={{ fontSize: 60 }}>🎵</div>
                )}
                {playing && <div style={{ position: 'absolute', inset: -1, borderRadius: '50%', border: '1.5px solid #4ECDC4', animation: 'oa-twinkle 3s infinite', pointerEvents: 'none' }} />}
              </div>

              <div style={{ textAlign: "center", minHeight: 64 }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: "#fff", fontFamily: "'Orbitron',sans-serif", letterSpacing: '2px', textShadow: '0 0 10px rgba(78,205,196,0.3)' }}>{currentTrack ? currentTrack.name : "Awaiting Frequency..."}</div>
                <div style={{ fontSize: 16, color: "rgba(198,160,110,0.7)", marginTop: 8, fontFamily: "'Rajdhani', sans-serif" }}>{currentTrack ? currentTrack.artist : "Unknown Signal"}</div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 36, marginTop: 20 }}>
                <button onClick={skipPrevious} style={{ background: "none", border: "none", cursor: "pointer", color: "#4ECDC4", fontSize: 24, opacity: 0.6, transition: "opacity 0.2s" }} onMouseEnter={e => e.currentTarget.style.opacity = 1} onMouseLeave={e => e.currentTarget.style.opacity = 0.6}>⏮</button>
                <button onClick={() => playing ? pausePlayback() : playTrack()} style={{ width: 72, height: 72, borderRadius: "50%", background: "linear-gradient(135deg,#0a2a2a,rgba(78,205,196,0.2))", border: "2px solid #4ECDC4", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 24, boxShadow: "0 0 24px rgba(78,205,196,0.4)", transition: "transform 0.2s" }} onMouseEnter={e => e.currentTarget.style.transform = "scale(1.05)"} onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>
                  {playing ? "⏸" : "▶"}
                </button>
                <button onClick={skipNext} style={{ background: "none", border: "none", cursor: "pointer", color: "#4ECDC4", fontSize: 24, opacity: 0.6, transition: "opacity 0.2s" }} onMouseEnter={e => e.currentTarget.style.opacity = 1} onMouseLeave={e => e.currentTarget.style.opacity = 0.6}>⏭</button>
              </div>
            </>
          )}
        </div>
      </div>
    </OrbitApp>
  );
}
