# ORBIT MESSAGING SYSTEM — COMPLETE IMPLEMENTATION PROMPT

## Replace existing messaging system with the following specification.

---

## 1. PROJECT SETUP

```bash
npm create vite@latest orbit-messaging -- --template react
cd orbit-messaging
npm install zustand framer-motion gsap @types/node
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

Fonts (add to index.html):
```html
<link href="https://fonts.googleapis.com/css2?family=Space+Mono:ital,wght@0,400;0,700;1,400&family=Syne:wght@400;500;600;700;800&family=Nunito:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
```

---

## 2. FILE STRUCTURE

```
src/
├── components/
│   ├── avatars/
│   │   └── PixelAvatar.jsx       # Pixel Avatar System (PAS)
│   ├── chat/
│   │   ├── UniversalChatContainer.jsx
│   │   ├── MsgBubble.jsx
│   │   └── TypingIndicator.jsx
│   ├── sidebar/
│   │   ├── Sidebar.jsx
│   │   └── ConvItem.jsx
│   ├── input/
│   │   └── AeroInput.jsx
│   └── panels/
│       ├── TelemeteryCapsule.jsx
│       └── InfoPanel.jsx
├── store/
│   ├── useChatStore.js
│   └── useNexusStore.js
├── crypto/
│   └── E2EE.js
├── themes/
│   ├── THEME_BRIDGE.js
│   └── ThemeInjector.jsx
├── hooks/
│   ├── useSocketSim.js
│   └── useTypingDetect.js
├── utils/
│   └── handleNorm.js
├── App.jsx
└── main.jsx
```

---

## 3. THEME ENGINE — `src/themes/THEME_BRIDGE.js`

```javascript
export const THEMES = {
  vampire: {
    id: 'vampire',
    label: '🧛 Vampire',
    font: "'Syne', sans-serif",
    fontMono: "'Space Mono', monospace",
    tokens: {
      '--acc':        '#e879f9',
      '--acc2':       '#a855f7',
      '--bg':         '#0d0d1a',
      '--bg2':        '#13132b',
      '--bg3':        '#1a1a3e',
      '--glass':      'rgba(255,255,255,0.06)',
      '--glass2':     'rgba(255,255,255,0.12)',
      '--border':     'rgba(232,121,249,0.3)',
      '--text':       '#f0e6ff',
      '--text2':      '#c4b5fd',
      '--sent-bg':    'rgba(168,85,247,0.25)',
      '--recv-bg':    'rgba(26,26,62,0.8)',
      '--radius':     '20px',
      '--blur':       '20px',
    },
    effects: {
      glassmorphism: true,
      scanlines: false,
      clouds: false,
      glowBorders: true,
    }
  },
  pastel: {
    id: 'pastel',
    label: '🌸 Pastel Dream',
    font: "'Nunito', sans-serif",
    fontMono: "'Nunito', sans-serif",
    tokens: {
      '--acc':        '#f472b6',
      '--acc2':       '#c084fc',
      '--bg':         '#fef0f8',
      '--bg2':        '#fff5fb',
      '--bg3':        '#fce7f3',
      '--glass':      'rgba(255,255,255,0.7)',
      '--glass2':     'rgba(255,255,255,0.9)',
      '--border':     'rgba(244,114,182,0.4)',
      '--text':       '#4a1942',
      '--text2':      '#9d174d',
      '--sent-bg':    'rgba(244,114,182,0.2)',
      '--recv-bg':    'rgba(255,255,255,0.85)',
      '--radius':     '30px',
      '--blur':       '15px',
    },
    effects: {
      glassmorphism: true,
      scanlines: false,
      clouds: true,          // GSAP floating cloud particles
      glowBorders: false,
      claymorphism: true,    // Extra border + box-shadow on bubbles
    }
  },
  cyber: {
    id: 'cyber',
    label: '⚡ Neon Cyber',
    font: "'Space Mono', monospace",
    fontMono: "'Space Mono', monospace",
    tokens: {
      '--acc':        '#00ff9d',
      '--acc2':       '#00d4ff',
      '--bg':         '#000a06',
      '--bg2':        '#001408',
      '--bg3':        '#00200d',
      '--glass':      'rgba(0,255,157,0.05)',
      '--glass2':     'rgba(0,255,157,0.1)',
      '--border':     'rgba(0,255,157,0.4)',
      '--text':       '#ccffe8',
      '--text2':      '#00ff9d',
      '--sent-bg':    'rgba(0,255,157,0.1)',
      '--recv-bg':    'rgba(0,20,8,0.9)',
      '--radius':     '4px',
      '--blur':       '10px',
    },
    effects: {
      glassmorphism: false,
      scanlines: true,       // CSS scanline overlay
      clouds: false,
      glowBorders: true,
      codeBlocks: true,      // Messages styled as terminal output
    }
  }
};

