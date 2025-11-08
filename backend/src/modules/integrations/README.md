# Integrations Module - Team Delta

**Team Delta - Integrations & External APIs** provides comprehensive integration capabilities for the SEO Intelligence Platform.

## Overview

This module handles all external API integrations and webhook functionality, enabling seamless data synchronization with Google services, third-party SEO tools, and external systems.

## Components

### 1. OAuth Handler (`oauth/`)

Generic OAuth2 authentication flow supporting multiple providers.

**Features:**
- OAuth2 authorization flow with state management
- Automatic token refresh
- Support for multiple providers (Google Search Console, Analytics, Ads)
- Secure token storage

**Endpoints:**
- `GET /integrations/oauth/authorize/:provider` - Initiate OAuth flow
- `GET /integrations/oauth/callback/:provider` - Handle OAuth callback
- `GET /integrations/oauth/connections` - List active connections
- `DELETE /integrations/oauth/disconnect/:provider` - Disconnect provider
- `POST /integrations/oauth/refresh/:connectionId` - Manually refresh token

**Usage:**
```typescript
// Initiate OAuth flow
const authUrl = await oauthService.generateAuthUrl(
  OAuthProvider.GOOGLE_SEARCH_CONSOLE,
  userId,
  tenantId
);

// Get active connection
const connection = await oauthService.getConnection(
  userId,
  tenantId,
  OAuthProvider.GOOGLE_SEARCH_CONSOLE
);
```

### 2. Google Search Console Integration (`google-search-console/`)

Integration with Google Search Console API for performance data and indexing information.

**Features:**
- List all Search Console properties
- Fetch performance metrics (clicks, impressions, CTR, position)
- Index coverage reports
- Sitemap data
- URL inspection
- Historical data storage

**Endpoints:**
- `GET /integrations/google-search-console/sites` - List GSC properties
- `POST /integrations/google-search-console/performance` - Fetch performance data
- `GET /integrations/google-search-console/performance/stored` - Get stored data
- `GET /integrations/google-search-console/queries/top` - Top performing queries
- `GET /integrations/google-search-console/pages/top` - Top performing pages
- `POST /integrations/google-search-console/index-coverage` - Index coverage
- `POST /integrations/google-search-console/sitemaps` - Sitemap data
- `POST /integrations/google-search-console/url-inspection` - Inspect URL

### 3. Google Analytics Integration (`google-analytics/`)

Integration with Google Analytics 4 API for traffic and user behavior data.

**Features:**
- List GA4 properties
- Run custom reports with dimensions and metrics
- Real-time data fetching
- Traffic source analysis
- Conversion tracking
- Page performance metrics

**Endpoints:**
- `GET /integrations/google-analytics/properties` - List GA4 properties
- `POST /integrations/google-analytics/report` - Run GA4 report
- `POST /integrations/google-analytics/realtime` - Get real-time data
- `GET /integrations/google-analytics/stored` - Get stored analytics data
- `GET /integrations/google-analytics/pages/top` - Top pages by views
- `GET /integrations/google-analytics/traffic-sources` - Traffic sources
- `GET /integrations/google-analytics/conversions` - Conversion summary

### 4. Google Ads Integration (`google-ads/`)

Integration with Google Ads API for keyword research and advertising data.

**Features:**
- Keyword planner integration
- Search volume data
- CPC (Cost Per Click) metrics
- Keyword difficulty
- Competition analysis
- Monthly search trends

**Endpoints:**
- `POST /integrations/google-ads/keyword-ideas` - Get keyword ideas
- `POST /integrations/google-ads/search-volume` - Get search volume
- `POST /integrations/google-ads/cpc-data` - Get CPC data
- `GET /integrations/google-ads/keyword-ideas/stored` - Stored keyword ideas
- `GET /integrations/google-ads/keywords/high-volume` - High volume keywords
- `GET /integrations/google-ads/keywords/best-cpc` - Best CPC keywords

### 5. Third-Party SEO Tools (`third-party/`)

Unified interface for integrating with Ahrefs, SEMrush, and Moz APIs.

