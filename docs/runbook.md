# Orbit Production Operations & Deployment Runbook

This document defines standard operating procedures (SOPs) for site reliability engineers (SREs), DevOps engineers, and backend operators running Orbit in production environments.

---

## 1. Pre-Flight Environment Configuration Audit

Before launching or restarting the backend cluster, verify that all mandatory environment variables are present and meet cryptographic length requirements.

### Required Environment Variables

| Variable | Requirement | Purpose / Impact if Missing |
| :--- | :--- | :--- |
| `PORT` | Integer (default: `5001`) | Network port for HTTP and WebSocket ingress. |
| `NODE_ENV` | `production` | Enables production security headers, disables dev auth bypass, and enforces strict cookie policies. |
| `MONGODB_URI` / `DB_URI` | Valid MongoDB connection string | Primary persistent storage for users, messages, and materialized comment trees. |
| `REDIS_URL` | Valid Redis URI (`redis://...`) | In-memory atomic voting state, room pub/sub mesh, session challenges, and dirty post write queues. |
| `JWT_SECRET` | String (minimum 32 characters) | Signs and verifies user session JWTs. Tokens fail verification if changed or missing. |
| `CONSTELLATION_PEPPER` | String (minimum 32 characters) | Server-side cryptographic pepper for star-pattern biometric hashes. Enforced in production. |
| `STARWEAVE_SECRET` | String (minimum 32 characters) | HMAC key for Stellar Cipher biometric challenges. |
| `FRONTEND_URL` | URL (e.g., `https://orbitnexus.vercel.app`) | Configures CORS origins and allowed headers. |
| `DEV_AUTH_BYPASS` | Must be `false` in production | Dev-only bypass. When `true`, permits unauthorized root access (strict security risk). |

### Pre-Flight Verification Script
Run the automated environment and cryptographic integration check:
```bash
# In backend/ directory:
npm run verify
```
This executes `strict-orbit-verify.js` which verifies database connectivity, Redis atomic Lua execution, and Materialized Path index evaluations.

---

## 2. Cluster Lifecycle & Process Management

Orbit is designed to run across all available CPU cores using native Node.js clustering with round-robin socket scheduling (`cluster.SCHED_RR`), bypassing OS thread starvation.

### Method A: Native Clustered Runner (Recommended for Bare Metal & Cloud VMs)
```bash
# In backend/ directory:
npm run cluster
```
* **Process Model:** Spawns a Primary Master (`cluster.isPrimary`) that forks $N$ worker processes (matching `os.cpus().length`).
* **Auto-Healing:** If any worker exits due to an unhandled exception or OOM, the primary logs the signal and immediately calls `cluster.fork()` to respawn a replacement worker without dropping other active cores.
* **Dirty Post Worker:** Background MongoDB write-flushing is pinned exclusively to Worker 0 to prevent cross-worker database contention.

### Method B: PM2 Enterprise Process Manager
For environments requiring process daemonization, log rotation, and cluster supervision:

#### Create or Verify `backend/ecosystem.config.cjs`:
```javascript
module.exports = {
  apps: [
    {
      name: "orbit-cluster",
      script: "src/cluster.js",
      instances: 1, // cluster.js handles multi-core workers internally
      exec_mode: "fork",
      env_production: {
        NODE_ENV: "production",
        PORT: 5001,
      },
      max_memory_restart: "500M",
      exp_backoff_restart_delay: 100,
      listen_timeout: 10000,
      kill_timeout: 5000,
    },
  ],
};
```

#### Production PM2 Commands:
```bash
# Start cluster in production:
pm2 start ecosystem.config.cjs --env production

# Live terminal monitoring (CPU, memory per worker):
pm2 monit

# Inspect real-time consolidated logs:
pm2 logs orbit-cluster --lines 100

# Zero-downtime reload:
pm2 reload orbit-cluster

# Graceful stop:
pm2 stop orbit-cluster
```

---

## 3. Health & Telemetry Endpoint Verification

Orbit provides a low-overhead health check endpoint designed for container orchestrators (Kubernetes, AWS ECS, Render, Docker Swarm) and external synthetic ping monitors (Datadog, BetterUptime).