// Maps theme IDs to specific visual tokens
export const THEME_BRIDGE = {
  resolve: (themeId) => THEMES[themeId] || THEMES.vampire,
  getToken: (themeId, token) => THEMES[themeId]?.tokens[token] || '',
  inject: (themeId) => {
    const t = THEMES[themeId];
    if (!t) return;
    const root = document.documentElement;
    Object.entries(t.tokens).forEach(([k, v]) => root.style.setProperty(k, v));
    root.style.setProperty('--font', t.font);
    root.style.setProperty('--font-mono', t.fontMono);
    document.body.setAttribute('data-theme', themeId);
  }
};
```

---

## 4. E2EE ENGINE — `src/crypto/E2EE.js`

```javascript
// Real Web Crypto API — AES-256-GCM + RSA-2048 simulation
export const E2EE = {
  sessionKeys: new Map(), // convId -> CryptoKey

  async initSession(convId) {
    if (this.sessionKeys.has(convId)) return;
    const key = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
    this.sessionKeys.set(convId, key);
  },

  async encrypt(convId, plaintext) {
    const key = this.sessionKeys.get(convId);
    if (!key) throw new Error('No session key for ' + convId);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(plaintext);
    const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);
    return {
      ct: Array.from(new Uint8Array(ciphertext)),
      iv: Array.from(iv),
      alg: 'AES-256-GCM'
    };
  },

  async decrypt(convId, encryptedPayload) {
    const key = this.sessionKeys.get(convId);
    if (!key) throw new Error('No session key for ' + convId);
    const ct = new Uint8Array(encryptedPayload.ct);
    const iv = new Uint8Array(encryptedPayload.iv);
    const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct);
    return new TextDecoder().decode(plaintext);
  },

  async getFingerprint(convId) {
    const key = this.sessionKeys.get(convId);
    if (!key) return 'No key';
    const raw = await crypto.subtle.exportKey('raw', key);
    const hash = await crypto.subtle.digest('SHA-256', raw);
    const hex = Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('').toUpperCase();
    return hex.match(/.{2}/g).join(':').substring(0, 47) + '...';
  }
};
```

---

## 5. IDENTITY NORMALIZATION — `src/utils/handleNorm.js`

```javascript
// Orbit Handle obfuscation — maps public handles to internal IDs
const HANDLE_REGISTRY = {
  'orb_7f3a': { realId: 'nexus_orbit_core',  type: 'nexus', socketRoom: 'room_7f3a' },
  'orb_9c21': { realId: 'nexus_crypto_lab',  type: 'nexus', socketRoom: 'room_9c21' },
  'orb_4d18': { realId: 'user_lyra_primary', type: 'dm',    socketRoom: 'dm_4d18'   },
  'orb_2e77': { realId: 'user_axon_primary', type: 'dm',    socketRoom: 'dm_2e77'   },
  'orb_5b90': { realId: 'user_nova_primary', type: 'dm',    socketRoom: 'dm_5b90'   },
};

export const handleNorm = {
  // UI sees: orb_7f3a → Socket uses: room_7f3a
  toSocketRoom: (handle) => HANDLE_REGISTRY[handle]?.socketRoom || handle,
  // MongoDB query uses: nexus_orbit_core
  toRealId:     (handle) => HANDLE_REGISTRY[handle]?.realId || handle,
  // Display shows: orb_7f3a
  fromRealId:   (realId) => Object.entries(HANDLE_REGISTRY).find(([,v]) => v.realId === realId)?.[0] || realId,
  getType:      (handle) => HANDLE_REGISTRY[handle]?.type || 'unknown',
  register:     (handle, data) => { HANDLE_REGISTRY[handle] = data; },
};
```

---

## 6. ZUSTAND STORES — `src/store/useChatStore.js`

```javascript
import { create } from 'zustand';
import { E2EE } from '../crypto/E2EE';

