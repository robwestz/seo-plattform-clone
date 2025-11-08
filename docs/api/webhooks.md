# Webhooks Documentation

## Overview

Webhooks allow you to receive real-time notifications when events occur in your SEO Intelligence Platform account. Instead of polling the API, webhooks push data to your server when events happen.

## Setting Up Webhooks

### 1. Create a Webhook Endpoint

Create an HTTPS endpoint on your server to receive webhook events:

```javascript
// Example: Node.js/Express
app.post('/webhooks/seo-platform', (req, res) => {
  const event = req.body;

  // Verify webhook signature
  const signature = req.headers['x-webhook-signature'];
  if (!verifySignature(event, signature)) {
    return res.status(401).send('Invalid signature');
  }

  // Process event
  switch (event.type) {
    case 'ranking.updated':
      handleRankingUpdate(event.data);
      break;
    case 'audit.completed':
      handleAuditComplete(event.data);
      break;
    // ... handle other events
  }

  res.status(200).send('OK');
});
```

### 2. Register Webhook via API

```bash
curl -X POST https://api.seo-platform.com/api/v1/webhooks \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-domain.com/webhooks/seo-platform",
    "events": ["ranking.updated", "audit.completed", "backlink.changed"],
    "secret": "your-webhook-secret"
  }'
```

## Event Types

### Ranking Events

**`ranking.updated`** - Triggered when keyword rankings are updated

```json
{
  "type": "ranking.updated",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "projectId": "proj-123",
    "keywordId": "kw-456",
    "keyword": "best seo tools",
    "position": 5,
    "previousPosition": 8,
    "change": -3,
    "url": "https://example.com/seo-tools",
    "engine": "google"
  }
}
```

### Audit Events

**`audit.started`** - Triggered when site audit begins
**`audit.progress`** - Triggered periodically during audit
**`audit.completed`** - Triggered when audit finishes

```json
{
  "type": "audit.completed",
  "timestamp": "2024-01-15T11:00:00Z",
  "data": {
    "auditId": "audit-789",
    "projectId": "proj-123",
    "status": "completed",
    "pagesScanned": 1250,
    "issuesFound": 47,
    "score": 78.5,
    "summary": {
      "critical": 3,
      "errors": 12,
      "warnings": 32
    }
  }
}
```

### Backlink Events

**`backlink.new`** - New backlink discovered
**`backlink.lost`** - Backlink no longer detected
**`backlink.updated`** - Backlink metrics updated

```json
{
  "type": "backlink.new",
  "timestamp": "2024-01-15T12:00:00Z",
  "data": {
    "backlinkId": "bl-321",
    "projectId": "proj-123",
    "sourceUrl": "https://referring-site.com/article",
    "targetUrl": "https://example.com/page",
    "anchorText": "great seo tool",
    "domainAuthority": 65,
    "isDoFollow": true
  }
}
```

### Crawl Events

**`crawl.started`** - Crawl initiated
**`crawl.progress`** - Crawl progress update
**`crawl.completed`** - Crawl finished

### Project Events

**`project.created`** - New project created
**`project.updated`** - Project settings changed
**`project.deleted`** - Project removed

## Webhook Security

### Signature Verification

All webhook requests include an `X-Webhook-Signature` header. Verify this signature to ensure the request is from SEO Intelligence Platform:

```javascript
const crypto = require('crypto');

function verifySignature(payload, signature) {
  const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
  const digest = hmac.update(JSON.stringify(payload)).digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(digest)
  );
}
```

### Best Practices

1. **Use HTTPS**: Webhook URLs must use HTTPS
2. **Verify signatures**: Always verify the webhook signature
3. **Respond quickly**: Return 200 OK within 5 seconds
4. **Process asynchronously**: Queue events for processing
5. **Handle retries**: Implement idempotency to handle duplicate events
6. **Monitor failures**: Track webhook delivery failures

## Retry Logic

If your endpoint returns a non-200 status code or times out:
- **Retry 1**: After 1 minute
- **Retry 2**: After 5 minutes
- **Retry 3**: After 15 minutes
- **Retry 4**: After 1 hour
- **Retry 5**: After 6 hours

After 5 failed attempts, the webhook will be automatically disabled.

## Managing Webhooks

### List Webhooks
```bash
GET /api/v1/webhooks
```

### Update Webhook
```bash
PUT /api/v1/webhooks/{webhookId}
```

### Delete Webhook
```bash
DELETE /api/v1/webhooks/{webhookId}
```

### Test Webhook
```bash
POST /api/v1/webhooks/{webhookId}/test
```

## Rate Limits

Webhooks do not count against your API rate limit. However:
- Maximum 10 webhook endpoints per tenant
- Maximum 1000 events per webhook per hour

## Debugging

### Webhook Logs

View webhook delivery logs in the dashboard:
```bash
GET /api/v1/webhooks/{webhookId}/deliveries
```

Response:
```json
{
  "deliveries": [
    {
      "id": "del-123",
      "timestamp": "2024-01-15T10:30:00Z",
      "eventType": "ranking.updated",
      "statusCode": 200,
      "duration": 145,
      "success": true
    }
  ]
}
```

### Common Issues

1. **401/403 Errors**: Check your endpoint authentication
2. **Timeouts**: Respond within 5 seconds, process async
3. **SSL Errors**: Ensure valid SSL certificate
4. **Duplicate Events**: Implement idempotency keys
