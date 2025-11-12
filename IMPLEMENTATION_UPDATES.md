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

## SEMANTIC KEYWORD DETAIL VIEW - NYA FEATURES

### Lägg till följande i create_mockup_data.md

Efter att grundläggande mockup-data är skapat, implementera:

### 27. Keyword Detail View med Semantisk Analys

När användaren klickar på ett keyword från rankings-listan → öppna detail view.

#### 27.1 Keyword Detail API Endpoints

**Fil:** `frontend/app/api/keywords/[keywordId]/route.ts`
- Basic info + historical data (90 days)
- Primary intent + confidence score
- SERP features + featured snippet data
- Ranking URL + page metrics

**Fil:** `frontend/app/api/keywords/[keywordId]/serp-intent/route.ts`
- Topp 10 SERP results med intent analysis
- Intent distribution för varje result
- Content type classification
- Engagement signals

**Fil:** `frontend/app/api/keywords/[keywordId]/entity-queries/route.ts`
- Entity recognition (brand/person/place/product/concept)
- 50-100 entity-based queries
- Entity relationships
- Knowledge graph presence

**Fil:** `frontend/app/api/keywords/[keywordId]/intent-clusters/route.ts`
- Query clustering baserat på intent
- Sub-clusters med themes
- Semantic similarity scores
- 2D visualization coordinates

**Fil:** `frontend/app/api/keywords/[keywordId]/semantic-context/route.ts`
- Topic modeling
- Co-occurring terms
- Question variations (what/how/why)
- Modifiers (temporal/locational/comparative)
- Long-tail opportunities

**Fil:** `frontend/app/api/keywords/[keywordId]/competitive-gap/route.ts`
- Side-by-side competitor comparison
- Content gaps
- Overtake difficulty + timeline
- Actionable recommendations

**Fil:** `frontend/app/api/keywords/[keywordId]/optimization/route.ts`
- Title/meta suggestions
- Content structure recommendations
- Keywords to target
- Internal linking opportunities
- Expected impact estimates

#### 27.2 Frontend Components för Keyword Detail

**Fil:** `frontend/app/(dashboard)/dashboard/keywords/[keywordId]/page.tsx`
```tsx
'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SerpIntentChart } from '@/src/components/keyword-detail/SerpIntentChart'
import { EntityQueriesExplorer } from '@/src/components/keyword-detail/EntityQueriesExplorer'
import { IntentClusterViz } from '@/src/components/keyword-detail/IntentClusterViz'
import { SemanticContextPanel } from '@/src/components/keyword-detail/SemanticContextPanel'
import { CompetitiveGapAnalysis } from '@/src/components/keyword-detail/CompetitiveGapAnalysis'
import { OptimizationChecklist } from '@/src/components/keyword-detail/OptimizationChecklist'

export default function KeywordDetailPage({ params }: { params: { keywordId: string } }) {
  return (
    <DashboardLayout>
      <KeywordDetailHeader keywordId={params.keywordId} />

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="serp">SERP Analysis</TabsTrigger>
          <TabsTrigger value="entities">Entity Queries</TabsTrigger>
          <TabsTrigger value="clusters">Intent Clusters</TabsTrigger>
          <TabsTrigger value="semantic">Semantic Context</TabsTrigger>
          <TabsTrigger value="gap">Competitor Gap</TabsTrigger>
          <TabsTrigger value="optimize">Optimization</TabsTrigger>
        </TabsList>

        <TabsContent value="serp">
          <SerpIntentChart keywordId={params.keywordId} />
        </TabsContent>

        <TabsContent value="entities">
          <EntityQueriesExplorer keywordId={params.keywordId} />
        </TabsContent>

        {/* ... andra tabs ... */}
      </Tabs>
    </DashboardLayout>
  )
}
```

**Fil:** `frontend/src/components/keyword-detail/SerpIntentChart.tsx`
- Stacked bar chart för intent distribution i topp 10
- Pie chart för content types
- Interactive SERP results list med hover details
- Color coding: Blue=Informational, Orange=Commercial, Green=Transactional

**Fil:** `frontend/src/components/keyword-detail/EntityQueriesExplorer.tsx`
- Network graph med entities som noder
- Queries grupperade per entity
- Filters på entity type
- Search volume som node size
- Expandable för att se detaljer

**Fil:** `frontend/src/components/keyword-detail/IntentClusterViz.tsx`
- 2D scatter plot med queries som bubbles
- Färgkodning per intent
- Bubble size = search volume
- Click för cluster details
- Zoom & pan functionality

**Fil:** `frontend/src/components/keyword-detail/SemanticContextPanel.tsx`
- Topic cloud visualization
- Co-occurring terms med frequency bars
- Question explorer med filters
- Modifier breakdown (accordion)
- Long-tail opportunity list

