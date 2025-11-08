# TEAM ALPHA - DATABASE & CORE INFRASTRUCTURE
## SEO Intelligence Platform - Foundation Team (15,000 LOC)

---

## 🎯 YOUR MISSION
You are Team Alpha, responsible for building the **rock-solid foundation** of the entire SEO Intelligence Platform. Everything depends on you getting multi-tenancy, authentication, and core services right.

**Target**: 15,000 lines of production-ready code
**Timeline**: Foundation must be complete for other teams to build on
**Critical Success Factor**: Multi-tenant isolation must be PERFECT

---

## 📋 YOUR RESPONSIBILITIES

### 1. Multi-Tenant Database Architecture (5,000 LOC)
Build the complete PostgreSQL schema with TimescaleDB extensions:

**Core Tables**:
- `tenants` - Tenant management with slug-based routing
- `users` - User accounts with role-based access control
- `projects` - Workspace concept (each tenant can have multiple projects)
- `api_keys` - API authentication tokens
- `audit_logs` - Complete audit trail
- `tenant_settings` - Flexible JSONB configuration
- `billing_accounts` - Stripe integration ready

**Row-Level Security (RLS)**:
```sql
-- Example: Every query must include tenant_id
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON projects
    FOR ALL
    TO authenticated_users
    USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
```

**Performance Indices**:
- B-tree indices on all foreign keys
- GIN indices on JSONB columns
- Partial indices for common queries
- TimescaleDB hypertables for time-series data

### 2. Authentication & Authorization Service (3,000 LOC)
Build with NestJS + Passport.js:

**Features**:
- Email/password authentication with bcrypt
- JWT token generation and validation
- Refresh token rotation
- OAuth2 integration (Google, GitHub)
- 2FA support (TOTP)
- Session management
- Password reset flow
- Email verification

**Role-Based Access Control (RBAC)**:
```typescript
enum Role {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
  VIEWER = 'viewer'
}

enum Permission {
  PROJECT_CREATE = 'project:create',
  PROJECT_DELETE = 'project:delete',
  CRAWLER_RUN = 'crawler:run',
  API_KEY_MANAGE = 'api_key:manage',
  // ... 50+ granular permissions
}
```

### 3. Event Bus & Message Queue (2,500 LOC)
Implement event-driven architecture:

**Technologies**:
- Apache Kafka for event streaming
- Redis Bull for job queues
- RabbitMQ for service communication

**Event Types**:
```typescript
interface DomainCrawledEvent {
  type: 'domain.crawled';
  tenantId: string;
  projectId: string;
  domainId: string;
  pagesFound: number;
  timestamp: Date;
}

interface RankingChangedEvent {
  type: 'ranking.changed';
  tenantId: string;
  keywordId: string;
  oldPosition: number;
  newPosition: number;
  change: number;
}
```

**Features**:
- Event sourcing for critical actions
- Dead letter queues
- Retry policies with exponential backoff
- Event replay capability

### 4. Core Service Layer (2,500 LOC)
NestJS services that all other teams will use:

**TenantService**:
```typescript
@Injectable()
export class TenantService {
  async createTenant(data: CreateTenantDto): Promise<Tenant>
  async getTenantBySlug(slug: string): Promise<Tenant>
  async updateTenantSettings(id: string, settings: object): Promise<Tenant>
  async upgradePlan(id: string, plan: PlanType): Promise<void>
  async getTenantUsage(id: string): Promise<UsageStats>
}
```

**ProjectService**:
```typescript
@Injectable()
export class ProjectService {
  async createProject(tenantId: string, data: CreateProjectDto): Promise<Project>
  async listProjects(tenantId: string): Promise<Project[]>
  async deleteProject(projectId: string): Promise<void>
  async getProjectStats(projectId: string): Promise<ProjectStats>
}
```

**Other Core Services**:
- `UserService` - User management
- `AuthService` - Authentication logic
- `PermissionService` - Authorization checks
- `AuditService` - Audit logging
- `CacheService` - Redis caching wrapper
- `EmailService` - Transactional emails

### 5. Database Migrations & Seeding (1,000 LOC)
Complete migration system:

