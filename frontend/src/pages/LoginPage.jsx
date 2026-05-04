import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Sparkles, Star } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useSoundManager } from "../hooks/useSoundManager";

/* ─── Styles ─────────────────────────────────────────────────────────── */
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

  .lg-root {
    font-family: 'Departure Mono', monospace;
    background: var(--ink);
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    position: relative;
    width: 100%;
  }

  /* ── Ambient orbs ── */
  .lg-canvas {
    position: fixed; inset: 0;
    pointer-events: none; z-index: 0;
  }
  .lg-orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(90px);
    mix-blend-mode: screen;
    animation: lg-drift linear infinite;
    opacity: 0.3;
  }
  @keyframes lg-drift {
    0%   { transform: translate(0,0) scale(1); }
    25%  { transform: translate(30px,-50px) scale(1.08); }
    50%  { transform: translate(-20px,40px) scale(0.94); }
    75%  { transform: translate(50px,20px) scale(1.04); }
    100% { transform: translate(0,0) scale(1); }
  }

  /* ── Scan lines ── */
  .lg-scanlines {
    position: fixed; inset: 0; pointer-events: none; z-index: 5;
    background: repeating-linear-gradient(
      0deg, transparent, transparent 2px,
      rgba(0,0,0,0.035) 2px, rgba(0,0,0,0.035) 4px
    );
  }

  /* ── Card ── */
  .lg-card {
    position: relative; z-index: 10;
    width: 400px;
    padding: 52px 40px 40px;
    background: rgba(5,8,16,0.72);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 28px;
    backdrop-filter: blur(40px);
    -webkit-backdrop-filter: blur(40px);
    box-shadow:
      0 0 100px rgba(0,229,255,0.04),
      0 0 240px rgba(124,58,237,0.05),
      inset 0 1px 0 rgba(255,255,255,0.05);
  }

  /* ── Logo ── */
  .lg-logo {
    width: 60px; height: 60px;
    margin: 0 auto 26px;
    position: relative;
    display: flex; align-items: center; justify-content: center;
  }
  /* outer slow ring */
  .lg-ring-outer {
    position: absolute; inset: 0;
    border-radius: 50%;
    border: 1px solid rgba(0,229,255,0.12);
    animation: lg-spin 16s linear infinite;
  }
  /* outer dot */
  .lg-ring-outer::before {
    content: '';
    position: absolute; top: -2px; left: 50%;
    width: 4px; height: 4px;
    background: rgba(0,229,255,0.5);
    border-radius: 50%;
    transform: translateX(-50%);
    box-shadow: 0 0 6px rgba(0,229,255,0.8);
  }
  /* inner faster ring */
  .lg-ring-inner {
    position: absolute;
    inset: 10px;
    border-radius: 50%;
    border: 1px solid rgba(124,58,237,0.2);
    animation: lg-spin-rev 9s linear infinite;
  }
  .lg-ring-inner::before {
    content: '';
    position: absolute; bottom: -2px; left: 50%;
    width: 3px; height: 3px;
    background: rgba(124,58,237,0.7);
    border-radius: 50%;
    transform: translateX(-50%);
    box-shadow: 0 0 6px rgba(124,58,237,0.9);
  }
  .lg-core {
    width: 28px; height: 28px;
    border-radius: 50%;
    background: radial-gradient(circle at 35% 35%, rgba(0,229,255,0.1), rgba(124,58,237,0.06) 70%, transparent);
    border: 1px solid rgba(0,229,255,0.1);
    display: flex; align-items: center; justify-content: center;
    position: relative;
    animation: lg-pulse 3s ease-in-out infinite;
  }
  @keyframes lg-spin     { to { transform: rotate(360deg); } }
  @keyframes lg-spin-rev { to { transform: rotate(-360deg); } }
  @keyframes lg-pulse {
    0%,100% { box-shadow: 0 0 0 0 rgba(0,229,255,0); }
    50%      { box-shadow: 0 0 16px 2px rgba(0,229,255,0.08); }
  }

  /* ── Heading ── */
  .lg-title {
    font-family: 'Instrument Serif', serif;
    font-size: 30px; font-weight: 400; font-style: italic;
    color: #fff; text-align: center;
    margin: 0 0 5px;
    letter-spacing: -0.015em; line-height: 1;
  }
  .lg-sub {
    font-size: 8px; letter-spacing: 0.24em;
    color: rgba(255,255,255,0.16); text-align: center;
    margin: 0 0 38px;
  }

  /* ── Input fields ── */
  .lg-field { position: relative; margin-bottom: 14px; }
  .lg-field-inner { position: relative; display: flex; align-items: center; }
  .lg-icon {
    position: absolute; left: 15px;
    color: rgba(255,255,255,0.18);
    transition: color 0.3s, transform 0.3s;
    pointer-events: none;
    display: flex; align-items: center; z-index: 2;
  }
  .lg-input {
    width: 100%; height: 54px;
    padding: 18px 14px 6px 42px;
    background: rgba(255,255,255,0.025);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 16px;
    color: #fff;
    font-family: 'Departure Mono', monospace;
    font-size: 13px;
    outline: none;
    transition: border-color 0.35s, background 0.35s, box-shadow 0.35s;
    box-sizing: border-box;
  }
  .lg-input:focus {
    border-color: rgba(0,229,255,0.3);
    background: rgba(0,229,255,0.025);
    box-shadow: 0 0 0 3px rgba(0,229,255,0.055), inset 0 0 24px rgba(0,229,255,0.015);
  }
  .lg-input:focus ~ .lg-label,
  .lg-input.has-val ~ .lg-label {
    transform: translateY(-11px);
    font-size: 8px; letter-spacing: 0.16em;
    color: rgba(0,229,255,0.45);
  }
  .lg-label {
    position: absolute; left: 42px;
    top: 50%; transform: translateY(-50%);
    font-family: 'Departure Mono', monospace;
    font-size: 12px; color: rgba(255,255,255,0.2);
    letter-spacing: 0.08em; pointer-events: none;
    transition: all 0.22s ease;
  }
  .lg-field:focus-within .lg-icon {
    color: rgba(0,229,255,0.45);
    transform: scale(1.1);
  }
  .lg-eye {
    position: absolute; right: 14px;
    background: none; border: none; cursor: pointer;
    color: rgba(255,255,255,0.18); padding: 4px;
    display: flex; align-items: center;
    transition: color 0.2s; z-index: 2;
  }
  .lg-eye:hover { color: rgba(255,255,255,0.45); }

  /* ── Forgot link ── */
  .lg-forgot {
    text-align: right; margin: -4px 0 6px;
  }
  .lg-forgot a {
    font-size: 9px; letter-spacing: 0.14em;
    color: rgba(0,229,255,0.3);
    text-decoration: none;
    transition: color 0.2s;
  }
  .lg-forgot a:hover { color: rgba(0,229,255,0.6); }

  /* ── Submit ── */
  .lg-submit {
    width: 100%; height: 54px; margin-top: 4px;
    background: rgba(0,229,255,0.055);
    border: 1px solid rgba(0,229,255,0.18);
    border-radius: 16px;
    color: var(--glow-a);
    font-family: 'Departure Mono', monospace;
    font-size: 12px; letter-spacing: 0.22em;
    cursor: pointer;
    position: relative; overflow: hidden;
    transition: background 0.3s, border-color 0.3s, transform 0.15s, box-shadow 0.3s;
  }
  .lg-submit:hover:not(:disabled) {
    background: rgba(0,229,255,0.1);
    border-color: rgba(0,229,255,0.38);
    transform: translateY(-1px);
    box-shadow: 0 10px 40px rgba(0,229,255,0.1);
  }
  .lg-submit:active:not(:disabled) { transform: translateY(0); }
  .lg-submit:disabled { opacity: 0.45; cursor: not-allowed; }
  /* shimmer */
  .lg-submit::before {
    content: '';
    position: absolute; inset: 0;
    background: linear-gradient(105deg, transparent 30%, rgba(0,229,255,0.09) 50%, transparent 70%);
    transform: translateX(-100%);
    animation: lg-shimmer 2.8s ease infinite;
  }
  @keyframes lg-shimmer {
    0%,100% { transform: translateX(-100%); }
    55% { transform: translateX(200%); }
  }
  /* vertical wipe on hover */
  .lg-submit::after {
    content: '';
    position: absolute; bottom: 0; left: 0; right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(0,229,255,0.5), transparent);
    animation: lg-wipe 3s ease infinite;
    opacity: 0.6;
  }
  @keyframes lg-wipe {
    0%   { transform: scaleX(0); opacity: 0; }
    50%  { transform: scaleX(1); opacity: 0.6; }
    100% { transform: scaleX(0); opacity: 0; }
  }

  /* ── Spinner ── */
  .lg-spinner {
    width: 14px; height: 14px;
    border: 1.5px solid rgba(0,229,255,0.2);
    border-top-color: var(--glow-a);
    border-radius: 50%;
    animation: lg-spin 0.7s linear infinite;
    display: inline-block; vertical-align: middle; margin-right: 8px;
  }

  /* ── Divider ── */
  .lg-divider {
    display: flex; align-items: center; gap: 12px; margin: 22px 0;
  }
  .lg-div-line {
    flex: 1; height: 1px;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent);
  }
  .lg-div-txt { font-size: 8px; letter-spacing: 0.22em; color: rgba(255,255,255,0.1); }

  /* ── Alt auth ── */
  .lg-alt-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 22px; }
  .lg-alt-btn {
    height: 42px;
    display: flex; align-items: center; justify-content: center; gap: 7px;
    border-radius: 12px;
    font-family: 'Departure Mono', monospace;
    font-size: 8px; letter-spacing: 0.12em;
    border: 1px solid rgba(255,255,255,0.05);
    background: rgba(255,255,255,0.02);
    color: rgba(255,255,255,0.14); cursor: not-allowed;
  }

  /* ── Footer ── */
  .lg-footer { text-align: center; display: flex; flex-direction: column; gap: 10px; }
  .lg-footer-line { font-size: 10px; letter-spacing: 0.12em; color: rgba(255,255,255,0.18); }
  .lg-footer-link { color: var(--glow-a); text-decoration: none; transition: opacity 0.2s; }
  .lg-footer-link:hover { opacity: 0.7; }
  .lg-admin-link {
    font-size: 8px; letter-spacing: 0.1em;
    color: rgba(255,255,255,0.08); text-decoration: none; transition: color 0.2s;
  }
  .lg-admin-link:hover { color: rgba(255,255,255,0.25); }
