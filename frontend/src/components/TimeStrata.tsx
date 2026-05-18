import { memo, useState } from "react";

interface TimeStrataProps {
  timestamp: number;
}

export const TimeStrata = memo(function TimeStrata({ timestamp }: TimeStrataProps) {
  const [hover, setHover] = useState(false);
  const timeString = new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  const dateString = new Date(timestamp).toLocaleDateString([], {
    month: "short",
    day: "numeric",
  });

  return (
    <div
      className="relative flex flex-col items-center justify-center transition-all duration-300 w-full"
      style={{
        margin: "40px 0",
        opacity: hover ? 0.7 : 0.4,
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {/* 1px horizontal rule at 4% opacity */}
      <div
        className="w-full"
        style={{
          height: "1px",
          background: "var(--text-primary, #F0EDE8)",
          opacity: 0.04,
        }}
      />

      {/* Centered timestamp in dust scale typography, no background pill */}
      <span
        className="absolute px-4 text-[9px] font-mono font-bold uppercase tracking-[0.25em] pointer-events-none"
        style={{
          color: "var(--text-secondary, #e0e0e0)",
          backgroundColor: "transparent",
        }}
      >
        {dateString} • {timeString}
      </span>
    </div>
  );
});

export default TimeStrata;
