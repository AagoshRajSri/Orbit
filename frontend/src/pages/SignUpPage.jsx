import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useSoundManager } from "../hooks/useSoundManager";
import toast from "react-hot-toast";

/* ─────────────────────────────────────────────────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500&display=swap');

.orbit-auth-root {
  position: fixed; inset: 0;
  background: #050915;
  display: flex; align-items: center; justify-content: center;
  font-family: 'JetBrains Mono', monospace;
  overflow: hidden;
}

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
  padding: 40px 40px 36px;
  backdrop-filter: blur(32px);
  -webkit-backdrop-filter: blur(32px);
  box-shadow:
    0 0 0 1px rgba(255,255,255,0.02) inset,
    0 32px 80px rgba(0,0,0,0.5);
}
.orbit-card::before {
  content: '';
  position: absolute; top: 0; left: 15%; right: 15%; height: 1px;
  background: linear-gradient(90deg, transparent, rgba(56,189,248,0.8), rgba(139,92,246,0.8), transparent);
  border-radius: 9999px; filter: blur(0.5px);
}

/* Brand */
.orbit-brand {
  display: flex; flex-direction: column; align-items: center; margin-bottom: 30px;
}
.orbit-logo {
  width: 52px; height: 52px; margin-bottom: 18px;
  display: flex; align-items: center; justify-content: center; position: relative;
}
.orbit-logo-ring {
  position: absolute; inset: 0; border-radius: 50%;
  border: 1px solid rgba(56,189,248,0.35);
  animation: spinRing 10s linear infinite;
}
.orbit-logo-ring::after {
  content: '';
  position: absolute; top: -3px; left: 50%; transform: translateX(-50%);
  width: 6px; height: 6px; border-radius: 50%;
  background: #38bdf8;
  box-shadow: 0 0 12px #38bdf8, 0 0 24px #38bdf8;
}
@keyframes spinRing { to { transform: rotate(360deg); } }
.orbit-logo-inner {
  width: 34px; height: 34px; border-radius: 50%;
  background: radial-gradient(circle at 35% 35%, rgba(56,189,248,0.25), rgba(139,92,246,0.1));
  border: 1px solid rgba(56,189,248,0.3);
  display: flex; align-items: center; justify-content: center;
}

.orbit-heading {
  font-family: 'Instrument Serif', serif;
  font-size: 28px; font-style: italic; font-weight: 400;
  color: #f8fafc; margin: 0 0 6px; letter-spacing: -0.02em;
}
.orbit-tagline {
  font-size: 9px; letter-spacing: 0.22em;
  color: rgba(255,255,255,0.25); text-transform: uppercase;
}

/* Fields */
.orbit-field { position: relative; margin-bottom: 12px; }
.orbit-label {
  display: block; font-size: 9px; letter-spacing: 0.1em;
  color: rgba(255,255,255,0.3); margin-bottom: 6px; text-transform: uppercase;
}
.orbit-input-wrap { position: relative; }
.orbit-input {
  width: 100%; height: 50px; box-sizing: border-box;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 14px;
  padding: 0 16px 0 44px;
  color: #f8fafc; font-family: 'JetBrains Mono', monospace; font-size: 13px;
  outline: none; transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
}
.orbit-input::placeholder { color: rgba(255,255,255,0.18); }
.orbit-input:focus {
  border-color: rgba(56,189,248,0.5);
  background: rgba(56,189,248,0.03);
  box-shadow: 0 0 0 3px rgba(56,189,248,0.07);
}
.orbit-input:-webkit-autofill,
.orbit-input:-webkit-autofill:focus {
  -webkit-box-shadow: 0 0 0 1000px #0b0d18 inset;
  -webkit-text-fill-color: #f8fafc;
}
.orbit-input-ico {
  position: absolute; left: 14px; top: 50%; transform: translateY(-50%);
  color: rgba(255,255,255,0.2); transition: color 0.2s;
  display: flex; align-items: center; pointer-events: none;
}
.orbit-field:focus-within .orbit-input-ico { color: rgba(56,189,248,0.7); }
.orbit-eye-btn {
  position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
  background: none; border: none; color: rgba(255,255,255,0.2);
  cursor: pointer; display: flex; align-items: center; padding: 4px; transition: color 0.2s;
}
.orbit-eye-btn:hover { color: rgba(255,255,255,0.5); }

.orbit-hint {
  font-size: 9px; color: rgba(56,189,248,0.4);
  margin-top: 5px; display: block; letter-spacing: 0.05em;
}

