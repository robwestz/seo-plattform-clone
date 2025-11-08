# SEO Intelligence Platform - Testing & Quality Assurance Guide

Complete testing guide for Team Iota - Testing & Quality Assurance.

## Overview

This platform has comprehensive test coverage across multiple layers:

- **Backend Unit Tests**: 80%+ coverage for services, controllers, and utilities
- **Backend Integration Tests**: API endpoint testing with real database
- **Security Tests**: Multi-tenant isolation and security verification
- **Frontend E2E Tests**: Playwright tests for critical user flows
- **Performance Tests**: k6 load testing for scalability validation

## Quick Start

### 1. Setup Test Environment

```bash
# Clone and install dependencies
cd backend
npm install

cd ../frontend
npm install

# Start test databases
cd ../backend/test
docker-compose -f docker-compose.test.yml up -d

# Verify databases are running
docker-compose -f docker-compose.test.yml ps
```

### 2. Run All Tests

```bash
# Backend tests
cd backend
npm run test:all

# Frontend E2E tests
cd frontend
npm run test:e2e

# Performance tests (requires k6)
cd backend
k6 run test/performance/api-load.js
```

## Test Structure

```
seo-intelligence-platform/
├── backend/
│   ├── test/
│   │   ├── unit/                     # Unit tests
│   │   │   ├── auth.service.spec.ts
│   │   │   ├── tenant.service.spec.ts
│   │   │   └── project.service.spec.ts
│   │   ├── integration/              # Integration tests
│   │   │   ├── auth.e2e.spec.ts
│   │   │   └── projects.e2e.spec.ts
│   │   ├── security/                 # Security tests
│   │   │   └── tenant-isolation.spec.ts
│   │   ├── performance/              # Performance tests
│   │   │   ├── api-load.js
│   │   │   ├── stress-test.js
│   │   │   └── spike-test.js
│   │   ├── helpers/                  # Test utilities
│   │   │   ├── test-helpers.ts
│   │   │   └── factories.ts
│   │   ├── fixtures/                 # Test data
│   │   ├── setup.ts                  # Global setup
│   │   ├── .env.test                 # Test environment
│   │   └── docker-compose.test.yml   # Test databases
│   └── jest.config.js                # Jest configuration
├── frontend/
│   ├── tests/
│   │   ├── e2e/                      # E2E tests
│   │   │   ├── auth.spec.ts
│   │   │   ├── keywords.spec.ts
│   │   │   └── projects.spec.ts
│   │   └── fixtures/                 # Test fixtures
│   └── playwright.config.ts          # Playwright config
└── TESTING_GUIDE.md                  # This file
```

## Backend Testing

### Unit Tests

Test individual services and components in isolation.

**Run unit tests:**
```bash
cd backend
npm run test:unit
```

**Example test file:** `/backend/test/unit/auth.service.spec.ts`

```typescript
describe('AuthService', () => {
  it('should register a new user and create tenant', async () => {
    const result = await service.register(registerDto);

    expect(result).toHaveProperty('user');
    expect(result).toHaveProperty('tenant');
    expect(result).toHaveProperty('accessToken');
  });
});
```

**Key test files:**
- `auth.service.spec.ts` - Authentication service tests
- `tenant.service.spec.ts` - Tenant management tests
- `project.service.spec.ts` - Project CRUD tests

### Integration Tests

Test API endpoints with real database connections.

**Run integration tests:**
```bash
cd backend
npm run test:integration
```

**Example:** `/backend/test/integration/auth.e2e.spec.ts`

```typescript
describe('/auth/register (POST)', () => {
  it('should register a new user and create tenant', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send(registerDto)
      .expect(201);

    expect(response.body).toHaveProperty('accessToken');
  });
});
```

**Key test files:**
- `auth.e2e.spec.ts` - Authentication endpoints
- `projects.e2e.spec.ts` - Project endpoints

### Security Tests

Verify multi-tenant data isolation and security measures.

**Run security tests:**
```bash
cd backend
npm run test:security
```

**Example:** `/backend/test/security/tenant-isolation.spec.ts`

```typescript
describe('Tenant Isolation Security Tests', () => {
  it('should not allow Tenant A to access Tenant B projects', async () => {
    await request(app.getHttpServer())
      .get(`/projects/${projectB.id}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(404);
  });
});
```

**What's tested:**
- Cross-tenant data access prevention
- SQL injection prevention
- XSS prevention
- Authentication/authorization
- Row-level security (RLS)

### Coverage Reports

**Generate coverage report:**
```bash
cd backend
npm run test:cov
```

**View HTML report:**
```bash
open coverage/lcov-report/index.html
```

**Coverage goals:**
- Branches: 80%+
- Functions: 80%+
- Lines: 80%+
- Statements: 80%+

## Frontend Testing

### E2E Tests with Playwright

Test complete user flows across the application.

**Run E2E tests:**
```bash
cd frontend
npm run test:e2e
```

**Run in UI mode (interactive):**
```bash
npm run test:e2e:ui
```

**Debug mode:**
```bash
npm run test:e2e:debug
```

**View test report:**
```bash
npm run test:e2e:report
```

**Example:** `/frontend/tests/e2e/auth.spec.ts`

```typescript
test('should register a new user successfully', async ({ page }) => {
  await page.goto(BASE_URL);
  await page.click('text=Sign Up');

  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'Password123!');
  await page.click('button[type="submit"]');

  await expect(page).toHaveURL(/.*dashboard/);
});
```

**Key test files:**
- `auth.spec.ts` - Login, registration, logout flows
- `keywords.spec.ts` - Keyword research and rank tracking
- `projects.spec.ts` - Project management

**Browsers tested:**
- Chromium (Desktop)
- Firefox (Desktop)
- WebKit/Safari (Desktop)
- Mobile Chrome
- Mobile Safari

## Performance Testing

### Load Testing with k6

Test API performance under various load conditions.

**Install k6:**
```bash
# macOS
brew install k6

