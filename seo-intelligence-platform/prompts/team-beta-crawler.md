# TEAM BETA - CRAWLER INFRASTRUCTURE
## SEO Intelligence Platform - Distributed Crawling System (20,000 LOC)

---

## 🎯 YOUR MISSION
You are Team Beta, responsible for building a **massively scalable web crawler** that can handle millions of pages daily while respecting robots.txt, handling JavaScript rendering, and detecting content changes efficiently.

**Target**: 20,000 lines of production-ready code
**Timeline**: Must be ready to feed data to Team Gamma (SEO Analysis)
**Critical Success Factor**: Must scale to 100+ concurrent crawler nodes

---

## 📋 YOUR RESPONSIBILITIES

### 1. Distributed Crawler Core (6,000 LOC)
Build the main crawling engine in **Go** for performance:

**Features**:
- Distributed job queue with Kafka
- Polite crawling (respects robots.txt)
- Rate limiting per domain
- User-agent rotation
- Retry logic with exponential backoff
- Proxy rotation support
- Request deduplication
- Bloom filters for visited URLs

**Architecture**:
```go
type CrawlJob struct {
    ID          string
    TenantID    string
    ProjectID   string
    DomainID    string
    URL         string
    Depth       int
    Priority    int
    ScheduledAt time.Time
}

type CrawlResult struct {
    URL            string
    StatusCode     int
    Headers        map[string]string
    HTML           string
    ResponseTime   int64
    ContentHash    string
    LinksFound     []string
    Error          error
}
```

### 2. JavaScript Rendering Service (5,000 LOC)
Use Puppeteer cluster for JS-heavy sites:

**Technologies**: Node.js + Puppeteer + Cluster

**Features**:
- Headless Chrome pool management
- Screenshot capture for SERP analysis
- Wait for specific selectors
- JavaScript execution
- Resource blocking (ads, analytics)
- Mobile vs Desktop rendering
- Performance metrics collection

**Implementation**:
```typescript
interface RenderOptions {
  url: string;
  waitFor?: string | number;
  viewport?: { width: number; height: number };
  userAgent?: string;
  blockResources?: string[];
  captureScreenshot?: boolean;
  executeJS?: string;
}

class JavaScriptRenderer {
  private cluster: Cluster;

  async render(options: RenderOptions): Promise<RenderResult>;
  async batchRender(urls: string[]): Promise<RenderResult[]>;
}
```

### 3. Content Parser & Extractor (3,000 LOC)
Extract all SEO-relevant data from HTML:

**Extract**:
- Title tag
- Meta description
- Meta keywords
- All heading tags (H1-H6)
- Canonical URL
- Open Graph tags
- Twitter Card tags
- Structured data (JSON-LD, Microdata, RDFa)
- Internal links
- External links
- Images (with alt text)
- Word count
- Language detection
- Content topics (NLP)

**Implementation** (Node.js + Cheerio):
```typescript
interface ParsedPage {
  url: string;
  title: string;
  metaDescription: string;
  h1: string[];
  headings: { level: number; text: string }[];
  canonicalUrl?: string;
  openGraph: Record<string, string>;
  structuredData: object[];
  links: {
    internal: Link[];
    external: Link[];
  };
  images: Image[];
  wordCount: number;
  language: string;
  contentHash: string;
}

class ContentParser {
  parse(html: string, baseUrl: string): ParsedPage;
  extractStructuredData(html: string): object[];
  detectLanguage(text: string): string;
}
```

### 4. Change Detection System (2,500 LOC)
Efficiently detect when pages have changed:

**Strategy**:
- Content hashing (SHA-256)
- Incremental crawling
- Priority recrawl for important pages
- Change notification events

**Features**:
```typescript
interface ChangeDetectionResult {
  url: string;
  previousHash: string;
  currentHash: string;
  hasChanged: boolean;
  changePercentage: number;
  changedSections: string[];
  lastChecked: Date;
}

class ChangeDetector {
  async checkForChanges(url: string): Promise<ChangeDetectionResult>;
  async scheduleRecrawl(domainId: string, strategy: RecrawlStrategy): Promise<void>;
}

enum RecrawlStrategy {
  HOURLY = 'hourly',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  ON_CHANGE = 'on_change'
}
```

