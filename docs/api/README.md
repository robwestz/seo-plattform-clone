# API Layer & Developer Experience - Team Zeta

Complete API layer implementation for the SEO Intelligence Platform, providing multiple interfaces for developers to interact with the platform.

## Overview

The API layer provides three primary interfaces:

1. **REST API** - Traditional RESTful endpoints with versioning
2. **GraphQL API** - Flexible query language with subscriptions
3. **WebSocket** - Real-time bidirectional communication

## Table of Contents

- [REST API](#rest-api)
- [GraphQL API](#graphql-api)
- [WebSocket Server](#websocket-server)
- [Authentication](#authentication)
- [Rate Limiting](#rate-limiting)
- [SDKs](#sdks)
- [API Documentation](#api-documentation)

## REST API

### Versioning

The REST API supports versioning through multiple methods:

1. **URL Path** (Recommended)
   ```bash
   GET /api/v1/projects
   GET /api/v2/projects
   ```

2. **Custom Header**
   ```bash
   GET /api/projects
   X-API-Version: 1
   ```

3. **Accept Header**
   ```bash
   GET /api/projects
   Accept: application/vnd.seo-platform.v1+json
   ```

### Deprecation

Deprecated endpoints include warning headers:
- `Deprecation: true`
- `Sunset: 2025-12-31`
- `Link: <alternative-endpoint>; rel="alternate"`
- `X-API-Warn: Deprecation message`

### Example Usage

```bash
# List projects
curl -X GET https://api.seo-platform.com/api/v1/projects \
  -H "Authorization: Bearer YOUR_TOKEN"

# Create project
curl -X POST https://api.seo-platform.com/api/v1/projects \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Website",
    "domain": "example.com",
    "targetCountry": "US",
    "targetLanguage": "en"
  }'
```

## GraphQL API

### Endpoint

```
POST /graphql
```

### Playground

GraphQL Playground is available in development:
```
http://localhost:3000/graphql
```

### Schema

The GraphQL schema includes:
- **Queries**: Read operations (projects, keywords, rankings, etc.)
- **Mutations**: Write operations (create, update, delete)
- **Subscriptions**: Real-time updates via WebSocket

### Example Queries

**List Projects**
```graphql
query {
  projects(tenantId: "tenant-id") {
    id
    name
    domain
    keywords {
      id
      keyword
      searchVolume
    }
  }
}
```

**Create Project**
```graphql
mutation {
  createProject(
    tenantId: "tenant-id"
    name: "My Website"
    domain: "example.com"
    targetCountry: "US"
    targetLanguage: "en"
  ) {
    id
    name
    domain
  }
}
```

**Subscribe to Ranking Updates**
```graphql
subscription {
  rankingUpdated(projectId: "project-id") {
    id
    keyword {
      keyword
    }
    position
    previousPosition
    trackedAt
  }
}
```

### Authentication

Include JWT token in Authorization header:
```
Authorization: Bearer YOUR_TOKEN
```

For subscriptions, pass token in connection params:
```javascript
const wsLink = new WebSocketLink({
  uri: 'ws://localhost:3000/graphql',
  options: {
    connectionParams: {
      authorization: 'Bearer YOUR_TOKEN',
    },
  },
});
```

## WebSocket Server

### Endpoint

```
ws://localhost:3000/realtime
```

### Authentication

Pass JWT token during connection:
```javascript
const socket = io('http://localhost:3000/realtime', {
  auth: {
    token: 'YOUR_JWT_TOKEN',
  },
});
```

### Events

#### Client → Server

**Subscribe to Project**
```javascript
socket.emit('subscribe:project', { projectId: 'project-id' });
```

**Subscribe to Tenant**
```javascript
socket.emit('subscribe:tenant', { tenantId: 'tenant-id' });
```

**Subscribe to Audit**
```javascript
socket.emit('subscribe:audit', { auditId: 'audit-id' });
```

**Unsubscribe**
```javascript
socket.emit('unsubscribe:project', { projectId: 'project-id' });
```

#### Server → Client

**Ranking Updated**
```javascript
socket.on('ranking:updated', (data) => {
  console.log('Ranking updated:', data);
  // data: { type, projectId, ranking, timestamp }
});
```

**Audit Progress**
```javascript
socket.on('audit:progress', (data) => {
  console.log('Audit progress:', data);
  // data: { type, auditId, progress, timestamp }
});
```

**Crawl Progress**
```javascript
socket.on('crawl:progress', (data) => {
  console.log('Crawl progress:', data);
  // data: { type, projectId, progress, timestamp }
});
```

**Backlink Changed**
```javascript
socket.on('backlink:changed', (data) => {
  console.log('Backlink changed:', data);
  // data: { type, projectId, backlink, changeType, timestamp }
});
```

## Authentication

All API endpoints require JWT authentication.

### Getting Tokens

**Login**
```bash
curl -X POST https://api.seo-platform.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password"
  }'
```

Response:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-id",
    "email": "user@example.com"
  }
}
```

### Using Tokens

Include access token in all requests:
```
Authorization: Bearer ACCESS_TOKEN
```

### Refreshing Tokens

```bash
curl -X POST https://api.seo-platform.com/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "REFRESH_TOKEN"
  }'
```

See [authentication.md](./authentication.md) for details.

## Rate Limiting

### Limits by Tier

| Tier | Requests/Hour | Block Duration |
|------|--------------|----------------|
| FREE | 100 | 10 minutes |
| STARTER | 1,000 | 5 minutes |
| PROFESSIONAL | 5,000 | 1 minute |
| ENTERPRISE | 50,000 | None |

### Rate Limit Headers

All responses include:
```
X-RateLimit-Limit: 5000
X-RateLimit-Remaining: 4850
X-RateLimit-Reset: 2024-01-15T11:00:00Z
```

When exceeded (429 Too Many Requests):
```
Retry-After: 60
```

### Implementation

Rate limiting uses Redis-backed token bucket algorithm:
- Configurable per subscription tier
- Automatic retry headers
- Graceful degradation

## SDKs

### JavaScript/TypeScript

```bash
npm install @seo-platform/sdk
```

```typescript
import { SEOPlatform } from '@seo-platform/sdk';

const client = new SEOPlatform({
  apiKey: 'your-api-key',
  enableWebSocket: true,
});

const projects = await client.projects.list();
```

See [/sdks/javascript/README.md](../../sdks/javascript/README.md)

### Python

```bash
pip install seo-platform-sdk
```

```python
from seo_platform import SEOPlatform

client = SEOPlatform(api_key='your-api-key')
projects = client.projects.list()
```

See [/sdks/python/README.md](../../sdks/python/README.md)

## API Documentation

### OpenAPI Specification

Complete OpenAPI 3.0 spec available at:
- **File**: `/docs/openapi.yaml`
- **Interactive**: `https://api.seo-platform.com/api/docs`

### Guides

- [Authentication Guide](./authentication.md)
- [Webhooks Documentation](./webhooks.md)
- [Rate Limiting](../README.md#rate-limiting)
- [Error Handling](../README.md#error-handling)

## File Structure

```
backend/src/
├── graphql/
│   ├── schema.graphql           # GraphQL schema definition
│   ├── graphql.module.ts        # NestJS GraphQL module
│   └── resolvers/
│       ├── auth.resolver.ts     # Authentication resolvers
│       ├── project.resolver.ts  # Project resolvers
│       ├── keyword.resolver.ts  # Keyword resolvers
│       ├── ranking.resolver.ts  # Ranking resolvers
│       └── subscription.resolver.ts
│
├── websocket/
│   ├── realtime.gateway.ts      # WebSocket gateway
│   └── websocket.module.ts      # WebSocket module
│
├── api/
│   ├── v1/
│   │   └── v1.controller.ts     # API v1 endpoints
│   ├── v2/
│   │   └── v2.controller.ts     # API v2 endpoints
│   ├── middleware/
│   │   ├── version.middleware.ts      # Version handling
│   │   └── deprecation.middleware.ts  # Deprecation warnings
│   └── api.module.ts
│
└── common/
    └── guards/
        └── rate-limit.guard.ts  # Rate limiting guard

docs/
├── openapi.yaml                 # OpenAPI specification
└── api/
    ├── README.md               # This file
    ├── authentication.md       # Auth guide
    └── webhooks.md            # Webhooks guide

sdks/
├── javascript/                  # TypeScript/JavaScript SDK
│   ├── src/
│   │   ├── client.ts
│   │   └── resources/
│   └── package.json
│
└── python/                      # Python SDK
    ├── seo_platform/
    │   ├── client.py
    │   └── resources/
    └── setup.py
```

## Integration Examples

### REST API

```bash
# Create project
PROJECT_ID=$(curl -X POST http://localhost:3000/api/v1/projects \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Example Site",
    "domain": "example.com",
    "targetCountry": "US",
    "targetLanguage": "en"
  }' | jq -r '.id')

# Add keywords
curl -X POST http://localhost:3000/api/v1/projects/$PROJECT_ID/keywords \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"keyword": "seo tools"}'

# Start audit
curl -X POST http://localhost:3000/api/v1/projects/$PROJECT_ID/audits \
  -H "Authorization: Bearer $TOKEN"
```

### GraphQL API

```javascript
import { GraphQLClient, gql } from 'graphql-request';

const client = new GraphQLClient('http://localhost:3000/graphql', {
  headers: {
    authorization: `Bearer ${token}`,
  },
});

const query = gql`
  query {
    projects(tenantId: "tenant-id") {
      id
      name
      keywords {
        keyword
        searchVolume
      }
    }
  }
`;

const data = await client.request(query);
```

### WebSocket

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3000/realtime', {
  auth: { token: 'YOUR_JWT_TOKEN' },
});

socket.on('connect', () => {
  console.log('Connected');
  socket.emit('subscribe:project', { projectId: 'project-id' });
});

socket.on('ranking:updated', (data) => {
  console.log('Ranking updated:', data);
});
```

## Testing

### REST API Tests

```bash
npm run test:integration
```

### GraphQL Tests

```bash
npm run test -- graphql
```

### WebSocket Tests

```bash
npm run test -- websocket
```

## Production Deployment

### Environment Variables

```env
# API Configuration
API_VERSION=v1
ENABLE_GRAPHQL_PLAYGROUND=false
ENABLE_GRAPHQL_INTROSPECTION=false

# CORS
CORS_ORIGIN=https://app.seo-platform.com

# Rate Limiting
REDIS_HOST=localhost
REDIS_PORT=6379

# WebSocket
WEBSOCKET_CORS_ORIGIN=https://app.seo-platform.com
```

### Performance Considerations

1. **GraphQL**: Use DataLoader for N+1 query prevention
2. **WebSocket**: Implement reconnection logic with exponential backoff
3. **Rate Limiting**: Configure Redis cluster for high availability
4. **Caching**: Enable HTTP caching headers for GET requests

## Support

For API support:
- Documentation: https://docs.seo-platform.com
- Email: api@seo-platform.com
- Discord: https://discord.gg/seo-platform
