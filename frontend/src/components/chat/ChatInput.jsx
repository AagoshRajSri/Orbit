import React, { useState, useCallback, useRef, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Smile, 
  Image as ImageIcon, 
  Paperclip, 
  Mic, 
  Send,
  ChevronRight
} from 'lucide-react';
import { PixelAvatar } from '../avatar/PixelAvatar/PixelAvatar.jsx';

const ChatInput = memo(function ChatInput({
  avatarHook,
  onSend,
  placeholder = 'Transmit via Secure Ratchet...',
  disabled    = false,
  selfType    = 'dog',
  selfState   = 'idle',
  selfSize    = 32,
  className,
  style,
}) {
  const [text, setText]     = useState('');
  const [isFocused, setIsFocused] = useState(false);
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
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        padding: '12px 16px',
        background: 'var(--chat-glass-bg, rgba(22, 27, 40, 0.8))',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderTop: '1px solid var(--chat-border, rgba(255,255,255,0.08))',
        position: 'relative',
        zIndex: 10,
        ...style,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Action Button (Plus) */}
        <motion.button
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--chat-muted, rgba(255,255,255,0.5))',
            cursor: 'pointer',
            padding: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Plus size={20} strokeWidth={2.5} />
        </motion.button>

        {/* Self Avatar Container */}
        <motion.div 
          animate={{ scale: isFocused ? 1.1 : 1 }}
          style={{ flexShrink: 0, cursor: 'pointer' }}
        >
          <PixelAvatar type={selfType} state={selfState} size={selfSize} />
        </motion.div>

        {/* Input Container */}
        <div style={{ 
          flex: 1, 
          position: 'relative', 
          display: 'flex', 
          alignItems: 'center'
        }}>
          <input
            ref={inputRef}
            value={text}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              padding: '10px 0',
              color: 'var(--chat-text, #fff)',
              fontFamily: 'inherit',
              fontSize: '14px',
              outline: 'none',
              letterSpacing: '0.01em'
            }}
          />
          
          <AnimatePresence>
            {!text && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.4 }}
                exit={{ opacity: 0 }}
                style={{
                  position: 'absolute',
                  left: 0,
                  pointerEvents: 'none',
                  fontSize: '14px',
                  color: 'var(--chat-text, #fff)',
                }}
              >
                {/* Custom placeholder logic if needed */}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Tools Cluster */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {[
            { Icon: Smile, label: 'Emoji' },
            { Icon: ImageIcon, label: 'Image' },
            { Icon: Paperclip, label: 'Attach' },
            { Icon: Mic, label: 'Voice' }
          ].map(({ Icon, label }, i) => (
            <motion.button
              key={label}
              whileHover={{ scale: 1.15, color: 'var(--chat-primary, #5060f0)' }}
              whileTap={{ scale: 0.9 }}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0, transition: { delay: i * 0.05 } }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--chat-muted, rgba(255,255,255,0.4))',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'color 0.2s'
              }}
              title={label}
            >
              <Icon size={19} strokeWidth={2} />
            </motion.button>
          ))}
        </div>

        {/* Send Button(s) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <motion.button
            onClick={submit}
            disabled={disabled || !text.trim()}
            whileHover={text.trim() ? { scale: 1.05, boxShadow: '0 0 15px var(--chat-primary, #5060f0)' } : {}}
            whileTap={text.trim() ? { scale: 0.95 } : {}}
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: text.trim() ? 'var(--chat-primary, #5060f0)' : 'rgba(255,255,255,0.05)',
              border: 'none',
              color: text.trim() ? '#fff' : 'rgba(255,255,255,0.2)',
              cursor: text.trim() ? 'pointer' : 'default',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.3s, color 0.3s',
              boxShadow: text.trim() ? '0 4px 12px rgba(80,96,240,0.3)' : 'none'
            }}
          >
            <Send size={16} fill={text.trim() ? "currentColor" : "none"} />
          </motion.button>

          {/* Secondary Action/Send as shown in image */}
          <motion.button
            whileHover={{ scale: 1.05, background: 'rgba(255,255,255,0.1)' }}
            whileTap={{ scale: 0.95 }}
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.05)',
              border: 'none',
              color: 'var(--chat-muted, rgba(255,255,255,0.4))',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <ChevronRight size={18} />
          </motion.button>
        </div>
      </div>

      {/* Focus Glow Indicator */}
      <AnimatePresence>
        {isFocused && (
          <motion.div
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            exit={{ scaleX: 0, opacity: 0 }}
            style={{
              height: '2px',
              width: '100%',
              background: 'linear-gradient(90deg, transparent, var(--chat-primary, #5060f0), transparent)',
              position: 'absolute',
              bottom: 0,
              left: 0,
              originX: 0.5
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
});

export { ChatInput };
export default ChatInput;