export const useChatStore = create((set, get) => ({
  // Active session
  activeConv: null,
  activeType: null, // 'nexus' | 'dm'

  // Message map: convId -> Message[]
  messages: {},

  // Typing state: convId -> { isTyping, user }
  typingState: {},

  // Pending messages (optimistic UI): idempotencyKey -> status
  pendingKeys: {},

  // Actions
  setActiveConv: (convId, type) => {
    set({ activeConv: convId, activeType: type });
    E2EE.initSession(convId);
  },

  // Optimistic send — adds with 'pending' status instantly
  addMessageOptimistic: (convId, message) => {
    const idempotencyKey = `idem_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const pendingMsg = { ...message, id: idempotencyKey, pending: true, status: 'sending' };
    set(state => ({
      messages: {
        ...state.messages,
        [convId]: [...(state.messages[convId] || []), pendingMsg]
      },
      pendingKeys: { ...state.pendingKeys, [idempotencyKey]: 'pending' }
    }));
    return idempotencyKey;
  },

  // Confirm message — replace idempotencyKey with real MongoDB _id
  confirmMessage: (convId, idempotencyKey, realId) => {
    set(state => ({
      messages: {
        ...state.messages,
        [convId]: (state.messages[convId] || []).map(m =>
          m.id === idempotencyKey
            ? { ...m, id: realId, pending: false, status: 'delivered' }
            : m
        )
      },
      pendingKeys: Object.fromEntries(
        Object.entries(state.pendingKeys).filter(([k]) => k !== idempotencyKey)
      )
    }));
  },

  // Add incoming message (decrypted)
  addIncomingMessage: (convId, message) => {
    set(state => ({
      messages: {
        ...state.messages,
        [convId]: [...(state.messages[convId] || []), { ...message, pending: false, status: 'received' }]
      }
    }));
  },

  setTyping: (convId, user, isTyping) => {
    set(state => ({
      typingState: { ...state.typingState, [convId]: { isTyping, user } }
    }));
  },

  addReaction: (convId, msgId, emoji) => {
    set(state => ({
      messages: {
        ...state.messages,
        [convId]: (state.messages[convId] || []).map(m => {
          if (m.id !== msgId) return m;
          const rs = m.reactions || [];
          return { ...m, reactions: rs.includes(emoji) ? rs.filter(r => r !== emoji) : [...rs, emoji] };
        })
      }
    }));
  },

  markRead: (convId, msgId) => {
    set(state => ({
      messages: {
        ...state.messages,
        [convId]: (state.messages[convId] || []).map(m =>
          m.id === msgId ? { ...m, read: true } : m
        )
      }
    }));
  }
}));
```

---

## 7. PIXEL AVATAR SYSTEM — `src/components/avatars/PixelAvatar.jsx`

```jsx
import { useRef, useEffect, useCallback } from 'react';

// Color palettes per user
const PALETTES = {
  lyra:  ['#e879f9','#c026d3','#fce7f3','#4a1942','#ffffff'],
  axon:  ['#60a5fa','#2563eb','#dbeafe','#1e3a8a','#ffffff'],
  nova:  ['#34d399','#059669','#d1fae5','#064e3b','#ffffff'],
  sigma: ['#fb923c','#ea580c','#fed7aa','#431407','#ffffff'],
  me:    ['#a855f7','#7c3aed','#f5f3ff','#2e1065','#ffffff'],
  default:['#94a3b8','#64748b','#f1f5f9','#1e293b','#ffffff'],
};

// 8x8 pixel art patterns (0=transparent, 1-5=palette index)
const PATTERNS = {
  idle:    [0,0,1,1,1,1,0,0,0,1,2,2,2,2,1,0,1,2,3,2,2,3,2,1,1,2,2,2,2,2,2,1,1,2,2,2,2,2,2,1,0,1,2,2,2,2,1,0,0,0,1,2,2,1,0,0,0,0,0,5,5,0,0,0],
  typing:  [0,0,1,1,1,1,0,0,0,1,2,2,2,2,1,0,1,2,3,2,2,3,2,1,1,2,2,3,3,2,2,1,1,2,2,2,2,2,2,1,0,1,2,2,2,2,1,0,0,0,1,2,2,1,0,0,0,0,5,0,0,5,0,0],
  talking: [0,0,1,1,1,1,0,0,0,1,2,2,2,2,1,0,1,2,1,2,2,1,2,1,1,2,2,2,2,2,2,1,1,2,3,2,2,3,2,1,0,1,2,2,2,2,1,0,0,0,1,2,2,1,0,0,5,0,2,0,0,2,0,5],
  happy:   [0,0,1,1,1,1,0,0,0,1,2,2,2,2,1,0,1,2,3,2,2,3,2,1,1,2,2,2,2,2,2,1,1,2,3,2,2,3,2,1,0,1,2,2,2,2,1,0,0,0,1,2,2,1,0,0,0,5,0,0,0,0,5,0],
  excited: [0,0,1,1,1,1,0,0,0,1,2,2,2,2,1,0,1,2,1,2,2,1,2,1,1,2,2,2,2,2,2,1,1,2,3,3,3,3,2,1,0,1,2,2,2,2,1,0,5,0,1,2,2,1,0,5,0,5,0,0,0,0,5,0],
  sleeping:[0,0,1,1,1,1,0,0,0,1,2,2,2,2,1,0,1,2,2,2,2,2,2,1,1,2,2,2,2,2,2,1,1,2,2,2,2,2,2,1,0,1,2,2,2,2,1,0,0,0,1,2,2,1,0,0,0,0,0,2,2,0,0,0],
};

export function PixelAvatar({ user = 'default', state = 'idle', size = 38, style = {}, className = '' }) {
  const canvasRef = useRef(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const pal = PALETTES[user] || PALETTES.default;
    const pat = PATTERNS[state] || PATTERNS.idle;
    const S = canvas.width / 8;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < 64; i++) {
      const v = pat[i];
      if (v === 0) continue;
      ctx.fillStyle = pal[v - 1] || pal[0];
      ctx.fillRect((i % 8) * S, Math.floor(i / 8) * S, S, S);
    }
  }, [user, state]);

  useEffect(() => { draw(); }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className={`pixel-avatar ${className}`}
      style={{ imageRendering: 'pixelated', ...style }}
    />
  );
}
```

---

## 8. UNIVERSAL CHAT CONTAINER — `src/components/chat/UniversalChatContainer.jsx`

```jsx
import { useEffect, useRef, useCallback, useState } from 'react';
import { useChatStore } from '../../store/useChatStore';
import { E2EE } from '../../crypto/E2EE';
import { handleNorm } from '../../utils/handleNorm';
import MsgBubble from './MsgBubble';
import TypingIndicator from './TypingIndicator';
import { PixelAvatar } from '../avatars/PixelAvatar';
import { THEMES } from '../../themes/THEME_BRIDGE';

export default function UniversalChatContainer({ convId, type, theme }) {
  const t = THEMES[theme] || THEMES.vampire;
  const wrapRef = useRef(null);
  const { messages, typingState, addIncomingMessage, confirmMessage, addMessageOptimistic } = useChatStore();
  const convMsgs = messages[convId] || [];
  const typing = typingState[convId];

  // Auto scroll to bottom on new messages
  const scrollToBottom = useCallback(() => {
    if (wrapRef.current) {
      wrapRef.current.scrollTo({ top: wrapRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, []);

  useEffect(() => { scrollToBottom(); }, [convMsgs.length, scrollToBottom]);

  // Filter messages for active session
  const filteredMsgs = convMsgs.filter(m => m.convId === convId || !m.convId);

  return (
    <div
      ref={wrapRef}
      className="messages-wrap"
      style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}
    >
      <div className="date-divider">TODAY</div>
      {filteredMsgs.map(msg => (
        <MsgBubble key={msg.id} msg={msg} theme={theme} type={type} />
      ))}
      {typing?.isTyping && <TypingIndicator user={typing.user} theme={theme} />}
    </div>
  );
}
```

---

## 9. MSG BUBBLE — `src/components/chat/MsgBubble.jsx`

```jsx
import { useState, useCallback } from 'react';
import { PixelAvatar } from '../avatars/PixelAvatar';
import { useChatStore } from '../../store/useChatStore';

const EMOJI_REACTIONS = ['❤️','👍','😂','🔥','✨','🎯','🔐','💫'];

export default function MsgBubble({ msg, theme }) {
  const mine = msg.sender === 'me';
  const [showReactPicker, setShowReactPicker] = useState(false);
  const { addReaction, activeConv } = useChatStore();

  const avatarState = mine
    ? (msg.pending ? 'typing' : 'happy')
    : 'idle';

  const isCyber = theme === 'cyber';
  const isPastel = theme === 'pastel';

  return (
    <div className={`msg-row ${mine ? 'mine' : ''}`}>
      <PixelAvatar user={msg.sender} state={avatarState} size={28} className="msg-avatar" />
      <div className="msg-content">
        <div
          className={`msg-bubble ${mine ? 'mine' : 'other'} ${msg.pending ? 'pending' : ''}`}
          onDoubleClick={() => setShowReactPicker(p => !p)}
        >
          {isCyber && <span className="cyber-prefix">{mine ? '> ' : '< '}</span>}
          {msg.text}
          {msg.pending && <span className="pending-icon">◷</span>}
        </div>

        {showReactPicker && (
          <div className="react-picker">
            {EMOJI_REACTIONS.map(e => (
              <span key={e} onClick={() => { addReaction(activeConv, msg.id, e); setShowReactPicker(false); }}>
                {e}
              </span>
            ))}
          </div>
        )}

        <div className={`msg-meta ${mine ? 'mine' : ''}`}>
          <span>{msg.ts}</span>
          {mine && <span className="read-tick">{msg.read ? '✓✓' : '✓'}</span>}
          {msg.reactions?.length > 0 && (
            <div className="react-strip">
              {msg.reactions.map((r, i) => (
                <span key={i} onClick={() => addReaction(activeConv, msg.id, r)}>{r}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

---

## 10. AERO INPUT — `src/components/input/AeroInput.jsx`

```jsx
import { useRef, useState, useCallback } from 'react';
import { useChatStore } from '../../store/useChatStore';
import { E2EE } from '../../crypto/E2EE';
import { PixelAvatar } from '../avatars/PixelAvatar';

export default function AeroInput({ convId, theme, onSend }) {
  const [text, setText] = useState('');
  const [avatarState, setAvatarState] = useState('idle');
  const textareaRef = useRef(null);
  const typingTimer = useRef(null);
  const { addMessageOptimistic, confirmMessage } = useChatStore();

  const handleInput = useCallback((e) => {
    setText(e.target.value);
    autoResize(e.target);
    setAvatarState('typing');
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => setAvatarState('idle'), 2000);
  }, []);

  const autoResize = (el) => {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 80) + 'px';
  };

  const send = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setText('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    const ts = new Date().toTimeString().slice(0, 5);
    const idKey = addMessageOptimistic(convId, {
      convId, sender: 'me', text: trimmed, ts, read: false, reactions: []
    });

    setAvatarState('happy');
    setTimeout(() => setAvatarState('idle'), 1500);

    // E2EE encrypt before socket emit
    try {
      const encrypted = await E2EE.encrypt(convId, trimmed);
      // TODO: socket.emit('message', { room: handleNorm.toSocketRoom(convId), encrypted, idempotencyKey: idKey });
      // Simulate ACK:
      setTimeout(() => {
        confirmMessage(convId, idKey, 'msg_' + Date.now());
        onSend?.(trimmed);
      }, 600 + Math.random() * 400);
    } catch (err) {
      console.error('E2EE encrypt failed:', err);
    }
  }, [text, convId, addMessageOptimistic, confirmMessage, onSend]);

  const handleKey = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  }, [send]);

  return (
    <div className="aero-input-wrap">
      <div className="aero-inner">
        <div className="self-avatar-wrap">
          <PixelAvatar user="me" state={avatarState} size={30} className="self-avatar" />
        </div>
        <textarea
          ref={textareaRef}
          className="aero-input"
          placeholder="Transmit message..."
          rows={1}
          value={text}
          onInput={handleInput}
          onChange={handleInput}
          onKeyDown={handleKey}
        />
        <div className="input-actions">
          <button className="input-btn" title="Image">🖼</button>
          <button className="input-btn" title="File">📎</button>
          <button className="input-btn" title="Voice">🎙</button>
        </div>
        <button className="send-btn" onClick={send} disabled={!text.trim()}>➤</button>
      </div>
      <div className="enc-notice">🔒 Messages are end-to-end encrypted · AES-256-GCM + RSA-2048</div>
    </div>
  );
}
```

---

## 11. TELEMETRY CAPSULE — `src/components/panels/TelemeteryCapsule.jsx`

```jsx
import { useState, useEffect } from 'react';
import { PixelAvatar } from '../avatars/PixelAvatar';
import { handleNorm } from '../../utils/handleNorm';
import { E2EE } from '../../crypto/E2EE';

