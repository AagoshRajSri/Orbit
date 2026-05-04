import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell, Palette, User as UserIcon, Shield, Compass, Music, Activity, LogOut
} from "lucide-react";
import toast from "../lib/toast";
import { useAuthStore } from "../store/useAuthStore";
import { useThemeStore } from "../store/useThemeStore";
import { useSettingsStore } from "../store/useSettingsStore";
import { axiosInstance } from "../lib/axios.jsx";
import { useBreakpoint, isMobileOrTablet } from "../lib/useBreakpoint";
import { BottomNav, OrbitDrawer } from "../components/layout/BottomNav";
import AnimationSettingsPanel from "../components/effects/AnimationSettingsPanel";

const STORAGE_KEYS = {
  displayName: "orbit_displayName_v1",
  notifications: "orbit_notifications_v1",
  showOnlineStatus: "orbit_showOnlineStatus_v1",
  orbitBehavior: "orbit_orbitBehavior_v1",
  soundSettings: "orbit_soundSettings_v1",
};

const DEFAULT_ORBIT_BEHAVIOR = {
  showRings: true, autoPauseOnHover: true, interactionFilter: "all", theme: "nebula",
};

const DEFAULT_SOUND_SETTINGS = {
  volume: 0.7, effectsEnabled: true, clickSound: true, messageSound: true,
};

const DEFAULT_NOTIFICATIONS = { desktop: true, sound: true, email: false };

const CSS = `
  .settings-root {
    display: flex; flex-direction: column; min-height: 100dvh;
    background: var(--bg); color: var(--text); font-family: var(--font-body);
  }
  .settings-topnav {
    display: flex; align-items: center; justify-content: space-between;
    padding: 10px 24px; background: var(--topbar-bg, rgba(5,5,8,0.95));
    backdrop-filter: blur(20px); border-bottom: 1px solid var(--border);
    position: sticky; top: 0; z-index: 20;
  }
  .settings-topnav-left { display: flex; align-items: center; gap: 14px; }
  .settings-back {
    display: flex; align-items: center; gap: 6px; font-family: var(--font); font-size: 11px;
    letter-spacing: 1.5px; text-transform: uppercase; color: var(--text2);
    padding: 7px 12px; border-radius: 6px; border: 1px solid var(--border); cursor: pointer; transition: all 0.2s;
  }
  .settings-back:hover { color: var(--acc); border-color: var(--acc); }
  .settings-title { font-family: var(--font); font-size: 16px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; color: var(--text); }
  
  .settings-topnav-right { display: flex; gap: 10px; }
  .settings-btn {
    font-family: var(--font); font-size: 10px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase;
    padding: 8px 14px; border-radius: 8px; cursor: pointer; transition: all 0.2s; border: 1px solid transparent;
  }
  .settings-btn-ghost { color: var(--text2); background: transparent; border-color: var(--border); }
  .settings-btn-ghost:hover { border-color: var(--acc); color: var(--acc); }
  .settings-btn-primary { background: var(--acc2); color: white; border-color: var(--acc); box-shadow: var(--shadow-acc); }
  .settings-btn-primary:hover:not(:disabled) { background: var(--acc); transform: translateY(-2px); }
  .settings-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; box-shadow: none; }

  .settings-body { display: flex; flex: 1; position: relative; min-height: 0; }
  .settings-sidebar {
    width: 260px; flex-shrink: 0; background: var(--surface); padding: 24px 16px;
    display: flex; flex-direction: column; gap: 6px; border-right: 1px solid var(--border);
    overflow-y: auto;
  }
  .settings-nav-item {
    display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-radius: 12px;
    font-family: var(--font); font-size: 12px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase;
    cursor: pointer; transition: all 0.2s; color: var(--text2); border: 1px solid transparent;
  }
  .settings-nav-item:hover { background: rgba(139,0,0,0.05); color: var(--text); }
  .settings-nav-item.active { background: var(--input-bg); color: var(--acc); border-color: var(--border); box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
  .settings-nav-icon { display: flex; align-items: center; justify-content: center; }

  .settings-content {
    flex: 1; padding: 40px 60px; overflow-y: auto; -webkit-overflow-scrolling: touch;
    animation: orbit-fade-up .25s ease both;
  }
  .settings-content-title { font-family: var(--font); font-size: 24px; font-weight: 800; color: var(--text); margin-bottom: 32px; letter-spacing: 2px; text-transform: uppercase; }
  .settings-section { display: flex; flex-direction: column; gap: 24px; max-width: 600px; }
  .settings-field { display: flex; flex-direction: column; gap: 8px; }
  .settings-label { font-family: var(--font); font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: var(--text2); }
  .settings-input, .settings-select {
    width: 100%; border-radius: 10px; border: 1px solid var(--border); padding: 12px 16px;
    background: var(--input-bg); font-family: var(--font-body); font-size: 15px; color: var(--text);
    transition: all 0.2s; outline: none;
  }
  .settings-input:focus, .settings-select:focus { border-color: var(--acc); box-shadow: 0 0 12px var(--acc-glow); }
  
  .settings-toggle-row {
    display: flex; align-items: flex-start; justify-content: space-between; gap: 16px;
    padding: 16px 0; border-bottom: 1px solid var(--border-soft);
  }
  .settings-toggle-info { flex: 1; }
  .settings-toggle-title { font-family: var(--font-body); font-size: 15px; font-weight: 600; color: var(--text); margin-bottom: 4px; }
  .settings-toggle-desc { font-size: 13px; color: var(--text3); font-style: italic; }
  
  /* Custom Toggle Switch */
  .orb-switch { position: relative; display: inline-block; width: 44px; height: 24px; flex-shrink: 0; }
  .orb-switch input { opacity: 0; width: 0; height: 0; }
  .orb-slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: var(--surface2); transition: .3s; border-radius: 24px; border: 1px solid var(--border); }
  .orb-slider:before { position: absolute; content: ""; height: 16px; width: 16px; left: 3px; bottom: 3px; background-color: var(--text2); transition: .3s; border-radius: 50%; }
  input:checked + .orb-slider { background-color: var(--acc2); border-color: var(--acc); box-shadow: 0 0 10px var(--acc-glow); }
  input:checked + .orb-slider:before { transform: translateX(20px); background-color: white; }
  input:disabled + .orb-slider { opacity: 0.5; cursor: not-allowed; }

  @media (max-width: 768px) {
    .settings-sidebar { display: none; } /* Hidden, replaced by Drawer */
    .settings-content { padding: 24px 20px; }
    .settings-topnav-hamburger { display: flex; }
  }
  @media (max-width: 480px) {
    .settings-topnav { padding: 10px 14px; }
    .settings-btn-ghost { display: none; }
    .settings-content { padding: 20px 16px 100px; }
    .settings-title { font-size: 14px; }
  }
`;