**Fil:** `frontend/src/components/keyword-detail/CompetitiveGapAnalysis.tsx`
- Radar chart för olika faktorer
- Table med top 5-10 competitors
- "Your advantages" vs "Their advantages"
- Timeline estimate för overtake
- Priority action recommendations

**Fil:** `frontend/src/components/keyword-detail/OptimizationChecklist.tsx`
- Actionable todo list
- Checkboxes för tracking
- Estimated impact per item
- Priority sorting
- Progress tracker

#### 27.3 Integration från Rankings List

**Uppdatera:** `frontend/app/(dashboard)/dashboard/rankings/page.tsx`

Gör varje keyword klickbart:
```tsx
<Link href={`/dashboard/keywords/${keyword.id}`} className="hover:text-blue-600">
  {keyword.keyword}
</Link>
```

Lägg till en "View Details" kolumn:
```tsx
<Button variant="ghost" size="sm" asChild>
  <Link href={`/dashboard/keywords/${keyword.id}`}>
    <Eye className="w-4 h-4" />
  </Link>
</Button>
```

#### 27.4 Mock Data Generators för Semantic Features

**Fil:** `frontend/lib/mock-data/keyword-detail-generator.ts`
```typescript
export function generateKeywordDetail(keywordId: string) {
  return {
    keyword: extractKeywordFromId(keywordId),
    searchVolume: randomInt(100, 50000),
    currentPosition: randomInt(1, 100),
    primaryIntent: sample(['informational', 'commercial', 'transactional', 'navigational']),
    intentConfidence: randomInt(70, 98),
    // ... 90 days historical data
    positionHistory: generatePositionHistory(90),
    featuredSnippet: generateFeaturedSnippet(),
  }
}
```

**Fil:** `frontend/lib/mock-data/serp-intent-generator.ts`
```typescript
export function generateSerpIntentData(keyword: string) {
  const topResults = Array.from({ length: 10 }, (_, i) => ({
    position: i + 1,
    url: `https://example${i}.com/article`,
    domain: `example${i}.com`,
    title: `${keyword} - Example Title ${i}`,
    detectedIntent: generateIntentForPosition(i),
    contentType: generateContentType(),
    domainRating: randomInt(20, 95),
    hasVideo: Math.random() > 0.7,
    hasImages: Math.random() > 0.5,
    hasFAQ: Math.random() > 0.6,
  }))

  return {
    topResults,
    intentDistribution: calculateIntentDistribution(topResults),
    contentTypeDistribution: calculateContentDistribution(topResults),
  }
}
```

**Fil:** `frontend/lib/mock-data/entity-generator.ts`
```typescript
export function generateEntities(keyword: string) {
  const entities = [
    { entity: 'Brand Name', entityType: 'brand', relevanceScore: 95 },
    { entity: 'Product Category', entityType: 'concept', relevanceScore: 88 },
    // ... 10-15 entities total
  ]

  return entities.map(ent => ({
    ...ent,
    queries: generateEntityQueries(ent.entity, 5-10),
    knowledgeGraphPresence: Math.random() > 0.5,
  }))
}
```

**Fil:** `frontend/lib/mock-data/cluster-generator.ts`
```typescript
export function generateIntentClusters(keyword: string) {
  return {
    informational: {
      totalQueries: randomInt(50, 150),
      subClusters: [
        { theme: 'how to', keywords: generateThemeKeywords(keyword, 'how to', 20) },
        { theme: 'what is', keywords: generateThemeKeywords(keyword, 'what is', 15) },
        { theme: 'guide', keywords: generateThemeKeywords(keyword, 'guide', 18) },
      ]
    },
    commercial: {
      totalQueries: randomInt(30, 100),
      subClusters: [
        { theme: 'best', keywords: generateThemeKeywords(keyword, 'best', 25) },
        { theme: 'review', keywords: generateThemeKeywords(keyword, 'review', 20) },
        { theme: 'vs', keywords: generateComparisonKeywords(keyword, 15) },
      ]
    },
    // ... transactional & navigational
  }
}
```

#### 27.5 Testing Workflow för Keyword Detail

1. **Skapa alla API endpoints**
2. **Skapa alla components**
3. **Öppna http://localhost:3001/dashboard/rankings**
4. **Klicka på ett keyword** → ska öppna detail view
5. **Verifiera varje tab:**
   - Overview: basic metrics renderas
   - SERP Analysis: charts visas med 10 results
   - Entity Queries: network graph renderas
   - Intent Clusters: 2D plot med bubbles
   - Semantic Context: panels med data
   - Competitor Gap: radar chart + recommendations
   - Optimization: checklist med items
6. **Testa interaktivitet:**
   - Hover på chart elements
   - Click på entity nodes
   - Filter på intent types
   - Expand/collapse sections
   - Check off optimization items

---

## FRONTEND COMPONENT UPDATES - ANDRA PRIORITET

Efter att semantic keyword detail är implementerad, lägg till visuella förbättringar:

### 28. Uppdatera Rankings Dashboard med Charts

**Fil:** `frontend/app/(dashboard)/dashboard/rankings/page.tsx`

Lägg till ovanför keyword table:

```tsx
<div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
  <Card>
    <CardHeader className="pb-2">
      <CardTitle className="text-sm font-medium text-gray-600">
        Avg Position
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-3xl font-bold">#12.4</div>
      <p className="text-sm text-green-600">↗ +2.1 vs last week</p>
    </CardContent>
  </Card>

  <Card>
    <CardHeader className="pb-2">
      <CardTitle className="text-sm font-medium text-gray-600">
        Top 10 Keywords
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-3xl font-bold">45</div>
      <p className="text-sm text-green-600">↗ +5 new</p>
    </CardContent>
  </Card>

  {/* ... 2 more cards ... */}
