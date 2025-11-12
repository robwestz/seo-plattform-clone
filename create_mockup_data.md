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

# Skapa Mockup Data för SEO Intelligence Platform

**VIKTIGT: Denna fil ska köras i en SEPARAT Claude Code-instans för att inte störa huvudutvecklingen.**

## Instruktioner

Du ska skapa omfattande mockup-data och API route handlers för SEO Intelligence Platform. All data ska vara realistisk och i stora mängder för att visa plattformens fulla potential.

## Projektstruktur

Arbeta i katalogen: `C:\Users\robin\Downloads\seo-platform-clone\frontend`

---

## 1. Skapa API Route Handlers OCH Visualiseringar

**VIKTIGT:** För varje API endpoint - skapa BÅDE backend OCH frontend samtidigt!

### 1.1 Rankings API + Dashboard Visualization
**Fil:** `frontend/app/api/rankings/[projectId]/route.ts`

Skapa ett GET endpoint som returnerar 150+ ranking keywords med:
- Keyword name
- Current position (1-100)
- Previous position
- Search volume (100-50000)
- Difficulty (1-100)
- Clicks, impressions, CTR
- URL
- Trend (up/down/stable)
- Change amount
- Last updated date

**Datakrav:**
- 50 keywords i position 1-10 (top performers)
- 40 keywords i position 11-20
- 30 keywords i position 21-50
- 30 keywords i position 51-100
- Varierad data för olika branscher (tech, e-commerce, SaaS, etc.)
- Realistiska trender: 40% förbättring, 30% försämring, 30% stabilt

---

### 1.2 Competitor Analysis API
**Fil:** `frontend/app/api/projects/[projectId]/competitors/route.ts`

GET endpoint som returnerar 8-12 konkurrenter med:
- Domain
- Company name
- Estimated traffic (5000-500000)
- Organic keywords (500-50000)
- Paid keywords (0-5000)
- Backlinks (1000-1000000)
- Referring domains (100-50000)
- Domain rating (20-95)
- Traffic trend (percentage change)
- Common keywords count (50-5000)
- Keyword gap count (opportunities)
- Content gap count

POST endpoint för att lägga till ny konkurrent.

**Fil:** `frontend/app/api/projects/[projectId]/competitors/[competitorId]/keywords/route.ts`

GET endpoint som returnerar keyword overlap (200+ keywords):
- Keyword
- Your position (1-100 eller null)
- Competitor position (1-100)
- Search volume
- Difficulty
- Gap type (winning/losing/missing)

---

### 1.3 Content Analysis API
**Fil:** `frontend/app/api/projects/[projectId]/content/analyze/route.ts`

GET endpoint som tar URL eller content ID och returnerar:
- Overall score (0-100)
- SEO score, readability score, engagement score, technical score
- Readability metrics (Flesch scores, grade level, etc.)
- Keyword density array (20+ keywords)
- Heading structure array
- Link analysis (internal/external/broken counts)
- Meta data (title, description, images, alt text)
- Issues array (30-50 issues) med severity levels
- Analyzed timestamp

---

### 1.4 Keyword Research API
**Fil:** `frontend/app/api/keywords/research/route.ts`

POST endpoint som tar seed keyword och mode, returnerar 100-300 suggestions:
- Keyword
- Search volume (50-100000)
- Difficulty (1-100)
- CPC ($0.10-$50.00)
- Competition (0-1)
- Intent (informational/navigational/commercial/transactional)
- Trend array (12 months data)
- SERP features array
- Opportunity score (0-10)
- isTracked boolean

Olika modes:
- **suggestions**: Bred mix av relaterade keywords
- **questions**: Keywords som börjar med who/what/where/when/why/how
- **related**: Semantiskt relaterade keywords
- **competitors**: Keywords från konkurrentanalys

---

### 1.5 Projects API
**Fil:** `frontend/app/api/projects/route.ts`

GET endpoint som returnerar 5-8 projekt:
- Project name
- Domain
- Created date
- Keyword count
- Average position
- Traffic estimate
- Status (active/paused)
- Last crawl date

---

## 2. Skapa Omfattande Mock Data Filer

### 2.1 SEO Keywords Database
**Fil:** `frontend/lib/mock-data/keywords.json`

Skapa 500+ realistiska SEO keywords inom olika kategorier:
- E-commerce keywords (100)
- SaaS/Tech keywords (100)
- Local business keywords (100)
- B2B keywords (100)
- Content marketing keywords (100)

Varje keyword ska ha: base term, volume range, typical difficulty, common intents.

---

### 2.2 Domain Database
**Fil:** `frontend/lib/mock-data/domains.json`

Skapa 50+ fiktiva men realistiska företagsdomäner:
- Company name
- Domain
- Industry
- Country
- Typical metrics (DR, traffic, keywords)

---

### 2.3 SERP Features Data
**Fil:** `frontend/lib/mock-data/serp-features.json`

Lista med SERP features:
- Featured Snippet
- People Also Ask
- Local Pack
- Knowledge Panel
- Image Pack
- Video Carousel
- Top Stories
- Shopping Results
- Site Links
- Reviews/Ratings