const ToggleRow = ({ label, description, checked, onChange, disabled }) => (
  <label className="settings-toggle-row" style={{ cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1 }}>
    <div className="settings-toggle-info">
      <div className="settings-toggle-title">{label}</div>
      {description && <div className="settings-toggle-desc">{description}</div>}
    </div>
    <div className="orb-switch">
      <input type="checkbox" checked={checked} onChange={(e) => !disabled && onChange(e.target.checked)} disabled={disabled} />
      <span className="orb-slider"></span>
    </div>
  </label>
);

export default function SettingsPage() {
  const navigate = useNavigate();
  const bp = useBreakpoint();
  const mobile = isMobileOrTablet(bp);
  const { authUser } = useAuthStore();
  const { theme: currentTheme, setTheme } = useThemeStore();

  const navItems = [
    { key: "profile", label: "Profile", icon: UserIcon },
    { key: "sound", label: "Sound", icon: Music },
    { key: "notifications", label: "Notifications", icon: Bell },
    { key: "appearance", label: "Appearance", icon: Palette },
    { key: "animations", label: "Animations", icon: Activity },
    { key: "orbit", label: "Orbit Behavior", icon: Compass },
    { key: "security", label: "Security", icon: Shield },
  ];

  const [activeSection, setActiveSection] = useState("profile");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Draft vs saved state
  const [savedDisplayName, setSavedDisplayName] = useState("");
  const [draftDisplayName, setDraftDisplayName] = useState("");
  const [savedBio, setSavedBio] = useState("");
  const [draftBio, setDraftBio] = useState("");
  const [savedTheme, setSavedTheme] = useState(currentTheme);
  const [draftTheme, setDraftTheme] = useState(currentTheme);
  const [savedNotifications, setSavedNotifications] = useState(DEFAULT_NOTIFICATIONS);
  const [draftNotifications, setDraftNotifications] = useState(DEFAULT_NOTIFICATIONS);
  const [savedShowOnlineStatus, setSavedShowOnlineStatus] = useState(true);
  const [draftShowOnlineStatus, setDraftShowOnlineStatus] = useState(true);
  const [savedOrbitBehavior, setSavedOrbitBehavior] = useState(DEFAULT_ORBIT_BEHAVIOR);
  const [draftOrbitBehavior, setDraftOrbitBehavior] = useState(DEFAULT_ORBIT_BEHAVIOR);
  const [savedSoundSettings, setSavedSoundSettings] = useState(DEFAULT_SOUND_SETTINGS);
  const [draftSoundSettings, setDraftSoundSettings] = useState(DEFAULT_SOUND_SETTINGS);

  const didInitRef = useRef(false);

  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;
    const safeReadJson = (key, fallback) => {
      try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch { return fallback; }
    };
    
    const storedNameRaw = localStorage.getItem(STORAGE_KEYS.displayName);
    let resolvedName = authUser?.username || "";
    if (storedNameRaw) { try { resolvedName = JSON.parse(storedNameRaw); } catch { resolvedName = storedNameRaw; } }

    setSavedDisplayName(resolvedName); setDraftDisplayName(resolvedName);
    setSavedBio(authUser?.bio || ""); setDraftBio(authUser?.bio || "");

    const storedNotifs = safeReadJson(STORAGE_KEYS.notifications, DEFAULT_NOTIFICATIONS);
    setSavedNotifications(storedNotifs); setDraftNotifications(storedNotifs);

    const storedShowOnline = safeReadJson(STORAGE_KEYS.showOnlineStatus, true);
    setSavedShowOnlineStatus(storedShowOnline); setDraftShowOnlineStatus(storedShowOnline);

    const storedOrbitBehavior = safeReadJson(STORAGE_KEYS.orbitBehavior, DEFAULT_ORBIT_BEHAVIOR);
    setSavedOrbitBehavior(storedOrbitBehavior); setDraftOrbitBehavior(storedOrbitBehavior);

    const storedSoundSettings = safeReadJson(STORAGE_KEYS.soundSettings, DEFAULT_SOUND_SETTINGS);
    setSavedSoundSettings(storedSoundSettings); setDraftSoundSettings(storedSoundSettings);

    setSavedTheme(currentTheme); setDraftTheme(currentTheme);
  }, [currentTheme, authUser]);

  const isDirty = useMemo(() => {
    return (
      draftDisplayName !== savedDisplayName || draftBio !== savedBio || draftTheme !== savedTheme ||
      draftNotifications.desktop !== savedNotifications.desktop || draftNotifications.sound !== savedNotifications.sound ||
      draftNotifications.email !== savedNotifications.email || draftShowOnlineStatus !== savedShowOnlineStatus ||
      draftOrbitBehavior.showRings !== savedOrbitBehavior.showRings || draftOrbitBehavior.autoPauseOnHover !== savedOrbitBehavior.autoPauseOnHover ||
      draftOrbitBehavior.interactionFilter !== savedOrbitBehavior.interactionFilter || draftOrbitBehavior.theme !== savedOrbitBehavior.theme ||
      draftSoundSettings.volume !== savedSoundSettings.volume || draftSoundSettings.effectsEnabled !== savedSoundSettings.effectsEnabled ||
      draftSoundSettings.clickSound !== savedSoundSettings.clickSound || draftSoundSettings.messageSound !== savedSoundSettings.messageSound
    );
  }, [draftDisplayName, savedDisplayName, draftTheme, savedTheme, draftNotifications, savedNotifications, draftShowOnlineStatus, savedShowOnlineStatus, draftSoundSettings, savedSoundSettings, draftOrbitBehavior, savedOrbitBehavior, draftBio, savedBio]);

  const handleReset = () => {
    setDraftDisplayName(savedDisplayName); setDraftBio(savedBio); setDraftTheme(savedTheme);
    setDraftNotifications(savedNotifications); setDraftShowOnlineStatus(savedShowOnlineStatus);
    setDraftOrbitBehavior(savedOrbitBehavior); setDraftSoundSettings(savedSoundSettings);
    toast.success("Changes reset");
  };

  const handleSave = async () => {
    try {
      if ((draftDisplayName !== authUser?.username && draftDisplayName.trim()) || draftBio !== authUser?.bio) {
        await axiosInstance.put("/auth/update-profile", { username: draftDisplayName.trim(), bio: draftBio });
        useAuthStore.setState((state) => ({ authUser: { ...state.authUser, username: draftDisplayName.trim(), bio: draftBio } }));
      }
      localStorage.setItem(STORAGE_KEYS.displayName, JSON.stringify(draftDisplayName));
      localStorage.setItem(STORAGE_KEYS.notifications, JSON.stringify(draftNotifications));
      localStorage.setItem(STORAGE_KEYS.showOnlineStatus, JSON.stringify(draftShowOnlineStatus));
      localStorage.setItem(STORAGE_KEYS.orbitBehavior, JSON.stringify(draftOrbitBehavior));
      localStorage.setItem(STORAGE_KEYS.soundSettings, JSON.stringify(draftSoundSettings));
      
      setSavedDisplayName(draftDisplayName); setSavedBio(draftBio); setSavedNotifications(draftNotifications);
      setSavedShowOnlineStatus(draftShowOnlineStatus); setSavedOrbitBehavior(draftOrbitBehavior);
      setSavedTheme(draftTheme); setSavedSoundSettings(draftSoundSettings);

      useSettingsStore.getState().updateSettings({
        "sound.volume": draftSoundSettings.volume ?? 0.7,
        "sound.effectsEnabled": draftSoundSettings.effectsEnabled ?? true,
        "sound.clickEnabled": draftSoundSettings.clickSound ?? true,
        "sound.notificationEnabled": draftSoundSettings.messageSound ?? true,
        "notifications.desktopEnabled": draftNotifications.desktop ?? true,
        "notifications.soundEnabled": draftNotifications.sound ?? true,
        "orbit.showRings": draftOrbitBehavior.showRings ?? true,
        "orbit.autoPauseOnHover": draftOrbitBehavior.autoPauseOnHover ?? true,
      });

      setTheme(draftTheme);
      toast.success("Settings saved");
    } catch (e) {
      toast.error("Could not save settings");
    }
  };

  const activeLabel = navItems.find((n) => n.key === activeSection)?.label;

  const renderContent = () => {
    switch (activeSection) {
      case "profile":
        return (
          <div className="settings-section">
            <div className="settings-field">
              <label className="settings-label">Display Name</label>
              <input className="settings-input" value={draftDisplayName} onChange={(e) => setDraftDisplayName(e.target.value)} />
            </div>
            <div className="settings-field">
              <label className="settings-label">Encrypted Bio</label>
              <input className="settings-input" value={draftBio} onChange={(e) => setDraftBio(e.target.value)} />
            </div>
            <ToggleRow label="Show Online Status" description="Let others in the Orbit see when you are active" checked={draftShowOnlineStatus} onChange={setDraftShowOnlineStatus} />
          </div>
        );
      case "sound":
        return (
          <div className="settings-section">
            <ToggleRow label="Enable Audio Effects" description="Master switch for all UI sounds" checked={draftSoundSettings.effectsEnabled} onChange={(v) => setDraftSoundSettings((prev) => ({ ...prev, effectsEnabled: v }))} />
            <ToggleRow label="Interface Clicks" description="Play acoustic feedback on interactions" checked={draftSoundSettings.clickSound} onChange={(v) => setDraftSoundSettings((prev) => ({ ...prev, clickSound: v }))} disabled={!draftSoundSettings.effectsEnabled} />
            <ToggleRow label="Message Alerts" description="Play sounds for incoming transmissions" checked={draftSoundSettings.messageSound} onChange={(v) => setDraftSoundSettings((prev) => ({ ...prev, messageSound: v }))} disabled={!draftSoundSettings.effectsEnabled} />
            <div className="settings-field" style={{ opacity: draftSoundSettings.effectsEnabled ? 1 : 0.5 }}>
              <label className="settings-label">Master Volume</label>
              <input type="range" min="0" max="1" step="0.1" value={draftSoundSettings.volume} onChange={(e) => setDraftSoundSettings((prev) => ({ ...prev, volume: parseFloat(e.target.value) }))} disabled={!draftSoundSettings.effectsEnabled} className="range range-xs range-primary" />
            </div>
          </div>
        );
      case "notifications":
        return (
          <div className="settings-section">
            <ToggleRow label="System Notifications" description="Show alerts when Orbit is backgrounded" checked={draftNotifications.desktop} onChange={(v) => setDraftNotifications((prev) => ({ ...prev, desktop: v }))} />
            <ToggleRow label="Notification Sounds" description="Play a sound when an alert appears" checked={draftNotifications.sound} onChange={(v) => setDraftNotifications((prev) => ({ ...prev, sound: v }))} />
            <ToggleRow label="Email Summaries" description="Receive offline activity reports" checked={draftNotifications.email} onChange={(v) => setDraftNotifications((prev) => ({ ...prev, email: v }))} />
          </div>
        );
      case "appearance":
        return (
          <div className="settings-section">
            <div className="settings-field">
              <label className="settings-label">Visual Theme</label>
              <select className="settings-select" value={draftTheme} onChange={(e) => setDraftTheme(e.target.value)}>
                <option value="dark">Vampire (Default)</option>
                <option value="pastel-dream">Pastel Dream</option>
                <option value="amoled-dark">Amoled Dark</option>
                <option value="neon-cyberpunk">Neon Cyberpunk</option>
                <option value="gamer-high-energy">High Energy</option>
                <option value="light">Light</option>
              </select>
            </div>
            <p className="settings-toggle-desc" style={{ marginTop: 8 }}>Select the atmospheric theme of your terminal. Changes will be saved globally.</p>
          </div>
        );
      case "animations":
        return (
          <div className="settings-section">
            <AnimationSettingsPanel />
          </div>
        );
      case "orbit":
        return (
          <div className="settings-section">
            <ToggleRow label="Show Orbital Rings" description="Display animated connection rings in the background" checked={draftOrbitBehavior.showRings} onChange={(v) => setDraftOrbitBehavior((prev) => ({ ...prev, showRings: v }))} />
            <ToggleRow label="Pause on Hover" description="Stop background animations while interacting" checked={draftOrbitBehavior.autoPauseOnHover} onChange={(v) => setDraftOrbitBehavior((prev) => ({ ...prev, autoPauseOnHover: v }))} />
          </div>
        );
      case "security":
        return (
          <div className="settings-section">
            <button className="settings-btn settings-btn-ghost" onClick={() => navigate("/login/facelock")}>Configure FaceLock</button>
            <button className="settings-btn settings-btn-ghost mt-4" onClick={() => navigate("/login/ambient")}>Configure Ambient Presence</button>
            <div style={{ marginTop: 20 }}>
              <p className="settings-toggle-desc">Password changes and advanced security can be configured through the primary authentication terminal.</p>
            </div>
          </div>
        );
      default: return null;
    }
  };

  const SidebarContent = () => (
    <>
      <div className="settings-title" style={{ padding: '0 16px', marginBottom: 16 }}>Configuration</div>
      {navItems.map((item) => (
        <div
          key={item.key}
          className={`settings-nav-item ${activeSection === item.key ? "active" : ""}`}
          onClick={() => { setActiveSection(item.key); setSidebarOpen(false); }}
        >
          <div className="settings-nav-icon"><item.icon size={16} /></div>
          {item.label}
        </div>
      ))}
    </>
  );

  return (
    <>
      <style>{CSS}</style>
      <div className="settings-root">
        <div className="settings-topnav">
          <div className="settings-topnav-left">
            <button className="settings-back" onClick={() => navigate("/dreamland")}>◀ Hub</button>
            {mobile && (
              <button className="settings-back" style={{ border: 'none' }} onClick={() => setSidebarOpen(true)}>☰</button>
            )}
            <div className="settings-title">Settings</div>
          </div>
          <div className="settings-topnav-right">
            {isDirty && <button className="settings-btn settings-btn-ghost" onClick={handleReset}>Reset</button>}
            <button className="settings-btn settings-btn-primary" disabled={!isDirty} onClick={() => handleSave(false)}>Save Settings</button>
          </div>
        </div>

        <div className="settings-body">
          {!mobile && (
            <div className="settings-sidebar"><SidebarContent /></div>
          )}
          {mobile && (
            <OrbitDrawer open={sidebarOpen} onClose={() => setSidebarOpen(false)} side="left">
              <div style={{ padding: 16 }}><SidebarContent /></div>
            </OrbitDrawer>
          )}

          <div className="settings-content">
            <h2 className="settings-content-title">{activeLabel}</h2>
            {renderContent()}
          </div>
        </div>

        {mobile && (
          <BottomNav active="settings" onNavigate={tab => navigate(tab === "home" ? "/dreamland" : `/${tab}`)} />
        )}
      </div>
    </>
  );
}
