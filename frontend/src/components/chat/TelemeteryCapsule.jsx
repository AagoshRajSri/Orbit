// =============================================================================
// TelemeteryCapsule.jsx — Redesigned chat header
//   LEFT:   back chevron + avatar + name/sub
//   CENTER: clickable join-code pill (copies to clipboard)
//   RIGHT:  E2EE · signal · latency · search · call · info
// =============================================================================
import { useState, useEffect, useRef } from "react";
import { PixelAvatarBadge } from "../avatar/PixelAvatar/PixelAvatarBadge.jsx";

// Inject pulse + scan animations once
const STYLE = `
@keyframes pdot{0%,100%{box-shadow:0 0 0 0 rgba(34,197,94,0.5)}60%{box-shadow:0 0 0 5px rgba(34,197,94,0)}}
@keyframes scan{from{left:-60%}to{left:160%}}
@keyframes codeCopy{0%{opacity:0;transform:translateY(6px)}30%{opacity:1;transform:translateY(0)}80%{opacity:1}100%{opacity:0;transform:translateY(6px)}}
@media (max-width: 768px) {
  .tc-desktop-only { display: none !important; }
  .tc-mobile-only { display: flex !important; }
  .tc-container { padding: 0 12px !important; border-bottom: none !important; background: transparent !important; box-shadow: none !important; height: 56px !important; }
  .tc-title { font-family: 'Playfair Display', serif !important; font-size: 20px !important; font-weight: 700 !important; color: #1C1C1C !important; letter-spacing: 0 !important; text-transform: none !important; font-style: italic !important; }
  .tc-sub { font-family: 'Inter', sans-serif !important; font-size: 11px !important; color: #8A8480 !important; opacity: 1 !important; font-weight: 500 !important; letter-spacing: 0 !important; }
  .tc-btn { background: transparent !important; border: none !important; color: #1C1C1C !important; }
}
`;
let _injected = false;
function injectStyle() {
  if (_injected) return;
  _injected = true;
  const s = document.createElement("style");
  s.textContent = STYLE;
  document.head.appendChild(s);
}

