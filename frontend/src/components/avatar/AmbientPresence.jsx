/**
 * AmbientPresence Component
 * ────────────────────────────────────────────────
 * Displays ambient presence indicators and online status
 * Shows connected users, activity status, and real-time presence
 */

import React, { useEffect, useState } from "react";
import { useAuthStore } from "../../store/useAuthStore";
import { useChatStore } from "../../store/useChatStore";

/**
 * AmbientPresence Component - Displays online users and presence status
 */
export default function AmbientPresence() {
  const authUser = useAuthStore((state) => state.authUser);
  const onlineUsers = useAuthStore((state) => state.onlineUsers);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Auto-hide after 5 seconds if user moves mouse
    let hideTimer;
    const handleMouseMove = () => {
      setIsVisible(true);
      clearTimeout(hideTimer);
      hideTimer = setTimeout(() => setIsVisible(false), 5000);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      clearTimeout(hideTimer);
    };
  }, []);

  if (!authUser || !isVisible) {
    return null;
  }

  const onlineCount = onlineUsers?.length || 0;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "20px",
        right: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        zIndex: 1000,
        animation: "slideInUp 300ms cubic-bezier(0.23, 1, 0.32, 1)",
      }}
    >
      {/* Online Status */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "12px 16px",
          backgroundColor: "var(--bg-elevation-2)",
          border: "1px solid var(--border-default)",
          borderRadius: "12px",
          backdropFilter: "blur(10px)",
          boxShadow: "var(--card-shadow)",
        }}
      >
        <div
          style={{
            width: "10px",
            height: "10px",
            borderRadius: "50%",
            backgroundColor: "var(--text-success)",
            boxShadow: "0 0 8px var(--text-success)",
            animation: "pulse 2s ease-in-out infinite",
          }}
        />
        <span style={{ color: "var(--text-secondary)", fontSize: "13px" }}>
          You're Online
        </span>
      </div>

      {/* Online Count */}
      {onlineCount > 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "12px 16px",
            backgroundColor: "var(--bg-elevation-2)",
            border: "1px solid var(--border-default)",
            borderRadius: "12px",
            backdropFilter: "blur(10px)",
            boxShadow: "var(--card-shadow)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "24px",
              height: "24px",
              borderRadius: "50%",
              backgroundColor: "rgba(0, 212, 255, 0.15)",
              border: "1px solid rgba(0, 212, 255, 0.3)",
              fontSize: "12px",
              color: "var(--accent-primary)",
              fontWeight: 600,
            }}
          >
            {onlineCount}
          </div>
          <div>
            <div
              style={{
                color: "var(--text-primary)",
                fontSize: "13px",
                fontWeight: 500,
              }}
            >
              {onlineCount} {onlineCount === 1 ? "User" : "Users"} Online
            </div>
            <div style={{ color: "var(--text-tertiary)", fontSize: "11px" }}>
              Connected to network
            </div>
          </div>
        </div>
      )}

      {/* User Avatar Stack (top 3) */}
      {onlineUsers && onlineUsers.length > 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "12px 16px",
            backgroundColor: "var(--bg-elevation-2)",
            border: "1px solid var(--border-default)",
            borderRadius: "12px",
            backdropFilter: "blur(10px)",
            boxShadow: "var(--card-shadow)",
          }}
        >
          <span style={{ color: "var(--text-tertiary)", fontSize: "11px" }}>
            Active:
          </span>
          <div style={{ display: "flex", marginLeft: "4px" }}>
            {onlineUsers.slice(0, 3).map((user, idx) => (
              <div
                key={user._id || idx}
                style={{
                  width: "24px",
                  height: "24px",
                  borderRadius: "50%",
                  backgroundColor: `hsl(${idx * 120}, 70%, 50%)`,
                  border: "2px solid var(--bg-elevation-2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginLeft: idx > 0 ? "-8px" : 0,
                  zIndex: 10 - idx,
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "#ffffff",
                  boxShadow: `0 0 8px rgba(0, 212, 255, ${0.3 - idx * 0.1})`,
                  title: user.username || `User ${idx}`,
                }}
              >
                {(user.username || `U${idx}`).charAt(0).toUpperCase()}
              </div>
            ))}
          </div>
          {onlineCount > 3 && (
            <span
              style={{
                color: "var(--text-tertiary)",
                fontSize: "11px",
                marginLeft: "4px",
              }}
            >
              +{onlineCount - 3}
            </span>
          )}
        </div>
      )}

      <style>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
}
