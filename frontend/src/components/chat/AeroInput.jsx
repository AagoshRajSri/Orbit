// =============================================================================
// AeroInput.jsx — Glassmorphic floating input with self-avatar, actions, E2EE notice
// Ported from orbit-messaging.html .aero-wrap section.
// =============================================================================
import { useRef, useState, useCallback, useEffect } from "react";
import { PixelAvatar } from "../avatar/PixelAvatar/PixelAvatar.jsx";
import { Ico, I } from "./ChatCoreUI.jsx";

const STYLE = `
@media (max-width: 768px) {
  .aero-desktop-only { display: none !important; }
  .aero-mobile-only { display: flex !important; }
  .aero-container { padding: 10px 16px !important; background: transparent !important; border: none !important; margin-bottom: 24px !important; backdrop-filter: none !important; -webkit-backdrop-filter: none !important; }
  .aero-inner { background: transparent !important; border: none !important; box-shadow: none !important; padding: 0 !important; gap: 12px !important; }
  .aero-input-wrapper { flex: 1; border: 1px solid #EAE4D8 !important; border-radius: 24px !important; padding: 8px 16px !important; display: flex !important; align-items: center !important; background: white !important; }
  .aero-textarea { margin-top: 2px !important; font-size: 14px !important; }
  .aero-mic-btn { width: 44px !important; height: 44px !important; border-radius: 50% !important; background: #C9A87C !important; color: white !important; display: flex !important; align-items: center !important; justify-content: center !important; flex-shrink: 0 !important; border: none; cursor: pointer; transition: transform 0.2s; }
  .aero-mic-btn:active { transform: scale(0.9); }
  .aero-plus-btn { width: 28px !important; height: 28px !important; border-radius: 50% !important; border: 2px solid #8A8480 !important; color: #8A8480 !important; display: flex !important; align-items: center !important; justify-content: center !important; flex-shrink: 0 !important; background: transparent !important; cursor: pointer; }
}
`;
let _injectedAero = false;
function injectAeroStyle() {
  if (_injectedAero) return;
  _injectedAero = true;
  const s = document.createElement("style");
  s.textContent = STYLE;
  document.head.appendChild(s);
}

