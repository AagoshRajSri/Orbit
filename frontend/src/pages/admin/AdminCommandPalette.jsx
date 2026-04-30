import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Users, MessageSquare,
  Hexagon, ShieldAlert, Settings, Search, Megaphone
} from "lucide-react";
import "./admin.css";

const COMMANDS = [
  { label: "Overview",   path: "/admin/dashboard",  icon: LayoutDashboard },
  { label: "Users",      path: "/admin/users",       icon: Users },
  { label: "Messages",   path: "/admin/messages",    icon: MessageSquare },
  { label: "Nexuses",    path: "/admin/nexuses",     icon: Hexagon },
  { label: "Broadcast",  path: "/admin/broadcast",   icon: Megaphone },
  { label: "Security",   path: "/admin/security",    icon: ShieldAlert },
  { label: "System",     path: "/admin/system",      icon: Settings },
];

export default function AdminCommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [idx, setIdx] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const filtered = COMMANDS.filter(c =>
    c.label.toLowerCase().includes(query.toLowerCase())
  );

  // Open via Ctrl+K OR custom event from search button
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") { e.preventDefault(); setOpen(o => !o); }
      if (e.key === "Escape") setOpen(false);
    };
    const openHandler = () => setOpen(true);
    window.addEventListener("keydown", handler);
    window.addEventListener("open-admin-palette", openHandler);
    return () => {
      window.removeEventListener("keydown", handler);
      window.removeEventListener("open-admin-palette", openHandler);
    };
  }, []);

  useEffect(() => {
    if (open) { setQuery(""); setIdx(0); setTimeout(() => inputRef.current?.focus(), 60); }
  }, [open]);

  useEffect(() => { setIdx(0); }, [query]);

  const go = (path) => { navigate(path); setOpen(false); };

  const onKey = (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setIdx(i => (i + 1) % filtered.length); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setIdx(i => (i - 1 + filtered.length) % filtered.length); }
    else if (e.key === "Enter") { e.preventDefault(); if (filtered[idx]) go(filtered[idx].path); }
  };

  if (!open) return null;

  return (
    <div className="cmd-backdrop" onClick={() => setOpen(false)}>
      <div className="cmd-box" onClick={e => e.stopPropagation()}>
        <div className="cmd-input-row">
          <Search size={16} color="var(--text-muted)" />
          <input
            ref={inputRef}
            className="cmd-input"
            placeholder="Go to page..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={onKey}
          />
          <kbd className="cmd-esc-key">Esc</kbd>
        </div>

        <div className="cmd-list">
          {filtered.length === 0 ? (
            <div style={{ padding: "24px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
              No results
            </div>
          ) : filtered.map((cmd, i) => {
            const Icon = cmd.icon;
            return (
              <div
                key={cmd.path}
                className={`cmd-item ${i === idx ? "active" : ""}`}
                onMouseEnter={() => setIdx(i)}
                onClick={() => go(cmd.path)}
              >
                <div className="cmd-item-icon">
                  <Icon size={15} />
                </div>
                <span>{cmd.label}</span>
                <span className="cmd-item-enter">↵</span>
              </div>
            );
          })}
        </div>

        <div className="cmd-footer">
          <span className="cmd-hint"><kbd>↑↓</kbd> navigate</span>
          <span className="cmd-hint"><kbd>↵</kbd> open</span>
          <span className="cmd-hint"><kbd>Esc</kbd> close</span>
        </div>
      </div>
    </div>
  );
}
