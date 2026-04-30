import React, { useEffect, useState } from "react";
import { useAdminStore } from "../../store/useAdminStore.js";
import { Trash2, Users, RefreshCw, Hexagon } from "lucide-react";
import "./admin.css";

export default function AdminNexuses() {
  const { nexuses, fetchNexuses, pagination, isFetchingData, deleteNexus, restoreNexus } = useAdminStore();
  const [deletingId, setDeletingId] = useState(null);
  const [confirmText, setConfirmText] = useState("");

  useEffect(() => { fetchNexuses(1); }, [fetchNexuses]);

  const handleSoftDelete = (nexus) => { setDeletingId(nexus._id); setConfirmText(""); };
  const confirmDelete = (name) => {
    if (confirmText === name) { deleteNexus(deletingId); setDeletingId(null); }
  };

  const pg = pagination.nexuses;

  return (
    <div style={{ maxWidth: 1100 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 className="admin-page-title">Nexuses</h1>
        <p className="admin-page-subtitle">Group channels and collaborative spaces</p>
      </div>

      <div className="admin-panel">
        <div className="admin-panel-header">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Hexagon size={15} color="var(--accent)" />
            <span className="admin-panel-title">All Nexuses</span>
          </div>
          <span className="badge badge-neutral">{pg.total} total</span>
        </div>

        <div className="admin-panel-body">
          {isFetchingData ? (
            <div className="empty-state">Loading nexuses…</div>
          ) : nexuses.length === 0 ? (
            <div className="empty-state">No nexuses found</div>
          ) : (
            <table className="smart-table">
              <thead>
                <tr>
                  <th>Nexus</th>
                  <th>Members</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {nexuses.map(nexus => (
                  <tr key={nexus._id} className={nexus.isDeleted ? "row-deleted" : ""}>
                    <td>
                      <div className="user-cell">
                        <div style={{
                          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                          background: nexus.isDeleted ? "var(--bg-overlay)" : "var(--accent-soft)",
                          border: `1px solid ${nexus.isDeleted ? "var(--border)" : "rgba(124,58,237,0.25)"}`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          color: nexus.isDeleted ? "var(--text-muted)" : "var(--accent)",
                          fontWeight: 800, fontSize: 14,
                        }}>
                          {nexus.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="user-cell-name">{nexus.name}</div>
                          <div className="user-cell-sub" style={{ fontFamily: "var(--mono)" }}>
                            {nexus._id.slice(-10)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--text-secondary)", fontSize: 13 }}>
                        <Users size={14} color="var(--text-muted)" />
                        <span style={{ fontWeight: 600 }}>{nexus.members?.length ?? 0}</span>
                        <span style={{ color: "var(--text-muted)" }}>members</span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${nexus.isDeleted ? "badge-danger" : "badge-success"}`}>
                        {nexus.isDeleted ? "Deleted" : "Active"}
                      </span>
                    </td>
                    <td style={{ color: "var(--text-muted)", fontSize: 12, fontVariantNumeric: "tabular-nums" }}>
                      {new Date(nexus.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                    </td>
                    <td>
                      <div className="row-actions">
                        {nexus.isDeleted ? (
                          <button className="action-btn success" onClick={() => restoreNexus(nexus._id)}>
                            <RefreshCw size={13} /> Restore
                          </button>
                        ) : deletingId === nexus._id ? (
                          <div className="inline-confirm">
                            <span className="inline-confirm-label">Type "{nexus.name}"</span>
                            <input
                              className="inline-confirm-input"
                              value={confirmText}
                              onChange={e => setConfirmText(e.target.value)}
                              onBlur={() => setDeletingId(null)}
                              autoFocus
                            />
                            <button className="action-btn danger" style={{ padding: "4px 8px" }} onMouseDown={() => confirmDelete(nexus.name)}>
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ) : (
                          <button className="action-btn danger" onClick={() => handleSoftDelete(nexus)}>
                            <Trash2 size={13} /> Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="pagination">
          <span className="pagination-info">Page {pg.page} of {pg.pages} · {pg.total} nexuses</span>
          <div className="pagination-controls">
            <button className="page-btn" disabled={pg.page <= 1} onClick={() => fetchNexuses(pg.page - 1)}>← Prev</button>
            <button className="page-btn" disabled={pg.page >= pg.pages} onClick={() => fetchNexuses(pg.page + 1)}>Next →</button>
          </div>
        </div>
      </div>
    </div>
  );
}