/* Strength bar */
.orbit-strength { display: flex; gap: 4px; margin-top: 8px; }
.orbit-strength-seg {
  flex: 1; height: 2px; border-radius: 9999px;
  background: rgba(255,255,255,0.07); transition: background 0.35s;
}
.orbit-strength-label {
  font-size: 9px; letter-spacing: 0.12em; margin-top: 5px; transition: color 0.35s;
}

/* Submit */
.orbit-submit {
  width: 100%; height: 52px; margin-top: 12px;
  background: linear-gradient(135deg, #0ea5e9, #7c3aed);
  border: none; border-radius: 14px;
  color: #fff; font-family: 'JetBrains Mono', monospace;
  font-size: 12px; font-weight: 500; letter-spacing: 0.12em;
  cursor: pointer; position: relative; overflow: hidden;
  transition: transform 0.15s, box-shadow 0.2s;
}
.orbit-submit:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 8px 32px rgba(14,165,233,0.3), 0 2px 8px rgba(0,0,0,0.3);
}
.orbit-submit:active:not(:disabled) { transform: translateY(0); }
.orbit-submit:disabled { opacity: 0.5; cursor: not-allowed; }
.orbit-submit-shine {
  position: absolute; inset: 0;
  background: linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.12) 50%, transparent 70%);
  transform: translateX(-100%);
  animation: shine 3.5s ease infinite;
}
@keyframes shine { 0%,100% { transform: translateX(-100%); } 40% { transform: translateX(120%); } }

/* Divider */
.orbit-divider {
  display: flex; align-items: center; gap: 10px; margin: 20px 0 16px;
}
.orbit-divider-line { flex: 1; height: 1px; background: rgba(255,255,255,0.06); }
.orbit-divider span { font-size: 9px; color: rgba(255,255,255,0.15); letter-spacing: 0.1em; }

.orbit-alt { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px; }
.orbit-alt-btn {
  height: 40px; display: flex; align-items: center; justify-content: center; gap: 6px;
  border-radius: 12px; font-family: 'JetBrains Mono', monospace;
  font-size: 8px; letter-spacing: 0.1em;
  border: 1px solid rgba(255,255,255,0.06); background: rgba(255,255,255,0.02);
  color: rgba(255,255,255,0.15); cursor: not-allowed;
}

.orbit-footer { text-align: center; font-size: 10px; color: rgba(255,255,255,0.2); }
.orbit-footer a { color: rgba(56,189,248,0.8); text-decoration: none; }
.orbit-footer a:hover { text-decoration: underline; }

