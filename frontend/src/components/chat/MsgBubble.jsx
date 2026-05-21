/**
 * MsgBubble.jsx
 * ──────────────────────────────────────────────────────────────────────────────
 * Implements the "MessageSurface" visual architecture of Orbit:
 * - NO backgrounds, capsules, or borders for standard messages.
 * - Max width of 68ch for supreme readability.
 * - Left-aligned text layout (no alternating sides for sent messages).
 * - Avatar/Name appears ONLY on the start of a message group/run.
 * - Subsequent messages in a run preserve alignment with empty margins.
 * - ResonanceLayer: Timestamps, lock icons, and status indicators fade in on hover (0.0 -> 0.6).
 * - Animated glass action bar transitions in above the text on hover.
 */

import { useState, memo, useCallback, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PixelAvatar } from "../avatar/PixelAvatar/PixelAvatar.jsx";
import MessageStatusRing from "./MessageStatusRing.jsx";
import { AnimatedMessage } from "../../orbit/AnimatedMessage";
import { timing, prefersReducedMotion } from "../../orbit/MotionSystem";

export function SafeImage({ src, alt, style }) {
  const [url, setUrl] = useState(null);

  useEffect(() => {
    if (!src) return;
    let blobUrl = null;
    if (src instanceof ArrayBuffer || src instanceof Uint8Array) {
      const blob = new Blob([src]);
      blobUrl = URL.createObjectURL(blob);
      setUrl(blobUrl);
    } else if (src instanceof Blob) {
      blobUrl = URL.createObjectURL(src);
      setUrl(blobUrl);
    } else if (typeof src === "string") {
      setUrl(src);
    }

    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [src]);

  if (!url) return <div style={{ ...style, background: "rgba(240, 237, 232, 0.05)", minHeight: 180, borderRadius: 8 }} />;
  return (
    <img 
      src={url} 
      alt={alt} 
      style={{ ...style, minHeight: 100 }} 
      loading="lazy" 
      decoding="async"
    />
  );
}

const REACT_SET = ["❤️", "👍", "😂", "🔥", "✨", "🎯", "🔐", "💫", "😮", "🥺"];

function ReactionStrip({ reactions, onReact, t }) {
  if (!reactions || Object.keys(reactions).length === 0) return null;
  return (
    <div className="flex gap-1.5 flex-wrap mt-1">
      {Object.entries(reactions).map(([emoji, count]) => (
        <motion.span
          key={emoji}
          onClick={() => onReact(emoji)}
          initial={{ scale: 0, y: 10 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 15 }}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs cursor-pointer border backdrop-blur-md"
          style={{
            background: "rgba(8, 9, 16, 0.6)",
            borderColor: "rgba(240, 237, 232, 0.1)",
            color: "var(--text-secondary)",
          }}
          whileHover={{ scale: 1.2, borderColor: "var(--accent-primary, #00d4ff)" }}
        >
          <span>{emoji}</span>
          <span className="font-bold text-[10px] text-amber-400">{count}</span>
        </motion.span>
      ))}
    </div>
  );
}

function QuickReactBar({ onReact, onPin, mine }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 5, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 5, scale: 0.95 }}
      transition={{ duration: 0.12 }}
      className={`absolute -top-10 px-2 py-1 flex items-center gap-1.5 rounded-full backdrop-blur-xl z-50 pointer-events-auto ${mine ? 'right-0' : 'left-0'}`}
      style={{
        background: "var(--color-base-200, rgba(20, 20, 20, 0.8))",
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        border: "1px solid var(--color-base-300, rgba(255,255,255,0.1))"
      }}
    >
      {REACT_SET.slice(0, 4).map((e) => (
        <span
          key={e}
          onClick={() => onReact(e)}
          className="cursor-pointer text-sm hover:scale-125 transition-transform active:scale-95 inline-block"
        >
          {e}
        </span>
      ))}
      <div className="w-px h-3 bg-white/10 mx-0.5" />
      <span
        onClick={onPin}
        title="Pin Message"
        className="cursor-pointer text-xs hover:scale-125 transition-transform active:scale-95 inline-block opacity-70 hover:opacity-100"
      >
        📌
      </span>
    </motion.div>
  );
}

