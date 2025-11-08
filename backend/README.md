# SEO Intelligence Platform - Backend API

## Overview

Production-ready NestJS backend for the SEO Intelligence Platform. This backend provides a complete REST API with JWT authentication, multi-tenancy, and event-driven architecture using Kafka.

## Features

### Core Functionality
- **Authentication & Authorization**: JWT-based auth with refresh tokens, bcrypt password hashing
- **Multi-Tenancy**: Row-level tenant isolation with tenant context middleware
- **Role-Based Access Control (RBAC)**: Owner, Admin, Member, and Viewer roles
- **RESTful API**: Complete CRUD operations for all resources
- **Event-Driven Architecture**: Kafka integration for microservices communication
- **API Documentation**: Swagger/OpenAPI auto-generated documentation

### Technology Stack
- **Framework**: NestJS 10+
- **Language**: TypeScript (strict mode)
- **Database**: PostgreSQL with TypeORM
- **Cache**: Redis/IORedis
- **Message Queue**: Kafka (KafkaJS)
- **Authentication**: Passport.js with JWT strategy
- **Validation**: class-validator and class-transformer
- **Logging**: Winston
- **Documentation**: Swagger/OpenAPI

## Project Structure

```
backend/
├── src/
│   ├── config/                    # Configuration files
│   │   ├── database.config.ts
│   │   ├── jwt.config.ts
│   │   ├── redis.config.ts
│   │   └── kafka.config.ts
│   ├── database/                  # Database layer
│   │   ├── entities/              # TypeORM entities
│   │   │   ├── tenant.entity.ts
│   │   │   ├── user.entity.ts
│   │   │   ├── project.entity.ts
│   │   │   └── user-tenant.entity.ts
│   │   ├── migrations/            # Database migrations
│   │   └── data-source.ts         # TypeORM data source
│   ├── modules/                   # Feature modules
│   │   ├── auth/                  # Authentication module
│   │   │   ├── dto/
│   │   │   ├── strategies/
│   │   │   ├── guards/
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.controller.ts
│   │   │   └── auth.module.ts
│   │   ├── tenant/                # Tenant management
│   │   ├── user/                  # User management
│   │   ├── project/               # Project management
│   │   └── events/                # Kafka events
│   ├── common/                    # Shared utilities
│   │   ├── decorators/            # Custom decorators
│   │   ├── guards/                # Custom guards
│   │   ├── interceptors/          # Response interceptors
│   │   ├── middleware/            # Middleware
│   │   ├── filters/               # Exception filters
│   │   └── pipes/                 # Validation pipes
│   ├── app.module.ts              # Root module
│   └── main.ts                    # Application entry point
├── test/                          # E2E tests
├── logs/                          # Application logs
├── .env.example                   # Environment variables template
├── package.json                   # Dependencies
├── tsconfig.json                  # TypeScript configuration
├── nest-cli.json                  # NestJS CLI configuration
└── README.md                      # This file
```

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL 14+
- Redis 7+
- Kafka 3+ (optional, for event streaming)

### Installation

1. **Install dependencies**:
```bash
npm install
```

2. **Set up environment variables**:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Set up database**:
```bash
# Create database
createdb seo_platform

# Run migrations
npm run migration:run
```

4. **Start the application**:
```bash
# Development mode
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

### Environment Variables

See `.env.example` for all available environment variables. Key variables:

- `DATABASE_*`: PostgreSQL connection settings
- `JWT_SECRET`: Secret for JWT token signing
- `JWT_REFRESH_SECRET`: Secret for refresh token signing
- `REDIS_*`: Redis connection settings
- `KAFKA_*`: Kafka broker settings
- `PORT`: API server port (default: 3000)

## API Documentation

Once running, access Swagger documentation at:
```
http://localhost:3000/api/docs
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user and tenant
- `POST /api/v1/auth/login` - Login user
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - Logout user
- `GET /api/v1/auth/me` - Get current user profile

### Tenants
- `GET /api/v1/tenants` - List all tenants for current user
- `GET /api/v1/tenants/:id` - Get tenant details
- `POST /api/v1/tenants` - Create new tenant
- `PATCH /api/v1/tenants/:id` - Update tenant
- `DELETE /api/v1/tenants/:id` - Delete tenant
- `GET /api/v1/tenants/:id/statistics` - Get tenant statistics

### Users
- `GET /api/v1/users` - List all users in tenant
- `GET /api/v1/users/:id` - Get user details
- `POST /api/v1/users` - Create new user
- `PATCH /api/v1/users/:id` - Update user
- `PATCH /api/v1/users/:id/role` - Update user role
- `DELETE /api/v1/users/:id` - Remove user from tenant