---

### 2.4 Content Issues Database
**Fil:** `frontend/lib/mock-data/content-issues.json`

Skapa 100+ olika content issues:
- SEO issues (title length, meta description, heading structure, etc.)
- Readability issues (sentence length, passive voice, etc.)
- Technical issues (broken links, missing alt text, slow loading, etc.)
- Engagement issues (no CTA, poor formatting, etc.)

Varje issue ska ha:
- Category
- Severity
- Message template
- Recommendation template

---

## 3. Skapa Utility Functions

### 3.1 Data Generators
**Fil:** `frontend/lib/mock-data/generators.ts`

Skapa utility functions för att generera:
- Random ranking data
- Random competitor profiles
- Random keyword suggestions
- Random content analysis results
- Date ranges
- Trend data arrays
- Realistic metric distributions

---

## 4. Skapa Demo Data Presets

### 4.1 Demo Scenarios
**Fil:** `frontend/lib/mock-data/demo-scenarios.ts`

Skapa 3 färdiga demo-scenarion:

**Scenario 1: "Growing E-commerce Site"**
- 200 keywords
- 60% förbättrad ranking
- 5 konkurrenter
- Hög traffic growth

**Scenario 2: "Struggling SaaS Startup"**
- 100 keywords
- 40% försämrad ranking
- 8 starka konkurrenter
- Många opportunities

**Scenario 3: "Established Tech Company"**
- 400 keywords
- Stabil prestanda
- 3 konkurrenter
- Fokus på content quality

---

## 5. Datakvalitetskrav

### Realism Requirements:
1. **Keywords:** Använd verkliga keyword patterns och phrasings
2. **Metrics:** Följ verkliga korrelationer (hög difficulty = lägre position vanligtvis)
3. **Trends:** Realistiska förändringar (inte +50 positioner på en vecka)
4. **Domains:** Blanda stora och små spelare
5. **Content Issues:** Varierad severity distribution (få critical, många warnings/info)

### Volume Requirements:
- Minst 150 keywords per projekt
- Minst 200 keyword suggestions per sökning
- Minst 50 content issues per analys
- Minst 100 keyword overlap per konkurrent
- Minst 8 konkurrenter

### Diversity Requirements:
- Olika branscher representerade
- Olika länder/språk (mest engelska men lite svenska också)
- Olika keyword intents balanserat
- Olika SERP features representation

---

## 6. Testing Checklist

Efter att du skapat all data, verifiera att:

- [ ] `/dashboard/rankings` visar 150+ keywords med realistiska metrics
- [ ] `/dashboard/competitor-analysis` visar 8+ konkurrenter med full data
- [ ] `/dashboard/content-analysis` visar omfattande analys med 30+ issues
- [ ] `/dashboard/keyword-research-advanced` returnerar 200+ suggestions per sökning
- [ ] Alla API endpoints returnerar data inom 100ms
- [ ] Ingen data är hårdkodad "lorem ipsum" eller "test123"
- [ ] Alla datum är realistiska (senaste 90 dagarna)
- [ ] Trend data visar realistiska förändringar över tid

---

## 7. Fil Placeringar - Sammanfattning

```
frontend/
├── app/
│   └── api/
│       ├── rankings/
│       │   └── [projectId]/
│       │       └── route.ts
│       ├── projects/
│       │   ├── route.ts
│       │   └── [projectId]/
│       │       ├── competitors/
│       │       │   ├── route.ts
│       │       │   └── [competitorId]/
│       │       │       └── keywords/
│       │       │           └── route.ts
│       │       └── content/
│       │           └── analyze/
│       │               └── route.ts
│       └── keywords/
│           └── research/
│               └── route.ts
├── lib/
│   └── mock-data/
│       ├── keywords.json
│       ├── domains.json
│       ├── serp-features.json
│       ├── content-issues.json
│       ├── generators.ts
│       └── demo-scenarios.ts
```

---

## 8. Kod-exempel och Guidelines

### API Route Example Structure:
```typescript
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  // Generate or fetch mock data
  const data = generateMockData(params.projectId)

  return NextResponse.json(data)
}
```

### Data Generator Example:
```typescript
export function generateKeywordRankings(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: `kw-${i}`,
    keyword: generateRealisticKeyword(),
    currentPosition: randomPosition(),
    // ... more fields
  }))
}
```

---

## 9. Prioritering

Skapa i denna ordning:
1. **Rankings API** (prio 1 - används mest)
2. **Keyword Research API** (prio 1)
3. **Competitor Analysis API** (prio 2)
4. **Content Analysis API** (prio 2)
5. **Data generator utilities** (prio 2)
6. **JSON data files** (prio 3)
7. **Demo scenarios** (prio 3)

---

## 10. Viktiga Anteckningar

- Använd TypeScript interfaces för all data
- Exportera interfaces från en central `types.ts` fil
- Använd consistent naming conventions
- Inkludera JSDoc kommentarer
- All data ska vara deterministisk (samma seed = samma data)
- Implementera pagination för stora dataset (optional men nice-to-have)
- Lägg till delays (50-200ms) för att simulera verkliga API calls

