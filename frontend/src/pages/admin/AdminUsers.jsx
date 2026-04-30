import React, { useEffect, useState } from "react";
import { useAdminStore } from "../../store/useAdminStore.js";
import { Search, Ban, Unlock, Trash2, PowerOff, RefreshCw, ShieldAlert } from "lucide-react";
import "./admin.css";

export default function AdminUsers() {
  const { users, fetchUsers, pagination, isFetchingData, forceLogoutUser, toggleBanUser, deleteUser, restoreUser } = useAdminStore();
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [confirmText, setConfirmText] = useState("");

  useEffect(() => { fetchUsers(1, ""); }, [fetchUsers]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchUsers(1, search);
  };

  const handleSoftDelete = (user) => {
    setDeletingId(user._id);
    setConfirmText("");
  };

  const confirmDelete = (username) => {
    if (confirmText === username) {
      deleteUser(deletingId);
      setDeletingId(null);
    }
  };

  const pg = pagination.users;

  return (
    <div style={{ maxWidth: 1100 }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 24 }}>
        <div className="admin-page-header" style={{ marginBottom: 0 }}>
          <h1 className="admin-page-title">Users</h1>
          <p className="admin-page-subtitle">{pg.total} registered accounts</p>
        </div>
        <form onSubmit={handleSearch} style={{ display: "flex", gap: 8 }}>
          <div style={{ position: "relative" }}>
            <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input
              className="field-input"
              style={{ paddingLeft: 32, width: 240 }}
              placeholder="Search username or email…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button className="primary-btn" type="submit" style={{ width: "auto", padding: "0 16px" }}>Search</button>
        </form>
      </div>

      <div className="admin-panel">
        <div className="admin-panel-body">
          <table className="smart-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Status</th>
                <th>Joined</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isFetchingData ? (
                <tr><td colSpan="4" className="empty-state">Loading…</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan="4" className="empty-state">No users found</td></tr>
              ) : users.map(user => (
                <tr key={user._id} className={user.isDeleted ? "row-deleted" : ""}>
                  <td>
                    <div className="user-cell">
                      <img className="user-avatar" src={user.profilePic || "/avatar.png"} alt="" />
                      <div>
                        <div className="user-cell-name">{user.username}</div>
                        <div className="user-cell-sub">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {user.isDeleted ? (
                        <span className="badge badge-danger" style={{ opacity: 0.6 }}>Deleted</span>
                      ) : (
                        <span className={`badge ${user.isLocked ? "badge-danger" : "badge-success"}`}>
                          {user.isLocked ? "Banned" : "Active"}
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={{ color: "var(--text-muted)", fontVariantNumeric: "tabular-nums" }}>
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td>
                    <div className="row-actions">
                      {user.isDeleted ? (
                        <button className="action-btn success" onClick={() => restoreUser(user._id)} title="Restore User">
                          <RefreshCw size={13} />
                        </button>
                      ) : deletingId === user._id ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--danger-soft)", padding: "4px 8px", borderRadius: 4, border: "1px solid var(--danger)" }}>
                          <span style={{ fontSize: 11, color: "var(--danger)", fontWeight: 600 }}>Type "{user.username}"</span>
                          <input
                            style={{ width: 80, height: 20, fontSize: 10, background: "transparent", border: "1px solid var(--danger)", color: "var(--text-primary)", outline: "none", padding: "0 4px" }}
                            value={confirmText}
                            onChange={e => setConfirmText(e.target.value)}
                            onBlur={() => setDeletingId(null)}
                            autoFocus
                          />
                          <button
                            className="action-btn danger"
                            style={{ width: 20, height: 20 }}
                            onMouseDown={() => confirmDelete(user.username)}
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            className={`action-btn ${user.isLocked ? "success" : "warn"}`}
                            onClick={() => toggleBanUser(user._id)}
                            title={user.isLocked ? "Unban" : "Ban"}
                          >
                            {user.isLocked ? <Unlock size={13} /> : <Ban size={13} />}
                          </button>
                          <button className="action-btn accent" onClick={() => forceLogoutUser(user._id)} title="Force logout">
                            <PowerOff size={13} />
                          </button>
                          <button
                            className="action-btn danger"
                            onClick={() => handleSoftDelete(user)}
                            title="Delete user"
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
          <span className="pagination-info">Page {pg.page} of {pg.pages} · {pg.total} users</span>
          <div className="pagination-controls">
            <button className="page-btn" disabled={pg.page <= 1} onClick={() => fetchUsers(pg.page - 1, search)}>Prev</button>
            <button className="page-btn" disabled={pg.page >= pg.pages} onClick={() => fetchUsers(pg.page + 1, search)}>Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
