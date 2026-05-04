import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Sparkles, Star } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useSoundManager } from "../hooks/useSoundManager";
import toast from "react-hot-toast";

/* ─── Injected global styles ─────────────────────────────────────────── */
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Departure+Mono&display=swap');

  :root {
    --ink: #050810;
    --glow-a: #00e5ff;
    --glow-b: #7c3aed;
    --glow-c: #06ffa5;
    --surface: rgba(255,255,255,0.03);
    --border: rgba(255,255,255,0.07);
  }

  .su-root {
    font-family: 'Departure Mono', monospace;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden !important;
    position: relative;
    width: 100%;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }
  .su-root::-webkit-scrollbar {
    display: none !important;
  }

  /* ── Orb background ── */
  .su-canvas {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 0;
  }
  .su-orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    mix-blend-mode: screen;
    animation: drift linear infinite;
    opacity: 0.35;
  }
  @keyframes drift {
    0%   { transform: translate(0, 0) scale(1); }
    33%  { transform: translate(40px, -60px) scale(1.1); }
    66%  { transform: translate(-30px, 30px) scale(0.9); }
    100% { transform: translate(0, 0) scale(1); }
  }

  /* ── Card ── */
  .su-card {
    position: relative;
    z-index: 10;
    width: 380px;
    max-height: 90vh;
    padding: 28px 32px 24px;
    background: rgba(5,8,16,0.7);
    border: 1px solid var(--border);
    border-radius: 24px;
    backdrop-filter: blur(40px);
    -webkit-backdrop-filter: blur(40px);
    overflow-y: auto;
    scrollbar-width: none;
    -ms-overflow-style: none;
    box-shadow: 0 0 80px rgba(0,229,255,0.04), 0 0 200px rgba(124,58,237,0.05);
  }
  .su-card::-webkit-scrollbar { display: none !important; }

  /* ── Logo mark ── */
  .su-logo {
    width: 52px; height: 52px;
    margin: 0 auto 24px;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .su-logo-ring {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    border: 1px solid rgba(0,229,255,0.2);
    animation: spin-slow 12s linear infinite;
  }
  .su-logo-ring::before {
    content: '';
    position: absolute;
    top: -2px; left: 50%;
    width: 4px; height: 4px;
    background: var(--glow-a);
    border-radius: 50%;
    transform: translateX(-50%);
    box-shadow: 0 0 8px var(--glow-a), 0 0 16px var(--glow-a);
  }
  .su-logo-inner {
    width: 34px; height: 34px;
    border-radius: 50%;
    background: radial-gradient(circle at 35% 35%, rgba(0,229,255,0.15), rgba(124,58,237,0.08));
    border: 1px solid rgba(0,229,255,0.15);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  @keyframes spin-slow { to { transform: rotate(360deg); } }

  /* ── Heading ── */
  .su-title {
    font-family: 'Instrument Serif', serif;
    font-size: 24px;
    font-weight: 400;
    font-style: italic;
    color: #fff;
    text-align: center;
    margin: 0 0 4px;
    letter-spacing: -0.01em;
    line-height: 1;
  }
  .su-sub {
    font-size: 8px;
    letter-spacing: 0.22em;
    color: rgba(255,255,255,0.2);
    text-align: center;
    margin: 0 0 20px;
  }

  /* ── Floating label inputs ── */
  .su-field {
    position: relative;
    margin-bottom: 14px;
  }
  .su-field-inner {
    position: relative;
    display: flex;
    align-items: center;
  }
  .su-icon {
    position: absolute;
    left: 14px;
    color: rgba(255,255,255,0.2);
    transition: color 0.3s;
    pointer-events: none;
    display: flex;
    align-items: center;
  }
  .su-input {
    width: 100%;
    height: 52px;
    padding: 18px 14px 6px 40px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 14px;
    color: #fff;
    font-family: 'Departure Mono', monospace;
    font-size: 13px;
    outline: none;
    transition: border-color 0.3s, background 0.3s, box-shadow 0.3s;
    box-sizing: border-box;
  }
  .su-input:focus {
    border-color: rgba(0,229,255,0.35);
    background: rgba(0,229,255,0.03);
    box-shadow: 0 0 0 3px rgba(0,229,255,0.06), inset 0 0 20px rgba(0,229,255,0.02);
  }
  .su-input:focus + .su-label,
  .su-input.has-val + .su-label {
    transform: translateY(-10px);
    font-size: 9px;
    letter-spacing: 0.15em;
    color: rgba(0,229,255,0.5);
  }
  .su-label {
    position: absolute;
    left: 40px;
    top: 50%;
    transform: translateY(-50%);
    font-family: 'Departure Mono', monospace;
    font-size: 12px;
    color: rgba(255,255,255,0.25);
    letter-spacing: 0.08em;
    pointer-events: none;
    transition: all 0.2s ease;
  }
  .su-field:focus-within .su-icon {
    color: rgba(0,229,255,0.5);
  }
  .su-eye {
    position: absolute;
    right: 14px;
    background: none;
    border: none;
    cursor: pointer;
    color: rgba(255,255,255,0.2);
    display: flex;
    align-items: center;
    padding: 4px;
    transition: color 0.2s;
  }
  .su-eye:hover { color: rgba(255,255,255,0.5); }

  .su-hint {
    font-size: 9px;
    letter-spacing: 0.12em;
    color: rgba(124,58,237,0.45);
    margin: 5px 0 0 12px;
  }

  /* ── Strength bar ── */
  .su-strength-track {
    display: flex;
    gap: 4px;
    margin-top: 8px;
    height: 2px;
  }
  .su-strength-seg {
    flex: 1;
    border-radius: 99px;
    background: rgba(255,255,255,0.07);
    transition: background 0.4s;
  }
  .su-strength-label {
    font-size: 9px;
    letter-spacing: 0.18em;
    margin-top: 5px;
    transition: color 0.4s;
  }

  /* ── Submit ── */
  .su-submit {
    width: 100%;
    height: 52px;
    margin-top: 8px;
    background: rgba(0,229,255,0.06);
    border: 1px solid rgba(0,229,255,0.2);
    border-radius: 14px;
    color: var(--glow-a);
    font-family: 'Departure Mono', monospace;
    font-size: 12px;
    letter-spacing: 0.2em;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    transition: background 0.3s, border-color 0.3s, transform 0.15s;
  }
  .su-submit:hover:not(:disabled) {
    background: rgba(0,229,255,0.1);
    border-color: rgba(0,229,255,0.4);
    transform: translateY(-1px);
    box-shadow: 0 8px 32px rgba(0,229,255,0.1);
  }
  .su-submit:active:not(:disabled) { transform: translateY(0); }
  .su-submit:disabled { opacity: 0.5; cursor: not-allowed; }
  .su-submit::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, transparent 0%, rgba(0,229,255,0.08) 50%, transparent 100%);
    transform: translateX(-100%);
    animation: shimmer 2.5s ease infinite;
  }
  @keyframes shimmer {
    0%   { transform: translateX(-100%); }
    60%  { transform: translateX(100%); }
    100% { transform: translateX(100%); }
  }

  /* ── Divider ── */
  .su-divider {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 20px 0;
  }
  .su-divider-line {
    flex: 1;
    height: 1px;
    background: linear-gradient(90deg, transparent, var(--border), transparent);
  }
  .su-divider-text {
    font-size: 9px;
    letter-spacing: 0.2em;
    color: rgba(255,255,255,0.12);
  }

  /* ── Alt auth buttons ── */
  .su-alt-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-bottom: 20px;
  }
  .su-alt-btn {
    height: 42px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    border-radius: 12px;
    font-family: 'Departure Mono', monospace;
    font-size: 9px;
    letter-spacing: 0.14em;
    border: 1px solid rgba(255,255,255,0.05);
    background: rgba(255,255,255,0.02);
    color: rgba(255,255,255,0.18);
    cursor: not-allowed;
    opacity: 0.7;
  }

  /* ── Footer ── */
  .su-footer {
    text-align: center;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .su-footer-line {
    font-size: 10px;
    letter-spacing: 0.12em;
    color: rgba(255,255,255,0.18);
  }
  .su-footer-link {
    color: var(--glow-a);
    text-decoration: none;
    transition: opacity 0.2s;
  }
  .su-footer-link:hover { opacity: 0.7; }
  .su-admin-link {
    font-size: 9px;
    letter-spacing: 0.1em;
    color: rgba(255,255,255,0.08);
    text-decoration: none;
    transition: color 0.2s;
  }
  .su-admin-link:hover { color: rgba(255,255,255,0.25); }

  /* ── Spinner ── */
  .su-spinner {
    width: 16px; height: 16px;
    border: 1.5px solid rgba(0,229,255,0.2);
    border-top-color: var(--glow-a);
    border-radius: 50%;
    animation: spin-fast 0.7s linear infinite;
    display: inline-block;
    vertical-align: middle;
    margin-right: 8px;
  }
  @keyframes spin-fast { to { transform: rotate(360deg); } }

  /* ── Scan line overlay ── */
  .su-scanlines {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 5;
    background: repeating-linear-gradient(
      0deg,
      transparent,
      transparent 2px,
      rgba(0,0,0,0.03) 2px,
      rgba(0,0,0,0.03) 4px
    );
  }
`;

/* ─── Floating orb config ────────────────────────────────────────────── */
const ORBS = [
  { w: 500, h: 500, top: "-20%", left: "-15%", bg: "rgba(0,229,255,0.12)", dur: "18s" },
  { w: 400, h: 400, top: "60%",  left: "70%",  bg: "rgba(124,58,237,0.15)", dur: "22s", delay: "-7s" },
  { w: 300, h: 300, top: "40%",  left: "5%",   bg: "rgba(6,255,165,0.08)",  dur: "26s", delay: "-14s" },
  { w: 250, h: 250, top: "5%",   left: "75%",  bg: "rgba(0,229,255,0.07)",  dur: "20s", delay: "-3s" },
];

/* ─── Field component ────────────────────────────────────────────────── */
const Field = ({ label, type = "text", icon, value, onChange, onFocus, onBlur, focused, children }) => (
  <div className="su-field">
    <div className="su-field-inner">
      <span className="su-icon">{icon}</span>
      <input
        className={`su-input${value ? " has-val" : ""}`}
        type={type}
        value={value}
        onChange={onChange}
        onFocus={onFocus}
        onBlur={onBlur}
        autoComplete="off"
        spellCheck={false}
      />
      <label className="su-label">{label}</label>
      {children}
    </div>
  </div>
);

/* ─── Icons ──────────────────────────────────────────────────────────── */
const IconUser = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
  </svg>
);
const IconMail = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 8l10 6 10-6"/>
  </svg>
);
const IconSend = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
);
const IconLock = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>
  </svg>
);

/* ─── Main component ─────────────────────────────────────────────────── */
const SignUpPage = () => {
  const [formData, setFormData] = useState({ username: "", email: "", password: "", telegramId: "" });
  const [focused, setFocused] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const { signup, isSigningUp, authUser } = useAuthStore();
  const { play } = useSoundManager();
  const navigate = useNavigate();

  const validateForm = () => {
    if (!formData.username.trim()) return toast.error("Username is required");
    if (formData.username.includes(" ")) return toast.error("No spaces in username");
    if (!formData.email.trim()) return toast.error("Email is required");
    if (!/\S+@\S+\.\S+/.test(formData.email)) return toast.error("Invalid email address");
    if (!formData.telegramId) return toast.error("Telegram ID is required (Get it from @userinfobot)");
    if (!/^\d+$/.test(formData.telegramId)) return toast.error("Telegram ID must be numeric");
    if (!formData.password) return toast.error("Password is required");
    if (formData.password.length < 8) return toast.error("Password must be at least 8 characters");
    if (!/[A-Z]/.test(formData.password)) return toast.error("Password must contain an uppercase letter");
    if (!/[a-z]/.test(formData.password)) return toast.error("Password must contain a lowercase letter");
    if (!/[0-9]/.test(formData.password)) return toast.error("Password must contain a number");
    if (!/[^A-Za-z0-9]/.test(formData.password)) return toast.error("Password must contain a special character");
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    play("click");
    if (validateForm() !== true) return;
    const result = await signup(formData);
    if (result?.success) navigate("/");
  };

  const pwStrength = (() => {
    const p = formData.password;
    if (!p) return 0;
    let s = 0;
    if (p.length >= 6) s++;
    if (p.length >= 10) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  })();
  const strengthLabel = ["", "WEAK", "FAIR", "GOOD", "STRONG", "LETHAL"][pwStrength] || "";
  const strengthColor = ["", "#ef4444", "#f97316", "#eab308", "#22c55e", "#00e5ff"][pwStrength] || "";

  return (
    <div className="su-root">
      <style>{styles}</style>

      {/* Ambient orbs */}
      <div className="su-canvas">
        {ORBS.map((o, i) => (
          <div
            key={i}
            className="su-orb"
            style={{
              width: o.w, height: o.h,
              top: o.top, left: o.left,
              background: o.bg,
              animationDuration: o.dur,
              animationDelay: o.delay || "0s",
            }}
          />
        ))}
      </div>

      {/* Scan lines */}
      <div className="su-scanlines" />

      {/* Card */}
      <div className="su-card">

        {/* Logo */}
        <div className="su-logo">
          <div className="su-logo-ring" />
          <div className="su-logo-inner">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"
                stroke="rgba(0,229,255,0.7)" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
        </div>

        {/* Heading */}
        <h1 className="su-title">Initialize identity</h1>
        <p className="su-sub">REGISTER_NEW_NODE</p>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 0 }}>

          <Field label="Username" icon={<IconUser />}
            value={formData.username}
            onChange={e => setFormData({ ...formData, username: e.target.value.replace(/\s+/g, "").toLowerCase() })}
            focused={focused === "username"}
            onFocus={() => setFocused("username")}
            onBlur={() => setFocused(null)}
          />

          <Field label="Email Address" type="email" icon={<IconMail />}
            value={formData.email}
            onChange={e => setFormData({ ...formData, email: e.target.value })}
            focused={focused === "email"}
            onFocus={() => setFocused("email")}
            onBlur={() => setFocused(null)}
          />

          {/* Telegram */}
          <div className="su-field">
            <div className="su-field-inner">
              <span className="su-icon"><IconSend /></span>
              <input
                className={`su-input${formData.telegramId ? " has-val" : ""}`}
                type="text"
                value={formData.telegramId}
                onChange={e => setFormData({ ...formData, telegramId: e.target.value.replace(/\D/g, "") })}
                onFocus={() => setFocused("telegramId")}
                onBlur={() => setFocused(null)}
                autoComplete="off"
              />
              <label className="su-label">Telegram ID</label>
            </div>
            <p className="su-hint">Required · message @userinfobot to retrieve</p>
          </div>

          {/* Password */}
          <div className="su-field">
            <div className="su-field-inner">
              <span className="su-icon"><IconLock /></span>
              <input
                className={`su-input${formData.password ? " has-val" : ""}`}
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
                onFocus={() => setFocused("password")}
                onBlur={() => setFocused(null)}
                style={{ paddingRight: "44px" }}
                autoComplete="new-password"
              />
              <label className="su-label">Password</label>
              <button type="button" tabIndex={-1} className="su-eye"
                onClick={() => { play("click"); setShowPassword(!showPassword); }}>
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            {formData.password && (
              <div style={{ padding: "0 4px" }}>
                <div className="su-strength-track">
                  {[1,2,3,4,5].map(i => (
                    <div key={i} className="su-strength-seg"
                      style={{ background: i <= pwStrength ? strengthColor : undefined }} />
                  ))}
                </div>
                <p className="su-strength-label" style={{ color: strengthColor }}>{strengthLabel}</p>
              </div>
            )}
          </div>

          <button type="submit" className="su-submit" disabled={isSigningUp}>
            {isSigningUp
              ? <><span className="su-spinner" />INITIALIZING...</>
              : "REGISTER NODE //"}
          </button>
        </form>

        {/* Divider */}
        <div className="su-divider">
          <div className="su-divider-line" />
          <span className="su-divider-text">OR</span>
          <div className="su-divider-line" />
        </div>

        {/* Alt auth */}
        <div className="su-alt-row">
          <div className="su-alt-btn">
            <Sparkles size={11} />
            CONSTELLATION (SOON)
          </div>
          <div className="su-alt-btn">
            <Star size={11} />
            STARWEAVE (SOON)
          </div>
        </div>

        {/* Footer */}
        <div className="su-footer">
          <p className="su-footer-line">
            EXISTING_NODE?{" "}
            <Link to="/login" className="su-footer-link">AUTHENTICATE →</Link>
          </p>
          <Link to="/admin/login" className="su-admin-link">// ACCESS_ADMIN_TERMINAL</Link>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;
