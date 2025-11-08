import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

/**
 * K6 Load Testing Script
 * Tests API performance under various load conditions
 */

// Custom metrics
const errorRate = new Rate('errors');
const loginDuration = new Trend('login_duration');
const projectListDuration = new Trend('project_list_duration');
const projectCreateDuration = new Trend('project_create_duration');
const apiCalls = new Counter('api_calls');

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 10 },  // Ramp up to 10 users
    { duration: '1m', target: 50 },   // Ramp up to 50 users
    { duration: '2m', target: 50 },   // Stay at 50 users
    { duration: '1m', target: 100 },  // Spike to 100 users
    { duration: '2m', target: 100 },  // Stay at 100 users
    { duration: '30s', target: 0 },   // Ramp down to 0 users
  ],
  thresholds: {
    'http_req_duration': ['p(95)<500', 'p(99)<1000'], // 95% of requests under 500ms
    'errors': ['rate<0.1'],                            // Error rate under 10%
    'http_req_failed': ['rate<0.05'],                  // Failed requests under 5%
  },
};

// Base URL configuration
const BASE_URL = __ENV.API_URL || 'http://localhost:4000';

// Test data
const users = [];
let userCounter = 0;

/**
 * Setup function - runs once per VU
 */
export function setup() {
  console.log('Starting performance tests...');
  console.log(`Base URL: ${BASE_URL}`);
  return { timestamp: Date.now() };
}

/**
 * Main test function
 */