**Supported Tools:**
- **Ahrefs**: Backlinks, domain rating, referring domains, keyword data
- **SEMrush**: Organic keywords, competitor analysis, keyword difficulty
- **Moz**: Domain authority, page authority, link metrics

**Features:**
- Unified ISEOClient interface
- Rate limiting with automatic retry
- Backlink analysis
- Domain metrics
- Keyword research
- Competitor analysis

**Usage:**
```typescript
// Ahrefs
const backlinks = await ahrefsClient.getBacklinks('example.com');
const metrics = await ahrefsClient.getDomainMetrics('example.com');

// SEMrush
const keywords = await semrushClient.getKeywordData('seo tools');
const competitors = await semrushClient.getCompetitorAnalysis('example.com');

// Moz
const domainAuth = await mozClient.getDomainMetrics('example.com');
```

### 6. Webhooks System (`webhooks/`)

Robust webhook system with delivery management and retry logic.

**Features:**
- Webhook registration and management
- Event-based triggers
- HMAC signature verification
- Automatic retry with exponential backoff
- Delivery tracking and statistics
- Manual retry capability
- Test webhook functionality

**Events:**
- `ranking.changed` - Ranking position changes
- `keyword.added` - New keyword added
- `keyword.updated` - Keyword data updated
- `backlink.found` - New backlink discovered
- `backlink.lost` - Backlink lost
- `competitor.detected` - New competitor detected
- `audit.completed` - SEO audit completed
- `content.analyzed` - Content analysis finished
- `project.created` - Project created
- `project.updated` - Project updated

**Endpoints:**
- `POST /integrations/webhooks` - Create webhook
- `GET /integrations/webhooks` - List webhooks
- `GET /integrations/webhooks/:id` - Get webhook details
- `PUT /integrations/webhooks/:id` - Update webhook
- `DELETE /integrations/webhooks/:id` - Delete webhook
- `GET /integrations/webhooks/:id/deliveries` - Get delivery history
- `GET /integrations/webhooks/:id/stats` - Delivery statistics
- `POST /integrations/webhooks/:id/test` - Test webhook
- `POST /integrations/webhooks/:id/regenerate-secret` - Regenerate secret
- `POST /integrations/webhooks/deliveries/:deliveryId/retry` - Retry delivery
- `POST /integrations/webhooks/trigger` - Manual event trigger

**Webhook Payload Format:**
```json
{
  "event": "ranking.changed",
  "timestamp": "2025-11-08T10:30:00Z",
  "tenantId": "uuid",
  "projectId": "uuid",
  "data": {
    // Event-specific data
  }
}
```

**Security:**
- HMAC-SHA256 signature in `X-Webhook-Signature` header
- Verify signature using webhook secret
- Timestamp in `X-Webhook-Timestamp` header
- Unique delivery ID in `X-Webhook-Delivery-Id` header

## Database Entities

### OAuth Connections
- Stores OAuth tokens and refresh tokens
- Supports multiple providers per user
- Automatic token expiration tracking

### GSC Data
- Performance metrics (clicks, impressions, CTR, position)
- Per-query and per-page data
- Historical tracking

### GA Data
- Page views and sessions
- User metrics
- Traffic sources
- Conversions

### Google Ads Data
- Keyword ideas
- Search volume
- CPC and competition data

### Webhooks
- Registration details
- Event subscriptions
- Delivery statistics

### Webhook Deliveries
- Individual delivery attempts
- Response tracking
- Retry management

## Configuration

Required environment variables:

```env
# Google OAuth
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
OAUTH_REDIRECT_URI=http://localhost:3000/api/integrations/oauth/callback

# Google Ads
GOOGLE_ADS_DEVELOPER_TOKEN=your_developer_token

# Third-party SEO Tools
AHREFS_API_KEY=your_ahrefs_key
SEMRUSH_API_KEY=your_semrush_key
MOZ_ACCESS_ID=your_moz_access_id
MOZ_SECRET_KEY=your_moz_secret_key
```

## Integration Flow

### Google Service Integration

