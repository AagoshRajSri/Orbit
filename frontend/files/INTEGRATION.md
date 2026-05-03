# Pixel Avatar System — Integration Guide

> Drop-in animated pixel avatars for your React chat app.
> No GIFs, no image assets, no external dependencies beyond React.

---

## 1. File Structure

Copy the following into your project:

```
src/
├── components/
│   ├── index.js                        ← barrel export (import everything from here)
│   ├── ChatInput.jsx                   ← pre-wired chat input (optional)
│   └── PixelAvatar/
│       ├── PixelAvatar.jsx             ← core canvas component
│       ├── PixelAvatarBadge.jsx        ← avatar + presence dot + label
│       ├── useAvatarState.js           ← single-avatar state machine hook
│       ├── animation.js                ← frame selector (time → bitmap rows)
│       ├── renderer.js                 ← canvas painter (bitmap rows → pixels)
│       └── sprites.js                  ← palette + 16×16 pixel art data
└── context/
    └── AvatarContext.jsx               ← global multi-user registry (optional)
```

No npm installs required. Uses only React built-ins (`useRef`, `useEffect`, `useCallback`, `memo`, `useReducer`, `createContext`).

---

## 2. Requirements

| Item | Requirement |
|------|-------------|
| React | ≥ 17 (hooks) |
| Build | Vite / CRA / Next.js — any bundler that handles `.jsx` |
| Browser | Any modern browser (Canvas 2D API) |

---

## 3. Quick Start — 60 seconds

### 3a. Static avatar (no state)

```jsx
import { PixelAvatar } from './components/PixelAvatar/PixelAvatar';

// In your JSX:
<PixelAvatar type="cat" state="idle" size={48} />
```

That's it. The avatar animates on its own — breathing, blinking, particles.

### 3b. Wired to your chat input

```jsx
import { PixelAvatar }    from './components/PixelAvatar/PixelAvatar';
import { useAvatarState } from './components/PixelAvatar/useAvatarState';

function MyChatBox() {
  const avatar = useAvatarState('idle', {
    typingDebounce:  1500,   // ms after last keystroke → idle
    happyDuration:   2200,   // ms to show 'happy' after send
    talkingDuration: 2000,   // ms to show 'talking' on receive
    sleepAfter:      30_000, // ms inactivity → sleeping (0 = off)
  });

  const handleSend = (text) => {
    avatar.onMessageSent();        // → 'happy', reverts automatically
    sendToServer(text);
  };

  // Call this when YOU receive a message from the peer:
  socket.on('message', () => avatar.onMessageReceived());  // → 'talking'

  return (
    <div>
      {/* Header shows your avatar */}
      <PixelAvatar type="dog" state={avatar.state} size={40} />

      {/* Input triggers typing state */}
      <input
        onChange={avatar.onTyping}
        onKeyDown={(e) => e.key === 'Enter' && handleSend(value)}
      />
    </div>
  );
}
```

---

## 4. Props Reference

### `<PixelAvatar />`

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `type` | `'dog'\|'cat'\|'bunny'` | `'dog'` | Animal type |
| `state` | `'idle'\|'typing'\|'talking'\|'happy'\|'excited'\|'sleeping'` | `'idle'` | Animation state |
| `size` | `number` | `32` | Canvas size in px (square) |
| `speed` | `number` | `1` | Animation speed multiplier |
| `rounded` | `boolean\|number` | `true` | Border radius (true = auto 18% of size) |
| `bg` | `string` | `'#0d1018'` | Background color |
| `className` | `string` | — | CSS class on wrapper div |
| `style` | `CSSProperties` | — | Inline styles on wrapper div |

### `<PixelAvatarBadge />`

Extends `PixelAvatar` props plus:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `showDot` | `boolean` | `true` | Show presence dot |
| `showLabel` | `boolean` | `false` | Show state text label below avatar |
| `online` | `boolean` | `true` | False → gray dot regardless of state |
| `onClick` | `() => void` | — | Click handler |

### `useAvatarState(initialState, options)`

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `typingDebounce` | `number` | `1500` | ms after last keystroke → idle |
| `happyDuration` | `number` | `2200` | ms 'happy' lasts |
| `talkingDuration` | `number` | `2000` | ms 'talking' lasts |
| `excitedDuration` | `number` | `2500` | ms 'excited' lasts |
| `sleepAfter` | `number` | `0` | ms inactivity → sleeping (0 = disabled) |

Returns:

| Method | Description |
|--------|-------------|
| `state` | Current state string |
| `setState(s)` | Force any state immediately |
| `onTyping()` | Call on every input keystroke |
| `onMessageSent()` | Call when user sends a message |
| `onMessageReceived()` | Call when peer sends a message |
| `onExcited()` | Call for reactions / mentions / confetti |
| `onPeerTyping()` | Soft: peer is typing (no lock) |
| `onPeerIdle()` | Soft: peer stopped typing |

---

## 5. Integration Patterns

### Pattern A — Simple 1:1 Chat

