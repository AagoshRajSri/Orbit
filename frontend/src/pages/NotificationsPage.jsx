/**
 * NOTIFICATIONS PANEL — slide-in panel for all alerts
 * Can be mounted as a full page (/notifications) or as a right-side drawer.
 * Vampire theme. Responsive per foundation breakpoints.
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBreakpoint, isMobileOrTablet } from "../../lib/useBreakpoint";
import { BottomNav } from "../../components/layout/BottomNav";

const CSS = `
  .notif-root {
    min-height: 100dvh;
    background: var(--bg, #050508);
    color: var(--text, #F0E6D3);
    font-family: var(--font-body, sans-serif);
    display: flex; flex-direction: column;
  }
  .notif-topbar {
    position: sticky; top: 0; z-index: 30;
    display: flex; align-items: center; gap: 12px;
    padding: 0 24px; height: 60px;
    background: rgba(5,5,8,0.97);
    border-bottom: 1px solid var(--border, rgba(139,0,0,0.25));
    backdrop-filter: blur(20px);
    flex-shrink: 0;
  }
  .notif-back {
    display: flex; align-items: center; gap: 6px;
    font-family: var(--font, 'Cinzel', serif); font-size: 11px;
    letter-spacing: 1.5px; text-transform: uppercase;
    color: var(--text2); padding: 7px 12px; border-radius: 6px;
    border: 1px solid var(--border); cursor: pointer;
    transition: all 0.2s;
  }
  .notif-back:hover { color: var(--acc); border-color: var(--acc); }
  .notif-title {
    font-family: var(--font, 'Cinzel', serif); font-size: 16px;
    font-weight: 700; letter-spacing: 2px; text-transform: uppercase;
    flex: 1;
  }
  .notif-clear-btn {
    font-size: 11px; color: var(--text3); cursor: pointer;
    padding: 6px 12px; border-radius: 6px; border: 1px solid var(--border-soft);
    transition: all 0.2s; font-family: var(--font);
    letter-spacing: 1px; text-transform: uppercase;
  }
  .notif-clear-btn:hover { color: var(--acc); border-color: var(--acc); }

  /* ── FILTER TABS ── */
  .notif-filters {
    display: flex; gap: 0;
    padding: 12px 20px 0;
    border-bottom: 1px solid var(--border-soft);
    overflow-x: auto; flex-shrink: 0;
  }
  .notif-filter-btn {
    padding: 8px 16px; cursor: pointer;
    font-family: var(--font, 'Cinzel', serif); font-size: 10px;
    font-weight: 700; letter-spacing: 2px; text-transform: uppercase;
    color: var(--text3); border-bottom: 2px solid transparent;
    transition: all 0.2s; white-space: nowrap; background: none; border-top: none; border-left: none; border-right: none;
  }
  .notif-filter-btn.active { color: var(--acc); border-bottom-color: var(--acc); }

  /* ── LIST ── */
  .notif-list {
    flex: 1; overflow-y: auto; -webkit-overflow-scrolling: touch;
    padding: 8px 0;
  }
  .notif-item {
    display: flex; gap: 14px; align-items: flex-start;
    padding: 14px 24px; cursor: pointer;
    border-bottom: 1px solid var(--border-soft);
    transition: background 0.18s;
    animation: orbit-fade-up .25s ease both;
  }
  .notif-item:hover { background: rgba(139,0,0,0.05); }
  .notif-item.unread { background: rgba(139,0,0,0.04); }
  .notif-icon {
    width: 42px; height: 42px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 18px; flex-shrink: 0;
  }
  .notif-icon.msg     { background: linear-gradient(135deg,#7E22CE,#4C1D95); }
  .notif-icon.nexus   { background: linear-gradient(135deg,#8B0000,#5A0000); }
  .notif-icon.system  { background: linear-gradient(135deg,#EA580C,#9A3412); }
  .notif-icon.spotify { background: #1a3a1a; }
  .notif-content { flex: 1; min-width: 0; }
  .notif-content-header {
    display: flex; justify-content: space-between;
    align-items: baseline; gap: 8px;
  }
  .notif-sender {
    font-family: var(--font, 'Cinzel', serif); font-size: 12px;
    font-weight: 700; letter-spacing: 1px; color: var(--text);
  }
  .notif-time {
    font-size: 11px; color: var(--text3); flex-shrink: 0;
  }
  .notif-preview {
    font-size: 13px; color: var(--text2);
    font-style: italic; margin-top: 2px;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .notif-unread-pip {
    width: 8px; height: 8px; border-radius: 50%;
    background: var(--acc); box-shadow: 0 0 8px var(--acc);
    flex-shrink: 0; margin-top: 6px;
  }
  .notif-empty {
    flex: 1; display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 12px;
    padding: 60px 32px; opacity: 0.4;
    font-style: italic; font-size: 14px; text-align: center;
  }
  .notif-empty-icon { font-size: 48px; }

  /* RESPONSIVE */
  @media (max-width: 480px) {
    .notif-topbar { padding: 0 14px; }
    .notif-item   { padding: 12px 14px; }
    .notif-list   { padding-bottom: 80px; }
  }
  @media (min-width: 1025px) {
    .notif-list { max-width: 720px; margin: 0 auto; }
  }
`;

const MOCK_NOTIFICATIONS = [
  { id: 1, type: "msg",     sender: "oggy",    preview: "wassgoood",                   time: "2m ago",  unread: true  },
  { id: 2, type: "nexus",   sender: "WE Nexus",preview: "oggy posted a new message",   time: "5m ago",  unread: true  },
  { id: 3, type: "system",  sender: "Orbit",   preview: "Your public key was updated", time: "1h ago",  unread: false },
  { id: 4, type: "spotify", sender: "Spotify", preview: "Session started with oggy",   time: "2h ago",  unread: false },
];

const FILTERS = ["All", "Messages", "Nexus", "System"];

export default function NotificationsPage() {
  const navigate      = useNavigate();
  const bp            = useBreakpoint();
  const mobile        = isMobileOrTablet(bp);
  const [filter, setFilter] = useState("All");
  const [items, setItems]   = useState(MOCK_NOTIFICATIONS);

  const filtered = items.filter((n) => {
    if (filter === "All")      return true;
    if (filter === "Messages") return n.type === "msg";
    if (filter === "Nexus")    return n.type === "nexus";
    if (filter === "System")   return n.type === "system" || n.type === "spotify";
    return true;
  });

  return (
    <>
      <style>{CSS}</style>
      <div className="notif-root">
        {/* TOP BAR */}
        <div className="notif-topbar">
          <button className="notif-back" onClick={() => navigate(-1)} id="notif-back-btn">
            ◀ Back
          </button>
          <h1 className="notif-title">Alerts</h1>
          {items.some((n) => n.unread) && (
            <button
              className="notif-clear-btn"
              onClick={() => setItems((prev) => prev.map((n) => ({ ...n, unread: false })))}
              id="notif-clear-btn"
            >
              Clear All
            </button>
          )}
        </div>

        {/* FILTER TABS */}
        <div className="notif-filters" role="tablist">
          {FILTERS.map((f) => (
            <button
              key={f}
              role="tab"
              aria-selected={filter === f}
              className={`notif-filter-btn${filter === f ? " active" : ""}`}
              onClick={() => setFilter(f)}
              id={`notif-filter-${f.toLowerCase()}`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* LIST */}
        <div className="notif-list" role="feed" aria-label="Notifications">
          {filtered.length === 0 ? (
            <div className="notif-empty">
              <div className="notif-empty-icon">🔕</div>
              <div>No notifications yet</div>
            </div>
          ) : (
            filtered.map((n, i) => (
              <div
                key={n.id}
                className={`notif-item${n.unread ? " unread" : ""}`}
                style={{ animationDelay: `${i * 0.05}s` }}
                onClick={() => {
                  setItems((prev) => prev.map((x) => x.id === n.id ? { ...x, unread: false } : x));
                  if (n.type === "msg" || n.type === "nexus") navigate("/chat");
                }}
                id={`notif-item-${n.id}`}
                role="article"
              >
                <div className={`notif-icon ${n.type}`}>
                  { { msg: "✉", nexus: "◎", system: "⚙", spotify: "♫" }[n.type] }
                </div>
                <div className="notif-content">
                  <div className="notif-content-header">
                    <span className="notif-sender">{n.sender}</span>
                    <span className="notif-time">{n.time}</span>
                  </div>
                  <div className="notif-preview">{n.preview}</div>
                </div>
                {n.unread && <div className="notif-unread-pip" aria-label="Unread" />}
              </div>
            ))
          )}
        </div>

        {mobile && (
          <BottomNav
            active="notifications"
            onNavigate={(tab) => {
              if (tab === "home")    navigate("/");
              if (tab === "chat")   navigate("/chat");
              if (tab === "settings") navigate("/settings");
            }}
            unread={{ notifications: items.filter((n) => n.unread).length }}
          />
        )}
      </div>
    </>
  );
}