---

## 11. Exempel på Realistisk Data

### Keyword Example:
```json
{
  "id": "kw-001",
  "keyword": "best seo tools 2024",
  "currentPosition": 8,
  "previousPosition": 12,
  "searchVolume": 12500,
  "difficulty": 67,
  "clicks": 234,
  "impressions": 8920,
  "ctr": 2.62,
  "url": "/blog/seo-tools-comparison",
  "trend": "up",
  "change": 4,
  "lastUpdated": "2025-11-10T08:30:00Z"
}
```

### Competitor Example:
```json
{
  "id": "comp-001",
  "domain": "ahrefs.com",
  "name": "Ahrefs",
  "estimatedTraffic": 2450000,
  "organicKeywords": 185430,
  "paidKeywords": 1250,
  "backlinks": 15200000,
  "referringDomains": 89300,
  "domainRating": 91,
  "trafficTrend": 12.5,
  "commonKeywords": 3420,
  "keywordGap": 8950,
  "contentGap": 450,
  "isTracked": true
}
```

---

## 12. Komponenter som Ännu Inte Är Integrerade

### 12.1 Realtime Notifications
**Komponent:** `frontend/src/components/notifications/RealtimeNotifications.tsx`

Denna komponent finns färdigbyggd men behöver integreras i dashboard-layouten.

**Integration:**
1. Lägg till komponenten i `DashboardLayout`
2. Skapa mock WebSocket service som genererar notifikationer
3. Skapa notifikationer för:
   - Ranking förändringar (keyword moved up/down)
   - Nya backlinks upptäckta
   - Content issues upptäckta
   - Konkurrent aktivitet
   - SEO audit avslutad

**Mock Notifications API:**
**Fil:** `frontend/app/api/notifications/route.ts`

GET endpoint som returnerar 20-50 notifikationer med:
- ID
- Type (ranking_change/backlink/content_issue/competitor_activity/audit_complete)
- Severity (info/warning/critical)
- Message
- Timestamp
- Read status
- Related entity (keyword, URL, etc.)
- Action URL

---

### 12.2 D3 Charts Component
**Komponent:** `frontend/src/components/charts/D3Charts.tsx`

Färdiga D3.js-baserade charts. Kan integreras som alternativ till Recharts.

**Användning:**
- Trendgrafer på dashboard
- Ranking utveckling över tid
- Traffic curves
- Competitor jämförelser

---

### 12.3 Virtual Scroll Component
**Komponent:** `frontend/src/components/performance/VirtualScroll.tsx`

För effektiv rendering av stora datalistor (1000+ items).

**Användning:**
- Keyword listor
- Backlink listor
- Content pages listor

---

## 13. Extra Features att Inkludera

### 13.1 Backlinks Detail Data
Backlinks-sidan behöver också mockup-data.

**Fil:** `frontend/app/api/projects/[projectId]/backlinks/route.ts`

GET endpoint med 100-500 backlinks:
- Source domain
- Source URL
- Target URL
- Anchor text
- Link type (dofollow/nofollow)
- Domain rating
- First seen date
- Last checked date
- Status (active/lost)
- Link context/surrounding text

---

### 13.2 SEO Audit Detail Data
**Fil:** `frontend/app/api/projects/[projectId]/audit/route.ts`

GET endpoint med omfattande audit results:
- Overall score
- Category scores (technical, on-page, content, mobile, performance)
- Issues array (100-200 issues)
- Passed checks array
- Crawl statistics
- Page speed metrics
- Mobile usability data
- Structured data validation
- Security checks (HTTPS, mixed content)

---

### 13.3 Settings och User Data
**Fil:** `frontend/app/api/user/settings/route.ts`

GET/PUT endpoints för:
- User profile
- Notification preferences
- API keys
- Connected accounts (Google Search Console, GA4, etc.)
- Billing/subscription info
- Team members

---

## 14. Avancerade Mock Data Features

### 14.1 Historical Trend Data
För varje metric, inkludera historical data (90 dagar):
- Daily ranking positions
- Daily traffic estimates
- Weekly competitor changes
- Monthly content scores

**Fil:** `frontend/lib/mock-data/historical-data-generator.ts`

Skapa funktioner som genererar realistiska tidsserier med:
- Seasonal patterns
- Weekend dips
- Growth trends
- Anomaly spikes

---

### 14.2 Data Relationships
Se till att data är konsistent:
- Om keyword har position 1, ska clicks vara högt
- Om competitor har high DR, ska de ha många backlinks
- Om content score är låg, ska det finnas många issues
- Traffic ska korrelera med ranking positions

---

### 14.3 Smart Data Generation
**Fil:** `frontend/lib/mock-data/smart-generators.ts`

Skapa intelligenta generators som:
- Genererar relaterade keywords baserat på seed
- Skapar realistiska SERP features baserat på keyword type
- Beräknar metrics baserat på position och volume
- Skapar content issues baserat på content type