// ── SVG icon primitives ──────────────────────────────────────────────────────
function ChevronLeft({ size = 18, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}
function SearchIcon({ size = 16, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}
function PhoneIcon({ size = 16, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.34 2 2 0 0 1 3.59 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.5a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}
function InfoIcon({ size = 16, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}
function MoreIcon({ size = 20, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="1" /><circle cx="12" cy="5" r="1" /><circle cx="12" cy="19" r="1" />
    </svg>
  );
}
function MenuIcon({ size = 16, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}
function CopyIcon({ size = 13, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

export default function TelemeteryCapsule({
  t,                // resolved ORBIT_CHAT_THEMES token object
  entityName,       // conversation name (plain, no prefix)
  entitySub,        // subtitle (members count / handle / "typing…")
  isNexus,
  isOnline,
  joinCode,         // nexus join code to display + copy
  peerAnimal,
  peerAvatarState,
  onBack,           // () => void — back navigation
  onSearch,         // () => void
  onCall,           // () => void
  onInfoToggle,
  onMobileMenuToggle,
  searchActive,
}) {
  const [latency, setLatency]     = useState(12);
  const [signalStr, setSignalStr] = useState(4);
  const [copied, setCopied]       = useState(false);

  useEffect(() => {
    injectStyle();
    const t1 = setInterval(() => setLatency(Math.floor(8 + Math.random() * 28)), 3500);
    const t2 = setInterval(() => setSignalStr(2 + Math.floor(Math.random() * 3)), 5000);
    return () => { clearInterval(t1); clearInterval(t2); };
  }, []);

  const isCyber  = t.id === "cyberpunk" || t.id === "gamer";
  const isPastel = t.id === "pastel";

  const handleCopyCode = () => {
    if (!joinCode) return;
    navigator.clipboard.writeText(joinCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="tc-container" style={{
      display: "flex", alignItems: "center",
      padding: "0 16px",
      height: 64,
      background: t["--glass"],
      backdropFilter: `blur(${t["--blur"]})`,
      WebkitBackdropFilter: `blur(${t["--blur"]})`,
      borderBottom: `1px solid ${t["--border"]}`,
      flexShrink: 0, zIndex: 10, position: "relative", overflow: "visible",
      boxShadow: isCyber ? `0 3px 20px rgba(0,255,157,0.06)` : "none",
    }}>
      {/* Scanner line */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: t["--glass2"], overflow: "hidden", pointerEvents: "none" }}>
        <div style={{
          position: "absolute", left: "-60%", top: 0, width: "60%", height: "100%",
          background: `linear-gradient(90deg,transparent,${t["--acc"]},transparent)`,
          animation: "scan 2.8s linear infinite",
        }} />
      </div>

      {/* ── LEFT: Back + Avatar + Name ─────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, flex: "0 0 auto", minWidth: 0 }}>
        {/* Back button */}
        {onBack && (
          <TeleBtn t={t} onClick={onBack} title="Go back" square={isCyber}>
            <ChevronLeft size={20} />
          </TeleBtn>
        )}

        {/* Mobile menu trigger */}
        {onMobileMenuToggle && (
          <TeleBtn t={t} onClick={onMobileMenuToggle} title="Menu" square={isCyber}>
            <MenuIcon size={16} />
          </TeleBtn>
        )}

        {/* Avatar */}
        <div style={{ position: "relative", flexShrink: 0 }}>
          <PixelAvatarBadge
            type={peerAnimal || "dog"}
            state={peerAvatarState || "idle"}
            size={36}
            online={!!isOnline}
            showDot={true}
            style={{
              imageRendering: "pixelated",
              borderRadius: isPastel ? "50%" : "10px",
              display: "block",
            }}
          />
        </div>

        {/* Name + sub */}
        <div style={{ minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "center", marginTop: 2 }}>
          <div className="tc-title" style={{
            fontSize: 15, fontWeight: 800, color: t["--text"],
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            lineHeight: 1.2, fontFamily: t.font,
            textShadow: isCyber ? `0 0 12px ${t["--acc"]}` : "none",
            maxWidth: 180,
          }}>
            {entityName}
          </div>
          <div className="tc-sub" style={{
            fontSize: 11, color: t["--acc"], marginTop: 1,
            fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            fontFamily: isCyber ? t.fontMono : t.font,
            textShadow: isCyber ? `0 0 8px ${t["--acc"]}` : "none",
            opacity: 0.85,
          }}>
            <span className="tc-mobile-only" style={{ display: 'none', alignItems: 'center', gap: 4 }}>
              {isNexus ? `${entitySub.split(' ')[0]} Members` : entitySub} <span style={{fontSize:8}}>•</span> <InfoIcon size={10} /> Encrypted
            </span>
            <span className="tc-desktop-only">{entitySub}</span>
          </div>
        </div>

        {/* Join Code / E2EE Pill (moved here to be closer to profile) */}
        <div className="tc-desktop-only" style={{ display: "flex", alignItems: "center", marginLeft: 16 }}>
          {isNexus && joinCode ? (
            <div style={{ position: "relative" }}>
              {copied && (
                <div style={{
                  position: "absolute", bottom: "calc(100% + 10px)", left: "50%", transform: "translateX(-50%)",
                  background: t["--acc"], color: isCyber ? "#000" : "#fff",
                  fontSize: 10, fontWeight: 700, padding: "4px 12px", borderRadius: 20,
                  whiteSpace: "nowrap", pointerEvents: "none", zIndex: 9999,
                  animation: "codeCopy 2s ease forwards", fontFamily: t.fontMono, letterSpacing: "0.5px",
                  boxShadow: `0 4px 16px ${t["--acc"]}50`,
                }}>
                  ✓ Copied!
                </div>
              )}
              <button
                onClick={handleCopyCode} title="Click to copy join code"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 7, padding: "4px 12px",
                  background: isCyber ? `rgba(0,255,157,0.08)` : isPastel ? `rgba(244,114,182,0.12)` : `rgba(168,85,247,0.12)`,
                  border: `1px solid ${isCyber ? t["--acc"] : isPastel ? "rgba(244,114,182,0.4)" : "rgba(168,85,247,0.35)"}`,
                  borderRadius: isCyber ? "2px" : "20px", cursor: "pointer", transition: "all 0.2s",
                  boxShadow: isCyber ? `0 0 12px ${t["--acc"]}18` : "none",
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.04)"; e.currentTarget.style.boxShadow = isCyber ? `0 0 20px ${t["--acc"]}40` : `0 4px 16px ${t["--acc"]}30`; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = isCyber ? `0 0 12px ${t["--acc"]}18` : "none"; }}
              >
                <span style={{
                  fontSize: 10, fontWeight: 900, letterSpacing: "2.5px", color: t["--acc"], fontFamily: t.fontMono,
                  textShadow: isCyber ? `0 0 8px ${t["--acc"]}` : "none", textTransform: "uppercase",
                }}>
                  {joinCode}
                </span>
                <CopyIcon size={12} color={t["--acc"]} />
              </button>
            </div>
          ) : !isNexus ? (
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 12px",
              background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.25)",
              borderRadius: isCyber ? "2px" : "20px", fontSize: 10, fontWeight: 700, color: "#22c55e",
              fontFamily: isCyber ? t.fontMono : t.font, textShadow: isCyber ? "0 0 6px #22c55e" : "none",
            }}>
              <div style={{ width: 6, height: 6, background: "#22c55e", borderRadius: "50%", animation: "pdot 1.5s infinite", flexShrink: 0 }} />
              E2EE · Direct
            </div>
          ) : null}
        </div>
      </div>

      {/* ── CENTER (Empty now, lets LEFT and RIGHT take space) ─────────────────────────────────────── */}
      <div className="tc-desktop-only" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
      </div>

      {/* ── RIGHT: Signal + Latency + Action Buttons ───────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flex: "1 0 auto", justifyContent: "flex-end" }}>
        <div className="tc-desktop-only" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* E2EE badge (nexus only) */}
        {isNexus && (
          <div style={{
            display: "flex", alignItems: "center", gap: 4, padding: "4px 10px",
            background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.25)",
            borderRadius: isCyber ? "2px" : "20px",
            fontSize: 9, fontWeight: 700, color: "#22c55e",
            fontFamily: isCyber ? t.fontMono : t.font,
            textShadow: isCyber ? "0 0 6px #22c55e" : "none",
            letterSpacing: "0.5px",
          }}>
            <div style={{ width: 5, height: 5, background: "#22c55e", borderRadius: "50%", animation: "pdot 1.5s infinite", flexShrink: 0 }} />
            E2EE
          </div>
        )}

        {/* Signal bars */}
        <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 16 }}>
          {[5, 8, 11, 14, 17].map((h, i) => (
            <div key={i} style={{
              width: 3, borderRadius: 1, height: h,
              background: i < signalStr ? t["--acc"] : t["--border"],
              transition: "background 0.4s",
              boxShadow: (i < signalStr && isCyber) ? `0 0 5px ${t["--acc"]}` : "none",
            }} />
          ))}
        </div>

        <span style={{
          fontSize: 10,
          color: isCyber ? t["--acc2"] : t["--text2"],
          fontFamily: t.fontMono,
          opacity: isCyber ? 1 : 0.7,
          minWidth: 28,
          textShadow: isCyber ? `0 0 6px ${t["--acc2"]}` : "none",
        }}>
          {latency}ms
        </span>

        {/* Divider */}
        <div style={{ width: 1, height: 20, background: t["--border"], opacity: 0.5 }} />

        {/* Search */}
        {onSearch && (
          <TeleBtn t={t} onClick={onSearch} title="Search" active={searchActive} square={isCyber}>
            <SearchIcon size={15} />
          </TeleBtn>
        )}

        {/* Call */}
        {onCall && (
          <TeleBtn t={t} onClick={onCall} title="Voice call" square={isCyber}>
            <PhoneIcon size={15} />
          </TeleBtn>
        )}
        </div>

        {/* Info / More (Mobile) */}
        <div className="tc-desktop-only">
          <TeleBtn t={t} onClick={onInfoToggle} title="Session info" square={isCyber}>
            <InfoIcon size={15} />
          </TeleBtn>
        </div>
        <div className="tc-mobile-only" style={{ display: 'none' }}>
          <TeleBtn t={t} onClick={onInfoToggle} title="Options" square={isCyber}>
            <MoreIcon size={20} />
          </TeleBtn>
        </div>
      </div>
    </div>
  );
}

// ── Icon button ───────────────────────────────────────────────────────────────
function TeleBtn({ t, onClick, title, children, active, square }) {
  const [hov, setHov] = useState(false);
  const isPastel = t.id === "pastel";
  const lit = hov || active;
  return (
    <button
      title={title}
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: 34, height: 34, flexShrink: 0,
        borderRadius: square ? "4px" : isPastel ? "50%" : "10px",
        border: `1px solid ${lit ? t["--acc"] : t["--border"]}`,
        background: lit ? `${t["--acc"]}22` : t["--glass2"],
        cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "all 0.18s",
        color: lit ? t["--acc"] : t["--text2"],
        transform: hov ? "scale(1.07)" : "scale(1)",
        boxShadow: (lit && (t.id === "cyberpunk" || t.id === "gamer")) ? `0 0 12px ${t["--acc"]}60` : "none",
      }}
    >
      {children}
    </button>
  );
}
