# VIKTIGA UPPDATERINGAR FÖR MOCKUP-DATA IMPLEMENTATION

## ⚠️ KRITISK REGEL FÖR GEMINI

**Efter varje API endpoint eller feature du implementerar:**

1. **Skapa API endpoint** →
2. **Skapa/uppdatera component** som använder datan →
3. **TESTA I BROWSER** på http://localhost:3001 →
4. **VERIFIERA** att data syns korrekt →
5. **Nästa feature**

**ARBETSFLÖDE:**
```
┌─────────────────────────────────────────────────────┐
│ 1. Skapa API: /api/rankings/[projectId]/route.ts   │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│ 2. Uppdatera: RankingDashboard component           │
│    - Hämta data från API                            │
│    - Rendera i UI med charts/tables                 │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│ 3. ÖPPNA BROWSER: localhost:3001/dashboard/rankings│
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│ 4. VERIFIERA:                                       │
│    ✓ Data laddar                                    │
│    ✓ Charts renderas                                │
│    ✓ Inga console errors                            │
│    ✓ Interaktivitet fungerar (hover, click, filter)│
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│ 5. GÅ VIDARE till nästa feature                     │
└─────────────────────────────────────────────────────┘
```

---

# Semantic Keyword Detail View - Next Level SEO Analysis

**INSTRUKTIONER FÖR GEMINI: Skapa avancerad keyword detail-sida med semantisk analys**

## Översikt

Skapa en komplett keyword detail-sida där användaren kan klicka på ett keyword från rankings-listan och se djupgående semantisk analys - funktioner som går bortom Ahrefs och andra SEO-verktyg.

**Arbetsområde:** `C:\Users\robin\Downloads\seo-platform-clone\frontend`

---

## 1. API Endpoints för Keyword Details

### 1.1 Main Keyword Detail API
**Fil:** `frontend/app/api/keywords/[keywordId]/route.ts`

GET endpoint som returnerar omfattande keyword-data:

```typescript
{
  // Basic Info
  keyword: string
  searchVolume: number
  difficulty: number
  cpc: number
  competition: number

  // Current Performance
  currentPosition: number
  previousPosition: number
  trend: 'up' | 'down' | 'stable'
  clicks: number
  impressions: number
  ctr: number

  // Historical Data (90 days)
  positionHistory: Array<{
    date: string
    position: number
    clicks: number
    impressions: number
  }>

  // Primary Intent
  primaryIntent: 'informational' | 'navigational' | 'commercial' | 'transactional'
  intentConfidence: number // 0-100

  // SERP Features
  serpFeatures: string[]
  featuredSnippet: {
    hasSnippet: boolean
    ownedByYou: boolean
    snippetType: 'paragraph' | 'list' | 'table' | 'video'
    content?: string
  }

  // Ranking URL
  rankingUrl: string
  rankingPage: {
    title: string
    metaDescription: string
    wordCount: number
    lastUpdated: string
    internalLinks: number
    externalLinks: number
  }
}
```

**Datakrav:**
- Realistisk historisk data över 90 dagar
- Position variationer med trender
- Korrekt korrelation mellan metrics

---

### 1.2 SERP Intent Distribution API
**Fil:** `frontend/app/api/keywords/[keywordId]/serp-intent/route.ts`

GET endpoint som analyserar intent för topp 10 i SERP:

```typescript
{
  keyword: string
  topResults: Array<{
    position: number
    url: string
    domain: string
    title: string
    description: string

    // Intent Analysis
    detectedIntent: 'informational' | 'navigational' | 'commercial' | 'transactional'
    intentSignals: string[] // ["has pricing", "contains tutorial", "product page", etc.]

    // Content Type
    contentType: 'blog' | 'product' | 'landing' | 'video' | 'tool' | 'forum' | 'news'

    // Engagement Signals
    hasVideo: boolean
    hasImages: boolean
    hasFAQ: boolean
    hasReviews: boolean
    hasPricing: boolean

    // Authority Metrics
    domainRating: number
    pageAuthority: number
    backlinks: number
  }>

  // Intent Distribution Summary
  intentDistribution: {
    informational: number // percentage
    navigational: number
    commercial: number
    transactional: number
  }

  // Content Type Distribution
  contentTypeDistribution: {
    blog: number
    product: number
    landing: number
    video: number
    tool: number
    forum: number
    news: number
  }

  // SERP Features in Top 10
  serpFeaturePresence: {
    featuredSnippet: boolean
    peopleAlsoAsk: boolean
    videoCarousel: boolean
    imagesPack: boolean
    localPack: boolean
    knowledgePanel: boolean
    shoppingResults: boolean
    topStories: boolean
    siteLinks: boolean
    reviews: boolean
  }
}
```