# Ubuntu/Debian
sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

**Run load tests:**
```bash
cd backend

# Basic load test (10-100 users)
k6 run test/performance/api-load.js

# Stress test (up to 300 users)
k6 run test/performance/stress-test.js

# Spike test (sudden traffic spikes)
k6 run test/performance/spike-test.js

# With custom API URL
k6 run -e API_URL=http://localhost:4000 test/performance/api-load.js
```

**Performance thresholds:**
- p95 response time: < 500ms
- p99 response time: < 1000ms
- Error rate: < 10%
- Failed requests: < 5%

**Example output:**
```
✓ registration status is 201
✓ login status is 200
✓ project create status is 201

checks.........................: 100.00% ✓ 1500      ✗ 0
http_req_duration..............: avg=245ms  min=89ms   med=198ms  max=1.2s   p(95)=456ms
http_req_failed................: 0.00%   ✓ 0         ✗ 1500
```

## Test Helpers & Factories

### Test Factories

Create consistent test data easily:

```typescript
import { createTestUser, createTestTenant, createTestProject } from './helpers/factories';

// Create test user
const user = await createTestUser({
  email: 'custom@example.com',
  firstName: 'John',
});

// Create test tenant
const tenant = createTestTenant({
  name: 'Acme Corp',
  maxProjects: 10,
});

// Create test project
const project = createTestProject(tenant.id, {
  name: 'Test Project',
  domain: 'example.com',
});
```

### Test Helpers

Utility functions for common testing tasks:

```typescript
import {
  createMockRepository,
  createMockJwtService,
  generateTestToken,
  cleanDatabase,
} from './helpers/test-helpers';

// Mock repository
const repository = createMockRepository<User>();
repository.findOne.mockResolvedValue(mockUser);

// Generate auth token
const token = generateTestToken();

// Clean database between tests
await cleanDatabase([userRepository, projectRepository]);
```

## CI/CD Integration

### GitHub Actions Workflow

Tests run automatically on:
- Every commit (unit tests)
- Pull requests (unit + integration)
- Staging deployments (all tests + performance)

**Example workflow:**
```yaml
name: Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test_password

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm run test:ci

      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

## Best Practices

### 1. Test Isolation

Each test should be independent:

```typescript
beforeEach(async () => {
  // Clean database
  await userRepository.query('DELETE FROM users');
  await projectRepository.query('DELETE FROM projects');
});
```

### 2. Clear Assertions

Use descriptive assertions:

```typescript
// Good
expect(response.body.user.email).toBe('test@example.com');
expect(response.body.tenant.name).toBe('Acme Corp');

// Avoid
expect(response.body).toBeTruthy();
```

### 3. Mock External Services

Always mock external APIs:

```typescript
beforeEach(() => {
  mockExternalApis();
});

afterEach(() => {
  restoreExternalApis();
});
```

### 4. Descriptive Test Names

```typescript
// Good
it('should throw ConflictException if user already exists', async () => {});

// Avoid
it('should fail', async () => {});
```

### 5. Test Critical Paths First

Prioritize tests for:
- Authentication/authorization
- Data isolation (multi-tenancy)
- Payment/billing
- Security vulnerabilities

## Troubleshooting

### Database Connection Issues

```bash
# Check database status
docker-compose -f test/docker-compose.test.yml ps

# View logs
docker-compose -f test/docker-compose.test.yml logs postgres

# Restart services
docker-compose -f test/docker-compose.test.yml restart
```

### Port Conflicts

```bash
# Find process using port
lsof -i :5433

# Kill process
kill -9 <PID>

# Or change port in docker-compose.test.yml
```

### Test Timeouts

```typescript
// Increase timeout for slow tests
jest.setTimeout(30000);

// Or per test
it('slow test', async () => {}, 30000);
```

### Playwright Issues

```bash
# Install browsers
npx playwright install

# Update browsers
npx playwright install --force

# Debug mode
npm run test:e2e:debug
```

## Measuring Test Quality

### Code Coverage

```bash
# Generate coverage report
npm run test:cov

# View in browser
open coverage/lcov-report/index.html
```

**Target metrics:**
- Line coverage: 80%+
- Branch coverage: 80%+
- Function coverage: 80%+

### Mutation Testing

Consider adding mutation testing to verify test quality:

```bash
npm install -D @stryker-mutator/core
npx stryker run
```

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Playwright Documentation](https://playwright.dev/docs/intro)
- [k6 Documentation](https://k6.io/docs/)
- [Testing Best Practices](https://testingjavascript.com/)
- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)

## Support

For testing questions or issues:
- Check test/README.md for backend-specific docs
- Review Playwright config for E2E test settings
- Consult Team Iota members for best practices

---

**Team Iota - Testing & Quality Assurance**

*Ensuring reliability, security, and performance across the SEO Intelligence Platform*
