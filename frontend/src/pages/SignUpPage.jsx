import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, User, Send, UserPlus } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useSoundManager } from "../hooks/useSoundManager";
import toast from "react-hot-toast";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Departure+Mono&display=swap');

  :root {
    --cyan: #00e5ff;
    --purple: #7c3aed;
    --bg: #050810;
  }

  html, body { overflow: hidden !important; height: 100%; margin: 0; }
  
  .auth-root {
    position: fixed; inset: 0;
    display: flex; align-items: center; justify-content: center;
    font-family: 'Departure Mono', monospace;
    color: #fff;
    overflow: hidden !important;
  }

  .auth-bg {
    position: absolute; inset: 0; z-index: 0;
    background: radial-gradient(circle at 50% 50%, rgba(0, 229, 255, 0.08), transparent 70%);
  }
  .auth-orb {
    position: absolute; width: 500px; height: 500px;
    border-radius: 50%; filter: blur(120px);
    opacity: 0.15; mix-blend-mode: screen;
    animation: auth-float 25s infinite alternate ease-in-out;
  }
  @keyframes auth-float {
    from { transform: translate(-15%, -10%) scale(1); }
    to { transform: translate(15%, 15%) scale(1.05); }
  }

  .auth-card {
    position: relative; z-index: 10;
    width: 380px;
    padding: 40px 36px;
    background: rgba(255, 255, 255, 0.02);
    backdrop-filter: blur(40px);
    -webkit-backdrop-filter: blur(40px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 32px;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
    text-align: center;
  }

  .auth-header { margin-bottom: 28px; }
  .auth-icon-wrap {
    width: 50px; height: 50px; margin: 0 auto 16px;
    display: flex; align-items: center; justify-content: center;
    background: rgba(124, 58, 237, 0.05);
    border: 1px solid rgba(124, 58, 237, 0.2);
    border-radius: 16px;
    color: var(--purple);
  }
  .auth-title {
    font-family: 'Instrument Serif', serif;
    font-size: 30px; font-style: italic; font-weight: 400;
    margin: 0; letter-spacing: -0.02em; line-height: 1;
  }
  .auth-sub {
    font-size: 8px; letter-spacing: 0.25em;
    color: rgba(255, 255, 255, 0.3); margin-top: 8px;
    text-transform: uppercase;
  }

  .auth-form { display: flex; flex-direction: column; gap: 12px; }
  .auth-input-group { position: relative; }
  
  .auth-input {
    width: 100%; height: 48px;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 14px;
    padding: 0 16px 0 44px;
    color: #fff; font-family: 'Departure Mono', monospace;
    font-size: 12.5px; outline: none; transition: all 0.25s;
    box-sizing: border-box;
  }
  .auth-input:focus {
    border-color: var(--purple);
    background: rgba(124, 58, 237, 0.03);
    box-shadow: 0 0 0 4px rgba(124, 58, 237, 0.05);
  }

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
  .auth-input-group:focus-within .auth-input-icon { color: var(--purple); }

  .auth-eye {
    position: absolute; right: 14px; top: 50%;
    transform: translateY(-50%); background: none; border: none;
    color: rgba(255, 255, 255, 0.2); cursor: pointer;
    padding: 4px; display: flex; align-items: center;
  }

  .auth-strength { display: flex; gap: 3px; margin-top: 6px; height: 2px; padding: 0 4px; }
  .auth-strength-seg { flex: 1; background: rgba(255, 255, 255, 0.05); transition: background 0.4s; border-radius: 2px; }

  .auth-submit {
    width: 100%; height: 50px; margin-top: 10px;
    background: #fff; color: #000;
    border: none; border-radius: 14px;
    font-family: 'Departure Mono', monospace;
    font-size: 13px; font-weight: bold;
    letter-spacing: 0.12em; cursor: pointer;
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .auth-submit:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  }
  .auth-submit:disabled { opacity: 0.5; cursor: not-allowed; }

  .auth-footer { margin-top: 24px; font-size: 10px; color: rgba(255, 255, 255, 0.2); }
  .auth-link { color: var(--purple); text-decoration: none; font-weight: bold; }
  .auth-link:hover { text-decoration: underline; }
`;

const SignUpPage = () => {
  const [formData, setFormData] = useState({ username: "", email: "", password: "", telegramId: "" });
  const [showPassword, setShowPassword] = useState(false);
  const { signup, isSigningUp } = useAuthStore();
  const { play } = useSoundManager();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    play("click");
    if (!formData.username.trim()) return toast.error("Username required");
    if (!formData.email.trim()) return toast.error("Email required");
    if (!formData.telegramId) return toast.error("Telegram ID required");
    if (formData.password.length < 8) return toast.error("Min 8 characters");
    
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
    <div className="auth-root">
      <style>{styles}</style>
      <div className="auth-bg">
        <div className="auth-orb" style={{ background: 'var(--purple)', top: '15%', right: '15%' }} />
        <div className="auth-orb" style={{ background: 'var(--cyan)', bottom: '15%', left: '15%' }} />
      </div>

      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-icon-wrap">
            <UserPlus size={24} />
          </div>
          <h1 className="auth-title">Create Node</h1>
          <p className="auth-sub">INITIALIZE_IDENTITY</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-input-group">
            <User className="auth-input-icon" size={16} />
            <input
              className="auth-input"
              type="text"
              placeholder="Username"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value.replace(/\s+/g, "").toLowerCase() })}
            />
          </div>

          <div className="auth-input-group">
            <Mail className="auth-input-icon" size={16} />
            <input
              className="auth-input"
              type="email"
              placeholder="Email address"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div className="auth-input-group">
            <Send className="auth-input-icon" size={16} />
            <input
              className="auth-input"
              type="text"
              placeholder="Telegram ID"
              value={formData.telegramId}
              onChange={(e) => setFormData({ ...formData, telegramId: e.target.value.replace(/\D/g, "") })}
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
            />
            <button
              type="button"
              className="auth-eye"
              onClick={() => { play("click"); setShowPassword(!showPassword); }}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
            <div className="auth-strength">
              {[1,2,3,4].map(i => (
                <div key={i} className="auth-strength-seg" style={{ background: i <= pwStrength ? strengthColor : undefined }} />
              ))}
            </div>
          </div>

          <button type="submit" className="auth-submit" disabled={isSigningUp}>
            {isSigningUp ? "CREATING..." : "INITIALIZE NODE //"}
          </button>
        </form>

        <div className="auth-footer">
          EXISTING_NODE? <Link to="/login" className="auth-link">AUTHENTICATE →</Link>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;