---

## 15. Integration i Dashboard Layout

Efter att mockup-data är skapat, uppdatera även:

**Fil:** `frontend/components/layout/dashboard-layout.tsx`

Lägg till:
- RealtimeNotifications component i toppen
- Notification badge i header
- Quick stats widget (kan toggles on/off)

---

## 16. Demo Mode Toggle

**Fil:** `frontend/lib/demo-mode.ts`

Skapa en demo mode switch som:
- Toggles mellan mock data och real API
- Visar "DEMO MODE" badge i UI
- Låter användare "reset demo data"
- Kan simulera time passage (speed up time)

**Fil:** `frontend/app/api/demo/reset/route.ts`

POST endpoint som resettar all demo data till default scenario.

**Fil:** `frontend/app/api/demo/scenarios/route.ts`

GET endpoint som returnerar available scenarios
POST endpoint som aktiverar ett specifikt scenario

---

## 17. Uppdateringar för att Köra Demon

### 17.1 Fixa TypeScript Interface Paths
Flera komponenter använder interfaces som måste exporteras korrekt.

**Fil:** `frontend/lib/types/index.ts`

Skapa en central types-fil som exporterar alla interfaces från mock data och API responses.

---

### 17.2 Fixa Missing Dependencies för RealtimeNotifications
RealtimeNotifications-komponenten använder WebSocket hooks som inte finns ännu.

**Fil:** `frontend/hooks/useWebSocket.ts`

Skapa en mock WebSocket hook som:
- Returnerar mock notifications array
- Returnerar unread count
- Exporterar markAsRead, clearNotifications, removeNotification functions

**Fil:** `frontend/services/websocket/WebSocketService.ts`

Skapa en mock WebSocket service.

---

### 17.3 Uppdatera Dashboard Layout
**Fil:** `frontend/components/layout/dashboard-layout.tsx`

Lägg till högst upp i komponenten:
```tsx
import { RealtimeNotifications } from '@/src/components/notifications/RealtimeNotifications'
```

Och i JSX, lägg till innan main content:
```tsx
<RealtimeNotifications position="top-right" maxNotifications={5} />
```

---

### 17.4 Lägg till Demo Mode Badge
**Fil:** `frontend/components/layout/header.tsx`

Lägg till en "DEMO MODE" badge i headern så det är tydligt att det är demo-data.

---

### 17.5 Fixa serpFeatures Typo
I KeywordResearchInterface.tsx finns en typo på rad 32:
```typescript
serp Features: string[]; // har ett space mellan serp och Features
```

**Fil:** `frontend/src/components/keyword/KeywordResearchInterface.tsx`

Ändra rad 32 från:
```typescript
serp Features: string[];
```

Till:
```typescript
serpFeatures: string[];
```

Och uppdatera även rad 241 där det refereras till `s.serpFeatures`.

---

### 17.6 Skapa Standard Error Boundaries
**Fil:** `frontend/components/error-boundary.tsx`

Skapa en error boundary component som fångar fel i komponenter och visar user-friendly felmeddelanden.

---

### 17.7 Uppdatera tsconfig Paths
Se till att TypeScript kan hitta alla importer korrekt.

**Fil:** `frontend/tsconfig.json`

Verifiera att paths inkluderar:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"],
      "@/components/*": ["./components/*"],
      "@/lib/*": ["./lib/*"],
      "@/src/*": ["./src/*"]
    }
  }
}
```

---

### 17.8 Lägg till Loading States
För alla API-anrop, se till att det finns fallback UI när data laddas.

Skapa en shared loading component:
**Fil:** `frontend/components/ui/loading-skeleton.tsx`

Med skeleton loaders för:
- Keyword tables
- Stats cards
- Charts
- Lists

---

### 17.9 Lägg till Toast Notifications
För actions som "Add keywords", "Export data", etc.

**Fil:** `frontend/lib/hooks/useToast.ts`

Verifiera att toast hooks fungerar korrekt med alla komponenter.

---

### 17.10 Skapa en Welcome/Onboarding Screen
**Fil:** `frontend/app/(dashboard)/dashboard/welcome/page.tsx`

En onboarding-sida som visas första gången användaren öppnar demon, som förklarar:
- Vad plattformen gör
- Vilka features som finns
- Hur man navigerar
- "Start Demo Tour" knapp

---

## 18. Final Checklist för Full Demo

Efter att all mockup-data är skapad, verifiera följande:

### Data & APIs
- [ ] Rankings API returnerar 150+ keywords
- [ ] Competitor API returnerar 8+ konkurrenter med 200+ keyword overlaps var
- [ ] Content Analysis API returnerar comprehensive analysis med 40+ issues
- [ ] Keyword Research API returnerar 200+ suggestions med alla modes
- [ ] Backlinks API returnerar 200+ backlinks
- [ ] SEO Audit API returnerar detailed audit med 100+ checks
- [ ] Notifications API returnerar 30+ notifikationer
- [ ] Projects API returnerar 5+ projekt

### UI/UX
- [ ] Alla sidor laddar utan errors
- [ ] Realtime notifications visas i UI
- [ ] DEMO MODE badge syns i header
- [ ] Loading states visas när data hämtas
- [ ] Error states hanteras gracefully
- [ ] Alla charts renderas korrekt
- [ ] Sidebar navigation fungerar
- [ ] Mobile responsive design fungerar

### Performance
- [ ] Alla sidor laddar inom 2 sekunder
- [ ] Stora listor (200+ items) scrollar smidigt
- [ ] Inga console errors
- [ ] Inga TypeScript errors
- [ ] Bundle size är acceptabel

### Content Quality
- [ ] All text är på svenska/engelska (inte lorem ipsum)
- [ ] Alla metrics är realistiska
- [ ] Datum är inom senaste 90 dagarna
- [ ] Keyword data är verklighetstrogen
- [ ] Company names och domains är realistiska

### Demo Experience
- [ ] Welcome screen visas första gången
- [ ] Demo tour fungerar
- [ ] Användaren kan klicka sig igenom alla features
- [ ] Data är impressiv nog för demo
- [ ] Plattformen känns "polished" och professionell

---

## 19. Post-Creation Updates

Efter att du skapat all mockup-data, kör följande commands i frontend-katalogen:

```bash
# Type check för att hitta TypeScript errors
npm run type-check