**Datakrav:**
- 10 realistiska SERP results
- Varierad intent distribution (inte alla samma)
- Realistiska domain ratings och metrics
- Content types som matchar intent

---

### 1.3 Entity Queries API
**Fil:** `frontend/app/api/keywords/[keywordId]/entity-queries/route.ts`

GET endpoint som returnerar relaterade entity-based queries:

```typescript
{
  keyword: string

  entities: Array<{
    entity: string
    entityType: 'brand' | 'person' | 'place' | 'product' | 'concept' | 'organization'
    relevanceScore: number // 0-100

    // Entity Queries
    queries: Array<{
      query: string
      searchVolume: number
      difficulty: number
      intent: string
      relationshipType: 'contains_entity' | 'about_entity' | 'entity_attribute' | 'entity_comparison'
    }>

    // Entity Context
    description: string
    knowledgeGraphPresence: boolean
    brandValue?: number
  }>

  // Entity Distribution
  entityDistribution: {
    brands: number
    persons: number
    places: number
    products: number
    concepts: number
    organizations: number
  }

  // Popular Entity Combinations
  entityCombinations: Array<{
    entities: string[]
    query: string
    searchVolume: number
  }>
}
```

**Datakrav:**
- 5-15 olika entities
- 50-100 entity queries totalt
- Realistiska entity types och relationships
- Varierad search volumes

---

### 1.4 Intent-Based Query Clusters API
**Fil:** `frontend/app/api/keywords/[keywordId]/intent-clusters/route.ts`

GET endpoint som returnerar query clusters baserat på intent:

```typescript
{
  keyword: string
  primaryIntent: string

  clusters: {
    // Informational Cluster
    informational: {
      totalQueries: number
      totalVolume: number

      subClusters: Array<{
        theme: string // "how to", "what is", "guide", "tutorial", etc.
        keywords: Array<{
          keyword: string
          searchVolume: number
          difficulty: number
          semanticSimilarity: number // 0-1
          topicRelevance: number // 0-100
        }>
      }>
    }

    // Commercial Cluster
    commercial: {
      totalQueries: number
      totalVolume: number

      subClusters: Array<{
        theme: string // "best", "review", "vs", "alternative", "comparison"
        keywords: Array<{
          keyword: string
          searchVolume: number
          difficulty: number
          commercialIntent: number // 0-100
          competitorMentions: string[]
        }>
      }>
    }

    // Transactional Cluster
    transactional: {
      totalQueries: number
      totalVolume: number

      subClusters: Array<{
        theme: string // "buy", "price", "discount", "deal", "order"
        keywords: Array<{
          keyword: string
          searchVolume: number
          difficulty: number
          conversionLikelihood: number // 0-100
          avgCPC: number
        }>
      }>
    }

    // Navigational Cluster
    navigational: {
      totalQueries: number
      totalVolume: number

      keywords: Array<{
        keyword: string
        searchVolume: number
        targetBrand: string
        targetUrl?: string
      }>
    }
  }

  // Cluster Visualization Data
  clusterMap: Array<{
    clusterId: string
    clusterName: string
    centroidKeyword: string
    memberCount: number
    avgVolume: number
    semanticDensity: number // How tightly clustered
    keywords: string[]
    position: { x: number, y: number } // For 2D visualization
  }>
}
```

**Datakrav:**
- Minst 20 keywords per intent type
- Realistiska sub-clusters med themes
- Semantic similarity scores
- Cluster visualization coordinates

---

### 1.5 Semantic Context API
**Fil:** `frontend/app/api/keywords/[keywordId]/semantic-context/route.ts`

GET endpoint för djupgående semantisk analys:

```typescript
{
  keyword: string

  // Topic Modeling
  topics: Array<{
    topic: string
    relevance: number // 0-100
    keywords: string[]
    description: string
  }>

  // Co-occurring Terms
  coOccurringTerms: Array<{
    term: string
    frequency: number
    context: 'title' | 'content' | 'meta' | 'url'
    lift: number // How much more frequent than baseline
  }>

  // Question Variations
  questions: Array<{
    question: string
    questionType: 'what' | 'how' | 'why' | 'when' | 'where' | 'who' | 'which'
    searchVolume: number
    answerDifficulty: 'easy' | 'medium' | 'hard'
    currentlyAnswered: boolean
    opportunityScore: number
  }>

  // Modifiers & Qualifiers
  modifiers: {
    temporal: string[] // "2024", "2025", "latest", "new", "upcoming"
    locational: string[] // "near me", "in [city]", "local"
    comparative: string[] // "best", "top", "vs", "compared to"
    qualitative: string[] // "cheap", "free", "premium", "professional"
    actionable: string[] // "how to", "guide", "tutorial", "tips"
  }

  // Long-tail Variations
  longTailVariations: Array<{
    variation: string
    searchVolume: number
    difficulty: number
    specificity: number // 0-100
    opportunityRatio: number // Volume/Difficulty
  }>

  // Synonym & Related Terms
  synonyms: string[]
  relatedTerms: Array<{
    term: string
    relationshipType: 'synonym' | 'hypernym' | 'hyponym' | 'meronym' | 'holonym'
    strength: number // 0-100
  }>
}
```

---

### 1.6 Competitive Keyword Gap API
**Fil:** `frontend/app/api/keywords/[keywordId]/competitive-gap/route.ts`

GET endpoint för konkurrentanalys av detta specifika keyword:

```typescript
{
  keyword: string
  yourPosition: number

  competitors: Array<{
    domain: string
    position: number
    url: string

    // Content Comparison
    contentLength: number
    yourContentLength: number
    contentGap: number // Difference in words

    // On-Page Factors
    titleOptimization: number // 0-100
    metaOptimization: number
    contentQuality: number
    technicalScore: number

    // Backlink Profile
    backlinksToPage: number
    referringDomains: number
    avgDomainRating: number

    // What They're Doing Better
    advantages: string[]

    // What You're Doing Better
    yourAdvantages: string[]

    // Opportunity Analysis
    overtakeDifficulty: 'easy' | 'medium' | 'hard' | 'very_hard'
    estimatedTimeToOvertake: string // "1-2 months"
    recommendedActions: string[]
  }>

  // Gap Summary
  averageCompetitorScore: number
  yourScore: number
  mainWeaknesses: string[]
  quickWins: string[]
}
```

---

### 1.7 Content Optimization Suggestions API
**Fil:** `frontend/app/api/keywords/[keywordId]/optimization/route.ts`

GET endpoint med konkreta förbättringsförslag:

```typescript
{
  keyword: string
  currentUrl: string

  // Title & Meta Optimization
  titleSuggestions: Array<{
    suggestion: string
    reason: string
    score: number
    includesMainKeyword: boolean
    includesModifiers: string[]
  }>

  metaDescriptionSuggestions: Array<{
    suggestion: string
    reason: string
    score: number
    includesCTA: boolean
  }>

  // Content Structure
  recommendedHeadings: Array<{
    level: 'h2' | 'h3' | 'h4'
    text: string
    reason: string
    priority: 'high' | 'medium' | 'low'
  }>

  // Content Topics to Cover
  topicsToAdd: Array<{
    topic: string
    relevance: number
    competitorCoverage: number // % of top 10 covering this
    estimatedWordCount: number
    examples: string[]
  }>

  // Keywords to Include
  keywordsToTarget: Array<{
    keyword: string
    currentFrequency: number
    recommendedFrequency: number
    placement: string[] // ["title", "h2", "first-paragraph", "conclusion"]
    naturalVariations: string[]
  }>

  // Internal Linking
  internalLinkingOpportunities: Array<{
    fromPage: string
    toPage: string
    anchorText: string
    relevance: number
    expectedImpact: 'high' | 'medium' | 'low'
  }>

  // Media Recommendations
  mediaToAdd: Array<{
    type: 'image' | 'video' | 'infographic' | 'diagram' | 'chart'
    topic: string
    reason: string
    priority: 'high' | 'medium' | 'low'
  }>

  // Expected Impact
  overallOptimizationScore: number // Current score
  potentialScore: number // After optimizations
  estimatedPositionGain: number
  estimatedTrafficIncrease: number // percentage
}
```

---

## 2. Frontend Components

### 2.1 Keyword Detail Page
**Fil:** `frontend/app/(dashboard)/dashboard/keywords/[keywordId]/page.tsx`

Huvudsida med tabs:
- Overview
- SERP Analysis
- Entity Queries
- Intent Clusters
- Semantic Context
- Competitor Gap
- Optimization

### 2.2 SERP Intent Distribution Chart
**Fil:** `frontend/src/components/keyword-detail/SerpIntentChart.tsx`