.orbit-spinner {
  display: inline-block; width: 13px; height: 13px; margin-right: 8px;
  border: 2px solid rgba(255,255,255,0.2); border-top-color: #fff;
  border-radius: 50%; animation: spin 0.6s linear infinite; vertical-align: middle;
}
@keyframes spin { to { transform: rotate(360deg); } }
`;

const validateForm = (f) => {
  if (!f.username.trim()) { toast.error("Username is required"); return false; }
  if (f.username.includes(" ")) { toast.error("No spaces in username"); return false; }
  if (!f.email.trim()) { toast.error("Email is required"); return false; }
  if (!/\S+@\S+\.\S+/.test(f.email)) { toast.error("Invalid email format"); return false; }
  if (!f.telegramId) { toast.error("Telegram ID required — get it from @userinfobot"); return false; }
  if (!/^\d+$/.test(f.telegramId)) { toast.error("Telegram ID must be numeric"); return false; }
  if (!f.password) { toast.error("Password required"); return false; }
  if (f.password.length < 8) { toast.error("Minimum 8 characters"); return false; }
  if (!/[A-Z]/.test(f.password)) { toast.error("Need at least one uppercase letter"); return false; }
  if (!/[0-9]/.test(f.password)) { toast.error("Need at least one number"); return false; }
  if (!/[^A-Za-z0-9]/.test(f.password)) { toast.error("Need at least one special character"); return false; }
  return true;
};

const pwScore = (p) => {
  if (!p) return 0;
  let s = 0;
  if (p.length >= 8)       s++;
  if (p.length >= 12)      s++;
  if (/[A-Z]/.test(p))     s++;
  if (/[0-9]/.test(p))     s++;
  if (/[^A-Za-z0-9]/.test(p)) s++;
  return s;
};
const STRENGTH = ["", "Weak", "Fair", "Good", "Strong", "Lethal"];
const STRENGTH_COLOR = ["", "#ef4444", "#f97316", "#eab308", "#22c55e", "#38bdf8"];

const UserIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
  </svg>
);
const MailIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
  </svg>
);
const SendIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
);
const LockIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

export default function SignUpPage() {
  const [form, setForm] = useState({ username: "", email: "", password: "", telegramId: "" });
  const [showPw, setShowPw] = useState(false);
  const { signup, isSigningUp } = useAuthStore();
  const { play } = useSoundManager();
  const navigate = useNavigate();

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    play?.("click");
    if (!validateForm(form)) return;
    const result = await signup(form);
    if (result?.success) navigate("/");
  };

  const score = pwScore(form.password);
  const color = STRENGTH_COLOR[score];

  return (
    <div className="orbit-auth-root">
      <style>{CSS}</style>

      {/* Orbs */}
      <div className="orbit-orb" style={{ width: 550, height: 550, top: "-25%", right: "-15%", background: "rgba(56,189,248,0.16)", "--tx": "-20px", "--ty": "20px", "--ts": "1.06", animationDuration: "20s" }} />
      <div className="orbit-orb" style={{ width: 450, height: 450, bottom: "-20%", left: "-15%", background: "rgba(124,58,237,0.14)", "--tx": "25px", "--ty": "-15px", "--ts": "1.1", animationDuration: "24s" }} />
      <div className="orbit-orb" style={{ width: 280, height: 280, top: "50%", left: "50%", background: "rgba(6,255,165,0.05)", "--tx": "15px", "--ty": "-25px", "--ts": "0.95", animationDuration: "28s" }} />

      <div className="orbit-card">
        {/* Logo */}
        <div className="orbit-brand">
          <div className="orbit-logo">
            <div className="orbit-logo-ring" />
            <div className="orbit-logo-inner">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"
                  stroke="rgba(56,189,248,0.9)" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
          </div>
          <h1 className="orbit-heading">Initialize node</h1>
          <p className="orbit-tagline">Create your Orbit identity</p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Username */}
          <div className="orbit-field">
            <label className="orbit-label">Username</label>
            <div className="orbit-input-wrap">
              <span className="orbit-input-ico"><UserIcon /></span>
              <input
                className="orbit-input"
                type="text"
                placeholder="your_alias"
                value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value.replace(/\s+/g, "").toLowerCase() }))}
              />
            </div>
          </div>

          {/* Email */}
          <div className="orbit-field">
            <label className="orbit-label">Email</label>
            <div className="orbit-input-wrap">
              <span className="orbit-input-ico"><MailIcon /></span>
              <input
                className="orbit-input"
                type="email"
                placeholder="you@orbit.network"
                value={form.email}
                onChange={set("email")}
                autoComplete="email"
              />
            </div>
          </div>

          {/* Telegram */}
          <div className="orbit-field">
            <label className="orbit-label">Telegram ID</label>
            <div className="orbit-input-wrap">
              <span className="orbit-input-ico"><SendIcon /></span>
              <input
                className="orbit-input"
                type="text"
                placeholder="123456789"
                value={form.telegramId}
                onChange={e => setForm(f => ({ ...f, telegramId: e.target.value.replace(/\D/g, "") }))}
              />
            </div>
            <span className="orbit-hint">Message @userinfobot on Telegram to get your ID</span>
          </div>

          {/* Password */}
          <div className="orbit-field">
            <label className="orbit-label">Password</label>
            <div className="orbit-input-wrap">
              <span className="orbit-input-ico"><LockIcon /></span>
              <input
                className="orbit-input"
                type={showPw ? "text" : "password"}
                placeholder="••••••••••"
                value={form.password}
                onChange={set("password")}
                style={{ paddingRight: 44 }}
                autoComplete="new-password"
              />
              <button type="button" className="orbit-eye-btn" onClick={() => { play?.("click"); setShowPw(p => !p); }}>
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {form.password && (
              <>
                <div className="orbit-strength">
                  {[1,2,3,4,5].map(i => (
                    <div key={i} className="orbit-strength-seg"
                      style={{ background: i <= score ? color : undefined }} />
                  ))}
                </div>
                <p className="orbit-strength-label" style={{ color }}>{STRENGTH[score]}</p>
              </>
            )}
          </div>

          <button type="submit" className="orbit-submit" disabled={isSigningUp}>
            <div className="orbit-submit-shine" />
            {isSigningUp ? <><span className="orbit-spinner" />Creating...</> : "Create Orbit Account"}
          </button>
        </form>

        <div className="orbit-divider">
          <div className="orbit-divider-line" />
          <span>or</span>
          <div className="orbit-divider-line" />
        </div>

        <div className="orbit-alt">
          <div className="orbit-alt-btn">✦ Constellation</div>
          <div className="orbit-alt-btn">✧ Starweave</div>
        </div>

        <div className="orbit-footer">
          Already have an account?&nbsp;<Link to="/login">Sign in →</Link>
        </div>
      </div>
    </div>
  );
}
