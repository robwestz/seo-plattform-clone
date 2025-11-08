# SEO Intelligence Platform - Frontend

Modern, production-ready Next.js 14 dashboard for the SEO Intelligence Platform with comprehensive SEO analytics, keyword tracking, and site audit features.

## Features

### Core Functionality
- **Authentication**: Secure login/register with JWT tokens
- **Dashboard**: Real-time SEO metrics and performance overview
- **Project Management**: Manage multiple websites and SEO projects
- **Keyword Research**: Discover and analyze keyword opportunities
- **Rank Tracking**: Monitor keyword rankings over time with visualizations
- **SEO Audit**: Technical SEO analysis with detailed recommendations
- **Backlink Explorer**: Track and analyze your backlink profile
- **Settings**: Comprehensive user and notification preferences

### Technology Stack
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS + shadcn/ui components
- **State Management**: Zustand
- **Data Fetching**: React Query (TanStack Query)
- **Charts**: Recharts
- **Icons**: Lucide React
- **Theme**: Dark mode support with next-themes
- **HTTP Client**: Axios with automatic token refresh

## Project Structure

```
frontend/
├── app/                           # Next.js App Router
│   ├── (auth)/                    # Authentication routes
│   │   ├── login/                 # Login page
│   │   └── register/              # Registration page
│   ├── (dashboard)/               # Dashboard routes (protected)
│   │   └── dashboard/
│   │       ├── page.tsx           # Main dashboard
│   │       ├── projects/          # Project management
│   │       ├── keywords/          # Keyword research & tracking
│   │       ├── audit/             # SEO audit
│   │       ├── backlinks/         # Backlink explorer
│   │       └── settings/          # User settings
│   ├── layout.tsx                 # Root layout
│   ├── page.tsx                   # Home (redirects to dashboard)
│   └── globals.css                # Global styles
├── components/                    # React components
│   ├── ui/                        # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── table.tsx
│   │   └── ...
│   ├── layout/                    # Layout components
│   │   ├── sidebar.tsx            # Navigation sidebar
│   │   ├── header.tsx             # Top header with user menu
│   │   ├── breadcrumbs.tsx        # Breadcrumb navigation
│   │   └── dashboard-layout.tsx   # Main layout wrapper
│   ├── charts/                    # Chart components
│   │   ├── line-chart.tsx         # Line chart wrapper
│   │   └── bar-chart.tsx          # Bar chart wrapper
│   └── seo/                       # SEO-specific components
│       ├── keyword-table.tsx      # Keyword rankings table
│       ├── ranking-chart.tsx      # Ranking trend chart
│       ├── audit-score.tsx        # Audit score cards
│       ├── backlink-list.tsx      # Backlink table
│       └── project-card.tsx       # Project card component
├── lib/                           # Utilities and configurations
│   ├── api/                       # API client and endpoints
│   │   ├── client.ts              # Axios client with auth
│   │   └── index.ts               # API methods
│   ├── store/                     # Zustand stores
│   │   ├── auth-store.ts          # Authentication state
│   │   └── ui-store.ts            # UI state (sidebar, theme)
│   ├── providers.tsx              # React Query & Theme providers
│   └── utils.ts                   # Utility functions
├── types/                         # TypeScript types
│   └── index.ts                   # Shared types
├── package.json                   # Dependencies
├── tsconfig.json                  # TypeScript config
├── tailwind.config.ts             # Tailwind config
├── next.config.js                 # Next.js config
└── README.md                      # This file
```

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Backend API running (see `/backend` directory)

### Installation

1. **Install dependencies**:
```bash
npm install
```

