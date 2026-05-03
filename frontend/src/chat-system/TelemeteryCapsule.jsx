// =============================================================================
// TelemeteryCapsule.jsx — Chat header: peer avatar, E2EE badge, signal, latency
// Directly ported from orbit-messaging.html .tele section with React state.
// =============================================================================
import { useState, useEffect, useCallback } from "react";
import { PixelAvatarBadge } from "../components/PixelAvatar/PixelAvatarBadge.jsx";

const ANIM = "@keyframes pdot{0%,100%{box-shadow:0 0 0 0 rgba(34,197,94,0.5)}60%{box-shadow:0 0 0 5px rgba(34,197,94,0)}}";
let _styleInjected = false;
function injectStyle() {
  if (_styleInjected) return;
  _styleInjected = true;
  const s = document.createElement("style");
  s.textContent = ANIM;
  document.head.appendChild(s);
}

export default function TelemeteryCapsule({
  t,                // resolved ORBIT_CHAT_THEMES token object
  entityName,       // conversation name
  entitySub,        // subtitle (members count / handle / "typing…")
  isNexus,
  isOnline,
  peerAnimal,       // 'dog'|'cat'|'bunny' for PixelAvatar
  peerAvatarState,  // useAvatarState .state
  onInfoToggle,
  onMobileMenuToggle,
}) {
  const [latency, setLatency]       = useState(12);
  const [signalStr, setSignalStr]   = useState(4);

  useEffect(() => {
    injectStyle();
    const t1 = setInterval(() => setLatency(Math.floor(8 + Math.random() * 28)), 3500);
    const t2 = setInterval(() => setSignalStr(2 + Math.floor(Math.random() * 3)), 5000);
    return () => { clearInterval(t1); clearInterval(t2); };
  }, []);

  const r = t["--radius"];
  const isCyber = t.id === "cyberpunk" || t.id === "gamer";
  const isPastel = t.id === "pastel";

  const badgeStyle = {
    display: "inline-flex", alignItems: "center", gap: 4,
    padding: "3px 10px",
    background: isCyber ? `rgba(0,255,157,0.08)` : `rgba(168,85,247,0.15)`,
    border: `1px solid ${isCyber ? t["--acc"] : "rgba(168,85,247,0.3)"}`,
    borderRadius: isCyber ? "2px" : "10px",
    fontSize: 9, fontWeight: 800, letterSpacing: "1px",
    color: t["--acc"],
    textShadow: isCyber ? `0 0 6px ${t["--acc"]}` : "none",
    whiteSpace: "nowrap", flexShrink: 0,
    fontFamily: t.fontMono,
  };

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12, padding: "13px 20px",
      background: t["--glass"], backdropFilter: `blur(${t["--blur"]})`,
      WebkitBackdropFilter: `blur(${t["--blur"]})`,
      borderBottom: `1px solid ${t["--border"]}`,
      flexShrink: 0, zIndex: 10,
      boxShadow: isCyber ? `0 3px 20px rgba(0,255,157,0.04)` : "none",
    }}>
      {/* Status bar scanner line */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 2,
        background: t["--glass2"], overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", left: "-60%", top: 0, width: "60%", height: "100%",
          background: `linear-gradient(90deg,transparent,${t["--acc"]},transparent)`,
          animation: "scan 2.5s linear infinite",
        }} />
      </div>

      {/* Peer avatar */}
      <div style={{ position: "relative", flexShrink: 0 }}>
        <PixelAvatarBadge
          type={peerAnimal || "dog"}
          state={peerAvatarState || "idle"}
          size={38}
          online={!!isOnline}
          showDot={true}
          style={{
            imageRendering: "pixelated",
            borderRadius: isPastel ? "50%" : "10px",
            border: `2px solid ${t["--border"]}`,
            display: "block",
          }}
        />
      </div>

      {/* Name + subtitle */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <h3 style={{
          fontSize: 14, fontWeight: 800, color: t["--text"],
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          lineHeight: 1.2, fontFamily: t.font,
          textShadow: isCyber ? `0 0 12px ${t["--acc"]}` : "none",
        }}>
          {isNexus ? `Nexus: ${entityName}` : entityName}
        </h3>
        <p style={{
          fontSize: 11, color: t["--acc"], marginTop: 2,
          fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          fontFamily: isCyber ? t.fontMono : t.font,
          textShadow: isCyber ? `0 0 8px ${t["--acc"]}` : "none",
        }}>
          {entitySub}
        </p>
      </div>

      {/* Type badge */}
      <span style={badgeStyle}>
        {isNexus ? "NEXUS" : "DIRECT LINE"}
      </span>

      {/* E2EE badge + signal + latency */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 4, padding: "4px 10px",
          background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.35)",
          borderRadius: isCyber ? "2px" : "20px",
          fontSize: 10, fontWeight: 700, color: "#22c55e",
          fontFamily: isCyber ? t.fontMono : t.font,
          textShadow: isCyber ? "0 0 6px #22c55e" : "none",
        }}>
          <div style={{
            width: 6, height: 6, background: "#22c55e", borderRadius: "50%",
            animation: "pdot 1.5s infinite", flexShrink: 0,
          }} />
          E2EE
        </div>

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
          fontSize: 10, color: t["--text2"], fontFamily: t.fontMono,
          opacity: isCyber ? 1 : 0.7, minWidth: 30,
          color: isCyber ? t["--acc2"] : t["--text2"],
          textShadow: isCyber ? `0 0 6px ${t["--acc2"]}` : "none",
        }}>
          {latency}ms
        </span>
      </div>

      {/* Action buttons */}
      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
        <TeleBtn t={t} onClick={onInfoToggle} title="Session info">ℹ</TeleBtn>
        {onMobileMenuToggle && (
          <TeleBtn t={t} onClick={onMobileMenuToggle} title="Menu">☰</TeleBtn>
        )}
      </div>
    </div>
  );
}

function TeleBtn({ t, onClick, title, children }) {
  const [hov, setHov] = useState(false);
  const isCyber = t.id === "cyberpunk" || t.id === "gamer";
  const isPastel = t.id === "pastel";
  return (
    <button
      title={title}
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: 34, height: 34,
        borderRadius: isPastel ? "50%" : t["--radius"],
        border: `1px solid ${hov ? t["--acc"] : t["--border"]}`,
        background: hov ? t["--acc"] : t["--glass2"],
        cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 14, transition: "all 0.2s",
        color: hov ? "#fff" : t["--text"],
        transform: hov ? "scale(1.06)" : "scale(1)",
        boxShadow: (hov && isCyber) ? `0 0 15px ${t["--acc"]}` : "none",
      }}
    >
      {children}
    </button>
  );
}
