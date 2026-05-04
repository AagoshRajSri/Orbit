import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useSoundManager } from "../hooks/useSoundManager";

/* ─────────────────────────────────────────────────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@300;400;500&family=JetBrains+Mono:wght@400;500&display=swap');

.orbit-auth-root {
  position: fixed; inset: 0;
  background: #050915;
  display: flex; align-items: center; justify-content: center;
  font-family: 'JetBrains Mono', monospace;
  overflow: hidden;
}

/* Gradient orbs */
.orbit-orb {
  position: absolute; border-radius: 50%;
  filter: blur(120px); pointer-events: none;
  animation: orbFloat ease-in-out infinite alternate;
}
@keyframes orbFloat {
  from { transform: translate(0, 0) scale(1); }
  to   { transform: translate(var(--tx, 20px), var(--ty, -20px)) scale(var(--ts, 1.08)); }
}

/* Card */
.orbit-card {
  position: relative; z-index: 10;
  width: 400px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 28px;
  padding: 44px 40px 40px;
  backdrop-filter: blur(32px);
  -webkit-backdrop-filter: blur(32px);
  box-shadow:
    0 0 0 1px rgba(255,255,255,0.02) inset,
    0 32px 80px rgba(0,0,0,0.5);
}

/* Shimmer top border */
.orbit-card::before {
  content: '';
  position: absolute; top: 0; left: 15%; right: 15%; height: 1px;
  background: linear-gradient(90deg, transparent, rgba(139,92,246,0.8), rgba(56,189,248,0.8), transparent);
  border-radius: 9999px;
  filter: blur(0.5px);
}

/* Brand */
.orbit-brand {
  display: flex; flex-direction: column; align-items: center;
  margin-bottom: 36px;
}
.orbit-logo {
  width: 52px; height: 52px; margin-bottom: 20px;
  display: flex; align-items: center; justify-content: center;
  position: relative;
}
.orbit-logo-ring {
  position: absolute; inset: 0; border-radius: 50%;
  border: 1px solid rgba(139,92,246,0.35);
  animation: spinRing 10s linear infinite;
}
.orbit-logo-ring::after {
  content: '';
  position: absolute; top: -3px; left: 50%; transform: translateX(-50%);
  width: 6px; height: 6px; border-radius: 50%;
  background: #8b5cf6;
  box-shadow: 0 0 12px #8b5cf6, 0 0 24px #8b5cf6;
}
@keyframes spinRing { to { transform: rotate(360deg); } }
.orbit-logo-inner {
  width: 34px; height: 34px; border-radius: 50%;
  background: radial-gradient(circle at 35% 35%, rgba(139,92,246,0.3), rgba(56,189,248,0.1));
  border: 1px solid rgba(139,92,246,0.3);
  display: flex; align-items: center; justify-content: center;
}

.orbit-heading {
  font-family: 'Instrument Serif', serif;
  font-size: 30px; font-style: italic; font-weight: 400;
  color: #f8fafc; margin: 0 0 6px;
  letter-spacing: -0.02em;
}
.orbit-tagline {
  font-size: 9px; letter-spacing: 0.22em;
  color: rgba(255,255,255,0.25); text-transform: uppercase;
}

/* Inputs */
.orbit-field { position: relative; margin-bottom: 14px; }
.orbit-label {
  display: block; font-size: 9px; letter-spacing: 0.1em;
  color: rgba(255,255,255,0.35); margin-bottom: 7px; text-transform: uppercase;
}
.orbit-input-wrap { position: relative; }
.orbit-input {
  width: 100%; height: 50px; box-sizing: border-box;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 14px;
  padding: 0 16px 0 44px;
  color: #f8fafc; font-family: 'JetBrains Mono', monospace; font-size: 13.5px;
  outline: none; transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
}
.orbit-input::placeholder { color: rgba(255,255,255,0.18); }
.orbit-input:focus {
  border-color: rgba(139,92,246,0.6);
  background: rgba(139,92,246,0.04);
  box-shadow: 0 0 0 3px rgba(139,92,246,0.08);
}
.orbit-input:-webkit-autofill,
.orbit-input:-webkit-autofill:focus {
  -webkit-box-shadow: 0 0 0 1000px #0b0d18 inset;
  -webkit-text-fill-color: #f8fafc;
}
.orbit-input-ico {
  position: absolute; left: 14px; top: 50%;
  transform: translateY(-50%);
  color: rgba(255,255,255,0.2); transition: color 0.2s;
  display: flex; align-items: center; pointer-events: none;
}
.orbit-field:focus-within .orbit-input-ico { color: rgba(139,92,246,0.7); }
.orbit-eye-btn {
  position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
  background: none; border: none; color: rgba(255,255,255,0.2);
  cursor: pointer; display: flex; align-items: center; padding: 4px;
  transition: color 0.2s;
}
.orbit-eye-btn:hover { color: rgba(255,255,255,0.5); }

/* Forgot */
.orbit-forgot {
  text-align: right; margin: -6px 0 8px;
}
.orbit-forgot a {
  font-size: 9px; color: rgba(255,255,255,0.25);
  text-decoration: none; letter-spacing: 0.05em; transition: color 0.2s;
}
.orbit-forgot a:hover { color: rgba(139,92,246,0.8); }

