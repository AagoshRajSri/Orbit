import React, { useState, useEffect } from "react";
import { Outlet, Navigate, Link, useLocation, useNavigate } from "react-router-dom";
import { useAdminStore, initAdminSocket } from "../../store/useAdminStore.js";
import {
  LayoutDashboard, Users, MessageSquare, Hexagon,
  ShieldAlert, Settings, LogOut, Menu, Search, Megaphone,
  Globe, Zap, Activity
} from "lucide-react";
import AdminCommandPalette from "./AdminCommandPalette.jsx";
import OrbitLogo from "../../components/OrbitLogo";
import "./admin.css";

const NAV_GROUPS = [
  {
    label: "Intelligence",
    items: [
      { name: "Overview",   path: "/admin/dashboard",  icon: LayoutDashboard },
      { name: "Users",      path: "/admin/users",       icon: Users },
      { name: "Nexuses",    path: "/admin/nexuses",     icon: Hexagon },
    ]
  },
  {
    label: "Operations",
    items: [
      { name: "Messages",   path: "/admin/messages",    icon: MessageSquare },
      { name: "Broadcast",  path: "/admin/broadcast",   icon: Megaphone },
    ]
  },
  {
    label: "Security & System",
    items: [
      { name: "Security",   path: "/admin/security",    icon: ShieldAlert },
      { name: "System",     path: "/admin/system",      icon: Settings },
    ]
  }
];

export default function AdminLayout() {
  const { isAdminAuth, checkAdminAuth, logout } = useAdminStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    checkAdminAuth();
    initAdminSocket();
  }, [checkAdminAuth]);

  if (!isAdminAuth && location.pathname !== "/admin/login") {
    return <Navigate to="/admin/login" />;
  }

  const handleLogout = async () => { await logout(); navigate("/admin/login"); };

  return (
    <div className="admin-root">
      {/* Sidebar */}
      <aside className={`admin-sidebar ${expanded ? "expanded" : ""}`}>
        <div className="admin-sidebar-header">
          <OrbitLogo size={32} />
          <span className="admin-sidebar-title">Admin</span>
        </div>

        <nav style={{ flex: 1, padding: expanded ? "0" : "0 12px" }}>
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="admin-nav-group">
              <div className="admin-nav-label-small">{group.label}</div>
              {group.items.map(({ name, path, icon: Icon }) => {
                const active = location.pathname.startsWith(path);
                return (
                  <Link 
                    key={name} 
                    to={path} 
                    className={`admin-nav-item ${active ? "active" : ""}`}
                    title={!expanded ? name : undefined}
                  >
                    <Icon className="admin-nav-icon" size={18} />
                    <span className="admin-nav-text">{name}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="admin-nav-group" style={{ marginTop: 'auto', marginBottom: 0 }}>
          <button
            onClick={handleLogout}
            className="admin-nav-item"
            title={!expanded ? "Sign Out" : undefined}
            style={{ color: "var(--danger)", width: '100%', background: 'transparent', border: 'none', padding: expanded ? '0 14px' : 0 }}
          >
            <LogOut size={18} />
            <span className="admin-nav-text">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="admin-main">
        {/* Topbar */}
        <header className="admin-topbar">
          <button className="sidebar-toggle-btn" onClick={() => setExpanded(!expanded)}>
            <Menu size={16} />
          </button>

          <button
            className="admin-search-trigger"
            onClick={() => window.dispatchEvent(new CustomEvent("open-admin-palette"))}
          >
            <Search size={14} />
            <span>Search...</span>
            <span className="kbd">⌘K</span>
          </button>

          <div style={{ flex: 1 }} />

          {/* Status Indicator */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "0 8px" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "var(--success)", textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Operational
              </span>
              <span style={{ fontSize: 10, color: "var(--text-muted)" }}>Node: orbit-primary-us</span>
            </div>
            <div className="admin-status-dot pulse-glow" style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)', boxShadow: '0 0 10px var(--success)' }} />
          </div>
        </header>

        {/* Page Content */}
        <div className="admin-content">
          <Outlet />
        </div>
      </main>

      <AdminCommandPalette />
    </div>
  );
}