`;

const ORBS = [
  { w: 560, h: 560, top: "-25%", left: "-20%", bg: "rgba(124,58,237,0.14)", dur: "20s" },
  { w: 420, h: 420, top: "55%",  left: "65%",  bg: "rgba(0,229,255,0.11)", dur: "24s", delay: "-8s" },
  { w: 320, h: 320, top: "35%",  left: "-5%",  bg: "rgba(6,255,165,0.07)", dur: "28s", delay: "-16s" },
  { w: 220, h: 220, top: "2%",   left: "78%",  bg: "rgba(0,229,255,0.06)", dur: "18s", delay: "-4s" },
];

const LoginPage = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [focused, setFocused] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoggingIn, authUser, resendVerification } = useAuthStore();
  const { play } = useSoundManager();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    play("click");
    const result = await login(formData);
    if (result?.success) {
      navigate("/");
    }
  };

  return (
    <div className="lg-root">
      <style>{styles}</style>

      {/* Ambient orbs */}
      <div className="lg-canvas">
        {ORBS.map((o, i) => (
          <div key={i} className="lg-orb" style={{
            width: o.w, height: o.h,
            top: o.top, left: o.left,
            background: o.bg,
            animationDuration: o.dur,
            animationDelay: o.delay || "0s",
          }} />
        ))}
      </div>
      <div className="lg-scanlines" />

      {/* Card */}
      <div className="lg-card">

        {/* Logo — dual counter-rotating rings */}
        <div className="lg-logo">
          <div className="lg-ring-outer" />
          <div className="lg-ring-inner" />
          <div className="lg-core">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"
                stroke="rgba(0,229,255,0.65)" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
        </div>

        <h1 className="lg-title">Enter the system</h1>
        <p className="lg-sub">AUTHENTICATE_SEQUENCE</p>

        <form onSubmit={handleSubmit}>
          {/* Email */}
          <div className="lg-field">
            <div className="lg-field-inner">
              <span className="lg-icon">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 8l10 6 10-6"/>
                </svg>
              </span>
              <input
                className={`lg-input${formData.email ? " has-val" : ""}`}
                type="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                onFocus={() => setFocused("email")}
                onBlur={() => setFocused(null)}
                autoComplete="email"
              />
              <label className="lg-label">Email Address</label>
            </div>
          </div>

          {/* Password */}
          <div className="lg-field">
            <div className="lg-field-inner">
              <span className="lg-icon">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>
                </svg>
              </span>
              <input
                className={`lg-input${formData.password ? " has-val" : ""}`}
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
                onFocus={() => setFocused("password")}
                onBlur={() => setFocused(null)}
                style={{ paddingRight: "44px" }}
                autoComplete="current-password"
              />
              <label className="lg-label">Password</label>
              <button type="button" tabIndex={-1} className="lg-eye"
                onClick={() => { play("click"); setShowPassword(!showPassword); }}>
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {/* Forgot */}
          <div className="lg-forgot">
            <Link to="/forgot-password">RECOVER_ACCESS →</Link>
          </div>

          {/* Submit */}
          <button type="submit" className="lg-submit" disabled={isLoggingIn}>
            {isLoggingIn
              ? <><span className="lg-spinner" />AUTHENTICATING...</>
              : "INITIATE_SESSION //"}
          </button>
        </form>

        {/* Divider */}
        <div className="lg-divider">
          <div className="lg-div-line" />
          <span className="lg-div-txt">OR</span>
          <div className="lg-div-line" />
        </div>

        {/* Alt auth */}
        <div className="lg-alt-row">
          <div className="lg-alt-btn">
            <Sparkles size={11} />
            CONSTELLATION (SOON)
          </div>
          <div className="lg-alt-btn">
            <Star size={11} />
            STARWEAVE (SOON)
          </div>
        </div>

        {/* Footer */}
        <div className="lg-footer">
          <p className="lg-footer-line">
            NO_ACCOUNT?{" "}
            <Link to="/signup" className="lg-footer-link">REGISTER_NODE →</Link>
          </p>
          <Link to="/admin/login" className="lg-admin-link">// ACCESS_ADMIN_TERMINAL</Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
