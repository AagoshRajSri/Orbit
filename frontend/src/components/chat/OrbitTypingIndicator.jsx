// =============================================================================
// OrbitTypingIndicator.jsx — Per-theme animated typing dots / blocks
// Ported from orbit-messaging.html .typing-row styles.
// =============================================================================
import { memo } from "react";
import { PixelAvatar } from "../avatar/PixelAvatar/PixelAvatar.jsx";
import { useDevicePerformance } from "../hooks/useDevicePerformance";

export const OrbitTypingIndicator = memo(function OrbitTypingIndicator({
  t,
  peerAnimal,
  peerAvatarState,
  typingUsers, // array of usernames for nexus; or just truthy for DM
}) {
  const { isLowEnd } = useDevicePerformance();
  const isCyber  = t.id === "cyberpunk" || t.id === "gamer";
  const isPastel = t.id === "pastel";
  const label = Array.isArray(typingUsers) && typingUsers.length > 0
    ? `${typingUsers.slice(0, 2).join(", ")}${typingUsers.length > 2 ? " +" + (typingUsers.length - 2) : ""} typing…`
    : "typing…";

  return (
    <div style={{
      display: "flex", alignItems: "flex-end", gap: 8,
      animation: isLowEnd ? "none" : "fadeUpMsg 0.3s ease",
    }}>
      <PixelAvatar
        type={peerAnimal || "dog"}
        state={isLowEnd ? "idle" : (peerAvatarState || "typing")}
        size={28}
        style={{
          imageRendering: "pixelated",
          borderRadius: isPastel ? "50%" : "8px",
          border: `1.5px solid ${t["--border"]}`,
          display: "block", flexShrink: 0,
        }}
      />
      <div>
        <div style={{
          padding: "10px 16px",
          background: t["--recv-bg"],
          border: `1px solid ${isCyber ? "rgba(0,212,255,0.3)" : "rgba(255,255,255,0.07)"}`,
          borderRadius: isCyber ? "2px" : isPastel ? "28px" : t["--radius"],
          borderBottomLeftRadius: isCyber ? "2px" : isPastel ? "8px" : "5px",
          display: "flex", gap: 5, alignItems: "center",
          animation: isLowEnd ? "none" : "typingPulse 2s infinite ease-in-out",
        }}>
          {isCyber ? (
            // Cyber: blinking blocks instead of dots
            [0, 1, 2].map(i => (
              <div key={i} style={{
                width: 7, height: 7,
                background: t["--acc"],
                borderRadius: 0,
                animation: isLowEnd ? "none" : `cyberBlink 1.4s infinite`,
                animationDelay: `${i * 0.2}s`,
                opacity: isLowEnd ? 0.7 : 1,
              }} />
            ))
          ) : (
            [0, 1, 2].map(i => (
              <div key={i} style={{
                width: 7, height: 7,
                background: t["--acc"],
                borderRadius: "50%",
                animation: isLowEnd ? "none" : (isPastel ? `pastelDot 1.4s infinite` : `typingBounce 1.4s infinite`),
                animationDelay: `${i * 0.2}s`,
                opacity: isLowEnd ? 0.7 : 1,
              }} />
            ))
          )}
        </div>
        <div style={{
          fontSize: 10, color: t["--text2"], marginTop: 3, marginLeft: 4,
          fontFamily: t.font, opacity: 0.65,
        }}>
          {label}
        </div>
      </div>
    </div>
  );
});
