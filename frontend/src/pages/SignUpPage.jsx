import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useSoundManager } from "../hooks/useSoundManager";
import toast from "react-hot-toast";

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
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
    <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
  </svg>
);
const IcoMail = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
    <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
  </svg>
);
const IcoSend = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
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

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500;700&display=swap');

.sp-root {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 28px 52px 24px;
  box-sizing: border-box;
  position: relative;
  overflow: hidden;
  font-family: 'JetBrains Mono', monospace;
}
.sp-root::before, .sp-root::after {
  content: '';
  position: absolute;
  width: 16px; height: 16px;
  border-color: rgba(14,165,233,0.32);
  border-style: solid;
}
.sp-root::before { top: 20px; left: 20px; border-width: 2px 0 0 2px; }
.sp-root::after  { bottom: 20px; right: 20px; border-width: 0 2px 2px 0; }

/* ── Compact header ── */
.sp-header {
  display: flex; align-items: center; justify-content: space-between;
  flex-shrink: 0; margin-bottom: 18px;
}
.sp-logo-row { display: flex; align-items: center; gap: 10px; }
.sp-ring {
  width: 28px; height: 28px; border-radius: 50%;
  border: 1.5px solid rgba(14,165,233,0.5);
  position: relative; display: flex; align-items: center; justify-content: center;
  animation: spSpin 12s linear infinite; flex-shrink: 0;
}
.sp-ring::before {
  content: '';
  position: absolute; top: -3px; left: 50%; transform: translateX(-50%);
  width: 5px; height: 5px; border-radius: 50%;
  background: #38bdf8; box-shadow: 0 0 7px 2px rgba(56,189,248,0.9);
}
@keyframes spSpin { to { transform: rotate(360deg); } }
.sp-logo-text { display: flex; flex-direction: column; gap: 1px; }
.sp-logo-name { font-size: 13px; font-weight: 700; letter-spacing: 0.22em; color: rgba(255,255,255,0.7); text-transform: uppercase; }
.sp-logo-sub  { font-size: 8px; color: rgba(255,255,255,0.18); letter-spacing: 0.14em; text-transform: uppercase; }
.sp-status-dot {
  display: flex; align-items: center; gap: 6px;
  font-size: 8.5px; letter-spacing: 0.12em; color: rgba(56,189,248,0.7); text-transform: uppercase;
}
.sp-status-dot::before {
  content: ''; width: 5px; height: 5px; border-radius: 50%;
  background: #38bdf8; box-shadow: 0 0 7px #38bdf8;
  animation: spPing 2.4s ease-in-out infinite;
}
@keyframes spPing { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.3;transform:scale(1.5)} }

/* ── Divider ── */
.sp-divline {
  height: 1px; flex-shrink: 0;
  background: linear-gradient(90deg, rgba(14,165,233,0.7) 0%, rgba(109,40,217,0.25) 55%, transparent 100%);
  margin-bottom: 18px; position: relative;
}
.sp-divline::after {
  content: 'INIT';
  position: absolute; right: 0; top: -9px;
  font-size: 7.5px; letter-spacing: 0.18em; color: rgba(14,165,233,0.4);
}

/* ── Headline ── */
.sp-headline { flex-shrink: 0; margin-bottom: 18px; }
.sp-headline-h1 {
  font-family: 'Instrument Serif', serif;
  font-size: clamp(30px, 3.2vw, 48px);
  font-weight: 400; font-style: italic;
  color: #f0f4ff; line-height: 0.95; letter-spacing: -0.02em; margin: 0 0 6px;
}
.sp-headline-sub {
  font-size: 9px; color: rgba(255,255,255,0.45);
  letter-spacing: 0.18em; text-transform: uppercase;
  display: flex; align-items: center; gap: 10px;
}
.sp-headline-sub::after {
  content: ''; flex: 1; height: 1px;
  background: linear-gradient(90deg, rgba(255,255,255,0.06), transparent);
}