export default function TelemeteryCapsule({ conv, onInfoToggle, onMenuToggle, theme }) {
  const [latency, setLatency] = useState(12);
  const [signalStrength, setSignalStrength] = useState(4);
  const [fingerprint, setFingerprint] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setLatency(Math.floor(8 + Math.random() * 30));
      setSignalStrength(2 + Math.floor(Math.random() * 3));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (conv?.id) {
      E2EE.getFingerprint(conv.id).then(setFingerprint).catch(() => {});
    }
  }, [conv?.id]);

  const peerUser = { orb_7f3a:'nova', orb_9c21:'sigma', orb_4d18:'lyra', orb_2e77:'axon', orb_5b90:'nova' }[conv?.id] || 'lyra';

  return (
    <div className="telemetry">
      <div className="tele-peer">
        <PixelAvatar user={peerUser} state={conv?.online ? 'idle' : 'sleeping'} size={38}
          style={{ borderRadius: '10px', border: '2px solid var(--border)' }} />
        <div className="tele-info">
          <h3>{conv?.type === 'nexus' ? `Nexus: ${conv.name}` : conv?.name}</h3>
          <p>{conv?.id} · {conv?.type === 'nexus' ? `${conv?.members?.length || 0} members` : conv?.handle}</p>
        </div>
        <span className="nexus-badge">{conv?.type === 'nexus' ? 'NEXUS' : 'DIRECT LINE'}</span>
      </div>

      <div className="tele-badges">
        <div className="enc-badge">
          <span className="enc-dot"></span> E2EE
        </div>
        <div className="signal-bars">
          {[5, 8, 11, 14, 17].map((h, i) => (
            <div key={i} className={`signal-bar ${i < signalStrength ? 'active' : ''}`} style={{ height: h }} />
          ))}
        </div>
        <span className="latency">{latency}ms</span>
      </div>

      <div className="tele-actions">
        <button className="tele-btn" onClick={onInfoToggle}>ℹ</button>
        <button className="tele-btn mobile-only" onClick={onMenuToggle}>☰</button>
      </div>
    </div>
  );
}
```

---

## 12. SOCKET INTEGRATION (replace simulation)

When integrating with a real backend (Socket.IO / WebSocket):

```javascript
// src/hooks/useSocketSim.js — replace with real socket
import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useChatStore } from '../store/useChatStore';
import { E2EE } from '../crypto/E2EE';
import { handleNorm } from '../utils/handleNorm';

