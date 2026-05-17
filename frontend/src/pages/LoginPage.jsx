import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useSoundManager } from "../hooks/useSoundManager";

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Space+Grotesk:wght@400;500;600;700&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

.lp-page {
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #080514;
  position: relative;
  overflow: hidden;
  font-family: 'Inter', sans-serif;
  padding: 16px;
}

/* ── Animated background glows ── */
.lp-glow-1 {
  position: fixed; pointer-events: none;
  width: 420px; height: 420px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(124,58,237,0.28) 0%, transparent 65%);
  top: -120px; left: -80px;
  animation: lpFloat1 8s ease-in-out infinite;
}
.lp-glow-2 {
  position: fixed; pointer-events: none;
  width: 360px; height: 360px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(56,189,248,0.18) 0%, transparent 65%);
  bottom: -80px; right: -60px;
  animation: lpFloat2 11s ease-in-out infinite;
}
.lp-glow-3 {
  position: fixed; pointer-events: none;
  width: 200px; height: 200px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(236,72,153,0.14) 0%, transparent 65%);
  top: 50%; right: 10%;
  animation: lpFloat3 14s ease-in-out infinite;
}
@keyframes lpFloat1 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(30px,40px) scale(1.08)} }
@keyframes lpFloat2 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-20px,-30px) scale(1.06)} }
@keyframes lpFloat3 { 0%,100%{transform:translate(0,-50%) scale(1)} 50%{transform:translate(-15px,calc(-50% + 20px)) scale(1.12)} }

/* Grid lines overlay */
.lp-grid {
  position: fixed; inset: 0; pointer-events: none; z-index: 0;
  background-image:
    linear-gradient(rgba(124,58,237,0.035) 1px, transparent 1px),
    linear-gradient(90deg, rgba(124,58,237,0.035) 1px, transparent 1px);
  background-size: 44px 44px;
}

/* ── Card ── */
.lp-card {
  position: relative; z-index: 2;
  width: 100%; max-width: 420px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.09);
  border-radius: 24px;
  padding: 36px 32px 30px;
  backdrop-filter: blur(28px);
  box-shadow:
    0 0 0 1px rgba(124,58,237,0.12),
    0 32px 80px rgba(0,0,0,0.55),
    inset 0 1px 0 rgba(255,255,255,0.07);
}

/* Card top edge glow */
.lp-card::before {
  content: '';
  position: absolute; top: 0; left: 20%; right: 20%; height: 1px;
  background: linear-gradient(90deg, transparent, rgba(124,58,237,0.8), rgba(56,189,248,0.6), transparent);
  border-radius: 99px;
}

/* ── Logo ── */
.lp-logo {
  display: flex; align-items: center; gap: 10px;
  margin-bottom: 28px;
}
.lp-logo-icon {
  width: 36px; height: 36px; border-radius: 10px;
  background: linear-gradient(135deg, #7c3aed, #3b82f6);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 0 20px rgba(124,58,237,0.5);
}
.lp-logo-ring {
  width: 18px; height: 18px; border-radius: 50%;
  border: 2px solid rgba(255,255,255,0.9);
  position: relative;
}
.lp-logo-ring::before {
  content: '';
  position: absolute; top: -2px; left: 50%; transform: translateX(-50%);
  width: 5px; height: 5px; border-radius: 50%;
  background: white; box-shadow: 0 0 6px white;
  animation: lpOrbit 2.5s linear infinite;
  transform-origin: 50% calc(100% + 7px);
}
@keyframes lpOrbit { to { transform: translateX(-50%) rotate(360deg); } }
.lp-logo-text {
  display: flex; flex-direction: column;
}
.lp-logo-name {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 18px; font-weight: 700; letter-spacing: 0.04em;
  color: #fff; line-height: 1;
}
.lp-logo-sub {
  font-size: 10px; color: rgba(255,255,255,0.3);
  letter-spacing: 0.08em; margin-top: 2px;
}
.lp-status {
  margin-left: auto;
  display: flex; align-items: center; gap: 5px;
  font-size: 10px; font-weight: 500; letter-spacing: 0.06em;
  color: rgba(52,211,153,0.85);
  background: rgba(52,211,153,0.08);
  border: 1px solid rgba(52,211,153,0.18);
  border-radius: 99px;
  padding: 4px 10px;
}
.lp-status-dot {
  width: 5px; height: 5px; border-radius: 50%;
  background: #34d399;
  box-shadow: 0 0 6px #34d399;
  animation: lpPing 2s ease-in-out infinite;
}
@keyframes lpPing { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(1.6)} }

