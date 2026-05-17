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

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Space+Grotesk:wght@400;500;600;700&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

.sp-page {
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
.sp-glow-1 {
  position: fixed; pointer-events: none;
  width: 440px; height: 440px; border-radius: 50%;
  background: radial-gradient(circle, rgba(14,165,233,0.22) 0%, transparent 65%);
  top: -140px; right: -60px;
  animation: spFloat1 9s ease-in-out infinite;
}
.sp-glow-2 {
  position: fixed; pointer-events: none;
  width: 380px; height: 380px; border-radius: 50%;
  background: radial-gradient(circle, rgba(124,58,237,0.2) 0%, transparent 65%);
  bottom: -100px; left: -70px;
  animation: spFloat2 12s ease-in-out infinite;
}
.sp-glow-3 {
  position: fixed; pointer-events: none;
  width: 220px; height: 220px; border-radius: 50%;
  background: radial-gradient(circle, rgba(52,211,153,0.12) 0%, transparent 65%);
  top: 40%; left: 5%;
  animation: spFloat3 15s ease-in-out infinite;
}
@keyframes spFloat1 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-25px,35px) scale(1.07)} }
@keyframes spFloat2 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(28px,-25px) scale(1.05)} }
@keyframes spFloat3 { 0%,100%{transform:translate(0,-50%) scale(1)} 50%{transform:translate(18px,calc(-50% + 22px)) scale(1.1)} }

/* Grid overlay */
.sp-grid {
  position: fixed; inset: 0; pointer-events: none; z-index: 0;
  background-image:
    linear-gradient(rgba(14,165,233,0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(14,165,233,0.03) 1px, transparent 1px);
  background-size: 44px 44px;
}

/* ── Card ── */
.sp-card {
  position: relative; z-index: 2;
  width: 100%; max-width: 440px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.09);
  border-radius: 24px;
  padding: 32px 28px 26px;
  backdrop-filter: blur(28px);
  box-shadow:
    0 0 0 1px rgba(14,165,233,0.1),
    0 32px 80px rgba(0,0,0,0.55),
    inset 0 1px 0 rgba(255,255,255,0.07);
}
.sp-card::before {
  content: '';
  position: absolute; top: 0; left: 15%; right: 15%; height: 1px;
  background: linear-gradient(90deg, transparent, rgba(14,165,233,0.7), rgba(124,58,237,0.5), transparent);
  border-radius: 99px;
}

/* ── Logo ── */
.sp-logo {
  display: flex; align-items: center; gap: 10px;
  margin-bottom: 22px;
}
.sp-logo-icon {
  width: 36px; height: 36px; border-radius: 10px;
  background: linear-gradient(135deg, #0ea5e9, #7c3aed);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 0 20px rgba(14,165,233,0.45);
}
.sp-logo-ring {
  width: 18px; height: 18px; border-radius: 50%;
  border: 2px solid rgba(255,255,255,0.9);
  position: relative;
}
.sp-logo-ring::before {
  content: '';
  position: absolute; top: -2px; left: 50%; transform: translateX(-50%);
  width: 5px; height: 5px; border-radius: 50%;
  background: white;
  animation: spOrbit 2.5s linear infinite;
  transform-origin: 50% calc(100% + 7px);
}
@keyframes spOrbit { to { transform: translateX(-50%) rotate(360deg); } }
.sp-logo-text { display: flex; flex-direction: column; }
.sp-logo-name {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 18px; font-weight: 700; letter-spacing: 0.04em;
  color: #fff; line-height: 1;
}
.sp-logo-sub { font-size: 10px; color: rgba(255,255,255,0.3); letter-spacing: 0.08em; margin-top: 2px; }
.sp-status {
  margin-left: auto;
  display: flex; align-items: center; gap: 5px;
  font-size: 10px; font-weight: 500; letter-spacing: 0.06em;
  color: rgba(56,189,248,0.85);
  background: rgba(56,189,248,0.08);
  border: 1px solid rgba(56,189,248,0.18);
  border-radius: 99px; padding: 4px 10px;
}
.sp-status-dot {
  width: 5px; height: 5px; border-radius: 50%;
  background: #38bdf8; box-shadow: 0 0 6px #38bdf8;
  animation: spPing 2.4s ease-in-out infinite;
}
@keyframes spPing { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(1.6)} }

