import React, { useState } from "react";
import { useAdminStore } from "../../store/useAdminStore.js";
import { Megaphone, Mail, MessageSquare, Bell, Send } from "lucide-react";
import "./admin.css";

const TABS = [
  { id: "notification", label: "In-App Alert",     icon: Bell },
  { id: "message",      label: "System Message",   icon: MessageSquare },
  { id: "email",        label: "Email Broadcast",  icon: Mail },
];

const SEVERITY_COLORS = {
  info:     { bg: "var(--accent-soft)",  border: "rgba(124,58,237,0.25)", text: "var(--accent)" },
  warning:  { bg: "var(--warning-soft)", border: "rgba(245,158,11,0.25)", text: "var(--warning)" },
  critical: { bg: "var(--danger-soft)",  border: "rgba(239,68,68,0.25)",  text: "var(--danger)" },
};

export default function AdminBroadcast() {
  const { sendNotification, sendSystemMessage, sendEmailBroadcast } = useAdminStore();
  const [activeTab, setActiveTab] = useState("notification");
  const [isSending, setIsSending] = useState(false);
  const [targetUserId, setTargetUserId] = useState("");
  const [nexusId, setNexusId] = useState("");
  const [message, setMessage] = useState("");
  const [title, setTitle] = useState("");
  const [severity, setSeverity] = useState("info");
  const [subject, setSubject] = useState("");
  const [type, setType] = useState("announcement");

  const reset = () => {
    setTargetUserId(""); setNexusId(""); setMessage("");
    setTitle(""); setSubject(""); setSeverity("info"); setType("announcement");
  };

  const handleSend = async (e) => {
    e.preventDefault();
    setIsSending(true);
    let ok = false;
    if (activeTab === "notification") {
      ok = await sendNotification({ targetUserId: targetUserId || undefined, type, title, message, severity });
    } else if (activeTab === "message") {
      ok = await sendSystemMessage({ targetUserId: targetUserId || undefined, nexusId: nexusId || undefined, text: message });
    } else if (activeTab === "email") {
      ok = await sendEmailBroadcast({ targetUserId: targetUserId || undefined, subject, body: message, type });
    }
    if (ok) reset();
    setIsSending(false);
  };

  const previewColors = SEVERITY_COLORS[severity] || SEVERITY_COLORS.info;

  return (
    <div style={{ maxWidth: 760 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 className="admin-page-title">Broadcast Center</h1>
        <p className="admin-page-subtitle">Send alerts, messages, and emails directly to users</p>
      </div>

      {/* Tab bar */}
      <div className="tab-bar">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} className={`tab-btn ${activeTab === id ? "active" : ""}`} onClick={() => setActiveTab(id)}>
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      <div className="admin-panel">
        <div className="admin-panel-header">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Megaphone size={15} color="var(--accent)" />
            <span className="admin-panel-title">
              {activeTab === "notification" ? "Send In-App Alert" : activeTab === "message" ? "Send System Message" : "Send Email Broadcast"}
            </span>
          </div>
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Leave User ID blank to broadcast to all</span>
        </div>

        <form onSubmit={handleSend} style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Target */}
          <div className="field-group">
            <label className="field-label">Target User ID <span style={{ color: "var(--text-muted)", textTransform: "none", fontWeight: 400 }}>(optional — leave blank for all users)</span></label>
            <input className="field-input" placeholder="MongoDB ObjectId…" value={targetUserId} onChange={e => setTargetUserId(e.target.value)} />
          </div>

          {/* Nexus ID (message only) */}
          {activeTab === "message" && (
            <div className="field-group">
              <label className="field-label">Nexus ID <span style={{ color: "var(--text-muted)", textTransform: "none", fontWeight: 400 }}>(optional — sends to a Nexus instead of DM)</span></label>
              <input className="field-input" placeholder="MongoDB ObjectId…" value={nexusId} onChange={e => setNexusId(e.target.value)} />
            </div>
          )}

          {/* Title / Subject */}
          {activeTab !== "message" && (
            <div className="field-group">
              <label className="field-label">{activeTab === "email" ? "Email Subject" : "Alert Title"}</label>
              <input
                className="field-input"
                placeholder={activeTab === "email" ? "Subject line…" : "Notification title…"}
                value={activeTab === "email" ? subject : title}
                onChange={e => activeTab === "email" ? setSubject(e.target.value) : setTitle(e.target.value)}
              />
            </div>
          )}

          {/* Type */}
          {activeTab !== "message" && (
            <div className="field-group">
              <label className="field-label">Type</label>
              <select className="field-input" value={type} onChange={e => setType(e.target.value)}>
                <option value="announcement">Announcement</option>
                <option value="warning">Warning</option>
                <option value="update">Update</option>
              </select>
            </div>
          )}

          {/* Severity (notification only) */}
          {activeTab === "notification" && (
            <div className="field-group">
              <label className="field-label">Severity</label>
              <select className="field-input" value={severity} onChange={e => setSeverity(e.target.value)}>
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          )}

          {/* Body */}
          <div className="field-group">
            <label className="field-label">{activeTab === "email" ? "Email Body" : "Message"}</label>
            <textarea className="field-input" rows={5} placeholder="Write your message here…" value={message} onChange={e => setMessage(e.target.value)} required />
          </div>

          {/* Preview */}
          {message && (
            <div style={{
              padding: "14px 18px",
              background: previewColors.bg,
              border: `1px solid ${previewColors.border}`,
              borderRadius: 10,
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: previewColors.text, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
                Preview
              </div>
              {(title || subject) && (
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>{title || subject}</div>
              )}
              <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>{message}</div>
            </div>
          )}

          <button className="primary-btn" type="submit" disabled={isSending || !message} style={{ alignSelf: "flex-start" }}>
            <Send size={15} />
            {isSending ? "Sending…" : `Send ${activeTab === "notification" ? "Alert" : activeTab === "message" ? "Message" : "Email"}`}
          </button>
        </form>
      </div>
    </div>
  );
}
