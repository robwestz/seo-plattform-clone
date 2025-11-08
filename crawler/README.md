# SEO Intelligence Platform - Crawler Infrastructure

A distributed, production-ready web crawler system built with Go and Node.js/TypeScript. This crawler infrastructure handles large-scale web crawling with JavaScript rendering, polite crawling, and comprehensive data extraction.

## Architecture

### Components

1. **Crawler Worker (Go)** - Distributed crawler with rate limiting and robots.txt support
2. **Scheduler Service (Go)** - Job scheduling and sitemap processing
3. **Renderer Service (Node.js/TypeScript)** - JavaScript rendering with Puppeteer
4. **PostgreSQL** - Metadata and structured data storage
5. **MongoDB** - Raw HTML and large content storage
6. **Kafka** - Distributed job queue

### Technology Stack

- **Go 1.21+** - High-performance crawler and scheduler
- **Node.js 18+** - JavaScript rendering service
- **TypeScript** - Type-safe renderer implementation
- **Puppeteer** - Headless Chrome automation
- **PostgreSQL 16** - Relational database for metadata
- **MongoDB 7** - Document database for raw content
- **Apache Kafka** - Message queue for distributed crawling
- **Docker** - Containerization and orchestration

## Features

### Crawler Core

- ✅ **Polite Crawling**
  - Robots.txt parsing and compliance
  - Configurable crawl-delay
  - Per-domain rate limiting
  - Exponential backoff retry logic

- ✅ **URL Management**
  - Bloom filter for deduplication
  - URL queue with Kafka
  - Depth-limited crawling
  - Priority-based scheduling

- ✅ **Content Extraction**
  - HTML parsing with goquery
  - Link extraction and normalization
  - Meta tags and Open Graph data
  - Structured data (JSON-LD)
  - Image cataloging

- ✅ **Change Detection**
  - Content hashing (SHA-256)
  - Version history tracking
  - Automatic re-crawl on changes

### Renderer Service

- ✅ **JavaScript Rendering**
  - Puppeteer cluster management
  - Parallel rendering with worker pool
  - Screenshot capture
  - Performance metrics collection

- ✅ **Resource Optimization**
  - Ad blocking
  - Analytics script blocking
  - Image blocking (optional)
  - Configurable resource filtering

### Storage

- ✅ **PostgreSQL**
  - Page metadata
  - Crawl job status
  - Link relationships
  - Aggregated statistics

- ✅ **MongoDB**
  - Raw HTML storage
  - Page versions
  - Screenshots
  - Large content blobs

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Go 1.21+ (for local development)
- Node.js 18+ (for local development)
- Make (optional, for using Makefile)

### Using Docker Compose (Recommended)

```bash
# Clone the repository
cd /home/user/seo-intelligence-platform/crawler

# Start all services
docker-compose up -d

# Check service health
docker-compose ps

# View logs
docker-compose logs -f crawler
```

### Local Development

```bash
# Install Go dependencies
make deps

# Build all services
make build

# Run crawler worker
make run-crawler

# Run scheduler (in another terminal)
make run-scheduler

# Run renderer (in another terminal)
make run-renderer
```

## API Reference

### Crawler API (Port 8080)

#### Start a Crawl Job

```bash
POST /crawl
Content-Type: application/json

{
  "url": "https://example.com",
  "max_depth": 3,
  "priority": 1
}

Response:
{
  "job_id": 123,
  "url": "https://example.com",
  "status": "queued"
}
```

#### Get Crawl Job Status

```bash
GET /crawl/:id/status

Response:
{
  "id": 123,
  "url": "https://example.com",
  "status": "completed",
  "created_at": "2024-01-01T00:00:00Z",
  "completed_at": "2024-01-01T00:01:00Z"
}
```

#### Get Robots.txt Info

```bash
GET /robots?domain=example.com

Response:
{
  "domain": "https://example.com",
  "sitemaps": [
    "https://example.com/sitemap.xml"
  ]
}
```

