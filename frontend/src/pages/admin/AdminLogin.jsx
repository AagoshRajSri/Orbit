import React, { useState, useEffect } from "react";
import { useAdminStore } from "../../store/useAdminStore.js";
import { useNavigate, Link } from "react-router-dom";
import OrbitLogo from "../../components/common/OrbitLogo";
import "./admin.css";

const LOGS = [
  "AUTH_LAYER :: TLS 1.3 handshake complete",
  "NODE_01 :: Replica set healthy",
  "MONITOR :: 0 anomalies detected",
  "CACHE :: 98.4% hit ratio",
  "SOCKET :: 2 connections live",
  "RATE_LIMITER :: 0 throttles active",
  "AUDIT :: Last login 2h ago",
];

export default function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [tick, setTick] = useState(0);
  const { login, isLoggingIn } = useAdminStore();
  const navigate = useNavigate();

  useEffect(() => {
    const t = setInterval(() => setTick(n => (n + 1) % LOGS.length), 2200);
    return () => clearInterval(t);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    const ok = await login(username, password);
    if (ok) navigate("/admin/dashboard");
  };

  return (
    <div className="alog-root">
      {/* Left panel */}
      <div className="alog-left">
        <div className="alog-grid-bg" />
        <div className="alog-brand">
          <div className="alog-logo" style={{ background: 'none', boxShadow: 'none' }}>
            <OrbitLogo size={56} />
          </div>
          <h1 className="alog-brand-name">Orbit</h1>
          <p className="alog-brand-sub">Command Center</p>
        </div>
        <div className="alog-terminal">
          <div className="alog-terminal-bar">
            <span className="alog-dot r" /><span className="alog-dot y" /><span className="alog-dot g" />
            <span className="alog-terminal-title">system.log</span>
          </div>
          <div className="alog-terminal-body">
            {LOGS.map((log, i) => (
              <div
                key={i}
                className={`alog-log-line ${i === tick ? "alog-log-active" : i < tick ? "alog-log-old" : "alog-log-future"}`}
              >
                <span className="alog-log-prefix">›</span>
                <span>{log}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="alog-left-footer">Classified environment · v2.0.0</p>
      </div>

      {/* Right panel */}
      <div className="alog-right">
        <div className="alog-form-wrap">
          <div className="alog-eyebrow">
            <div className="alog-live-dot" />
            <span>System Operational</span>
          </div>

          <h2 className="alog-title">Admin Access</h2>
          <p className="alog-subtitle">Enter credentials to authenticate</p>

          <form onSubmit={handleLogin} className="alog-form">
            <div className="alog-field">
              <label className="alog-label">Identifier</label>
              <input
                className="alog-input"
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="admin_id"
                required
                autoComplete="username"
                spellCheck={false}
              />
            </div>
            <div className="alog-field">
              <label className="alog-label">Passphrase</label>
              <input
                className="alog-input"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>

            <button className="alog-btn" type="submit" disabled={isLoggingIn}>
              <span>{isLoggingIn ? "Authenticating..." : "Authenticate"}</span>
              <div className="alog-btn-arrow">→</div>
            </button>
          </form>

          <Link to="/login" className="alog-back">← Return to user portal</Link>
        </div>
      </div>
    </div>
  );
}
