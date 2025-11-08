# SEO Intelligence Platform - Test Suite

Comprehensive testing suite for the SEO Intelligence Platform backend.

## Test Structure

```
test/
├── unit/                    # Unit tests for services, controllers, utilities
├── integration/             # API endpoint integration tests
├── security/                # Security and tenant isolation tests
├── performance/             # Load and performance tests (k6)
├── helpers/                 # Test utilities and helpers
├── fixtures/                # Test data fixtures
├── setup.ts                 # Global test setup
├── .env.test               # Test environment variables
├── jest-e2e.json           # Jest E2E configuration
└── docker-compose.test.yml # Test database setup
```

## Running Tests

### Prerequisites

1. Start test databases:
```bash
cd backend/test
docker-compose -f docker-compose.test.yml up -d
```

2. Wait for services to be healthy:
```bash
docker-compose -f docker-compose.test.yml ps
```

### Unit Tests

Run all unit tests:
```bash
npm test
```

Run tests with coverage:
```bash
npm run test:cov
```

Run tests in watch mode:
```bash
npm run test:watch
```

### Integration Tests

Run E2E/integration tests:
```bash
npm run test:e2e
```

### Security Tests

Run security and tenant isolation tests:
```bash
npm test -- test/security
```

### Performance Tests

Run k6 load tests:
```bash
# Install k6 first: https://k6.io/docs/getting-started/installation/

# Basic load test
k6 run test/performance/api-load.js

# Stress test
k6 run test/performance/stress-test.js

# Spike test
k6 run test/performance/spike-test.js

# With custom API URL
k6 run -e API_URL=http://localhost:4000 test/performance/api-load.js
```

## Test Coverage Goals

- **Unit Tests**: 80%+ coverage
- **Integration Tests**: All critical API endpoints
- **Security Tests**: Multi-tenant isolation verification
- **Performance Tests**: Response times under 500ms for p95

## Writing Tests

### Unit Test Example

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { YourService } from './your.service';
import { createMockRepository } from '../test/helpers/test-helpers';

describe('YourService', () => {
  let service: YourService;
  let repository: any;

  beforeEach(async () => {
    repository = createMockRepository();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        YourService,
        { provide: getRepositoryToken(YourEntity), useValue: repository },
      ],
    }).compile();

    service = module.get<YourService>(YourService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
```

### Integration Test Example

```typescript
import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';

describe('YourController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [YourModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/your-endpoint (GET)', () => {
    return request(app.getHttpServer())
      .get('/your-endpoint')
      .expect(200);
  });
});
```

## Test Factories

Use test factories to create consistent test data:

```typescript
import { createTestUser, createTestTenant, createTestProject } from './helpers/factories';

const user = await createTestUser({ email: 'custom@example.com' });
const tenant = createTestTenant({ name: 'Custom Tenant' });
const project = createTestProject(tenant.id, { domain: 'example.com' });
```

## Debugging Tests

Debug a specific test:
```bash
npm run test:debug -- --testNamePattern="your test name"
```

## CI/CD Integration

Tests are automatically run in CI/CD pipeline:
- Unit tests on every commit
- Integration tests on pull requests
- Performance tests on staging deployments

## Troubleshooting

### Database Connection Issues

If tests fail to connect to database:
```bash
# Check if test database is running
docker-compose -f test/docker-compose.test.yml ps

# Restart test services
docker-compose -f test/docker-compose.test.yml restart
```

### Port Conflicts

If test ports are already in use:
```bash
# Stop conflicting services
docker-compose -f test/docker-compose.test.yml down

# Or modify ports in docker-compose.test.yml
```

### Memory Issues

For performance tests with high user counts:
```bash
# Increase Node.js memory
NODE_OPTIONS="--max-old-space-size=4096" npm run test:e2e
```

## Best Practices

1. **Isolation**: Each test should be independent and not rely on other tests
2. **Clean Up**: Always clean database between tests
3. **Mocking**: Mock external APIs and services
4. **Assertions**: Use clear, specific assertions
5. **Naming**: Use descriptive test names that explain what is being tested
6. **Coverage**: Aim for high coverage but focus on critical paths
7. **Performance**: Keep unit tests fast (< 100ms each)
8. **Security**: Always test tenant isolation for multi-tenant features
