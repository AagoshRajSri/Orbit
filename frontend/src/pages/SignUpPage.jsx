import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useSoundManager } from "../hooks/useSoundManager";
import toast from "react-hot-toast";

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500&display=swap');

.su-page {
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

.su-glow-a {
  position: absolute;
  width: 700px; height: 700px; border-radius: 50%;
  background: radial-gradient(circle, rgba(56,189,248,0.15) 0%, transparent 70%);
  top: -200px; right: -200px; pointer-events: none;
  animation: suPulse 9s ease-in-out infinite alternate;
}
.su-glow-b {
  position: absolute;
  width: 600px; height: 600px; border-radius: 50%;
  background: radial-gradient(circle, rgba(124,58,237,0.14) 0%, transparent 70%);
  bottom: -150px; left: -150px; pointer-events: none;
  animation: suPulse 11s ease-in-out infinite alternate-reverse;
}
@keyframes suPulse {
  from { transform: scale(1) translate(0, 0); }
  to   { transform: scale(1.12) translate(-20px, 25px); }
}

.su-scanlines {
  position: absolute; inset: 0; pointer-events: none; z-index: 1;
  background: repeating-linear-gradient(
    0deg,
    transparent 0px, transparent 2px,
    rgba(255,255,255,0.01) 2px, rgba(255,255,255,0.01) 4px
  );
}

/* Card */
.su-card {
  position: relative; z-index: 10;
  width: 420px;
  background: rgba(255,255,255,0.025);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 24px;
  padding: 44px 40px 40px;
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  box-shadow:
    0 0 0 1px rgba(255,255,255,0.03) inset,
    0 24px 64px rgba(0,0,0,0.6);
  animation: suCardIn 0.55s cubic-bezier(0.16,1,0.3,1) both;
}
@keyframes suCardIn {
  from { opacity: 0; transform: translateY(18px); }
  to   { opacity: 1; transform: translateY(0); }
}
.su-card::before {
  content: '';
  position: absolute; top: 0; left: 20%; right: 20%; height: 1px;
  background: linear-gradient(90deg, transparent, rgba(56,189,248,0.9), rgba(124,58,237,0.9), transparent);
  border-radius: 9999px;
}

/* Brand */
.su-brand { text-align: center; margin-bottom: 28px; }
.su-orbit-mark {
  width: 56px; height: 56px; margin: 0 auto 18px;
  position: relative; display: flex; align-items: center; justify-content: center;
}
.su-orbit-ring {
  position: absolute; inset: 0; border-radius: 50%;
  border: 1px solid rgba(56,189,248,0.4);
  animation: suSpin 10s linear infinite;
}
.su-orbit-ring::before {
  content: '';
  position: absolute; top: -4px; left: 50%; transform: translateX(-50%);
  width: 8px; height: 8px; border-radius: 50%;
  background: #38bdf8;
  box-shadow: 0 0 10px 2px rgba(56,189,248,0.8);
}
@keyframes suSpin { to { transform: rotate(360deg); } }
.su-orbit-core {
  width: 36px; height: 36px; border-radius: 50%;
  background: radial-gradient(circle at 35% 35%, rgba(56,189,248,0.25), rgba(124,58,237,0.1));
  border: 1px solid rgba(56,189,248,0.25);
  display: flex; align-items: center; justify-content: center;
}
.su-h1 {
  font-family: 'Instrument Serif', serif;
  font-size: 30px; font-style: italic; font-weight: 400;
  color: #f0f4ff; margin: 0 0 8px;
  letter-spacing: -0.02em; line-height: 1;
}
.su-sub {
  font-size: 9px; letter-spacing: 0.22em;
  color: rgba(255,255,255,0.22); text-transform: uppercase;
}

/* Fields */
.su-field { margin-bottom: 13px; }
.su-flabel {
  display: block; font-size: 9px; font-weight: 500;
  letter-spacing: 0.12em; text-transform: uppercase;
  color: rgba(255,255,255,0.28); margin-bottom: 7px;
}
.su-finput-wrap { position: relative; }
.su-finput {
  width: 100%; height: 48px; box-sizing: border-box;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.09);
  border-radius: 13px;
  padding: 0 16px 0 44px;
  color: #f0f4ff;
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px; outline: none;
  transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
}
.su-finput::placeholder { color: rgba(255,255,255,0.15); }
.su-finput:focus {
  border-color: rgba(56,189,248,0.5);
  background: rgba(56,189,248,0.03);
  box-shadow: 0 0 0 3px rgba(56,189,248,0.08);
}
.su-finput:-webkit-autofill,
.su-finput:-webkit-autofill:focus {
  -webkit-box-shadow: 0 0 0 1000px #090c1c inset;
  -webkit-text-fill-color: #f0f4ff;
}
.su-ficon {
  position: absolute; left: 14px; top: 50%; transform: translateY(-50%);
  color: rgba(255,255,255,0.18); transition: color 0.2s;
  display: flex; align-items: center; pointer-events: none;
}
.su-field:focus-within .su-ficon { color: rgba(56,189,248,0.7); }
.su-feye {
  position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
  background: none; border: none; padding: 6px; cursor: pointer;
  color: rgba(255,255,255,0.18); display: flex; align-items: center;
  transition: color 0.2s;
}
.su-feye:hover { color: rgba(255,255,255,0.5); }

