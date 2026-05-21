import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useSoundManager } from "../hooks/useSoundManager";

/* ─── Styles ─────────────────────────────────────────────────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Space+Mono:ital,wght@0,400;0,700;1,400&display=swap');
.lp-root{min-height:100dvh;background:transparent;display:flex;flex-direction:column;overflow-y:auto;overflow-x:hidden;position:relative;font-family:'Space Mono',monospace;color:#c8d8f0;overscroll-behavior:none;scrollbar-width:none;-ms-overflow-style:none}
.lp-root::-webkit-scrollbar{display:none !important}
.lp-stars{position:fixed;inset:0;z-index:0;pointer-events:none}
.lp-orbital{position:fixed;inset:0;z-index:1;display:flex;align-items:center;justify-content:center;pointer-events:none;opacity:.11}
.lp-page{position:relative;z-index:2;flex:1;display:flex;align-items:center;justify-content:center;padding:20px;min-height:inherit}
/* Hull */
.lp-hull{width:100%;max-width:500px;position:relative}
.lp-hull::before{content:'';position:absolute;inset:-1px;clip-path:polygon(0 0,calc(100% - 40px) 0,100% 40px,100% 100%,40px 100%,0 100%);background:linear-gradient(135deg,rgba(79,53,243,.9) 0%,rgba(0,229,255,.5) 40%,rgba(79,53,243,.1) 100%);z-index:0;animation:lpBorderPulse 4s ease-in-out infinite}
@keyframes lpBorderPulse{0%,100%{opacity:.5}50%{opacity:1}}
.lp-inner{position:relative;z-index:1;clip-path:polygon(0 0,calc(100% - 40px) 0,100% 40px,100% 100%,40px 100%,0 100%);background:linear-gradient(160deg,rgba(10,15,46,.97) 0%,rgba(5,8,16,.99) 100%);padding:28px 28px 24px;overflow:hidden}
.lp-inner::after{content:'';position:absolute;inset:0;background:repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,229,255,.013) 2px,rgba(0,229,255,.013) 4px);pointer-events:none;z-index:10;animation:lpScanMove 10s linear infinite}
@keyframes lpScanMove{from{background-position:0 0}to{background-position:0 80px}}
.lp-inner::before{content:'';position:absolute;bottom:0;left:0;width:40px;height:40px;border-left:1.5px solid rgba(0,229,255,.35);border-bottom:1.5px solid rgba(0,229,255,.35);pointer-events:none;z-index:11}
.lp-corner-tr{position:absolute;top:0;right:0;width:40px;height:40px;border-right:1.5px solid rgba(0,229,255,.35);border-top:1.5px solid rgba(0,229,255,.35);z-index:11}
/* Status bar */
.lp-status{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;padding-bottom:10px;border-bottom:1px solid rgba(79,53,243,.18)}
.lp-brand-name{font-family:'Orbitron',monospace;font-size:18px;font-weight:700;letter-spacing:.3em;text-transform:uppercase;color:#fff}
.lp-brand-sub{font-size:10px;letter-spacing:.18em;color:rgba(0,229,255,.4);text-transform:uppercase;margin-top:2px}
.lp-node-row{display:flex;align-items:center;gap:6px;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:rgba(52,211,153,.8)}
.lp-dot{position:relative;width:7px;height:7px;border-radius:50%;background:#34d399;flex-shrink:0}
.lp-dot::before{content:'';position:absolute;inset:-4px;border-radius:50%;border:1px solid rgba(52,211,153,.35);animation:lpRadar 2s ease-out infinite}
.lp-dot::after{content:'';position:absolute;inset:-9px;border-radius:50%;border:1px solid rgba(52,211,153,.1);animation:lpRadar 2s ease-out .4s infinite}
@keyframes lpRadar{0%{transform:scale(1);opacity:.8}100%{transform:scale(3);opacity:0}}
.lp-coords{font-size:10px;letter-spacing:.06em;color:rgba(200,216,240,.2);font-variant-numeric:tabular-nums;margin-top:4px;text-align:right}
/* Hero */
.lp-hero{margin-bottom:20px}
.lp-eyebrow{display:flex;align-items:center;gap:8px;margin-bottom:10px}
.lp-eyebrow-line{width:20px;height:1px;background:linear-gradient(90deg,#4f35f3,transparent)}
.lp-eyebrow-text{font-size:11px;letter-spacing:.22em;text-transform:uppercase;color:rgba(79,53,243,.65)}
.lp-h1{font-family:'Orbitron',monospace;font-size:clamp(26px,6vw,40px);font-weight:900;text-transform:uppercase;letter-spacing:-.02em;line-height:1}
.lp-h-line1{display:block;animation:lpReveal .5s cubic-bezier(.25,.46,.45,.94) forwards}
.lp-h-back{display:block;color:#00e5ff;text-shadow:0 0 20px rgba(0,229,255,.5);animation:lpReveal .5s .15s cubic-bezier(.25,.46,.45,.94) both,lpChromatic 7s 1.5s ease-in-out infinite}
@keyframes lpReveal{from{clip-path:inset(0 0 100% 0);transform:translateY(8px);opacity:0}to{clip-path:inset(0 0 0% 0);transform:translateY(0);opacity:1}}
@keyframes lpChromatic{0%,84%,100%{text-shadow:0 0 20px rgba(0,229,255,.5);transform:none}86%{text-shadow:-2px 0 #ff2d78,2px 0 #00e5ff;transform:translateX(1px)}88%{text-shadow:2px 0 #ff2d78,-2px 0 #00e5ff;transform:translateX(-1px)}90%{text-shadow:0 0 20px rgba(0,229,255,.5);transform:none}}
/* HUD fields */
.lp-field{margin-bottom:18px}
.lp-label{display:flex;align-items:center;justify-content:space-between;font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:rgba(79,53,243,.55);margin-bottom:8px;transition:color .25s}
.lp-field:focus-within .lp-label{color:#00e5ff}
.lp-label a{color:rgba(79,53,243,.5);text-decoration:none;font-size:10px;letter-spacing:.1em;transition:color .2s}
.lp-label a:hover{color:#00e5ff}
.lp-bracket-row{display:flex;align-items:center;gap:8px}
.lp-bl,.lp-br{font-size:26px;line-height:1;color:rgba(79,53,243,.4);transition:color .25s;flex-shrink:0;font-family:'Space Mono',monospace}
.lp-field:focus-within .lp-bl,.lp-field:focus-within .lp-br{color:#00e5ff}
.lp-input-wrap{flex:1;position:relative;border-bottom:1px solid rgba(79,53,243,.2);transition:border-color .25s}
.lp-field:focus-within .lp-input-wrap{border-bottom-color:transparent}
.lp-input-wrap::after{content:'';position:absolute;bottom:-1px;left:0;width:0;height:1.5px;background:linear-gradient(90deg,#4f35f3,#00e5ff);transition:width .4s cubic-bezier(.4,0,.2,1);box-shadow:0 0 8px rgba(0,229,255,.7)}
.lp-field:focus-within .lp-input-wrap::after{width:100%}
.lp-input{width:100%;background:transparent;border:none;outline:none;color:#c8d8f0;font-family:'Space Mono',monospace;font-size:18px;padding:6px 28px 10px 0;caret-color:#00e5ff;letter-spacing:.04em}
.lp-input::placeholder{color:rgba(200,216,240,.15);font-size:15px}
.lp-eye{position:absolute;right:0;top:50%;transform:translateY(-55%);background:none;border:none;cursor:pointer;color:rgba(200,216,240,.25);display:flex;align-items:center;transition:color .2s}
.lp-eye:hover{color:#00e5ff}
/* Button */
.lp-btn-wrap{margin:6px 0 14px}
.lp-btn{
  width:100%;
  height:60px;
  border:none;
  cursor:pointer;
  position:relative;
  overflow:visible;
  background:linear-gradient(90deg, #ffffff 0%, #fffbe6 30%, #fef08a 65%, #facc15 100%);
  transform:skewX(-6deg);
  font-family:'Orbitron',monospace;
  font-size:14px;
  font-weight:900;
  letter-spacing:.22em;
  text-transform:uppercase;
  color:#050810;
  box-shadow:0 0 24px rgba(250,204,21,.4),inset 0 1px 0 rgba(255,255,255,.25);
  transition:all .4s cubic-bezier(0.16, 1, 0.3, 1);
}
.lp-btn-inner{display:flex;align-items:center;justify-content:center;gap:10px;transform:skewX(6deg);position:relative;z-index:2}
.lp-btn::before, .lp-btn::after{
  content:'';
  position:absolute;
  inset:0;
  border:1.5px solid rgba(250,204,21,.65);
  pointer-events:none;
  transform:scale(1);
  opacity:0;
  z-index:1;
}
.lp-btn:hover{
  background:linear-gradient(90deg, #ffffff 0%, #fffbeb 20%, #fef08a 50%, #facc15 80%, #fbbf24 100%);
  box-shadow:0 0 45px rgba(250,204,21,.85), 0 0 80px rgba(255,255,255,.4), inset 0 1px 0 rgba(255,255,255,.4);
  animation:lpHeartbeatHover 1.5s cubic-bezier(0.25, 0.8, 0.25, 1) infinite;
}
@keyframes lpHeartbeatHover{
  0%,100%{transform:skewX(-6deg) scale(1.03);box-shadow:0 0 30px rgba(250,204,21,.6)}
  50%{transform:skewX(-6deg) scale(1.06);box-shadow:0 0 48px rgba(250,204,21,.9),0 0 80px rgba(255,255,255,.4)}
}
.lp-btn:hover::before{
  animation:lpRippleHover 1.2s cubic-bezier(0.1, 0.8, 0.3, 1) infinite;
}
.lp-btn:hover::after{
  animation:lpRippleHover 1.2s cubic-bezier(0.1, 0.8, 0.3, 1) infinite;
  animation-delay:0.4s;
}
@keyframes lpRippleHover{
  0%{transform:scale(1);opacity:0.95;border-color:#fff}
  100%{transform:scale(1.22, 1.45);opacity:0;border-color:rgba(255,255,255,0)}
}
.lp-btn:disabled{opacity:.4;cursor:not-allowed}
.lp-btn:disabled::before, .lp-btn:disabled::after{display:none}
/* Mission patches */
.lp-via{display:flex;align-items:center;gap:10px;font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:rgba(200,216,240,.25);margin:10px 0 8px}
.lp-via::before,.lp-via::after{content:'';flex:1;height:1px;background:rgba(79,53,243,.12)}
.lp-patches{display:flex;gap:10px}
.lp-patch{
  flex:1;
  display:flex;
  align-items:center;
  justify-content:center;
  padding:14px 8px;
  border:1px solid rgba(79,53,243,.14);
  background:rgba(79,53,243,.03);
  cursor:not-allowed;
  clip-path:polygon(0 0,calc(100% - 10px) 0,100% 10px,100% 100%,10px 100%,0 100%);
  position:relative;
  overflow:hidden;
  min-height:48px;
}
.lp-patch-name{
  font-size:11px;
  letter-spacing:.06em;
  text-transform:uppercase;
  color:rgba(200, 216, 240, .2);
  filter:blur(3.5px);
  user-select:none;
  transition:all .3s;
}
.lp-patch-stamp{
  position:absolute;
  top:50%;
  left:50%;
  transform:translate(-50%, -50%);
  font-size:9px;
  letter-spacing:.15em;
  padding:3px 8px;
  border:1px solid rgba(251,191,36,.5);
  color:#fbbf24;
  text-shadow:0 0 6px rgba(251,191,36,0.4);
  text-transform:uppercase;
  font-weight:700;
  background:rgba(251,191,36,.1);
  z-index:2;
  white-space:nowrap;
  transition:all .3s;
}
/* Footer */
.lp-foot{margin-top:12px;padding-top:10px;border-top:1px solid rgba(79,53,243,.1);display:flex;align-items:center;justify-content:space-between}
.lp-foot-txt{font-size:13px;color:rgba(200,216,240,.4)}
.lp-foot-txt a{color:#00e5ff;text-decoration:none;font-weight:700;transition:color .2s}
.lp-foot-txt a:hover{color:#fff}
.lp-admin{font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:rgba(200,216,240,.3);text-decoration:none;padding:6px 12px;border:1px solid rgba(200,216,240,.07);display:flex;align-items:center;gap:4px;transition:all .2s}
.lp-admin:hover{color:rgba(255,45,120,.6);border-color:rgba(255,45,120,.2)}
.lp-spin{width:14px;height:14px;border-radius:50%;border:2px solid rgba(255,255,255,.2);border-top-color:#fff;animation:lpSpinA .7s linear infinite;display:inline-block;flex-shrink:0}
@keyframes lpSpinA{to{transform:rotate(360deg)}}
@media(max-width:400px){
  .lp-inner{padding:20px 16px}
  .lp-patches{flex-direction:column;gap:8px}
  .lp-patch{padding:12px 6px;min-height:44px}
  .lp-patch-name{font-size:9px;letter-spacing:.04em}
  .lp-patch-stamp{font-size:8px;padding:2px 6px;letter-spacing:.1em}
}
`;

/* ─── Canvas Starfield ────────────────────────────────────────────── */
function useStarfield(canvasRef) {
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    let animId;
    let stars = [];
    const resize = () => {
      c.width = window.innerWidth;
      c.height = window.innerHeight;
      const count = Math.floor((c.width * c.height) / 4000);
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * c.width,
        y: Math.random() * c.height,
        r: Math.random() * 1.3 + 0.2,
        o: Math.random() * 0.7 + 0.1,
        s: Math.random() * 0.3 + 0.05,
        d: Math.random() * 0.3 - 0.15,
      }));
    };
    let t = 0;
    const draw = () => {
      ctx.clearRect(0, 0, c.width, c.height);
      t += 0.003;
      stars.forEach((s) => {
        s.x += s.d * 0.1; s.y -= s.s * 0.05;
        if (s.y < 0) s.y = c.height;
        if (s.x < 0) s.x = c.width;
        if (s.x > c.width) s.x = 0;
        const f = s.o * (0.7 + 0.3 * Math.sin(t * s.s * 20 + s.x));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200,220,255,${f})`;
        ctx.fill();
      });
      animId = requestAnimationFrame(draw);
    };
    window.addEventListener("resize", resize);
    resize(); draw();
    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize", resize); };
  }, [canvasRef]);
}

/* ─── Live Coords ─────────────────────────────────────────────────── */
function useLiveCoords(setCoords) {
  useEffect(() => {
    let lat = 28.6139, lng = 77.2088;
    const id = setInterval(() => {
      lat += (Math.random() - 0.5) * 0.001;
      lng += (Math.random() - 0.5) * 0.001;
      setCoords(`LAT ${lat.toFixed(4)} · LNG ${lng.toFixed(4)}`);
    }, 1400);
    return () => clearInterval(id);
  }, [setCoords]);
}

/* ─── Icons ───────────────────────────────────────────────────────── */
const IcoArrow = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <path d="M5 12h14M13 6l6 6-6 6"/>
  </svg>
);
const IcoShield = () => (
  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);

/* ─── Component ───────────────────────────────────────────────────── */
export default function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [coords, setCoords] = useState("LAT 28.6139 · LNG 77.2088");
  const canvasRef = useRef(null);
  const { login, isLoggingIn } = useAuthStore();
  const { play } = useSoundManager();

  useStarfield(canvasRef);
  useLiveCoords(setCoords);

  const handleSubmit = async (e) => {
    e.preventDefault();
    play?.("click");
    await login(form);
  };

  return (
    <>
      <style>{CSS}</style>
      <div className="lp-root">

        {/* Orbital ring background */}
        <div className="lp-orbital">
          <svg width="660" height="660" viewBox="0 0 660 660" fill="none" style={{animation:"lpOrbSpin 60s linear infinite"}} xmlns="http://www.w3.org/2000/svg">
            <style>{`@keyframes lpOrbSpin{to{transform:rotate(360deg)}}`}</style>
            <ellipse cx="330" cy="330" rx="290" ry="110" stroke="url(#lpr1)" strokeWidth="1" transform="rotate(-18 330 330)"/>
            <ellipse cx="330" cy="330" rx="240" ry="88" stroke="url(#lpr2)" strokeWidth=".5" transform="rotate(-18 330 330)"/>
            <circle cx="330" cy="330" r="260" stroke="rgba(79,53,243,.2)" strokeWidth=".5" strokeDasharray="3 8"/>
            <circle cx="330" cy="330" r="50" fill="url(#lppg)"/>
            <circle cx="330" cy="330" r="50" fill="none" stroke="rgba(0,229,255,.1)" strokeWidth="1"/>
            <defs>
              <linearGradient id="lpr1" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#4f35f3" stopOpacity=".7"/>
                <stop offset="50%" stopColor="#00e5ff" stopOpacity=".4"/>
                <stop offset="100%" stopColor="#4f35f3" stopOpacity=".1"/>
              </linearGradient>
              <linearGradient id="lpr2" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#00e5ff" stopOpacity=".3"/>
                <stop offset="100%" stopColor="transparent" stopOpacity="0"/>
              </linearGradient>
              <radialGradient id="lppg" cx="35%" cy="35%">
                <stop offset="0%" stopColor="#1a2060"/>
                <stop offset="65%" stopColor="#0a0f2e"/>
                <stop offset="100%" stopColor="#050810"/>
              </radialGradient>
            </defs>
          </svg>
        </div>

        <div className="lp-page">
          <div className="lp-hull">
            <div className="lp-inner">
              <div className="lp-corner-tr" />

              {/* Status bar */}
              <div className="lp-status">
                <div>
                  <div className="lp-brand-name">Orbit</div>
                  <div className="lp-brand-sub">Encrypted · E2EE</div>
                </div>
                <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4}}>
                  <div className="lp-node-row"><div className="lp-dot"/>Node Online</div>
                  <div className="lp-coords">{coords}</div>
                </div>
              </div>

              {/* Hero */}
              <div className="lp-hero">
                <div className="lp-eyebrow"><div className="lp-eyebrow-line"/><span className="lp-eyebrow-text">Authentication Protocol</span></div>
                <h1 className="lp-h1">
                  <span className="lp-h-line1">Welcome</span>
                  <span className="lp-h-back">back.</span>
                </h1>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit}>
                <div className="lp-field">
                  <label className="lp-label">01 ── Email or Username</label>
                  <div className="lp-bracket-row">
                    <span className="lp-bl">[</span>
                    <div className="lp-input-wrap">
                      <input className="lp-input" type="text" placeholder="you@orbit.network or username"
                        value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))}
                        autoComplete="username" required/>
                    </div>
                    <span className="lp-br">]</span>
                  </div>
                </div>

                <div className="lp-field">
                  <label className="lp-label">
                    <span>02 ── Auth Key</span>
                    <Link to="/forgot-password">Forgot?</Link>
                  </label>
                  <div className="lp-bracket-row">
                    <span className="lp-bl">[</span>
                    <div className="lp-input-wrap">
                      <input className="lp-input" type={showPw?"text":"password"} placeholder="••••••••••••"
                        value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))}
                        autoComplete="current-password" required/>
                      <button type="button" className="lp-eye" onClick={()=>{play?.("click");setShowPw(p=>!p)}}>
                        {showPw?<EyeOff size={14}/>:<Eye size={14}/>}
                      </button>
                    </div>
                    <span className="lp-br">]</span>
                  </div>
                </div>

                <div className="lp-btn-wrap">
                  <button type="submit" className="lp-btn" disabled={isLoggingIn}>
                    <span className="lp-btn-inner">
                      {isLoggingIn
                        ? <><span className="lp-spin"/>Authenticating…</>
                        : <><IcoArrow/>Initiate Session</>}
                    </span>
                  </button>
                </div>
              </form>

              {/* Alt methods */}
              <div className="lp-via">Via</div>
              <div className="lp-patches">
                <div className="lp-patch"><span className="lp-patch-name">✦ Constellation</span><span className="lp-patch-stamp">Classified</span></div>
                <div className="lp-patch"><span className="lp-patch-name">✧ Starweave</span><span className="lp-patch-stamp">Classified</span></div>
              </div>

              {/* Footer */}
              <div className="lp-foot">
                <div className="lp-foot-txt">No account? <Link to="/signup">Create one →</Link></div>
                <Link to="/admin/login" className="lp-admin"><IcoShield/>Admin</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
