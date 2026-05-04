import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Sparkles, Star, ShieldCheck } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useSoundManager } from "../hooks/useSoundManager";

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

  .lg-wrapper {
    position: fixed; inset: 0;
    font-family: 'Departure Mono', monospace;
    color: #fff;
    display: flex; align-items: center; justify-content: center;
    overflow: hidden !important;
    background: transparent;
    z-index: 50;
  }

  /* ── Cyber Grid Background ── */
  .lg-grid-bg {
    position: absolute; inset: 0;
    background-image: 
      linear-gradient(rgba(0, 229, 255, 0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0, 229, 255, 0.03) 1px, transparent 1px);
    background-size: 40px 40px;
    background-position: center center;
    mask-image: radial-gradient(circle at center, black, transparent 80%);
    animation: grid-drift 20s linear infinite;
    pointer-events: none;
  }
  @keyframes grid-drift {
    from { transform: translateY(0); }
    to { transform: translateY(40px); }
  }

  /* ── Scanlines & Noise ── */
  .lg-overlay {
    position: absolute; inset: 0; pointer-events: none;
    background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px);
    opacity: 0.3;
  }

  /* ── Card ── */
  .lg-card {
    position: relative;
    width: 380px;
    padding: 40px;
    background: rgba(5, 8, 16, 0.8);
    backdrop-filter: blur(20px);
    border: 1px solid var(--border-glow);
    border-radius: 4px; /* Industrial sharp look */
    box-shadow: 0 0 40px rgba(0, 0, 0, 0.5), 0 0 20px rgba(0, 229, 255, 0.05);
    animation: card-appear 0.6s cubic-bezier(0.16, 1, 0.3, 1);
  }
  @keyframes card-appear {
    from { opacity: 0; transform: scale(0.95) translateY(10px); }
    to { opacity: 1; transform: scale(1) translateY(0); }
  }

  /* Decorative corners */
  .lg-card::before, .lg-card::after, .lg-card-inner::before, .lg-card-inner::after {
    content: ''; position: absolute; width: 15px; height: 15px;
    border: 2px solid var(--neon-cyan); pointer-events: none;
  }
  .lg-card::before { top: -1px; left: -1px; border-right: 0; border-bottom: 0; }
  .lg-card::after { top: -1px; right: -1px; border-left: 0; border-bottom: 0; }
  .lg-card-inner::before { bottom: -1px; left: -1px; border-right: 0; border-top: 0; }
  .lg-card-inner::after { bottom: -1px; right: -1px; border-left: 0; border-top: 0; }

  /* ── Header ── */
  .lg-header { text-align: center; margin-bottom: 32px; }
  .lg-logo-box {
    width: 50px; height: 50px; margin: 0 auto 16px;
    display: flex; align-items: center; justify-content: center;
    border: 1px solid var(--neon-cyan);
    background: rgba(0, 229, 255, 0.05);
    position: relative;
  }
  .lg-logo-box svg { filter: drop-shadow(0 0 5px var(--neon-cyan)); }

  .lg-title {
    font-family: 'Instrument Serif', serif;
    font-size: 28px; font-style: italic; color: #fff;
    margin: 0; line-height: 1.2; letter-spacing: -0.02em;
  }
  .lg-sub {
    font-size: 9px; color: var(--neon-cyan);
    letter-spacing: 0.3em; opacity: 0.6; margin-top: 4px;
  }

  /* ── Inputs ── */
  .lg-group { position: relative; margin-bottom: 20px; }
  .lg-label-tag {
    position: absolute; top: -8px; left: 12px;
    background: #050810; padding: 0 6px;
    font-size: 8px; color: var(--neon-cyan);
    letter-spacing: 0.1em; z-index: 5;
  }
  .lg-input-wrap { position: relative; }
  .lg-input {
    width: 100%; height: 48px;
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.1);
    padding: 0 16px 0 42px;
    color: #fff; font-size: 13px;
    font-family: 'Departure Mono', monospace;
    outline: none; transition: all 0.3s;
    box-sizing: border-box;
  }
  .lg-input:focus {
    border-color: var(--neon-cyan);
    background: rgba(0, 229, 255, 0.03);
    box-shadow: 0 0 15px rgba(0, 229, 255, 0.1);
  }
  .lg-input-icon {
    position: absolute; left: 14px; top: 50%;
    transform: translateY(-50%); color: rgba(255,255,255,0.2);
    transition: color 0.3s;
  }
  .lg-group:focus-within .lg-input-icon { color: var(--neon-cyan); }

  /* ── Submit ── */
  .lg-submit {
    width: 100%; height: 50px;
    background: var(--neon-cyan);
    color: #050810; font-weight: bold;
    font-family: 'Departure Mono', monospace;
    border: none; cursor: pointer;
    letter-spacing: 0.1em; font-size: 13px;
    transition: all 0.3s; position: relative;
    overflow: hidden; margin-top: 10px;
  }
  .lg-submit:hover:not(:disabled) {
    background: #fff;
    box-shadow: 0 0 20px rgba(0, 229, 255, 0.4);
    transform: translateY(-1px);
  }
  .lg-submit:disabled { opacity: 0.5; cursor: not-allowed; }
  .lg-submit-glitch {
    position: absolute; top: 0; left: -100%; width: 100%; height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
    animation: glitch-sweep 3s infinite;
  }
  @keyframes glitch-sweep {
    0% { left: -100%; }
    50%, 100% { left: 100%; }
  }

  /* ── Footer ── */
  .lg-footer { text-align: center; margin-top: 24px; font-size: 10px; }
  .lg-link { color: var(--neon-cyan); text-decoration: none; transition: opacity 0.2s; }
  .lg-link:hover { opacity: 0.7; text-decoration: underline; }
  
  .lg-divider { display: flex; align-items: center; gap: 12px; margin: 20px 0; color: rgba(255,255,255,0.1); }
  .lg-div-line { flex: 1; height: 1px; background: rgba(255,255,255,0.05); }

  .lg-alt { display: flex; gap: 10px; margin-bottom: 20px; }
  .lg-alt-btn {
    flex: 1; height: 38px; display: flex; align-items: center; justify-content: center; gap: 6px;
    background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05);
    font-size: 8px; color: rgba(255,255,255,0.2); cursor: not-allowed;
  }
