// =============================================================================
// PixelAvatarBadge.jsx — Avatar + presence dot + optional state label
//
// Drop-in replacement for any circular avatar image in a chat header or
// contact list. Shows the animated avatar with a coloured online/state dot.
//
// Props:
//   type        'dog'|'cat'|'bunny'         default 'dog'
//   state       avatar state string         default 'idle'
//   size        number (px)                 default 40
//   speed       number                      default 1
//   showDot     boolean                     default true
//   showLabel   boolean                     default false
//   online      boolean                     default true  (green dot vs gray)
//   className   string
//   style       React.CSSProperties
//   onClick     () => void
// =============================================================================

import React, { memo } from 'react';
import { PixelAvatar } from './PixelAvatar.jsx';

// State → dot color
const STATE_DOT_COLOR = {
  idle:     '#22c55e',  // green
  typing:   '#6366f1',  // indigo
  talking:  '#06b6d4',  // cyan
  happy:    '#ec4899',  // pink
  excited:  '#f59e0b',  // amber
  sleeping: '#64748b',  // slate (grey)
};

// State → short human label
const STATE_LABEL = {
  idle:     'online',
  typing:   'typing…',
  talking:  'talking',
  happy:    'happy',
  excited:  'excited!',
  sleeping: 'away',
};

const PixelAvatarBadge = memo(function PixelAvatarBadge({
  type      = 'dog',
  state     = 'idle',
  size      = 40,
  speed     = 1,
  showDot   = true,
  showLabel = false,
  online    = true,
  className,
  style,
  onClick,
}) {
  const dotSize  = Math.max(6, Math.round(size * 0.22));
  const dotColor = online ? (STATE_DOT_COLOR[state] ?? '#22c55e') : '#64748b';

  return (
    <div
      className={className}
      style={{
        display:    'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap:        4,
        cursor:     onClick ? 'pointer' : undefined,
        ...style,
      }}
      onClick={onClick}
    >
      {/* Avatar + dot wrapper */}
      <div style={{ position: 'relative', display: 'inline-flex', lineHeight: 0 }}>
        <PixelAvatar type={type} state={state} size={size} speed={speed} />

        {showDot && (
          <span
            aria-label={online ? state : 'offline'}
            style={{
              position:     'absolute',
              bottom:       Math.round(size * 0.02),
              right:        Math.round(size * 0.02),
              width:        dotSize,
              height:       dotSize,
              borderRadius: '50%',
              background:   dotColor,
              border:       `${Math.max(1, Math.round(dotSize * 0.3))}px solid #0d1018`,
              transition:   'background 0.4s ease',
            }}
          />
        )}
      </div>

      {/* Optional state label */}
      {showLabel && (
        <span
          style={{
            fontSize:      Math.max(8, Math.round(size * 0.22)),
            fontFamily:    'monospace',
            fontWeight:    700,
            letterSpacing: '0.06em',
            color:         dotColor,
            textTransform: 'uppercase',
            lineHeight:    1,
          }}
        >
          {STATE_LABEL[state] ?? state}
        </span>
      )}
    </div>
  );
});

export { PixelAvatarBadge };
export default PixelAvatarBadge;
