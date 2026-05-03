// =============================================================================
// useAvatarState.js — Avatar state machine hook
//
// Manages transitions between: idle → typing → talking → happy → excited → sleeping
// Auto-reverts ephemeral states (happy, excited, talking) back to idle.
// Optionally puts avatar to sleep after a configurable inactivity timeout.
//
// Usage:
//   const av = useAvatarState('idle', { sleepAfter: 20_000 })
//
//   // Wire to your chat input:
//   <input onKeyDown={av.onTyping} />
//   // Wire to send:
//   onSend={() => { av.onMessageSent(); sendToServer(text); }}
//   // Wire to incoming message:
//   socket.on('message', () => av.onMessageReceived())
//   // Read current state:
//   <PixelAvatar state={av.state} />
// =============================================================================

import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * @param {'idle'|'typing'|'talking'|'happy'|'excited'|'sleeping'} initial
 * @param {{
 *   typingDebounce?:  number,  // ms after last keystroke → idle  (default 1500)
 *   happyDuration?:   number,  // ms to hold 'happy' → idle       (default 2200)
 *   talkingDuration?: number,  // ms to hold 'talking' → idle     (default 2000)
 *   excitedDuration?: number,  // ms to hold 'excited' → idle     (default 2500)
 *   sleepAfter?:      number,  // ms inactivity → sleeping (0=off) (default 0)
 * }} options
 */
export function useAvatarState(initial = 'idle', options = {}) {
  const {
    typingDebounce  = 1500,
    happyDuration   = 2200,
    talkingDuration = 2000,
    excitedDuration = 2500,
    sleepAfter      = 0,
  } = options;

  const [state, _setState] = useState(initial);

  // All timer refs
  const typingT  = useRef(null);
  const revertT  = useRef(null);
  const sleepT   = useRef(null);

  // Whether we're mid-ephemeral (block typing state from overriding)
  const locked   = useRef(false);

  const _clearAll = () => {
    clearTimeout(typingT.current);
    clearTimeout(revertT.current);
    clearTimeout(sleepT.current);
  };

  const _rearmSleep = useCallback(() => {
    clearTimeout(sleepT.current);
    if (sleepAfter > 0) {
      sleepT.current = setTimeout(() => _setState('sleeping'), sleepAfter);
    }
  }, [sleepAfter]);

  // ── Public API ──────────────────────────────────────────────────────────

  /** Permanently force any state (bypasses all locks/timers) */
  const setState = useCallback((s) => {
    _clearAll();
    locked.current = false;
    _setState(s);
    _rearmSleep();
  }, [_rearmSleep]);

  /** Call on every keydown / onChange in the chat input */
  const onTyping = useCallback(() => {
    if (locked.current) return;
    clearTimeout(typingT.current);
    clearTimeout(sleepT.current);
    _setState('typing');
    typingT.current = setTimeout(() => {
      _setState('idle');
      _rearmSleep();
    }, typingDebounce);
  }, [typingDebounce, _rearmSleep]);

  /** Call when the local user sends a message */
  const onMessageSent = useCallback(() => {
    _clearAll();
    locked.current = true;
    _setState('happy');
    revertT.current = setTimeout(() => {
      locked.current = false;
      _setState('idle');
      _rearmSleep();
    }, happyDuration);
  }, [happyDuration, _rearmSleep]);

  /** Call when a message arrives from the remote peer */
  const onMessageReceived = useCallback(() => {
    _clearAll();
    locked.current = true;
    _setState('talking');
    revertT.current = setTimeout(() => {
      locked.current = false;
      _setState('idle');
      _rearmSleep();
    }, talkingDuration);
  }, [talkingDuration, _rearmSleep]);

  /** Call on any exciting event (reaction, mention, etc.) */
  const onExcited = useCallback(() => {
    _clearAll();
    locked.current = true;
    _setState('excited');
    revertT.current = setTimeout(() => {
      locked.current = false;
      _setState('idle');
      _rearmSleep();
    }, excitedDuration);
  }, [excitedDuration, _rearmSleep]);

  /** Soft signal: remote peer started typing (shows 'talking' without locking) */
  const onPeerTyping = useCallback(() => {
    if (locked.current) return;
    _setState('talking');
  }, []);

  /** Soft signal: remote peer stopped typing without sending */
  const onPeerIdle = useCallback(() => {
    if (locked.current) return;
    _setState('idle');
    _rearmSleep();
  }, [_rearmSleep]);

  // Arm initial sleep timer
  useEffect(() => { _rearmSleep(); }, [_rearmSleep]);

  // Cleanup on unmount
  useEffect(() => () => _clearAll(), []);

  return {
    state,
    setState,
    onTyping,
    onMessageSent,
    onMessageReceived,
    onExcited,
    onPeerTyping,
    onPeerIdle,
  };
}
