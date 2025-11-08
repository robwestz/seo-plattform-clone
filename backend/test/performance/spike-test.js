import http from 'k6/http';
import { check, sleep } from 'k6';

/**
 * K6 Spike Testing Script
 * Tests API resilience to sudden traffic spikes
 */

export const options = {
  stages: [
    { duration: '30s', target: 10 },   // Normal load
    { duration: '10s', target: 200 },  // Sudden spike
    { duration: '1m', target: 200 },   // Sustain spike
    { duration: '30s', target: 10 },   // Drop back to normal
    { duration: '1m', target: 10 },    // Normal load
    { duration: '10s', target: 300 },  // Another spike
    { duration: '1m', target: 300 },   // Sustain spike
    { duration: '30s', target: 0 },    // Ramp down
  ],
  thresholds: {
    'http_req_duration': ['p(95)<1500'],
    'http_req_failed': ['rate<0.15'],
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:4000';

export default function () {
  const timestamp = Date.now();

  // Login attempt
  const loginRes = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({
      email: `spike${__VU}@example.com`,
      password: 'Password123!',
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  check(loginRes, {
    'spike test handled': (r) => r.status === 200 || r.status === 401,
  });

  sleep(1);
}
