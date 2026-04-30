import React, { useEffect } from "react";
import { useAdminStore } from "../../store/useAdminStore.js";
import { ShieldAlert, ShieldCheck, Terminal } from "lucide-react";
import "./admin.css";

const ACTION_COLORS = {
  DELETE: "badge-danger",
  BAN: "badge-danger",
  UNBAN: "badge-success",
  RESTORE: "badge-success",
  LOGOUT: "badge-warn",
  UPDATE: "badge-accent",
  BROADCAST: "badge-accent",
};

function getActionBadge(action) {
  const key = Object.keys(ACTION_COLORS).find(k => action?.toUpperCase().includes(k));
  return key ? ACTION_COLORS[key] : "badge-neutral";
}

export default function AdminSecurity() {
  const { auditLogs, fetchAuditLogs, pagination, isFetchingData } = useAdminStore();

  useEffect(() => { fetchAuditLogs(1); }, [fetchAuditLogs]);

  const pg = pagination.auditLogs;

  return (
    <div style={{ maxWidth: 1000 }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <h1 className="admin-page-title">Security</h1>
          <p className="admin-page-subtitle">Immutable admin audit trail — every action is recorded</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", borderRadius: 10, background: "var(--success-soft)", border: "1px solid rgba(16,185,129,0.2)" }}>
          <ShieldCheck size={16} color="var(--success)" />
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--success)" }}>Audit Log Active</span>
        </div>
      </div>

      <div className="admin-panel">
        <div className="admin-panel-header">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <ShieldAlert size={15} color="var(--accent)" />
            <span className="admin-panel-title">Admin Audit Log</span>
          </div>
          <span className="badge badge-neutral">{pg.total} recorded actions</span>
        </div>

        <div>
          {isFetchingData && auditLogs.length === 0 ? (
            <div className="empty-state">Loading audit log…</div>
          ) : auditLogs.length === 0 ? (
            <div className="empty-state">No admin actions recorded yet</div>
          ) : (
            auditLogs.map((log, i) => (
              <div key={log._id} className="audit-entry">
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  {/* Sequence number */}
                  <span style={{
                    width: 28, height: 28, borderRadius: 7,
                    background: "var(--bg-overlay)", border: "1px solid var(--border)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 10, fontWeight: 700, color: "var(--text-muted)",
                    fontFamily: "var(--mono)", flexShrink: 0,
                  }}>
                    {(pg.page - 1) * 20 + i + 1}
                  </span>

                  <span className="audit-action">{log.action}</span>

                  {log.targetType && (
                    <span className={`badge ${getActionBadge(log.action)}`}>{log.targetType}</span>
                  )}

                  <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
                    <Terminal size={11} color="var(--text-muted)" />
                    <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--mono)" }}>
                      {new Date(log.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>

                <div className="audit-meta" style={{ marginTop: 8, display: "flex", gap: 16, flexWrap: "wrap" }}>
                  {log.targetId && (
                    <span>target: <span style={{ color: "var(--text-secondary)" }}>{log.targetId.slice(-12)}</span></span>
                  )}
                  <span>admin: <span style={{ color: "var(--text-secondary)" }}>{log.adminId?.slice(-8) ?? "—"}</span></span>
                  {log.ip && <span>ip: <span style={{ color: "var(--text-secondary)" }}>{log.ip}</span></span>}
                </div>
              </div>
            ))
          )}
        </div>

        {pg.total > 0 && (
          <div className="pagination">
            <span className="pagination-info">Page {pg.page} of {pg.pages} · {pg.total} entries</span>
            <div className="pagination-controls">
              <button className="page-btn" disabled={pg.page <= 1} onClick={() => fetchAuditLogs(pg.page - 1)}>← Prev</button>
              <button className="page-btn" disabled={pg.page >= pg.pages} onClick={() => fetchAuditLogs(pg.page + 1)}>Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
