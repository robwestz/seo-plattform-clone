# Backend Architecture - SEO Intelligence Platform

## Architecture Overview

This backend follows a **layered architecture** with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────┐
│                    API Layer (Controllers)               │
│  ┌──────────┬──────────┬──────────┬──────────┬────────┐ │
│  │  Auth    │  Tenant  │  User    │ Project  │ Events │ │
│  └──────────┴──────────┴──────────┴──────────┴────────┘ │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│              Middleware & Guards Layer                   │
│  ┌────────────┬──────────────┬──────────────────────┐   │
│  │ JWT Guard  │ Roles Guard  │ Tenant Context       │   │
│  └────────────┴──────────────┴──────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│              Business Logic Layer (Services)             │
│  ┌──────────┬──────────┬──────────┬──────────┬────────┐ │
│  │  Auth    │  Tenant  │  User    │ Project  │ Events │ │
│  └──────────┴──────────┴──────────┴──────────┴────────┘ │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│               Data Access Layer (TypeORM)                │
│  ┌──────────┬──────────┬──────────┬────────────────┐   │
│  │  Tenant  │   User   │ Project  │  UserTenant    │   │
│  └──────────┴──────────┴──────────┴────────────────┘   │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│                  Data Storage Layer                      │
│  ┌──────────────┬─────────────┬──────────────────────┐ │
│  │  PostgreSQL  │    Redis    │      Kafka           │ │
│  └──────────────┴─────────────┴──────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## Core Modules

### 1. Authentication Module (`/modules/auth`)

**Purpose**: Handle user authentication and authorization

**Components**:
- `auth.service.ts` - Business logic for registration, login, token management
- `auth.controller.ts` - REST endpoints for auth operations
- `auth.module.ts` - Module configuration

**Strategies**:
- `local.strategy.ts` - Email/password authentication
- `jwt.strategy.ts` - JWT token validation and user extraction

**Guards**:
- `jwt-auth.guard.ts` - Protect routes requiring authentication
- `local-auth.guard.ts` - Validate login credentials

**DTOs**:
- `register.dto.ts` - User registration validation
- `login.dto.ts` - Login credentials validation
- `refresh-token.dto.ts` - Token refresh validation

**Features**:
- User registration with tenant creation
- Email/password login
- JWT access tokens (15min expiry)
- Refresh tokens (7 day expiry)
- Password hashing with bcrypt
- Token refresh mechanism
- Secure logout

### 2. Tenant Module (`/modules/tenant`)

**Purpose**: Manage multi-tenant organizations

**Components**:
- `tenant.service.ts` - Tenant CRUD and business logic
- `tenant.controller.ts` - REST endpoints for tenant operations
- `tenant.module.ts` - Module configuration

**DTOs**:
- `create-tenant.dto.ts` - Tenant creation validation
- `update-tenant.dto.ts` - Tenant update validation

**Features**:
- Create new tenants
- List user's tenants
- Update tenant settings
- Get tenant statistics (users, projects, subscription)
- Soft delete tenants
- Subscription tier management
- User/project limits enforcement

### 3. User Module (`/modules/user`)

**Purpose**: Manage users within tenant context

**Components**:
- `user.service.ts` - User CRUD with tenant isolation
- `user.controller.ts` - REST endpoints for user operations
- `user.module.ts` - Module configuration

**DTOs**:
- `create-user.dto.ts` - User creation validation
- `update-user.dto.ts` - User update validation

**Features**:
- Create users in tenant
- List tenant users
- Update user profiles
- Update user roles (OWNER, ADMIN, MEMBER, VIEWER)
- Remove users from tenant
- User preferences management
- Profile picture support

### 4. Project Module (`/modules/project`)

**Purpose**: Manage SEO projects/websites

**Components**:
- `project.service.ts` - Project CRUD with tenant isolation
- `project.controller.ts` - REST endpoints for project operations
- `project.module.ts` - Module configuration

**DTOs**:
- `create-project.dto.ts` - Project creation validation
- `update-project.dto.ts` - Project update validation

**Features**:
- Create projects with domain tracking
- List tenant projects
- Update project settings
- Track keywords and competitors
- Google Analytics/Search Console integration
- Project status (active, paused, archived)
- Project statistics
- Soft delete with archive

### 5. Events Module (`/modules/events`)

**Purpose**: Event-driven architecture with Kafka

**Components**:
- `events.service.ts` - Kafka producer/consumer
- `events.controller.ts` - REST endpoints for event triggers
- `events.module.ts` - Module configuration

**Event Topics**:
- `project.created` - Project lifecycle
- `project.updated`
- `project.deleted`
- `crawl.requested` - Crawler integration
- `crawl.completed`
- `audit.requested` - Audit integration
- `audit.completed`
- `rank.check.requested` - Rank checker integration
- `rank.check.completed`