</div>

<Card className="mb-6">
  <CardHeader>
    <CardTitle>Position Distribution</CardTitle>
  </CardHeader>
  <CardContent>
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={positionDistribution}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="range" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="count" fill="#3B82F6" />
      </BarChart>
    </ResponsiveContainer>
  </CardContent>
</Card>
```

### 29. Uppdatera Competitor Analysis med Comparison Charts

**Fil:** `frontend/app/(dashboard)/dashboard/competitor-analysis/page.tsx`

Lägg till radar chart för comparison:

```tsx
<Card>
  <CardHeader>
    <CardTitle>You vs Top Competitors</CardTitle>
  </CardHeader>
  <CardContent>
    <ResponsiveContainer width="100%" height={400}>
      <RadarChart data={competitorComparison}>
        <PolarGrid />
        <PolarAngleAxis dataKey="metric" />
        <PolarRadiusAxis />
        <Radar name="You" dataKey="you" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} />
        <Radar name="Competitor" dataKey="competitor" stroke="#EF4444" fill="#EF4444" fillOpacity={0.6} />
        <Legend />
      </RadarChart>
    </ResponsiveContainer>
  </CardContent>
</Card>
```

---

## VERIFIERING CHECKLIST

Efter varje implementerad feature, checka av:

**Rankings Dashboard:**
- [ ] API returnerar 150+ keywords
- [ ] Table renderas med all data
- [ ] Charts visas: stats cards, position distribution
- [ ] Keywords är klickbara → går till detail view
- [ ] Filters fungerar (position, trend, volume)
- [ ] Sort fungerar på columns
- [ ] Pagination fungerar

**Keyword Detail View:**
- [ ] Öppnas när man klickar på keyword
- [ ] Header visar basic metrics
- [ ] Overview tab: historical chart renderas
- [ ] SERP Analysis tab: intent distribution + top 10 list
- [ ] Entity Queries tab: network graph renderas
- [ ] Intent Clusters tab: 2D scatter plot fungerar
- [ ] Semantic Context tab: panels med data
- [ ] Competitor Gap tab: radar chart + recommendations
- [ ] Optimization tab: checklist med actions

**Competitor Analysis:**
- [ ] API returnerar 8+ competitors
- [ ] Cards renderas med metrics
- [ ] Radar chart jämför you vs competitors
- [ ] Keyword overlap fungerar (click → se overlapping keywords)
- [ ] Add competitor dialog fungerar

**Content Analysis:**
- [ ] API returnerar comprehensive analysis
- [ ] Score meters renderas (SEO, readability, etc.)
- [ ] Issues list med severity badges
- [ ] Recommendations är actionable
- [ ] Charts för keyword density, link analysis

**Keyword Research:**
- [ ] Search fungerar (skriv keyword → få suggestions)
- [ ] Mode tabs fungerar (suggestions/questions/related)
- [ ] Filters fungerar (volume, difficulty, intent)
- [ ] Selection fungerar (checkboxes)
- [ ] Add to project fungerar
- [ ] Export to CSV fungerar

---

## NÄSTA STEG EFTER IMPLEMENTATION

1. Kör type-check: `npm run type-check`
2. Kör lint: `npm run lint`
3. Testa alla sidor manuellt i browser
4. Ta screenshots av varje feature
5. Rapportera resultat med lista över:
   - Skapade filer
   - Fungerande features
   - Eventuella issues
   - Förslag på förbättringar

---

**SAMMANFATTNING:**
- Bygg API + Component TILLSAMMANS för varje feature
- Verifiera i browser DIREKT efter varje feature
- Använd charts och visualiseringar ÖVERALLT
- Gör data INTERAKTIV (hover, click, filter)
- Semantic keyword detail = game changer feature!