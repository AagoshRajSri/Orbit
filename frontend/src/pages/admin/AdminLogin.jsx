import { useState, useEffect } from "react";
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
  "ENCRYPT :: AES-256-GCM active",
];

const IcoUser = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
  </svg>
);
const IcoLock = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

const CSS = `
  .alog-root {
    height: 100vh;
    overflow: hidden;
    display: grid;
    grid-template-columns: 1fr 1fr;
    background: #040507;
    font-family: 'Inter', -apple-system, sans-serif;
    -webkit-font-smoothing: antialiased;
  }
  @media (max-width: 900px) {
    .alog-root { grid-template-columns: 1fr; }
    .alog-left { display: none !important; }
  }

  /* ── Left dark panel ── */
  .alog-left {
    background: #06070d;
    border-right: 1px solid rgba(124,58,237,0.12);
    display: flex !important;
    flex-direction: column;
    justify-content: space-between;
    padding: 48px;
    position: relative;
    overflow: hidden;
    height: 100vh;
  }

  .alog-grid-bg {
    position: absolute; inset: 0;
    background-image: radial-gradient(rgba(124,58,237,0.25) 1px, transparent 1px);
    background-size: 28px 28px;
    mask-image: radial-gradient(ellipse at 30% 40%, black 30%, transparent 80%);
    pointer-events: none;
  }
  /* Purple glow in left panel */
  .alog-left-glow {
    position: absolute;
    width: 500px; height: 500px; border-radius: 50%;
    background: radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%);
    top: -100px; left: -100px;
    pointer-events: none;
    animation: alogGlow 8s ease-in-out infinite alternate;
  }
  @keyframes alogGlow {
    from { transform: scale(1); opacity: 0.8; }
    to   { transform: scale(1.2) translate(30px, 20px); opacity: 1; }
  }

  .alog-brand { position: relative; z-index: 1; }
  .alog-brand-badge {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 5px 10px; border-radius: 6px;
    background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.2);
    font-size: 9px; font-weight: 700; color: #ef4444;
    letter-spacing: 0.12em; text-transform: uppercase;
    margin-bottom: 20px;
    font-family: 'JetBrains Mono', monospace;
  }
  .alog-badge-dot {
    width: 5px; height: 5px; border-radius: 50%;
    background: #ef4444;
    box-shadow: 0 0 6px #ef4444;
    animation: alogBadgePulse 1.5s ease-in-out infinite;
  }
  @keyframes alogBadgePulse { 0%,100%{opacity:1} 50%{opacity:0.4} }

  .alog-brand-name {
    font-family: 'Syne', var(--font-header, sans-serif);
    font-size: 52px; font-weight: 800;
    color: #fff; letter-spacing: -0.04em;
    line-height: 1; margin-bottom: 8px;
  }
  .alog-brand-sub {
    font-size: 13px; font-weight: 600;
    color: rgba(124,58,237,0.7);
    text-transform: uppercase; letter-spacing: 0.14em;
  }

  /* Terminal widget */
  .alog-terminal {
    background: rgba(0,0,0,0.55);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 14px;
    overflow: hidden; position: relative; z-index: 1;
    font-family: 'JetBrains Mono', monospace;
    flex: 1; margin: 40px 0;
    display: flex; flex-direction: column;
  }
  .alog-terminal-bar {
    display: flex; align-items: center; gap: 6px;
    padding: 10px 16px;
    border-bottom: 1px solid rgba(255,255,255,0.05);
    background: rgba(255,255,255,0.02);
    flex-shrink: 0;
  }
  .alog-dot { width: 10px; height: 10px; border-radius: 50%; }
  .alog-dot.r { background: #ef4444; }
  .alog-dot.y { background: #f59e0b; }
  .alog-dot.g { background: #10b981; }
  .alog-terminal-title { font-size: 11px; color: rgba(255,255,255,0.3); margin-left: 8px; }
  .alog-terminal-body {
    padding: 20px; display: flex; flex-direction: column; gap: 10px;
    flex: 1; overflow: hidden;
  }
  .alog-log-line {
    display: flex; align-items: center; gap: 10px;
    font-size: 11px; transition: all 0.4s;
  }
  .alog-log-prefix { color: #7c3aed; }
  .alog-log-active { color: #a5f3fc; opacity: 1; }
  .alog-log-old { color: rgba(255,255,255,0.2); }
  .alog-log-future { color: rgba(255,255,255,0.07); }
  .alog-left-footer { font-size: 11px; color: rgba(255,255,255,0.2); position: relative; z-index: 1; font-family: 'JetBrains Mono', monospace; }

  /* ── Right form panel ── */
  .alog-right {
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    padding: 48px;
    background: #040507;
    height: 100vh;
    overflow: hidden;
    position: relative;
  }
  /* Subtle red tinted glow for classified feel */
  .alog-right-glow {
    position: absolute; pointer-events: none;
    width: 400px; height: 400px; border-radius: 50%;
    background: radial-gradient(circle, rgba(239,68,68,0.05) 0%, transparent 70%);
    top: 50%; left: 50%; transform: translate(-50%, -50%);
  }
  .alog-form-wrap { width: 100%; max-width: 360px; position: relative; z-index: 1; }

  .alog-eyebrow {
    display: flex; align-items: center; gap: 8px;
    font-size: 10px; font-weight: 700; color: #10b981;
    text-transform: uppercase; letter-spacing: 0.12em;
    margin-bottom: 28px;
    font-family: 'JetBrains Mono', monospace;
  }
  .alog-live-dot {
    width: 7px; height: 7px; border-radius: 50%;
    background: #10b981; box-shadow: 0 0 10px #10b981;
    animation: alogLivePulse 2s ease-in-out infinite;
  }
  @keyframes alogLivePulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(1.4)} }

  .alog-title {
    font-family: 'Syne', var(--font-header, sans-serif);
    font-size: 36px; font-weight: 800; color: #fff;
    letter-spacing: -0.03em; line-height: 1;
    margin-bottom: 8px;
  }
  .alog-subtitle { font-size: 13px; color: rgba(255,255,255,0.3); margin-bottom: 36px; font-family: 'JetBrains Mono', monospace; }

  .alog-form { display: flex; flex-direction: column; gap: 16px; }
  .alog-field { display: flex; flex-direction: column; gap: 7px; }
  .alog-label {
    font-size: 9.5px; font-weight: 700;
    color: rgba(255,255,255,0.32);
    text-transform: uppercase; letter-spacing: 0.1em;
    font-family: 'JetBrains Mono', monospace;
  }
  .alog-input-wrap { position: relative; }
  .alog-input-icon {
    position: absolute; left: 14px; top: 50%; transform: translateY(-50%);
    color: rgba(255,255,255,0.15); pointer-events: none;
    display: flex; align-items: center;
    transition: color 0.2s;
  }
  .alog-field:focus-within .alog-input-icon { color: rgba(124,58,237,0.7); }
  .alog-input {
    width: 100%; padding: 13px 16px 13px 42px;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 11px; color: #fff;
    font-size: 13.5px; outline: none;
    font-family: 'JetBrains Mono', monospace;
    transition: all 0.25s; box-sizing: border-box;
  }
  .alog-input::placeholder { color: rgba(255,255,255,0.15); }
  .alog-input:focus {
    border-color: rgba(124,58,237,0.5);
    background: rgba(124,58,237,0.04);
    box-shadow: 0 0 0 3px rgba(124,58,237,0.1);
  }

  .alog-btn {
    display: flex; align-items: center; justify-content: space-between;
    width: 100%; padding: 14px 20px;
    background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%);
    border: none; border-radius: 11px;
    color: #fff; font-size: 13px; font-weight: 700;
    cursor: pointer; margin-top: 6px;
    transition: all 0.25s;
    box-shadow: 0 8px 28px rgba(124,58,237,0.3);
    font-family: 'Inter', sans-serif; letter-spacing: 0.04em;
    position: relative; overflow: hidden;
  }
  .alog-btn-shine {
    position: absolute; inset: 0; pointer-events: none;
    background: linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.12) 50%, transparent 70%);
    animation: alogShine 4s ease-in-out infinite;
  }
  @keyframes alogShine { 0%,100%{transform:translateX(-120%)} 50%{transform:translateX(120%)} }
  .alog-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 12px 36px rgba(124,58,237,0.5);
  }
  .alog-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
  .alog-btn-arrow {
    width: 30px; height: 30px;
    background: rgba(255,255,255,0.12); border-radius: 7px;
    display: flex; align-items: center; justify-content: center;
    font-size: 16px; flex-shrink: 0;
  }
  .alog-spinner {
    display: inline-block; width: 14px; height: 14px;
    border: 2px solid rgba(255,255,255,0.2);
    border-top-color: #fff; border-radius: 50%;
    animation: alogSpin 0.6s linear infinite;
  }
  @keyframes alogSpin { to { transform: rotate(360deg); } }

  .alog-divider {
    display: flex; align-items: center; gap: 12px;
    margin: 20px 0 16px;
  }
  .alog-dline { flex: 1; height: 1px; background: rgba(255,255,255,0.05); }
  .alog-dtxt { font-size: 9px; color: rgba(255,255,255,0.15); letter-spacing: 0.1em; font-family: 'JetBrains Mono', monospace; }

  .alog-footer-row {
    display: flex; align-items: center; justify-content: space-between;
    margin-top: 20px;
  }
  .alog-back {
    font-size: 11.5px; color: rgba(255,255,255,0.25); text-decoration: none;
    font-family: 'JetBrains Mono', monospace; letter-spacing: 0.03em;
    transition: color 0.2s; display: flex; align-items: center; gap: 5px;
  }
  .alog-back:hover { color: rgba(255,255,255,0.5); }
  .alog-classified {
    display: flex; align-items: center; gap: 5px;
    font-size: 9px; font-weight: 700; color: rgba(239,68,68,0.4);
    text-transform: uppercase; letter-spacing: 0.1em;
    font-family: 'JetBrains Mono', monospace;
  }
`;

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
    <>
      <style>{CSS}</style>
      <div className="alog-root">

        {/* ── Left: branding + terminal ── */}
        <div className="alog-left">
          <div className="alog-grid-bg" />
          <div className="alog-left-glow" />

          <div className="alog-brand">
            <div className="alog-brand-badge">
              <div className="alog-badge-dot" />
              Classified Environment
            </div>
            <div style={{ marginBottom: 16 }}>
              <OrbitLogo size={52} />
            </div>
            <h1 className="alog-brand-name">Orbit</h1>
            <p className="alog-brand-sub">Command Center</p>
          </div>

          <div className="alog-terminal">
            <div className="alog-terminal-bar">
              <span className="alog-dot r" />
              <span className="alog-dot y" />
              <span className="alog-dot g" />
              <span className="alog-terminal-title">system.log — live</span>
            </div>
            <div className="alog-terminal-body">
              {LOGS.map((log, i) => (
                <div
                  key={i}
                  className={`alog-log-line ${
                    i === tick ? "alog-log-active" :
                    i < tick  ? "alog-log-old"    : "alog-log-future"
                  }`}
                >
                  <span className="alog-log-prefix">›</span>
                  <span>{log}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="alog-left-footer">Classified environment · v2.0.0 · {new Date().getFullYear()}</p>
        </div>

        {/* ── Right: form ── */}
        <div className="alog-right">
          <div className="alog-right-glow" />
          <div className="alog-form-wrap">

            <div className="alog-eyebrow">
              <div className="alog-live-dot" />
              System Operational
            </div>

            <h2 className="alog-title">Admin Access</h2>
            <p className="alog-subtitle">Restricted · Authorised personnel only</p>

            <form onSubmit={handleLogin} className="alog-form">
              <div className="alog-field">
                <label className="alog-label">Identifier</label>
                <div className="alog-input-wrap">
                  <span className="alog-input-icon"><IcoUser /></span>
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
              </div>

              <div className="alog-field">
                <label className="alog-label">Passphrase</label>
                <div className="alog-input-wrap">
                  <span className="alog-input-icon"><IcoLock /></span>
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
              </div>

              <button className="alog-btn" type="submit" disabled={isLoggingIn}>
                <div className="alog-btn-shine" />
                <span>{isLoggingIn ? <><span className="alog-spinner" /> Authenticating…</> : "Authenticate"}</span>
                <div className="alog-btn-arrow">→</div>
              </button>
            </form>

            <div className="alog-divider">
              <div className="alog-dline" />
              <span className="alog-dtxt">SECURE CHANNEL</span>
              <div className="alog-dline" />
            </div>

            <div className="alog-footer-row">
              <Link to="/login" className="alog-back">
                ← Return to user portal
              </Link>
              <span className="alog-classified">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                Classified
              </span>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