**Features**:
- Async event publishing
- Event consumption
- Message routing
- Error handling
- Microservices communication

## Database Schema

### Entity Relationships

```
┌─────────────┐           ┌──────────────┐           ┌─────────────┐
│   Tenant    │◄─────────►│  UserTenant  │◄─────────►│    User     │
└─────────────┘ 1       * └──────────────┘ *       1 └─────────────┘
      │ 1                                                     │
      │                                                       │
      │                                                       │
      │ *                                                     │
┌─────────────┐                                               │
│   Project   │                                               │
└─────────────┘                                               │
                                                              │
                                                              ▼
                                              [JWT Tokens, Refresh Tokens]
```

### Tenant Entity
```typescript
- id: UUID (PK)
- name: string
- slug: string (unique)
- description: text
- databaseSchema: string
- active: boolean
- settings: jsonb
- metadata: jsonb
- subscriptionTier: string
- subscriptionExpiresAt: timestamp
- maxUsers: integer
- maxProjects: integer
- createdAt: timestamp
- updatedAt: timestamp
- deletedAt: timestamp (soft delete)
```

### User Entity
```typescript
- id: UUID (PK)
- email: string (unique)
- firstName: string
- lastName: string
- password: string (hashed)
- phone: string
- avatar: string
- active: boolean
- emailVerified: boolean
- emailVerifiedAt: timestamp
- lastLoginAt: timestamp
- passwordChangedAt: timestamp
- preferences: jsonb
- metadata: jsonb
- refreshToken: string (hashed)
- createdAt: timestamp
- updatedAt: timestamp
- deletedAt: timestamp (soft delete)
```

### UserTenant Entity (Junction Table)
```typescript
- id: UUID (PK)
- userId: UUID (FK)
- tenantId: UUID (FK)
- role: enum (OWNER, ADMIN, MEMBER, VIEWER)
- permissions: jsonb array
- active: boolean
- invitedBy: UUID
- invitedAt: timestamp
- joinedAt: timestamp
- createdAt: timestamp
- updatedAt: timestamp
```

### Project Entity
```typescript
- id: UUID (PK)
- tenantId: UUID (FK)
- name: string
- slug: string
- description: text
- domain: string
- protocol: string
- status: enum (ACTIVE, PAUSED, ARCHIVED)
- settings: jsonb
- metadata: jsonb
- targetKeywords: text array
- competitorDomains: text array
- googleAnalyticsId: string
- googleSearchConsoleId: string
- lastCrawledAt: timestamp
- lastAuditAt: timestamp
- lastRankCheckAt: timestamp
- createdAt: timestamp
- updatedAt: timestamp
- deletedAt: timestamp (soft delete)
```

## Common Utilities

### Decorators (`/common/decorators`)

**@CurrentUser()**
- Extract current authenticated user from request
- Usage: `@CurrentUser() user`, `@CurrentUser('id') userId`

**@CurrentTenant()**
- Extract current tenant ID from request
- Usage: `@CurrentTenant() tenantId`

**@Roles(...roles)**
- Specify required roles for route access
- Usage: `@Roles(UserRole.OWNER, UserRole.ADMIN)`

**@Public()**
- Mark route as public (bypass authentication)
- Usage: `@Public()` on route

### Guards (`/common/guards`)

**JwtAuthGuard**
- Validates JWT tokens
- Extracts user information
- Applied globally with @Public() bypass

**RolesGuard**
- Validates user has required role
- Works with @Roles() decorator
- Tenant-scoped role checking

### Interceptors (`/common/interceptors`)