1. **Initiate OAuth**: User clicks "Connect" button
2. **Authorization**: Redirect to Google OAuth consent screen
3. **Callback**: Receive authorization code
4. **Token Exchange**: Exchange code for access/refresh tokens
5. **Store Connection**: Save tokens in database
6. **Fetch Data**: Use stored tokens to call APIs
7. **Auto-refresh**: Automatically refresh expired tokens

### Webhook Integration

1. **Register Webhook**: Create webhook with URL and events
2. **Event Trigger**: System triggers event (e.g., ranking changed)
3. **Queue Delivery**: Create delivery record
4. **Send Webhook**: POST payload with signature
5. **Track Response**: Record success/failure
6. **Retry**: Automatic retry with backoff if failed
7. **Statistics**: Track delivery metrics

## Rate Limiting

All API clients implement rate limiting:
- Automatic retry on 429 (Too Many Requests)
- Exponential backoff
- Configurable timeout
- Request queuing

## Error Handling

Comprehensive error handling:
- API errors logged with context
- Failed deliveries tracked
- Automatic retry mechanisms
- User-friendly error messages
- Stack traces in logs

## Best Practices

1. **OAuth Tokens**: Never expose tokens in logs or responses
2. **Webhooks**: Always verify signatures
3. **Rate Limits**: Respect API provider limits
4. **Data Storage**: Archive old data regularly
5. **Secrets**: Use environment variables
6. **Testing**: Test webhooks before production use

## Testing

```bash
# Test OAuth flow
curl -X GET http://localhost:3000/api/integrations/oauth/authorize/google_search_console

# Test webhook
curl -X POST http://localhost:3000/api/integrations/webhooks/{id}/test

# Trigger manual event
curl -X POST http://localhost:3000/api/integrations/webhooks/trigger \
  -H "Content-Type: application/json" \
  -d '{
    "event": "ranking.changed",
    "payload": { "keyword": "seo tools", "oldPosition": 5, "newPosition": 3 }
  }'
```

## Dependencies

- `@nestjs/common` - NestJS core
- `@nestjs/typeorm` - Database integration
- `@nestjs/config` - Configuration
- `@nestjs/schedule` - Cron jobs for webhook delivery
- `axios` - HTTP client for API calls
- `typeorm` - ORM
- `crypto` - HMAC signature generation

## Architecture

```
integrations/
├── oauth/                      # OAuth2 handler
│   ├── entities/
│   │   └── oauth-connection.entity.ts
│   ├── dto/
│   │   └── oauth-callback.dto.ts
│   ├── oauth.service.ts
│   ├── oauth.controller.ts
│   └── oauth.module.ts
│
├── google-search-console/      # GSC integration
│   ├── entities/
│   │   └── gsc-data.entity.ts
│   ├── dto/
│   │   └── gsc-performance.dto.ts
│   ├── google-search-console.service.ts
│   ├── google-search-console.controller.ts
│   └── google-search-console.module.ts
│
├── google-analytics/           # GA4 integration
│   ├── entities/
│   │   └── ga-data.entity.ts
│   ├── dto/
│   │   └── ga-query.dto.ts
│   ├── google-analytics.service.ts
│   ├── google-analytics.controller.ts
│   └── google-analytics.module.ts
│
├── google-ads/                 # Google Ads integration
│   ├── entities/
│   │   └── google-ads-data.entity.ts
│   ├── dto/
│   │   └── google-ads-query.dto.ts
│   ├── google-ads.service.ts
│   ├── google-ads.controller.ts
│   └── google-ads.module.ts
│
├── third-party/                # Third-party SEO tools
│   ├── base-seo-client.interface.ts
│   ├── ahrefs.client.ts
│   ├── semrush.client.ts
│   ├── moz.client.ts
│   └── third-party.module.ts
│
├── webhooks/                   # Webhooks system
│   ├── entities/
│   │   ├── webhook.entity.ts
│   │   └── webhook-delivery.entity.ts
│   ├── dto/
│   │   └── webhook.dto.ts
│   ├── webhook.service.ts
│   ├── delivery.service.ts
│   ├── webhook.controller.ts
│   └── webhook.module.ts
│
├── integrations.module.ts      # Main module
└── README.md                   # This file
```

## Team Delta - Integrations & External APIs

Built with precision by Team Delta for the SEO Intelligence Platform.