/* ── Heading ── */
.lp-heading {
  margin-bottom: 28px;
}
.lp-heading h1 {
  font-size: 28px; font-weight: 800; color: #fff;
  letter-spacing: -0.5px; line-height: 1.15;
  background: linear-gradient(135deg, #fff 0%, rgba(196,181,253,0.9) 100%);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  background-clip: text;
}
.lp-heading p {
  font-size: 13px; color: rgba(255,255,255,0.38);
  margin-top: 5px; letter-spacing: 0.01em;
}

/* ── Inputs ── */
.lp-field-group { display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px; }
.lp-field-wrap { position: relative; }
.lp-field-label {
  font-size: 11px; font-weight: 600; letter-spacing: 0.08em;
  text-transform: uppercase; color: rgba(255,255,255,0.35);
  margin-bottom: 7px; display: flex; align-items: center; justify-content: space-between;
}
.lp-field-label a {
  color: rgba(167,139,250,0.75); text-decoration: none;
  font-size: 11px; text-transform: none; letter-spacing: 0; font-weight: 500;
  transition: color 0.2s;
}
.lp-field-label a:hover { color: #a78bfa; }
.lp-field-input-wrap {
  position: relative; display: flex; align-items: center;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 14px;
  transition: border-color 0.25s, box-shadow 0.25s, background 0.25s;
  overflow: hidden;
}
.lp-field-input-wrap:focus-within {
  border-color: rgba(124,58,237,0.6);
  background: rgba(124,58,237,0.06);
  box-shadow: 0 0 0 3px rgba(124,58,237,0.12), 0 0 24px rgba(124,58,237,0.1);
}
.lp-field-ico {
  padding: 0 0 0 16px; color: rgba(255,255,255,0.2);
  display: flex; align-items: center; flex-shrink: 0;
  transition: color 0.25s;
}
.lp-field-input-wrap:focus-within .lp-field-ico { color: rgba(167,139,250,0.7); }
.lp-input {
  flex: 1; background: transparent; border: none; outline: none;
  color: #f0f4ff; font-family: 'Inter', sans-serif;
  font-size: 15px; font-weight: 400;
  padding: 14px 16px 14px 12px;
  caret-color: #a78bfa;
}
.lp-input::placeholder { color: rgba(255,255,255,0.16); }
.lp-eye-btn {
  background: none; border: none; padding: 0 16px; cursor: pointer;
  color: rgba(255,255,255,0.2); display: flex; align-items: center;
  transition: color 0.2s; height: 100%;
}
.lp-eye-btn:hover { color: rgba(255,255,255,0.55); }

/* ── Submit button ── */
.lp-submit {
  width: 100%; padding: 15px;
  border: none; border-radius: 14px; cursor: pointer;
  font-family: 'Inter', sans-serif;
  font-size: 15px; font-weight: 700;
  letter-spacing: 0.02em; color: #fff;
  background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 50%, #3b82f6 100%);
  position: relative; overflow: hidden;
  transition: opacity 0.25s, transform 0.2s, box-shadow 0.3s;
  box-shadow: 0 0 30px rgba(124,58,237,0.4), 0 8px 24px rgba(0,0,0,0.3);
  margin-bottom: 14px;
}
.lp-submit:not(:disabled):hover {
  box-shadow: 0 0 45px rgba(124,58,237,0.55), 0 8px 24px rgba(0,0,0,0.3);
  transform: translateY(-1px);
}
.lp-submit:not(:disabled):active { transform: translateY(0); }
.lp-submit:disabled { opacity: 0.45; cursor: not-allowed; }
/* Shimmer */
.lp-submit::after {
  content: '';
  position: absolute; inset: 0;
  background: linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.15) 50%, transparent 70%);
  transform: translateX(-100%);
  transition: transform 0.6s;
}
.lp-submit:not(:disabled):hover::after { transform: translateX(100%); }
.lp-submit-inner { display: flex; align-items: center; justify-content: center; gap: 8px; }

/* ── Alt methods ── */
.lp-divider {
  display: flex; align-items: center; gap: 12px;
  font-size: 11px; color: rgba(255,255,255,0.2);
  letter-spacing: 0.06em; margin-bottom: 14px;
}
.lp-divider::before, .lp-divider::after {
  content: ''; flex: 1; height: 1px;
  background: rgba(255,255,255,0.08);
}
.lp-alt-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.lp-alt-btn {
  display: flex; align-items: center; justify-content: center; gap: 7px;
  padding: 11px 8px;
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 12px;
  background: rgba(255,255,255,0.03);
  font-size: 12px; font-weight: 500;
  color: rgba(255,255,255,0.3);
  cursor: not-allowed;
  position: relative; overflow: hidden;
}
.lp-alt-badge {
  font-size: 9px; padding: 1px 5px;
  background: rgba(124,58,237,0.2);
  border: 1px solid rgba(124,58,237,0.3);
  border-radius: 99px; color: rgba(167,139,250,0.7);
}

