# SEO Intelligence Platform - JavaScript/TypeScript SDK

Official JavaScript/TypeScript SDK for the SEO Intelligence Platform API.

## Installation

```bash
npm install @seo-platform/sdk
# or
yarn add @seo-platform/sdk
```

## Quick Start

```typescript
import { SEOPlatform } from '@seo-platform/sdk';

const client = new SEOPlatform({
  apiKey: 'your-api-key',
});

// List projects
const projects = await client.projects.list();

// Create a project
const project = await client.projects.create({
  name: 'My Website',
  domain: 'example.com',
  targetCountry: 'US',
  targetLanguage: 'en',
});

// Add keywords
const keyword = await client.keywords.create(project.id, {
  keyword: 'best seo tools',
  tags: ['tools', 'seo'],
});

// Track rankings
const rankings = await client.rankings.track(project.id, [keyword.id]);

// Start site audit
const audit = await client.audits.start(project.id);
```

## Real-time Updates

Enable WebSocket for real-time updates:

```typescript
const client = new SEOPlatform({
  apiKey: 'your-api-key',
  enableWebSocket: true,
});

// Subscribe to project events
client.subscribeToProject('project-id');

// Listen to ranking updates
client.on('ranking:updated', (data) => {
  console.log('Ranking updated:', data);
});

// Listen to audit progress
client.on('audit:progress', (data) => {
  console.log('Audit progress:', data.progress);
});
```

## API Resources

### Projects

```typescript
// List projects
const { data: projects } = await client.projects.list();

// Get project
const project = await client.projects.get('project-id');

// Update project
await client.projects.update('project-id', { name: 'New Name' });

// Delete project
await client.projects.delete('project-id');
```

### Keywords

```typescript
// List keywords
const { data: keywords } = await client.keywords.list('project-id');

// Add keyword
const keyword = await client.keywords.create('project-id', {
  keyword: 'seo analytics',
});

// Get suggestions
const suggestions = await client.keywords.suggestions('seo', 10);

// Delete keyword
await client.keywords.delete('keyword-id');
```

### Rankings

```typescript
// Get current rankings
const { data: rankings } = await client.rankings.list('project-id');

// Get ranking history
const history = await client.rankings.history('keyword-id', 30);

// Track rankings
await client.rankings.track('project-id', ['keyword-1', 'keyword-2']);
```

### Audits

```typescript
// List audits
const audits = await client.audits.list('project-id');

// Start audit
const audit = await client.audits.start('project-id', 1000);

// Get latest audit
const latest = await client.audits.latest('project-id');

// Cancel audit
await client.audits.cancel('audit-id');
```

### Backlinks

```typescript
// List backlinks
const { data: backlinks } = await client.backlinks.list('project-id');

// Get stats
const stats = await client.backlinks.stats('project-id');

// Refresh backlinks
await client.backlinks.refresh('project-id');
```

## Rate Limiting

The SDK automatically handles rate limiting. When a rate limit is exceeded, it will throw an error with retry information:

```typescript
try {
  await client.projects.list();
} catch (error) {
  if (error.message.includes('Rate limit exceeded')) {
    // Handle rate limit error
    console.log('Please retry after the specified time');
  }
}
```

## Error Handling

```typescript
try {
  const project = await client.projects.get('invalid-id');
} catch (error) {
  console.error('Error:', error.message);
}
```

## TypeScript Support

The SDK is written in TypeScript and includes full type definitions:

```typescript
import { Project, Keyword, Ranking } from '@seo-platform/sdk';

const project: Project = await client.projects.get('project-id');
```

## License

MIT
