// =============================================================================
// AeroInput.jsx — Glassmorphic floating input with self-avatar, actions, E2EE notice
// Ported from orbit-messaging.html .aero-wrap section.
// =============================================================================
import { useRef, useState, useCallback, useEffect } from "react";
import { PixelAvatar } from "../components/PixelAvatar/PixelAvatar.jsx";
import { Ico, I } from "../components/ChatCoreUI.jsx";

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
    <div style={{
      padding: "14px 18px",
      background: t["--glass"],
      backdropFilter: `blur(${t["--blur"]})`,
      WebkitBackdropFilter: `blur(${t["--blur"]})`,
      borderTop: `1px solid ${isCyber ? t["--acc"] : t["--border"]}`,
      flexShrink: 0, zIndex: 10,
    }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "9px 12px",
        background: t["--glass2"],
        border: `1px solid ${focusBorderColor}`,
        borderRadius: isCyber ? "2px" : t["--radius"],
        transition: "border-color 0.25s, box-shadow 0.25s",
        boxShadow: focusBoxShadow,
      }}>
        {/* Self pixel avatar */}
        <div style={{ flexShrink: 0 }}>
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

        {/* Textarea */}
        <textarea
          ref={taRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKey}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          disabled={disabled || isRecording}
          placeholder={isRecording ? "Recording..." : "Transmit encrypted message…"}
          rows={1}
          style={{
            flex: 1, background: "none", border: "none", outline: "none",
            color: t["--text"], fontFamily: isCyber ? t.fontMono : t.font,
            fontSize: isCyber ? 13 : 14, resize: "none",
            maxHeight: 80, overflowY: "auto", lineHeight: 1.4,
            caretColor: t["--acc"],
          }}
        />

        {/* Action buttons */}
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

        {/* Send button */}
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

      {/* E2EE notice */}
      <div style={{
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