### Projects
- `GET /api/v1/projects` - List all projects in tenant
- `GET /api/v1/projects/:id` - Get project details
- `POST /api/v1/projects` - Create new project
- `PATCH /api/v1/projects/:id` - Update project
- `DELETE /api/v1/projects/:id` - Delete project
- `GET /api/v1/projects/:id/statistics` - Get project statistics
- `PATCH /api/v1/projects/:id/pause` - Pause project
- `PATCH /api/v1/projects/:id/resume` - Resume project
- `PATCH /api/v1/projects/:id/archive` - Archive project

### Events
- `POST /api/v1/events/crawl` - Request crawl for project
- `POST /api/v1/events/audit` - Request audit for project
- `POST /api/v1/events/rank-check` - Request rank check for project

## Database Schema

### Entities

**Tenant**
- Multi-tenant organization
- Has many users (through UserTenant)
- Has many projects
- Subscription management

**User**
- Platform user
- Can belong to multiple tenants
- Email/password authentication
- JWT refresh token storage

**UserTenant**
- Junction table for User-Tenant relationship
- Stores role and permissions per tenant
- Roles: OWNER, ADMIN, MEMBER, VIEWER

**Project**
- SEO project/website
- Belongs to a tenant
- Contains domain, keywords, competitors
- Tracks crawl, audit, and rank check history

## Authentication & Authorization

### JWT Authentication
- Access tokens (15 min expiry)
- Refresh tokens (7 day expiry)
- Tokens include: userId, email, tenantId, role

### Authorization Flow
1. User logs in with email/password
2. Server validates credentials
3. Server returns access token and refresh token
4. Client includes access token in `Authorization: Bearer {token}` header
5. Client includes tenant ID in `X-Tenant-Id` header (optional)
6. When access token expires, use refresh token to get new tokens

### Role-Based Access Control

**Roles (per tenant)**:
- **OWNER**: Full access, can manage users and billing
- **ADMIN**: Manage projects and users
- **MEMBER**: Create and manage own projects
- **VIEWER**: Read-only access

### Protected Routes

Use decorators to protect routes:

```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.OWNER, UserRole.ADMIN)
@Delete(':id')
deleteProject(@Param('id') id: string) {
  // Only owners and admins can delete
}
```

## Multi-Tenancy

### Tenant Isolation
- Every resource belongs to a tenant
- Queries automatically scoped by tenant ID
- Tenant context extracted from JWT token
- Middleware attaches tenant ID to request

### Tenant Context Middleware
Automatically extracts and sets tenant context:
```typescript
// Request includes tenant context
const tenantId = request.tenantId; // Set by middleware
```

## Event-Driven Architecture

### Kafka Topics
- `project.created` - Project created
- `project.updated` - Project updated
- `project.deleted` - Project deleted
- `crawl.requested` - Crawl requested
- `crawl.completed` - Crawl completed
- `audit.requested` - Audit requested
- `audit.completed` - Audit completed
- `rank.check.requested` - Rank check requested
- `rank.check.completed` - Rank check completed

### Publishing Events
```typescript
await eventsService.publishProjectCreated(projectId, tenantId, projectData);
await eventsService.publishCrawlRequested(projectId, tenantId, options);
```

## Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## Database Migrations

```bash
# Generate migration
npm run migration:generate -- -n MigrationName

# Run migrations
npm run migration:run

# Revert migration
npm run migration:revert
```

## Development

### Code Style
- ESLint + Prettier configured
- Run `npm run lint` to check
- Run `npm run format` to format

### Debugging
```bash
npm run start:debug
```

Then attach debugger to port 9229.

## Production Deployment

### Build
```bash
npm run build
```

### Environment
- Set `NODE_ENV=production`
- Use strong JWT secrets
- Enable SSL for PostgreSQL
- Configure proper CORS origins
- Set up monitoring and logging

### Performance
- Connection pooling configured (max 20)
- Redis caching enabled
- Compression middleware enabled
- Helmet security headers

## Security Features

- Helmet.js for security headers
- CORS configuration
- Rate limiting (configurable)
- Password hashing with bcrypt
- JWT token expiration
- Input validation with class-validator
- SQL injection prevention (TypeORM)
- XSS protection

## Monitoring & Logging

### Logging
- Winston logger with multiple transports
- Console output (colorized in dev)
- File output (error.log, combined.log)
- Structured JSON logging in production

### Health Checks
Implement health check endpoint:
```typescript
@Get('health')
healthCheck() {
  return { status: 'ok', timestamp: new Date() };
}
```

## Contributing

1. Follow NestJS best practices
2. Write tests for new features
3. Update documentation
4. Use conventional commits

## License

MIT

## Support

For issues and questions, please open a GitHub issue.