.su-hint {
  font-size: 9px; color: rgba(56,189,248,0.4);
  margin-top: 5px; display: block; letter-spacing: 0.04em;
}

/* Strength */
.su-strength { display: flex; gap: 4px; margin-top: 8px; }
.su-strength-seg {
  flex: 1; height: 2px; border-radius: 99px;
  background: rgba(255,255,255,0.07); transition: background 0.35s;
}
.su-strength-txt {
  font-size: 9px; letter-spacing: 0.12em;
  margin-top: 5px; transition: color 0.35s;
}

/* Submit */
.su-submit {
  width: 100%; height: 52px; margin-top: 10px;
  background: linear-gradient(135deg, #0ea5e9 0%, #7c3aed 100%);
  border: none; border-radius: 13px;
  color: #fff; font-family: 'JetBrains Mono', monospace;
  font-size: 12.5px; font-weight: 500; letter-spacing: 0.1em;
  cursor: pointer; position: relative; overflow: hidden;
  transition: transform 0.15s, box-shadow 0.2s;
}
.su-submit:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 10px 32px rgba(14,165,233,0.3), 0 4px 12px rgba(0,0,0,0.4);
}
.su-submit:active:not(:disabled) { transform: translateY(0); }
.su-submit:disabled { opacity: 0.45; cursor: not-allowed; }
.su-submit-shine {
  position: absolute; inset: 0; pointer-events: none;
  background: linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.13) 50%, transparent 65%);
  animation: suShine 4s ease-in-out infinite;
}
@keyframes suShine { 0%, 100% { transform: translateX(-120%); } 45% { transform: translateX(130%); } }

.su-divider { display: flex; align-items: center; gap: 12px; margin: 20px 0 16px; }
.su-dline { flex: 1; height: 1px; background: rgba(255,255,255,0.06); }
.su-dtxt { font-size: 9px; color: rgba(255,255,255,0.14); letter-spacing: 0.12em; }

.su-alt { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px; }
.su-alt-btn {
  height: 40px; display: flex; align-items: center; justify-content: center; gap: 6px;
  border-radius: 11px; border: 1px solid rgba(255,255,255,0.06);
  background: rgba(255,255,255,0.02);
  font-size: 8.5px; letter-spacing: 0.1em; color: rgba(255,255,255,0.15);
  cursor: not-allowed;
}

.su-footer { text-align: center; font-size: 10.5px; color: rgba(255,255,255,0.2); }
.su-footer a { color: rgba(56,189,248,0.8); text-decoration: none; }
.su-footer a:hover { text-decoration: underline; }