/* Submit */
.orbit-submit {
  width: 100%; height: 52px; margin-top: 8px;
  background: linear-gradient(135deg, #7c3aed, #6d28d9);
  border: none; border-radius: 14px;
  color: #fff; font-family: 'JetBrains Mono', monospace;
  font-size: 12px; font-weight: 500; letter-spacing: 0.12em;
  cursor: pointer; position: relative; overflow: hidden;
  transition: transform 0.15s, box-shadow 0.2s;
}
.orbit-submit:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 8px 32px rgba(124,58,237,0.4), 0 2px 8px rgba(0,0,0,0.3);
}
.orbit-submit:active:not(:disabled) { transform: translateY(0); }
.orbit-submit:disabled { opacity: 0.5; cursor: not-allowed; }
.orbit-submit-shine {
  position: absolute; inset: 0;
  background: linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.12) 50%, transparent 70%);
  transform: translateX(-100%);
  animation: shine 3s ease infinite;
}
@keyframes shine { 0%, 100% { transform: translateX(-100%); } 40% { transform: translateX(120%); } }

/* Divider */
.orbit-divider {
  display: flex; align-items: center; gap: 10px; margin: 22px 0;
}
.orbit-divider-line { flex: 1; height: 1px; background: rgba(255,255,255,0.06); }
.orbit-divider span { font-size: 9px; color: rgba(255,255,255,0.15); letter-spacing: 0.1em; }

/* Alt auth */
.orbit-alt { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px; }
.orbit-alt-btn {
  height: 40px; display: flex; align-items: center; justify-content: center; gap: 6px;
  border-radius: 12px; font-family: 'JetBrains Mono', monospace;
  font-size: 8px; letter-spacing: 0.1em;
  border: 1px solid rgba(255,255,255,0.06);
  background: rgba(255,255,255,0.02);
  color: rgba(255,255,255,0.15); cursor: not-allowed;
}

/* Footer */
.orbit-footer {
  text-align: center; font-size: 10px;
  color: rgba(255,255,255,0.2);
}
.orbit-footer a { color: rgba(139,92,246,0.8); text-decoration: none; }
.orbit-footer a:hover { text-decoration: underline; }

/* Spinner */
.orbit-spinner {
  display: inline-block; width: 14px; height: 14px; margin-right: 8px;
  border: 2px solid rgba(255,255,255,0.2);
  border-top-color: #fff; border-radius: 50%;
  animation: spin 0.6s linear infinite; vertical-align: middle;
}
@keyframes spin { to { transform: rotate(360deg); } }
`;

const EMailIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <rect x="2" y="4" width="20" height="16" rx="2"/>
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
  </svg>
);
const LockIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <rect x="3" y="11" width="18" height="11" rx="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);
const StarIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
);
const SparkleIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5z"/></svg>
);

export default function LoginPage() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const { login, isLoggingIn } = useAuthStore();
  const { play } = useSoundManager();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    play?.("click");
    const result = await login(formData);
    if (result?.success) navigate("/");
  };

  return (
    <div className="orbit-auth-root">
      <style>{CSS}</style>

      {/* Ambient orbs */}
      <div className="orbit-orb" style={{ width: 600, height: 600, top: "-20%", left: "-20%", background: "rgba(124,58,237,0.18)", "--tx": "30px", "--ty": "-20px", "--ts": "1.06", animationDuration: "18s" }} />
      <div className="orbit-orb" style={{ width: 500, height: 500, bottom: "-20%", right: "-15%", background: "rgba(56,189,248,0.12)", "--tx": "-25px", "--ty": "15px", "--ts": "1.1", animationDuration: "22s" }} />
      <div className="orbit-orb" style={{ width: 300, height: 300, top: "40%", left: "60%", background: "rgba(6,255,165,0.06)", "--tx": "10px", "--ty": "-30px", "--ts": "0.95", animationDuration: "26s" }} />

      <div className="orbit-card">
        {/* Brand / Logo */}
        <div className="orbit-brand">
          <div className="orbit-logo">
            <div className="orbit-logo-ring" />
            <div className="orbit-logo-inner">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"
                  stroke="rgba(139,92,246,0.9)" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
          </div>
          <h1 className="orbit-heading">Welcome back</h1>
          <p className="orbit-tagline">Authenticate your session</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="orbit-field">
            <label className="orbit-label">Email address</label>
            <div className="orbit-input-wrap">
              <span className="orbit-input-ico"><EMailIcon /></span>
              <input
                className="orbit-input"
                type="email"
                placeholder="you@orbit.network"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                autoComplete="email"
              />
            </div>
          </div>

          <div className="orbit-field">
            <label className="orbit-label">Password</label>
            <div className="orbit-input-wrap">
              <span className="orbit-input-ico"><LockIcon /></span>
              <input
                className="orbit-input"
                type={showPw ? "text" : "password"}
                placeholder="••••••••••"
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
                style={{ paddingRight: 44 }}
                autoComplete="current-password"
              />
              <button type="button" className="orbit-eye-btn" onClick={() => { play?.("click"); setShowPw(p => !p); }}>
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <div className="orbit-forgot">
            <Link to="/forgot-password">Forgot password?</Link>
          </div>

          <button type="submit" className="orbit-submit" disabled={isLoggingIn}>
            <div className="orbit-submit-shine" />
            {isLoggingIn ? <><span className="orbit-spinner" />Verifying...</> : "Sign in to Orbit"}
          </button>
        </form>

        <div className="orbit-divider">
          <div className="orbit-divider-line" />
          <span>or</span>
          <div className="orbit-divider-line" />
        </div>

        <div className="orbit-alt">
          <div className="orbit-alt-btn"><SparkleIcon /> Constellation</div>
          <div className="orbit-alt-btn"><StarIcon /> Starweave</div>
        </div>

        <div className="orbit-footer">
          No account?&nbsp;<Link to="/signup">Create one →</Link>
        </div>
      </div>
    </div>
  );
}
