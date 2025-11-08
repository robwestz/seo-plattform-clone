# TEAM IOTA - TESTING & QUALITY ASSURANCE
## SEO Intelligence Platform - Comprehensive Test Suite (10,000 LOC)

---

## 🎯 YOUR MISSION
You are Team Iota, ensuring **rock-solid quality** through comprehensive testing: unit tests, integration tests, E2E tests, performance tests, and most critically - multi-tenant isolation tests.

**Target**: 10,000 lines of test code (80%+ coverage)
**Critical Success Factor**: Zero tenant data leaks, all critical paths tested

---

## 📋 YOUR RESPONSIBILITIES

### 1. Unit Tests (3,000 LOC)

**Coverage targets**:
- Services: 90%+
- Controllers: 85%+
- Utilities: 95%+

**Example** (NestJS with Jest):
```typescript
describe('TenantService', () => {
  let service: TenantService;
  let repository: Repository<Tenant>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        TenantService,
        {
          provide: getRepositoryToken(Tenant),
          useClass: Repository,
        },
      ],
    }).compile();

    service = module.get<TenantService>(TenantService);
    repository = module.get(getRepositoryToken(Tenant));
  });

  it('should create a tenant', async () => {
    const dto = { name: 'Test Tenant', slug: 'test-tenant' };
    const tenant = { id: '123', ...dto };

    jest.spyOn(repository, 'save').mockResolvedValue(tenant as any);

    const result = await service.createTenant(dto);

    expect(result).toEqual(tenant);
    expect(repository.save).toHaveBeenCalledWith(expect.objectContaining(dto));
  });

  it('should throw on duplicate slug', async () => {
    const dto = { name: 'Test', slug: 'existing' };

    jest.spyOn(repository, 'save').mockRejectedValue(
      new Error('Duplicate key')
    );

    await expect(service.createTenant(dto)).rejects.toThrow();
  });
});
```

### 2. Integration Tests (2,500 LOC)

**Test database interactions, API endpoints**:

```typescript
describe('Projects API (Integration)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Login and get token
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'password123' });

    authToken = response.body.accessToken;
  });

  it('POST /projects should create a project', () => {
    return request(app.getHttpServer())
      .post('/projects')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Test Project', domain: 'example.com' })
      .expect(201)
      .expect((res) => {
        expect(res.body).toHaveProperty('id');
        expect(res.body.name).toBe('Test Project');
      });
  });

  it('GET /projects should return user projects', () => {
    return request(app.getHttpServer())
      .get('/projects')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200)
      .expect((res) => {
        expect(Array.isArray(res.body)).toBe(true);
      });
  });
});
```

### 3. Multi-Tenant Isolation Tests (2,000 LOC)

**CRITICAL: Ensure tenant data never leaks**

```typescript
describe('Multi-Tenant Isolation', () => {
  let tenantA: Tenant;
  let tenantB: Tenant;
  let userA: User;
  let userB: User;

  beforeAll(async () => {
    // Create two separate tenants
    tenantA = await createTestTenant({ slug: 'tenant-a' });
    tenantB = await createTestTenant({ slug: 'tenant-b' });

    userA = await createTestUser({ tenantId: tenantA.id });
    userB = await createTestUser({ tenantId: tenantB.id });
  });

  it('should NOT allow tenant A to see tenant B projects', async () => {
    // Create project for tenant B
    const projectB = await createProject({
      tenantId: tenantB.id,
      name: 'Secret Project',
    });

    // Try to access as tenant A
    const tokenA = await getAuthToken(userA);

    const response = await request(app.getHttpServer())
      .get(`/projects/${projectB.id}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(404); // Should not be found (isolation)
  });

  it('should NOT allow SQL injection to bypass tenant isolation', async () => {
    const tokenA = await getAuthToken(userA);

    // Attempt SQL injection
    await request(app.getHttpServer())
      .get('/projects')
      .query({ tenantId: `${tenantB.id}' OR '1'='1` })
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200)
      .expect((res) => {
        // Should only return tenant A projects
        expect(res.body.every((p) => p.tenantId === tenantA.id)).toBe(true);
      });
  });

  it('should enforce RLS policies in database', async () => {
    // Direct database query should respect RLS
    await setTenantContext(tenantA.id);

    const projects = await projectRepository.find();

    // Should only see tenant A projects
    expect(projects.every((p) => p.tenantId === tenantA.id)).toBe(true);
  });
});
```

### 4. End-to-End Tests (1,500 LOC)

**Playwright/Cypress tests**:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Keyword Research Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('http://localhost:3000/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
  });

  test('should research keywords and add to project', async ({ page }) => {
    // Navigate to keyword research
    await page.click('text=Keyword Research');

    // Enter seed keyword
    await page.fill('input[placeholder="Enter seed keyword"]', 'seo tools');
    await page.click('button:has-text("Research")');

    // Wait for results
    await page.waitForSelector('table tbody tr');

    // Verify results loaded
    const rows = await page.locator('table tbody tr').count();
    expect(rows).toBeGreaterThan(0);

    // Select a keyword
    await page.click('table tbody tr:first-child input[type="checkbox"]');

    // Add to project
    await page.click('button:has-text("Add to Project")');

    // Verify success message
    await expect(page.locator('text=Keyword added')).toBeVisible();
  });

  test('should start rank tracking', async ({ page }) => {
    await page.goto('http://localhost:3000/rankings');

    // Add keyword to track
    await page.click('button:has-text("Track Keyword")');
    await page.fill('input[name="keyword"]', 'best seo tools');
    await page.click('button:has-text("Start Tracking")');

    // Verify tracking started
    await expect(page.locator('text=Tracking started')).toBeVisible();
  });
});
```