.su-spinner {
  display: inline-block; vertical-align: middle;
  width: 13px; height: 13px; margin-right: 8px;
  border: 1.5px solid rgba(255,255,255,0.25);
  border-top-color: #fff; border-radius: 50%;
  animation: suSpin 0.65s linear infinite;
}
`;

const STRENGTH_LABEL = ["", "Weak", "Fair", "Good", "Strong", "Lethal"];
const STRENGTH_COLOR = ["", "#ef4444", "#f97316", "#eab308", "#22c55e", "#38bdf8"];

const pwScore = (p) => {
  if (!p) return 0;
  let s = 0;
  if (p.length >= 8) s++;
  if (p.length >= 12) s++;
  if (/[A-Z]/.test(p)) s++;
  if (/[0-9]/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p)) s++;
  return s;
};

const IcoUser = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
  </svg>
);
const IcoMail = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
  </svg>
);
const IcoSend = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
);
const IcoLock = () => (
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

  const validate = () => {
    if (!form.username.trim()) return toast.error("Username required");
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) return toast.error("Valid email required");
    if (!form.telegramId || !/^\d+$/.test(form.telegramId)) return toast.error("Numeric Telegram ID required");
    if (form.password.length < 8) return toast.error("Min 8 characters");
    if (!/[A-Z]/.test(form.password)) return toast.error("Need one uppercase letter");
    if (!/[0-9]/.test(form.password)) return toast.error("Need one number");
    if (!/[^A-Za-z0-9]/.test(form.password)) return toast.error("Need one special character");
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    play?.("click");
    if (validate() !== true) return;
    const result = await signup(form);
    if (result?.success) navigate("/");
  };

  const score = pwScore(form.password);
  const color = STRENGTH_COLOR[score];

  return (
    <div className="su-page">
      <style>{CSS}</style>
      <div className="su-glow-a" />
      <div className="su-glow-b" />
      <div className="su-scanlines" />

      <div className="su-card">
        <div className="su-brand">
          <div className="su-orbit-mark">
            <div className="su-orbit-ring" />
            <div className="su-orbit-core">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"
                  stroke="rgba(56,189,248,0.85)" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
          </div>
          <h1 className="su-h1">Create your node</h1>
          <p className="su-sub">Initialize your Orbit identity</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="su-field">
            <label className="su-flabel">Username</label>
            <div className="su-finput-wrap">
              <span className="su-ficon"><IcoUser /></span>
              <input className="su-finput" type="text" placeholder="your_alias"
                value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value.replace(/\s+/g, "").toLowerCase() }))} />
            </div>
          </div>

          <div className="su-field">
            <label className="su-flabel">Email</label>
            <div className="su-finput-wrap">
              <span className="su-ficon"><IcoMail /></span>
              <input className="su-finput" type="email" placeholder="you@orbit.network"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                autoComplete="email" />
            </div>
          </div>

          <div className="su-field">
            <label className="su-flabel">Telegram ID</label>
            <div className="su-finput-wrap">
              <span className="su-ficon"><IcoSend /></span>
              <input className="su-finput" type="text" placeholder="123456789"
                value={form.telegramId}
                onChange={e => setForm(f => ({ ...f, telegramId: e.target.value.replace(/\D/g, "") }))} />
            </div>
            <span className="su-hint">↳ Get your ID from @userinfobot on Telegram</span>
          </div>

          <div className="su-field">
            <label className="su-flabel">Password</label>
            <div className="su-finput-wrap">
              <span className="su-ficon"><IcoLock /></span>
              <input className="su-finput"
                type={showPw ? "text" : "password"}
                placeholder="••••••••••"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                style={{ paddingRight: 44 }}
                autoComplete="new-password" />
              <button type="button" className="su-feye"
                onClick={() => { play?.("click"); setShowPw(p => !p); }}>
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {form.password && (
              <>
                <div className="su-strength">
                  {[1,2,3,4,5].map(i => (
                    <div key={i} className="su-strength-seg"
                      style={{ background: i <= score ? color : undefined }} />
                  ))}
                </div>
                <p className="su-strength-txt" style={{ color }}>{STRENGTH_LABEL[score]}</p>
              </>
            )}
          </div>

          <button type="submit" className="su-submit" disabled={isSigningUp}>
            <div className="su-submit-shine" />
            {isSigningUp
              ? <><span className="su-spinner" />Creating...</>
              : "Create Orbit Account"}
          </button>
        </form>

        <div className="su-divider">
          <div className="su-dline" />
          <span className="su-dtxt">OR</span>
          <div className="su-dline" />
        </div>

        <div className="su-alt">
          <div className="su-alt-btn">✦ Constellation</div>
          <div className="su-alt-btn">✧ Starweave</div>
        </div>

        <div className="su-footer">
          Already have an account?&nbsp;<Link to="/login">Sign in →</Link>
        </div>
      </div>
    </div>
  );
}
