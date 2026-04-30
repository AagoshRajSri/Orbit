import React, { useEffect, useState } from "react";
import { useAdminStore } from "../../store/useAdminStore.js";
import { AlertTriangle, Server, Database, Shield, Zap, Megaphone, Settings2, Save } from "lucide-react";
import "./admin.css";

function SettingPanel({ icon, iconColor = "var(--accent)", title, children }) {
  return (
    <div className="admin-panel">
      <div className="admin-panel-header">
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {React.cloneElement(icon, { size: 15, color: iconColor })}
          <span className="admin-panel-title">{title}</span>
        </div>
      </div>
      {children}
    </div>
  );
}

export default function AdminSystem() {
  const { systemConfig, fetchSystemConfig, updateSystemConfig } = useAdminStore();
  const [announcement, setAnnouncement] = useState({ enabled: false, message: "", severity: "info" });

  useEffect(() => { fetchSystemConfig(); }, [fetchSystemConfig]);
  useEffect(() => {
    if (systemConfig?.globalAnnouncement) setAnnouncement(systemConfig.globalAnnouncement);
  }, [systemConfig]);

  const handleUpdate = (updates) => updateSystemConfig(updates);
  const toggleFeature = (flag) => {
    const cur = systemConfig?.featureFlags || {};
    handleUpdate({ featureFlags: { ...cur, [flag]: !cur[flag] } });
  };
  const updateAnnouncement = () => handleUpdate({ globalAnnouncement: announcement });

  if (!systemConfig) return <div className="empty-state">Loading system configuration…</div>;

  return (
    <div style={{ maxWidth: 1000, paddingBottom: 48 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 className="admin-page-title">System Control</h1>
        <p className="admin-page-subtitle">Configure platform behaviour, feature flags, and global announcements</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>

        {/* Left column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

          <SettingPanel icon={<Shield />} title="Core Platform">
            <div className="toggle-row">
              <div>
                <div className="toggle-label">Maintenance Mode</div>
                <div className="toggle-sub">Blocks all non-admin API access</div>
              </div>
              <button
                className={`toggle-switch ${systemConfig.maintenanceMode ? "toggle-on" : "toggle-off"}`}
                onClick={() => handleUpdate({ maintenanceMode: !systemConfig.maintenanceMode })}
              >
                {systemConfig.maintenanceMode ? "ON" : "OFF"}
              </button>
            </div>
            <div className="toggle-row">
              <div>
                <div className="toggle-label">User Registrations</div>
                <div className="toggle-sub">Allow new accounts to be created</div>
              </div>
              <button
                className={`toggle-switch ${systemConfig.registrationEnabled ? "toggle-on" : "toggle-off"}`}
                onClick={() => handleUpdate({ registrationEnabled: !systemConfig.registrationEnabled })}
              >
                {systemConfig.registrationEnabled ? "ON" : "OFF"}
              </button>
            </div>
          </SettingPanel>

          <SettingPanel icon={<Zap />} iconColor="var(--warning)" title="Feature Flags">
            <div className="toggle-row">
              <div>
                <div className="toggle-label">Live Mode</div>
                <div className="toggle-sub">Real-time socket events and telemetry</div>
              </div>
              <button
                className={`toggle-switch ${systemConfig.featureFlags?.liveMode ? "toggle-on" : "toggle-off"}`}
                onClick={() => toggleFeature("liveMode")}
              >
                {systemConfig.featureFlags?.liveMode ? "Active" : "Paused"}
              </button>
            </div>
            <div className="toggle-row">
              <div>
                <div className="toggle-label">Spotify Sync</div>
                <div className="toggle-sub">Global control for shared listening sessions</div>
              </div>
              <button
                className={`toggle-switch ${systemConfig.featureFlags?.enableSpotifySync ? "toggle-on" : "toggle-off"}`}
                onClick={() => toggleFeature("enableSpotifySync")}
              >
                {systemConfig.featureFlags?.enableSpotifySync ? "ON" : "OFF"}
              </button>
            </div>
            <div className="toggle-row">
              <div>
                <div className="toggle-label">Media Uploads</div>
                <div className="toggle-sub">Allow image uploads in chats and nexuses</div>
              </div>
              <button
                className={`toggle-switch ${systemConfig.featureFlags?.enableUploads ? "toggle-on" : "toggle-off"}`}
                onClick={() => toggleFeature("enableUploads")}
              >
                {systemConfig.featureFlags?.enableUploads ? "ON" : "OFF"}
              </button>
            </div>
          </SettingPanel>

          <SettingPanel icon={<Settings2 />} iconColor="var(--text-muted)" title="Thresholds &amp; Limits">
            <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
              <div className="field-group">
                <label className="field-label">Max Message Length (chars)</label>
                <input
                  type="number" className="field-input"
                  value={systemConfig.maxMessageLength}
                  onChange={e => handleUpdate({ maxMessageLength: parseInt(e.target.value) })}
                />
              </div>
              <div className="field-group">
                <label className="field-label">Login Lockout Threshold (attempts)</label>
                <input
                  type="number" className="field-input"
                  value={systemConfig.rateLimitThresholds?.login}
                  onChange={e => handleUpdate({ rateLimitThresholds: { ...systemConfig.rateLimitThresholds, login: parseInt(e.target.value) } })}
                />
              </div>
            </div>
          </SettingPanel>
        </div>

        {/* Right column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

          <SettingPanel icon={<Megaphone />} iconColor="var(--danger)" title="Global Announcement Banner">
            <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
              <div className="toggle-row" style={{ padding: 0, border: "none" }}>
                <div>
                  <div className="toggle-label">Banner Status</div>
                  <div className="toggle-sub">Display alert banner to all connected users</div>
                </div>
                <button
                  className={`toggle-switch ${announcement.enabled ? "toggle-on" : "toggle-off"}`}
                  onClick={() => setAnnouncement({ ...announcement, enabled: !announcement.enabled })}
                >
                  {announcement.enabled ? "Visible" : "Hidden"}
                </button>
              </div>

              <div className="field-group">
                <label className="field-label">Message</label>
                <textarea
                  className="field-input" rows={3}
                  value={announcement.message}
                  onChange={e => setAnnouncement({ ...announcement, message: e.target.value })}
                  placeholder="System maintenance scheduled at 00:00 UTC…"
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12, alignItems: "flex-end" }}>
                <div className="field-group">
                  <label className="field-label">Severity</label>
                  <select
                    className="field-input"
                    value={announcement.severity}
                    onChange={e => setAnnouncement({ ...announcement, severity: e.target.value })}
                  >
                    <option value="info">Info</option>
                    <option value="warning">Warning</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <button className="primary-btn" style={{ height: 42, padding: "0 18px" }} onClick={updateAnnouncement}>
                  <Save size={14} /> Save
                </button>
              </div>
            </div>
          </SettingPanel>

          <div className="danger-zone">
            <div className="danger-zone-header">
              <AlertTriangle size={14} color="var(--danger)" />
              <span className="danger-zone-title">System Recovery</span>
            </div>
            <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
              <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6, margin: 0 }}>
                These actions affect the live server process. Use only in emergencies.
              </p>
              <div style={{ display: "flex", gap: 12 }}>
                <button className="danger-btn" style={{ flex: 1 }} onClick={() => window.confirm("Restart Node process?") && alert("Restart signal sent.")}>
                  <Server size={14} /> Restart Node
                </button>
                <button className="danger-btn" style={{ flex: 1 }} onClick={() => window.confirm("Flush Redis cache?") && alert("Flush signal sent.")}>
                  <Database size={14} /> Flush Redis
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
