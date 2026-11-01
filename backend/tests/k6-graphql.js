import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '10s', target: 50 },  // Ramp up to 50 concurrent users
    { duration: '30s', target: 200 }, // Spike to 200 concurrent users requesting heavy GraphQL trees
    { duration: '10s', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<350'], // 95% of GraphQL queries must complete under 350ms
    http_req_failed: ['rate<0.01'],   // Error rate must be less than 1%
  },
};

// Seeded benchmark post containing 21 nested comments across 3 levels
const TARGET_POST_ID = "6ae71bb3dd6e0bfc12c23ef0";

export default function () {
  const url = 'http://localhost:5001/graphql';
  
  const payload = JSON.stringify({
    query: `
      query GetHeavyThread($postId: ID!) {
        thread(postId: $postId) {
          id
          title
          comments {
            id
            content
            author {
              username
            }
            replies {
              id
              content
              author {
                username
              }
            }
          }
        }
      }
    `,
    variables: { postId: TARGET_POST_ID },
  });

  const params = {
    headers: { 'Content-Type': 'application/json' },
  };

  const res = http.post(url, payload, params);

  check(res, {
    'is status 200': (r) => r.status === 200,
    'has data': (r) => JSON.parse(r.body).data !== undefined,
    'no graphql errors': (r) => JSON.parse(r.body).errors === undefined,
  });

  // Small sleep to simulate realistic client request frequency
  sleep(0.5);
}
