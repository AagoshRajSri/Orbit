import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, Mail, ShieldCheck } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useSoundManager } from "../hooks/useSoundManager";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Departure+Mono&display=swap');

  :root {
    --cyan: #00e5ff;
    --purple: #7c3aed;
    --bg: #050810;
  }

  /* ── Layout — No Scroll ── */
  html, body { overflow: hidden !important; height: 100%; margin: 0; }
  
  .auth-root {
    position: fixed; inset: 0;
    display: flex; align-items: center; justify-content: center;
    font-family: 'Departure Mono', monospace;
    color: #fff;
    overflow: hidden !important;
  }

  /* ── Ambient Background ── */
  .auth-bg {
    position: absolute; inset: 0; z-index: 0;
    background: radial-gradient(circle at 50% 50%, rgba(124, 58, 237, 0.08), transparent 70%);
  }
  .auth-orb {
    position: absolute; width: 400px; height: 400px;
    border-radius: 50%; filter: blur(100px);
    opacity: 0.2; mix-blend-mode: screen;
    animation: auth-float 20s infinite alternate ease-in-out;
  }
  @keyframes auth-float {
    from { transform: translate(-10%, -10%) scale(1); }
    to { transform: translate(10%, 10%) scale(1.1); }
  }

  /* ── Card ── */
  .auth-card {
    position: relative; z-index: 10;
    width: 360px;
    padding: 48px 36px;
    background: rgba(255, 255, 255, 0.02);
    backdrop-filter: blur(40px);
    -webkit-backdrop-filter: blur(40px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 32px;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
    text-align: center;
  }

  /* ── Header ── */
  .auth-header { margin-bottom: 36px; }
  .auth-icon-wrap {
    width: 54px; height: 54px; margin: 0 auto 20px;
    display: flex; align-items: center; justify-content: center;
    background: rgba(0, 229, 255, 0.05);
    border: 1px solid rgba(0, 229, 255, 0.2);
    border-radius: 18px;
    color: var(--cyan);
  }
  .auth-title {
    font-family: 'Instrument Serif', serif;
    font-size: 32px; font-style: italic; font-weight: 400;
    margin: 0; letter-spacing: -0.02em; line-height: 1;
  }
  .auth-sub {
    font-size: 9px; letter-spacing: 0.25em;
    color: rgba(255, 255, 255, 0.3); margin-top: 8px;
    text-transform: uppercase;
  }

  /* ── Form ── */
  .auth-form { display: flex; flex-direction: column; gap: 14px; }
  .auth-input-group { position: relative; }
  
  .auth-input {
    width: 100%; height: 52px;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 16px;
    padding: 0 16px 0 46px;
    color: #fff; font-family: 'Departure Mono', monospace;
    font-size: 13px; outline: none; transition: all 0.25s;
    box-sizing: border-box;
  }
  .auth-input:focus {
    border-color: var(--cyan);
    background: rgba(0, 229, 255, 0.03);
    box-shadow: 0 0 0 4px rgba(0, 229, 255, 0.05);
  }

  /* Browser Autofill Fix */
  .auth-input:-webkit-autofill,
  .auth-input:-webkit-autofill:hover, 
  .auth-input:-webkit-autofill:focus {
    -webkit-text-fill-color: #fff;
    -webkit-box-shadow: 0 0 0px 1000px #0a0c14 inset;
    transition: background-color 5000s ease-in-out 0s;
    border: 1px solid rgba(255, 255, 255, 0.08);
  }

  .auth-input-icon {
    position: absolute; left: 16px; top: 50%;
    transform: translateY(-50%); color: rgba(255, 255, 255, 0.2);
    transition: color 0.25s; pointer-events: none;
  }
  .auth-input-group:focus-within .auth-input-icon { color: var(--cyan); }

  .auth-eye {
    position: absolute; right: 14px; top: 50%;
    transform: translateY(-50%); background: none; border: none;
    color: rgba(255, 255, 255, 0.2); cursor: pointer;
    padding: 4px; display: flex; align-items: center;
  }

  .auth-forgot {
    text-align: right; margin-top: -6px; margin-bottom: 4px;
  }
  .auth-forgot-link {
    font-size: 9px; color: rgba(255, 255, 255, 0.25);
    text-decoration: none; transition: color 0.2s;
  }
  .auth-forgot-link:hover { color: var(--cyan); }

  /* ── Submit ── */
  .auth-submit {
    width: 100%; height: 52px; margin-top: 10px;
    background: #fff; color: #000;
    border: none; border-radius: 16px;
    font-family: 'Departure Mono', monospace;
    font-size: 13px; font-weight: bold;
    letter-spacing: 0.1em; cursor: pointer;
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .auth-submit:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2), 0 0 15px rgba(255, 255, 255, 0.1);
  }
  .auth-submit:active:not(:disabled) { transform: translateY(0); }
  .auth-submit:disabled { opacity: 0.5; cursor: not-allowed; }

  /* ── Footer ── */
  .auth-footer { margin-top: 32px; font-size: 10px; color: rgba(255, 255, 255, 0.2); }
  .auth-link { color: var(--cyan); text-decoration: none; font-weight: bold; }
  .auth-link:hover { text-decoration: underline; }
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
    <div className="auth-root">
      <style>{styles}</style>
      <div className="auth-bg">
        <div className="auth-orb" style={{ background: 'var(--cyan)', top: '10%', left: '10%' }} />
        <div className="auth-orb" style={{ background: 'var(--purple)', bottom: '10%', right: '10%' }} />
      </div>

      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-icon-wrap">
            <ShieldCheck size={26} />
          </div>
          <h1 className="auth-title">Welcome back</h1>
          <p className="auth-sub">AUTHENTICATE_SESSION</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-input-group">
            <Mail className="auth-input-icon" size={16} />
            <input
              className="auth-input"
              type="email"
              placeholder="Email address"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              autoComplete="email"
            />
          </div>

          <div className="auth-input-group">
            <Lock className="auth-input-icon" size={16} />
            <input
              className="auth-input"
              type={showPassword ? "text" : "password"}
              placeholder="Security password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              autoComplete="current-password"
            />
            <button
              type="button"
              className="auth-eye"
              onClick={() => { play("click"); setShowPassword(!showPassword); }}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <div className="auth-forgot">
            <Link to="/forgot-password" size={16} className="auth-forgot-link">
              RECOVER_ACCESS →
            </Link>
          </div>

          <button type="submit" className="auth-submit" disabled={isLoggingIn}>
            {isLoggingIn ? "VERIFYING..." : "INITIATE SESSION //"}
          </button>
        </form>

        <div className="auth-footer">
          NO_ACCOUNT? <Link to="/signup" className="auth-link">REGISTER_NODE →</Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
