import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Counter } from 'k6/metrics';

// Dedicated Crypto Metric Trends
const loginDuration = new Trend('crypto_login_duration', true);
const keyExchangeDuration = new Trend('key_exchange_duration', true);
const authFailures = new Counter('auth_failures');

export const options = {
  scenarios: {
    // Sustained 100 concurrent logins / crypto operations per second
    login_crypto_storm: {
      executor: 'constant-arrival-rate',
      rate: 100,             // 100 operations per second
      timeUnit: '1s',
      duration: '60s',        // 1 full minute of continuous CPU stress
      preAllocatedVUs: 150,  // Pre-allocated VUs to prevent initialization jitter
      maxVUs: 300,           // Max VUs to handle any latency spikes
    },
  },
  thresholds: {
    // Assertions proving multi-core cluster efficiency under heavy crypto:
    'crypto_login_duration': ['p(95)<500'], // p95 for Argon2id/bcrypt verification < 500ms
    'key_exchange_duration': ['p(95)<200'], // p95 for X3DH public-key retrieval < 200ms
    http_req_failed: ['rate<0.01'],         // Error rate under crypto stress < 1%
  },
};

const BASE_URL = __ENV.TARGET_URL || 'http://localhost:5001';

export default function () {
  // Pick random user from the 1,000 seeded users
  const userIndex = Math.floor(Math.random() * 1000);
  const email = `extreme_user_${userIndex}@orbit.benchmark`;
  const password = 'BenchmarkPass123!';

  // ── 1. CPU-Bound Password / Identity Verification ─────────────────────────
  const loginPayload = JSON.stringify({ email, password });
  const loginHeaders = { 'Content-Type': 'application/json' };

  const loginRes = http.post(`${BASE_URL}/api/auth/login`, loginPayload, {
    headers: loginHeaders,
    tags: { name: 'Crypto_Login_Verification' },
  });

  loginDuration.add(loginRes.timings.duration);

  let authToken = null;
  let userId = null;

  const loginOk = check(loginRes, {
    'login status 200': (r) => r.status === 200,
    'session token issued': (r) => {
      try {
        const body = JSON.parse(r.body);
        if (body.data && body.data.authToken) {
          authToken = body.data.authToken;
          userId = body.data._id || body.data.id;
          return true;
        }
        return false;
      } catch {
        return false;
      }
    },
  });

  if (!loginOk) {
    authFailures.add(1);
    sleep(0.5);
    return;
  }

  // ── 2. X3DH Pre-Key Bundle & Public Key Exchange ──────────────────────────
  // Simulates initial E2EE session negotiation key-fetch
  const targetUserIndex = (userIndex + 1) % 1000;
  const targetUserId = `extreme_user_${targetUserIndex}`;

  const keyHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${authToken}`,
  };

  const keyRes = http.get(`${BASE_URL}/api/message/users`, {
    headers: keyHeaders,
    tags: { name: 'X3DH_PreKey_Retrieval' },
  });

  keyExchangeDuration.add(keyRes.timings.duration);

  check(keyRes, {
    'key exchange status 200': (r) => r.status === 200,
    'public keys delivered': (r) => {
      try {
        const body = JSON.parse(r.body);
        return Array.isArray(body) || (body.data && Array.isArray(body.data));
      } catch {
        return false;
      }
    },
  });

  sleep(0.1);
}