```jsx
// ChatWindow.jsx
import { PixelAvatarBadge } from './components/PixelAvatar/PixelAvatarBadge';
import { ChatInput }        from './components/ChatInput';
import { useAvatarState }   from './components/PixelAvatar/useAvatarState';

export function ChatWindow({ socket, peer }) {
  const myAvatar   = useAvatarState('idle', { sleepAfter: 60_000 });
  const peerAvatar = useAvatarState('idle');

  // Incoming events
  useEffect(() => {
    socket.on('message',          () => myAvatar.onMessageReceived());
    socket.on('peer:typing',      () => peerAvatar.onPeerTyping());
    socket.on('peer:typing:stop', () => peerAvatar.onPeerIdle());
    socket.on('peer:message',     () => peerAvatar.onMessageReceived());
    return () => socket.removeAllListeners();
  }, [socket]);

  // Outgoing typing indicator
  const handleTyping = () => {
    myAvatar.onTyping();
    socket.emit('typing');
  };

  return (
    <div>
      {/* Chat header */}
      <header>
        <PixelAvatarBadge
          type={peer.animal}          // 'dog' | 'cat' | 'bunny'
          state={peerAvatar.state}
          size={40}
          showLabel
        />
        <span>{peer.name}</span>
      </header>

      {/* Messages */}
      <MessageList
        messages={messages}
        myAvatarType="dog"
        peerAvatarType={peer.animal}
        peerAvatarState={peerAvatar.state}
      />

      {/* Input */}
      <ChatInput
        avatarHook={myAvatar}
        selfType="dog"
        selfState={myAvatar.state}
        onSend={(text) => {
          myAvatar.onMessageSent();
          socket.emit('message', text);
        }}
      />
    </div>
  );
}
```

### Pattern B — Group Chat with AvatarProvider

```jsx
// App.jsx
import { AvatarProvider } from './context/AvatarContext';

function App() {
  return (
    <AvatarProvider options={{ sleepAfter: 30_000 }}>
      <GroupChatRoom />
    </AvatarProvider>
  );
}

// GroupChatRoom.jsx
import { useAvatarRegistry } from './context/AvatarContext';
import { PixelAvatarBadge }  from './components/PixelAvatar/PixelAvatarBadge';

function GroupChatRoom({ users, socket }) {
  const { registerUser, sendEvent, getAvatarState, getAnimal } = useAvatarRegistry();

  // Register each user on join
  useEffect(() => {
    users.forEach(u => registerUser(u.id, u.animal));
  }, [users]);

  // Route socket events to avatar state
  useEffect(() => {
    socket.on('user:typing',  ({ userId }) => sendEvent(userId, 'typing'));
    socket.on('user:message', ({ userId }) => sendEvent(userId, 'received'));
    socket.on('user:react',   ({ userId }) => sendEvent(userId, 'excited'));
    return () => socket.removeAllListeners();
  }, [socket]);

  return (
    <div className="participants">
      {users.map(user => (
        <PixelAvatarBadge
          key={user.id}
          type={getAnimal(user.id)}
          state={getAvatarState(user.id)}
          size={36}
          showLabel
        />
      ))}
    </div>
  );
}
```

### Pattern C — Message Bubble Avatar

```jsx
// MessageBubble.jsx — avatar in each message row
import { PixelAvatar } from './components/PixelAvatar/PixelAvatar';

export function MessageBubble({ message, isOwn, avatarType, avatarState }) {
  return (
    <div style={{ display: 'flex', gap: 8, flexDirection: isOwn ? 'row-reverse' : 'row' }}>
      <PixelAvatar
        type={avatarType}
        state={avatarState}   // pass 'idle' for old messages, live state for latest
        size={28}
      />
      <div className={`bubble ${isOwn ? 'bubble--own' : ''}`}>
        {message.text}
      </div>
    </div>
  );
}
```

---

## 6. Adding Your Own Animal

1. Open `sprites.js`
2. Add a new export with frames: `idle0`, `blink`, `mouth`, `happyBlink`, `sleep`  
   Each frame = 16 strings × 16 chars using letters from `PAL`
3. Add your new animal to `FRAME_SETS`:
   ```js
   export const FRAME_SETS = { dog: DOG, cat: CAT, bunny: BUNNY, fox: FOX };
   ```
4. Pass `type="fox"` to `<PixelAvatar />`

No other files need to change.

---

## 7. Custom Palette Colors

Edit `PAL` in `sprites.js`:

```js
export const PAL = {
  // … existing entries …
  'L': '#ff8800',  // make the dog orange instead of gold
};
```

All avatars using `'L'` update instantly — no frame edits needed.

---

## 8. Performance Notes

- Each `<PixelAvatar>` runs **one persistent `requestAnimationFrame` loop** that never restarts.
- All prop changes (type, state, speed) are read through **stable refs** — zero re-renders triggered by animation.
- `memo()` wraps both `PixelAvatar` and `PixelAvatarBadge` — parent re-renders are free.
- The renderer uses **`fillRect`** (not `ImageData`) for correct anti-aliasing-free scaling at any size.
- Recommended sizes: **28px** (message bubble), **34–40px** (header/contact list), **64px** (studio/profile).
- Running 20+ avatars simultaneously is fine on any modern device.

---

## 9. Troubleshooting

| Symptom | Fix |
|---------|-----|
| Avatar looks blurry | Add `imageRendering: 'pixelated'` to the `<canvas>` — already applied by default |
| Avatar shows noise / random pixels | You're passing a canvas size that isn't a multiple of 16 — any size works, the renderer scales correctly; if still broken, check that `sprites.js` rows are exactly 16 chars each |
| State not reverting after 'happy' | Make sure `onMessageSent()` is called, not `setState('happy')` — the latter is permanent |
| Sleep timer not firing | Pass `sleepAfter: 20000` (ms) in options — default is `0` (disabled) |
| TypeScript errors | Add `.d.ts` declarations or rename files to `.tsx` / `.ts`; all props are JSDoc-typed |

---

*Built with Canvas 2D API + React hooks. Zero runtime dependencies.*