# Lint för att hitta kod-kvalitetsproblem
npm run lint

# Build för att verifiera att allt kompilerar
npm run build
```

Fixa alla errors som dessa commands hittar.

---

## 20. Demonstration Script

Skapa en fil som beskriver hur man demonstrerar plattformen:

**Fil:** `frontend/DEMO_SCRIPT.md`

Med steg-för-steg guide för att visa varje feature i bästa ordning för en imponerande demo.

Inkludera:
1. Start på Dashboard (overview)
2. Visa Rankings med real-time updates
3. Visa Competitor Analysis med keyword gaps
4. Visa Advanced Keyword Research med filters
5. Visa Content Analysis med issues
6. Visa Notifications
7. Visa olika projects
8. Avsluta med growth metrics

---

## BÖRJA ARBETA

När du kör denna fil:

### Fas 1: Skapa Mock Data (30-45 min)
1. Läs igenom hela dokumentet noggrant
2. Skapa API routes i prioriteringsordning
3. Skapa data generator utilities
4. Skapa JSON data files
5. Testa varje endpoint

### Fas 2: Integrera Komponenter (15-20 min)
6. Fixa TypeScript interfaces och typos
7. Integrera RealtimeNotifications i DashboardLayout
8. Lägg till DEMO MODE badge
9. Skapa mock WebSocket hooks
10. Fixa alla import paths

### Fas 3: Polish & Testing (15-20 min)
11. Kör type-check och fixa errors
12. Kör lint och fixa warnings
13. Testa alla sidor manuellt
14. Skapa demo script
15. Skapa welcome/onboarding screen

### Fas 4: Rapportera
16. Lista alla filer du skapat
17. Rapportera eventuella issues eller begränsningar
18. Ge rekommendationer för nästa steg

**Lycka till med skapandet av mockup-data!**

---

## 21. Visa Verktyg som Finns Färdiga/Halvfärdiga

### 21.1 Skapa "Features Showcase" Sida
**Fil:** `frontend/app/(dashboard)/dashboard/features/page.tsx`

En sida som visar alla tillgängliga funktioner och komponenter, även de som inte är fullt funktionella i demon ännu.

**Innehåll:**
- **Implemented Features** (med grön badge)
  - Rankings Dashboard
  - Competitor Analysis
  - Content Analysis
  - Advanced Keyword Research

- **UI Components Available** (med blå badge)
  - D3 Charts (kan visa exempel-chart)
  - Recharts Components (kan visa exempel-chart)
  - Virtual Scroll (kan visa demo med 1000+ items)
  - Optimized Image Component
  - Realtime Notifications

- **Coming Soon** (med gul badge)
  - Backlink Discovery (delvis implementerad)
  - SEO Audit (behöver backend)
  - Rank Tracking Automation
  - API Integration

Varje feature ska ha:
- Titel och beskrivning
- Status badge
- "Try Demo" knapp (om funktionell) eller "View Code" knapp
- Screenshot eller live preview

---

### 21.2 Lägg till Features i Sidebar
Uppdatera sidebar för att inkludera en "Features" sektion längst ner:

**Fil:** `frontend/components/layout/sidebar.tsx`

Lägg till innan Settings:
```tsx
{
  title: 'Features Showcase',
  href: '/dashboard/features',
  icon: Sparkles,
}
```

---

### 21.3 Skapa Component Demos Sidor

**Fil:** `frontend/app/(dashboard)/dashboard/components/charts/page.tsx`

Demo-sida för D3 och Recharts komponenter med:
- Line charts
- Bar charts
- Pie charts
- Area charts
- Combined charts
- Interactive demos med live data updates

**Fil:** `frontend/app/(dashboard)/dashboard/components/virtual-scroll/page.tsx`

Demo för VirtualScroll med 5000+ items lista för att visa performance.

**Fil:** `frontend/app/(dashboard)/dashboard/components/ui-library/page.tsx`

Showcase för alla UI-komponenter från src/components/ui/:
- Buttons (olika varianter)
- Inputs och Forms
- Modals och Dialogs
- Alerts och Toasts
- Badges och Tags
- Cards och Containers
- Loading states
- Empty states

---

### 21.4 Integrera RealtimeNotifications (även utan backend)
Skapa en mock implementation som genererar fake notifications varje 10-30 sekunder:

**Fil:** `frontend/hooks/useWebSocket.ts`

```typescript
import { useState, useEffect } from 'react'