#### Get Sitemap URLs

```bash
GET /sitemap?url=https://example.com/sitemap.xml

Response:
{
  "sitemap": "https://example.com/sitemap.xml",
  "count": 100,
  "urls": [...]
}
```

#### Get Statistics

```bash
GET /stats

Response:
{
  "deduplicator": {
    "storeSize": 10000,
    "bloomCount": 10000
  },
  "kafka": {
    "writes": 5000,
    "messages": 5000
  }
}
```

### Scheduler API (Port 8081)

#### Schedule Domain Crawl

```bash
POST /schedule/domain
Content-Type: application/json

{
  "domain": "example.com",
  "max_depth": 3,
  "priority": 1
}

Response:
{
  "domain": "example.com",
  "job_ids": [123, 124, 125],
  "status": "scheduled"
}
```

#### Schedule Sitemap Crawl

```bash
POST /schedule/sitemap
Content-Type: application/json

{
  "sitemap_url": "https://example.com/sitemap.xml",
  "max_depth": 2,
  "priority": 1
}

Response:
{
  "sitemap_url": "https://example.com/sitemap.xml",
  "job_id": 123,
  "status": "scheduled"
}
```

#### Bulk Schedule

```bash
POST /schedule/bulk
Content-Type: application/json

{
  "urls": [
    "https://example.com",
    "https://example.org"
  ],
  "max_depth": 2,
  "priority": 1
}

Response:
{
  "scheduled": 2,
  "job_ids": [123, 124]
}
```

### Renderer API (Port 3000)

#### Render Page

```bash
POST /render
Content-Type: application/json

{
  "url": "https://example.com",
  "waitForSelector": "#content",
  "screenshot": true,
  "fullPage": true
}

Response:
{
  "url": "https://example.com",
  "finalUrl": "https://example.com/",
  "html": "<!DOCTYPE html>...",
  "screenshot": "base64-encoded-image",
  "metrics": {
    "domContentLoaded": 500,
    "loadComplete": 1000,
    ...
  },
  "status": "success"
}
```

#### Take Screenshot

```bash
POST /screenshot
Content-Type: application/json

{
  "url": "https://example.com",
  "fullPage": true,
  "type": "png"
}

Response:
{
  "url": "https://example.com",
  "screenshot": "base64-encoded-image"
}
```

#### Batch Render

```bash
POST /render/batch
Content-Type: application/json

{
  "requests": [
    {"url": "https://example.com"},
    {"url": "https://example.org"}
  ]
}

Response:
{
  "results": [
    {...},
    {...}
  ]
}
```

## Configuration

### Environment Variables

#### Crawler Worker

```bash
POSTGRES_URL=postgres://postgres:password@localhost:5432/seo_platform
MONGO_URL=mongodb://admin:password@localhost:27017
MONGO_DATABASE=seo_crawler
KAFKA_BROKERS=localhost:9092
KAFKA_TOPIC=crawl-jobs
KAFKA_CONSUMER_GROUP=crawler-workers
USER_AGENT=SEO-Intelligence-Bot/1.0
RESPECT_ROBOTS=true
PORT=8080
```

#### Scheduler

```bash
POSTGRES_URL=postgres://postgres:password@localhost:5432/seo_platform
KAFKA_BROKERS=localhost:9092
KAFKA_TOPIC=crawl-jobs
USER_AGENT=SEO-Intelligence-Bot/1.0
PORT=8081
```

#### Renderer

```bash
PORT=3000
CLUSTER_MAX_CONCURRENCY=10
CLUSTER_TIMEOUT=30000
BROWSER_HEADLESS=true
BLOCK_RESOURCES=true
BLOCK_ADS=true
BLOCK_ANALYTICS=true
LOG_LEVEL=info
```

## Project Structure

