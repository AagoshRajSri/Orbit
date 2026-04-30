import React, { useEffect } from "react";
import { useAdminStore } from "../../store/useAdminStore.js";
import { useAuthStore } from "../../store/useAuthStore.js";
import { 
  Users, MessageSquare, Hexagon, TrendingUp, Activity, 
  Zap, Globe, ShieldCheck, Cpu, ArrowUpRight 
} from "lucide-react";
import AdminLiveFeed from "./AdminLiveFeed.jsx";
import AdminInsights from "./AdminInsights.jsx";
import "./admin.css";

const statusColor = (s) =>
  s === "OPERATIONAL" ? "var(--success)" : s === "DEGRADED" ? "var(--warning)" : "var(--danger)";

export default function AdminDashboard() {
  const { stats, fetchStats, systemTelemetry, fetchSystemTelemetry } = useAdminStore();

  useEffect(() => {
    fetchStats();
    fetchSystemTelemetry();
    const interval = setInterval(() => {
      fetchStats();
      fetchSystemTelemetry();
    }, 30000); // Every 30s
    return () => clearInterval(interval);
  }, [fetchStats, fetchSystemTelemetry]);

  const cards = [
    { label: "Identity Grid", value: stats?.users || 0, trend: "+2 today", icon: Users, color: "#6366f1" },
    { label: "Signal Volume", value: stats?.messages || 0, trend: "Stable", icon: MessageSquare, color: "#10b981" },
    { label: "Neural Clusters", value: stats?.nexuses || 0, trend: "Active", icon: Hexagon, color: "#f59e0b" },
    { label: "Active Links", value: stats?.onlineUsers || 0, trend: "Live", icon: Globe, color: "#7c3aed" },
  ];

  return (
    <div className="admin-dashboard-page">
      <header className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Command Center</h1>
          <p className="admin-page-subtitle">Unified platform awareness and system control</p>
        </div>
        <div className="live-status-pill" style={{ 
          background: 'rgba(16, 185, 129, 0.1)', 
          border: '1px solid rgba(16, 185, 129, 0.2)', 
          padding: '6px 14px', 
          borderRadius: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: 11,
          fontWeight: 700,
          color: 'var(--success)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          <span className="pulse-glow" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)' }} />
          Live Monitoring Active
        </div>
      </header>

      {/* Stats Section */}
      <div className="stat-grid">
        {cards.map((card) => (
          <div key={card.label} className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p className="stat-label">{card.label}</p>
                <h3 className="stat-value">{card.value.toLocaleString()}</h3>
              </div>
              <div style={{ 
                width: 40, height: 40, borderRadius: 10, 
                background: `rgba(${card.color === "#6366f1" ? "99,102,241" : card.color === "#10b981" ? "16,185,129" : "124,58,237"}, 0.1)`,
                display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center',
                color: card.color
              }}>
                <card.icon size={20} />
              </div>
            </div>
            <div className="stat-meta">
              <span className={`stat-trend ${card.trend.includes('+') ? 'trend-up' : 'trend-neutral'}`}>
                {card.trend.includes('+') && <ArrowUpRight size={10} />}
                {card.trend}
              </span>
              <span>since last cycle</span>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-grid">
        {/* Left Column: Activity & Insights */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <section className="panel" style={{ flex: 1 }}>
            <div className="panel-header">
              <h2 className="panel-title"><Zap size={16} color="var(--accent)" /> System Insights</h2>
              <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700 }}>AI Rules Engine</span>
            </div>
            <div className="panel-body" style={{ padding: 24 }}>
              <AdminInsights />
            </div>
          </section>

          <section className="panel" style={{ flex: 1 }}>
            <div className="panel-header">
              <h2 className="panel-title"><Activity size={16} color="var(--success)" /> Live System Feed</h2>
              <div className="admin-status-dot pulse-glow" style={{ width: 6, height: 6, background: 'var(--success)' }} />
            </div>
            <div className="panel-body" style={{ padding: 0 }}>
              <AdminLiveFeed />
            </div>
          </section>
        </div>

        {/* Right Column: Telemetry & Health */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <section className="panel">
            <div className="panel-header">
              <h2 className="panel-title"><Cpu size={16} color="var(--accent)" /> Core Telemetry</h2>
            </div>
            <div className="panel-body">
              {systemTelemetry.map((item) => (
                <div key={item.name} className="health-row" style={{ padding: '16px 24px' }}>
                  <div className="health-name">
                    <div className="health-dot" style={{ background: statusColor(item.status) }} />
                    <span>{item.name}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: statusColor(item.status) }}>
                      {item.status}
                    </span>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>
                      {item.latency}ms
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="panel" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.05) 0%, transparent 100%)' }}>
            <div className="panel-header" style={{ borderBottom: 'none' }}>
              <h2 className="panel-title"><ShieldCheck size={16} color="var(--accent)" /> Security Matrix</h2>
            </div>
            <div className="panel-body" style={{ padding: '0 24px 24px' }}>
              <div style={{ padding: 16, background: 'rgba(0,0,0,0.2)', borderRadius: 12, border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Threat Level</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--success)' }}>NOMINAL</span>
                </div>
                <div style={{ height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ width: '15%', height: '100%', background: 'var(--success)' }} />
                </div>
              </div>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 16, textAlign: 'center' }}>
                All security protocols active. No breaches detected in the last 24h.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
