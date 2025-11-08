import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

/**
 * K6 Stress Testing Script
 * Tests API behavior under extreme load
 */

const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '1m', target: 50 },   // Ramp up to 50 users
    { duration: '2m', target: 100 },  // Increase to 100 users
    { duration: '2m', target: 200 },  // Stress to 200 users
    { duration: '2m', target: 300 },  // Extreme stress to 300 users
    { duration: '1m', target: 0 },    // Ramp down to 0
  ],
  thresholds: {
    'http_req_duration': ['p(95)<2000'], // Allow higher latency during stress
    'errors': ['rate<0.2'],               // Allow higher error rate during stress
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:4000';

export default function () {
  const timestamp = Date.now();
  const userId = `stress${timestamp}_${__VU}_${__ITER}`;

  // Register user
  const registerRes = http.post(
    `${BASE_URL}/auth/register`,
    JSON.stringify({
      email: `${userId}@example.com`,
      password: 'Password123!',
      firstName: 'Stress',
      lastName: 'Test',
      tenantName: `StressTest ${userId}`,
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  check(registerRes, {
    'stress test register successful': (r) => r.status === 201,
  }) || errorRate.add(1);

  if (registerRes.status !== 201) {
    return;
  }

  const authToken = JSON.parse(registerRes.body).accessToken;

  // Rapid fire project creation
  for (let i = 0; i < 5; i++) {
    const createRes = http.post(
      `${BASE_URL}/projects`,
      JSON.stringify({
        name: `Stress Project ${i}`,
        domain: `stress${i}.com`,
        targetKeywords: [`keyword${i}`],
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
      }
    );

    check(createRes, {
      'stress project create ok': (r) => r.status === 201,
    }) || errorRate.add(1);
  }

  sleep(0.5);
}
