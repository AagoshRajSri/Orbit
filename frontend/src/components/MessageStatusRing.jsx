import { useEffect, useState, memo } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS & CONFIG
// ─────────────────────────────────────────────────────────────────────────────

export const STATUS = {
  SENDING: "sending",
  DELIVERED: "delivered",
  READ: "read",
  FAILED: "failed",
};

const STATUS_CONFIG = {
  [STATUS.SENDING]: {
    label: "Sending",
    tooltip: "Sending…",
    sublabel: "Waiting for delivery…",
    ringColor: "#888780",
    dotColor: "#B4B2A9",
    bgGlow: "radial-gradient(ellipse at 100% 100%, rgba(180,180,210,0.08) 0%, transparent 80%)",
    fillFraction: 0,
    dotR: 2.2,
    spin: true,
  },
  [STATUS.DELIVERED]: {
    label: "Delivered",
    tooltip: "Delivered",
    sublabel: "Waiting to be read",
    ringColor: "#378ADD",
    dotColor: "#85B7EB",
    bgGlow: "radial-gradient(ellipse at 100% 100%, rgba(80,120,255,0.06) 0%, transparent 80%)",
    fillFraction: 1,
    dotR: 2.8,
    spin: false,
  },
  [STATUS.READ]: {
    label: "Read",
    tooltip: "Seen",
    sublabel: "Seen by recipient",
    ringColor: "#1D9E75",
    dotColor: "#5DCAA5",
    bgGlow: "radial-gradient(ellipse at 100% 100%, rgba(16,217,138,0.08) 0%, transparent 80%)",
    fillFraction: 1,
    dotR: 3.5,
    spin: false,
  },
  [STATUS.FAILED]: {
    label: "Failed",
    tooltip: "Failed — tap to retry",
    sublabel: "Message not sent",
    ringColor: "#E24B4A",
    dotColor: "#F09595",
    bgGlow: "radial-gradient(ellipse at 100% 100%, rgba(248,83,83,0.1) 0%, transparent 80%)",
    fillFraction: 0.3,
    dotR: 2.5,
    spin: false,
  },
};

const RADIUS = 7; // Slightly smaller to fit chat bubbles better
const CIRC = 2 * Math.PI * RADIUS;
const SIZE = 20;

// ─── Tooltip ────────────────────────────────────────────────────────────────

function Tooltip({ text, visible }) {
  return (
    <div
      style={{
        position: "absolute",
        top: "calc(100% + 8px)",
        left: "50%",
        transform: `translateX(-50%) translateY(${visible ? 0 : -4}px)`,
        background: "rgba(10,10,15,0.95)",
        backdropFilter: "blur(4px)",
        color: "rgba(255,255,255,0.95)",
        fontSize: 10,
        fontFamily: "inherit",
        fontWeight: 600,
        padding: "4px 10px",
        borderRadius: 6,
        whiteSpace: "nowrap",
        pointerEvents: "none",
        opacity: visible ? 1 : 0,
        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        zIndex: 100,
        letterSpacing: "0.02em",
        boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
        border: "1px solid rgba(255,255,255,0.1)"
      }}
    >
      {text}
      {/* Arrow pointing up */}
      <div
        style={{
          position: "absolute",
          bottom: "100%",
          left: "50%",
          transform: "translateX(-50%)",
          width: 0, height: 0,
          borderLeft: "5px solid transparent",
          borderRight: "5px solid transparent",
          borderBottom: "5px solid rgba(10,10,15,0.95)",
        }}
      />
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

const MessageStatusRing = ({ status = STATUS.DELIVERED, colorOverride }) => {
  const [hovered, setHovered] = useState(false);
  
  // Map internal app statuses if necessary
  let activeStatus = status;
  if (status === 'sent') activeStatus = STATUS.DELIVERED;
  
  const config = STATUS_CONFIG[activeStatus] || STATUS_CONFIG[STATUS.DELIVERED];
  const dashOffset = CIRC * (1 - config.fillFraction);
  const ringColor = colorOverride || config.ringColor;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ 
        position: "relative", 
        display: "inline-flex", 
        alignItems: "center", 
        justifyContent: "center", 
        cursor: "default",
        width: SIZE,
        height: SIZE
      }}
    >
      <Tooltip text={config.tooltip} visible={hovered} />
      
      <svg
        width={SIZE}
        height={SIZE}
        viewBox="0 0 24 24"
        fill="none"
        style={{ 
          display: "block", 
          overflow: "visible",
          animation: config.spin ? "statusSpin 2s linear infinite" : "none"
        }}
      >
        <defs>
          <filter id="dotGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Track */}
        <circle
          cx="12" cy="12" r={RADIUS}
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="1.5"
          fill="none"
        />

        {/* Animated arc fill */}
        <circle
          cx="12" cy="12" r={RADIUS}
          stroke={ringColor}
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={CIRC}
          strokeDashoffset={dashOffset}
          transform="rotate(-90 12 12)"
          style={{
            transition: "stroke-dashoffset 0.6s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.4s ease",
          }}
        />

        {/* Center dot */}
        <circle
          cx="12" cy="12"
          r={config.dotR}
          fill={config.dotColor}
          filter="url(#dotGlow)"
          style={{
            transition: "fill 0.4s ease, r 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
          }}
        />

        {/* Shine */}
        <circle cx="11.2" cy="11.2" r="0.8" fill="rgba(255,255,255,0.5)" />
      </svg>

      <style>{`
        @keyframes statusSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default memo(MessageStatusRing);