2. **Set up environment variables**:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration:
```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
NEXT_PUBLIC_WS_URL=ws://localhost:3000
NEXT_PUBLIC_APP_NAME=SEO Intelligence Platform
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

3. **Start the development server**:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## Pages

### Authentication
- `/login` - User login
- `/register` - New user registration

### Dashboard
- `/dashboard` - Main dashboard with metrics overview
- `/dashboard/projects` - Project list and management
- `/dashboard/projects/[id]` - Individual project details
- `/dashboard/keywords/research` - Keyword research tool
- `/dashboard/keywords/tracking` - Rank tracking dashboard
- `/dashboard/audit` - SEO audit results and recommendations
- `/dashboard/backlinks` - Backlink profile and analysis
- `/dashboard/settings` - User settings and preferences

## Components

### UI Components (shadcn/ui based)
All components are built using Radix UI primitives and styled with Tailwind CSS:
- Button, Input, Label, Select
- Card, Table, Tabs
- Avatar, Badge, Switch
- Dropdown Menu, Toast
- And more...

### Layout Components
- **Sidebar**: Collapsible navigation sidebar with route highlighting
- **Header**: Top header with theme toggle, notifications, and user menu
- **Breadcrumbs**: Automatic breadcrumb navigation based on route
- **DashboardLayout**: Main layout wrapper with sidebar and header

### Chart Components
- **LineChart**: Ranking trends and time-series data
- **BarChart**: Traffic and comparative metrics

### SEO Components
- **KeywordTable**: Sortable table with rank changes
- **RankingChart**: Visual ranking history
- **AuditScoreCard**: Color-coded audit scores
- **BacklinkList**: Backlink profile with filtering
- **ProjectCard**: Project overview cards

## State Management

### Zustand Stores

**Auth Store** (`lib/store/auth-store.ts`):
- User authentication state
- Tenant context
- Login/logout actions

**UI Store** (`lib/store/ui-store.ts`):
- Sidebar open/closed state
- Theme preference (light/dark/system)

### React Query

Used for server state management with automatic caching, refetching, and error handling:
- 5-minute stale time
- Automatic retry on failure
- Disabled window focus refetch

## API Integration

### API Client
The API client (`lib/api/client.ts`) handles:
- JWT token management
- Automatic token refresh
- Tenant ID headers
- Request/response interceptors

### Available APIs
- **Auth**: login, register, logout, refresh token
- **Tenants**: CRUD operations for tenant management
- **Projects**: Project management and statistics
- **Keywords**: Research and rank tracking
- **Backlinks**: Backlink analysis
- **Audit**: SEO audit operations
- **Events**: Trigger crawls, audits, rank checks

## Styling

### Tailwind CSS
- Mobile-first responsive design
- Custom color system using CSS variables
- Dark mode support via `next-themes`
- Animation utilities via `tailwindcss-animate`

### Theme Support
The app supports three theme modes:
- Light mode
- Dark mode
- System (follows OS preference)

Toggle theme via the sun/moon icon in the header.

## Type Safety

Full TypeScript support with strict mode enabled. All API responses, component props, and state are fully typed.

See `types/index.ts` for shared type definitions.

## Responsive Design

All pages and components are fully responsive:
- Mobile: Single column layouts, collapsible sidebar
- Tablet: 2-column grids
- Desktop: 3-4 column grids, persistent sidebar

## Accessibility

- Semantic HTML
- ARIA labels on interactive elements
- Keyboard navigation support
- Screen reader friendly
- Color contrast compliant

## Performance Optimization

- Code splitting via Next.js App Router
- Image optimization with `next/image`
- Automatic static optimization
- React Query caching
- Lazy loading for charts

## Development

### Adding a New Page

1. Create page file in `app/(dashboard)/dashboard/your-page/page.tsx`
2. Wrap content in `<DashboardLayout>`
3. Add route to sidebar in `components/layout/sidebar.tsx`

### Adding a New Component

1. Create component in appropriate directory
2. Use TypeScript for props
3. Follow shadcn/ui patterns for UI components
4. Use Tailwind classes for styling

### Adding a New API Endpoint

1. Add type definitions to `types/index.ts`
2. Add API method to `lib/api/index.ts`
3. Use React Query hooks in components

## Production Deployment

### Build

```bash
npm run build
```

### Environment Variables

Set the following in your production environment:
- `NEXT_PUBLIC_API_URL` - Production API URL
- `NEXT_PUBLIC_WS_URL` - Production WebSocket URL

### Deployment Options

- **Vercel**: Zero-config deployment (recommended)
- **Docker**: Create Dockerfile with Node.js base image
- **Static Export**: Not available (uses server features)

## Browser Support

- Chrome (last 2 versions)
- Firefox (last 2 versions)
- Safari (last 2 versions)
- Edge (last 2 versions)

## Contributing

1. Follow the existing code style
2. Write TypeScript with proper types
3. Test on mobile and desktop
4. Ensure dark mode compatibility
5. Add JSDoc comments for complex functions

## License

MIT

## Support

For issues and questions, please open a GitHub issue.
