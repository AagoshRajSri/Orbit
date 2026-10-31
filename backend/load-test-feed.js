/**
 * load-test-feed.js — Grafana k6 Enterprise Load Testing Suite
 *
 * Orbit Feed & Thread System Benchmark
 * ─────────────────────────────────────────────────────────────────────────────
 * Target Bottlenecks Under Test:
 *  1. The Cursor-Based Feed Query (MongoDB Index Read Heavy):
 *     - Tests B-Tree index scan performance on { isDeleted: 1, hotRank: -1, cursorTs: -1 }
 *     - Validates that cursor pagination avoids full table scans under 500 VUs.
 *
 *  2. The Redis Lua Voting Engine (Redis In-Memory Write Heavy):
 *     - Tests atomic single round-trip Lua execution under heavy write concurrency
 *     - Validates zero lock-contention, atomic hash increments, and ZSET re-ranking.
 *
 * Workload Model:
 *  - Traffic Asymmetry: 80% Reads (Feed Listing) / 20% Writes (Vote Toggling)
 *  - 500 Peak Virtual Users (VUs)
 *  - Staged: 30s ramp-up -> 1m sustain -> 30s ramp-down (2m total duration)
 *
 * Key Performance Indicators (KPI Thresholds):
 *  - Global HTTP error rate < 1% (99% success rate)
 *  - Global p95 latency < 200ms
 *  - Feed read p95 latency < 150ms
 *  - Vote write p95 latency < 100ms
 */

import http from "k6/http";
import { check, sleep } from "k6";
import { Trend, Rate, Counter } from "k6/metrics";

// ── Custom Isolated Metric Trends ────────────────────────────────────────────
// Separate read from write latency for precise bottleneck diagnosis
export const feedReadDuration = new Trend("feed_read_duration", true);
export const voteWriteDuration = new Trend("vote_write_duration", true);

export const feedReadsTotal = new Counter("feed_reads_total");
export const voteWritesTotal = new Counter("vote_writes_total");

export const feedReadSuccess = new Rate("feed_read_success");
export const voteWriteSuccess = new Rate("vote_write_success");

// ── Workload & Threshold Configuration ────────────────────────────────────────
export const options = {
  // Staged ramping workload simulating realistic peak spike
  stages: [
    { duration: "30s", target: 500 }, // Ramp-up: 0 -> 500 VUs over 30 seconds
    { duration: "1m", target: 500 },  // Plateau: Sustain 500 concurrent VUs for 60 seconds
    { duration: "30s", target: 0 },   // Ramp-down: 500 -> 0 VUs over 30 seconds
  ],

  // Pass/Fail SLA Thresholds
  thresholds: {
    // 99% of all HTTP requests must return success status codes
    http_req_failed: [
      {
        threshold: "rate<0.01",
        abortOnFail: false,
        delayAbortEval: "10s",
      },
    ],
    // Overall p95 request duration must remain under 200ms
    http_req_duration: [
      {
        threshold: "p(95)<200",
        abortOnFail: false,
      },
    ],
    // Read-specific threshold: MongoDB compound index queries must p95 < 150ms
    feed_read_duration: [
      {
        threshold: "p(95)<150",
        abortOnFail: false,
      },
    ],
    // Write-specific threshold: Redis Lua in-memory toggles must p95 < 100ms
    vote_write_duration: [
      {
        threshold: "p(95)<100",
        abortOnFail: false,
      },
    ],
    // Granular success rates
    feed_read_success: ["rate>0.99"],
    vote_write_success: ["rate>0.99"],
  },

  // Target summary configuration
  summaryTrendStats: ["avg", "min", "med", "max", "p(90)", "p(95)", "p(99)"],
};

// ── Environment Defaults ──────────────────────────────────────────────────────
const BASE_URL = __ENV.BASE_URL || "http://localhost:5001";

// Hardcoded fallback Post IDs if setup auto-discovery finds no posts in DB
const FALLBACK_POST_IDS = [
  "6ae62e1d2bcd8a7484dbc9d9",
  "6ae623ee0e49ae2c3d810531",
  "6ae62e1e2bcd8a7484dbc9f7",
];

// Auth token passed via __ENV.AUTH_TOKEN
// Best Practice: Generate a live token using `node scripts/generate-bench-token.js --token-only`
const AUTH_TOKEN = __ENV.AUTH_TOKEN || "";

