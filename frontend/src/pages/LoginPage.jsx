import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useSoundManager } from "../hooks/useSoundManager";

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500&display=swap');

.lg-page {
  min-height: 100vh;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #06091a;
  font-family: 'JetBrains Mono', monospace;
  position: relative;
  overflow: hidden;
}

/* Ambient glows */
.lg-glow-a {
  position: absolute;
  width: 700px; height: 700px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(124,58,237,0.18) 0%, transparent 70%);
  top: -200px; left: -200px;
  pointer-events: none;
  animation: lgPulse 8s ease-in-out infinite alternate;
}
.lg-glow-b {
  position: absolute;
  width: 600px; height: 600px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(56,189,248,0.12) 0%, transparent 70%);
  bottom: -150px; right: -150px;
  pointer-events: none;
  animation: lgPulse 10s ease-in-out infinite alternate-reverse;
}
@keyframes lgPulse {
  from { transform: scale(1) translate(0, 0); }
  to   { transform: scale(1.15) translate(30px, -20px); }
}

/* Scanlines */
.lg-scanlines {
  position: absolute; inset: 0; pointer-events: none; z-index: 1;
  background: repeating-linear-gradient(
    0deg,
    transparent 0px, transparent 2px,
    rgba(255,255,255,0.012) 2px, rgba(255,255,255,0.012) 4px
  );
}

/* Card */
.lg-card {
  position: relative; z-index: 10;
  width: 400px;
  background: rgba(255,255,255,0.025);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 24px;
  padding: 48px 40px 44px;
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  box-shadow:
    0 0 0 1px rgba(255,255,255,0.03) inset,
    0 24px 64px rgba(0,0,0,0.6);
  animation: lgCardIn 0.5s cubic-bezier(0.16,1,0.3,1) both;
}
@keyframes lgCardIn {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* Top accent line */
.lg-card::before {
  content: '';
  position: absolute; top: 0; left: 20%; right: 20%; height: 1px;
  background: linear-gradient(90deg, transparent, rgba(124,58,237,0.9), rgba(56,189,248,0.9), transparent);
  border-radius: 9999px;
}

/* Brand */
.lg-brand {
  text-align: center; margin-bottom: 36px;
}
.lg-orbit-mark {
  width: 56px; height: 56px;
  margin: 0 auto 20px;
  position: relative;
  display: flex; align-items: center; justify-content: center;
}
.lg-orbit-ring {
  position: absolute; inset: 0; border-radius: 50%;
  border: 1px solid rgba(124,58,237,0.4);
  animation: lgSpin 12s linear infinite;
}
.lg-orbit-ring::before {
  content: '';
  position: absolute; top: -4px; left: 50%; transform: translateX(-50%);
  width: 8px; height: 8px; border-radius: 50%;
  background: #8b5cf6;
  box-shadow: 0 0 10px 2px rgba(139,92,246,0.8);
}
@keyframes lgSpin { to { transform: rotate(360deg); } }
.lg-orbit-core {
  width: 36px; height: 36px; border-radius: 50%;
  background: radial-gradient(circle at 35% 35%, rgba(139,92,246,0.3), rgba(56,189,248,0.08));
  border: 1px solid rgba(139,92,246,0.25);
  display: flex; align-items: center; justify-content: center;
}
.lg-h1 {
  font-family: 'Instrument Serif', serif;
  font-size: 32px; font-style: italic; font-weight: 400;
  color: #f0f4ff; margin: 0 0 8px;
  letter-spacing: -0.02em; line-height: 1;
}
.lg-sub {
  font-size: 9px; letter-spacing: 0.24em;
  color: rgba(255,255,255,0.22); text-transform: uppercase;
}

/* Fields */
.lg-field { margin-bottom: 16px; }
.lg-flabel {
  display: block; font-size: 9px; font-weight: 500;
  letter-spacing: 0.12em; text-transform: uppercase;
  color: rgba(255,255,255,0.3); margin-bottom: 8px;
}
.lg-finput-wrap { position: relative; }
.lg-finput {
  width: 100%; height: 52px; box-sizing: border-box;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.09);
  border-radius: 14px;
  padding: 0 16px 0 46px;
  color: #f0f4ff;
  font-family: 'JetBrains Mono', monospace;
  font-size: 13.5px; outline: none;
  transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
}
.lg-finput::placeholder { color: rgba(255,255,255,0.16); }
.lg-finput:focus {
  border-color: rgba(124,58,237,0.55);
  background: rgba(124,58,237,0.04);
  box-shadow: 0 0 0 3px rgba(124,58,237,0.09);
}
.lg-finput:-webkit-autofill,
.lg-finput:-webkit-autofill:focus {
  -webkit-box-shadow: 0 0 0 1000px #090c1c inset;
  -webkit-text-fill-color: #f0f4ff;
}
.lg-ficon {
  position: absolute; left: 15px; top: 50%; transform: translateY(-50%);
  color: rgba(255,255,255,0.2); transition: color 0.2s;
  display: flex; align-items: center; pointer-events: none;
}
.lg-field:focus-within .lg-ficon { color: rgba(139,92,246,0.7); }
.lg-feye {
  position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
  background: none; border: none; padding: 6px; cursor: pointer;
  color: rgba(255,255,255,0.2); display: flex; align-items: center;
  transition: color 0.2s;
}
.lg-feye:hover { color: rgba(255,255,255,0.5); }

