import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useSoundManager } from "../hooks/useSoundManager";

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500;700&display=swap');

.lp-root {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 32px 52px 28px;
  box-sizing: border-box;
  position: relative;
  overflow: hidden;
  font-family: 'JetBrains Mono', monospace;
}
/* Corner reticles */
.lp-root::before, .lp-root::after {
  content: '';
  position: absolute;
  width: 16px; height: 16px;
  border-color: rgba(109,40,217,0.35);
  border-style: solid;
}
.lp-root::before { top: 20px; left: 20px; border-width: 2px 0 0 2px; }
.lp-root::after  { bottom: 20px; right: 20px; border-width: 0 2px 2px 0; }

/* ── Compact header ── */
.lp-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  margin-bottom: 20px;
}
.lp-logo-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.lp-ring {
  width: 28px; height: 28px; border-radius: 50%;
  border: 1.5px solid rgba(109,40,217,0.5);
  position: relative; display: flex; align-items: center; justify-content: center;
  animation: lpSpin 14s linear infinite; flex-shrink: 0;
}
.lp-ring::before {
  content: '';
  position: absolute; top: -3px; left: 50%; transform: translateX(-50%);
  width: 5px; height: 5px; border-radius: 50%;
  background: #7c3aed; box-shadow: 0 0 7px 2px rgba(124,58,237,0.9);
}
@keyframes lpSpin { to { transform: rotate(360deg); } }
.lp-logo-text {
  display: flex; flex-direction: column; gap: 1px;
}
.lp-logo-name {
  font-size: 13px; font-weight: 700; letter-spacing: 0.22em;
  color: rgba(255,255,255,0.7); text-transform: uppercase;
}
.lp-logo-sub {
  font-size: 8px; color: rgba(255,255,255,0.18); letter-spacing: 0.14em; text-transform: uppercase;
}
.lp-status-dot {
  display: flex; align-items: center; gap: 6px;
  font-size: 8.5px; letter-spacing: 0.12em; color: rgba(16,185,129,0.7); text-transform: uppercase;
}
.lp-status-dot::before {
  content: ''; width: 5px; height: 5px; border-radius: 50%;
  background: #10b981; box-shadow: 0 0 7px #10b981;
  animation: lpPing 2s ease-in-out infinite;
}
@keyframes lpPing { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.3;transform:scale(1.5)} }

/* ── Divider ── */
.lp-divline {
  height: 1px; flex-shrink: 0;
  background: linear-gradient(90deg, rgba(109,40,217,0.7) 0%, rgba(56,189,248,0.2) 60%, transparent 100%);
  margin-bottom: 22px; position: relative;
}
.lp-divline::after {
  content: 'AUTH';
  position: absolute; right: 0; top: -9px;
  font-size: 7.5px; letter-spacing: 0.18em; color: rgba(109,40,217,0.45);
}

/* ── Headline ── */
.lp-headline { flex-shrink: 0; margin-bottom: 26px; }
.lp-headline-h1 {
  font-family: 'Instrument Serif', serif;
  font-size: clamp(36px, 4vw, 58px);
  font-weight: 400; font-style: italic;
  color: #f0f4ff; line-height: 0.95; letter-spacing: -0.02em; margin: 0 0 8px;
}
.lp-headline-sub {
  font-size: 9.5px; color: rgba(255,255,255,0.45);
  letter-spacing: 0.18em; text-transform: uppercase;
  display: flex; align-items: center; gap: 10px;
}
.lp-headline-sub::after {
  content: ''; flex: 1; height: 1px;
  background: linear-gradient(90deg, rgba(255,255,255,0.06), transparent);
}

