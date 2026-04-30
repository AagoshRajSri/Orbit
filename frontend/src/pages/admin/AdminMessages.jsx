import React, { useEffect } from "react";
import { useAdminStore } from "../../store/useAdminStore.js";
import { Trash2, Flag, RefreshCw } from "lucide-react";
import "./admin.css";

export default function AdminMessages() {
  const { messages, fetchMessages, pagination, isFetchingData, deleteMessage, restoreMessage } = useAdminStore();

  useEffect(() => { fetchMessages(1); }, [fetchMessages]);

  const pg = pagination.messages;

  return (
    <div style={{ maxWidth: 1100 }}>
      <div className="admin-page-header">
        <h1 className="admin-page-title">Messages</h1>
        <p className="admin-page-subtitle">Global message feed · {pg.total} total</p>
      </div>

      <div className="admin-panel">
        <div className="admin-panel-body">
          <table className="smart-table">
            <thead>
              <tr>
                <th style={{ width: "18%" }}>Sender</th>
                <th>Content</th>
                <th style={{ width: "16%" }}>Sent</th>
                <th style={{ width: "100px", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isFetchingData ? (
                <tr><td colSpan="4" className="empty-state">Loading…</td></tr>
              ) : messages.length === 0 ? (
                <tr><td colSpan="4" className="empty-state">No messages found</td></tr>
              ) : messages.map(msg => (
                <tr key={msg._id} className={msg.isDeleted ? "row-deleted" : ""}>
                  <td>
                    <div className="user-cell">
                      <img className="user-avatar" src={msg.senderId?.profilePic || "/avatar.png"} alt="" />
                      <span className="user-cell-name">{msg.senderId?.username ?? "Unknown"}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {msg.isDeleted && <span style={{ fontSize: 10, color: "var(--danger)", fontWeight: 700, textTransform: "uppercase" }}>[Soft Deleted]</span>}
                      {msg.image ? (
                        <span style={{ color: "var(--accent)", fontSize: 12, fontStyle: "italic" }}>
                          [Image]{msg.text ? ` · ${msg.text}` : ""}
                        </span>
                      ) : (
                        <span style={{ color: msg.isDeleted ? "var(--text-muted)" : "var(--text-secondary)", fontSize: 13 }}>
                          {msg.text?.length > 120 ? msg.text.slice(0, 120) + "…" : msg.text}
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={{ color: "var(--text-muted)", fontSize: 12, fontVariantNumeric: "tabular-nums" }}>
                    {new Date(msg.createdAt).toLocaleString()}
                  </td>
                  <td>
                    <div className="row-actions">
                      {msg.isDeleted ? (
                        <button className="action-btn success" onClick={() => restoreMessage(msg._id)} title="Restore">
                          <RefreshCw size={13} />
                        </button>
                      ) : (
                        <>
                          <button className="action-btn warn" title="Flag"><Flag size={13} /></button>
                          <button
                            className="action-btn danger"
                            onClick={() => { if (window.confirm("Soft-delete this message?")) deleteMessage(msg._id); }}
                            title="Delete"
                          >
                            <Trash2 size={13} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pagination">
          <span className="pagination-info">Page {pg.page} of {pg.pages} · {pg.total} messages</span>
          <div className="pagination-controls">
            <button className="page-btn" disabled={pg.page <= 1} onClick={() => fetchMessages(pg.page - 1)}>Prev</button>
            <button className="page-btn" disabled={pg.page >= pg.pages} onClick={() => fetchMessages(pg.page + 1)}>Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
