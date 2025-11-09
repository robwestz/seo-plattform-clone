# Feature Spec: Ranking Dashboard

**Priority**: 🔴 Critical
**File**: `frontend/src/components/dashboards/RankingDashboard.tsx`
**LOC**: 642
**Status**: ⏳ Ready for Validation
**Dependencies**: React Query, WebSocket (optional), Charts

---

## Overview

The Ranking Dashboard is the core feature for tracking keyword rankings over time. It displays real-time keyword position data, trends, and performance metrics - the #1 feature SEO professionals need.

---

## What Was Built

### 1. Core Functionality

#### Data Display
- **Keyword Rankings Table** - Shows all tracked keywords with:
  - Current position (color-coded: green ≤3, blue ≤10, yellow ≤20, gray >20)
  - Position change (up/down/stable indicators)
  - Search volume
  - Clicks & impressions
  - CTR (Click-through rate)
  - Target URL

#### Statistics Dashboard
- **Total Keywords** - Count with breakdown of improvements/declines/stable
- **Average Position** - Mean ranking position across all keywords
- **Total Clicks** - Sum of clicks with impressions count
- **Average CTR** - Calculated as (total clicks / total impressions) × 100

### 2. Features

#### Filtering & Search
✅ **Search** - Filter by keyword or URL (case-insensitive)
✅ **Trend Filter** - Show all, improving, declining, or stable keywords
✅ **Sorting** - Sort by position, change, volume, or CTR (asc/desc)

#### Data Management
✅ **Auto-refresh** - Configurable refresh interval (default: 60s)
✅ **Manual Refresh** - Refresh button with loading indicator
✅ **CSV Export** - Download filtered results as CSV file
✅ **Date Range** - Filter data by date range (via props)

#### UX Features
✅ **Loading States** - Spinner during data fetch
✅ **Error Handling** - Error screen with retry button
✅ **Empty States** - "No rankings found" with contextual messaging
✅ **Animations** - Framer Motion for smooth transitions
✅ **Responsive Design** - Mobile-friendly layout with flexbox

### 3. Technical Implementation

#### State Management
- React Query for server state (caching, refetching)
- Local state for filters (search, trend, sort)
- useMemo for performance optimization (filtering, stats calculation)

#### Data Fetching
- API endpoint: `/api/rankings/:projectId`
- Query parameters: `startDate`, `endDate`
- Automatic refetch on date range change
- Configurable stale time (30s)

#### Performance
- Memoized filtering and sorting
- Optimized re-renders with useMemo
- AnimatePresence for list animations
- No unnecessary API calls

---

## Success Criteria

### Functional Requirements
- [ ] Displays keyword rankings accurately
- [ ] Filters work correctly (search, trend, sort)
- [ ] Statistics calculations are accurate
- [ ] CSV export contains all filtered data
- [ ] Auto-refresh works without memory leaks
- [ ] Error handling provides clear user feedback
- [ ] Date range filtering works correctly

### Performance Requirements
- [ ] Initial load < 3 seconds
- [ ] Filtering/sorting < 100ms
- [ ] Smooth animations (60fps)
- [ ] No memory leaks from intervals

### SEO Requirements
- [ ] Position changes calculated correctly (previous - current)
- [ ] Trend logic is accurate (up = improved ranking = lower number)
- [ ] CTR calculation: (clicks / impressions) × 100
- [ ] Search volume data is meaningful
- [ ] Metrics match industry standards

### UX Requirements
- [ ] Mobile responsive (tested on 375px, 768px, 1024px)
- [ ] Clear visual hierarchy
- [ ] Loading states prevent user confusion
- [ ] Error messages are actionable
- [ ] Export filename includes timestamp

---

## Known Issues / Questions

### For SEO Expert Validation

1. **Position Change Logic**
   - Currently: `change = previousPosition - currentPosition`
   - Is this correct? (Positive = improved = moved up in rankings)
   - Example: Position 10 → 7 = change of +3 (improvement)

2. **Trend Calculation**
   - How is `trend` determined? (Not visible in frontend code)
   - Is it based on `change` value? Or a backend calculation?
   - Should trend show week-over-week or overall direction?

3. **Historical Comparison**
   - Currently only shows `previousPosition` (single point)
   - Do SEO pros need week-over-week, month-over-month comparison?
   - Should there be a chart showing position history over time?

4. **CTR Expectations**
   - Is the CTR calculation correct: `(clicks / impressions) × 100`?
   - What's a "good" CTR for different positions? (for color coding)
   - Should CTR be compared to industry benchmarks?

5. **Search Volume Accuracy**
   - Where does search volume data come from?
   - Is it Google Search Console, or external (Ahrefs/SEMrush)?
   - How often is it updated?

6. **Date Range Behavior**
   - How should date range affect the display?
   - Show rankings for that period, or changes during that period?
   - What's the default date range if none provided?

7. **Keyword Difficulty**
   - Field exists in interface but not displayed
   - Should difficulty be shown? How is it calculated?