Visual breakdown av intent i topp 10:
- Stacked bar chart med intent distribution
- Pie chart för content types
- Interactive SERP results list
- Hover för detaljer per result

### 2.3 Entity Queries Explorer
**Fil:** `frontend/src/components/keyword-detail/EntityQueriesExplorer.tsx`

Interaktiv entity visualization:
- Network graph med entities som noder
- Queries grupperade per entity
- Filter på entity type
- Search volumes som node size
- Expandable för att se queries

### 2.4 Intent Cluster Visualization
**Fil:** `frontend/src/components/keyword-detail/IntentClusterViz.tsx`

2D scatter plot med clusters:
- Olika färger för olika intents
- Bubble size = search volume
- Click för att se cluster details
- Zoom & pan functionality
- Highlight related keywords on hover

### 2.5 Semantic Context Panel
**Fil:** `frontend/src/components/keyword-detail/SemanticContextPanel.tsx`

Omfattande semantisk data:
- Topic cloud visualization
- Co-occurring terms frequency chart
- Question explorer med filters
- Modifier breakdown (accordion)
- Long-tail opportunity list

### 2.6 Competitive Gap Analysis
**Fil:** `frontend/src/components/keyword-detail/CompetitiveGapAnalysis.tsx`

Side-by-side comparison:
- Radar chart för olika faktorer
- Table med competitors
- Your advantages vs their advantages
- Action recommendations
- Timeline för overtake

### 2.7 Optimization Checklist
**Fil:** `frontend/src/components/keyword-detail/OptimizationChecklist.tsx`

Actionable checklist:
- Prioritized recommendations
- Checkboxes för completed items
- Estimated impact per item
- Code snippets där relevant
- Progress tracker

---

## 3. Mock Data Generators

### 3.1 Keyword Detail Generator
**Fil:** `frontend/lib/mock-data/keyword-detail-generator.ts`

```typescript
export function generateKeywordDetail(keywordId: string): KeywordDetail
export function generatePositionHistory(days: number): PositionHistoryData[]
export function generateFeaturedSnippet(keyword: string): FeatureSnippetData
```

### 3.2 SERP Intent Generator
**Fil:** `frontend/lib/mock-data/serp-intent-generator.ts`

```typescript
export function generateSerpIntentData(keyword: string): SerpIntentData
export function generateSerpResult(position: number, keyword: string): SerpResult
export function calculateIntentDistribution(results: SerpResult[]): IntentDistribution
```

### 3.3 Entity Generator
**Fil:** `frontend/lib/mock-data/entity-generator.ts`

```typescript
export function generateEntities(keyword: string): EntityData[]
export function generateEntityQueries(entity: string, count: number): EntityQuery[]
export function generateEntityCombinations(entities: EntityData[]): EntityCombination[]
```

### 3.4 Cluster Generator
**Fil:** `frontend/lib/mock-data/cluster-generator.ts`

```typescript
export function generateIntentClusters(keyword: string): IntentClustersData
export function generateClusterMap(clusters: IntentClustersData): ClusterMapData[]
export function calculateSemanticSimilarity(kw1: string, kw2: string): number
```

---

## 4. Advanced Features (Beyond Ahrefs)

### 4.1 AI Content Brief Generator
Generera automatiska content briefs baserat på:
- Topp 10 SERP analys
- Entity coverage
- Intent clusters
- Semantic context

### 4.2 Intent Evolution Timeline
Visa hur intent för detta keyword har ändrats över tid:
- Historical intent shifts
- Seasonal patterns
- Trend predictions

### 4.3 Voice Search Optimization
Analys specifikt för voice search:
- Question variations
- Conversational long-tail
- Featured snippet opportunities
- Local intent signals

### 4.4 Visual Search Insights
Om relevant för keyword:
- Image-related queries
- Visual SERP features
- Pinterest/Instagram keywords
- Visual content gaps

### 4.5 Semantic Keyword Scoring
Custom scoring algorithm:
```
Opportunity Score = (Volume * Relevance * Intent Match) / (Difficulty * Competition)
```

Med viktning baserat på:
- Your current ranking
- Content quality
- Domain authority
- Historical performance

---

## 5. UI/UX Guidelines

