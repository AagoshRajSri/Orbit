// =============================================================================
// ChatInput.jsx — Chat input box wired to avatar state hooks
//
// Automatically triggers onTyping while the user types, and onMessageSent
// when they submit. Designed as a drop-in for any chat layout.
//
// Props:
//   avatarHook   Return value of useAvatarState() or similar — needs onTyping + onMessageSent
//   onSend       (text: string) => void    Called with trimmed message text
//   placeholder  string                   default 'Type a message…'
//   disabled     boolean                  default false
//   selfType     'dog'|'cat'|'bunny'      Shows your own avatar left of input
//   selfState    string                   default 'idle'
//   selfSize     number                   default 28
//   className    string
//   style        React.CSSProperties
// =============================================================================

import React, { useState, useCallback, useRef, memo } from 'react';
import { PixelAvatar } from './PixelAvatar/PixelAvatar.jsx';

const ChatInput = memo(function ChatInput({
  avatarHook,
  onSend,
  placeholder = 'Type a message…',
  disabled    = false,
  selfType    = 'dog',
  selfState   = 'idle',
  selfSize    = 28,
  className,
  style,
}) {
  const [text, setText]     = useState('');
  const inputRef            = useRef(null);

  const handleChange = useCallback((e) => {
    setText(e.target.value);
    avatarHook?.onTyping();
  }, [avatarHook]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }, [text]); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    setText('');
    avatarHook?.onMessageSent();
    onSend?.(trimmed);
    inputRef.current?.focus();
  }, [text, disabled, avatarHook, onSend]);

  return (
    <div
      className={className}
      style={{
        display:       'flex',
        alignItems:    'center',
        gap:           8,
        padding:       '10px 12px',
        background:    '#161b28',
        borderTop:     '0.5px solid rgba(255,255,255,0.07)',
        ...style,
      }}
    >
      {/* Self avatar */}
      <PixelAvatar type={selfType} state={selfState} size={selfSize} />

      {/* Text input */}
      <input
        ref={inputRef}
        value={text}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        style={{
          flex:        1,
          background:  '#0d1018',
          border:      '0.5px solid rgba(255,255,255,0.10)',
          borderRadius: 8,
          padding:     '7px 12px',
          color:       '#e8eaf0',
          fontFamily:  'monospace',
          fontSize:    12,
          outline:     'none',
          lineHeight:  1.4,
          transition:  'border-color 0.15s',
        }}
        onFocus={e  => { e.target.style.borderColor = 'rgba(80,96,240,0.45)'; }}
        onBlur={e   => { e.target.style.borderColor = 'rgba(255,255,255,0.10)'; }}
      />

      {/* Send button */}
      <button
        onClick={submit}
        disabled={disabled || !text.trim()}
        aria-label="Send message"
        style={{
          width:        32,
          height:       32,
          flexShrink:   0,
          background:   text.trim() ? '#5060f0' : '#1a1e2e',
          border:       'none',
          borderRadius: 8,
          cursor:       text.trim() ? 'pointer' : 'default',
          display:      'flex',
          alignItems:   'center',
          justifyContent: 'center',
          transition:   'background 0.15s, transform 0.1s',
          color:        '#fff',
          fontSize:     13,
        }}
        onMouseDown={e => { if (text.trim()) e.currentTarget.style.transform = 'scale(0.92)'; }}
        onMouseUp={e   => { e.currentTarget.style.transform = 'scale(1)'; }}
      >
        ▶
      </button>
    </div>
  );
});

export { ChatInput };
export default ChatInput;