**Migration Files** (TypeORM):
```typescript
// migrations/001-initial-schema.ts
// migrations/002-add-timescale.ts
// migrations/003-add-rls-policies.ts
// migrations/004-add-indices.ts
```

**Seed Data**:
- Development tenant with sample data
- Test users with different roles
- Sample projects and domains
- Performance test datasets (1M+ rows)

### 6. Configuration & Environment (1,000 LOC)
Robust configuration management:

**Config Structure**:
```typescript
export interface AppConfig {
  database: {
    host: string;
    port: number;
    name: string;
    ssl: boolean;
  };
  redis: {
    host: string;
    port: number;
    password?: string;
  };
  kafka: {
    brokers: string[];
    clientId: string;
  };
  auth: {
    jwtSecret: string;
    jwtExpiration: string;
    refreshTokenExpiration: string;
  };
  email: {
    provider: 'sendgrid' | 'ses';
    apiKey: string;
    fromAddress: string;
  };
}
```

**Environment Validation**:
- Zod schemas for type safety
- Required vs optional variables
- Development vs production configs
- Secrets management (AWS Secrets Manager / Vault)

---

## 🏗️ PROJECT STRUCTURE

```
backend/
├── src/
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.module.ts
│   │   │   ├── strategies/
│   │   │   │   ├── jwt.strategy.ts
│   │   │   │   ├── local.strategy.ts
│   │   │   │   └── google.strategy.ts
│   │   │   ├── guards/
│   │   │   │   ├── jwt-auth.guard.ts
│   │   │   │   ├── roles.guard.ts
│   │   │   │   └── permissions.guard.ts
│   │   │   └── decorators/
│   │   │       ├── current-user.decorator.ts
│   │   │       └── require-permission.decorator.ts
│   │   ├── tenant/
│   │   │   ├── tenant.controller.ts
│   │   │   ├── tenant.service.ts
│   │   │   ├── tenant.entity.ts
│   │   │   └── tenant.module.ts
│   │   ├── project/
│   │   │   ├── project.controller.ts
│   │   │   ├── project.service.ts
│   │   │   ├── project.entity.ts
│   │   │   └── project.module.ts
│   │   ├── user/
│   │   │   ├── user.controller.ts
│   │   │   ├── user.service.ts
│   │   │   ├── user.entity.ts
│   │   │   └── user.module.ts
│   │   └── events/
│   │       ├── event.service.ts
│   │       ├── event.module.ts
│   │       ├── producers/
│   │       │   ├── kafka.producer.ts
│   │       │   └── rabbitmq.producer.ts
│   │       └── consumers/
│   │           ├── kafka.consumer.ts
│   │           └── rabbitmq.consumer.ts
│   ├── common/
│   │   ├── middleware/
│   │   │   ├── tenant-context.middleware.ts
│   │   │   ├── logging.middleware.ts
│   │   │   └── rate-limit.middleware.ts
│   │   ├── interceptors/
│   │   │   ├── logging.interceptor.ts
│   │   │   └── transform.interceptor.ts
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts
│   │   └── pipes/
│   │       └── validation.pipe.ts
│   ├── database/
│   │   ├── migrations/
│   │   ├── seeds/
│   │   └── database.module.ts
│   ├── config/
│   │   ├── configuration.ts
│   │   ├── validation.ts
│   │   └── config.module.ts
│   ├── app.module.ts
│   └── main.ts
├── test/
│   ├── unit/
│   └── integration/
├── package.json
├── tsconfig.json
├── nest-cli.json
└── .env.example
```

---

## 🔧 TECHNICAL REQUIREMENTS

### Technologies
- **Framework**: NestJS 10+ (TypeScript)
- **Database**: PostgreSQL 15+ with TimescaleDB
- **ORM**: TypeORM
- **Authentication**: Passport.js + JWT
- **Message Queue**: Apache Kafka + Redis Bull + RabbitMQ
- **Caching**: Redis 7+
- **Validation**: class-validator + class-transformer
- **Testing**: Jest + Supertest

### Code Quality Standards
- **TypeScript**: Strict mode enabled
- **ESLint**: Airbnb config with custom rules
- **Prettier**: Consistent formatting
- **Test Coverage**: Minimum 80% for core modules
- **Documentation**: TSDoc comments for all public APIs

