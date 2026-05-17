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
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap');
*{box-sizing:border-box;}
.sp-root{
  height:100%; min-height:100dvh;
  background:#05070f;
  display:flex; flex-direction:column;
  overflow-y:auto; overflow-x:hidden;
  position:relative;
  font-family:'Inter',sans-serif;
}
/* Left accent rail — cyan for signup */
.sp-rail{
  position:fixed;left:0;top:0;bottom:0;width:3px;z-index:10;
  background:linear-gradient(180deg,transparent 0%,#0ea5e9 25%,#7c3aed 55%,#0ea5e9 80%,transparent 100%);
  animation:spRail 5s ease-in-out infinite;
}
@keyframes spRail{0%,100%{opacity:.4}50%{opacity:1}}
.sp-grid{
  position:fixed;inset:0;z-index:0;pointer-events:none;
  background-image:linear-gradient(rgba(14,165,233,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(14,165,233,.04) 1px,transparent 1px);
  background-size:54px 54px;
}
.sp-scan{
  position:fixed;left:0;right:0;height:80px;pointer-events:none;z-index:1;
  background:linear-gradient(180deg,transparent,rgba(14,165,233,.05),transparent);
  animation:spScanAnim 14s linear infinite;
}
@keyframes spScanAnim{0%{transform:translateY(-80px)}100%{transform:translateY(100vh)}}
.sp-g1{position:fixed;top:-60px;right:-40px;width:280px;height:280px;border-radius:50%;background:radial-gradient(circle,rgba(14,165,233,.12) 0%,transparent 70%);pointer-events:none;z-index:0;}
.sp-g2{position:fixed;bottom:-80px;left:20px;width:250px;height:250px;border-radius:50%;background:radial-gradient(circle,rgba(124,58,237,.1) 0%,transparent 70%);pointer-events:none;z-index:0;}
/* Content */
.sp-body{
  position:relative;z-index:2;
  flex:1;display:flex;flex-direction:column;
  padding:28px 28px 24px 36px;
}
/* Header */
.sp-top{display:flex;align-items:center;justify-content:space-between;flex-shrink:0;margin-bottom:28px;}
.sp-brand{display:flex;align-items:center;gap:10px;}
.sp-orb{
  width:32px;height:32px;border-radius:50%;
  border:1.5px solid rgba(14,165,233,.5);
  display:flex;align-items:center;justify-content:center;position:relative;
}
.sp-orb-inner{width:8px;height:8px;border-radius:50%;background:#0ea5e9;box-shadow:0 0 12px #0ea5e9;}
.sp-orb::after{
  content:'';position:absolute;width:5px;height:5px;border-radius:50%;
  background:#7c3aed;box-shadow:0 0 8px #7c3aed;
  top:-3px;left:50%;transform:translateX(-50%);
  animation:spOrbRing 2.4s linear infinite;transform-origin:50% calc(100% + 13px);
}
@keyframes spOrbRing{to{transform:translateX(-50%) rotate(360deg);}}
.sp-name-col{display:flex;flex-direction:column;gap:1px;}
.sp-name{font-family:'JetBrains Mono',monospace;font-size:14px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:rgba(255,255,255,.8);}
.sp-sub{font-family:'JetBrains Mono',monospace;font-size:8px;color:rgba(255,255,255,.2);letter-spacing:.14em;text-transform:uppercase;}
.sp-status{
  display:flex;align-items:center;gap:5px;
  font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:.12em;text-transform:uppercase;
  color:rgba(56,189,248,.7);
}
.sp-ping{width:5px;height:5px;border-radius:50%;background:#38bdf8;box-shadow:0 0 7px #38bdf8;animation:spPingAnim 2.2s ease-in-out infinite;}
@keyframes spPingAnim{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.3;transform:scale(1.8)}}
/* Hero */
.sp-hero{flex-shrink:0;margin-bottom:28px;}
.sp-eyebrow{display:flex;align-items:center;gap:8px;margin-bottom:10px;}
.sp-eyebrow-line{height:1px;width:24px;background:linear-gradient(90deg,#0ea5e9,transparent);}
.sp-eyebrow-text{font-family:'JetBrains Mono',monospace;font-size:8.5px;letter-spacing:.22em;text-transform:uppercase;color:rgba(14,165,233,.65);}
.sp-h1{
  font-size:clamp(30px,6vw,46px);font-weight:800;color:#fff;
  letter-spacing:-1px;line-height:1;margin:0 0 4px;
}
.sp-h1 span{
  display:block;font-style:italic;
  -webkit-text-stroke:1.5px rgba(255,255,255,.3);
  color:transparent;
}
/* Two-col row for username/email */
.sp-row{display:grid;grid-template-columns:1fr 1fr;gap:0 24px;}
@media(max-width:400px){.sp-row{grid-template-columns:1fr;}}
/* Field */
.sp-field{
  position:relative;
  border-bottom:1px solid rgba(255,255,255,.08);
  margin-bottom:24px;padding-bottom:2px;
  transition:border-color .25s;
}
.sp-field:focus-within{border-bottom-color:transparent;}
.sp-field::after{
  content:'';position:absolute;bottom:-1px;left:0;
  width:0;height:2px;
  background:linear-gradient(90deg,#0ea5e9,#7c3aed);
  transition:width .4s cubic-bezier(.4,0,.2,1);
}
.sp-field:focus-within::after{width:100%;}
.sp-fmeta{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;}
.sp-fid{font-family:'JetBrains Mono',monospace;font-size:8px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:rgba(14,165,233,.5);}
.sp-fname{font-family:'JetBrains Mono',monospace;font-size:8px;letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,.2);}
.sp-frow{display:flex;align-items:center;gap:10px;padding-bottom:8px;}
.sp-fico{color:rgba(255,255,255,.18);flex-shrink:0;display:flex;align-items:center;transition:color .25s;}
.sp-field:focus-within .sp-fico{color:rgba(14,165,233,.6);}
.sp-input{
  flex:1;background:transparent;border:none;outline:none;
  color:#f0f4ff;font-family:'Inter',sans-serif;
  font-size:16px;font-weight:400;caret-color:#0ea5e9;padding:0;
}
.sp-input::placeholder{color:rgba(255,255,255,.09);}
.sp-eye{background:none;border:none;padding:4px;cursor:pointer;color:rgba(255,255,255,.18);display:flex;align-items:center;transition:color .2s;}
.sp-eye:hover{color:rgba(255,255,255,.5);}
.sp-hint{font-family:'JetBrains Mono',monospace;font-size:8.5px;color:rgba(14,165,233,.38);margin-top:4px;letter-spacing:.03em;}
/* Strength bar */
.sp-strength{display:flex;gap:3px;margin-top:7px;}
.sp-seg{flex:1;height:2px;border-radius:99px;background:rgba(255,255,255,.07);transition:background .3s;}
.sp-stxt{font-family:'JetBrains Mono',monospace;font-size:8px;letter-spacing:.1em;margin-top:4px;font-weight:600;transition:color .3s;}
/* Arrow submit */
.sp-submit-wrap{margin-bottom:18px;}
.sp-submit{
  position:relative;width:100%;height:54px;border:none;cursor:pointer;
  background:linear-gradient(90deg,#0ea5e9 0%,#6366f1 50%,#7c3aed 100%);
  clip-path:polygon(0 0,calc(100% - 22px) 0,100% 50%,calc(100% - 22px) 100%,0 100%);
  display:flex;align-items:center;
  padding:0 50px 0 24px;
  font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:700;
  letter-spacing:.2em;text-transform:uppercase;color:#fff;
  transition:transform .2s,box-shadow .3s;
  box-shadow:0 0 36px rgba(14,165,233,.4);
}
.sp-submit:not(:disabled):hover{transform:translateX(4px);box-shadow:0 0 56px rgba(14,165,233,.6);}
.sp-submit:disabled{opacity:.4;cursor:not-allowed;}
.sp-submit-inner{display:flex;align-items:center;gap:10px;}
/* Alt */
.sp-or{
  display:flex;align-items:center;gap:10px;margin-bottom:10px;
  font-family:'JetBrains Mono',monospace;font-size:8.5px;letter-spacing:.14em;
  color:rgba(255,255,255,.18);text-transform:uppercase;
}
.sp-or::before,.sp-or::after{content:'';flex:1;height:1px;background:rgba(255,255,255,.07);}
.sp-alts{display:flex;gap:10px;}
.sp-alt{
  flex:1;display:flex;align-items:center;justify-content:space-between;
  padding:9px 12px;border:1px solid rgba(255,255,255,.07);
  font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:.06em;
  color:rgba(255,255,255,.2);cursor:not-allowed;background:rgba(255,255,255,.018);
}
.sp-alt-badge{font-size:7px;padding:2px 5px;background:rgba(14,165,233,.12);color:rgba(56,189,248,.55);border:1px solid rgba(14,165,233,.2);}
/* Footer */
.sp-foot{
  margin-top:auto;padding-top:18px;
  display:flex;align-items:center;justify-content:space-between;
  flex-wrap:wrap;gap:8px;
  border-top:1px solid rgba(255,255,255,.05);
  flex-shrink:0;
}
.sp-foot-txt{font-size:12px;color:rgba(255,255,255,.3);}
.sp-foot-txt a{color:#0ea5e9;text-decoration:none;font-weight:600;transition:color .2s;}
.sp-foot-txt a:hover{color:#38bdf8;}
.sp-admin{
  display:flex;align-items:center;gap:5px;
  font-family:'JetBrains Mono',monospace;font-size:8.5px;letter-spacing:.08em;text-transform:uppercase;
  color:rgba(255,255,255,.18);text-decoration:none;
  padding:5px 10px;border:1px solid rgba(255,255,255,.07);transition:all .2s;
}
.sp-admin:hover{color:rgba(239,68,68,.65);border-color:rgba(239,68,68,.2);}
.sp-spin{width:14px;height:14px;border-radius:50%;border:2px solid rgba(255,255,255,.25);border-top-color:#fff;animation:spSpinA .7s linear infinite;display:inline-block;flex-shrink:0;}
@keyframes spSpinA{to{transform:rotate(360deg);}}
.sp-coord{position:fixed;top:14px;right:20px;font-family:'JetBrains Mono',monospace;font-size:7px;color:rgba(255,255,255,.1);letter-spacing:.1em;pointer-events:none;z-index:3;display:flex;flex-direction:column;align-items:flex-end;gap:2px;}
`;

const IcoUser = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>;
const IcoMail = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>;
const IcoSend = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>;
const IcoLock = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
const IcoShield = () => <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
const IcoArrow = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>;

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
        <div className="sp-rail" />
        <div className="sp-grid" />
        <div className="sp-scan" />
        <div className="sp-g1" />
        <div className="sp-g2" />
        <div className="sp-coord">
          <span>REGISTRATION · OPEN</span>
          <span>NODE_ALPHA · E2EE</span>
        </div>

        <div className="sp-body">
          {/* Header */}
          <div className="sp-top">
            <div className="sp-brand">
              <div className="sp-orb"><div className="sp-orb-inner" /></div>
              <div className="sp-name-col">
                <span className="sp-name">Orbit</span>
                <span className="sp-sub">Encrypted · E2EE</span>
              </div>
            </div>
            <div className="sp-status"><div className="sp-ping" />Open</div>
          </div>

          {/* Hero */}
          <div className="sp-hero">
            <div className="sp-eyebrow">
              <div className="sp-eyebrow-line" />
              <span className="sp-eyebrow-text">Node Registration</span>
            </div>
            <h1 className="sp-h1">
              Create your<span>node.</span>
            </h1>
          </div>

          {/* Form */}
          <form className="sp-form" onSubmit={handleSubmit} style={{flexShrink:0}}>

            {/* Username + Email */}
            <div className="sp-row">
              <div className="sp-field">
                <div className="sp-fmeta">
                  <span className="sp-fid">01 ──</span>
                  <span className="sp-fname">Username</span>
                </div>
                <div className="sp-frow">
                  <span className="sp-fico"><IcoUser /></span>
                  <input className="sp-input" type="text" placeholder="your_alias"
                    value={form.username}
                    onChange={e => setForm(f => ({ ...f, username: e.target.value.replace(/\s+/g, "").toLowerCase() }))}
                    required />
                </div>
              </div>
              <div className="sp-field">
                <div className="sp-fmeta">
                  <span className="sp-fid">02 ──</span>
                  <span className="sp-fname">Email</span>
                </div>
                <div className="sp-frow">
                  <span className="sp-fico"><IcoMail /></span>
                  <input className="sp-input" type="email" placeholder="you@orbit.io"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    autoComplete="email" required />
                </div>
              </div>
            </div>

            {/* Telegram */}
            <div className="sp-field">
              <div className="sp-fmeta">
                <span className="sp-fid">03 ──</span>
                <span className="sp-fname">Telegram ID</span>
              </div>
              <div className="sp-frow">
                <span className="sp-fico"><IcoSend /></span>
                <input className="sp-input" type="text" placeholder="123456789"
                  value={form.telegramId}
                  onChange={e => setForm(f => ({ ...f, telegramId: e.target.value.replace(/\D/g, "") }))}
                  required />
              </div>
              <div className="sp-hint">↳ Get yours from @userinfobot</div>
            </div>

            {/* Password */}
            <div className="sp-field">
              <div className="sp-fmeta">
                <span className="sp-fid">04 ──</span>
                <span className="sp-fname">Auth Key</span>
              </div>
              <div className="sp-frow">
                <span className="sp-fico"><IcoLock /></span>
                <input className="sp-input"
                  type={showPw ? "text" : "password"} placeholder="Min 8 chars + uppercase + number…"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  autoComplete="new-password" required />
                <button type="button" className="sp-eye" onClick={() => { play?.("click"); setShowPw(p => !p); }}>
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {form.password && (
                <>
                  <div className="sp-strength">
                    {[1,2,3,4,5].map(i => (
                      <div key={i} className="sp-seg" style={{ background: i <= score ? color : undefined }} />
                    ))}
                  </div>
                  <p className="sp-stxt" style={{ color }}>{STRENGTH_LABEL[score]}</p>
                </>
              )}
            </div>

            <div className="sp-submit-wrap">
              <button type="submit" className="sp-submit" disabled={isSigningUp}>
                <span className="sp-submit-inner">
                  {isSigningUp
                    ? <><span className="sp-spin" /> Creating node…</>
                    : <>Initialize Account <IcoArrow /></>}
                </span>
              </button>
            </div>
          </form>

          {/* Alt auth */}
          <div className="sp-or">Via</div>
          <div className="sp-alts">
            <div className="sp-alt"><span>✦ Constellation</span><span className="sp-alt-badge">SOON</span></div>
            <div className="sp-alt"><span>✧ Starweave</span><span className="sp-alt-badge">SOON</span></div>
          </div>

          {/* Footer */}
          <div className="sp-foot">
            <div className="sp-foot-txt">Already in orbit? <Link to="/login">Sign in →</Link></div>
            <Link to="/admin/login" className="sp-admin"><IcoShield /> Admin</Link>
          </div>
        </div>
      </div>
    </>
  );
}