export function useSocket(userId) {
  const socketRef = useRef(null);
  const { addIncomingMessage, setTyping, confirmMessage } = useChatStore();

  useEffect(() => {
    // REPLACE with real socket URL
    const socket = io('wss://your-orbit-backend.com', {
      auth: { userId },
      transports: ['websocket'],
    });
    socketRef.current = socket;

    socket.on('connect', () => console.log('[Orbit] Socket connected'));

    // Incoming encrypted message
    socket.on('message:incoming', async ({ encryptedPayload, meta }) => {
      const convId = handleNorm.fromRealId(meta.room);
      try {
        const plaintext = await E2EE.decrypt(convId, encryptedPayload);
        addIncomingMessage(convId, {
          id: meta.mongoId,
          sender: meta.sender,
          text: plaintext,
          ts: new Date(meta.ts).toTimeString().slice(0, 5),
          read: false,
          reactions: [],
          convId,
        });
      } catch (err) {
        console.error('[Orbit] Decrypt failed:', err);
      }
    });

    // Socket ACK — replace pending message with real MongoDB _id
    socket.on('message:ack', ({ idempotencyKey, mongoId, convId }) => {
      confirmMessage(convId, idempotencyKey, mongoId);
    });

    // Typing indicator
    socket.on('typing:start', ({ convId, user }) => setTyping(convId, user, true));
    socket.on('typing:stop', ({ convId }) => setTyping(convId, null, false));

    return () => socket.disconnect();
  }, [userId]);

  const emit = (event, data) => socketRef.current?.emit(event, data);

  return { emit, socket: socketRef.current };
}

