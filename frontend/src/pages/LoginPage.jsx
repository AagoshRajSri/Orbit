import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useSoundManager } from "../hooks/useSoundManager";

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap');
*{box-sizing:border-box;}
.lp-root{
  height:100%; min-height:100dvh;
  background:#05070f;
  display:flex; flex-direction:column;
  overflow-y:auto; overflow-x:hidden;
  position:relative;
  font-family:'Inter',sans-serif;
}
/* Left accent rail */
.lp-rail{
  position:fixed; left:0; top:0; bottom:0; width:3px; z-index:10;
  background:linear-gradient(180deg,transparent 0%,#7c3aed 25%,#38bdf8 55%,#7c3aed 80%,transparent 100%);
  animation:railPulse 4s ease-in-out infinite;
}
@keyframes railPulse{0%,100%{opacity:.4} 50%{opacity:1}}
/* Subtle grid */
.lp-grid{
  position:fixed; inset:0; z-index:0; pointer-events:none;
  background-image:linear-gradient(rgba(124,58,237,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(124,58,237,.04) 1px,transparent 1px);
  background-size:54px 54px;
}
/* Scan line */
.lp-scan{
  position:fixed; left:0; right:0; height:80px; pointer-events:none; z-index:1;
  background:linear-gradient(180deg,transparent,rgba(124,58,237,.05),transparent);
  animation:scan 12s linear infinite;
}
@keyframes scan{0%{transform:translateY(-80px)} 100%{transform:translateY(100vh)}}
/* Ambient glows */
.lp-g1{position:fixed;top:-80px;right:-40px;width:300px;height:300px;border-radius:50%;background:radial-gradient(circle,rgba(56,189,248,.12) 0%,transparent 70%);pointer-events:none;z-index:0;}
.lp-g2{position:fixed;bottom:-80px;left:20px;width:260px;height:260px;border-radius:50%;background:radial-gradient(circle,rgba(124,58,237,.1) 0%,transparent 70%);pointer-events:none;z-index:0;}
/* Content */
.lp-body{
  position:relative; z-index:2;
  flex:1; display:flex; flex-direction:column;
  padding:28px 28px 24px 36px;
}
/* Header */
.lp-top{display:flex;align-items:center;justify-content:space-between;flex-shrink:0;margin-bottom:36px;}
.lp-brand{display:flex;align-items:center;gap:10px;}
.lp-orb{
  width:32px;height:32px;border-radius:50%;
  border:1.5px solid rgba(124,58,237,.5);
  display:flex;align-items:center;justify-content:center;
  position:relative;
}
.lp-orb-inner{width:8px;height:8px;border-radius:50%;background:#7c3aed;box-shadow:0 0 12px #7c3aed;}
.lp-orb::after{
  content:'';position:absolute;width:5px;height:5px;border-radius:50%;
  background:#38bdf8;box-shadow:0 0 8px #38bdf8;
  top:-3px;left:50%;transform:translateX(-50%);
  animation:orbRing 2.4s linear infinite;transform-origin:50% calc(100% + 13px);
}
@keyframes orbRing{to{transform:translateX(-50%) rotate(360deg);}}
.lp-name-col{display:flex;flex-direction:column;gap:1px;}
.lp-name{font-family:'JetBrains Mono',monospace;font-size:14px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:rgba(255,255,255,.8);}
.lp-sub{font-family:'JetBrains Mono',monospace;font-size:8px;color:rgba(255,255,255,.2);letter-spacing:.14em;text-transform:uppercase;}
.lp-status{
  display:flex;align-items:center;gap:5px;
  font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:.12em;text-transform:uppercase;
  color:rgba(52,211,153,.7);
}
.lp-ping{
  width:5px;height:5px;border-radius:50%;background:#34d399;box-shadow:0 0 7px #34d399;
  animation:ping 2.2s ease-in-out infinite;
}
@keyframes ping{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.3;transform:scale(1.8)}}
/* Hero */
.lp-hero{flex-shrink:0;margin-bottom:44px;}
.lp-eyebrow{
  display:flex;align-items:center;gap:8px;margin-bottom:12px;
}
.lp-eyebrow-line{height:1px;width:24px;background:linear-gradient(90deg,#7c3aed,transparent);}
.lp-eyebrow-text{font-family:'JetBrains Mono',monospace;font-size:8.5px;letter-spacing:.22em;text-transform:uppercase;color:rgba(124,58,237,.65);}
.lp-h1{
  font-size:clamp(36px,7vw,54px);font-weight:800;color:#fff;
  letter-spacing:-1.5px;line-height:1;margin:0 0 4px;
}
.lp-h1 span{
  display:block;font-style:italic;
  -webkit-text-stroke:1.5px rgba(255,255,255,.35);
  color:transparent;
}
/* Form */
.lp-form{flex-shrink:0;}
.lp-field{
  position:relative;
  border-bottom:1px solid rgba(255,255,255,.08);
  margin-bottom:32px;
  padding-bottom:2px;
  transition:border-color .25s;
}
.lp-field:focus-within{border-bottom-color:transparent;}
.lp-field::after{
  content:'';position:absolute;bottom:-1px;left:0;
  width:0;height:2px;
  background:linear-gradient(90deg,#7c3aed,#38bdf8);
  transition:width .4s cubic-bezier(.4,0,.2,1);
}
.lp-field:focus-within::after{width:100%;}
.lp-fmeta{
  display:flex;align-items:center;justify-content:space-between;
  margin-bottom:10px;
}
.lp-fid{
  font-family:'JetBrains Mono',monospace;font-size:8px;font-weight:700;
  letter-spacing:.2em;text-transform:uppercase;color:rgba(124,58,237,.55);
}
.lp-fname{
  font-family:'JetBrains Mono',monospace;font-size:8px;letter-spacing:.14em;
  text-transform:uppercase;color:rgba(255,255,255,.2);
}
.lp-fmeta a{
  font-family:'JetBrains Mono',monospace;font-size:8px;letter-spacing:.1em;
  color:rgba(124,58,237,.6);text-decoration:none;text-transform:uppercase;
  transition:color .2s;
}
.lp-fmeta a:hover{color:#a78bfa;}
.lp-frow{display:flex;align-items:center;gap:10px;padding-bottom:8px;}
.lp-fico{
  color:rgba(255,255,255,.18);flex-shrink:0;display:flex;align-items:center;
  transition:color .25s;
}
.lp-field:focus-within .lp-fico{color:rgba(124,58,237,.6);}
.lp-input{
  flex:1;background:transparent;border:none;outline:none;
  color:#f0f4ff;font-family:'Inter',sans-serif;
  font-size:17px;font-weight:400;caret-color:#7c3aed;padding:0;
}
.lp-input::placeholder{color:rgba(255,255,255,.09);}
.lp-eye{background:none;border:none;padding:4px;cursor:pointer;color:rgba(255,255,255,.18);display:flex;align-items:center;transition:color .2s;}
.lp-eye:hover{color:rgba(255,255,255,.5);}
/* Unique arrow-shaped submit */
.lp-submit-wrap{margin-bottom:20px;}
.lp-submit{
  position:relative;width:100%;height:54px;border:none;cursor:pointer;
  background:linear-gradient(90deg,#7c3aed 0%,#4f46e5 55%,#3b82f6 100%);
  clip-path:polygon(0 0,calc(100% - 22px) 0,100% 50%,calc(100% - 22px) 100%,0 100%);
  display:flex;align-items:center;
  padding:0 50px 0 24px;
  font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:700;
  letter-spacing:.2em;text-transform:uppercase;color:#fff;
  transition:transform .2s,box-shadow .3s;
  box-shadow:0 0 36px rgba(124,58,237,.4);
}
.lp-submit:not(:disabled):hover{
  transform:translateX(4px);
  box-shadow:0 0 56px rgba(124,58,237,.6);
}
.lp-submit:disabled{opacity:.4;cursor:not-allowed;}
.lp-submit-inner{display:flex;align-items:center;gap:10px;}
/* Alt methods */
.lp-or{
  display:flex;align-items:center;gap:10px;margin-bottom:12px;
  font-family:'JetBrains Mono',monospace;font-size:8.5px;letter-spacing:.14em;
  color:rgba(255,255,255,.18);text-transform:uppercase;
}
.lp-or::before,.lp-or::after{content:'';flex:1;height:1px;background:rgba(255,255,255,.07);}
.lp-alts{display:flex;gap:10px;margin-bottom:0;}
.lp-alt{
  flex:1;display:flex;align-items:center;justify-content:space-between;
  padding:10px 12px;
  border:1px solid rgba(255,255,255,.07);
  font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:.06em;
  color:rgba(255,255,255,.2);cursor:not-allowed;
  background:rgba(255,255,255,.018);
}
.lp-alt-badge{
  font-size:7px;padding:2px 5px;
  background:rgba(124,58,237,.12);color:rgba(167,139,250,.55);
  border:1px solid rgba(124,58,237,.2);
}
/* Footer */
.lp-foot{
  margin-top:auto;padding-top:20px;
  display:flex;align-items:center;justify-content:space-between;
  flex-wrap:wrap;gap:8px;
  border-top:1px solid rgba(255,255,255,.05);
  flex-shrink:0;
}
.lp-foot-txt{font-size:12px;color:rgba(255,255,255,.3);}
.lp-foot-txt a{color:#7c3aed;text-decoration:none;font-weight:600;transition:color .2s;}
.lp-foot-txt a:hover{color:#a78bfa;}
.lp-admin{
  display:flex;align-items:center;gap:5px;
  font-family:'JetBrains Mono',monospace;font-size:8.5px;letter-spacing:.08em;text-transform:uppercase;
  color:rgba(255,255,255,.18);text-decoration:none;
  padding:5px 10px;border:1px solid rgba(255,255,255,.07);transition:all .2s;
}
.lp-admin:hover{color:rgba(239,68,68,.65);border-color:rgba(239,68,68,.2);}
/* Spinner */
.lp-spin{
  width:14px;height:14px;border-radius:50%;
  border:2px solid rgba(255,255,255,.25);border-top-color:#fff;
  animation:spin .7s linear infinite;display:inline-block;flex-shrink:0;
}
@keyframes spin{to{transform:rotate(360deg);}}
/* Decorative coord readout top-right */
.lp-coord{
  position:fixed;top:14px;right:20px;
  font-family:'JetBrains Mono',monospace;font-size:7px;
  color:rgba(255,255,255,.1);letter-spacing:.1em;
  pointer-events:none;z-index:3;
  display:flex;flex-direction:column;align-items:flex-end;gap:2px;
}
`;

const IcoMail = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
    <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
  </svg>
);
const IcoLock = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);
const IcoShield = () => (
  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);
const IcoArrow = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <path d="M5 12h14M13 6l6 6-6 6"/>
  </svg>
);

export default function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const { login, isLoggingIn } = useAuthStore();
  const { play } = useSoundManager();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    play?.("click");
    const result = await login(form);
    if (result?.success) navigate("/");
  };

  return (
    <>
      <style>{CSS}</style>
      <div className="lp-root">
        <div className="lp-rail" />
        <div className="lp-grid" />
        <div className="lp-scan" />
        <div className="lp-g1" />
        <div className="lp-g2" />
        <div className="lp-coord">
          <span>LAT 28.6139 · LNG 77.2088</span>
          <span>NODE_ALPHA · SECURE</span>
        </div>

        <div className="lp-body">
          {/* Header */}
          <div className="lp-top">
            <div className="lp-brand">
              <div className="lp-orb">
                <div className="lp-orb-inner" />
              </div>
              <div className="lp-name-col">
                <span className="lp-name">Orbit</span>
                <span className="lp-sub">Encrypted · E2EE</span>
              </div>
            </div>
            <div className="lp-status">
              <div className="lp-ping" />
              Node Online
            </div>
          </div>

          {/* Hero */}
          <div className="lp-hero">
            <div className="lp-eyebrow">
              <div className="lp-eyebrow-line" />
              <span className="lp-eyebrow-text">Authentication Protocol</span>
            </div>
            <h1 className="lp-h1">
              Welcome<span>back.</span>
            </h1>
          </div>

          {/* Form */}
          <form className="lp-form" onSubmit={handleSubmit}>
            <div className="lp-field">
              <div className="lp-fmeta">
                <span className="lp-fid">01 ──</span>
                <span className="lp-fname">Email Address</span>
              </div>
              <div className="lp-frow">
                <span className="lp-fico"><IcoMail /></span>
                <input className="lp-input" type="email" placeholder="you@orbit.network"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  autoComplete="email" required />
              </div>
            </div>

            <div className="lp-field">
              <div className="lp-fmeta">
                <span className="lp-fid">02 ──</span>
                <span className="lp-fname">Auth Key</span>
                <Link to="/forgot-password">Forgot?</Link>
              </div>
              <div className="lp-frow">
                <span className="lp-fico"><IcoLock /></span>
                <input className="lp-input"
                  type={showPw ? "text" : "password"} placeholder="••••••••••••"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  autoComplete="current-password" required />
                <button type="button" className="lp-eye" onClick={() => { play?.("click"); setShowPw(p => !p); }}>
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div className="lp-submit-wrap">
              <button type="submit" className="lp-submit" disabled={isLoggingIn}>
                <span className="lp-submit-inner">
                  {isLoggingIn
                    ? <><span className="lp-spin" /> Authenticating…</>
                    : <>Initiate Session <IcoArrow /></>}
                </span>
              </button>
            </div>
          </form>

          {/* Alt auth */}
          <div className="lp-or">Via</div>
          <div className="lp-alts">
            <div className="lp-alt"><span>✦ Constellation</span><span className="lp-alt-badge">SOON</span></div>
            <div className="lp-alt"><span>✧ Starweave</span><span className="lp-alt-badge">SOON</span></div>
          </div>

          {/* Footer */}
          <div className="lp-foot">
            <div className="lp-foot-txt">No account? <Link to="/signup">Create one →</Link></div>
            <Link to="/admin/login" className="lp-admin"><IcoShield /> Admin</Link>
          </div>
        </div>
      </div>
    </>
  );
}