**TransformInterceptor**
- Wraps all responses in consistent format:
```json
{
  "success": true,
  "statusCode": 200,
  "data": { ... },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Filters (`/common/filters`)

**HttpExceptionFilter**
- Catches all exceptions
- Formats error responses consistently
- Logs errors with context

### Middleware (`/common/middleware`)

**TenantContextMiddleware**
- Extracts tenant ID from JWT or header
- Attaches to request object
- Enables tenant isolation

**LoggingMiddleware**
- Logs all HTTP requests
- Includes response time, status, user agent
- Winston logger integration

## Authentication Flow

### Registration Flow
```
1. User submits registration (email, password, name, tenant name)
2. System validates input
3. Check if email already exists
4. Hash password with bcrypt
5. Create tenant with generated slug
6. Create user record
7. Create UserTenant association (role: OWNER)
8. Generate JWT access and refresh tokens
9. Hash and store refresh token
10. Return user, tenant, and tokens
```

### Login Flow
```
1. User submits credentials (email, password)
2. LocalStrategy validates credentials
3. Verify user exists and is active
4. Compare password hash
5. Load user's tenant associations
6. Generate JWT tokens with user + tenant info
7. Update lastLoginAt timestamp
8. Hash and store refresh token
9. Return user, tenant, role, and tokens
```

### Request Authorization Flow
```
1. Client includes "Authorization: Bearer {token}" header
2. JwtAuthGuard intercepts request
3. JwtStrategy validates token signature and expiry
4. Load user from database with tenant associations
5. Attach user object to request
6. TenantContextMiddleware extracts tenant ID
7. RolesGuard checks user role (if @Roles() used)
8. Request proceeds to controller
```

### Token Refresh Flow
```
1. Client's access token expires
2. Client sends refresh token
3. System validates refresh token
4. Compare with stored hash
5. Generate new access and refresh tokens
6. Update stored refresh token
7. Return new tokens
```

## Multi-Tenancy Implementation

### Row-Level Security
- All queries automatically scoped by tenant ID
- Middleware extracts tenant from JWT
- Services enforce tenant isolation
- Prevents cross-tenant data access

### Tenant Context Flow
```
1. User authenticates with credentials
2. JWT contains user ID and tenant ID
3. JwtStrategy validates and loads user
4. TenantContextMiddleware extracts tenant ID
5. Request object includes tenantId
6. Services filter all queries by tenantId
7. Response only includes tenant's data
```

### Role-Based Access Per Tenant
- User can have different roles in different tenants
- UserTenant junction table stores role per tenant
- Guards check role within current tenant context
- Permissions can be customized per user per tenant

## Security Features

### Password Security
- Bcrypt hashing with configurable rounds (default: 10)
- Password complexity validation
- Automatic hashing on user save
- Password history tracking

### Token Security
- JWT with RS256 or HS256 algorithm
- Short-lived access tokens (15min)
- Long-lived refresh tokens (7 days)
- Refresh token rotation on use
- Tokens include user, tenant, and role claims
- Token revocation via database flag

### API Security
- Helmet.js security headers
- CORS with configurable origins
- Rate limiting (configurable)
- Input validation with class-validator
- SQL injection prevention (TypeORM parameterization)
- XSS protection
- CSRF protection for state-changing operations

### Authorization
- Route-level authentication (JWT guard)
- Route-level role requirements (@Roles decorator)
- Tenant-scoped data access
- Resource-level permission checks

## Error Handling

### Exception Filter
All errors formatted consistently:
```json
{
  "success": false,
  "statusCode": 400,
  "error": "BadRequestException",
  "message": "Validation failed",
  "path": "/api/v1/users",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Error Types
- `400 Bad Request` - Validation errors
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource already exists
- `500 Internal Server Error` - Server errors

### Logging
- Winston logger with multiple transports
- Console logging (development)
- File logging (production)
- Error stack traces
- Request/response logging
- Structured JSON logs

## Performance Optimizations

### Database
- Connection pooling (max 20 connections)
- Indexed columns (email, slug, foreign keys)
- Lazy loading of relationships
- Pagination support
- Query optimization

### Caching
- Redis for session storage
- Cache frequently accessed data
- TTL-based cache invalidation
- Cache warming strategies

### API
- Response compression
- ETags for cache validation
- Rate limiting per user/tenant
- Async processing with Kafka

## Deployment Considerations

### Environment Variables
- All configuration externalized
- Secrets management (JWT secrets, DB passwords)
- Environment-specific settings
- .env.example template provided

### Database Migrations
- TypeORM migration system
- Version-controlled schema changes
- Rollback support
- Production migration strategy

### Scalability
- Stateless API (horizontal scaling)
- Database connection pooling
- Redis for distributed caching
- Kafka for async processing
- Load balancer ready

### Monitoring
- Health check endpoints
- Structured logging
- Error tracking integration
- Performance metrics
- Database query monitoring

## Next Steps

### Phase 2 - Crawler Microservice
- Separate service consuming `crawl.requested` events
- Puppeteer/Playwright integration
- Crawl scheduling
- Results storage
- Publish `crawl.completed` events

### Phase 3 - Audit Microservice
- SEO audit engine
- Lighthouse integration
- Technical SEO checks
- Content analysis
- Audit reports

### Phase 4 - Rank Checker Microservice
- Google SERP tracking
- Keyword position monitoring
- Competitor tracking
- Historical data
- Rank change alerts

### Phase 5 - Analytics Dashboard
- Real-time metrics
- Historical trends
- Custom reports
- Data visualization
- Export functionality

## Conclusion

This backend provides a solid foundation for the SEO Intelligence Platform with:
- Production-ready code quality
- Comprehensive security
- Scalable architecture
- Multi-tenant isolation
- Event-driven design
- Complete API documentation
- Thorough error handling
- Extensive logging

Ready for frontend integration and microservices expansion.