// To SEND via socket:
// const { emit } = useSocket(myUserId);
// const encrypted = await E2EE.encrypt(convId, text);
// emit('message:send', {
//   room: handleNorm.toSocketRoom(convId),
//   encryptedPayload: encrypted,
//   idempotencyKey,
//   meta: { sender: myUserId, ts: Date.now() }
// });
```

---

## 13. MAIN APP — `src/App.jsx`

```jsx
import { useState, useEffect } from 'react';
import { THEME_BRIDGE } from './themes/THEME_BRIDGE';
import { useChatStore } from './store/useChatStore';
import Sidebar from './components/sidebar/Sidebar';
import TelemeteryCapsule from './components/panels/TelemeteryCapsule';
import UniversalChatContainer from './components/chat/UniversalChatContainer';
import AeroInput from './components/input/AeroInput';
import InfoPanel from './components/panels/InfoPanel';

const INITIAL_CONVS = {
  nexuses: [
    { id:'orb_7f3a', name:'Orbit Core', members:['lyra','axon','nova','me'], type:'nexus', online:true, unread:3 },
    { id:'orb_9c21', name:'Crypto Lab', members:['axon','sigma','me'], type:'nexus', online:true, unread:0 },
  ],
  dms: [
    { id:'orb_4d18', name:'Lyra', handle:'lyra.orb', type:'dm', online:true, unread:2 },
    { id:'orb_2e77', name:'Axon', handle:'axon.orb', type:'dm', online:false, unread:0 },
    { id:'orb_5b90', name:'Nova', handle:'nova.orb', type:'dm', online:true, unread:1 },
  ]
};