```
crawler/
├── cmd/
│   ├── crawler/          # Main crawler worker
│   │   └── main.go
│   └── scheduler/        # Scheduler service
│       └── main.go
├── internal/
│   ├── crawler/          # Crawler logic
│   │   ├── crawler.go
│   │   ├── http_client.go
│   │   ├── rate_limiter.go
│   │   ├── robots.go
│   │   └── sitemap.go
│   ├── parser/           # HTML parsing
│   │   ├── html.go
│   │   └── links.go
│   ├── storage/          # Data storage
│   │   ├── postgres.go
│   │   └── mongodb.go
│   └── queue/            # Message queue
│       └── kafka.go
├── pkg/
│   └── bloom/            # Bloom filter
│       └── filter.go
├── renderer/             # JavaScript renderer
│   ├── src/
│   │   ├── app.ts
│   │   ├── cluster-manager.ts
│   │   ├── renderer.ts
│   │   ├── types.ts
│   │   └── logger.ts
│   ├── package.json
│   └── tsconfig.json
├── go.mod
├── go.sum
├── docker-compose.yml
├── Dockerfile.crawler
├── Dockerfile.scheduler
├── Dockerfile.renderer
├── init-db.sql
├── Makefile
└── README.md
```

## Database Schema

### PostgreSQL Tables

- `crawl_jobs` - Crawl job tracking
- `page_metadata` - Page metadata and SEO data
- `page_links` - Link relationships
- `page_images` - Image catalog
- `crawl_stats` - Domain statistics
- `robots_cache` - Robots.txt cache
- `sitemap_entries` - Sitemap URLs

### MongoDB Collections

- `page_content` - Raw HTML storage
- `page_versions` - Historical versions

## Monitoring and Metrics

### Health Checks

All services expose `/health` endpoints:

- Crawler: `http://localhost:8080/health`
- Scheduler: `http://localhost:8081/health`
- Renderer: `http://localhost:3000/health`

### Statistics

Get real-time statistics from `/stats` endpoints.

## Scaling

### Horizontal Scaling

```bash
# Scale crawler workers
docker-compose up -d --scale crawler=5

# Each worker consumes from Kafka independently
```

### Performance Tuning

1. **Crawler Workers**: Adjust `MAX_CONCURRENCY` and `RATE_LIMIT_PER_SEC`
2. **Renderer**: Modify `CLUSTER_MAX_CONCURRENCY`
3. **Kafka**: Increase partitions for better parallelization
4. **PostgreSQL**: Add connection pooling
5. **MongoDB**: Enable sharding for large datasets

## Best Practices

1. **Respect robots.txt** - Always enable `RESPECT_ROBOTS`
2. **Rate limiting** - Use conservative rate limits
3. **User agent** - Provide contact information in user agent
4. **Error handling** - Monitor failed jobs and retry appropriately
5. **Storage cleanup** - Regularly purge old versions

## Troubleshooting

### Common Issues

**Kafka connection failed**
```bash
# Check Kafka is running
docker-compose ps kafka

# View Kafka logs
docker-compose logs kafka
```

**Database connection errors**
```bash
# Check database health
docker-compose ps postgres mongodb

# Initialize database
make init-db
```

**Renderer timeout**
```bash
# Increase timeout
CLUSTER_TIMEOUT=60000

# Reduce concurrency
CLUSTER_MAX_CONCURRENCY=5
```

## Development

### Running Tests

```bash
# Run all tests
make test

# Run Go tests only
go test -v ./...

# Run renderer tests
cd renderer && npm test
```

### Code Style

```bash
# Lint Go code
make lint

# Format Go code
go fmt ./...

# Lint TypeScript
cd renderer && npm run lint
```

## License

MIT License - See LICENSE file for details

## Support

For issues and questions:
- GitHub Issues: https://github.com/seo-platform/crawler/issues
- Documentation: https://docs.seo-platform.com
- Email: support@seo-platform.com

## Contributors

Team Beta - Crawler Infrastructure