export default function AeroInput({
  t,              // ORBIT_CHAT_THEMES token object
  value,          // controlled string
  onChange,       // (newValue) => void
  onSend,         // () => void
  onTyping,       // () => void  — called on each keystroke
  selfAnimal,     // 'dog'|'cat'|'bunny'
  selfAvatarState,// useAvatarState .state
  onImageAttach,  // () => void
  onMediaToggle,  // (mode) => void
  onVoiceToggle,  // () => void
  isRecording,    // boolean
  disabled,
}) {
  const taRef = useRef(null);
  const isCyber  = t.id === "cyberpunk" || t.id === "gamer";
  const isPastel = t.id === "pastel";
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    injectAeroStyle();
  }, []);

  // Auto-resize textarea
  const autoResize = useCallback((el) => {
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 80) + "px";
  }, []);

  const handleChange = (e) => {
    onChange(e.target.value);
    autoResize(e.target);
    onTyping?.();
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  const handleSend = () => {
    onSend();
    if (taRef.current) {
      taRef.current.style.height = "auto";
    }
  };

  const focusBorderColor = focused ? t["--acc"] : t["--border"];
  const focusBoxShadow   = focused
    ? isCyber
      ? `0 0 25px ${t["--acc"]}20`
      : isPastel
      ? "0 4px 25px rgba(244,114,182,0.2)"
      : `0 0 0 2px ${t["--acc"]}20`
    : "none";

  return (
    <div className="aero-container" style={{
      padding: "14px 18px",
      background: t["--glass"],
      backdropFilter: `blur(${t["--blur"]})`,
      WebkitBackdropFilter: `blur(${t["--blur"]})`,
      borderTop: "none",
      flexShrink: 0, zIndex: 10,
    }}>
      <div className="aero-inner" style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "9px 12px",
        background: t["--glass2"],
        border: `1px solid ${focusBorderColor}`,
        borderRadius: isCyber ? "2px" : t["--radius"],
        transition: "border-color 0.25s, box-shadow 0.25s",
        boxShadow: focusBoxShadow,
      }}>
        {/* Mobile Left: Plus icon */}
        <div className="aero-mobile-only" style={{ display: "none" }}>
          <button className="aero-plus-btn" onClick={onImageAttach}>
             <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          </button>
        </div>

        {/* Desktop Left: Self pixel avatar */}
        <div className="aero-desktop-only" style={{ flexShrink: 0, display: "flex" }}>
          <PixelAvatar
            type={selfAnimal || "dog"}
            state={selfAvatarState || "idle"}
            size={30}
            style={{
              imageRendering: "pixelated",
              borderRadius: isPastel ? "50%" : isCyber ? "2px" : "8px",
              border: `2px solid ${t["--acc"]}`,
              display: "block",
              boxShadow: isCyber ? `0 0 10px ${t["--acc"]}` : "none",
            }}
          />
        </div>

        {/* Input Area */}
        <div className="aero-input-wrapper" style={{ flex: 1, display: "flex", alignItems: "center", gap: 8 }}>
          <textarea
            ref={taRef}
            className="aero-textarea"
            value={value}
            onChange={handleChange}
            onKeyDown={handleKey}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            disabled={disabled || isRecording}
            placeholder={isRecording ? "Recording..." : "Transmit encrypted..."}
            rows={1}
            style={{
              flex: 1, background: "none", border: "none", outline: "none",
              color: t["--text"], fontFamily: isCyber ? t.fontMono : t.font,
              fontSize: isCyber ? 13 : 14, resize: "none",
              maxHeight: 80, overflowY: "auto", lineHeight: 1.4,
              caretColor: t["--acc"],
            }}
          />
          {/* Mobile Right inside wrapper: Emoji */}
          <div className="aero-mobile-only" style={{ display: "none", cursor: "pointer", color: "#8A8480" }} onClick={() => onMediaToggle?.("emoji")}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
          </div>
        </div>

        {/* Desktop Right: Action buttons + Send */}
        <div className="aero-desktop-only" style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            {[
              { icon: <Ico d={I.emoji} size={18} stroke="currentColor" />, label: "Emoji", onClick: () => onMediaToggle?.("emoji") },
              { icon: <Ico d={I.img} size={18} stroke="currentColor" />, label: "Image", onClick: onImageAttach },
              { icon: <Ico d={I.attach} size={18} stroke="currentColor" />, label: "File" },
              { icon: <Ico d={isRecording ? I.mic2 : I.mic} size={18} stroke="currentColor" />, label: "Voice", onClick: onVoiceToggle, active: isRecording },
            ].map(({ icon, label, onClick, active }) => (
              <ActionBtn key={label} t={t} onClick={onClick} title={label} active={active}>
                {icon}
              </ActionBtn>
            ))}
          </div>

          <button
            onClick={handleSend}
            disabled={disabled || !value.trim()}
            title="Send"
            style={{
              width: 36, height: 36,
              borderRadius: isPastel ? "50%" : isCyber ? "2px" : t["--radius"],
              border: "none",
              background: isCyber
                ? t["--acc"]
                : `linear-gradient(135deg,${t["--acc"]},${t["--acc2"]})`,
              cursor: value.trim() ? "pointer" : "default",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 16, color: isCyber ? "#000" : "#fff",
              transition: "all 0.2s",
              boxShadow: t["--shadow"],
              opacity: !value.trim() ? 0.45 : 1,
              flexShrink: 0,
            }}
            onMouseEnter={e => {
              if (value.trim()) {
                e.currentTarget.style.transform = "scale(1.1)";
                e.currentTarget.style.boxShadow = isCyber
                  ? `0 0 35px ${t["--acc"]}`
                  : `0 0 25px ${t["--acc"]}70`;
              }
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.boxShadow = t["--shadow"];
            }}
            onMouseDown={e => { e.currentTarget.style.transform = "scale(0.94)"; }}
            onMouseUp={e => { e.currentTarget.style.transform = "scale(1.1)"; }}
          >
            ➤
          </button>
        </div>

        {/* Mobile Right: Mic/Send button */}
        <div className="aero-mobile-only" style={{ display: "none" }}>
          {value.trim() ? (
            <button className="aero-mic-btn" onClick={handleSend} style={{ background: '#10B981', boxShadow: '0 4px 10px rgba(16, 185, 129, 0.3)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
            </button>
          ) : (
            <button className="aero-mic-btn" onClick={onVoiceToggle}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
            </button>
          )}
        </div>
      </div>

      {/* E2EE notice */}
      <div className="aero-desktop-only" style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        gap: 5, fontSize: 10,
        color: isCyber ? t["--acc"] : t["--text2"],
        opacity: isCyber ? 0.7 : 0.55,
        marginTop: 7,
        fontFamily: isCyber ? t.fontMono : t.font,
        letterSpacing: "0.3px",
        textShadow: isCyber ? `0 0 6px ${t["--acc"]}` : "none",
      }}>
        🔒 Messages are end-to-end encrypted · AES-256-GCM + RSA-2048
      </div>
    </div>
  );
}

function ActionBtn({ t, onClick, title, children, active }) {
  const [hov, setHov] = useState(false);
  const isCyber = t.id === "cyberpunk" || t.id === "gamer";
  return (
    <button
      title={title}
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: 32, height: 32,
        borderRadius: isCyber ? "2px" : `calc(${t["--radius"]} - 4px)`,
        border: `1px solid ${active || hov ? t["--acc"] : t["--border"]}`,
        background: active ? `${t["--acc"]}33` : hov ? t["--glass2"] : t["--glass"],
        cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 14, transition: "all 0.2s",
        color: active || hov ? t["--acc"] : t["--text2"],
        transform: hov ? "scale(1.08)" : "scale(1)",
        boxShadow: ((active || hov) && isCyber) ? `0 0 10px ${t["--acc"]}` : "none",
      }}
    >
      {children}
    </button>
  );
}
