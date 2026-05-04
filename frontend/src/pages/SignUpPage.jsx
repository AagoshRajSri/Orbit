import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Sparkles, Star, UserPlus, Send, Mail, User } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useSoundManager } from "../hooks/useSoundManager";
import toast from "react-hot-toast";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Departure+Mono&display=swap');

  :root {
    --neon-cyan: #00e5ff;
    --neon-purple: #7c3aed;
    --neon-green: #06ffa5;
    --bg-deep: #050810;
    --glass: rgba(255, 255, 255, 0.03);
    --border-glow: rgba(0, 229, 255, 0.15);
  }

  /* Force parent layout to respect no-scroll */
  html, body { overflow: hidden !important; height: 100%; margin: 0; }

  .su-wrapper {
    position: fixed; inset: 0;
    font-family: 'Departure Mono', monospace;
    color: #fff;
    display: flex; align-items: center; justify-content: center;
    overflow: hidden !important;
    background: transparent;
    z-index: 50;
  }

  .su-grid-bg {
    position: absolute; inset: 0;
    background-image: 
      linear-gradient(rgba(124, 58, 237, 0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(124, 58, 237, 0.03) 1px, transparent 1px);
    background-size: 35px 35px;
    mask-image: radial-gradient(circle at center, black, transparent 80%);
    animation: grid-drift 25s linear infinite;
    pointer-events: none;
  }
  @keyframes grid-drift {
    from { transform: translateY(0); }
    to { transform: translateY(35px); }
  }

  .su-overlay {
    position: absolute; inset: 0; pointer-events: none;
    background: repeating-linear-gradient(90deg, transparent, transparent 1px, rgba(0,0,0,0.05) 1px, rgba(0,0,0,0.05) 2px);
    opacity: 0.4;
  }

  .su-card {
    position: relative;
    width: 390px;
    padding: 32px 36px;
    background: rgba(5, 8, 16, 0.85);
    backdrop-filter: blur(25px);
    border: 1px solid rgba(124, 58, 237, 0.2);
    border-radius: 4px;
    box-shadow: 0 0 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(124, 58, 237, 0.05);
    animation: su-appear 0.7s cubic-bezier(0.16, 1, 0.3, 1);
  }
  @keyframes su-appear {
    from { opacity: 0; transform: translateY(20px) scale(0.98); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }

  /* Cyber Corners */
  .su-card::before, .su-card::after, .su-card-inner::before, .su-card-inner::after {
    content: ''; position: absolute; width: 12px; height: 12px;
    border: 2px solid var(--neon-purple); pointer-events: none;
  }
  .su-card::before { top: -1px; left: -1px; border-right: 0; border-bottom: 0; }
  .su-card::after { top: -1px; right: -1px; border-left: 0; border-bottom: 0; }
  .su-card-inner::before { bottom: -1px; left: -1px; border-right: 0; border-top: 0; }
  .su-card-inner::after { bottom: -1px; right: -1px; border-left: 0; border-top: 0; }

  .su-header { text-align: center; margin-bottom: 24px; }
  .su-logo-box {
    width: 44px; height: 44px; margin: 0 auto 12px;
    display: flex; align-items: center; justify-content: center;
    border: 1px solid var(--neon-purple);
    background: rgba(124, 58, 237, 0.05);
  }
  .su-logo-box svg { filter: drop-shadow(0 0 5px var(--neon-purple)); }

  .su-title {
    font-family: 'Instrument Serif', serif;
    font-size: 26px; font-style: italic; color: #fff;
    margin: 0; line-height: 1;
  }
  .su-sub {
    font-size: 8px; color: var(--neon-purple);
    letter-spacing: 0.25em; opacity: 0.7; margin-top: 6px;
  }

  .su-group { position: relative; margin-bottom: 16px; }
  .su-label-tag {
    position: absolute; top: -7px; left: 10px;
    background: #050810; padding: 0 5px;
    font-size: 7px; color: var(--neon-purple);
    letter-spacing: 0.1em; z-index: 5;
  }
  .su-input {
    width: 100%; height: 44px;
    background: rgba(255, 255, 255, 0.015);
    border: 1px solid rgba(255, 255, 255, 0.08);
    padding: 0 14px 0 38px;
    color: #fff; font-size: 12.5px;
    font-family: 'Departure Mono', monospace;
    outline: none; transition: all 0.3s;
    box-sizing: border-box;
  }
  .su-input:focus {
    border-color: var(--neon-purple);
    background: rgba(124, 58, 237, 0.03);
    box-shadow: 0 0 12px rgba(124, 58, 237, 0.1);
  }
  .su-input-icon {
    position: absolute; left: 12px; top: 50%;
    transform: translateY(-50%); color: rgba(255,255,255,0.15);
    transition: color 0.3s;
  }
  .su-group:focus-within .su-input-icon { color: var(--neon-purple); }

  .su-hint { font-size: 7px; color: rgba(255,255,255,0.2); margin-top: 4px; display: block; letter-spacing: 0.05em; }

  /* Strength Bar */
  .su-strength { display: flex; gap: 3px; margin-top: 6px; height: 2px; }
  .su-strength-seg { flex: 1; background: rgba(255,255,255,0.05); transition: background 0.4s; }

  .su-submit {
    width: 100%; height: 46px;
    background: var(--neon-purple);
    color: #fff; font-weight: bold;
    font-family: 'Departure Mono', monospace;
    border: none; cursor: pointer;
    letter-spacing: 0.15em; font-size: 12px;
    transition: all 0.3s; position: relative;
    overflow: hidden; margin-top: 8px;
  }
  .su-submit:hover:not(:disabled) {
    background: #fff; color: #000;
    box-shadow: 0 0 20px rgba(124, 58, 237, 0.4);
  }
  .su-submit-glitch {
    position: absolute; top: 0; left: -100%; width: 100%; height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
    animation: su-glitch-sweep 4s infinite;
  }
  @keyframes su-glitch-sweep {
    0% { left: -100%; }
    40%, 100% { left: 100%; }
  }

  .su-footer { text-align: center; margin-top: 20px; font-size: 9px; }
  .su-link { color: var(--neon-purple); text-decoration: none; font-weight: bold; }
  .su-link:hover { text-decoration: underline; }
`;

const SignUpPage = () => {
  const [formData, setFormData] = useState({ username: "", email: "", password: "", telegramId: "" });
  const [showPassword, setShowPassword] = useState(false);
  const { signup, isSigningUp } = useAuthStore();
  const { play } = useSoundManager();
  const navigate = useNavigate();

  const validateForm = () => {
    if (!formData.username.trim()) return toast.error("IDENT_REQUIRED");
    if (!formData.email.trim()) return toast.error("EMAIL_REQUIRED");
    if (!/\S+@\S+\.\S+/.test(formData.email)) return toast.error("INVALID_EMAIL");
    if (!formData.telegramId) return toast.error("TELEGRAM_ID_REQUIRED");
    if (!formData.password) return toast.error("KEY_REQUIRED");
    if (formData.password.length < 8) return toast.error("KEY_TOO_SHORT");
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
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  })();
  const strengthColor = ["", "#ef4444", "#fbbf24", "#22c55e", "#00e5ff"][pwStrength] || "";

  return (
    <div className="su-wrapper">
      <style>{styles}</style>
      <div className="su-grid-bg" />
      <div className="su-overlay" />

      <div className="su-card">
        <div className="su-card-inner">
          <div className="su-header">
            <div className="su-logo-box">
              <UserPlus size={22} color="var(--neon-purple)" />
            </div>
            <h1 className="su-title">Create Identity</h1>
            <p className="su-sub">INIT_NODE_SEQUENCE_V4</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="su-group">
              <span className="su-label-tag">NODE_ID</span>
              <div className="su-input-wrap">
                <span className="su-input-icon"><User size={14} /></span>
                <input
                  className="su-input"
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value.replace(/\s+/g, "").toLowerCase() })}
                  placeholder="alias_01"
                />
              </div>
            </div>

            <div className="su-group">
              <span className="su-label-tag">COMMS_CHANNEL</span>
              <div className="su-input-wrap">
                <span className="su-input-icon"><Mail size={14} /></span>
                <input
                  className="su-input"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="protocol@orbit.network"
                />
              </div>
            </div>

            <div className="su-group">
              <span className="su-label-tag">TELEGRAM_REF</span>
              <div className="su-input-wrap">
                <span className="su-input-icon"><Send size={14} /></span>
                <input
                  className="su-input"
                  type="text"
                  value={formData.telegramId}
                  onChange={(e) => setFormData({ ...formData, telegramId: e.target.value.replace(/\D/g, "") })}
                  placeholder="89234120"
                />
              </div>
              <span className="su-hint">Verify ID via @userinfobot</span>
            </div>

            <div className="su-group" style={{ marginBottom: '12px' }}>
              <span className="su-label-tag">SECURITY_PHRASE</span>
              <div className="su-input-wrap">
                <span className="su-input-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </span>
                <input
                  className="su-input"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,255,255,0.2)', cursor: 'pointer' }}
                  onClick={() => { play("click"); setShowPassword(!showPassword); }}
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              <div className="su-strength">
                {[1,2,3,4].map(i => (
                  <div key={i} className="su-strength-seg" style={{ background: i <= pwStrength ? strengthColor : undefined }} />
                ))}
              </div>
            </div>

            <button type="submit" className="su-submit" disabled={isSigningUp}>
              {isSigningUp ? "INITIALIZING..." : "CONSTRUCT_IDENTITY //"}
              <div className="su-submit-glitch" />
            </button>
          </form>

          <div className="su-footer">
            <p style={{ color: 'rgba(255,255,255,0.3)', margin: 0 }}>
              ALREADY_SEALED? <Link to="/login" className="su-link">AUTHENTICATE →</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;