`;

const LoginPage = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoggingIn } = useAuthStore();
  const { play } = useSoundManager();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    play("click");
    const result = await login(formData);
    if (result?.success) navigate("/");
  };

  return (
    <div className="lg-wrapper">
      <style>{styles}</style>
      <div className="lg-grid-bg" />
      <div className="lg-overlay" />

      <div className="lg-card">
        <div className="lg-card-inner">
          <div className="lg-header">
            <div className="lg-logo-box">
              <ShieldCheck size={24} color="var(--neon-cyan)" />
            </div>
            <h1 className="lg-title">System Entry</h1>
            <p className="lg-sub">AUTHENTICATION_PROTOCOL_V4</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="lg-group">
              <span className="lg-label-tag">EMAIL_ADDRESS</span>
              <div className="lg-input-wrap">
                <span className="lg-input-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                </span>
                <input
                  className="lg-input"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="name@orbit.com"
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="lg-group">
              <span className="lg-label-tag">SECURITY_KEY</span>
              <div className="lg-input-wrap">
                <span className="lg-input-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </span>
                <input
                  className="lg-input"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="lg-eye"
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,255,255,0.2)', cursor: 'pointer' }}
                  onClick={() => { play("click"); setShowPassword(!showPassword); }}
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <div style={{ textAlign: "right", marginTop: "-12px", marginBottom: "16px" }}>
              <Link to="/forgot-password" style={{ fontSize: "9px", color: "rgba(0, 229, 255, 0.4)", textDecoration: "none" }}>
                RECOVER_ID →
              </Link>
            </div>

            <button type="submit" className="lg-submit" disabled={isLoggingIn}>
              {isLoggingIn ? "INITIALIZING..." : "INITIATE_SESSION //"}
              <div className="lg-submit-glitch" />
            </button>
          </form>

          <div className="lg-divider">
            <div className="lg-div-line" />
            <span style={{ fontSize: '8px' }}>ALT_AUTH</span>
            <div className="lg-div-line" />
          </div>

          <div className="lg-alt">
            <div className="lg-alt-btn"><Sparkles size={10} /> CONSTELLATION</div>
            <div className="lg-alt-btn"><Star size={10} /> STARWEAVE</div>
          </div>

          <div className="lg-footer">
            <p style={{ color: 'rgba(255,255,255,0.3)', margin: 0 }}>
              NO_IDENT_FOUND? <Link to="/signup" className="lg-link">INITIALIZE_NODE →</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