/* ── Fields ── */
.sp-form { display: flex; flex-direction: column; flex-shrink: 0; }

/* Two-col row */
.sp-two-col {
  display: grid; grid-template-columns: 1fr 1fr;
  border-top: 1px solid rgba(255,255,255,0.07);
}
.sp-two-col .sp-field { border-top: none; }
.sp-two-col .sp-field:first-child { border-right: 1px solid rgba(255,255,255,0.05); padding-right: 28px; }
.sp-two-col .sp-field:last-child  { padding-left: 28px; }

.sp-field {
  position: relative;
  border-bottom: 1px solid rgba(255,255,255,0.07);
  padding: 13px 0;
  transition: border-color 0.2s;
}
.sp-field:focus-within { border-bottom-color: rgba(14,165,233,0.45); }
.sp-field:not(.sp-two-col .sp-field):first-of-type { border-top: 1px solid rgba(255,255,255,0.07); }
.sp-field::after {
  content: ''; position: absolute; bottom: -1px; left: 0;
  width: 0; height: 1px;
  background: linear-gradient(90deg, #38bdf8, #7c3aed);
  transition: width 0.35s cubic-bezier(0.4,0,0.2,1);
}
.sp-field:focus-within::after { width: 100%; }
.sp-field-label {
  font-size: 7.5px; font-weight: 700; letter-spacing: 0.18em;
  text-transform: uppercase; color: rgba(255,255,255,0.85); margin-bottom: 7px;
}
.sp-field-inner { display: flex; align-items: center; gap: 12px; }
.sp-field-icon {
  color: rgba(255,255,255,0.12); flex-shrink: 0; display: flex; align-items: center; transition: color 0.2s;
}
.sp-field:focus-within .sp-field-icon { color: rgba(14,165,233,0.6); }
.sp-input {
  flex: 1; background: transparent; border: none; outline: none;
  color: #ffffff; font-family: 'JetBrains Mono', monospace;
  font-size: clamp(15px, 1.6vw, 20px); caret-color: #38bdf8; padding: 0;
}
.sp-input::placeholder { color: rgba(255,255,255,0.07); }
.sp-eye {
  background: none; border: none; padding: 4px; cursor: pointer;
  color: rgba(255,255,255,0.12); display: flex; align-items: center; transition: color 0.2s;
}
.sp-eye:hover { color: rgba(255,255,255,0.45); }

.sp-hint { font-size: 7.5px; color: rgba(56,189,248,0.32); margin-top: 4px; letter-spacing: 0.04em; }

.sp-strength { display: flex; gap: 4px; margin-top: 7px; }
.sp-strength-seg { flex: 1; height: 2px; border-radius: 99px; background: rgba(255,255,255,0.05); transition: background 0.3s; }
.sp-strength-txt { font-size: 7.5px; letter-spacing: 0.1em; margin-top: 3px; transition: color 0.3s; }

/* ══════════════════════════════════════
   CREATIVE BUTTON — cyan variant
══════════════════════════════════════ */
.sp-submit-wrap { margin-top: 20px; flex-shrink: 0; }
.sp-submit {
  width: 100%; height: 50px;
  background: rgba(14,165,233,0.05);
  border: 1px solid rgba(14,165,233,0.2);
  border-left: 3px solid #0ea5e9;
  border-radius: 0;
  display: flex; align-items: center;
  padding: 0 18px 0 22px;
  cursor: pointer; position: relative; overflow: hidden;
  transition: background 0.25s, border-color 0.25s, box-shadow 0.3s;
  gap: 14px;
}
.sp-submit:disabled { opacity: 0.35; cursor: not-allowed; }
.sp-submit:not(:disabled):hover {
  background: rgba(14,165,233,0.10);
  border-color: rgba(14,165,233,0.5);
  border-left-color: #38bdf8;
  box-shadow: 0 0 36px rgba(14,165,233,0.16), inset 0 0 24px rgba(14,165,233,0.05);
}
.sp-submit::before {
  content: '';
  position: absolute; inset: 0;
  background: linear-gradient(105deg, transparent 25%, rgba(255,255,255,0.04) 50%, transparent 75%);
  transform: translateX(-120%); transition: transform 0s;
}
.sp-submit:not(:disabled):hover::before {
  transform: translateX(120%);
  transition: transform 0.65s ease;
}
.sp-submit-text {
  flex: 1; text-align: left;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px; font-weight: 700;
  letter-spacing: 0.22em; text-transform: uppercase;
  color: rgba(255,255,255,0.82);
}
.sp-submit-execute {
  width: 32px; height: 32px; flex-shrink: 0;
  border-radius: 50%;
  border: 1px solid rgba(14,165,233,0.35);
  display: flex; align-items: center; justify-content: center;
  color: rgba(56,189,248,0.75); font-size: 14px;
  transition: all 0.25s; position: relative;
}
.sp-submit-execute::after {
  content: ''; position: absolute; inset: -4px;
  border-radius: 50%; border: 1px dashed rgba(14,165,233,0);
  transition: border-color 0.3s, transform 0.3s;
}
.sp-submit:not(:disabled):hover .sp-submit-execute {
  background: rgba(14,165,233,0.16);
  border-color: #38bdf8;
  box-shadow: 0 0 14px rgba(14,165,233,0.45);
  color: #7dd3fc;
}
.sp-submit:not(:disabled):hover .sp-submit-execute::after {
  border-color: rgba(14,165,233,0.35);
  transform: rotate(45deg);
}

.sp-spinner {
  width: 12px; height: 12px; border: 2px solid rgba(255,255,255,0.15);
  border-top-color: rgba(255,255,255,0.7); border-radius: 50%;
  animation: spSpin 0.7s linear infinite; display: inline-block;
}

/* ── Alt chips ── */
.sp-alt-row { display: flex; gap: 10px; margin-top: 12px; flex-shrink: 0; }
.sp-alt-chip {
  flex: 1; height: 36px;
  display: flex; align-items: center; justify-content: space-between; padding: 0 14px;
  border: 1px solid rgba(255,255,255,0.05); border-left: 2px solid rgba(255,255,255,0.04);
  font-size: 9px; letter-spacing: 0.07em; color: rgba(255,255,255,0.17);
  cursor: not-allowed; background: rgba(255,255,255,0.007);
}
.sp-chip-badge {
  font-size: 6.5px; padding: 2px 5px;
  background: rgba(14,165,233,0.1); color: rgba(14,165,233,0.55);
}

/* ── Footer ── */
.sp-footer {
  margin-top: auto; padding-top: 16px;
  display: flex; align-items: center; justify-content: space-between;
  flex-shrink: 0; border-top: 1px solid rgba(255,255,255,0.05);
}
.sp-footer-left { font-size: 11px; color: rgba(255,255,255,0.45); }
.sp-footer-left a { color: #38bdf8; text-decoration: none; font-weight: 700; transition: color 0.2s; }
.sp-footer-left a:hover { color: #7dd3fc; }
.sp-admin-link {
  display: flex; align-items: center; gap: 6px;
  font-size: 8.5px; letter-spacing: 0.1em;
  color: rgba(255,255,255,0.14); text-decoration: none; text-transform: uppercase;
  padding: 6px 10px; border: 1px solid rgba(255,255,255,0.05); transition: all 0.2s;
}
.sp-admin-link:hover { color: rgba(239,68,68,0.6); border-color: rgba(239,68,68,0.15); }
`;

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
    <>
      <style>{CSS}</style>
      <div className="sp-root">

        {/* ── Compact header ── */}
        <div className="sp-header">
          <div className="sp-logo-row">
            <div className="sp-ring">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"
                  stroke="rgba(56,189,248,0.8)" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="sp-logo-text">
              <span className="sp-logo-name">Orbit</span>
              <span className="sp-logo-sub">Initialize your node</span>
            </div>
          </div>
          <div className="sp-status-dot">Registration open</div>
        </div>

        {/* ── Divider ── */}
        <div className="sp-divline" />

        {/* ── Headline ── */}
        <div className="sp-headline">
          <h1 className="sp-headline-h1">Create your node.</h1>
          <div className="sp-headline-sub">Join the Orbit network</div>
        </div>

        {/* ── Form ── */}
        <form className="sp-form" onSubmit={handleSubmit}>

          {/* Username + Email */}
          <div className="sp-two-col">
            <div className="sp-field">
              <div className="sp-field-label">Username</div>
              <div className="sp-field-inner">
                <span className="sp-field-icon"><IcoUser /></span>
                <input className="sp-input" type="text" placeholder="your_alias"
                  value={form.username}
                  onChange={e => setForm(f => ({ ...f, username: e.target.value.replace(/\s+/g, "").toLowerCase() }))}
                  required />
              </div>
            </div>
            <div className="sp-field">
              <div className="sp-field-label">Email</div>
              <div className="sp-field-inner">
                <span className="sp-field-icon"><IcoMail /></span>
                <input className="sp-input" type="email" placeholder="you@orbit.network"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  autoComplete="email" required />
              </div>
            </div>
          </div>

          {/* Telegram */}
          <div className="sp-field">
            <div className="sp-field-label">Telegram ID</div>
            <div className="sp-field-inner">
              <span className="sp-field-icon"><IcoSend /></span>
              <input className="sp-input" type="text" placeholder="123456789"
                value={form.telegramId}
                onChange={e => setForm(f => ({ ...f, telegramId: e.target.value.replace(/\D/g, "") }))}
                required />
            </div>
            <div className="sp-hint">↳ Get your ID from @userinfobot on Telegram</div>
          </div>

          {/* Password */}
          <div className="sp-field">
            <div className="sp-field-label">Password</div>
            <div className="sp-field-inner">
              <span className="sp-field-icon"><IcoLock /></span>
              <input className="sp-input"
                type={showPw ? "text" : "password"} placeholder="••••••••••••"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                autoComplete="new-password" required />
              <button type="button" className="sp-eye"
                onClick={() => { play?.("click"); setShowPw(p => !p); }}>
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {form.password && (
              <>
                <div className="sp-strength">
                  {[1,2,3,4,5].map(i => (
                    <div key={i} className="sp-strength-seg"
                      style={{ background: i <= score ? color : undefined }} />
                  ))}
                </div>
                <p className="sp-strength-txt" style={{ color }}>{STRENGTH_LABEL[score]}</p>
              </>
            )}
          </div>

          {/* Creative submit */}
          <div className="sp-submit-wrap">
            <button type="submit" className="sp-submit" disabled={isSigningUp}>
              <span className="sp-submit-text">
                {isSigningUp ? <><span className="sp-spinner" style={{ marginRight: 10 }} />Creating node…</> : "Create Orbit Account"}
              </span>
              <div className="sp-submit-execute">
                {isSigningUp ? <span className="sp-spinner" style={{ width: 12, height: 12 }} /> : "→"}
              </div>
            </button>
          </div>
        </form>

        {/* ── Alt chips ── */}
        <div className="sp-alt-row">
          <div className="sp-alt-chip"><span>✦ Constellation</span><span className="sp-chip-badge">Soon</span></div>
          <div className="sp-alt-chip"><span>✧ Starweave</span><span className="sp-chip-badge">Soon</span></div>
        </div>

        {/* ── Footer ── */}
        <div className="sp-footer">
          <div className="sp-footer-left">Already in orbit?&nbsp;<Link to="/login">Sign in →</Link></div>
          <Link to="/admin/login" className="sp-admin-link"><IcoShield /> Admin</Link>
        </div>

      </div>
    </>
  );
}