export default function (data) {
  const timestamp = Date.now();
  const userId = `perftest${timestamp}_${__VU}_${__ITER}`;

  let authToken;
  let tenantId;

  group('Authentication Flow', () => {
    // Register a new user
    group('User Registration', () => {
      const registerPayload = JSON.stringify({
        email: `${userId}@example.com`,
        password: 'Password123!',
        firstName: 'Perf',
        lastName: 'Test',
        tenantName: `PerfTest ${userId}`,
      });

      const registerParams = {
        headers: { 'Content-Type': 'application/json' },
        tags: { name: 'Register' },
      };

      const registerRes = http.post(
        `${BASE_URL}/auth/register`,
        registerPayload,
        registerParams
      );

      apiCalls.add(1);

      const registerSuccess = check(registerRes, {
        'registration status is 201': (r) => r.status === 201,
        'registration returns token': (r) => {
          try {
            const body = JSON.parse(r.body);
            return body.accessToken !== undefined;
          } catch {
            return false;
          }
        },
      });

      if (!registerSuccess) {
        errorRate.add(1);
        console.error(`Registration failed: ${registerRes.status} - ${registerRes.body}`);
        return;
      }

      const registerBody = JSON.parse(registerRes.body);
      authToken = registerBody.accessToken;
      tenantId = registerBody.tenant.id;
    });

    sleep(1);

    // Login with the registered user
    group('User Login', () => {
      const loginPayload = JSON.stringify({
        email: `${userId}@example.com`,
        password: 'Password123!',
      });

      const loginParams = {
        headers: { 'Content-Type': 'application/json' },
        tags: { name: 'Login' },
      };

      const loginStart = Date.now();
      const loginRes = http.post(
        `${BASE_URL}/auth/login`,
        loginPayload,
        loginParams
      );
      loginDuration.add(Date.now() - loginStart);
      apiCalls.add(1);

      check(loginRes, {
        'login status is 200': (r) => r.status === 200,
        'login returns token': (r) => {
          try {
            const body = JSON.parse(r.body);
            return body.accessToken !== undefined;
          } catch {
            return false;
          }
        },
      }) || errorRate.add(1);
    });
  });

  if (!authToken) {
    console.error('No auth token available, skipping authenticated tests');
    return;
  }

  sleep(1);

  group('Project Operations', () => {
    const authHeaders = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
    };

    // Create a project
    group('Create Project', () => {
      const projectPayload = JSON.stringify({
        name: `Test Project ${userId}`,
        domain: `testproject${__VU}${__ITER}.com`,
        targetKeywords: ['seo', 'performance', 'testing'],
        targetCountries: ['US'],
        targetLanguages: ['en'],
      });

      const createStart = Date.now();
      const createRes = http.post(
        `${BASE_URL}/projects`,
        projectPayload,
        {
          ...authHeaders,
          tags: { name: 'CreateProject' },
        }
      );
      projectCreateDuration.add(Date.now() - createStart);
      apiCalls.add(1);

      check(createRes, {
        'project create status is 201': (r) => r.status === 201,
        'project has id': (r) => {
          try {
            const body = JSON.parse(r.body);
            return body.id !== undefined;
          } catch {
            return false;
          }
        },
      }) || errorRate.add(1);
    });

    sleep(1);

    // List projects
    group('List Projects', () => {
      const listStart = Date.now();
      const listRes = http.get(
        `${BASE_URL}/projects`,
        {
          ...authHeaders,
          tags: { name: 'ListProjects' },
        }
      );
      projectListDuration.add(Date.now() - listStart);
      apiCalls.add(1);

      check(listRes, {
        'project list status is 200': (r) => r.status === 200,
        'project list is array': (r) => {
          try {
            const body = JSON.parse(r.body);
            return Array.isArray(body);
          } catch {
            return false;
          }
        },
      }) || errorRate.add(1);
    });

    sleep(1);
  });

  group('Tenant Operations', () => {
    const authHeaders = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
    };

    // Get tenant info
    group('Get Tenant', () => {
      const tenantRes = http.get(
        `${BASE_URL}/tenants/${tenantId}`,
        {
          ...authHeaders,
          tags: { name: 'GetTenant' },
        }
      );
      apiCalls.add(1);

      check(tenantRes, {
        'tenant get status is 200': (r) => r.status === 200,
        'tenant has name': (r) => {
          try {
            const body = JSON.parse(r.body);
            return body.name !== undefined;
          } catch {
            return false;
          }
        },
      }) || errorRate.add(1);
    });

    sleep(1);

    // Get tenant statistics
    group('Get Tenant Statistics', () => {
      const statsRes = http.get(
        `${BASE_URL}/tenants/${tenantId}/statistics`,
        {
          ...authHeaders,
          tags: { name: 'GetTenantStats' },
        }
      );
      apiCalls.add(1);

      check(statsRes, {
        'tenant stats status is 200': (r) => r.status === 200,
        'stats has metrics': (r) => {
          try {
            const body = JSON.parse(r.body);
            return body.totalUsers !== undefined && body.totalProjects !== undefined;
          } catch {
            return false;
          }
        },
      }) || errorRate.add(1);
    });
  });

  sleep(1);
}

/**
 * Teardown function - runs once after all iterations
 */
export function teardown(data) {
  console.log('Performance tests completed');
  console.log(`Test duration: ${(Date.now() - data.timestamp) / 1000}s`);
}

/**
 * Handle summary for custom reporting
 */
export function handleSummary(data) {
  return {
    'performance-summary.json': JSON.stringify(data, null, 2),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}

function textSummary(data, options) {
  const indent = options.indent || '';
  const enableColors = options.enableColors || false;

  let summary = '\n' + indent + '=== Performance Test Summary ===\n\n';

  if (data.metrics) {
    summary += indent + 'Metrics:\n';
    for (const [name, metric] of Object.entries(data.metrics)) {
      if (metric.values) {
        summary += indent + `  ${name}:\n`;
        summary += indent + `    avg: ${metric.values.avg?.toFixed(2)}ms\n`;
        summary += indent + `    min: ${metric.values.min?.toFixed(2)}ms\n`;
        summary += indent + `    max: ${metric.values.max?.toFixed(2)}ms\n`;
        summary += indent + `    p(95): ${metric.values['p(95)']?.toFixed(2)}ms\n`;
      }
    }
  }

  return summary;
}
