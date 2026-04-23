# 🌌 Orbit 
**Transmit. Connect. Quantize.**

<div align="center">
  <br />
  <img src="https://img.shields.io/badge/Node.js-v18+-green?style=flat-square" />
  <img src="https://img.shields.io/badge/React-v18+-blue?style=flat-square" />
  <img src="https://img.shields.io/badge/MongoDB-Latest-green?style=flat-square" />
  <img src="https://img.shields.io/badge/Socket.IO-v4.8+-red?style=flat-square" />
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=flat-square" />
  <br />
  <br />
  <p>
    <b>Orbit</b> is an immersive, real-time chat platform featuring an unprecedented <b>Constellation Authentication</b> system, seamless <b>Nexus</b> group chats, and a heavily optimized GSAP-animated glassmorphism UI.
  </p>
  <p>Built with security-first architecture, intensive GSAP animations, and comprehensive accessibility support.</p>
</div>

---

## ✨ Core Features

### 🌟 Authentication & Identity

- **Constellation Authentication (Zero-Trust):** A groundbreaking password-less login system where users physically draw a unique star sequence on a randomized, interactive canvas. The drawn shape creates a deterministic cryptographic hash using Argon2id for ultra-secure identification.
- **STAR Identity System:** Persistent user profiles with constellation mapping, customizable avatars, and secure session management.
- **Session Persistence:** Stateless JWT-based sessions with automatic refresh and secure cookie storage.
- **Rate Limiting & Threat Detection:** Multi-layer rate limiting and real-time threat detection to prevent abuse.

### 💬 Real-Time Communication

- **Socket.IO Integration:** Instantaneous message delivery, typing indicators, and live presence tracking with zero polling overhead.
- **Typing Indicators:** Real-time visual feedback when users are typing.
- **Presence Awareness:** See who's online across the entire platform.
- **Message History:** Full message persistence with rich media support.
- **Read Receipts:** Track message delivery status.

### 🪐 Nexus Group Chats

- **Private Group Spaces:** Create and manage group chat spaces with unique invite codes.
- **Live Member Tracking:** Real-time member count and active participant list.
- **Group Typing Indicators:** See when group members are typing.
- **Admin Controls:** Host-level administration for group management.
- **Persistent Conversations:** Group messages saved and searchable.

### 🎨 Production UI/UX

- **Responsive Design System:** Mobile-first, fully responsive across all device types (mobile, tablet, desktop, ultra-wide).
- **Device-Aware Animations:** Automatic animation complexity adaptation based on device capabilities.
- **Glassmorphism Aesthetic:** TailwindCSS + DaisyUI with sophisticated microinteractions.
- **Accessibility First:** Full keyboard navigation, screen reader support, reduced-motion preferences.
- **Dark/Light Themes:** 15+ theme options with persistent user preference.

### 🖼️ Rich Media Support

- **Image Upload & Compression:** Native Cloudinary integration with automatic optimization.
- **GIPHY Integration:** Search and embed GIFs directly in chat streams.
- **Lazy Loading:** Optimized image loading with fallback handling.
- **Progress Indicators:** Real-time upload progress tracking.

### 🚀 Performance & Optimization

- **Device Tier Detection:** Automatic detection of CPU cores, memory, network type, battery level, and screen refresh rate.
- **Adaptive Animations:** Spring animations automatically adjust stiffness/damping based on device tier.
- **API Resilience:** Automatic retry logic (3x with exponential backoff), GET request caching (5 min TTL), and health monitoring.
- **Error Boundaries:** Component-level error catching prevents full-app crashes.
- **Offline Support:** Automatic offline mode detection with graceful degradation and cached functionality.

### 🛡️ Security Architecture

- **Helmet Middleware:** Comprehensive HTTP security headers.
- **Zod Validation:** Strict schema validation on all endpoints (no invalid data accepted).
- **NoSQL Injection Protection:** MongoDB sanitization and parameterized queries.
- **CORS Strict Mode:** Whitelist-based cross-origin resource sharing.
- **HTTP Parameter Pollution Prevention:** `hpp` middleware guards against parameter ambiguity attacks.
- **JWT with Argon2id:** Industry-standard hashing for password-less authentication.
- **Nonce-Based Auth:** One-time use nonce generation for replay attack prevention.
- **Audit Logging:** Comprehensive logging of authentication and critical operations.

---

### 🧩 Constellation Authentication
A revolutionary zero-trust security layer.
*   **Pattern Entropy**: Uses canonical edge-label verification instead of traditional passwords.
*   **High Security**: Argon2id hashing with per-user salt and pepper fortification.
*   **Replay Protection**: Integrated nonce-store and behavioral anomaly checks.

### Frontend