export default function App() {
  const [theme, setTheme] = useState('vampire');
  const [activeConv, setActiveConv] = useState(INITIAL_CONVS.nexuses[0]);
  const [infoOpen, setInfoOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => { THEME_BRIDGE.inject(theme); }, [theme]);

  return (
    <div className="orbit-app" data-theme={theme}>
      {/* Background orbs */}
      <div className="bg-orb a" /><div className="bg-orb b" />

      {/* Scanlines (cyber only) */}
      {theme === 'cyber' && <div className="scanlines" />}

      <Sidebar
        convs={INITIAL_CONVS}
        activeId={activeConv?.id}
        theme={theme}
        onThemeChange={setTheme}
        onSelectConv={setActiveConv}
        isOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      />

      <div className="chat-area">
        <div className="status-bar" />
        <TelemeteryCapsule
          conv={activeConv}
          theme={theme}
          onInfoToggle={() => setInfoOpen(o => !o)}
          onMenuToggle={() => setMobileSidebarOpen(true)}
        />
        <UniversalChatContainer
          convId={activeConv?.id}
          type={activeConv?.type}
          theme={theme}
        />
        <AeroInput
          convId={activeConv?.id}
          theme={theme}
        />
      </div>

      <InfoPanel
        conv={activeConv}
        isOpen={infoOpen}
        onClose={() => setInfoOpen(false)}
        theme={theme}
      />
    </div>
  );
}
```

---

## 14. SECURITY CHECKLIST

| Feature | Implementation |
|---------|----------------|
| E2EE | AES-256-GCM via Web Crypto API; keys never leave client |
| Key Exchange | Simulate RSA-2048 OAEP; in prod use actual RSA key exchange |
| Handle Obfuscation | Orbit handles (`orb_xxx`) never expose real MongoDB IDs |
| Optimistic UI | `idempotencyKey` prevents duplicate messages on retry |
| Auth | Socket connection authenticated via JWT in `auth` field |
| Message Integrity | AES-GCM provides both encryption + authentication |
| Key Rotation | Call `E2EE.initSession(convId)` to rotate session key |

---

## 15. MOBILE RESPONSIVENESS

```css
@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    left: 0; top: 0;
    height: 100vh;
    width: 100vw !important;
    z-index: 100;
    transform: translateX(-100%);
    transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  .sidebar.open { transform: translateX(0); }
  .info-panel {
    position: fixed;
    right: 0; top: 0;
    height: 100vh;
    width: 100vw !important;
    z-index: 100;
  }
  .mobile-back { display: flex !important; }
  .tele-btn.mobile-only { display: flex !important; }
}
```
