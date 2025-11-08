# Quick Start Guide - SEO Crawler Infrastructure

## 5-Minute Setup

### Step 1: Start Services with Docker Compose

```bash
cd /home/user/seo-intelligence-platform/crawler
docker-compose up -d
```

This will start:
- PostgreSQL (port 5432)
- MongoDB (port 27017)
- Kafka + Zookeeper (port 9092)
- Crawler Workers (port 8080)
- Scheduler (port 8081)
- Renderer (port 3000)

### Step 2: Verify Services are Running

```bash
# Check all containers
docker-compose ps

# Health checks
curl http://localhost:8080/health  # Crawler
curl http://localhost:8081/health  # Scheduler
curl http://localhost:3000/health  # Renderer
```

Expected response: `{"status":"healthy"}`

### Step 3: Start Your First Crawl

#### Option A: Single URL Crawl

```bash
curl -X POST http://localhost:8080/crawl \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "max_depth": 2,
    "priority": 1
  }'
```

Response:
```json
{
  "job_id": 1,
  "url": "https://example.com",
  "status": "queued"
}
```

#### Option B: Schedule Domain Crawl (with Sitemap Discovery)

```bash
curl -X POST http://localhost:8081/schedule/domain \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "example.com",
    "max_depth": 3,
    "priority": 1
  }'
```

#### Option C: Bulk URL Scheduling

```bash
curl -X POST http://localhost:8081/schedule/bulk \
  -H "Content-Type: application/json" \
  -d '{
    "urls": [
      "https://example.com",
      "https://example.org",
      "https://example.net"
    ],
    "max_depth": 2,
    "priority": 1
  }'
```

### Step 4: Check Crawl Status

```bash
# Get job status (replace 1 with your job_id)
curl http://localhost:8080/crawl/1/status
```

Response:
```json
{
  "id": 1,
  "url": "https://example.com",
  "domain": "example.com",
  "status": "completed",
  "created_at": "2024-01-01T00:00:00Z",
  "completed_at": "2024-01-01T00:01:00Z"
}
```

### Step 5: Render JavaScript Page

```bash
curl -X POST http://localhost:3000/render \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "screenshot": true,
    "fullPage": true,
    "waitForTimeout": 2000
  }'
```

## Common Tasks

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f crawler
docker-compose logs -f scheduler
docker-compose logs -f renderer
```

### Scale Crawler Workers

```bash
docker-compose up -d --scale crawler=5
```

### Stop Services

```bash
docker-compose down
```

### Restart Services

```bash
docker-compose restart
```

### Access Databases

#### PostgreSQL

```bash
docker-compose exec postgres psql -U postgres -d seo_platform

# View crawl jobs
SELECT id, url, status, created_at FROM crawl_jobs ORDER BY id DESC LIMIT 10;

# View page metadata
SELECT url, title, status_code, crawled_at FROM page_metadata ORDER BY crawled_at DESC LIMIT 10;
```

#### MongoDB

```bash
docker-compose exec mongodb mongosh -u admin -p password

use seo_crawler

# View page content
db.page_content.find().limit(5).pretty()

# Count documents
db.page_content.countDocuments()
```

### View Statistics

```bash
# Crawler stats
curl http://localhost:8080/stats

# Renderer stats
curl http://localhost:3000/stats
```

## Useful Queries

### Get Robots.txt Info

```bash
curl "http://localhost:8080/robots?domain=example.com"
```

### Parse Sitemap

```bash
curl "http://localhost:8080/sitemap?url=https://example.com/sitemap.xml"
```

### Take Screenshot Only

```bash
curl -X POST http://localhost:3000/screenshot \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "fullPage": true,
    "type": "png"
  }'
```

## Troubleshooting

### Services Won't Start

```bash
# Check Docker is running
docker info

# Check logs for errors
docker-compose logs

# Clean up and restart
docker-compose down -v
docker-compose up -d
```

### Database Connection Errors

```bash
# Wait for databases to be ready
docker-compose up -d postgres mongodb
sleep 10
docker-compose up -d crawler scheduler
```

### Kafka Connection Issues

```bash
# Restart Kafka services
docker-compose restart zookeeper kafka
sleep 10
docker-compose restart crawler scheduler
```

### Reset Everything

```bash
# WARNING: This will delete all data
docker-compose down -v
docker-compose up -d
```

## Environment Configuration

### Development Settings

Create a `.env` file:

```bash
# Copy example
cp .env.example .env

# Edit as needed
POSTGRES_URL=postgres://postgres:password@localhost:5432/seo_platform
MONGO_URL=mongodb://admin:password@localhost:27017
KAFKA_BROKERS=localhost:9092
RESPECT_ROBOTS=true
RATE_LIMIT_PER_SEC=2.0
```

### Production Settings

See `DEPLOYMENT.md` for production configuration.

## Next Steps

1. **Integrate with Backend**: Connect crawler to your FastAPI backend
2. **Set up Monitoring**: Add Prometheus/Grafana
3. **Configure Alerts**: Set up error notifications
4. **Scale Workers**: Adjust based on load
5. **Review Logs**: Monitor crawl performance

## Need Help?

- **Documentation**: See `README.md` for full API reference
- **Deployment**: See `DEPLOYMENT.md` for production setup
- **Architecture**: See `CRAWLER_SUMMARY.md` for technical details

## Common Crawl Patterns

### Crawl with Custom User Agent

```bash
curl -X POST http://localhost:8080/crawl \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "max_depth": 2
  }'

# User agent is configured via environment variable
```

### Crawl Specific Sitemap

```bash
curl -X POST http://localhost:8081/schedule/sitemap \
  -H "Content-Type: application/json" \
  -d '{
    "sitemap_url": "https://example.com/post-sitemap.xml",
    "max_depth": 1,
    "priority": 5
  }'
```

### Render with Custom Viewport

```bash
curl -X POST http://localhost:3000/render \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "viewport": {
      "width": 1280,
      "height": 720
    },
    "screenshot": true
  }'
```

## Performance Tips

1. **Start Small**: Begin with max_depth=2
2. **Monitor Resources**: Watch CPU/memory usage
3. **Adjust Rate Limits**: Based on target site
4. **Scale Gradually**: Add workers as needed
5. **Use Priorities**: High priority for important crawls

## Success!

You now have a fully functional distributed web crawler. Happy crawling! 🚀
