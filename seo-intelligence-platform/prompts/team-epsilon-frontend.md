# TEAM EPSILON - FRONTEND & USER INTERFACE
## SEO Intelligence Platform - Modern Dashboard (20,000 LOC)

---

## 🎯 YOUR MISSION
You are Team Epsilon, building a **world-class dashboard** with Next.js 14, beautiful data visualizations, real-time updates, and exceptional UX that makes complex SEO data easy to understand.

**Target**: 20,000 lines of production-ready code
**Critical Success Factor**: Performance with large datasets, intuitive UX

---

## 📋 YOUR RESPONSIBILITIES

### 1. Dashboard & Layout (4,000 LOC)

**Pages**:
- Dashboard (overview with key metrics)
- Projects list and management
- Keyword research tool
- Rank tracking dashboard
- Technical SEO audit viewer
- Backlink explorer
- Competitor analysis
- Content optimizer
- Settings & integrations

**Layout Components**:
```typescript
// App shell
- Sidebar navigation
- Header with user menu
- Breadcrumbs
- Command palette (Cmd+K)
- Notification center
- Multi-tenant switcher
```

### 2. Data Visualization (5,000 LOC)

**Chart Types** (using Recharts + D3.js):
- Line charts (ranking trends)
- Bar charts (keyword volume)
- Pie charts (traffic sources)
- Heatmaps (ranking distribution)
- Treemaps (content hierarchy)
- Sankey diagrams (user flows)
- Network graphs (backlink visualization)

**Implementation**:
```typescript
interface RankingTrendChart {
  keywords: KeywordData[];
  dateRange: [Date, Date];
  compareWith?: string[];
}

const RankingTrendChart: FC<RankingTrendChartProps> = ({ keywords, dateRange }) => {
  // Recharts LineChart with custom tooltips, annotations
  // Support for zoom, pan, export
};
```

### 3. Real-Time Updates (2,500 LOC)

**Technologies**: WebSockets + Server-Sent Events

**Features**:
- Live rank changes
- Crawl progress
- Audit completion notifications
- Collaborative editing indicators

**Implementation**:
```typescript
// React hook for real-time data
const useRealtimeRankings = (projectId: string) => {
  const [rankings, setRankings] = useState<Ranking[]>([]);

  useEffect(() => {
    const ws = new WebSocket(`wss://api.seo.com/rankings/${projectId}`);
    ws.onmessage = (event) => {
      const update = JSON.parse(event.data);
      setRankings(prev => updateRankings(prev, update));
    };
    return () => ws.close();
  }, [projectId]);

  return rankings;
};
```

### 4. Keyword Research UI (2,500 LOC)

**Features**:
- Keyword suggestion input with autocomplete
- Bulk keyword import (CSV, paste)
- Filtering (volume, difficulty, intent)
- Sorting and grouping
- Keyword clustering visualization
- Export functionality (CSV, PDF)

**Components**:
```typescript
<KeywordResearchTool>
  <KeywordInput />
  <FilterPanel />
  <KeywordTable>
    <KeywordRow />
  </KeywordTable>
  <KeywordMetrics />
  <SerpPreview />
  <CompetitorComparison />
</KeywordResearchTool>
```

### 5. Technical Audit Viewer (2,000 LOC)

**Features**:
- Issue severity categorization
- Interactive site crawl graph
- Page speed waterfall charts
- Fix priority recommendations
- Issue export and sharing

**Visualization**:
```typescript
interface AuditDashboard {
  scoreGauge: number; // 0-100 circular gauge
  issueBreakdown: { critical: 12, warning: 45, notice: 103 };
  pageSpeedMetrics: LighthouseScores;
  crawlGraph: SiteHierarchy;
}
```

### 6. Form & Input Components (2,000 LOC)

**Components**:
- Project creation wizard
- Domain addition form
- Keyword import modal
- Integration setup forms
- Billing & subscription forms

**Validation**: Zod schemas + React Hook Form

### 7. State Management (2,000 LOC)

**Zustand Store Structure**:
```typescript
interface AppStore {
  // Auth
  user: User | null;
  tenant: Tenant | null;