export const OrbitMsgBubble = memo(function OrbitMsgBubble({
  msg,
  rawOut,
  isLatest,
  authUser,
  localReactions,
  t,
  avatarAnimal,
  avatarState,
  onReact,
  onPin,
  isGroupStart = true,
  isGroupEnd = true,
}) {
  const [hover, setHover] = useState(false);
  const mine = !!rawOut;

  const msgId = msg.id || msg._id || msg.idempotencyKey;
  const timeStr = msg.createdAt
    ? new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "00:00";
  const fromStr = mine
    ? "You"
    : msg.senderId?.username || msg.senderId?.fullName || "Member";

  const handleReact = useCallback(
    (emoji) => {
      onReact?.(msgId, emoji);
    },
    [msgId, onReact]
  );

  if (msg.isSystem) {
    return (
      <div className="flex items-center gap-3 my-4 text-[10px] font-mono font-bold tracking-widest uppercase opacity-40 w-full justify-center">
        <div className="w-12 h-px bg-current opacity-30" />
        <span>{msg.text}</span>
        <div className="w-12 h-px bg-current opacity-30" />
      </div>
    );
  }

  return (
    <AnimatedMessage id={msgId} isMine={mine} isNew={!!isLatest}>
      <div
        id={`msg-${msgId}`}
        className={`flex items-end gap-2 py-0.5 w-full box-border group ${mine ? 'justify-end' : 'justify-start'}`}
        style={{
          paddingLeft: "16px",
          paddingRight: "16px",
          marginBottom: isGroupEnd ? "8px" : "2px"
        }}
      >
        {/* Left Avatar for Received */}
        {!mine && (
          <div className="w-8 shrink-0 flex justify-center mb-1">
            {isGroupEnd ? (
              <PixelAvatar
                type={avatarAnimal || "dog"}
                state={avatarState || "idle"}
                size={32}
                style={{
                  imageRendering: "pixelated",
                  borderRadius: "50%",
                  border: "1px solid var(--color-base-300, rgba(255, 255, 255, 0.1))",
                  display: "block",
                  background: "var(--color-base-200, rgba(20,20,20,0.5))"
                }}
              />
            ) : (
              <div className="w-8" />
            )}
          </div>
        )}

        {/* Message Content */}
        <div 
          className={`flex flex-col relative max-w-[75%] md:max-w-[65%] ${mine ? 'items-end' : 'items-start'}`}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
        >
          {/* Sender Name (only on group start for received) */}
          {isGroupStart && !mine && (
            <div className="text-[11px] font-bold opacity-70 ml-1 mb-1">
              {fromStr}
            </div>
          )}

          <div className="relative">
            {/* Quick React Bar */}
            <AnimatePresence>
              {hover && (
                <QuickReactBar
                  onReact={handleReact}
                  onPin={() => onPin?.(msg)}
                  mine={mine}
                />
              )}
            </AnimatePresence>

            {/* The Bubble */}
            <div
              onDoubleClick={(e) => {
                e.preventDefault();
                handleReact("❤️");
              }}
              className={`relative px-4 py-2.5 text-[14.5px] leading-relaxed break-words shadow-sm cursor-pointer transition-transform active:scale-[0.98] ${
                mine 
                  ? 'bg-[var(--color-primary)] text-primary-content rounded-2xl rounded-br-sm' 
                  : 'bg-[var(--color-base-200)] text-base-content border border-[var(--color-base-300)] rounded-2xl rounded-bl-sm'
              }`}
              style={{
                background: mine ? "var(--color-primary, #00d4ff)" : "var(--color-base-200, #1e1e24)",
                color: mine ? "#fff" : "var(--text-primary, #F0EDE8)",
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
              }}
              title="Double click to heart"
            >
              {/* Attachment image */}
              {msg.image && (
                <SafeImage
                  src={msg.image}
                  alt="attachment"
                  style={{
                    maxWidth: "100%",
                    borderRadius: 8,
                    marginBottom: msg.text ? 8 : 0,
                    display: "block",
                  }}
                />
              )}

              {msg.text && (
                <span className="relative z-10 select-text">
                  {msg.text}
                </span>
              )}

              {/* Pending Spinner */}
              {msg.status === "pending" && (
                <span className="ml-2 text-xs opacity-50 animate-spin inline-block">
                  ◷
                </span>
              )}
            </div>
          </div>

          {/* Reactions Strip */}
          <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
            <ReactionStrip reactions={localReactions} onReact={handleReact} t={t} />
          </div>

          {/* Timestamp & Status (below bubble, fading in on hover or showing on group end) */}
          <div
            className={`flex items-center gap-1.5 mt-1 select-none pointer-events-none transition-opacity duration-200 ${mine ? 'flex-row-reverse' : 'flex-row'}`}
            style={{
              opacity: hover || isGroupEnd ? 0.65 : 0,
            }}
          >
            <span className="text-[10px] font-medium opacity-70">
              {timeStr}
            </span>

            {/* E2EE Indicator */}
            {isGroupEnd && (msg.v === 3 || msg.v === 4) && (
              <span title="End-to-End Encrypted" className="text-[10px] opacity-80">
                🔐
              </span>
            )}

            {/* Delivery Status (Sent only) */}
            {mine && isGroupEnd && (
              <MessageStatusRing
                status={msg.status || "delivered"}
              />
            )}
          </div>
        </div>
      </div>
    </AnimatedMessage>
  );
});

export default OrbitMsgBubble;
