import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Counter } from 'k6/metrics';

// Custom Prometheus/k6 Metric Trends
const graphqlDuration = new Trend('graphql_duration', true);
const voteDuration = new Trend('vote_duration', true);
const successfulOperations = new Counter('successful_operations');

export const options = {
  scenarios: {
    // Scenario A: 300 VUs continuously querying deep nested GraphQL thread trees
    scroller_traffic: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 300 }, // Ramp to 300 Scroller VUs
        { duration: '60s', target: 300 }, // Hold steady-state stress
        { duration: '30s', target: 0 },   // Graceful ramp-down
      ],
      exec: 'scrollerWorker',
    },
    // Scenario B: 200 VUs firing concurrent atomic Redis Lua vote mutations
    voter_traffic: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 200 }, // Ramp to 200 Voter VUs
        { duration: '60s', target: 200 }, // Hold concurrent vote contention
        { duration: '30s', target: 0 },   // Graceful ramp-down
      ],
      exec: 'voterWorker',
    },
  },
  thresholds: {
    // SLA Assertions:
    http_req_duration: ['p(95)<350'],          // Global p95 duration < 350ms
    http_req_failed: ['rate<0.0001'],          // Global failure rate < 0.01%
    'graphql_duration': ['p(95)<350'],         // Dedicated GraphQL p95 < 350ms
    'vote_duration': ['p(95)<200'],            // Dedicated Redis Lua vote p95 < 200ms
  },
};

const BASE_URL = __ENV.TARGET_URL || 'http://localhost:5001';
const BENCH_POST_ID = __ENV.BENCH_POST_ID || '6ae62db950e5fdfc90c24acb';
const AUTH_TOKEN = __ENV.AUTH_TOKEN || '';

const baseHeaders = {
  'Content-Type': 'application/json',
  ...(AUTH_TOKEN ? { 'Authorization': `Bearer ${AUTH_TOKEN}` } : {}),
};

// ── SCENARIO A: The Scroller (GraphQL Deep Tree & DataLoader Stress) ───────────
export function scrollerWorker() {
  const query = `
    query GetHeavyThread($postId: ID!) {
      thread(postId: $postId) {
        id
        title
        score
        upvotes
        downvotes
        commentCount
        author {
          id
          username
          profilePic
        }
        comments {
          id
          depth
          body
          score
          upvotes
          downvotes
          author {
            id
            username
          }
          replies {
            id
            depth
            body
            score
            author {
              id
              username
            }
            replies {
              id
              depth
              body
              score
              author {
                id
                username
              }
            }
          }
        }
      }
    }
  `;

  const payload = JSON.stringify({
    query,
    variables: { postId: BENCH_POST_ID },
  });

  const res = http.post(`${BASE_URL}/graphql`, payload, {
    headers: baseHeaders,
    tags: { name: 'GraphQL_GetThread' },
  });

  graphqlDuration.add(res.timings.duration);

  const passed = check(res, {
    'graphql status 200': (r) => r.status === 200,
    'graphql has data': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.data && body.data.thread !== undefined;
      } catch {
        return false;
      }
    },
    'graphql zero errors': (r) => {
      try {
        const body = JSON.parse(r.body);
        return !body.errors || body.errors.length === 0;
      } catch {
        return false;
      }
    },
  });

  if (passed) successfulOperations.add(1);

  // Realistic human scroll reading interval
  sleep(0.3 + Math.random() * 0.4);
}

// ── SCENARIO B: The Voter (Atomic Redis Lua Mutation Contention) ───────────────
export function voterWorker() {
  const intent = Math.random() > 0.5 ? '1' : '-1';
  const payload = JSON.stringify({ intent });

  const res = http.post(
    `${BASE_URL}/api/feed/posts/${BENCH_POST_ID}/vote`,
    payload,
    {
      headers: baseHeaders,
      tags: { name: 'HTTP_VotePost_Lua' },
    }
  );

  voteDuration.add(res.timings.duration);

  const passed = check(res, {
    'vote status 200': (r) => r.status === 200,
    'vote returns success': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.success === true;
      } catch {
        return false;
      }
    },
  });

  if (passed) successfulOperations.add(1);

  // Micro-burst voting interval
  sleep(0.2 + Math.random() * 0.3);
}
