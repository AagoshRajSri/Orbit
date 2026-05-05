// =============================================================================
// MsgBubble.jsx — per-theme message bubble with reactions, status tick, avatar
// Derived from orbit-messaging.html's .msg-bubble styles + ChatCoreUI MsgBubble.
// =============================================================================
import { useState, memo, useCallback } from "react";
import { PixelAvatar } from "../avatar/PixelAvatar/PixelAvatar.jsx";
import MessageStatusRing from "./MessageStatusRing.jsx";

const REACT_SET = ["❤️","👍","😂","🔥","✨","🎯","🔐","💫","😮","🥺"];

const MSG_STYLE = `
@media (max-width: 768px) {
  .msg-mobile-time-inside { display: none !important; }
  .msg-mobile-time-outside { display: flex !important; }
}
@media (min-width: 769px) {
  .msg-mobile-time-outside { display: none !important; }
}
`;
let _injectedMsg = false;
function injectMsgStyle() {
  if (_injectedMsg) return;
  _injectedMsg = true;
  const s = document.createElement("style");
  s.textContent = MSG_STYLE;
  document.head.appendChild(s);
}


function getBubbleStyle(t, mine) {
  const isCyber  = t.id === "cyberpunk" || t.id === "gamer";
  const isPastel = t.id === "pastel";
  const base = {
    padding: "10px 14px",
    borderRadius: t["--radius"],
    fontSize: isCyber ? 12 : 13.5,
    lineHeight: isCyber ? 1.6 : 1.55,
    color: mine ? (t["--sent-text"] || t["--text"]) : t["--text"],
    wordBreak: "break-word",
    position: "relative",
    maxWidth: 480,
    transition: "transform 0.15s, box-shadow 0.15s",
    fontFamily: isCyber ? t.fontMono : t.font,
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
  };

  if (mine) {
    return {
      ...base,
      background: isPastel
        ? "linear-gradient(135deg,rgba(244,114,182,0.22),rgba(192,132,252,0.22))"
        : t["--sent-bg"],
      border: `1px solid ${isPastel ? "rgba(244,114,182,0.5)" : t["--border"]}`,
      borderBottomRightRadius: isCyber ? "2px" : isPastel ? "8px" : "5px",
      boxShadow: isCyber
        ? `0 0 15px rgba(0,255,157,0.08), inset 0 0 15px rgba(0,255,157,0.03)`
        : isPastel
        ? "0 4px 20px rgba(244,114,182,0.15)"
        : t["--shadow"],
    };
  } else {
    return {
      ...base,
      background: t["--recv-bg"],
      border: `1px solid ${isCyber ? "rgba(0,212,255,0.3)" : "rgba(255,255,255,0.07)"}`,
      borderBottomLeftRadius: isCyber ? "2px" : isPastel ? "8px" : "5px",
      boxShadow: isCyber ? `0 0 15px rgba(0,212,255,0.05)` : "none",
    };
  }
}

// Cyber terminal prefix ($ for sent, > for received)
function CyberPrefix({ mine, t }) {
  return (
    <span style={{
      color: mine ? t["--acc"] : t["--acc2"],
      fontWeight: 700,
      marginRight: 3,
      textShadow: `0 0 8px ${mine ? t["--acc"] : t["--acc2"]}`,
    }}>
      {mine ? "$ " : "> "}
    </span>
  );
}

function ReactionStrip({ reactions, onReact, t }) {
  if (!reactions || Object.keys(reactions).length === 0) return null;
  return (
    <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 4 }}>
      {Object.entries(reactions).map(([emoji, count]) => (
        <span
          key={emoji}
          onClick={() => onReact(emoji)}
          style={{
            fontSize: 12, cursor: "pointer", padding: "2px 7px",
            borderRadius: 12,
            background: t["--glass2"],
            border: `1px solid ${t["--border"]}`,
            transition: "transform 0.15s, border-color 0.15s",
            display: "inline-flex", alignItems: "center", gap: 3,
            color: t["--text2"],
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = "scale(1.2)";
            e.currentTarget.style.borderColor = t["--acc"];
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.borderColor = t["--border"];
          }}
        >
          {emoji}
          <span style={{ color: t["--acc"], fontWeight: 700, fontSize: 11 }}>{count}</span>
        </span>
      ))}
    </div>
  );
}

