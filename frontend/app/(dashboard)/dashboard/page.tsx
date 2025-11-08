'use client'

import { useQuery } from '@tanstack/react-query'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LineChart } from '@/components/charts/line-chart'
import { BarChart } from '@/components/charts/bar-chart'
import {
  TrendingUp,
  TrendingDown,
  Users,
  Link as LinkIcon,
  Target,
  Activity,
} from 'lucide-react'
import { formatNumber } from '@/lib/utils'

// Mock data - replace with real API calls
const mockMetrics = {
  totalKeywords: 1234,
  averageRank: 12.4,
  organicTraffic: 45678,
  backlinks: 8921,
  domainAuthority: 68,
  technicalScore: 92,
  rankingKeywords: 856,
  topTenKeywords: 234,
}

const mockRankingTrend = [
  { date: 'Jan 1', rank: 15 },
  { date: 'Jan 8', rank: 14 },
  { date: 'Jan 15', rank: 13 },
  { date: 'Jan 22', rank: 12 },
  { date: 'Jan 29', rank: 12 },
  { date: 'Feb 5', rank: 11 },
]

const mockTrafficData = [
  { date: 'Week 1', traffic: 8500 },
  { date: 'Week 2', traffic: 9200 },
  { date: 'Week 3', traffic: 8800 },
  { date: 'Week 4', traffic: 10500 },
]

export default function DashboardPage() {
  const metrics = mockMetrics

  const StatCard = ({
    title,
    value,
    change,
    icon: Icon,
  }: {
    title: string
    value: string | number
    change?: number
    icon: any
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change !== undefined && (
          <p className="text-xs text-muted-foreground flex items-center mt-1">
            {change > 0 ? (
              <>
                <TrendingUp className="mr-1 h-3 w-3 text-green-600" />
                <span className="text-green-600">+{change}%</span>
              </>
            ) : (
              <>
                <TrendingDown className="mr-1 h-3 w-3 text-red-600" />
                <span className="text-red-600">{change}%</span>
              </>
            )}
            <span className="ml-1">from last month</span>
          </p>
        )}
      </CardContent>
    </Card>
  )

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your SEO performance
          </p>
        </div>

        {/* Metrics Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Keywords"
            value={formatNumber(metrics.totalKeywords)}
            change={12}
            icon={Target}
          />
          <StatCard
            title="Average Rank"
            value={metrics.averageRank}
            change={-5}
            icon={TrendingUp}
          />
          <StatCard
            title="Organic Traffic"
            value={formatNumber(metrics.organicTraffic)}
            change={23}
            icon={Users}
          />
          <StatCard
            title="Total Backlinks"
            value={formatNumber(metrics.backlinks)}
            change={8}
            icon={LinkIcon}
          />
        </div>

        {/* Additional Metrics */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Domain Authority</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{metrics.domainAuthority}</div>
              <p className="text-sm text-muted-foreground mt-2">Out of 100</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Technical Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-green-600">
                {metrics.technicalScore}
              </div>
              <p className="text-sm text-muted-foreground mt-2">Excellent</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Top 10 Rankings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{metrics.topTenKeywords}</div>
              <p className="text-sm text-muted-foreground mt-2">
                {((metrics.topTenKeywords / metrics.totalKeywords) * 100).toFixed(1)}% of total
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-4 md:grid-cols-2">
          <LineChart
            title="Average Ranking Trend"
            data={mockRankingTrend}
            dataKeys={[{ key: 'rank', color: '#3b82f6', name: 'Average Rank' }]}
            xAxisKey="date"
          />
          <BarChart
            title="Organic Traffic"
            data={mockTrafficData}
            dataKeys={[{ key: 'traffic', color: '#10b981', name: 'Visitors' }]}
            xAxisKey="date"
          />
        </div>
      </div>
    </DashboardLayout>
  )
}
