import React from "react";
import { useAdminStore } from "../../store/useAdminStore.js";
import { Activity, UserPlus, AlertTriangle, ShieldAlert, Hexagon, MessageSquare, LogIn } from "lucide-react";
import "./admin.css";

const IconMap = {
  user_signup: <UserPlus size={14} color="var(--success)" />,
  login_failed: <AlertTriangle size={14} color="var(--danger)" />,
  user_login: <LogIn size={14} color="var(--success)" />,
  message_sent: <MessageSquare size={14} color="var(--text-muted)" />,
  nexus_created: <Hexagon size={14} color="var(--accent)" />,
  admin_action: <ShieldAlert size={14} color="var(--warning)" />
};

export default function AdminLiveFeed() {
  const { liveEvents } = useAdminStore();

  return (
    <div className="admin-panel" style={{ display: 'flex', flexDirection: 'column', height: 400 }}>
      <div className="admin-panel-header" style={{ flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Activity size={15} color="var(--success)" />
          <span className="admin-panel-title">Live System Feed</span>
        </div>
        <div className="admin-status-dot" title="Live connection active" />
      </div>
      <div className="admin-panel-body" style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
        {liveEvents.length === 0 ? (
          <div className="empty-state">Waiting for system events...</div>
        ) : (
          liveEvents.map((evt, idx) => (
            <div key={idx} style={{ 
              display: "flex", alignItems: "flex-start", gap: 12, 
              padding: "8px 20px", borderBottom: "1px solid var(--border)",
              animation: "fade-in 200ms ease"
            }}>
              <div style={{ marginTop: 2 }}>{IconMap[evt.type] || <Activity size={14} />}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 2 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>{evt.type}</span>
                  <span style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--mono)" }}>
                    {new Date(evt.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: "var(--text-secondary)", wordBreak: "break-all" }}>
                  {JSON.stringify(evt.payload)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