### Querying the Health Endpoint
```bash
curl -s http://localhost:5001/health | jq
```

### Reference Implementation (`backend/src/index.js:L230-L243`)
The health endpoint executes directly on the HTTP server without blocking session middleware:
```javascript
app.get("/health", async (req, res) => {
  const startTime = Date.now();
  const mongoStatus = global.mongoose?.connections?.some(c => c.readyState === 1) ? "connected" : "disconnected";
  const redisStatus = isRedisAvailable ? "connected" : "disconnected";
  const socketStatus = global.io?.sockets?.sockets?.size > 0 ? "active" : "inactive";

  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: { mongodb: mongoStatus, redis: redisStatus, socketio: socketStatus },
    responseTime: Date.now() - startTime,
  });
});
```

### Telemetry Field Interpretation

| Response Field | Expected Healthy Value | Degraded / Failure Value | Operator Interpretation & Action |
| :--- | :--- | :--- | :--- |
| `status` | `"ok"` | `"error"` | Overall application container health. |
| `services.mongodb` | `"connected"` | `"disconnected"` | Checked via `mongoose.connections[0].readyState === 1`. If `"disconnected"`, check MongoDB Atlas network rules and Mongoose pool exhaustion. |
| `services.redis` | `"connected"` | `"disconnected"` | Checked via `isRedisAvailable`. If `"disconnected"`, Redis voting and real-time fan-out are degraded. System operates in read-only fallback mode. |
| `services.socketio` | `"active"` or `"inactive"` | N/A | Reflects whether any active client WebSockets are connected to this instance. `"inactive"` is normal if no clients are currently connected. |
| `responseTime` | `< 10ms` (typically `0-2ms`) | `> 500ms` | Indicates Node.js event-loop lag or blocking synchronous operations. |
| `uptime` | Incremental integer (seconds) | `< 60s` | If uptime constantly resets, workers are crash-looping. Inspect error logs. |

---

## 4. Incident Response & Troubleshooting Playbook

### Scenario A: MongoDB Connection Pool Saturation
* **Symptom:** `responseTime` increases on `GET /health`, and application logs show `MongoServerSelectionError` or request queue timeouts.
* **Root Cause:** Default Mongoose driver caps `maxPoolSize: 10`. Under high VU spikes, requests block waiting for available connections.
* **Resolution:** Ensure `backend/src/lib/db.js` has configured pool scaling:
  ```javascript
  maxPoolSize: 200,
  minPoolSize: 20,
  maxIdleTimeMS: 45000,
  ```
  If Atlas alerts show high connection counts, scale Atlas tier or deploy MongoDB Atlas Connection Proxing.

### Scenario B: Redis Node Down / Intermittent
* **Symptom:** `services.redis` reports `"disconnected"`.
* **Root Cause:** Redis cloud instance restart, memory limits, or network timeout.
* **Resolution:** 
  1. Orbit includes a graceful in-memory degradation flag (`isRedisAvailable`). The server will not crash, but vote mutations and live presence will fall back to local worker memory.
  2. Check Redis memory with `redis-cli INFO memory`. If `used_memory` approaches `maxmemory`, configure `volatile-lru` or flush expired challenge keys.

### Scenario C: Socket Ping Timeout Loop
* **Symptom:** Client logs show rapid `[Socket.IO] Disconnected: ping timeout` every 5–10 seconds.
* **Root Cause:** Server `pingTimeout` is set too low (e.g., 2.5s) for high-latency internet routes.
* **Resolution:** In `backend/src/index.js`, ensure server configuration maintains:
  ```javascript
  pingInterval: 25000,
  pingTimeout: 20000,
  transports: ["polling", "websocket"],
  ```

---

## 5. Rollout & Zero-Downtime Deployment Checklist

1. [ ] Build frontend production bundle: `npm run build` in `frontend/`.
2. [ ] Validate tests: `npm run test` and `npx playwright test`.
3. [ ] Verify backend database migrations and indexes (`strict-orbit-verify.js`).
4. [ ] Trigger zero-downtime rolling reload: `pm2 reload orbit-cluster`.
5. [ ] Execute curl to `GET /health` to assert `"status": "ok"` and `"services.mongodb": "connected"`.