function QuickReactBar({ t, onReact, onPin, mine }) {
  return (
    <div style={{
      position: "absolute", top: -38,
      [mine ? "right" : "left"]: -4,
      background: `${t["--bg2"]}ee`,
      backdropFilter: "blur(12px)",
      border: `1px solid ${t["--border"]}`,
      borderRadius: 24,
      padding: "4px 8px",
      display: "flex", gap: 6, zIndex: 20,
      boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
      animation: "popIn 0.2s ease",
      alignItems: "center",
    }}>
      {REACT_SET.slice(0, 6).map(e => (
        <span
          key={e}
          onClick={() => onReact(e)}
          style={{ cursor: "pointer", fontSize: 16, transition: "transform 0.15s", display: "inline-block" }}
          onMouseEnter={el => el.currentTarget.style.transform = "scale(1.3)"}
          onMouseLeave={el => el.currentTarget.style.transform = "scale(1)"}
        >
          {e}
        </span>
      ))}
      <div style={{ width: 1, height: 16, background: t["--border"], margin: "0 2px" }} />
      <span
        onClick={onPin}
        title="Pin Message"
        style={{ cursor: "pointer", fontSize: 13, transition: "transform 0.15s", display: "inline-block", filter: "grayscale(100%)", opacity: 0.7 }}
        onMouseEnter={el => { el.currentTarget.style.transform = "scale(1.2)"; el.currentTarget.style.filter = "none"; el.currentTarget.style.opacity = 1; }}
        onMouseLeave={el => { el.currentTarget.style.transform = "scale(1)"; el.currentTarget.style.filter = "grayscale(100%)"; el.currentTarget.style.opacity = 0.7; }}
      >
        📌
      </span>
    </div>
  );
}