  // Current context
  currentProject: Project | null;

  // UI state
  sidebarOpen: boolean;
  theme: 'light' | 'dark';

  // Data cache
  projects: Project[];
  keywords: Keyword[];
  rankings: Ranking[];
}
```

**React Query** for server state:
```typescript
const useProjects = () => useQuery({
  queryKey: ['projects', tenantId],
  queryFn: () => api.projects.list(tenantId),
  staleTime: 5 * 60 * 1000, // 5 min
});
```

---

## 🏗️ PROJECT STRUCTURE

```
frontend/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/
│   │   ├── dashboard/page.tsx
│   │   ├── projects/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── keywords/
│   │   │   ├── research/page.tsx
│   │   │   └── tracking/page.tsx
│   │   ├── audit/page.tsx
│   │   ├── backlinks/page.tsx
│   │   └── layout.tsx
│   ├── api/ (Next.js API routes)
│   └── layout.tsx
├── components/
│   ├── ui/ (shadcn/ui components)
│   ├── charts/
│   ├── forms/
│   ├── layout/
│   └── domain/
│       ├── keywords/
│       ├── rankings/
│       └── audit/
├── lib/
│   ├── api/
│   ├── hooks/
│   ├── store/
│   └── utils/
├── styles/
│   └── globals.css
├── public/
└── package.json
```

---

## 🔧 TECHNICAL REQUIREMENTS

### Technologies
- **Framework**: Next.js 14 (App Router)
- **UI Library**: React 18
- **Styling**: Tailwind CSS + shadcn/ui
- **State**: Zustand + React Query
- **Charts**: Recharts + D3.js
- **Forms**: React Hook Form + Zod
- **Real-time**: WebSocket + SSE

### Performance
- Lighthouse score: 90+
- First Contentful Paint: < 1.5s
- Time to Interactive: < 3s
- Bundle size: < 200KB (gzipped)
- Code splitting per route

### Responsive Design
- Mobile-first approach
- Breakpoints: 640px, 768px, 1024px, 1280px
- Touch-friendly on mobile
- Optimized tables for small screens

---

## 📊 DELIVERABLES

### Pages (Full List)
```
/login, /register, /forgot-password
/dashboard
/projects, /projects/[id]
/keywords/research, /keywords/tracking
/rankings, /rankings/[keywordId]
/audit, /audit/[auditId]
/backlinks, /backlinks/profile
/competitors
/content/optimizer
/integrations
/settings/account, /settings/team, /settings/billing
```

### Components Library
- 50+ reusable UI components
- 20+ chart components
- 15+ form components
- Storybook documentation

---

## 🚀 IMPLEMENTATION PHASES

### Phase 1: Foundation (30 min)
- Next.js setup, routing, layouts
- UI component library integration
- Auth pages

### Phase 2: Dashboard (35 min)
- Main dashboard
- Project management
- Navigation

### Phase 3: Keyword Tools (40 min)
- Keyword research UI
- Rank tracking dashboard
- Charts and visualizations

### Phase 4: Audit & Analysis (35 min)
- Technical audit viewer
- Backlink explorer
- Competitor analysis

### Phase 5: Real-time & Polish (40 min)
- WebSocket integration
- Performance optimization
- Mobile responsiveness

---

## 🔗 INTEGRATION POINTS

### You Depend On:
- **Team Alpha**: Auth APIs
- **Team Gamma**: SEO data APIs
- **Team Zeta**: GraphQL/REST APIs

### Your Output Used By:
- End users (main interface)

---

**BUILD THE INTERFACE USERS WILL LOVE. MAKE IT BEAUTIFUL AND FAST. 🎨**

BEGIN MEGA-FILE CREATION FOR TEAM EPSILON!
