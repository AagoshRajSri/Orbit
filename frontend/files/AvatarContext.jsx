// =============================================================================
// AvatarContext.jsx — Optional global registry for multi-avatar chat apps
//
// Provides a shared store of avatar states keyed by userId, so any component
// in the tree can read or update any avatar without prop-drilling.
//
// Usage:
//   1. Wrap your app (or chat section) with <AvatarProvider>
//   2. In any component: const { getAvatarState, dispatch } = useAvatarRegistry()
//   3. Dispatch events:
//        dispatch({ userId: 'alice', event: 'typing' })
//        dispatch({ userId: 'alice', event: 'sent' })
//        dispatch({ userId: 'alice', event: 'received' })
//        dispatch({ userId: 'alice', event: 'excited' })
//        dispatch({ userId: 'alice', event: 'sleep' })
//        dispatch({ userId: 'alice', event: 'idle' })
//   4. Read state: getAvatarState('alice')  →  'typing' | 'idle' | …
// =============================================================================

import React, {
  createContext, useContext, useReducer, useRef, useCallback, useEffect,
} from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────
/** @typedef {'idle'|'typing'|'talking'|'happy'|'excited'|'sleeping'} AvatarState */
/** @typedef {{ animal: string, state: AvatarState }} AvatarEntry */
/** @typedef {{ [userId: string]: AvatarEntry }} Registry */

// ── Defaults ──────────────────────────────────────────────────────────────────
const DEFAULT_OPTIONS = {
  typingDebounce:  1500,
  happyDuration:   2200,
  talkingDuration: 2000,
  excitedDuration: 2500,
  sleepAfter:      0,       // 0 = disabled
};

const AvatarContext = createContext(null);

// ── Reducer ───────────────────────────────────────────────────────────────────
function registryReducer(state, action) {
  switch (action.type) {
    case 'SET_STATE':
      return {
        ...state,
        [action.userId]: {
          ...state[action.userId],
          state: action.avatarState,
        },
      };
    case 'REGISTER':
      if (state[action.userId]) return state; // already registered
      return {
        ...state,
        [action.userId]: { animal: action.animal ?? 'dog', state: 'idle' },
      };
    case 'UNREGISTER': {
      const next = { ...state };
      delete next[action.userId];
      return next;
    }
    default:
      return state;
  }
}

// ── Provider ──────────────────────────────────────────────────────────────────
export function AvatarProvider({ children, options = {} }) {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const [registry, dispatch] = useReducer(registryReducer, {});

  // Per-user timer maps (live outside React state to avoid re-renders)
  const timers = useRef({});   // userId → { typing, revert, sleep }

  const _getTimers = (userId) => {
    if (!timers.current[userId])
      timers.current[userId] = { typing: null, revert: null, sleep: null };
    return timers.current[userId];
  };

  const _clearTimers = (userId) => {
    const t = timers.current[userId];
    if (!t) return;
    clearTimeout(t.typing);
    clearTimeout(t.revert);
    clearTimeout(t.sleep);
  };

  const _setState = useCallback((userId, avatarState) => {
    dispatch({ type: 'SET_STATE', userId, avatarState });
  }, []);

  const _rearmSleep = useCallback((userId) => {
    if (opts.sleepAfter <= 0) return;
    const t = _getTimers(userId);
    clearTimeout(t.sleep);
    t.sleep = setTimeout(() => _setState(userId, 'sleeping'), opts.sleepAfter);
  }, [opts.sleepAfter, _setState]);

  /**
   * Dispatch a chat event for a user.
   * @param {{ userId: string, event: 'typing'|'sent'|'received'|'excited'|'sleep'|'idle' }} action
   */
  const sendEvent = useCallback((userId, event) => {
    const t = _getTimers(userId);

    switch (event) {
      case 'typing':
        clearTimeout(t.typing);
        clearTimeout(t.sleep);
        _setState(userId, 'typing');
        t.typing = setTimeout(() => {
          _setState(userId, 'idle');
          _rearmSleep(userId);
        }, opts.typingDebounce);
        break;

      case 'sent':
        _clearTimers(userId);
        _setState(userId, 'happy');
        t.revert = setTimeout(() => {
          _setState(userId, 'idle');
          _rearmSleep(userId);
        }, opts.happyDuration);
        break;

      case 'received':
        _clearTimers(userId);
        _setState(userId, 'talking');
        t.revert = setTimeout(() => {
          _setState(userId, 'idle');
          _rearmSleep(userId);
        }, opts.talkingDuration);
        break;

      case 'excited':
        _clearTimers(userId);
        _setState(userId, 'excited');
        t.revert = setTimeout(() => {
          _setState(userId, 'idle');
          _rearmSleep(userId);
        }, opts.excitedDuration);
        break;

      case 'sleep':
        _clearTimers(userId);
        _setState(userId, 'sleeping');
        break;

      case 'idle':
        _clearTimers(userId);
        _setState(userId, 'idle');
        _rearmSleep(userId);
        break;

      default:
        console.warn(`[AvatarProvider] Unknown event: "${event}"`);
    }
  }, [opts, _setState, _rearmSleep]);

  /** Register a userId → animal mapping */
  const registerUser = useCallback((userId, animal = 'dog') => {
    dispatch({ type: 'REGISTER', userId, animal });
  }, []);

  /** Remove a user from the registry */
  const unregisterUser = useCallback((userId) => {
    _clearTimers(userId);
    delete timers.current[userId];
    dispatch({ type: 'UNREGISTER', userId });
  }, []);

  /** Read the current avatar state for a user */
  const getAvatarState = useCallback((userId) => {
    return registry[userId]?.state ?? 'idle';
  }, [registry]);

  /** Read the animal type for a user */
  const getAnimal = useCallback((userId) => {
    return registry[userId]?.animal ?? 'dog';
  }, [registry]);

  // Cleanup all timers on unmount
  useEffect(() => {
    return () => {
      Object.keys(timers.current).forEach(uid => _clearTimers(uid));
    };
  }, []);

  const value = {
    registry,
    registerUser,
    unregisterUser,
    sendEvent,
    getAvatarState,
    getAnimal,
  };

  return (
    <AvatarContext.Provider value={value}>
      {children}
    </AvatarContext.Provider>
  );
}

// ── Consumer hook ─────────────────────────────────────────────────────────────
export function useAvatarRegistry() {
  const ctx = useContext(AvatarContext);
  if (!ctx) throw new Error('useAvatarRegistry must be used inside <AvatarProvider>');
  return ctx;
}

// ── Convenience hook for a single user ───────────────────────────────────────
/**
 * Reads a single user's avatar state reactively.
 * @param {string} userId
 * @returns {{ state: AvatarState, animal: string }}
 */
export function useUserAvatar(userId) {
  const { getAvatarState, getAnimal } = useAvatarRegistry();
  return {
    state:  getAvatarState(userId),
    animal: getAnimal(userId),
  };
}