### 5. Performance Tests (1,000 LOC)

**Load testing with k6**:

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up to 100 users
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 200 }, // Spike to 200 users
    { duration: '5m', target: 200 }, // Stay at 200
    { duration: '2m', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% requests < 500ms
    http_req_failed: ['rate<0.01'],   // <1% failures
  },
};

export default function () {
  // Login
  const loginRes = http.post('https://api.seo.com/auth/login', {
    email: 'test@example.com',
    password: 'password123',
  });

  check(loginRes, { 'login successful': (r) => r.status === 200 });

  const token = loginRes.json('accessToken');

  // Fetch projects
  const projectsRes = http.get('https://api.seo.com/projects', {
    headers: { Authorization: `Bearer ${token}` },
  });

  check(projectsRes, { 'projects loaded': (r) => r.status === 200 });

  sleep(1);
}
```

---

## 🏗️ PROJECT STRUCTURE

```
tests/
├── unit/
│   ├── services/
│   ├── controllers/
│   └── utils/
├── integration/
│   ├── api/
│   ├── database/
│   └── multi-tenant/
├── e2e/
│   ├── flows/
│   ├── pages/
│   └── fixtures/
├── performance/
│   ├── load-tests/
│   └── stress-tests/
├── security/
│   ├── sql-injection.test.ts
│   ├── xss.test.ts
│   └── tenant-isolation.test.ts
└── helpers/
    ├── test-db.ts
    ├── factories.ts
    └── fixtures.ts
```

---

## 🔧 TECHNICAL REQUIREMENTS

### Test Coverage
- Overall: 80%+
- Critical paths: 100%
- Multi-tenant logic: 100%

### Test Execution
- Unit tests: < 30s
- Integration tests: < 2min
- E2E tests: < 10min
- Full suite: < 15min (with parallelization)

### CI Integration
- Run on every PR
- Block merge if tests fail
- Generate coverage reports
- Performance regression detection

---

## 📊 DELIVERABLES

### Test Suites
1. Unit tests (1000+ tests)
2. Integration tests (500+ tests)
3. Multi-tenant isolation tests (100+ tests)
4. E2E tests (50+ flows)
5. Performance tests (10+ scenarios)

### Test Infrastructure
- Test database setup/teardown
- Factory functions for test data
- Mock external APIs
- CI/CD integration

### Documentation
- Testing guide
- How to write tests
- Test data management
- CI/CD pipeline docs

---

## 🚀 IMPLEMENTATION PHASES

### Phase 1: Unit Tests (40 min)
### Phase 2: Integration Tests (35 min)
### Phase 3: Multi-Tenant Tests (40 min)
### Phase 4: E2E Tests (35 min)
### Phase 5: Performance Tests (30 min)

---

**GUARD THE QUALITY. TEST EVERYTHING. 🛡️**

BEGIN MEGA-FILE CREATION FOR TEAM IOTA!
