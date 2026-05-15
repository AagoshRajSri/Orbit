import React, { useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Smile, Send, ArrowUp } from "lucide-react";
import { PixelAvatar } from "../avatar/PixelAvatar/PixelAvatar.jsx";

export default function AeroInput({
  t,
  value,
  onChange,
  onSend,
  onTyping,
  selfAnimal,
  selfAvatarState,
  onImageAttach,
  onMediaToggle,
  onVoiceToggle,
  isRecording,
  disabled,
}) {
  const taRef    = useRef(null);
  const [focused, setFocused] = useState(false);

  // ── Theme tokens ──────────────────────────────────────────────────────────
  const acc    = t["--acc"]    || "#7c3aed";
  const border = t["--border"] || "rgba(255,255,255,0.12)";
  const txt    = t["--text"]   || "#ffffff";
  const txt2   = t["--text2"]  || "rgba(255,255,255,0.5)";
  const font   = t["--font"]   || t.font || "inherit";

  const isCyber  = t.id === "cyberpunk" || t.id === "gamer";
  const isPastel = t.id === "pastel" || t.id === "pastel-dream";
  const isLight  = t.id === "light" || t.id === "premium";
  const isDark   = !isLight;

  const hasText   = value.trim().length > 0;
  const isSmall   = typeof window !== "undefined" && window.innerWidth < 400;

  // Derived colors
  const pillBg      = isLight ? "rgba(255,255,255,0.88)" : "rgba(255,255,255,0.04)";
  const pillBgHover = isLight ? "rgba(255,255,255,0.98)" : "rgba(255,255,255,0.06)";
  const outerBg     = isLight
    ? "rgba(240,238,232,0.85)"
    : "rgba(12,14,20,0.7)";

  // ── Handlers ──────────────────────────────────────────────────────────────
  const autoResize = useCallback((el) => {
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 150) + "px";
  }, []);

  // FIX 6: Throttled typing events (1.5s interval)
  const typingThrottleRef = useRef(false);
  const handleChange = (e) => {
    onChange(e.target.value);
    autoResize(e.target);
    
    if (!typingThrottleRef.current) {
      onTyping?.();
      typingThrottleRef.current = true;
      setTimeout(() => { typingThrottleRef.current = false; }, 1500);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if (!value.trim() || disabled) return;
    onSend();
    if (taRef.current) taRef.current.style.height = "auto";
  };

  // ── Corner radius helpers ─────────────────────────────────────────────────
  const btnRadius = isCyber ? "6px" : isPastel ? "50%" : "14px";
  const pillRadius = isCyber ? "8px" : "24px";

  return (
    <motion.div
      initial={{ y: 16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 28 }}
      style={{
        padding: "10px 16px 14px",
        background: outerBg,
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderTop: `1px solid ${border}`,
        flexShrink: 0,
        zIndex: 10,
        position: "relative",
      }}
    >
      {/* ── Subtle top shimmer line ───────────────────────────────────────── */}
      <div style={{
        position: "absolute", top: 0, left: "10%", right: "10%", height: 1,
        background: `linear-gradient(90deg, transparent, ${acc}55, transparent)`,
        pointerEvents: "none",
      }} />

      <div style={{
        display: "flex",
        alignItems: "flex-end",
        gap: 10,
        maxWidth: 1200,
        margin: "0 auto",
        width: "100%",
      }}>

        {/* ── Attach (+) ────────────────────────────────────────────────────── */}
        <motion.button
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.88 }}
          onClick={onImageAttach}
          title="Attach file"
          style={{
            width: 44, height: 44,
            flexShrink: 0,
            borderRadius: btnRadius,
            border: `1px solid ${border}`,
            background: focused ? `${acc}18` : (isLight ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.04)"),
            color: focused ? acc : txt2,
            cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.25s cubic-bezier(0.16,1,0.3,1)",
            opacity: disabled ? 0.4 : 1,
            marginBottom: 0,
          }}
        >
          <Plus size={20} strokeWidth={2.5} />
        </motion.button>

        {/* ── Main Input Capsule ────────────────────────────────────────────── */}
        <div style={{
          flex: 1,
          minWidth: 0,
          position: "relative",
          // Glowing border via outline + box-shadow combo
          borderRadius: pillRadius,
          background: focused ? pillBgHover : pillBg,
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          outline: focused
            ? `1.5px solid ${acc}`
            : `1px solid ${border}`,
          boxShadow: focused
            ? `0 0 0 3px ${acc}18, 0 4px 24px rgba(0,0,0,${isDark ? "0.3" : "0.08"}), inset 0 1px 0 rgba(255,255,255,0.08)`
            : `0 2px 12px rgba(0,0,0,${isDark ? "0.25" : "0.06"}), inset 0 1px 0 rgba(255,255,255,0.06)`,
          transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
          overflow: "hidden",
        }}>

          {/* Inner layout */}
          <div style={{
            display: "flex",
            alignItems: "flex-end",
            padding: "6px 6px 6px 8px",
            gap: 6,
          }}>

            {/* Avatar sigil */}
            {!isSmall && (
              <motion.div
                animate={{ scale: focused ? 1.06 : 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                style={{
                  flexShrink: 0,
                  borderRadius: isPastel ? "50%" : isCyber ? "4px" : "10px",
                  overflow: "hidden",
                  border: `1.5px solid ${focused ? acc + "99" : border + "88"}`,
                  marginBottom: 4,
                  transition: "border-color 0.25s",
                  boxShadow: focused ? `0 0 10px ${acc}33` : "none",
                }}
              >
                <PixelAvatar
                  type={selfAnimal || "dog"}
                  state={selfAvatarState || "idle"}
                  size={34}
                />
              </motion.div>
            )}

            {/* Textarea */}
            <textarea
              ref={taRef}
              value={value}
              onChange={handleChange}
              onKeyDown={handleKey}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              disabled={disabled || isRecording}
              placeholder={isRecording ? "⬤  Recording secure feed..." : "Transmit via Secure Ratchet..."}
              rows={1}
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                padding: "12px 4px",
                color: txt,
                fontFamily: font,
                fontSize: "16px",
                fontWeight: 450,
                outline: "none",
                resize: "none",
                lineHeight: "1.5",
                maxHeight: "150px",
                overflowY: "auto",
                caretColor: acc,
                // placeholder color injected via CSS class below
              }}
              className="aeroinput-ta"
            />

            {/* Emoji / sticker trigger */}
            <motion.button
              whileHover={{ scale: 1.2, rotate: -8 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onMediaToggle?.("emoji")}
              title="Emoji & GIFs"
              style={{
                background: "none",
                border: "none",
                color: focused ? acc + "cc" : txt2,
                cursor: "pointer",
                padding: "8px 6px",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
                transition: "color 0.2s",
                marginBottom: 2,
              }}
            >
              <Smile size={20} strokeWidth={1.8} />
            </motion.button>
          </div>

          {/* Animated focus underline */}
          <AnimatePresence>
            {focused && (
              <motion.div
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ scaleX: 1, opacity: 1 }}
                exit={{ scaleX: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  position: "absolute",
                  bottom: 0, left: 0, right: 0,
                  height: 2,
                  background: `linear-gradient(90deg, transparent, ${acc}, ${acc}aa, transparent)`,
                  originX: 0.5,
                  borderRadius: "0 0 4px 4px",
                }}
              />
            )}
          </AnimatePresence>
        </div>

        {/* ── Send button ────────────────────────────────────────────────────── */}
        <motion.button
          onClick={handleSend}
          disabled={disabled || !hasText}
          title="Send"
          animate={{
            background: hasText
              ? acc
              : (isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.06)"),
            boxShadow: hasText
              ? `0 4px 20px ${acc}66, 0 0 0 1px ${acc}`
              : `0 0 0 1px ${border}`,
            color: hasText
              ? (isCyber ? "#000" : "#fff")
              : txt2,
          }}
          whileHover={hasText ? { scale: 1.12, y: -1 } : {}}
          whileTap={hasText ? { scale: 0.9 } : {}}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
          style={{
            width: 44, height: 44,
            flexShrink: 0,
            borderRadius: btnRadius,
            border: "none",
            cursor: hasText ? "pointer" : "default",
            display: "flex", alignItems: "center", justifyContent: "center",
            marginBottom: 0,
          }}
        >
          <AnimatePresence mode="wait">
            {hasText ? (
              <motion.span
                key="arrow"
                initial={{ scale: 0, rotate: -45, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                exit={{ scale: 0, rotate: 45, opacity: 0 }}
                transition={{ duration: 0.18 }}
                style={{ display: "flex" }}
              >
                <ArrowUp size={20} strokeWidth={2.5} />
              </motion.span>
            ) : (
              <motion.span
                key="send"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: 0.18 }}
                style={{ display: "flex" }}
              >
                <Send size={18} strokeWidth={1.8} />
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* ── Placeholder color injection ───────────────────────────────────── */}
      <style>{`
        .aeroinput-ta::placeholder {
          color: ${txt2};
          opacity: 0.55;
          font-style: italic;
        }
        .aeroinput-ta::-webkit-scrollbar { width: 4px; }
        .aeroinput-ta::-webkit-scrollbar-track { background: transparent; }
        .aeroinput-ta::-webkit-scrollbar-thumb { background: ${acc}44; border-radius: 4px; }
      `}</style>
    </motion.div>
  );
}