### Performance Requirements
- Authentication: < 100ms response time
- Database queries: < 50ms for simple queries
- Event publishing: < 10ms
- Cache hit ratio: > 90%

### Security Requirements
- OWASP Top 10 compliance
- SQL injection prevention (parameterized queries)
- XSS prevention (input sanitization)
- CSRF protection
- Rate limiting (100 req/min per user)
- Input validation on all endpoints
- Secure password hashing (bcrypt, cost factor 12)
- JWT with short expiration (15 min access, 7 day refresh)

---

## 📊 DELIVERABLES

### 1. Database Schema (Complete SQL)
- All tables with proper constraints
- All indices for performance
- Row-level security policies
- TimescaleDB hypertables setup
- Migration scripts

### 2. Core NestJS Application
- Full authentication system
- Tenant management
- Project management
- User management
- Event bus implementation
- All core services

### 3. API Endpoints
```
POST   /auth/register
POST   /auth/login
POST   /auth/refresh
POST   /auth/logout
GET    /auth/me

POST   /tenants
GET    /tenants/:slug
PATCH  /tenants/:id
GET    /tenants/:id/usage

POST   /projects
GET    /projects
GET    /projects/:id
PATCH  /projects/:id
DELETE /projects/:id

GET    /users
POST   /users
PATCH  /users/:id
DELETE /users/:id
```

### 4. Documentation
- API documentation (Swagger/OpenAPI)
- Database schema documentation
- Architecture decision records (ADRs)
- Setup and deployment guide

### 5. Tests
- Unit tests for all services
- Integration tests for API endpoints
- E2E tests for critical flows
- Load tests for performance validation

---

## 🚀 IMPLEMENTATION PHASES

### Phase 1: Database Foundation (30 min)
- Complete PostgreSQL schema
- Migration system setup
- Seed data creation

### Phase 2: Authentication (25 min)
- Auth module with JWT
- User registration/login
- Role-based access control

### Phase 3: Multi-Tenancy (25 min)
- Tenant service
- Project service
- Tenant isolation middleware

### Phase 4: Event System (20 min)
- Kafka producer/consumer
- RabbitMQ integration
- Event types definition

### Phase 5: Core Services (30 min)
- All supporting services
- Caching layer
- Email service

### Phase 6: Testing & Polish (20 min)
- Complete test suite
- Documentation
- Performance optimization

---

## 🔗 INTEGRATION POINTS

### Your APIs Used By:
- **Team Beta (Crawler)**: Project service, event bus
- **Team Gamma (SEO Analysis)**: Project service, caching
- **Team Delta (Integrations)**: Auth service, project service
- **Team Epsilon (Frontend)**: All auth endpoints
- **Team Zeta (API)**: Authentication, rate limiting
- **Team Kappa (Business)**: Tenant service, billing

### You Depend On:
- None - you are the foundation!

---

## ⚠️ CRITICAL SUCCESS FACTORS

1. **Multi-Tenant Isolation**: Test extensively - data leaks are catastrophic
2. **Performance**: Cache aggressively, optimize queries
3. **Security**: Follow OWASP guidelines religiously
4. **Scalability**: Design for 100K+ tenants
5. **Developer Experience**: Clean APIs that other teams love to use

---

## 🎯 DEFINITION OF DONE

- [ ] All database migrations run without errors
- [ ] Authentication system passes security audit
- [ ] Multi-tenant isolation verified (no data leaks)
- [ ] All core services have 80%+ test coverage
- [ ] API documentation is complete
- [ ] Performance benchmarks meet requirements
- [ ] Code passes all linting and formatting checks
- [ ] Other teams can successfully integrate

---

## 📚 RESOURCES

### Documentation
- NestJS: https://docs.nestjs.com/
- TypeORM: https://typeorm.io/
- PostgreSQL RLS: https://www.postgresql.org/docs/current/ddl-rowsecurity.html
- TimescaleDB: https://docs.timescale.com/

### Example Code
Refer to `seo-intelligence-platform/templates/seo-platform/alpha-database-mega.yaml`

---

**YOU ARE THE FOUNDATION. GET IT RIGHT, AND EVERYONE SUCCEEDS. 🚀**

BEGIN MEGA-FILE CREATION FOR TEAM ALPHA!