/* Forgot */
.lg-forgot { text-align: right; margin-top: -8px; margin-bottom: 4px; }
.lg-forgot a {
  font-size: 9px; color: rgba(255,255,255,0.22);
  text-decoration: none; letter-spacing: 0.05em; transition: color 0.2s;
}
.lg-forgot a:hover { color: rgba(139,92,246,0.9); }

/* Submit */
.lg-submit {
  width: 100%; height: 54px; margin-top: 8px;
  background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%);
  border: none; border-radius: 14px;
  color: #fff; font-family: 'JetBrains Mono', monospace;
  font-size: 12.5px; font-weight: 500; letter-spacing: 0.1em;
  cursor: pointer; position: relative; overflow: hidden;
  transition: transform 0.15s, box-shadow 0.2s;
}
.lg-submit:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 10px 32px rgba(124,58,237,0.45), 0 4px 12px rgba(0,0,0,0.4);
}
.lg-submit:active:not(:disabled) { transform: translateY(0); }
.lg-submit:disabled { opacity: 0.45; cursor: not-allowed; }
.lg-submit-shine {
  position: absolute; inset: 0; pointer-events: none;
  background: linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.14) 50%, transparent 65%);
  animation: lgShine 3.5s ease-in-out infinite;
}
@keyframes lgShine { 0%, 100% { transform: translateX(-120%); } 45% { transform: translateX(130%); } }

/* Divider */
.lg-divider { display: flex; align-items: center; gap: 12px; margin: 24px 0 18px; }
.lg-dline { flex: 1; height: 1px; background: rgba(255,255,255,0.06); }
.lg-dtxt { font-size: 9px; color: rgba(255,255,255,0.14); letter-spacing: 0.12em; }

/* Alt */
.lg-alt { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 22px; }
.lg-alt-btn {
  height: 42px; display: flex; align-items: center; justify-content: center; gap: 6px;
  border-radius: 12px; border: 1px solid rgba(255,255,255,0.06);
  background: rgba(255,255,255,0.02);
  font-size: 8.5px; letter-spacing: 0.1em; color: rgba(255,255,255,0.15);
  cursor: not-allowed;
}

/* Footer */
.lg-footer { text-align: center; font-size: 10.5px; color: rgba(255,255,255,0.2); }
.lg-footer a { color: rgba(139,92,246,0.8); text-decoration: none; }
.lg-footer a:hover { text-decoration: underline; }

/* Spinner */
.lg-spinner {
  display: inline-block; vertical-align: middle;
  width: 13px; height: 13px; margin-right: 8px;
  border: 1.5px solid rgba(255,255,255,0.25);
  border-top-color: #fff; border-radius: 50%;
  animation: lgSpin 0.65s linear infinite;
}
`;

const IcoMail = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <rect x="2" y="4" width="20" height="16" rx="2"/>
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
  </svg>
);
const IcoLock = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <rect x="3" y="11" width="18" height="11" rx="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
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
    <div className="lg-page">
      <style>{CSS}</style>
      <div className="lg-glow-a" />
      <div className="lg-glow-b" />
      <div className="lg-scanlines" />

      <div className="lg-card">
        <div className="lg-brand">
          <div className="lg-orbit-mark">
            <div className="lg-orbit-ring" />
            <div className="lg-orbit-core">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"
                  stroke="rgba(139,92,246,0.85)" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
          </div>
          <h1 className="lg-h1">Welcome back</h1>
          <p className="lg-sub">Authenticate your session</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="lg-field">
            <label className="lg-flabel">Email</label>
            <div className="lg-finput-wrap">
              <span className="lg-ficon"><IcoMail /></span>
              <input
                className="lg-finput"
                type="email"
                placeholder="you@orbit.network"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                autoComplete="email"
              />
            </div>
          </div>

          <div className="lg-field">
            <label className="lg-flabel">Password</label>
            <div className="lg-finput-wrap">
              <span className="lg-ficon"><IcoLock /></span>
              <input
                className="lg-finput"
                type={showPw ? "text" : "password"}
                placeholder="••••••••••"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                style={{ paddingRight: 44 }}
                autoComplete="current-password"
              />
              <button type="button" className="lg-feye"
                onClick={() => { play?.("click"); setShowPw(p => !p); }}>
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <div className="lg-forgot">
            <Link to="/forgot-password">Forgot password?</Link>
          </div>

          <button type="submit" className="lg-submit" disabled={isLoggingIn}>
            <div className="lg-submit-shine" />
            {isLoggingIn
              ? <><span className="lg-spinner" />Verifying...</>
              : "Sign in to Orbit"}
          </button>
        </form>

        <div className="lg-divider">
          <div className="lg-dline" />
          <span className="lg-dtxt">OR</span>
          <div className="lg-dline" />
        </div>

        <div className="lg-alt">
          <div className="lg-alt-btn">✦ Constellation</div>
          <div className="lg-alt-btn">✧ Starweave</div>
        </div>

        <div className="lg-footer">
          No account?&nbsp;<Link to="/signup">Create one →</Link>
        </div>
      </div>
    </div>
  );
}