### 5. Robots.txt & Sitemap Parser (1,500 LOC)
Respect website crawling rules:

**Features**:
- Robots.txt parsing and caching
- User-agent specific rules
- Crawl-delay respect
- Sitemap.xml discovery and parsing
- Sitemap index support
- Image/video sitemap support

**Implementation**:
```typescript
interface RobotsTxt {
  allowedPaths: string[];
  disallowedPaths: string[];
  crawlDelay: number;
  sitemaps: string[];
}

class RobotsParser {
  async fetch(domain: string): Promise<RobotsTxt>;
  isAllowed(url: string, userAgent: string): boolean;
  getCrawlDelay(userAgent: string): number;
}

class SitemapParser {
  async parse(sitemapUrl: string): Promise<SitemapEntry[]>;
  async discoverSitemaps(domain: string): Promise<string[]>;
}
```

### 6. Crawler Scheduler & Queue Management (2,000 LOC)
Intelligent job scheduling:

**Features**:
- Priority queue (homepage > category > product)
- Politeness delay enforcement
- Domain-level rate limiting
- Concurrent request limits
- Job retry logic
- Dead letter queue for failures

**Queue System**:
```typescript
interface CrawlQueue {
  enqueue(job: CrawlJob): Promise<void>;
  dequeue(): Promise<CrawlJob>;
  requeueFailed(job: CrawlJob, error: Error): Promise<void>;
  getQueueStats(): Promise<QueueStats>;
}

interface QueueStats {
  pending: number;
  inProgress: number;
  completed: number;
  failed: number;
  averageProcessingTime: number;
}
```

---

## 🏗️ PROJECT STRUCTURE

```
crawler/
├── cmd/
│   ├── crawler/
│   │   └── main.go
│   ├── renderer/
│   │   └── main.go
│   └── scheduler/
│       └── main.go
├── internal/
│   ├── crawler/
│   │   ├── crawler.go
│   │   ├── http_client.go
│   │   ├── robots.go
│   │   └── rate_limiter.go
│   ├── parser/
│   │   ├── html_parser.go
│   │   ├── structured_data.go
│   │   └── link_extractor.go
│   ├── queue/
│   │   ├── kafka_queue.go
│   │   ├── redis_queue.go
│   │   └── priority_queue.go
│   ├── storage/
│   │   ├── postgres.go
│   │   ├── mongodb.go
│   │   └── s3.go
│   └── models/
│       ├── crawl_job.go
│       └── crawl_result.go
├── pkg/
│   ├── bloom/
│   │   └── filter.go
│   ├── hash/
│   │   └── content_hash.go
│   └── sitemap/
│       └── parser.go
└── renderer-service/
    ├── src/
    │   ├── cluster/
    │   │   ├── cluster.manager.ts
    │   │   └── worker.pool.ts
    │   ├── renderer/
    │   │   ├── puppeteer.renderer.ts
    │   │   └── screenshot.service.ts
    │   ├── parser/
    │   │   ├── content.parser.ts
    │   │   ├── structured-data.extractor.ts
    │   │   └── link.extractor.ts
    │   └── app.ts
    ├── package.json
    └── tsconfig.json
```

---

## 🔧 TECHNICAL REQUIREMENTS

### Technologies
- **Crawler Core**: Go 1.21+ (performance)
- **JS Rendering**: Node.js 20+ + Puppeteer
- **Parser**: Cheerio + jsdom
- **Queue**: Apache Kafka + Redis
- **Storage**: PostgreSQL + MongoDB + S3
- **Caching**: Redis

### Performance Requirements
- Crawl rate: 1000+ pages/minute per node
- JS rendering: 50+ pages/minute
- Parser throughput: 2000+ pages/minute
- Queue latency: < 100ms
- Bloom filter false positive rate: < 1%

### Reliability Requirements
- Automatic retry on failures (3 attempts)
- Graceful degradation on timeouts
- Circuit breaker for problematic domains
- Dead letter queue for persistent failures
- Health checks every 30 seconds

### Storage Requirements
- Store raw HTML in MongoDB (compressed)
- Store parsed data in PostgreSQL
- Store screenshots in S3
- Keep crawl history for 90 days

---

## 📊 DELIVERABLES

