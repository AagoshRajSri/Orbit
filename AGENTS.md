# AGENTS.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Repository shape
- Monorepo-style split:
  - `backend/`: Express + MongoDB + Socket.IO API.
  - `frontend/`: React (Vite) client using Zustand and Socket.IO client.
- No existing `WARP.md` or `AGENTS.md` was found.
- No Claude/Cursor/Copilot instruction files were found (`CLAUDE.md`, `.cursorrules`, `.cursor/rules/`, `.github/copilot-instructions.md`).

## Development commands
Run commands from each package directory unless noted otherwise.

### Install
- Backend: `npm install` (in `backend/`)
- Frontend: `npm install` (in `frontend/`)

### Run locally
- Backend dev server: `npm run dev` (in `backend/`)  
  - Script runs `nodemon src/index.js`.
- Frontend dev server: `npm run dev` (in `frontend/`)  
  - Script runs Vite dev server.

### Build / preview
- Frontend build: `npm run build` (in `frontend/`)
- Frontend preview production build: `npm run preview` (in `frontend/`)
- Backend has no build script (runs directly on Node ESM).

### Lint
- Frontend lint: `npm run lint` (in `frontend/`)
- Backend currently has no lint script configured.

### Tests
- No formal automated test runner is configured in `package.json` (no `test` scripts in frontend/backend).
- Existing ad-hoc backend scripts can be run directly, for example:
  - `node test-zod.js` (schema behavior check)
  - `node test-otplib.js`
  - `node test_new_conn.js` (Mongo connectivity check)
- “Single test” in this repo currently means running one of these individual node scripts directly.

## Environment and runtime notes
- Backend env template: `backend/.env.example`.
- Backend requires at least: `MONGODB_URI` (or `DB_URI`), `JWT_SECRET`, Cloudinary vars; `CONSTELLATION_PEPPER` is enforced in production.
- Cross-check port config before running:
  - Backend defaults to `process.env.PORT || 3000` (configured as `5001` in `.env`).
  - Frontend `API_URL` in `frontend/src/config.js` points to `http://localhost:5001` in development.
  - Ensure frontend API URL and backend port are aligned in local setup.

## High-level architecture
### Backend request architecture
- Entry point `backend/src/index.js` wires:
  - Security middleware (`helmet`, CORS, rate limiting, HPP, threat detection, request logging).
  - REST routes under `/api/auth`, `/api/message`, `/api/nexus`, `/api/spotify`, `/api/spotify/session`.
  - Global error handler and 404 handler.
  - Socket.IO initialization plus Spotify socket event registration.
- Common backend layering pattern:
  - `routes/*` → `controllers/*` → `models/*` and `services/*`/`lib/*`.
- Auth model:
  - Access JWT + refresh cookie session design is implemented in `backend/src/lib/utils.js` + `backend/src/models/session.model.js`.
  - `protectRoute` validates JWT and also checks session validity in DB (zero-trust session invalidation).
  - Dev bypass exists via `DEV_AUTH_BYPASS=true` in development for both HTTP and socket auth.

### Realtime architecture
- Message creation happens through HTTP controllers (`message.controller.js`, `nexus.controller.js`), then events are emitted with `getIO()`.
- Socket server (`backend/src/socket/socket.js`) handles:
  - Auth handshake from cookie or `auth.token`.
  - Presence (`getOnlineUsers`), user typing, nexus typing.
  - User personal rooms and nexus room joins/leaves.
- Spotify shared-session events are handled separately in `backend/src/socket/spotify-events.js`, with session state persisted through Spotify session services/models.

### Constellation auth subsystem
- Core flow:
  1. Client fetches nonce (`/api/auth/constellation/challenge`).
  2. Client sends edge labels (not coordinates) for signup/login.
  3. Backend canonicalizes edges and verifies via Argon2id + salt + pepper (`services/constellation.service.js`).
- Includes replay protection (nonce store), per-user lockout, per-IP failure tracking, and behavioral anomaly checks.
- API schemas for constellation auth are in `backend/src/schemas/constellation.schemas.js`.

### Frontend application architecture
- Entry: `frontend/src/main.jsx` mounts `App` with React Router.
- `frontend/src/App.jsx` is the orchestration hub for:
  - Initial auth check and guarded routing.
  - Socket event subscriptions.
  - Post-auth preload flow (`getUsers`, `getNexuses`) and loader gating.
- State management is centralized in Zustand stores:
  - `useAuthStore`: auth/session state, constellation login/signup methods.
  - `useChatStore`: 1:1 users/messages and typing state.
  - `useNexusStore`: group state, messages, membership operations.
  - `useSpotifyStore`: playback/session synchronization state.
- Network clients:
  - Axios instance in `frontend/src/lib/axios.jsx` with `withCredentials` and 401-refresh retry behavior.
  - Socket client singleton in `frontend/src/lib/socket.js`.

## Important implementation caveats
- Auth refresh expectation mismatch should be checked before refactors:
  - Frontend interceptor calls `POST /api/auth/refresh`.
  - Refresh logic exists in backend utility code (`refreshAccessToken`), but ensure route wiring exists/works in active auth routes before changing auth flow.
- A large amount of UI/performance experimentation exists (e.g. `OptimizedApp.jsx`, many visual components). Prefer tracing imports from `App.jsx` and active routes before editing unused files.
