# 🐾 Avatar Chat — Antigravity Integration Prompt

---

## 📎 Attached File
`avatarChat.jsx` — A self-contained React component featuring a real-time 3D cat avatar chat interface built with React Three Fiber, @react-spring/three, and Three.js procedural geometry.

---

## 🎯 What You're Integrating

This file is **not a UI widget** — it is a **living presence layer**.

It renders a fully procedural 3D cat (`Luna`) built from raw Three.js geometry (no external models or assets required). The avatar breathes, blinks on a randomized timer, tracks the mouse cursor with its eyes, and transitions through a 7-state animation state machine driven entirely by chat events.

**Architecture overview:**

```
avatarChat.jsx
├── PALETTE                   → design tokens (colors, surfaces, glows)
├── STATES                    → animation state machine constants
├── CatFur / CatEye / CatEar / CatWhisker   → atomic 3D sub-components
├── CatAvatar                 → full rigged cat body, driven by useSpring + useFrame
├── EmotionParticles          → reaction sparkle burst system
├── AvatarScene               → Three.js lighting + scene wrapper
├── TypingDots                → animated typing indicator
├── StatusRing                → color-reactive presence ring
└── App (default export)      → full chat UI with state machine orchestration
```

---

## ⚙️ Dependencies Required

Install exactly these — versions matter for spring physics:

```bash
npm install @react-three/fiber @react-spring/three three
```

> **Note:** `three` must be `>= r128`. `@react-spring/three` must be compatible with your version of `@react-spring/core`. If you see spring animation errors, pin `@react-spring/three@9.x`.

---

## 🔌 Integration Instructions

### Option A — Drop-in Full Page
Mount as a full-page route in your router:

```jsx
// App.jsx or your router file
import AvatarChat from "./avatarChat";

<Route path="/chat" element={<AvatarChat />} />
```

### Option B — Embedded Panel
Wrap in a sized container. The component is fully self-contained and respects its parent's dimensions:

```jsx
<div style={{ width: 420, height: 680, borderRadius: 28, overflow: "hidden" }}>
  <AvatarChat />
</div>
```

### Option C — Integrate Into Existing Chat System
The avatar state machine is isolated inside `App`. To wire it into your own chat backend, locate and replace these three trigger points in the `App` component:

```js
// 1. When the local user types → triggers ALERT state
setAvatarState(STATES.ALERT);

// 2. When a message is sent or received → triggers REACTING state
setAvatarState(STATES.REACTING);

// 3. After 6s of inactivity → triggers RESTING state
setAvatarState(STATES.RESTING);
```

Map these to your own socket/event system:

```js
socket.on("typing", () => setAvatarState(STATES.ALERT));
socket.on("message", () => {
  setAvatarState(STATES.REACTING);
  setTimeout(() => setAvatarState(STATES.IDLE), 2200);
});
```

---

## 🧠 State Machine Reference

| State        | Trigger                        | Visual Behavior                                      |
|--------------|--------------------------------|------------------------------------------------------|
| `hidden`     | Initial / disconnected         | Avatar invisible, scaled to 0                        |
| `entering`   | On mount                       | Rises with spring inertia from below                 |
| `idle`       | Default active state           | Breathing, subtle head sway, cursor eye tracking     |
| `alert`      | User is typing                 | Forward lean, ears perk up via spring physics        |
| `reacting`   | Message sent or received       | Head tilt, scale pop, sparkle particle burst         |
| `resting`    | 6s+ no activity                | Settles lower, muted status color                    |

Transitions use `@react-spring/three` with `mass: 1.5, tension: 120, friction: 18` — tuned for organic weight. Do **not** replace with CSS transitions or you will lose the inertia feel.

---

## 🎨 Customization Reference

### Change avatar colors
In `CatAvatar`, edit these three constants:
```js
const furColor   = "#c9956b";   // outer fur
const bodyColor  = "#b8845c";   // body / limbs
const bellyColor = "#e8d5c0";   // muzzle, belly, paw pads
```

### Change UI theme
Edit the `PALETTE` object at the top of the file. All colors reference these tokens — nothing is hardcoded elsewhere.

### Change avatar name / placeholder
```jsx
// Header name
<div>Luna 🐱</div>

// Input placeholder
placeholder="Message Luna..."
```

### Adjust idle timeout
```js
// Default: 6000ms before resting
idleTimerRef.current = setTimeout(() => { ... }, 6000);
```

### Adjust blink frequency
```js
// Default: blink every 2500–5500ms, held for 120–180ms
const next = 2500 + Math.random() * 3500;
setTimeout(() => { blinking.current = false; }, 120 + Math.random() * 60);
```

---

## ⚡ Performance Notes

- Each `<Canvas>` instance creates its own WebGL context. The file uses **3 canvas instances** (main panel, header thumbnail, message bubble avatars). On low-end GPUs, consider reducing to 1 canvas by using a static PNG fallback for the thumbnail.
- The `EmotionParticles` component only mounts during `STATES.REACTING` and unmounts automatically — no idle GPU cost.
- All `useFrame` loops include early-return guards (`if (!ref.current) return`) to prevent null-ref errors during mount/unmount cycles.
- Mouse tracking updates `lookTarget` via a `ref` (not state) to avoid re-renders on every mouse move.

---

## 🚫 Do Not Modify

These parts are load-bearing for the animation system — changing them will break spring physics or cause render artifacts:

- `useFrame` inside `CatAvatar` — owns the breathing and tail animation loops
- `blinking.current` ref pattern — must stay a ref, not state, to avoid blink flicker
- `lookTarget.current` ref pattern — must stay a ref for perf-safe mouse tracking
- The `useSpring` config `{ mass: 1.5, tension: 120, friction: 18 }` — this specific tuning produces the organic weight feel

---

## ✅ Integration Checklist

- [ ] Dependencies installed (`@react-three/fiber`, `@react-spring/three`, `three`)
- [ ] Component mounts without console errors
- [ ] Avatar enters with spring animation on load (~1.8s)
- [ ] Typing in input field triggers `alert` state (ears perk, forward lean)
- [ ] Sending a message triggers `reacting` state (head tilt + sparkles)
- [ ] Mouse movement moves the avatar's eye gaze
- [ ] Blink occurs naturally every few seconds
- [ ] Status dot in header changes color per state
- [ ] "HIDE / SHOW AVATAR" toggle collapses the panel smoothly
- [ ] No frame drops during rapid message sending

---

*This component is designed to be emotionally present — not decorative.*
*Treat the avatar state machine as first-class application logic, not CSS.*
