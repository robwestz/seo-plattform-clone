# TEAM GAMMA - SEO ANALYSIS ENGINE
## SEO Intelligence Platform - Advanced SEO Analytics (25,000 LOC)

---

## 🎯 YOUR MISSION
You are Team Gamma, the **heart of the SEO platform**. You build all the advanced SEO analysis features that users actually pay for: keyword research, rank tracking, competitor analysis, technical SEO audits, and backlink analysis.

**Target**: 25,000 lines of production-ready code (largest team!)
**Timeline**: Depend on Team Beta (crawler) for data input
**Critical Success Factor**: Accuracy and actionable insights

---

## 📋 YOUR RESPONSIBILITIES

### 1. Keyword Research Engine (7,000 LOC)
Build comprehensive keyword research tools:

**Features**:
- Keyword suggestions from multiple sources
- Search volume estimation
- Keyword difficulty scoring
- CPC (Cost Per Click) data
- Search intent classification (Commercial, Informational, Navigational, Transactional)
- SERP feature detection (Featured Snippets, People Also Ask, etc.)
- Competitor keyword gap analysis
- Long-tail keyword generator
- Question keyword finder
- Seasonal trend detection

**Data Sources Integration**:
```typescript
interface KeywordDataProvider {
  getSearchVolume(keyword: string, location: string): Promise<number>;
  getRelatedKeywords(seed: string): Promise<string[]>;
  getSerpFeatures(keyword: string): Promise<SerpFeature[]>;
  getCPC(keyword: string): Promise<number>;
}

// Implement providers for:
- GoogleAdsAPI (primary source)
- GoogleSearchConsole (owned data)
- DatabaseOfKeywords (historical data)
- RelatedSearches scraper
- AutocompleteSuggestions
```

**Keyword Difficulty Algorithm**:
```typescript
interface KeywordDifficultyScore {
  keyword: string;
  difficulty: number; // 0-100
  factors: {
    domainAuthority: number;
    pageAuthority: number;
    backlinksRequired: number;
    contentLength: number;
    topCompetitors: CompetitorMetric[];
  };
}

class KeywordDifficultyCalculator {
  // Analyze top 10 SERP results
  async calculateDifficulty(keyword: string): Promise<KeywordDifficultyScore>;
}
```

**Search Intent Classification** (ML-based):
```python
# Python microservice for ML
from transformers import pipeline

class IntentClassifier:
    def __init__(self):
        self.classifier = pipeline("text-classification",
                                   model="bert-base-uncased")

    def classify_intent(self, keyword: str) -> dict:
        # Returns: {
        #   intent: 'commercial' | 'informational' | 'navigational' | 'transactional',
        #   confidence: 0.95
        # }
```

### 2. Rank Tracking System (6,000 LOC)
Monitor keyword rankings across locations:

**Features**:
- Daily rank tracking
- Mobile vs Desktop rankings
- Local rank tracking (city/country level)
- SERP screenshot storage
- Rank change notifications
- Share of voice calculation
- Ranking distribution analysis
- Competitor rank tracking

**Scale**: Track 1M+ keywords daily across 100+ locations

**Implementation**:
```typescript
interface RankTrackingJob {
  projectId: string;
  keywordId: string;
  location: string;
  device: 'desktop' | 'mobile';
  searchEngine: 'google' | 'bing';
}

interface RankingResult {
  keyword: string;
  position: number;
  url: string;
  previousPosition?: number;
  change: number;
  serpFeatures: string[];
  screenshot?: string; // S3 URL
  competitors: {
    domain: string;
    position: number;
    url: string;
  }[];
  timestamp: Date;
}

class RankTracker {
  async trackKeyword(job: RankTrackingJob): Promise<RankingResult>;
  async batchTrack(jobs: RankTrackingJob[]): Promise<RankingResult[]>;
  async getHistoricalRankings(keywordId: string, days: number): Promise<RankingHistory>;
}
```

**Rank Change Alerts**:
```typescript
interface RankAlert {
  type: 'rank_up' | 'rank_down' | 'rank_lost' | 'rank_gained';
  keyword: string;
  oldPosition: number;
  newPosition: number;
  change: number;
  severity: 'low' | 'medium' | 'high';
}

class AlertService {
  async checkForAlerts(projectId: string): Promise<RankAlert[]>;
  async sendAlert(alert: RankAlert, channels: string[]): Promise<void>;
}
```

### 3. Technical SEO Audit Engine (4,000 LOC)
Comprehensive site health checks:

**Audit Categories**:
- Crawlability issues
- Indexability problems
- Page speed analysis
- Mobile-friendliness
- HTTPS/Security
- Structured data validation
- XML sitemap analysis
- Robots.txt validation
- Canonical tag issues
- Redirect chains
- 404 errors
- Duplicate content
- Thin content pages
- Missing meta tags
- Broken links (internal & external)

