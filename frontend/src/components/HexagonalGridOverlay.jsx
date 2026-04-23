import { memo } from "react";

const HexagonalGridOverlay = memo(() => {
  const hexSize = 40;
  const hexWidth = hexSize * 2;
  const hexHeight = (hexSize * Math.sqrt(3)) / 2;

  // We define the path for a single hexagon centered at (0,0) offset
  const hexagonPath = `
    M ${hexSize},0
    L ${hexSize * 1.5},${hexHeight / 2}
    L ${hexSize * 1.5},${hexHeight * 1.5}
    L ${hexSize},${hexHeight * 2}
    L ${hexSize * 0.5},${hexHeight * 1.5}
    L ${hexSize * 0.5},${hexHeight / 2}
    Z
  `;

  return (
    <svg
      className="fixed inset-0 pointer-events-none w-full h-full"
      style={{
        zIndex: 2,
        opacity: 0.15,
        mixBlendMode: "screen",
      }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="hexGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#A855F7" stopOpacity="0.4" />
          <stop offset="50%" stopColor="#3B82F6" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#A855F7" stopOpacity="0.4" />
        </linearGradient>

        <filter id="hexGlow">
          <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Define a repeating pattern of hexagons */}
        <pattern
          id="hexPattern"
          width={hexWidth * 1.5}
          height={hexHeight * 2}
          patternUnits="userSpaceOnUse"
        >
          {/* First hexagon */}
          <g filter="url(#hexGlow)">
            <path
              d={hexagonPath}
              stroke="url(#hexGradient)"
              strokeWidth="1"
              fill="none"
            />
          </g>
          {/* Interlocking offset hexagon */}
          <g
            filter="url(#hexGlow)"
            transform={`translate(${hexWidth * 0.75}, ${hexHeight})`}
          >
            <path
              d={hexagonPath}
              stroke="url(#hexGradient)"
              strokeWidth="1"
              fill="none"
            />
          </g>
        </pattern>
      </defs>

      {/* A single rect that fills the screen with the interlocking pattern */}
      <rect
        width="100%"
        height="100%"
        fill="url(#hexPattern)"
        className="animate-[pulse_4s_cubic-bezier(0.4,0,0.6,1)_infinite]"
      />
    </svg>
  );
});

HexagonalGridOverlay.displayName = "HexagonalGridOverlay";

export default HexagonalGridOverlay;