8. **Refresh Frequency**
   - 60s default refresh - is this too frequent?
   - What's the typical ranking update frequency from Google?
   - Should it be configurable per project?

---

## Testing Plan

### Code Review
- [x] Component structure and TypeScript types
- [x] React Query integration
- [x] Filter/sort logic
- [x] Statistics calculations
- [ ] Error boundary (NOT PRESENT - potential issue)
- [ ] Accessibility (ARIA labels, keyboard nav)

### Manual Testing
- [ ] Load dashboard with sample data
- [ ] Test search filter with various inputs
- [ ] Test trend filter (all, up, down, stable)
- [ ] Test all sort options (position, change, volume, CTR)
- [ ] Test sort order toggle (asc/desc)
- [ ] Test CSV export with different filter combinations
- [ ] Test auto-refresh (enable/disable)
- [ ] Test manual refresh button
- [ ] Test error state (force API error)
- [ ] Test empty state (no keywords tracked)
- [ ] Test with large dataset (1000+ keywords)
- [ ] Test mobile responsiveness

### SEO Expert Validation
- [ ] Validate position change calculation
- [ ] Validate trend indicators match SEO expectations
- [ ] Validate CTR calculation accuracy
- [ ] Validate statistics accuracy
- [ ] Validate terminology (is it correct?)
- [ ] Validate workflow fit (does it solve real problems?)
- [ ] Validate missing features (what's needed?)

### Performance Testing
- [ ] Measure initial load time
- [ ] Measure filter/sort performance with large datasets
- [ ] Check for memory leaks (auto-refresh interval)
- [ ] Verify animations run at 60fps

### Edge Cases
- [ ] Zero keywords tracked
- [ ] Single keyword
- [ ] 10,000+ keywords (performance)
- [ ] Keywords with identical positions
- [ ] Keywords with 0 clicks/impressions (CTR calculation)
- [ ] Very long keyword names (display truncation)
- [ ] Very long URLs (display truncation)
- [ ] Date range with no data
- [ ] Invalid date ranges
- [ ] Network timeout during refresh
- [ ] Rapid filter changes (debouncing?)

---

## Potential Issues Found

### 🟠 High Priority

1. **No Error Boundary**
   - Location: Component level
   - Issue: Runtime errors will crash the entire dashboard
   - Recommendation: Add React Error Boundary wrapper

2. **CTR Division by Zero**
   - Location: Line 137 - `const avgCTR = (totalClicks / totalImpressions) * 100`
   - Issue: If totalImpressions = 0, returns NaN or Infinity
   - Recommendation: Add check for zero impressions

3. **CSV Escaping**
   - Location: Lines 172-186 - CSV export
   - Issue: Keywords/URLs with commas will break CSV format
   - Recommendation: Escape commas or use proper CSV library

### 🟡 Medium Priority

4. **Position Change Direction**
   - Location: Line 108 - Sort by change uses `Math.abs(b.change)`
   - Question: Should sorting by change prioritize improvements or all changes?
   - Recommendation: Clarify with SEO expert

5. **Auto-refresh Memory Leak**
   - Location: Lines 72-80 - useEffect with interval
   - Issue: React Query already has refetchInterval, creating duplicate intervals
   - Recommendation: Remove manual interval, rely on React Query's built-in feature

6. **No Loading Skeleton**
   - Location: Lines 346-349 - Loading state shows spinner only
   - Issue: Layout shift when data loads
   - Recommendation: Add skeleton loader matching table structure

### 🟢 Low Priority

7. **Sort Order Persistence**
   - Issue: Sort preferences reset on page refresh
   - Recommendation: Persist to localStorage or URL params

8. **Keyboard Shortcuts**
   - Issue: No keyboard shortcuts for common actions (refresh, export, search)
   - Recommendation: Add keyboard shortcuts for power users

---

## Questions for Chat A (Builder)

1. How is the `trend` field calculated in the backend?
2. What's the expected data source for `searchVolume` and `difficulty`?
3. Should there be a historical chart showing position over time?
4. What's the maximum expected dataset size (for performance testing)?
5. Is there a WebSocket integration for real-time updates? (mentioned in dependencies)

---

## Next Steps

1. **Immediate**: Validate with SEO expert
   - Confirm position change calculation logic
   - Confirm statistics are meaningful
   - Identify missing features

2. **Demo Building**: Create isolated test
   - Build `.validation/demos/ranking-dashboard-demo.html`
   - Mock API with realistic SEO data
   - Test all features independently

3. **Report Generation**: Document findings
   - Create `.validation/reports/ranking-dashboard-{date}.md`
   - List bugs found
   - Provide actionable recommendations

---

## Files to Review

- [ ] `frontend/src/components/dashboards/RankingDashboard.tsx` (main component)
- [ ] `frontend/src/lib/react-query.ts` (query client config)
- [ ] `backend/src/api/rankings/:projectId` (API endpoint - if exists)
- [ ] `frontend/src/hooks/useWebSocket.ts` (real-time updates - if exists)

---

**Status**: Ready for validation
**Next Action**: Schedule 30-min session with SEO expert