/* ── Heading ── */
.sp-heading { margin-bottom: 22px; }
.sp-heading h1 {
  font-size: 26px; font-weight: 800; letter-spacing: -0.4px; line-height: 1.2;
  background: linear-gradient(135deg, #fff 0%, rgba(186,230,253,0.9) 100%);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
}
.sp-heading p { font-size: 13px; color: rgba(255,255,255,0.35); margin-top: 4px; }

/* ── Fields ── */
.sp-field-group { display: flex; flex-direction: column; gap: 14px; margin-bottom: 18px; }
.sp-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
@media (max-width: 400px) { .sp-row { grid-template-columns: 1fr; } }
.sp-field-label {
  font-size: 11px; font-weight: 600; letter-spacing: 0.08em;
  text-transform: uppercase; color: rgba(255,255,255,0.32);
  margin-bottom: 6px;
}
.sp-field-input-wrap {
  display: flex; align-items: center;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 12px;
  transition: border-color 0.25s, box-shadow 0.25s, background 0.25s;
  overflow: hidden;
}
.sp-field-input-wrap:focus-within {
  border-color: rgba(14,165,233,0.55);
  background: rgba(14,165,233,0.05);
  box-shadow: 0 0 0 3px rgba(14,165,233,0.1), 0 0 20px rgba(14,165,233,0.08);
}
.sp-field-ico {
  padding: 0 0 0 13px; color: rgba(255,255,255,0.2);
  display: flex; align-items: center; flex-shrink: 0;
  transition: color 0.25s;
}
.sp-field-input-wrap:focus-within .sp-field-ico { color: rgba(56,189,248,0.65); }
.sp-input {
  flex: 1; background: transparent; border: none; outline: none;
  color: #f0f4ff; font-family: 'Inter', sans-serif;
  font-size: 14.5px; padding: 13px 13px 13px 10px;
  caret-color: #38bdf8;
}
.sp-input::placeholder { color: rgba(255,255,255,0.14); }
.sp-eye-btn {
  background: none; border: none; padding: 0 13px; cursor: pointer;
  color: rgba(255,255,255,0.18); display: flex; align-items: center;
  transition: color 0.2s; height: 100%;
}
.sp-eye-btn:hover { color: rgba(255,255,255,0.5); }
.sp-hint {
  font-size: 10.5px; color: rgba(56,189,248,0.4);
  margin-top: 5px; letter-spacing: 0.02em;
}

/* Strength bar */
.sp-strength-row { display: flex; gap: 4px; margin-top: 8px; }
.sp-strength-seg {
  flex: 1; height: 3px; border-radius: 99px;
  background: rgba(255,255,255,0.07); transition: background 0.3s;
}
.sp-strength-txt {
  font-size: 10.5px; letter-spacing: 0.06em;
  margin-top: 5px; transition: color 0.3s;
  font-weight: 500;
}

/* ── Submit ── */
.sp-submit {
  width: 100%; padding: 14px;
  border: none; border-radius: 14px; cursor: pointer;
  font-family: 'Inter', sans-serif; font-size: 15px; font-weight: 700;
  letter-spacing: 0.02em; color: #fff;
  background: linear-gradient(135deg, #0ea5e9 0%, #6366f1 55%, #7c3aed 100%);
  position: relative; overflow: hidden;
  transition: opacity 0.25s, transform 0.2s, box-shadow 0.3s;
  box-shadow: 0 0 30px rgba(14,165,233,0.35), 0 8px 24px rgba(0,0,0,0.3);
  margin-bottom: 12px;
}
.sp-submit:not(:disabled):hover {
  box-shadow: 0 0 45px rgba(14,165,233,0.5), 0 8px 24px rgba(0,0,0,0.3);
  transform: translateY(-1px);
}
.sp-submit:not(:disabled):active { transform: translateY(0); }
.sp-submit:disabled { opacity: 0.45; cursor: not-allowed; }
.sp-submit::after {
  content: '';
  position: absolute; inset: 0;
  background: linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.15) 50%, transparent 70%);
  transform: translateX(-100%); transition: transform 0.6s;
}
.sp-submit:not(:disabled):hover::after { transform: translateX(100%); }
.sp-submit-inner { display: flex; align-items: center; justify-content: center; gap: 8px; }

/* Alt methods */
.sp-divider {
  display: flex; align-items: center; gap: 12px;
  font-size: 11px; color: rgba(255,255,255,0.18);
  letter-spacing: 0.06em; margin-bottom: 12px;
}
.sp-divider::before, .sp-divider::after {
  content: ''; flex: 1; height: 1px; background: rgba(255,255,255,0.08);
}
.sp-alt-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.sp-alt-btn {
  display: flex; align-items: center; justify-content: center; gap: 6px;
  padding: 10px 8px;
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 12px;
  background: rgba(255,255,255,0.025);
  font-size: 11.5px; font-weight: 500;
  color: rgba(255,255,255,0.28); cursor: not-allowed;
}
.sp-alt-badge {
  font-size: 9px; padding: 1px 5px;
  background: rgba(14,165,233,0.15);
  border: 1px solid rgba(14,165,233,0.25);
  border-radius: 99px; color: rgba(56,189,248,0.65);
}