export const OrbitMsgBubble = memo(function OrbitMsgBubble({
  msg,      // { id, text, image, out, from, time, reactions, status, isSystem }
  t,        // ORBIT_CHAT_THEMES token object
  avatarAnimal,   // 'dog'|'cat'|'bunny'
  avatarState,    // useAvatarState .state
  onReact,        // (msgId, emoji) => void
  onPin,          // (msg) => void
}) {
  const [hov, setHov] = useState(false);
  const mine = !!msg.out;
  const isCyber  = t.id === "cyberpunk" || t.id === "gamer";
  const isPastel = t.id === "pastel";

  // Inject styles on mount
  useState(() => { injectMsgStyle(); });

  const handleReact = useCallback((emoji) => {
    onReact?.(msg.id, emoji);
  }, [msg.id, onReact]);

  if (msg.isSystem) {
    return (
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        margin: "6px 0", fontSize: 10,
        color: t["--text2"], opacity: 0.55, fontWeight: 700,
        letterSpacing: "1.5px", fontFamily: t.font,
      }}>
        <div style={{ flex: 1, height: 1, background: t["--border"] }} />
        {msg.text}
        <div style={{ flex: 1, height: 1, background: t["--border"] }} />
      </div>
    );
  }

  return (
    <div
      id={`msg-${msg.id || msg._id}`}
      style={{
        display: "flex", alignItems: "flex-end",
        gap: 8, flexDirection: mine ? "row-reverse" : "row",
        animation: "fadeUpMsg 0.4s cubic-bezier(0.34,1.56,0.64,1)",
        marginBottom: 2,
      }}
    >
      {/* Avatar */}
      <PixelAvatar
        type={avatarAnimal || "dog"}
        state={avatarState || "idle"}
        size={28}
        style={{
          imageRendering: "pixelated",
          borderRadius: isPastel ? "50%" : "8px",
          border: `1.5px solid ${mine ? t["--acc"] : t["--border"]}`,
          display: "block", flexShrink: 0,
          boxShadow: (mine && isCyber) ? `0 0 10px ${t["--acc"]}` : "none",
        }}
      />

      {/* Content col */}
      <div style={{
        maxWidth: "65%", display: "flex", flexDirection: "column",
        gap: 4, alignItems: mine ? "flex-end" : "flex-start",
      }}>
        {/* Sender name for received */}
        {!mine && (
          <>
            <div className="msg-mobile-time-outside" style={{
              fontSize: 11, color: t["--text2"], marginLeft: 14,
              fontFamily: t.font, fontWeight: 600, letterSpacing: "0.04em",
              display: "flex", alignItems: "center", gap: 4
            }}>
              <span>{msg.from}</span>
              <span style={{ fontSize: 14, opacity: 0.5 }}>•</span>
              <span>{msg.time}</span>
            </div>
            <div className="msg-mobile-time-inside" style={{
              fontSize: 11, color: t["--text2"], marginLeft: 14,
              fontFamily: t.font, fontWeight: 600, letterSpacing: "0.04em",
            }}>
              {msg.from}
            </div>
          </>
        )}

        {/* Sender time for sent (mobile only) */}
        {mine && (
          <div className="msg-mobile-time-outside" style={{
            fontSize: 11, color: t["--text2"], marginRight: 14,
            fontFamily: t.font, fontWeight: 600, letterSpacing: "0.04em",
            alignSelf: "flex-end"
          }}>
            {msg.time}
          </div>
        )}

        {/* Bubble with hover reaction bar */}
        <div
          style={{ position: "relative" }}
          onMouseEnter={() => setHov(true)}
          onMouseLeave={() => setHov(false)}
        >
          {hov && <QuickReactBar t={t} onReact={handleReact} onPin={() => onPin?.(msg)} mine={mine} />}

          <div
            style={{
              ...getBubbleStyle(t, mine),
              transform: hov ? "scale(1.015)" : "scale(1)",
              boxShadow: hov
                ? `0 10px 40px ${t["--shadow"]}`
                : getBubbleStyle(t, mine).boxShadow,
            }}
          >
            {/* Cyber prefix */}
            {isCyber && <CyberPrefix mine={mine} t={t} />}

            {/* Image */}
            {msg.image && (
              <img
                src={msg.image}
                alt="attachment"
                style={{
                  maxWidth: "100%", borderRadius: "calc(var(--radius) - 4px)",
                  marginBottom: msg.text ? 6 : 0, display: "block",
                }}
              />
            )}

            {/* Text */}
            {msg.text && <span style={{ position: "relative", zIndex: 1 }}>{msg.text}</span>}

            {/* Pending spinner */}
            {msg.status === "pending" && (
              <span style={{
                marginLeft: 5, fontSize: 11, color: t["--text2"],
                animation: "spin 2s linear infinite", display: "inline-block",
              }}>◷</span>
            )}

            {/* Time + status */}
            <div className="msg-mobile-time-inside" style={{
              display: "flex", justifyContent: "flex-end", alignItems: "center",
              gap: 5, marginTop: 2, opacity: 0.65,
            }}>
              <span style={{
                fontSize: 9.5, color: t["--text2"],
                fontFamily: t.fontMono, letterSpacing: "0.04em", fontWeight: 700,
              }}>
                {msg.time}
              </span>
              {mine && (
                <MessageStatusRing
                  status={msg.status || "delivered"}
                  colorOverride={
                    msg.status === "read" ? t["--acc"]
                    : msg.status === "failed" ? "#FF5252"
                    : undefined
                  }
                />
              )}
            </div>
          </div>
        </div>

        {/* Reactions */}
        <ReactionStrip reactions={msg.reactions} onReact={handleReact} t={t} />
      </div>
    </div>
  );
});