/* ── Footer ── */
.lp-footer {
  margin-top: 22px; padding-top: 18px;
  border-top: 1px solid rgba(255,255,255,0.07);
  display: flex; align-items: center; justify-content: space-between;
  flex-wrap: wrap; gap: 8px;
}
.lp-footer-txt { font-size: 13px; color: rgba(255,255,255,0.35); }
.lp-footer-txt a {
  color: #a78bfa; text-decoration: none; font-weight: 600; transition: color 0.2s;
}
.lp-footer-txt a:hover { color: #c4b5fd; }
.lp-admin-link {
  display: flex; align-items: center; gap: 5px;
  font-size: 11px; letter-spacing: 0.05em;
  color: rgba(255,255,255,0.2); text-decoration: none;
  padding: 5px 10px; border: 1px solid rgba(255,255,255,0.07);
  border-radius: 8px; transition: all 0.2s;
}
.lp-admin-link:hover { color: rgba(239,68,68,0.7); border-color: rgba(239,68,68,0.2); }

/* ── Spinner ── */
.lp-spinner {
  width: 16px; height: 16px; border-radius: 50%;
  border: 2px solid rgba(255,255,255,0.25);
  border-top-color: #fff;
  animation: lpSpin 0.7s linear infinite; display: inline-block;
}
@keyframes lpSpin { to { transform: rotate(360deg); } }
`;

const IcoMail = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
  </svg>
);
const IcoLock = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);
const IcoShield = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);
const IcoArrow = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <path d="M5 12h14M13 6l6 6-6 6"/>
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
      <div className="lp-page">
        {/* Background elements */}
        <div className="lp-glow-1" />
        <div className="lp-glow-2" />
        <div className="lp-glow-3" />
        <div className="lp-grid" />

        <div className="lp-card">
          {/* Logo row */}
          <div className="lp-logo">
            <div className="lp-logo-icon">
              <div className="lp-logo-ring" />
            </div>
            <div className="lp-logo-text">
              <span className="lp-logo-name">Orbit</span>
              <span className="lp-logo-sub">ENCRYPTED · E2E</span>
            </div>
            <div className="lp-status">
              <div className="lp-status-dot" />
              LIVE
            </div>
          </div>

          {/* Heading */}
          <div className="lp-heading">
            <h1>Welcome back.</h1>
            <p>Sign in to your encrypted account</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="lp-field-group">
              <div className="lp-field-wrap">
                <div className="lp-field-label">Email address</div>
                <div className="lp-field-input-wrap">
                  <span className="lp-field-ico"><IcoMail /></span>
                  <input
                    className="lp-input" type="email" placeholder="you@orbit.network"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    autoComplete="email" required
                  />
                </div>
              </div>

              <div className="lp-field-wrap">
                <div className="lp-field-label">
                  <span>Password</span>
                  <Link to="/forgot-password">Forgot password?</Link>
                </div>
                <div className="lp-field-input-wrap">
                  <span className="lp-field-ico"><IcoLock /></span>
                  <input
                    className="lp-input" type={showPw ? "text" : "password"} placeholder="Enter your password"
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    autoComplete="current-password" required
                  />
                  <button type="button" className="lp-eye-btn" onClick={() => { play?.("click"); setShowPw(p => !p); }}>
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
            </div>

            <button type="submit" className="lp-submit" disabled={isLoggingIn}>
              <span className="lp-submit-inner">
                {isLoggingIn ? <><span className="lp-spinner" /> Authenticating…</> : <>Sign In to Orbit <IcoArrow /></>}
              </span>
            </button>
          </form>

          {/* Alt auth */}
          <div className="lp-divider">OR CONTINUE WITH</div>
          <div className="lp-alt-row">
            <button className="lp-alt-btn">
              ✦ Constellation <span className="lp-alt-badge">Soon</span>
            </button>
            <button className="lp-alt-btn">
              ✧ Starweave <span className="lp-alt-badge">Soon</span>
            </button>
          </div>

          {/* Footer */}
          <div className="lp-footer">
            <div className="lp-footer-txt">No account? <Link to="/signup">Create one →</Link></div>
            <Link to="/admin/login" className="lp-admin-link"><IcoShield /> Admin</Link>
          </div>
        </div>
      </div>
    </>
  );
}
