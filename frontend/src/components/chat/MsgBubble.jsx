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

function QuickReactBar({ onReact, onPin }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.95 }}
      transition={{ duration: 0.12 }}
      className="absolute -top-10 right-4 px-3 py-1 flex items-center gap-2 rounded-full backdrop-blur-xl z-50 pointer-events-auto"
      style={{
        background: "rgba(8, 9, 16, 0.75)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
      }}
    >
      {REACT_SET.slice(0, 6).map((e) => (
        <span
          key={e}
          onClick={() => onReact(e)}
          className="cursor-pointer text-base hover:scale-130 transition-transform active:scale-95 inline-block"
        >
          {e}
        </span>
      ))}
      <div className="w-px h-4 bg-white/10 mx-1" />
      <span
        onClick={onPin}
        title="Pin Message"
        className="cursor-pointer text-sm hover:scale-125 transition-transform active:scale-95 inline-block opacity-70 hover:opacity-100"
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
  isGroupStart = true, // Defaults to true if group calculations are not passed down
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
      <div className="flex items-center gap-3 my-4 text-[10px] font-mono font-bold tracking-widest uppercase opacity-40 w-full">
        <div className="flex-1 h-px bg-white/10" />
        <span>{msg.text}</span>
        <div className="flex-1 h-px bg-white/10" />
      </div>
    );
  }

  return (
    <AnimatedMessage id={msgId} isMine={mine} isNew={!!isLatest}>
      <div
        id={`msg-${msgId}`}
        className="flex items-start gap-4 py-1.5 w-full box-border group message-surface-item"
        style={{
          // Atmospheric background highlight on hover, no box frame
          background: hover ? "rgba(240, 237, 232, 0.015)" : "transparent",
          transition: "background 0.2s ease",
          paddingLeft: "16px",
          paddingRight: "16px",
        }}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        {/* Left margin identity space (32px width) */}
        <div className="w-8 shrink-0 flex justify-center">
          {isGroupStart && !mine ? (
            <PixelAvatar
              type={avatarAnimal || "dog"}
              state={avatarState || "idle"}
              size={32}
              style={{
                imageRendering: "pixelated",
                borderRadius: "50%",
                border: "1.5px solid rgba(240, 237, 232, 0.1)",
                display: "block",
              }}
            />
          ) : (
            <div className="w-8" />
          )}
        </div>

        {/* Message Content column */}
        <div className="flex flex-col flex-1 min-w-0 relative">
          {/* Action strip overlay */}
          <AnimatePresence>
            {hover && (
              <QuickReactBar
                onReact={handleReact}
                onPin={() => onPin?.(msg)}
              />
            )}
          </AnimatePresence>

          {/* Group start attribution */}
          {isGroupStart && !mine && (
            <div className="text-xs font-black tracking-wide text-amber-500/80 mb-1">
              {fromStr}
            </div>
          )}

          {/* Transparent body text directly on surface */}
          <div
            className="text-[14px] font-sans leading-relaxed tracking-wide text-left relative break-words"
            style={{
              color: "var(--text-primary, #F0EDE8)",
              maxWidth: "68ch", // Readability max-width
            }}
          >
            {/* Attachment image */}
            {msg.image && (
              <SafeImage
                src={msg.image}
                alt="attachment"
                style={{
                  maxWidth: "100%",
                  borderRadius: 12,
                  marginBottom: msg.text ? 8 : 0,
                  display: "block",
                  border: "1px solid rgba(240, 237, 232, 0.08)",
                }}
              />
            )}

            {msg.text && (
              <span className="relative z-10 selection:bg-white/20 select-text">
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

          {/* ResonanceLayer Metadata (Only visible on hover or if end of run) */}
          <div
            className="flex items-center gap-2 mt-1 select-none pointer-events-none transition-opacity duration-[160ms] ease-in-out"
            style={{
              opacity: hover || isGroupEnd ? 0.6 : 0, // opacity 0.0 at rest, 0.6 on hover
            }}
          >
            <span className="text-[9px] font-mono font-bold tracking-wider opacity-60">
              {timeStr}
            </span>

            {/* End-to-End Encryption Indicator (lock icon at group start/end) */}
            {isGroupEnd && (msg.v === 3 || msg.v === 4) && (
              <span title="End-to-End Encrypted" className="text-[9px] opacity-70">
                🔐
              </span>
            )}

            {/* Delivery status indicator */}
            {mine && isGroupEnd && (
              <MessageStatusRing
                status={msg.status || "delivered"}
                colorOverride={
                  msg.status === "read"
                    ? "var(--accent-primary, #00d4ff)"
                    : msg.status === "failed"
                    ? "#FF5252"
                    : undefined
                }
              />
            )}
          </div>

          {/* Reactions */}
          <ReactionStrip reactions={localReactions} onReact={handleReact} t={t} />
        </div>
      </div>
    </AnimatedMessage>
  );
});

export default OrbitMsgBubble;
