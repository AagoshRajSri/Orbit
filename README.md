<div align="center">

# ✦ Orbit

### *Transmit. Connect. Quantize.*

<br />

[![Node.js](https://img.shields.io/badge/Node.js-v18+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-v18+-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![MongoDB](https://img.shields.io/badge/MongoDB-Latest-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://mongodb.com)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-v4.8+-010101?style=for-the-badge&logo=socket.io&logoColor=white)](https://socket.io)
[![Vercel](https://img.shields.io/badge/Frontend-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com)
[![Render](https://img.shields.io/badge/Backend-Render-46E3B7?style=for-the-badge&logo=render&logoColor=black)](https://render.com)

<br />

> **Orbit** is an immersive, real-time messaging platform built for people who want more than a chat app.  
> It features a **Constellation Authentication** system, **Nexus** group spaces, a **Spotify sync engine**,  
> and a rich multi-theme UI — all deployed on a zero-trust security architecture.

<br />

[**Live Demo →**](https://orbitnexus.vercel.app) &nbsp;|&nbsp; [**Backend API →**](https://orbit-ajgs.onrender.com)

</div>

---

## 📸 Overview

Orbit is a full-stack, production-deployed chat application that reimagines what identity and connection look like in a modern web app. Instead of a password, users authenticate by drawing a personal star pattern on a constellation canvas — a cryptographic pattern unique to them. Once inside, they can chat 1-on-1, create group **Nexuses**, sync music with friends, and fully customize their experience with 5+ live themes.

---

## ✨ Feature Highlights

### 🔐 Authentication & Identity

| Feature | Description |
|---|---|
| **Constellation Auth** | Zero-knowledge pattern-based login. Users draw a star sequence on a randomized canvas. The edge labels form a canonical hash using **Argon2id** + per-user salt + server pepper. |
| **StarWeave Auth** | An alternative gesture-based login with animated star trails |
| **Email Verification** | 6-digit OTP sent via SMTP on signup. Verification required before access is granted. |
| **JWT Sessions** | Stateless access tokens + refresh cookie rotation. Session IDs validated server-side (zero-trust). |
| **Replay Protection** | Per-request nonce store prevents credential replay attacks |
| **Lockout & Rate Limiting** | Per-user, per-IP lockout with behavioral anomaly scoring |

### 💬 Real-Time Messaging

- **Instant delivery** via Socket.IO with zero polling overhead
- **Typing indicators** for both 1-on-1 and group conversations
- **Live presence** — see who's online across the entire platform
- **Read receipts** and message seen tracking
- **Edit & delete** messages with real-time sync to all clients
- **Offline queue** — messages sent while offline are retried on reconnect

### 🪐 Nexus — Group Spaces

- Create **private group channels** with unique invite codes
- **Live member list** with real-time join/leave events
- **Admin controls**: kick, rename, dissolve group
- **Group typing indicators** showing who is composing
- Full **message history** persisted to MongoDB

### 🎵 Spotify Sync

- Connect your Spotify account via OAuth
- **Shared listening sessions** — sync playback across multiple users in real time
- Live **Now Playing** widget that floats in the chat UI
- Full session state persistence across reconnects

### 🎨 Themes & UI

- **15+ fully animated themes** including: Dark, AMOLED, Cyberpunk, Gamer, Pastel Dream, Light
- Per-theme **ambient music** with crossfade transitions
- **Glassmorphism** aesthetic with micro-animations and GSAP transitions
- **Mobile-first**, fully responsive across all screen sizes
- Theme preference persisted per-user

### 🖼️ Rich Media

- **Image upload** with Cloudinary CDN and automatic optimization
- **GIF search** via GIPHY integration
- Lazy loading with blur-up placeholders
- Real-time upload progress indicator

### 🛡️ Security Architecture

- `helmet` — Comprehensive HTTP security headers
- `hpp` — HTTP Parameter Pollution prevention
- `express-rate-limit` — Multi-tier rate limiting on all auth routes
- **Zod** schema validation on every incoming request
- MongoDB sanitization against NoSQL injection
- **CORS strict mode** — whitelist-only cross-origin policy
- Threat detection middleware with per-IP scoring
- Audit logging for all critical auth operations

---

## 🏗️ Architecture

```
Orbit/
├── backend/                    # Express + Socket.IO API
│   └── src/
│       ├── controllers/        # Route handlers (auth, message, nexus, spotify)
│       ├── lib/                # DB, Redis, mailer, OTP, utils
│       ├── middleware/         # Auth, rate-limit, error, threat-detection
│       ├── models/             # Mongoose schemas
│       ├── routes/             # Express routers
│       ├── schemas/            # Zod validation schemas
│       ├── services/           # Constellation & security services
│       └── socket/             # Socket.IO handlers + Spotify events
│
└── frontend/                   # React (Vite) SPA
    └── src/
        ├── components/         # Reusable UI components
        ├── constants/          # Theme configs, audio maps
        ├── contexts/           # React context providers
        ├── hooks/              # Custom hooks
        ├── lib/                # Axios, Socket client, SoundManager
        ├── pages/              # Route-level page components
        ├── store/              # Zustand state stores
        └── themes/             # 15+ animated theme components
```

### Request Flow

```
Browser → Vercel CDN → React SPA
                           │
                           ├─ REST  → Render (Express) → MongoDB
                           └─ WS    → Render (Socket.IO) → Redis (optional)
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- MongoDB URI (Atlas or local)
- Cloudinary account (for image uploads)
- Gmail account with App Password (for email verification)

### 1. Clone the Repository

```bash
git clone https://github.com/AagoshRajSri/Orbit.git
cd Orbit
```

### 2. Backend Setup

```bash
cd backend
npm install
cp .env.example .env   # Fill in your values
npm run dev            # Starts on port 5001
```

**`backend/.env` variables:**

| Variable | Description |
|---|---|
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret for signing access tokens |
| `CONSTELLATION_PEPPER` | Server-side pepper for constellation hashing |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `FRONTEND_URL` | Your Vercel frontend URL (for CORS) |
| `SMTP_USER` | Gmail address for sending emails |
| `SMTP_PASS` | Gmail 16-character App Password |
| `SMTP_FROM` | `"Orbit" <your@gmail.com>` |
| `NODE_ENV` | `development` or `production` |

### 3. Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env   # Fill in your values
npm run dev            # Starts on http://localhost:5173
```

**`frontend/.env` variables:**

| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend URL (e.g. `http://localhost:5001`) |

---

## 🌐 Deployment

### Backend → Render

1. Connect your GitHub repo to Render as a **Web Service**
2. Set **Root Directory** to `backend`
3. Set **Build Command**: `npm install`
4. Set **Start Command**: `npm start`
5. Add all environment variables from the table above
6. Set `NODE_ENV=production`

### Frontend → Vercel

1. Connect your GitHub repo to Vercel
2. Set **Root Directory** to `frontend`
3. Set **Framework**: Vite
4. Add `VITE_API_URL` pointing to your Render backend URL
5. Vercel auto-detects the `vercel.json` for SPA routing

---

## 🔑 Auth Methods

### Standard Email/Password
Register with email, username, and a strong password. A **6-digit OTP** is sent to your inbox — enter it to activate your account.

### ✦ Constellation Auth
1. Request a **nonce** from the server (prevents replay)
2. Draw your star pattern on the interactive canvas
3. The sequence of edge labels is **canonicalized** and hashed with Argon2id
4. The hash is verified server-side — no pattern data is ever stored

### StarWeave Gesture Auth
An alternative hand-gesture style authentication using animated star trails for users who prefer a visual login experience.

---

## 📡 API Overview

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/signup` | Create account + send OTP |
| `POST` | `/api/auth/login` | Login with email + password |
| `POST` | `/api/auth/verify-email` | Submit OTP to verify account |
| `POST` | `/api/auth/resend-verification` | Resend verification OTP |
| `POST` | `/api/auth/refresh` | Rotate access token via refresh cookie |
| `GET` | `/api/auth/check` | Validate current session |
| `POST` | `/api/auth/logout` | Invalidate session |
| `POST` | `/api/auth/forgot-password` | Request password reset OTP |
| `POST` | `/api/auth/reset-password` | Apply new password |
| `GET` | `/api/auth/constellation/challenge` | Fetch nonce for constellation auth |
| `POST` | `/api/auth/constellation/signup` | Constellation signup |
| `POST` | `/api/auth/constellation/login` | Constellation login |
| `GET` | `/api/message/:userId` | Fetch 1-on-1 messages |
| `POST` | `/api/message/send/:userId` | Send a direct message |
| `GET` | `/api/nexus` | List user's nexuses |
| `POST` | `/api/nexus` | Create a nexus |
| `GET` | `/health` | Backend health check |

---

## ⚡ Socket Events

| Event | Direction | Description |
|---|---|---|
| `newMessage` | Server → Client | New direct message received |
| `newNexusMessage` | Server → Client | New group message received |
| `userTyping` | Bidirectional | Typing indicator for DMs |
| `nexusTyping` | Bidirectional | Typing indicator for Nexus |
| `getOnlineUsers` | Server → Client | Current online user list |
| `messageSeen` | Server → Client | Message read receipt |
| `nexusJoined` | Server → Client | User added to a Nexus |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, Zustand, React Router v6 |
| **Styling** | Vanilla CSS, DaisyUI, GSAP, Glassmorphism |
| **Backend** | Node.js, Express 5, Socket.IO 4 |
| **Database** | MongoDB (Mongoose) |
| **Cache / PubSub** | Redis (optional, falls back to in-memory) |
| **Auth** | JWT, Argon2id, bcrypt, Zod |
| **Media** | Cloudinary, GIPHY API |
| **Email** | Nodemailer (SMTP / Gmail) |
| **Music** | Spotify Web API + OAuth |
| **Deployment** | Vercel (frontend), Render (backend) |

---

## 📄 License

MIT © 2025 Aagosh Raj Srivastava

---

<div align="center">
  <sub>Built with intention · Secured by design · ✦ Orbit</sub>
</div>