/* ── Fields ── */
.lp-form { display: flex; flex-direction: column; flex-shrink: 0; }
.lp-field {
  position: relative;
  border-bottom: 1px solid rgba(255,255,255,0.07);
  padding: 16px 0;
  transition: border-color 0.2s;
}
.lp-field:focus-within { border-bottom-color: rgba(109,40,217,0.5); }
.lp-field:first-child { border-top: 1px solid rgba(255,255,255,0.07); }
.lp-field::after {
  content: ''; position: absolute; bottom: -1px; left: 0;
  width: 0; height: 1px;
  background: linear-gradient(90deg, #7c3aed, #38bdf8);
  transition: width 0.35s cubic-bezier(0.4,0,0.2,1);
}
.lp-field:focus-within::after { width: 100%; }
.lp-field-label {
  font-size: 8px; font-weight: 700; letter-spacing: 0.18em;
  text-transform: uppercase; color: rgba(255,255,255,0.85);
  margin-bottom: 8px; display: flex; align-items: center; justify-content: space-between;
}
.lp-field-label a {
  color: rgba(109,40,217,0.65); text-decoration: none; font-size: 7.5px; transition: color 0.2s;
}
.lp-field-label a:hover { color: #8b5cf6; }
.lp-field-inner { display: flex; align-items: center; gap: 14px; }
.lp-field-icon {
  color: rgba(255,255,255,0.12); flex-shrink: 0; display: flex; align-items: center; transition: color 0.2s;
}
.lp-field:focus-within .lp-field-icon { color: rgba(109,40,217,0.65); }
.lp-input {
  flex: 1; background: transparent; border: none; outline: none;
  color: #ffffff; font-family: 'JetBrains Mono', monospace;
  font-size: clamp(17px, 1.8vw, 23px); caret-color: #7c3aed; padding: 0;
}
.lp-input::placeholder { color: rgba(255,255,255,0.08); }
.lp-eye {
  background: none; border: none; padding: 4px; cursor: pointer;
  color: rgba(255,255,255,0.13); display: flex; align-items: center; transition: color 0.2s;
}
.lp-eye:hover { color: rgba(255,255,255,0.45); }

/* ══════════════════════════════════════════════════
   CREATIVE SUBMIT BUTTON — slash-track style
═══════════════════════════════════════════════════ */
.lp-submit-wrap {
  margin-top: 26px;
  flex-shrink: 0;
  position: relative;
}
.lp-submit {
  width: 100%;
  height: 54px;
  background: rgba(109,40,217,0.06);
  border: 1px solid rgba(109,40,217,0.22);
  border-left: 3px solid #7c3aed;
  border-radius: 0;
  display: flex;
  align-items: center;
  padding: 0 18px 0 22px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: background 0.25s, border-color 0.25s, box-shadow 0.3s;
  gap: 14px;
}
.lp-submit:disabled { opacity: 0.35; cursor: not-allowed; }
.lp-submit:not(:disabled):hover {
  background: rgba(109,40,217,0.11);
  border-color: rgba(109,40,217,0.55);
  border-left-color: #a78bfa;
  box-shadow: 0 0 36px rgba(109,40,217,0.18), inset 0 0 24px rgba(109,40,217,0.06);
}
/* Sweeping light on hover */
.lp-submit::before {
  content: '';
  position: absolute; inset: 0;
  background: linear-gradient(105deg, transparent 25%, rgba(255,255,255,0.045) 50%, transparent 75%);
  transform: translateX(-120%);
  transition: transform 0s;
}
.lp-submit:not(:disabled):hover::before {
  transform: translateX(120%);
  transition: transform 0.6s ease;
}
.lp-submit-text {
  flex: 1; text-align: left;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px; font-weight: 700;
  letter-spacing: 0.22em; text-transform: uppercase;
  color: rgba(255,255,255,0.85);
}
/* The creative right "execute" element — a diamond/circle that glows */
.lp-submit-execute {
  width: 34px; height: 34px; flex-shrink: 0;
  border-radius: 50%;
  border: 1px solid rgba(109,40,217,0.4);
  display: flex; align-items: center; justify-content: center;
  color: rgba(139,92,246,0.8);
  font-size: 14px;
  transition: all 0.25s;
  position: relative;
}
/* Rotating outer ring on hover */
.lp-submit-execute::after {
  content: '';
  position: absolute; inset: -4px;
  border-radius: 50%;
  border: 1px dashed rgba(109,40,217,0.0);
  transition: border-color 0.3s, transform 0.3s;
}
.lp-submit:not(:disabled):hover .lp-submit-execute {
  background: rgba(109,40,217,0.18);
  border-color: #8b5cf6;
  box-shadow: 0 0 14px rgba(109,40,217,0.5);
  color: #c4b5fd;
}
.lp-submit:not(:disabled):hover .lp-submit-execute::after {
  border-color: rgba(109,40,217,0.4);
  transform: rotate(45deg);
}

.lp-spinner {
  width: 13px; height: 13px; border: 2px solid rgba(255,255,255,0.15);
  border-top-color: rgba(255,255,255,0.7); border-radius: 50%;
  animation: lpSpin 0.7s linear infinite; display: inline-block;
}

/* ── Alt chips (compact) ── */
.lp-alt-row { display: flex; gap: 10px; margin-top: 14px; flex-shrink: 0; }
.lp-alt-chip {
  flex: 1; height: 38px;
  display: flex; align-items: center; justify-content: space-between; padding: 0 14px;
  border: 1px solid rgba(255,255,255,0.05); border-left: 2px solid rgba(255,255,255,0.05);
  font-size: 9px; letter-spacing: 0.07em; color: rgba(255,255,255,0.18);
  cursor: not-allowed; background: rgba(255,255,255,0.008);
}
.lp-chip-badge {
  font-size: 7px; padding: 2px 6px;
  background: rgba(109,40,217,0.1); color: rgba(109,40,217,0.6);
}

/* ── Footer ── */
.lp-footer {
  margin-top: auto;
  padding-top: 18px;
  display: flex; align-items: center; justify-content: space-between;
  flex-shrink: 0;
  border-top: 1px solid rgba(255,255,255,0.05);
}
.lp-footer-left { font-size: 11px; color: rgba(255,255,255,0.45); }
.lp-footer-left a { color: #7c3aed; text-decoration: none; font-weight: 700; transition: color 0.2s; }
.lp-footer-left a:hover { color: #a78bfa; }
.lp-admin-link {
  display: flex; align-items: center; gap: 6px;
  font-size: 8.5px; letter-spacing: 0.1em;
  color: rgba(255,255,255,0.15); text-decoration: none; text-transform: uppercase;
  padding: 6px 10px; border: 1px solid rgba(255,255,255,0.05); transition: all 0.2s;
}
.lp-admin-link:hover { color: rgba(239,68,68,0.65); border-color: rgba(239,68,68,0.18); }
`;

const IcoMail = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
    <rect x="2" y="4" width="20" height="16" rx="2"/>
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
  </svg>
);
const IcoLock = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);
const IcoShield = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);

export default function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const { login, isLoggingIn } = useAuthStore();
  const { play } = useSoundManager();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    play?.("click");
    const result = await login(form);
    if (result?.success) navigate("/");
  };

  return (
    <>
      <style>{CSS}</style>
      <div className="lp-root">

        {/* ── Compact header: logo + status ── */}
        <div className="lp-header">
          <div className="lp-logo-row">
            <div className="lp-ring">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"
                  stroke="rgba(124,58,237,0.8)" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="lp-logo-text">
              <span className="lp-logo-name">Orbit</span>
              <span className="lp-logo-sub">Encrypted · Decentralized</span>
            </div>
          </div>
          <div className="lp-status-dot">Node online</div>
        </div>

        {/* ── Divider ── */}
        <div className="lp-divline" />

        {/* ── Headline ── */}
        <div className="lp-headline">
          <h1 className="lp-headline-h1">Welcome back.</h1>
          <div className="lp-headline-sub">Authenticate your session</div>
        </div>

        {/* ── Form ── */}
        <form className="lp-form" onSubmit={handleSubmit}>
          <div className="lp-field">
            <div className="lp-field-label">Email address</div>
            <div className="lp-field-inner">
              <span className="lp-field-icon"><IcoMail /></span>
              <input
                className="lp-input" type="email" placeholder="you@orbit.network"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                autoComplete="email" required
              />
            </div>
          </div>

          <div className="lp-field">
            <div className="lp-field-label">
              <span>Password</span>
              <Link to="/forgot-password">Forgot?</Link>
            </div>
            <div className="lp-field-inner">
              <span className="lp-field-icon"><IcoLock /></span>
              <input
                className="lp-input" type={showPw ? "text" : "password"} placeholder="••••••••••••"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                autoComplete="current-password" required
              />
              <button type="button" className="lp-eye"
                onClick={() => { play?.("click"); setShowPw(p => !p); }}>
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* ── Creative submit button ── */}
          <div className="lp-submit-wrap">
            <button type="submit" className="lp-submit" disabled={isLoggingIn}>
              <span className="lp-submit-text">
                {isLoggingIn ? <><span className="lp-spinner" style={{ marginRight: 10 }} />Verifying…</> : "Sign in to Orbit"}
              </span>
              <div className="lp-submit-execute">
                {isLoggingIn ? <span className="lp-spinner" style={{ width: 12, height: 12 }} /> : "→"}
              </div>
            </button>
          </div>
        </form>

        {/* ── Alt chips ── */}
        <div className="lp-alt-row">
          <div className="lp-alt-chip"><span>✦ Constellation</span><span className="lp-chip-badge">Soon</span></div>
          <div className="lp-alt-chip"><span>✧ Starweave</span><span className="lp-chip-badge">Soon</span></div>
        </div>

        {/* ── Footer ── */}
        <div className="lp-footer">
          <div className="lp-footer-left">No account?&nbsp;<Link to="/signup">Create one →</Link></div>
          <Link to="/admin/login" className="lp-admin-link"><IcoShield /> Admin Panel</Link>
        </div>

      </div>
    </>
  );
}