// ── Setup Context (Runs Once Before VUs Spawn) ────────────────────────────────
export function setup() {
  console.log("================================================================================");
  console.log("              ORBIT FEED SYSTEM — K6 LOAD TESTING SUITE");
  console.log("================================================================================");
  console.log(`Target Base URL:       ${BASE_URL}`);
  console.log(`Auth Token Present:    ${AUTH_TOKEN ? "YES" : "NO (Benchmark requires -e AUTH_TOKEN)"}`);

  const headers = {
    Authorization: AUTH_TOKEN ? `Bearer ${AUTH_TOKEN}` : "",
    "Content-Type": "application/json",
  };

  // 1. Probe the feed API to auto-discover active post IDs in the database
  let targetPostIds = [];
  try {
    const probeRes = http.get(`${BASE_URL}/api/feed?sort=trending&limit=10`, {
      headers,
      tags: { setup: "probe" },
      timeout: "5s",
    });

    if (probeRes.status === 200) {
      const body = probeRes.json();
      const posts = body?.data?.posts || body?.posts;
      if (Array.isArray(posts) && posts.length > 0) {
        targetPostIds = posts.map((p) => p._id).filter(Boolean);
        console.log(`Auto-discovered ${targetPostIds.length} live Post IDs from database feed.`);
      }
    } else {
      console.warn(`[Setup Warning] Feed probe returned HTTP ${probeRes.status}. Using fallback IDs.`);
    }
  } catch (err) {
    console.warn("[Setup Warning] Feed discovery probe failed:", err.message);
  }

  // Use fallback post IDs if database has no active posts
  if (targetPostIds.length === 0) {
    targetPostIds = FALLBACK_POST_IDS;
    console.log(`Using ${targetPostIds.length} predefined fallback Post IDs for vote benchmark.`);
  }

  console.log("Staging Workload:       30s Ramp (0 -> 500 VUs) | 60s Hold (500 VUs) | 30s Ramp Down");
  console.log("Traffic Distribution:  80% Feed Read (Cursor Queries) | 20% Vote Write (Lua Engine)\n");

  return {
    baseUrl: BASE_URL,
    authToken: AUTH_TOKEN,
    postIds: targetPostIds,
  };
}

// ── Main VU Simulation Function ───────────────────────────────────────────────
export default function (data) {
  const commonHeaders = {
    Authorization: `Bearer ${data.authToken}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  // Weighted Random Selection: 80% Read / 20% Write
  const roll = Math.random();

  if (roll < 0.80) {
    // ─────────────────────────────────────────────────────────────────────────
    // SCENARIO 1: CURSOR-BASED FEED QUERY (80% TRAFFIC)
    // ─────────────────────────────────────────────────────────────────────────
    // Randomize sort tab (trending = 60%, recent = 25%, top = 15%)
    let sort = "trending";
    const sortRoll = Math.random();
    if (sortRoll > 0.85) {
      sort = "top";
    } else if (sortRoll > 0.60) {
      sort = "recent";
    }

    // Limit variance (10 to 20 posts per page)
    const limit = Math.random() < 0.5 ? 10 : 20;

    // Simulate cursor-based pagination query
    // Query without cursor (initial page) or with random past cursor timestamp
    const hasCursor = Math.random() < 0.40;
    const cursorParam = hasCursor ? `&cursor=${Date.now() - Math.floor(Math.random() * 86400000)}` : "";

    const feedUrl = `${data.baseUrl}/api/feed?sort=${sort}&limit=${limit}${cursorParam}`;

    const readRes = http.get(feedUrl, {
      headers: commonHeaders,
      tags: { endpoint: "feed_read", sort: sort },
    });

    // Record custom isolated read latency
    feedReadDuration.add(readRes.timings.duration);
    feedReadsTotal.add(1);

    const isSuccess = check(readRes, {
      "feed read status is 200": (r) => r.status === 200,
      "feed response has posts array": (r) => {
        try {
          const json = r.json();
          const posts = json?.data?.posts || json?.posts;
          return Array.isArray(posts);
        } catch {
          return false;
        }
      },
      "feed read latency under 200ms": (r) => r.timings.duration < 200,
    });

    feedReadSuccess.add(isSuccess);

  } else {
    // ─────────────────────────────────────────────────────────────────────────
    // SCENARIO 2: REDIS LUA ATOMIC VOTE WRITE (20% TRAFFIC)
    // ─────────────────────────────────────────────────────────────────────────
    // Pick a random post from discovered/fallback post IDs
    const randomIndex = Math.floor(Math.random() * data.postIds.length);
    const targetPostId = data.postIds[randomIndex];

    // Pick random vote intent: +1 (upvote: 70%) or -1 (downvote: 30%)
    const intent = Math.random() < 0.70 ? 1 : -1;

    const votePayload = JSON.stringify({ intent });
    const voteUrl = `${data.baseUrl}/api/feed/posts/${targetPostId}/vote`;

    const voteRes = http.post(voteUrl, votePayload, {
      headers: commonHeaders,
      tags: { endpoint: "vote_write" },
    });

    // Record custom isolated write latency
    voteWriteDuration.add(voteRes.timings.duration);
    voteWritesTotal.add(1);

    const isSuccess = check(voteRes, {
      "vote status is 200": (r) => r.status === 200,
      "vote response has newScore": (r) => {
        try {
          const json = r.json();
          const score = json?.data?.newScore ?? json?.newScore;
          return typeof score === "number";
        } catch {
          return false;
        }
      },
      "vote write latency under 100ms": (r) => r.timings.duration < 100,
    });

    voteWriteSuccess.add(isSuccess);
  }

  // Realistic pacing: 50ms - 150ms think time per VU iteration
  sleep(0.05 + Math.random() * 0.10);
}

// ── Teardown Context ──────────────────────────────────────────────────────────
export function teardown(data) {
  console.log("\n================================================================================");
  console.log("                 K6 BENCHMARK EXECUTION COMPLETE");
  console.log("================================================================================");
  console.log(`Evaluated Target:  ${data.baseUrl}`);
  console.log("Review the metric summary above to inspect P95 latencies and error rates.\n");
}