**Implementation**:
```typescript
interface SEOAudit {
  domain: string;
  score: number; // 0-100
  issues: SEOIssue[];
  summary: {
    critical: number;
    warnings: number;
    notices: number;
  };
}

interface SEOIssue {
  type: IssueType;
  severity: 'critical' | 'warning' | 'notice';
  title: string;
  description: string;
  affectedPages: string[];
  howToFix: string;
  impact: number; // 0-100
}

class TechnicalSEOAuditor {
  async runAudit(domainId: string): Promise<SEOAudit>;
  async auditPageSpeed(url: string): Promise<PageSpeedScore>;
  async auditStructuredData(url: string): Promise<StructuredDataValidation>;
  async findDuplicateContent(domainId: string): Promise<DuplicateContentReport>;
}
```

**Page Speed Integration**:
```typescript
// Google PageSpeed Insights API
interface PageSpeedScore {
  url: string;
  performance: number;
  accessibility: number;
  bestPractices: number;
  seo: number;
  metrics: {
    fcp: number; // First Contentful Paint
    lcp: number; // Largest Contentful Paint
    cls: number; // Cumulative Layout Shift
    tbt: number; // Total Blocking Time
    tti: number; // Time to Interactive
  };
  opportunities: Opportunity[];
}
```

### 4. Backlink Analysis (4,000 LOC)
Track and analyze backlink profiles:

**Features**:
- Backlink discovery
- Link quality scoring
- Toxic link detection
- Anchor text distribution
- Referring domains analysis
- New/lost links tracking
- Competitor backlink comparison
- Link velocity tracking

**Implementation**:
```typescript
interface Backlink {
  id: string;
  sourceDomain: string;
  sourceUrl: string;
  targetUrl: string;
  anchorText: string;
  relAttributes: string[]; // ['nofollow', 'ugc', etc.]
  firstSeen: Date;
  lastSeen: Date;
  isActive: boolean;
  linkScore: number; // 0-100
  isToxic: boolean;
}

interface BacklinkProfile {
  totalBacklinks: number;
  totalReferringDomains: number;
  domainAuthority: number;
  trustFlow: number;
  citationFlow: number;
  toxicScore: number;
  anchorTextDistribution: {
    text: string;
    count: number;
    percentage: number;
  }[];
  topReferringDomains: {
    domain: string;
    backlinks: number;
    authority: number;
  }[];
}

class BacklinkAnalyzer {
  async getBacklinkProfile(domainId: string): Promise<BacklinkProfile>;
  async findNewBacklinks(domainId: string): Promise<Backlink[]>;
  async detectToxicLinks(domainId: string): Promise<Backlink[]>;
  async compareWithCompetitor(domainId: string, competitorDomain: string): Promise<BacklinkGap>;
}
```

### 5. Competitor Analysis (2,500 LOC)
Track and compare with competitors:

**Features**:
- Competitor discovery
- Keyword gap analysis
- Content gap analysis
- Backlink gap analysis
- Traffic estimation comparison
- SERP overlap analysis
- Share of voice calculation

**Implementation**:
```typescript
interface CompetitorAnalysis {
  yourDomain: string;
  competitor: string;
  keywordGap: {
    onlyYou: number;
    onlyThem: number;
    both: number;
    keywords: KeywordComparison[];
  };
  contentGap: {
    missingTopics: string[];
    opportunityScore: number;
  };
  backlinkGap: {
    yourBacklinks: number;
    theirBacklinks: number;
    commonBacklinks: number;
    uniqueOpportunities: string[];
  };
  trafficComparison: {
    yourEstimate: number;
    theirEstimate: number;
    difference: number;
  };
}

class CompetitorAnalyzer {
  async discoverCompetitors(domainId: string): Promise<string[]>;
  async analyzeGaps(domainId: string, competitorId: string): Promise<CompetitorAnalysis>;
  async calculateShareOfVoice(projectId: string): Promise<ShareOfVoice>;
}
```

### 6. Content Optimization (1,500 LOC)
AI-powered content recommendations:

**Features**:
- Content scoring algorithm
- Readability analysis
- Keyword density optimization
- Topic coverage analysis
- Content length recommendations
- Heading structure optimization
- Image optimization suggestions

**Implementation**:
```typescript
interface ContentScore {
  url: string;
  overallScore: number; // 0-100
  scores: {
    keywordOptimization: number;
    readability: number;
    contentDepth: number;
    structuredData: number;
    multimedia: number;
    userEngagement: number;
  };
  recommendations: Recommendation[];
}

interface Recommendation {
  type: string;
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  expectedImpact: number;
}

class ContentOptimizer {
  async scoreContent(url: string, targetKeyword: string): Promise<ContentScore>;
  async generateRecommendations(content: string, competitors: string[]): Promise<Recommendation[]>;
  async analyzeReadability(content: string): Promise<ReadabilityScore>;
}
```

---

## 🏗️ PROJECT STRUCTURE