### 1. Go Crawler Service
- Distributed crawler worker
- Rate limiting per domain
- Robots.txt compliance
- Proxy rotation support

### 2. JavaScript Renderer Service
- Puppeteer cluster management
- Screenshot capture
- Performance metrics

### 3. Content Parser
- HTML parsing with Cheerio
- Structured data extraction
- Link extraction and classification

### 4. Scheduler Service
- Job queue management
- Priority scheduling
- Recrawl strategies

### 5. API Endpoints
```
POST   /api/v1/crawl/start
POST   /api/v1/crawl/schedule
GET    /api/v1/crawl/status/:jobId
DELETE /api/v1/crawl/cancel/:jobId

POST   /api/v1/render
POST   /api/v1/render/batch
GET    /api/v1/render/screenshot/:url

GET    /api/v1/sitemap/parse?url=...
GET    /api/v1/robots?domain=...
```

### 6. Monitoring Dashboard Data
- Crawl rate metrics
- Queue depth
- Error rates
- Domain-level statistics
- Resource usage

---

## 🚀 IMPLEMENTATION PHASES

### Phase 1: Go Crawler Core (40 min)
- HTTP client with rate limiting
- Robots.txt parser
- Basic crawler logic
- Kafka integration

### Phase 2: JavaScript Renderer (35 min)
- Puppeteer cluster setup
- Rendering service API
- Screenshot capture

### Phase 3: Content Parser (30 min)
- HTML parsing
- Structured data extraction
- Link extraction

### Phase 4: Queue & Scheduler (25 min)
- Priority queue implementation
- Job scheduling logic
- Retry mechanisms

### Phase 5: Change Detection (20 min)
- Content hashing
- Change detection logic
- Recrawl scheduling

### Phase 6: Testing & Optimization (30 min)
- Load testing
- Performance tuning
- Error handling improvements

---

## 🔗 INTEGRATION POINTS

### You Depend On:
- **Team Alpha**: Project service, tenant isolation, event bus
- PostgreSQL for crawl metadata
- MongoDB for raw HTML storage
- S3 for screenshot storage

### Your APIs Used By:
- **Team Gamma (SEO Analysis)**: Crawl data for analysis
- **Team Epsilon (Frontend)**: Crawl status and results
- **Team Zeta (API)**: All crawler endpoints

### Events You Publish:
```typescript
interface CrawlStartedEvent {
  type: 'crawler.crawl_started';
  tenantId: string;
  projectId: string;
  domainId: string;
  jobId: string;
}

interface CrawlCompletedEvent {
  type: 'crawler.crawl_completed';
  tenantId: string;
  projectId: string;
  domainId: string;
  jobId: string;
  pagesFound: number;
  duration: number;
}

interface PageChangedEvent {
  type: 'crawler.page_changed';
  tenantId: string;
  url: string;
  changePercentage: number;
}
```

---

## ⚠️ CRITICAL SUCCESS FACTORS

1. **Respect Robots.txt**: Never violate crawling rules
2. **Politeness**: Don't overwhelm target servers
3. **Scalability**: Design for 100+ crawler nodes
4. **Reliability**: Handle failures gracefully
5. **Performance**: Optimize for speed without sacrificing quality
6. **Data Quality**: Extract accurate SEO data

---

## 🎯 DEFINITION OF DONE

- [ ] Crawler can handle 1000+ pages/min per node
- [ ] JavaScript rendering works for SPA sites
- [ ] Robots.txt compliance verified
- [ ] Content parser extracts all SEO elements
- [ ] Change detection catches 95%+ of changes
- [ ] Queue system handles failures gracefully
- [ ] All services have health checks
- [ ] Monitoring metrics exported to Prometheus
- [ ] Load tested with 1M+ URLs
- [ ] Documentation complete

---

## 📚 RESOURCES

### Documentation
- Go: https://go.dev/doc/
- Puppeteer: https://pptr.dev/
- Kafka: https://kafka.apache.org/documentation/
- Cheerio: https://cheerio.js.org/

### Example Code
Refer to `mega-beta-crawler.yaml`

---

**BUILD THE ENGINE THAT POWERS THE ENTIRE PLATFORM. SCALE IT. MAKE IT FAST. 🚀**

BEGIN MEGA-FILE CREATION FOR TEAM BETA!