// Mock notifications generator
const generateMockNotification = () => {
  const types = ['ranking_change', 'backlink', 'content_issue', 'competitor_activity']
  const messages = {
    ranking_change: 'Keyword "best seo tools" moved up 3 positions',
    backlink: 'New backlink discovered from authority site',
    content_issue: 'Missing meta description detected on 3 pages',
    competitor_activity: 'Competitor published new content'
  }

  const type = types[Math.floor(Math.random() * types.length)]

  return {
    id: `notif-${Date.now()}-${Math.random()}`,
    type,
    severity: Math.random() > 0.7 ? 'critical' : Math.random() > 0.4 ? 'warning' : 'info',
    message: messages[type],
    timestamp: new Date().toISOString(),
    read: false,
    relatedEntity: 'example.com',
    actionUrl: '/dashboard'
  }
}

export function useRealtimeNotifications() {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    // Generate initial notifications
    const initial = Array.from({ length: 5 }, generateMockNotification)
    setNotifications(initial)
    setUnreadCount(3)

    // Generate new notification every 15 seconds
    const interval = setInterval(() => {
      const newNotif = generateMockNotification()
      setNotifications(prev => [newNotif, ...prev].slice(0, 50))
      setUnreadCount(prev => prev + 1)
    }, 15000)

    return () => clearInterval(interval)
  }, [])

  const markAsRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  const clearNotifications = () => {
    setNotifications([])
    setUnreadCount(0)
  }

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  return {
    notifications,
    unreadCount,
    markAsRead,
    clearNotifications,
    removeNotification
  }
}
```

---

## 22. Technology Stack Display

### 22.1 Skapa Tech Stack Sida
**Fil:** `frontend/app/(dashboard)/dashboard/about/page.tsx`

En sida som visar:
- **Frontend Stack:**
  - Next.js 14 (App Router)
  - React 18
  - TypeScript
  - TailwindCSS
  - Framer Motion
  - Recharts + D3.js
  - React Query
  - Zustand

- **UI Components:**
  - Radix UI
  - Lucide Icons
  - Custom component library

- **Features Implemented:**
  - Server-side rendering
  - Client-side routing
  - Real-time updates (mock)
  - Responsive design
  - Dark mode ready
  - Accessibility features

- **Performance Optimizations:**
  - Virtual scrolling
  - Image optimization
  - Code splitting
  - Lazy loading

---

## 23. Status Indicators Throughout UI

Lägg till status badges i hela UI:n för att visa vad som är:
- ✅ Fully Functional (grön)
- 🔧 Partially Implemented (blå)
- 🚧 Coming Soon (gul)
- 📝 Requires Backend (orange)

**Exempel placeringar:**
- I sidebar bredvid varje menu item
- I features showcase
- I settings-sidan
- På varje dashboard card

---

## Snabb-referens: Alla Filer att Skapa

```
API Routes (9 filer):
- frontend/app/api/rankings/[projectId]/route.ts
- frontend/app/api/projects/route.ts
- frontend/app/api/projects/[projectId]/competitors/route.ts
- frontend/app/api/projects/[projectId]/competitors/[competitorId]/keywords/route.ts
- frontend/app/api/projects/[projectId]/content/analyze/route.ts
- frontend/app/api/projects/[projectId]/backlinks/route.ts
- frontend/app/api/projects/[projectId]/audit/route.ts
- frontend/app/api/keywords/research/route.ts
- frontend/app/api/notifications/route.ts

Mock Data (5 filer):
- frontend/lib/mock-data/keywords.json
- frontend/lib/mock-data/domains.json
- frontend/lib/mock-data/serp-features.json
- frontend/lib/mock-data/content-issues.json
- frontend/lib/mock-data/demo-scenarios.ts

Utilities (4 filer):
- frontend/lib/mock-data/generators.ts
- frontend/lib/mock-data/historical-data-generator.ts
- frontend/lib/mock-data/smart-generators.ts
- frontend/lib/types/index.ts

Hooks & Services (2 filer):
- frontend/hooks/useWebSocket.ts (UPPDATERAD med mock implementation)
- frontend/services/websocket/WebSocketService.ts