```
seo-analysis/
├── backend/
│   ├── src/
│   │   ├── modules/
│   │   │   ├── keywords/
│   │   │   │   ├── keyword.controller.ts
│   │   │   │   ├── keyword.service.ts
│   │   │   │   ├── difficulty-calculator.ts
│   │   │   │   ├── intent-classifier.ts
│   │   │   │   └── suggestion-engine.ts
│   │   │   ├── rankings/
│   │   │   │   ├── rank-tracker.service.ts
│   │   │   │   ├── serp-scraper.ts
│   │   │   │   ├── alert.service.ts
│   │   │   │   └── history.service.ts
│   │   │   ├── audit/
│   │   │   │   ├── technical-audit.service.ts
│   │   │   │   ├── page-speed.service.ts
│   │   │   │   ├── structured-data.validator.ts
│   │   │   │   └── issue-detector.ts
│   │   │   ├── backlinks/
│   │   │   │   ├── backlink.service.ts
│   │   │   │   ├── link-quality.scorer.ts
│   │   │   │   ├── toxic-link.detector.ts
│   │   │   │   └── profile.analyzer.ts
│   │   │   ├── competitors/
│   │   │   │   ├── competitor.service.ts
│   │   │   │   ├── gap-analyzer.ts
│   │   │   │   └── share-of-voice.calculator.ts
│   │   │   └── content/
│   │   │       ├── content-optimizer.service.ts
│   │   │       ├── readability.analyzer.ts
│   │   │       └── recommendation.engine.ts
│   │   └── integrations/
│   │       ├── google-ads.client.ts
│   │       ├── search-console.client.ts
│   │       └── page-speed.client.ts
├── ml-service/ (Python)
│   ├── app/
│   │   ├── intent_classifier.py
│   │   ├── content_scorer.py
│   │   ├── topic_extractor.py
│   │   └── api.py
│   ├── models/
│   │   └── bert-intent-classifier/
│   ├── requirements.txt
│   └── Dockerfile
└── tests/
    ├── unit/
    └── integration/
```

---

## 🔧 TECHNICAL REQUIREMENTS

### Technologies
- **Backend**: NestJS (TypeScript)
- **ML Service**: Python + FastAPI + Transformers
- **Database**: PostgreSQL (main) + ClickHouse (analytics)
- **Caching**: Redis
- **Search**: Elasticsearch
- **Queue**: Redis Bull for async jobs

### Performance Requirements
- Keyword research: < 2s response time
- Rank tracking: 100+ keywords/second
- Technical audit: < 5min for 10K page site
- Backlink analysis: < 3s for profile loading
- Real-time data aggregation

### Accuracy Requirements
- Search volume: ±20% accuracy
- Keyword difficulty: ±15% accuracy
- Rank tracking: 100% accuracy
- Intent classification: >85% accuracy

---

## 📊 DELIVERABLES

### 1. API Endpoints
```
# Keywords
POST   /api/v1/keywords/research
GET    /api/v1/keywords/:id
GET    /api/v1/keywords/suggestions?seed=...
GET    /api/v1/keywords/:id/difficulty
POST   /api/v1/keywords/bulk-import

# Rankings
POST   /api/v1/rankings/track
GET    /api/v1/rankings/:projectId
GET    /api/v1/rankings/:keywordId/history
GET    /api/v1/rankings/alerts

# Audits
POST   /api/v1/audit/start
GET    /api/v1/audit/:id
GET    /api/v1/audit/:id/issues
POST   /api/v1/audit/page-speed

# Backlinks
GET    /api/v1/backlinks/:domainId
GET    /api/v1/backlinks/:domainId/profile
GET    /api/v1/backlinks/:domainId/new
GET    /api/v1/backlinks/:domainId/toxic

# Competitors
POST   /api/v1/competitors/discover
GET    /api/v1/competitors/:domainId/gap
GET    /api/v1/competitors/share-of-voice

# Content
POST   /api/v1/content/score
POST   /api/v1/content/optimize
GET    /api/v1/content/recommendations
```

### 2. Background Jobs
- Daily rank tracking jobs
- Weekly technical audits
- Backlink discovery crawlers
- Competitor monitoring

### 3. ML Models (Python)
- Search intent classifier
- Content quality scorer
- Topic extractor

---

## 🚀 IMPLEMENTATION PHASES

### Phase 1: Keyword Research (50 min)
### Phase 2: Rank Tracking (45 min)
### Phase 3: Technical SEO Audit (40 min)
### Phase 4: Backlink Analysis (35 min)
### Phase 5: Competitor Analysis (30 min)
### Phase 6: Content Optimization (20 min)

---

## 🔗 INTEGRATION POINTS

### You Depend On:
- **Team Alpha**: Multi-tenancy, auth
- **Team Beta**: Crawl data
- **Team Delta**: Google APIs

### Your APIs Used By:
- **Team Epsilon**: All analytics data
- **Team Zeta**: All API endpoints

---

## ⚠️ CRITICAL SUCCESS FACTORS

1. **Accuracy**: Data must be reliable
2. **Speed**: Sub-second responses
3. **Scale**: Handle millions of keywords
4. **Insights**: Actionable recommendations
5. **ML Quality**: High classification accuracy

---

**YOU ARE THE BRAIN OF THE PLATFORM. MAKE IT SMART. 🧠**

BEGIN MEGA-FILE CREATION FOR TEAM GAMMA!
