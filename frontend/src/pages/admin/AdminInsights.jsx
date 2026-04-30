import React, { useEffect } from "react";
import { useAdminStore } from "../../store/useAdminStore.js";
import { BrainCircuit, AlertOctagon, AlertTriangle, Info } from "lucide-react";
import "./admin.css";

const severityColor = (s) => 
  s === "critical" ? "var(--danger)" : s === "warning" ? "var(--warning)" : "var(--accent)";

const SeverityIcon = ({ severity }) => {
  if (severity === "critical") return <AlertOctagon size={14} color="var(--danger)" />;
  if (severity === "warning") return <AlertTriangle size={14} color="var(--warning)" />;
  return <Info size={14} color="var(--accent)" />;
};

export default function AdminInsights() {
  const { insights, fetchInsights } = useAdminStore();

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  return (
    <div className="admin-panel" style={{ display: 'flex', flexDirection: 'column', height: 400 }}>
      <div className="admin-panel-header" style={{ flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <BrainCircuit size={15} color="var(--accent)" />
          <span className="admin-panel-title">System Insights</span>
        </div>
        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>AI Rules Engine</span>
      </div>
      <div className="admin-panel-body" style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
        {insights.length === 0 ? (
          <div className="empty-state">No anomalies detected. System operating normally.</div>
        ) : (
          insights.map((insight, idx) => (
            <div key={idx} style={{ 
              display: "flex", alignItems: "flex-start", gap: 12, 
              padding: "12px 20px", borderBottom: "1px solid var(--border)",
              background: `linear-gradient(90deg, ${severityColor(insight.severity)}10 0%, transparent 100%)`
            }}>
              <div style={{ marginTop: 2 }}><SeverityIcon severity={insight.severity} /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)", marginBottom: 4 }}>
                  {insight.description}
                </div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", display: "flex", justifyContent: "space-between" }}>
                  <span style={{ textTransform: "uppercase", color: severityColor(insight.severity), fontWeight: 600 }}>
                    {insight.severity}
                  </span>
                  <span style={{ fontFamily: "var(--mono)" }}>
                    {new Date(insight.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
