import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Eye, EyeOff, Check, X, Loader2, RefreshCw } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useSoundManager } from "../hooks/useSoundManager";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";

const pw = (p) => { if (!p) return 0; let s = 0; if (p.length >= 8) s++; if (p.length >= 12) s++; if (/[A-Z]/.test(p)) s++; if (/[0-9]/.test(p)) s++; if (/[^A-Za-z0-9]/.test(p)) s++; return s; };
const STR_LBL = ["", "Weak", "Fair", "Good", "Strong", "Lethal"];
const STR_COL = ["", "#ef4444", "#f97316", "#eab308", "#22c55e", "#00e5ff"];

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Space+Mono:ital,wght@0,400;0,700;1,400&display=swap');
.sp-root{min-height:100dvh;background:transparent;display:flex;flex-direction:column;overflow-y:auto;overflow-x:hidden;position:relative;font-family:'Space Mono',monospace;color:#c8d8f0;overscroll-behavior:none;scrollbar-width:none;-ms-overflow-style:none}
.sp-root::-webkit-scrollbar{display:none !important}
.sp-orbital{position:fixed;inset:0;z-index:1;display:flex;align-items:center;justify-content:center;pointer-events:none;opacity:.09}
.sp-grid-bg{position:fixed;inset:0;z-index:0;background-image:linear-gradient(rgba(0,229,255,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(0,229,255,.025) 1px,transparent 1px);background-size:52px 52px;pointer-events:none}
.sp-page{position:relative;z-index:2;flex:1;display:flex;align-items:center;justify-content:center;padding:20px 16px;min-height:inherit}
/* Hull */
.sp-hull{width:100%;max-width:520px;position:relative}
.sp-hull::before{content:'';position:absolute;inset:-1px;clip-path:polygon(0 0,calc(100% - 40px) 0,100% 40px,100% 100%,40px 100%,0 100%);background:linear-gradient(135deg,rgba(0,229,255,.7) 0%,rgba(79,53,243,.5) 40%,rgba(0,229,255,.1) 100%);z-index:0;animation:spBP 5s ease-in-out infinite}
@keyframes spBP{0%,100%{opacity:.4}50%{opacity:.9}}
.sp-inner{position:relative;z-index:1;clip-path:polygon(0 0,calc(100% - 40px) 0,100% 40px,100% 100%,40px 100%,0 100%);background:linear-gradient(160deg,rgba(0,15,46,.97) 0%,rgba(5,8,16,.99) 100%);padding:26px 26px 22px;overflow:hidden}
.sp-inner::after{content:'';position:absolute;inset:0;background:repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,229,255,.012) 2px,rgba(0,229,255,.012) 4px);pointer-events:none;z-index:10;animation:spSM 10s linear infinite}
@keyframes spSM{from{background-position:0 0}to{background-position:0 80px}}
.sp-inner::before{content:'';position:absolute;bottom:0;left:0;width:40px;height:40px;border-left:1.5px solid rgba(0,229,255,.3);border-bottom:1.5px solid rgba(0,229,255,.3);pointer-events:none;z-index:11}
.sp-corner-tr{position:absolute;top:0;right:0;width:40px;height:40px;border-right:1.5px solid rgba(0,229,255,.3);border-top:1.5px solid rgba(0,229,255,.3);z-index:11}
/* Status */
.sp-status{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;padding-bottom:8px;border-bottom:1px solid rgba(0,229,255,.12)}
.sp-brand-name{font-family:'Orbitron',monospace;font-size:18px;font-weight:700;letter-spacing:.3em;text-transform:uppercase;color:#fff}
.sp-brand-sub{font-size:10px;letter-spacing:.18em;color:rgba(0,229,255,.4);text-transform:uppercase;margin-top:2px}
.sp-node-row{display:flex;align-items:center;gap:6px;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:rgba(56,189,248,.8)}
.sp-dot{position:relative;width:7px;height:7px;border-radius:50%;background:#38bdf8;flex-shrink:0}
.sp-dot::before{content:'';position:absolute;inset:-4px;border-radius:50%;border:1px solid rgba(56,189,248,.3);animation:spRdr 2.2s ease-out infinite}
.sp-dot::after{content:'';position:absolute;inset:-9px;border-radius:50%;border:1px solid rgba(56,189,248,.1);animation:spRdr 2.2s ease-out .5s infinite}
@keyframes spRdr{0%{transform:scale(1);opacity:.7}100%{transform:scale(3);opacity:0}}
.sp-node-right{display:flex;flex-direction:column;align-items:flex-end;gap:4px}
.sp-reg-badge{font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:rgba(0,229,255,.35);padding:3px 8px;border:1px solid rgba(0,229,255,.15)}
/* Hero */
.sp-hero{margin-bottom:16px}
.sp-eyebrow{display:flex;align-items:center;gap:8px;margin-bottom:8px}
.sp-eyebrow-line{width:20px;height:1px;background:linear-gradient(90deg,#00e5ff,transparent)}
.sp-eyebrow-text{font-size:11px;letter-spacing:.22em;text-transform:uppercase;color:rgba(0,229,255,.6)}
.sp-h1{font-family:'Orbitron',monospace;font-size:clamp(22px,5vw,34px);font-weight:900;text-transform:uppercase;letter-spacing:-.02em;line-height:1}
.sp-h1 .l1{display:block;animation:spRvl .5s cubic-bezier(.25,.46,.45,.94) forwards}
.sp-h1 .l2{display:block;color:#00e5ff;text-shadow:0 0 18px rgba(0,229,255,.45);animation:spRvl .5s .15s cubic-bezier(.25,.46,.45,.94) both}
@keyframes spRvl{from{clip-path:inset(0 0 100% 0);transform:translateY(6px);opacity:0}to{clip-path:inset(0 0 0% 0);transform:translateY(0);opacity:1}}
/* Two-col */
.sp-row2{display:grid;grid-template-columns:1fr 1fr;gap:0 20px}
@media(max-width:420px){.sp-row2{grid-template-columns:1fr}}
/* HUD fields */
.sp-field{margin-bottom:14px}
.sp-label{display:flex;align-items:center;justify-content:space-between;font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:rgba(0,229,255,.45);margin-bottom:6px;transition:color .25s}
.sp-field:focus-within .sp-label{color:#00e5ff}
.sp-bracket-row{display:flex;align-items:center;gap:6px}
.sp-bl,.sp-br{font-size:24px;line-height:1;color:rgba(0,229,255,.3);transition:color .25s;flex-shrink:0;font-family:'Space Mono',monospace}
.sp-field:focus-within .sp-bl,.sp-field:focus-within .sp-br{color:#00e5ff}
.sp-iw{flex:1;position:relative;border-bottom:1px solid rgba(0,229,255,.18);transition:border-color .25s}
.sp-field:focus-within .sp-iw{border-bottom-color:transparent}
.sp-iw::after{content:'';position:absolute;bottom:-1px;left:0;width:0;height:1.5px;background:linear-gradient(90deg,#00e5ff,#4f35f3);transition:width .4s cubic-bezier(.4,0,.2,1);box-shadow:0 0 8px rgba(0,229,255,.7)}
.sp-field:focus-within .sp-iw::after{width:100%}
.sp-input{width:100%;background:transparent;border:none;outline:none;color:#c8d8f0;font-family:'Space Mono',monospace;font-size:16px;padding:6px 28px 8px 0;caret-color:#00e5ff;letter-spacing:.04em}
.sp-input::placeholder{color:rgba(200,216,240,.12);font-size:14px}
.sp-eye{position:absolute;right:0;top:50%;transform:translateY(-55%);background:none;border:none;cursor:pointer;color:rgba(200,216,240,.25);display:flex;align-items:center;transition:color .2s}
.sp-eye:hover{color:#00e5ff}
.sp-hint{font-size:11px;color:rgba(0,229,255,.32);margin-top:3px;letter-spacing:.04em}
/* Strength */
.sp-str-bars{display:flex;gap:4px;margin-top:6px}
.sp-seg{flex:1;height:3px;border-radius:99px;background:rgba(255,255,255,.07);transition:background .3s}
.sp-str-lbl{font-size:11px;letter-spacing:.1em;margin-top:3px;font-weight:700;transition:color .3s;font-family:'Space Mono',monospace}
/* Button */
.sp-btn-wrap{margin:6px 0 12px}
.sp-btn{width:100%;height:60px;border:none;cursor:pointer;position:relative;overflow:hidden;background:linear-gradient(90deg,#007ea3 0%,#0066cc 35%,#4f35f3 70%,#3a1aff 100%);transform:skewX(-6deg);font-family:'Orbitron',monospace;font-size:14px;font-weight:700;letter-spacing:.22em;text-transform:uppercase;color:#fff;box-shadow:0 0 28px rgba(0,229,255,.4),inset 0 1px 0 rgba(255,255,255,.1);transition:box-shadow .3s;animation:spBG 3.5s ease-in-out infinite}
@keyframes spBG{0%,100%{box-shadow:0 0 28px rgba(0,229,255,.4),inset 0 1px 0 rgba(255,255,255,.1)}50%{box-shadow:0 0 50px rgba(0,229,255,.55),0 0 80px rgba(79,53,243,.3),inset 0 1px 0 rgba(255,255,255,.15)}}
.sp-btn-inner{display:flex;align-items:center;justify-content:center;gap:10px;transform:skewX(6deg)}
.sp-btn::before{content:'';position:absolute;top:0;left:-100%;width:60%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.15),transparent);transition:left .5s}
.sp-btn:hover::before{left:150%}
.sp-btn:hover{box-shadow:0 0 60px rgba(0,229,255,.65),0 0 100px rgba(79,53,243,.4),inset 0 1px 0 rgba(255,255,255,.2)}
.sp-btn:disabled{opacity:.4;cursor:not-allowed;animation:none}
/* Handle Validation */
.sp-handle-val{display:flex;align-items:center;gap:6px;font-size:10px;margin-top:6px;letter-spacing:.1em;text-transform:uppercase;}
.sp-val-ok{color:#22c55e}
.sp-val-err{color:#ef4444}
.sp-val-check{color:rgba(0,229,255,.6)}
.sp-sug-wrap{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}
.sp-sug-chip{background:rgba(0,229,255,.05);border:1px solid rgba(0,229,255,.2);color:#00e5ff;padding:4px 8px;font-size:11px;cursor:pointer;transition:all .2s;font-family:'Space Mono',monospace}
.sp-sug-chip:hover{background:rgba(0,229,255,.15);border-color:#00e5ff}
.sp-sug-refresh{background:none;border:none;color:rgba(0,229,255,.5);cursor:pointer;padding:4px;display:flex;align-items:center;transition:color .2s}
.sp-sug-refresh:hover{color:#00e5ff}
/* Patches */
.sp-via{display:flex;align-items:center;gap:10px;font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:rgba(200,216,240,.25);margin:8px 0 8px}
.sp-via::before,.sp-via::after{content:'';flex:1;height:1px;background:rgba(0,229,255,.1)}
.sp-patches{display:flex;gap:10px}
.sp-patch{flex:1;display:flex;align-items:center;justify-content:center;padding:14px 8px;border:1px solid rgba(0,229,255,.15);background:rgba(0,229,255,.03);cursor:not-allowed;clip-path:polygon(0 0,calc(100% - 10px) 0,100% 10px,100% 100%,10px 100%,0 100%);position:relative;overflow:hidden;min-height:48px}
.sp-patch-name{font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:rgba(200, 216, 240, .2);filter:blur(3.5px);user-select:none;transition:all .3s}
.sp-patch-stamp{position:absolute;top:50%;left:50%;transform:translate(-50%, -50%);font-size:9px;letter-spacing:.15em;padding:3px 8px;border:1px solid rgba(251,191,36,.5);color:#fbbf24;text-shadow:0 0 6px rgba(251,191,36,0.4);text-transform:uppercase;font-weight:700;background:rgba(251,191,36,.1);z-index:2;white-space:nowrap;transition:all .3s}
/* Footer */
.sp-foot{margin-top:10px;padding-top:8px;border-top:1px solid rgba(0,229,255,.08);display:flex;align-items:center;justify-content:space-between}
.sp-foot-txt{font-size:13px;color:rgba(200,216,240,.4)}
.sp-foot-txt a{color:#00e5ff;text-decoration:none;font-weight:700;transition:color .2s}
.sp-foot-txt a:hover{color:#fff}
.sp-admin{font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:rgba(200,216,240,.3);text-decoration:none;padding:6px 12px;border:1px solid rgba(200,216,240,.07);display:flex;align-items:center;gap:4px;transition:all .2s}
.sp-admin:hover{color:rgba(255,45,120,.6);border-color:rgba(255,45,120,.2)}
.sp-spin{width:14px;height:14px;border-radius:50%;border:2px solid rgba(255,255,255,.2);border-top-color:#fff;animation:spSpnA .7s linear infinite;display:inline-block;flex-shrink:0}
@keyframes spSpnA{to{transform:rotate(360deg)}}
@media(max-width:400px){
  .sp-inner{padding:18px 14px}
  .sp-patches{flex-direction:column;gap:8px}
  .sp-patch{padding:12px 6px;min-height:44px}
  .sp-patch-name{font-size:9px;letter-spacing:.04em}
  .sp-patch-stamp{font-size:8px;padding:2px 6px;letter-spacing:.1em}
}
.sp-spark-btn{background:rgba(0,229,255,.05);border:1px solid rgba(0,229,255,.3);border-radius:3px;cursor:pointer;color:#00e5ff;font-family:'Space Mono',monospace;font-size:11px;font-weight:700;letter-spacing:.08em;padding:4px 8px;display:inline-flex;align-items:center;gap:4px;transition:all .25s cubic-bezier(0.4,0,0.2,1);text-transform:uppercase;flex-shrink:0}
.sp-spark-btn:hover{background:rgba(0,229,255,.15);border-color:#00e5ff;box-shadow:0 0 10px rgba(0,229,255,.4);transform:translateY(-1px)}
.sp-spark-btn:active{transform:translateY(0)}
.sp-spark-btn:focus{outline:none;border-color:#00e5ff}
`;

const IcoUser = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" /></svg>;
const IcoArrow = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
const IcoShield = () => <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>;
const IcoSpark = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275Z"/>
    <path d="m5 3 1 2.5L8.5 6 6 7 5 9.5 4 7 1.5 6 4 5.5Z" opacity="0.6"/>
    <path d="m19 17 1 2.5 2.5.5-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1Z" opacity="0.6"/>
  </svg>
);

export const analyzeHandle = (rawHandle) => {
  if (!rawHandle) return { isValid: false, error: "Orbit Handle is required" };

  const sanitized = rawHandle.normalize("NFC").replace(/[\u200B-\u200D\uFEFF\u202E]/g, "").trim();

  // Rule 1: Must include '#'
  if (!sanitized.includes("#")) {
    return { isValid: false, error: "Orbit Handle must include #" };
  }

  const parts = sanitized.split("#");
  if (parts.length > 2) {
    return { isValid: false, error: "Only one # separator is allowed" };
  }

  const username = parts[0];
  const tag = parts[1];

  // Rule 2: Username length
  if (username.length < 3) {
    return { isValid: false, error: "Username must be at least 3 characters" };
  }
  if (username.length > 20) {
    return { isValid: false, error: "Username must be at most 20 characters" };
  }

  // Rule 3: Username characters (lowercase, numbers, underscores)
  if (/[A-Z]/.test(username)) {
    return { isValid: false, error: "Username must be strictly lowercase" };
  }
  if (!/^[a-z0-9_]+$/.test(username)) {
    return { isValid: false, error: "Only lowercase letters, numbers, and underscores are allowed in username" };
  }
  // Rule 4: Tag length (3 to 6 characters)
  if (tag.length < 3) {
    return { isValid: false, error: "Tag must contain 3–6 characters" };
  }
  if (tag.length > 6) {
    return { isValid: false, error: "Tag must contain 3–6 characters" };
  }

  // Rule 5: Tag characters (alphanumeric)
  if (!/^[a-zA-Z0-9]+$/.test(tag)) {
    return { isValid: false, error: "Only letters and numbers are allowed in tag" };
  }

  // Rule 6: At least one letter in tag
  if (!/[a-zA-Z]/.test(tag)) {
    return { isValid: false, error: "Tag must contain at least one letter" };
  }

  // Rule 7: Mixed-script check
  const hasLatin = /[a-zA-Z]/.test(username) || /[a-zA-Z]/.test(tag);
  const hasCyrillic = /[\u0400-\u04FF]/.test(username) || /[\u0400-\u04FF]/.test(tag);
  if (hasLatin && hasCyrillic) {
    return { isValid: false, error: "Unsupported characters detected (Mixed Scripts)" };
  }

  // Rule 8: Authority blacklist
  const normalizedTagLower = tag.toLowerCase().replace(/0/g, "o").replace(/1/g, "i").replace(/3/g, "e").replace(/4/g, "a").replace(/5/g, "s").replace(/7/g, "t");
  const blacklist = ["admin", "support", "staff", "moderator", "official", "orbit", "security", "dev", "owner", "system"];
  const isImpersonator = blacklist.some(word => 
    normalizedTagLower.includes(word) || username.toLowerCase().includes(word)
  );
  if (isImpersonator) {
    return { isValid: false, error: "Protected keywords cannot be used" };
  }

  return {
    isValid: true,
    username,
    tag,
    normalizedHandle: `${username}#${tag}`
  };
};

export const generatePremiumHandle = (currentUsername) => {
  const userPool = ["kai", "luna", "apex", "zero", "nova", "flux", "ghost", "void", "neon", "cyber", "pulse", "echo", "zenith", "phantom", "drift", "aero"];
  const tagWords = ["Void", "Nova", "Flux", "Neon", "Zero", "Echo", "Apex", "Byte", "Core", "Node", "Rift", "Warp", "Drift", "Pulse", "Ghost", "Aura", "Zen", "Vibe", "Opal", "Vega", "Lyra", "Sol", "Luna", "Orion", "Volt", "Glow", "Sync"];

  let username = currentUsername ? currentUsername.split("#")[0].trim().toLowerCase().replace(/[^a-z0-9_]/g, "") : "";
  if (!username || username.length < 3) {
    username = userPool[Math.floor(Math.random() * userPool.length)];
  }

  const word = tagWords[Math.floor(Math.random() * tagWords.length)];
  
  let tag = "";
  const r = Math.random();
  if (r < 0.4) {
    tag = word.substring(0, 6);
  } else {
    const digit = Math.floor(Math.random() * 10);
    tag = word.substring(0, 5) + digit;
  }

  return `${username}#${tag}`;
};

export default function SignUpPage() {
  const [form, setForm] = useState({ handle: "", email: "", password: "" });
  const [showPw, setShowPw] = useState(false);

  const [handleStatus, setHandleStatus] = useState("idle"); // idle, checking, available, taken, invalid
  const [handleError, setHandleError] = useState("");
  const [suggestions, setSuggestions] = useState([]);

  const { signup, isSigningUp } = useAuthStore();
  const { play } = useSoundManager();

  // Debounced handle validation
  useEffect(() => {
    if (!form.handle) {
      setHandleStatus("idle");
      setHandleError("");
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      const analysis = analyzeHandle(form.handle);
      if (!analysis.isValid) {
        setHandleStatus("invalid");
        setHandleError(analysis.error);
        setSuggestions([]);
        return;
      }
      setHandleStatus("checking");
      setHandleError("");
      try {
        await axiosInstance.get(`/auth/validate-handle?handle=${encodeURIComponent(analysis.normalizedHandle)}`);
        setHandleStatus("available");
        setSuggestions([]);
      } catch (err) {
        if (err.response?.status === 409) {
          setHandleStatus("taken");
          setHandleError("This Orbit Handle is already taken");
          setSuggestions(err.response.data.suggestions || []);
        } else {
          setHandleStatus("invalid");
          setHandleError(err.response?.data?.message || "Validation failed");
        }
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [form.handle]);

  const handleGenerateClick = () => {
    play?.("click");
    const fresh = generatePremiumHandle(form.handle);
    setForm(f => ({ ...f, handle: fresh }));
  };

  const validate = () => {
    if (handleStatus !== "available") return toast.error("Please provide a valid, available Orbit Handle");
    if (!/\S+@\S+\.\S+/.test(form.email)) return toast.error("Valid email required");

    if (form.password.length < 8) return toast.error("Min 8 characters");
    if (!/[A-Z]/.test(form.password)) return toast.error("Need uppercase letter");
    if (!/[0-9]/.test(form.password)) return toast.error("Need a number");
    if (!/[^A-Za-z0-9]/.test(form.password)) return toast.error("Need a special character");
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    play?.("click");
    if (validate() !== true) return;
    await signup(form);
  };

  const score = pw(form.password);

  const applySuggestion = (sug) => {
    play?.("click");
    setForm(f => ({ ...f, handle: sug }));
  };

  const refreshSuggestions = async () => {
    play?.("hover");
    setHandleStatus("checking");
    try {
      const res = await axiosInstance.get(`/auth/validate-handle?handle=${encodeURIComponent(form.handle)}`);
      setHandleStatus("available");
      setSuggestions([]);
    } catch (err) {
      if (err.response?.status === 409) {
        setHandleStatus("taken");
        setSuggestions(err.response.data.suggestions || []);
      }
    }
  };

  return (
    <>
      <style>{CSS}</style>
      <div className="sp-root">
        <div className="sp-grid-bg" />

        {/* Orbital ring */}
        <div className="sp-orbital">
          <svg width="700" height="700" viewBox="0 0 700 700" fill="none" style={{ animation: "spOrbSpin 80s linear infinite" }} xmlns="http://www.w3.org/2000/svg">
            <style>{`@keyframes spOrbSpin{to{transform:rotate(360deg)}}`}</style>
            <ellipse cx="350" cy="350" rx="310" ry="115" stroke="url(#spr1)" strokeWidth="1" transform="rotate(-20 350 350)" />
            <ellipse cx="350" cy="350" rx="260" ry="92" stroke="url(#spr2)" strokeWidth=".5" transform="rotate(-20 350 350)" />
            <circle cx="350" cy="350" r="280" stroke="rgba(0,229,255,.15)" strokeWidth=".5" strokeDasharray="3 8" />
            <circle cx="350" cy="350" r="220" stroke="rgba(79,53,243,.12)" strokeWidth=".5" strokeDasharray="2 10" />
            <circle cx="350" cy="350" r="52" fill="url(#sppg)" />
            <defs>
              <linearGradient id="spr1" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#00e5ff" stopOpacity=".6" />
                <stop offset="50%" stopColor="#4f35f3" stopOpacity=".35" />
                <stop offset="100%" stopColor="#00e5ff" stopOpacity=".08" />
              </linearGradient>
              <linearGradient id="spr2" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#4f35f3" stopOpacity=".3" />
                <stop offset="100%" stopColor="transparent" stopOpacity="0" />
              </linearGradient>
              <radialGradient id="sppg" cx="35%" cy="35%">
                <stop offset="0%" stopColor="#001a30" />
                <stop offset="65%" stopColor="#000c20" />
                <stop offset="100%" stopColor="#050810" />
              </radialGradient>
            </defs>
          </svg>
        </div>

        <div className="sp-page">
          <div className="sp-hull">
            <div className="sp-inner">
              <div className="sp-corner-tr" />

              {/* Status */}
              <div className="sp-status">
                <div>
                  <div className="sp-brand-name">Orbit</div>
                  <div className="sp-brand-sub">Zero-Trust Network</div>
                </div>
                <div className="sp-node-right">
                  <div className="sp-node-row"><div className="sp-dot" />Registration Open</div>
                  <div className="sp-reg-badge">Identity Protocol</div>
                </div>
              </div>

              {/* Hero */}
              <div className="sp-hero">
                <div className="sp-eyebrow"><div className="sp-eyebrow-line" /><span className="sp-eyebrow-text">Node Registration</span></div>
                <h1 className="sp-h1">
                  <span className="l1">Establish</span>
                  <span className="l2">your identity.</span>
                </h1>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="sp-field">
                  <label className="sp-label"><span>01 ── Orbit Handle</span></label>
                  <div className="sp-bracket-row">
                    <span className="sp-bl">[</span>
                    <div className="sp-iw">
                      <input className="sp-input" type="text" placeholder="username#1000"
                        value={form.handle}
                        onChange={e => {
                          const val = e.target.value.replace(/\s+/g, "");
                          const hashIndex = val.indexOf("#");
                          if (hashIndex !== -1) {
                            const userPart = val.substring(0, hashIndex).toLowerCase();
                            const tagPart = val.substring(hashIndex + 1);
                            setForm(f => ({ ...f, handle: `${userPart}#${tagPart}` }));
                          } else {
                            setForm(f => ({ ...f, handle: val.toLowerCase() }));
                          }
                        }}
                        required />
                    </div>
                    <span className="sp-br">]</span>
                    <button type="button" className="sp-spark-btn" title="Generate Premium Handle" onClick={handleGenerateClick}>
                      <RefreshCw size={11} /> GEN
                    </button>
                  </div>

                  {/* Validation State UI */}
                  {handleStatus === "checking" && (
                    <div className="sp-handle-val sp-val-check">
                      <Loader2 size={12} className="animate-spin" /> Checking availability...
                    </div>
                  )}
                  {handleStatus === "available" && (
                    <div className="sp-handle-val sp-val-ok">
                      <Check size={12} /> Orbit Handle is available!
                    </div>
                  )}
                  {handleStatus === "invalid" && form.handle.length > 0 && (
                    <div className="sp-handle-val sp-val-err">
                      <X size={12} /> {handleError}
                    </div>
                  )}
                  {handleStatus === "taken" && (
                    <div>
                      <div className="sp-handle-val sp-val-err">
                        <X size={12} /> {handleError || "This Orbit Handle is already taken"}
                      </div>
                      <div className="sp-sug-wrap">
                        {suggestions.map(sug => (
                          <button type="button" key={sug} className="sp-sug-chip" onClick={() => applySuggestion(sug)}>
                            {sug}
                          </button>
                        ))}
                        {suggestions.length > 0 && (
                          <button type="button" className="sp-sug-refresh" onClick={refreshSuggestions} title="Refresh suggestions">
                            <RefreshCw size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="sp-hint">↳ This is your public identity for discovery.</div>
                </div>

                <div className="sp-field">
                  <label className="sp-label"><span>02 ── Comm Link</span></label>
                  <div className="sp-bracket-row">
                    <span className="sp-bl">[</span>
                    <div className="sp-iw">
                      <input className="sp-input" type="email" placeholder="you@gmail.com"
                        value={form.email}
                        onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                        autoComplete="email" required />
                    </div>
                    <span className="sp-br">]</span>
                  </div>
                </div>

                <div className="sp-field">
                  <label className="sp-label"><span>03 ── Auth Passkey</span></label>
                  <div className="sp-bracket-row">
                    <span className="sp-bl">[</span>
                    <div className="sp-iw">
                      <input className="sp-input"
                        type={showPw ? "text" : "password"} placeholder="Min 8 · A-Z · 0-9 · symbol"
                        value={form.password}
                        onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                        autoComplete="new-password" required />
                      <button type="button" className="sp-eye" onClick={() => { play?.("click"); setShowPw(p => !p) }}>
                        {showPw ? <EyeOff size={13} /> : <Eye size={13} />}
                      </button>
                    </div>
                    <span className="sp-br">]</span>
                  </div>
                  {form.password && (
                    <>
                      <div className="sp-str-bars">
                        {[1, 2, 3, 4, 5].map(i => (
                          <div key={i} className="sp-seg" style={{ background: i <= score ? STR_COL[score] : undefined }} />
                        ))}
                      </div>
                      <p className="sp-str-lbl" style={{ color: STR_COL[score] }}>{STR_LBL[score]}</p>
                    </>
                  )}
                </div>

                <div className="sp-btn-wrap">
                  <button type="submit" className="sp-btn" disabled={isSigningUp || handleStatus !== "available"}>
                    <span className="sp-btn-inner">
                      {isSigningUp
                        ? <><span className="sp-spin" />Initializing node…</>
                        : <><IcoArrow />Initialize Account</>}
                    </span>
                  </button>
                </div>
              </form>

              <div className="sp-via">Via</div>
              <div className="sp-patches">
                <div className="sp-patch"><span className="sp-patch-name">✦ Constellation</span><span className="sp-patch-stamp">Classified</span></div>
                <div className="sp-patch"><span className="sp-patch-name">✧ Starweave</span><span className="sp-patch-stamp">Classified</span></div>
              </div>

              <div className="sp-foot">
                <div className="sp-foot-txt">Already in orbit? <Link to="/login">Sign in →</Link></div>
                <Link to="/admin/login" className="sp-admin"><IcoShield />Admin</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