Components & Pages (8 filer):
- frontend/components/ui/loading-skeleton.tsx
- frontend/components/error-boundary.tsx
- frontend/app/(dashboard)/dashboard/welcome/page.tsx
- frontend/app/(dashboard)/dashboard/features/page.tsx (NY)
- frontend/app/(dashboard)/dashboard/about/page.tsx (NY)
- frontend/app/(dashboard)/dashboard/components/charts/page.tsx (NY)
- frontend/app/(dashboard)/dashboard/components/virtual-scroll/page.tsx (NY)
- frontend/app/(dashboard)/dashboard/components/ui-library/page.tsx (NY)

Documentation (2 filer):
- frontend/DEMO_SCRIPT.md
- frontend/lib/demo-mode.ts

Demo Features (2 filer):
- frontend/app/api/demo/reset/route.ts
- frontend/app/api/demo/scenarios/route.ts

Totalt: 32 nya filer att skapa
```

---

## 24. Snygg Grafik och Visuellt Polish

### 24.1 Hero/Welcome Graphics
**Fil:** `frontend/public/images/hero/`

Lägg till SVG-baserade illustrationer för:
- Dashboard hero section
- Welcome screen illustration
- Empty states
- Error pages (404, 500)
- Success states

**Rekommenderade SVG-illustrationer att skapa:**
- SEO dashboard med grafer och metrics (animerad)
- Keyword research med sök-illustration
- Competitor analysis med företags-ikoner
- Analytics/charts med trend-linjer
- Team collaboration illustration

**Stil:**
- Modern, minimalistisk linje-konst
- Använd brand colors (blå/lila gradient)
- Flat design med lite shadows
- Animerbar (Framer Motion)

---

### 24.2 Gradient Backgrounds och Visual Effects
**Fil:** `frontend/app/globals.css`

Lägg till custom gradients:
```css
.gradient-hero {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.gradient-success {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
}

.gradient-warning {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.gradient-chart {
  background: linear-gradient(180deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0) 100%);
}

/* Animated gradient background */
.animated-gradient {
  background: linear-gradient(-45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab);
  background-size: 400% 400%;
  animation: gradient 15s ease infinite;
}

@keyframes gradient {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

/* Glass morphism effect */
.glass {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

/* Hover glow effects */
.glow-on-hover {
  transition: all 0.3s ease;
}

.glow-on-hover:hover {
  box-shadow: 0 0 20px rgba(59, 130, 246, 0.5);
  transform: translateY(-2px);
}
```

---

### 24.3 Ikoner och Visuella Element
Använd Lucide Icons men lägg till custom animated ikoner för:

**Fil:** `frontend/components/ui/animated-icons.tsx`

Skapa animated ikoner med Framer Motion för:
- Loading spinner med SEO-tema
- Success checkmark med celebration
- Trending up/down med smooth animation
- Search med pulse effect
- Notification bell med shake

**Exempel:**
```tsx
import { motion } from 'framer-motion'

export const AnimatedCheckmark = () => (
  <motion.svg
    initial={{ scale: 0, rotate: -180 }}
    animate={{ scale: 1, rotate: 0 }}
    transition={{ type: "spring", duration: 0.6 }}
    // ... SVG path
  />
)
```

---

### 24.4 Chart Visualizations med Style
Uppdatera Recharts/D3 charts med:
- Gradient fills
- Smooth animations
- Interactive hover states
- Custom tooltips med glassmorphism
- Animated data points

**Fil:** `frontend/components/charts/styled-charts.tsx`

```tsx
const GradientLineChart = () => (
  <ResponsiveContainer>
    <LineChart>
      <defs>
        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
          <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
        </linearGradient>
      </defs>
      <Line
        type="monotone"
        dataKey="value"
        stroke="#8884d8"
        fill="url(#colorValue)"
        strokeWidth={3}
        dot={{ r: 6 }}
        activeDot={{ r: 8 }}
      />
    </LineChart>
  </ResponsiveContainer>
)
```

---

### 24.5 Micro-Interactions och Animations
**Fil:** `frontend/components/ui/micro-interactions.tsx`

Lägg till små animations för:
- Button clicks (ripple effect)
- Card hover (lift + shadow)
- Number count-up animations
- Progress bars med smooth fill
- Toggle switches med satisfying click
- Dropdown menus med smooth slide
- Modal entrances (scale + fade)

**Exempel med Framer Motion:**
```tsx
<motion.div
  whileHover={{ scale: 1.02, y: -2 }}
  whileTap={{ scale: 0.98 }}
  transition={{ type: "spring", stiffness: 400 }}
>
  <Card>...</Card>
</motion.div>
```

---

### 24.6 Empty States med Illustrationer
**Fil:** `frontend/components/ui/empty-states.tsx`

Skapa visuellt tilltalande empty states för:
- Inga keywords än (illustration med förstoringsglas)
- Inga konkurrenter (illustration med tomt leaderboard)
- Ingen data tillgänglig (illustration med tom graf)
- Inget innehåll att analysera (illustration med tom sida)

Varje empty state ska ha:
- SVG illustration (200-300px)
- Headline text
- Descriptive subtext
- Primary action button med gradient
- Optional secondary link

---

### 24.7 Status Badges med Style
**Fil:** `frontend/components/ui/status-badge.tsx`

Skapa snygga badges för:
- ✅ Fully Functional (grön med glödande effekt)
- 🔧 Partially Implemented (blå med pulsing)
- 🚧 Coming Soon (gul med shimmer)
- 📝 Requires Backend (orange med fade)
- 🚀 New Feature (gradient purple/pink)

Med animations:
```tsx
const Badge = ({ status }) => (
  <motion.span
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    className="badge"
    whileHover={{ scale: 1.1 }}
  >
    {status}
  </motion.span>
)
```

---

### 24.8 Dashboard Cards med Visual Hierarchy
Uppdatera alla stat cards med:
- Subtle gradient backgrounds
- Icon med colored circular background
- Smooth hover states
- Trend indicators med colors
- Mini sparkline charts inuti cards

**Exempel:**
```tsx
<Card className="relative overflow-hidden">
  {/* Background decoration */}
  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 opacity-10 rounded-full blur-3xl" />

  {/* Content */}
  <CardContent>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-600">Total Keywords</p>
        <CountUp end={1234} duration={2} className="text-3xl font-bold" />
      </div>
      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
        <Target className="w-6 h-6 text-blue-600" />
      </div>
    </div>
    <TinyLineChart data={sparklineData} />
  </CardContent>
</Card>
```

---

### 24.9 Loading States med Style
**Fil:** `frontend/components/ui/loading-skeleton.tsx`

Skapa animated skeleton loaders med:
- Shimmer effect (wave animation)
- Gradient pulse
- Smooth transitions

```css
@keyframes shimmer {
  0% { background-position: -1000px 0; }
  100% { background-position: 1000px 0; }
}

.skeleton {
  animation: shimmer 2s infinite;
  background: linear-gradient(
    90deg,
    #f0f0f0 0%,
    #f8f8f8 50%,
    #f0f0f0 100%
  );
  background-size: 1000px 100%;
}
```

---

### 24.10 Navigations-Transitions
Lägg till smooth page transitions:

**Fil:** `frontend/app/layout.tsx`

```tsx
import { AnimatePresence, motion } from 'framer-motion'

const pageVariants = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 }
}

// Wrap pages
<AnimatePresence mode="wait">
  <motion.div
    variants={pageVariants}
    initial="initial"
    animate="animate"
    exit="exit"
    transition={{ duration: 0.3 }}
  >
    {children}
  </motion.div>
</AnimatePresence>
```

---

### 24.11 Custom Cursor Effects (Optional)
För extra polish, lägg till custom cursor på hover av interaktiva element:
- Cursor växer på hover
- Cursor ändrar färg vid olika elements
- Trailing effect på mouse movement

---

## 25. Grafik-Resurser att Använda

### 25.1 SVG Illustration Libraries (gratis)
- **unDraw** (https://undraw.co) - Customizable illustrations
- **Storyset** (https://storyset.com) - Animated illustrations
- **Humaaans** (https://www.humaaans.com) - Mix-and-match character illustrations

### 25.2 Icon Sets
- **Lucide Icons** (redan installerat) - Main icons
- **Heroicons** - Alternativa ikoner
- **Phosphor Icons** - Moderna, geometriska ikoner

### 25.3 Gradient Tools
- **uiGradients** (https://uigradients.com) - Gradient inspiration
- **WebGradients** - Gradient library
- **CSS Gradient** - Custom gradient generator

### 25.4 Animation Resources
- **Lottie Files** (https://lottiefiles.com) - JSON animations
- **GSAP** - Advanced animations (optional)
- **Framer Motion** (redan installerat) - React animations

---

## 26. Visual Design Guidelines

### Color Palette
**Primary Colors:**
- Blue: #3B82F6 (primary)
- Purple: #8B5CF6 (accent)
- Green: #10B981 (success)
- Red: #EF4444 (error)
- Yellow: #F59E0B (warning)

**Gradients:**
- Primary: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`
- Success: `linear-gradient(135deg, #11998e 0%, #38ef7d 100%)`
- Warning: `linear-gradient(135deg, #f093fb 0%, #f5576c 100%)`

**Neutral Palette:**
- Gray 50: #F9FAFB
- Gray 100: #F3F4F6
- Gray 900: #111827

### Typography
- Headlines: Bold, 2xl-4xl
- Body: Regular, sm-base
- Captions: Regular/Medium, xs-sm
- Monospace för metrics/numbers

### Spacing & Layout
- Card padding: 1.5rem (24px)
- Section spacing: 2rem (32px)
- Component gap: 1rem (16px)
- Border radius: 0.75rem (12px) för cards

### Shadows
- Small: `0 1px 3px rgba(0,0,0,0.1)`
- Medium: `0 4px 6px rgba(0,0,0,0.1)`
- Large: `0 10px 15px rgba(0,0,0,0.1)`
- Colored: `0 0 20px rgba(59,130,246,0.3)`

---

Totalt: 32 nya filer att skapa + grafiska assets och styling
```