### 5.1 Layout
```
┌─────────────────────────────────────────────────────────┐
│ Keyword Detail Header                                    │
│ [keyword] | Position #X | Volume: XX,XXX | ↗ Trending │
├─────────────────────────────────────────────────────────┤
│ Tabs: [Overview] [SERP] [Entities] [Clusters] ...      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ Metric Card  │  │ Metric Card  │  │ Metric Card  │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│                                                          │
│  ┌───────────────────────────────────────────────────┐ │
│  │  Main Content Area (depends on active tab)        │ │
│  │                                                    │ │
│  └───────────────────────────────────────────────────┘ │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### 5.2 Color Coding
- **Informational**: Blue (#3B82F6)
- **Commercial**: Orange (#F59E0B)
- **Transactional**: Green (#10B981)
- **Navigational**: Purple (#8B5CF6)

### 5.3 Interactive Elements
- Hover tooltips för alla metrics
- Click-to-expand för detailed data
- Drag-to-compare för competitors
- Export buttons för alla data sections

---

## 6. Data Requirements

### Volume Requirements
- **Keyword Detail**: Full data för selected keyword
- **SERP Results**: 10 detailed results
- **Entity Queries**: 50-100 queries across 5-15 entities
- **Intent Clusters**: 20-50 keywords per intent type
- **Semantic Terms**: 50+ co-occurring terms
- **Questions**: 30-50 question variations
- **Competitors**: 5-10 in depth analysis

### Quality Requirements
- Realistic semantic relationships
- Proper intent classification
- Accurate entity recognition
- Valid cluster formations
- Actionable recommendations

---

## 7. Integration Points

### 7.1 From Rankings List
När användaren klickar på ett keyword i rankings-listan:
```tsx
<Link href={`/dashboard/keywords/${keyword.id}`}>
  {keyword.keyword}
</Link>
```

### 7.2 Navigation
Breadcrumbs:
```
Dashboard > Rankings > [Keyword Name]
```

Snabb-navigation mellan keywords:
```
← Previous Keyword | Next Keyword →
```

### 7.3 Actions
Från detail view:
- Add to tracking
- Create content brief
- Export analysis as PDF
- Share with team
- Compare with another keyword

---

## 8. Example Mock Data

### Keyword Detail Example:
```json
{
  "keyword": "best seo tools 2024",
  "searchVolume": 12500,
  "difficulty": 67,
  "currentPosition": 8,
  "primaryIntent": "commercial",
  "intentConfidence": 85,
  "serpFeatures": ["Featured Snippet", "People Also Ask", "Video Carousel"],
  "featuredSnippet": {
    "hasSnippet": true,
    "ownedByYou": false,
    "snippetType": "list"
  }
}
```

### SERP Intent Distribution Example:
```json
{
  "intentDistribution": {
    "informational": 20,
    "commercial": 70,
    "transactional": 10,
    "navigational": 0
  },
  "contentTypeDistribution": {
    "blog": 60,
    "landing": 30,
    "video": 10
  }
}
```

### Entity Example:
```json
{
  "entity": "Ahrefs",
  "entityType": "brand",
  "relevanceScore": 95,
  "queries": [
    {
      "query": "ahrefs pricing 2024",
      "searchVolume": 3400,
      "relationshipType": "entity_attribute"
    },
    {
      "query": "ahrefs vs semrush",
      "searchVolume": 5200,
      "relationshipType": "entity_comparison"
    }
  ]
}
```

---

## 9. Implementation Checklist

- [ ] Skapa alla API endpoints
- [ ] Implementera keyword detail page
- [ ] Bygga SERP intent visualization
- [ ] Skapa entity queries explorer
- [ ] Implementera intent cluster viz
- [ ] Bygga semantic context panel
- [ ] Skapa competitive gap analysis
- [ ] Implementera optimization checklist
- [ ] Generera mock data generators
- [ ] Integrera navigation från rankings
- [ ] Testa alla interaktioner
- [ ] Verifiera data kvalitet
- [ ] Lägg till export funktioner
- [ ] Implementera loading states

---

## 10. Success Criteria

✅ Användaren kan klicka på keyword från rankings och se detail view
✅ SERP intent distribution visas med interaktiva charts
✅ Entity queries är organiserade och filterbara
✅ Intent clusters visualiseras i 2D space
✅ Semantic context är omfattande och användbar
✅ Competitive gap analysis ger actionable insights
✅ Optimization suggestions är konkreta och prioriterade
✅ All data är realistisk och konsistent
✅ UI är responsiv och snabb
✅ Navigation är intuitiv

---

**BÖRJA IMPLEMENTERA DESSA FEATURES FÖR EN NEXT-LEVEL KEYWORD ANALYSIS TOOL!**