/* Footer */
.sp-footer {
  margin-top: 20px; padding-top: 16px;
  border-top: 1px solid rgba(255,255,255,0.07);
  display: flex; align-items: center; justify-content: space-between;
  flex-wrap: wrap; gap: 8px;
}
.sp-footer-txt { font-size: 13px; color: rgba(255,255,255,0.32); }
.sp-footer-txt a { color: #38bdf8; text-decoration: none; font-weight: 600; transition: color 0.2s; }
.sp-footer-txt a:hover { color: #7dd3fc; }
.sp-admin-link {
  display: flex; align-items: center; gap: 5px;
  font-size: 11px; letter-spacing: 0.05em;
  color: rgba(255,255,255,0.18); text-decoration: none;
  padding: 5px 10px; border: 1px solid rgba(255,255,255,0.07);
  border-radius: 8px; transition: all 0.2s;
}
.sp-admin-link:hover { color: rgba(239,68,68,0.7); border-color: rgba(239,68,68,0.2); }

/* Spinner */
.sp-spinner {
  width: 15px; height: 15px; border-radius: 50%;
  border: 2px solid rgba(255,255,255,0.25); border-top-color: #fff;
  animation: spSpin 0.7s linear infinite; display: inline-block;
}
@keyframes spSpin { to { transform: rotate(360deg); } }
`;

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
      <div className="sp-page">
        {/* Background elements */}
        <div className="sp-glow-1" />
        <div className="sp-glow-2" />
        <div className="sp-glow-3" />
        <div className="sp-grid" />

        <div className="sp-card">
          {/* Logo row */}
          <div className="sp-logo">
            <div className="sp-logo-icon">
              <div className="sp-logo-ring" />
            </div>
            <div className="sp-logo-text">
              <span className="sp-logo-name">Orbit</span>
              <span className="sp-logo-sub">ENCRYPTED · E2E</span>
            </div>
            <div className="sp-status">
              <div className="sp-status-dot" />
              OPEN
            </div>
          </div>

          {/* Heading */}
          <div className="sp-heading">
            <h1>Create your node.</h1>
            <p>Join the Orbit encrypted network</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="sp-field-group">

              {/* Username + Email in a row */}
              <div className="sp-row">
                <div>
                  <div className="sp-field-label">Username</div>
                  <div className="sp-field-input-wrap">
                    <span className="sp-field-ico"><IcoUser /></span>
                    <input className="sp-input" type="text" placeholder="your_alias"
                      value={form.username}
                      onChange={e => setForm(f => ({ ...f, username: e.target.value.replace(/\s+/g, "").toLowerCase() }))}
                      required />
                  </div>
                </div>
                <div>
                  <div className="sp-field-label">Email</div>
                  <div className="sp-field-input-wrap">
                    <span className="sp-field-ico"><IcoMail /></span>
                    <input className="sp-input" type="email" placeholder="you@orbit.io"
                      value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      autoComplete="email" required />
                  </div>
                </div>
              </div>

              {/* Telegram ID */}
              <div>
                <div className="sp-field-label">Telegram ID</div>
                <div className="sp-field-input-wrap">
                  <span className="sp-field-ico"><IcoSend /></span>
                  <input className="sp-input" type="text" placeholder="123456789"
                    value={form.telegramId}
                    onChange={e => setForm(f => ({ ...f, telegramId: e.target.value.replace(/\D/g, "") }))}
                    required />
                </div>
                <div className="sp-hint">↳ Get yours from @userinfobot on Telegram</div>
              </div>

              {/* Password */}
              <div>
                <div className="sp-field-label">Password</div>
                <div className="sp-field-input-wrap">
                  <span className="sp-field-ico"><IcoLock /></span>
                  <input className="sp-input"
                    type={showPw ? "text" : "password"} placeholder="Min 8 chars, uppercase, number…"
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    autoComplete="new-password" required />
                  <button type="button" className="sp-eye-btn"
                    onClick={() => { play?.("click"); setShowPw(p => !p); }}>
                    {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                {form.password && (
                  <>
                    <div className="sp-strength-row">
                      {[1,2,3,4,5].map(i => (
                        <div key={i} className="sp-strength-seg"
                          style={{ background: i <= score ? color : undefined }} />
                      ))}
                    </div>
                    <p className="sp-strength-txt" style={{ color }}>{STRENGTH_LABEL[score]}</p>
                  </>
                )}
              </div>
            </div>

            <button type="submit" className="sp-submit" disabled={isSigningUp}>
              <span className="sp-submit-inner">
                {isSigningUp
                  ? <><span className="sp-spinner" /> Creating account…</>
                  : <>Create Orbit Account <IcoArrow /></>}
              </span>
            </button>
          </form>

          {/* Alt methods */}
          <div className="sp-divider">OR SIGN UP WITH</div>
          <div className="sp-alt-row">
            <button className="sp-alt-btn">✦ Constellation <span className="sp-alt-badge">Soon</span></button>
            <button className="sp-alt-btn">✧ Starweave <span className="sp-alt-badge">Soon</span></button>
          </div>

          {/* Footer */}
          <div className="sp-footer">
            <div className="sp-footer-txt">Already in orbit? <Link to="/login">Sign in →</Link></div>
            <Link to="/admin/login" className="sp-admin-link"><IcoShield /> Admin</Link>
          </div>
        </div>
      </div>
    </>
  );
}
