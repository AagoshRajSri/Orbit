/**
 * CentralPulse.tsx
 * ──────────────────────────────────────────────────────────────────────────────
 * Represents the current user at the center of the orbital navigation system.
 * Includes a slow-rotating decorative ring reacting to incoming notifications,
 * and launches settings on click.
 */

import { memo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { useNexusStore } from "../store/useNexusStore";
import { UserAura } from "../orbit/UserAura";
import { prefersReducedMotion } from "../orbit/MotionSystem";

interface CentralPulseProps {
  className?: string;
  style?: React.CSSProperties;
}

export const CentralPulse = memo(function CentralPulse({
  className = "",
  style = {},
}: CentralPulseProps) {
  const navigate = useNavigate();
  const authUser = useAuthStore((s) => s.authUser);

  // Read unread activity from stores to dynamically set opacity
  const dmUnreads = useChatStore((s) =>
    s.users.reduce((sum, u) => sum + (Number(u.unreadCount) || 0), 0)
  );
  const nexusUnreads = useNexusStore((s) =>
    Object.values(s.nexusUnread).reduce((sum, val) => sum + (Number(val) || 0), 0)
  );
  const hasIncomingActivity = (dmUnreads + nexusUnreads) > 0;

  const avatarUrl = authUser?.profilePic || "/default-avatar.png";
  const userName = authUser?.username || "Self";

  return (
    <div
      className={`relative flex items-center justify-center cursor-pointer ${className}`}
      style={{
        width: 80,
        height: 80,
        ...style,
      }}
      onClick={() => navigate("/settings")}
      role="button"
      tabIndex={0}
      aria-label="Your profile"
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          navigate("/settings");
        }
      }}
    >
      {/* Slow rotating ring at 56px diameter */}
      <motion.div
        animate={prefersReducedMotion ? {} : { rotate: 360 }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute rounded-full border border-dashed pointer-events-none"
        style={{
          width: 56,
          height: 56,
          borderColor: "var(--accent-primary, #00d4ff)",
          opacity: hasIncomingActivity ? 0.6 : 0.3,
          boxShadow: hasIncomingActivity ? "0 0 10px rgba(0, 212, 255, 0.2)" : "none",
          transition: "opacity 0.3s ease, box-shadow 0.3s ease",
        }}
      />

      {/* Ambient breathing UserAura of current user */}
      <UserAura state="online" size={40} userName={userName}>
        <img
          src={avatarUrl}
          alt={userName}
          className="rounded-full object-cover border border-white/10"
          style={{
            width: 40,
            height: 40,
          }}
        />
      </UserAura>
    </div>
  );
});

export default CentralPulse;
