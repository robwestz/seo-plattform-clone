'use client'

import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { KeywordTable } from '@/components/seo/keyword-table'
import { RankingChart } from '@/components/seo/ranking-chart'
import { AuditScoreCard } from '@/components/seo/audit-score'
import { Play, Pause, Settings } from 'lucide-react'
import type { Keyword, RankingData, AuditScore } from '@/types'

// Mock data
const mockKeywords: Keyword[] = [
  {
    id: '1',
    keyword: 'seo tools',
    searchVolume: 12000,
    difficulty: 65,
    cpc: 4.5,
    currentRank: 8,
    previousRank: 10,
    url: 'https://example.com/seo-tools',
    updatedAt: '2025-11-07T10:00:00Z',
  },
  {
    id: '2',
    keyword: 'keyword research',
    searchVolume: 8500,
    difficulty: 45,
    cpc: 3.2,
    currentRank: 5,
    previousRank: 6,
    url: 'https://example.com/keyword-research',
    updatedAt: '2025-11-07T10:00:00Z',
  },
]

const mockRankingData: RankingData[] = [
  { date: '2025-10-01', rank: 12, url: 'example.com', keyword: 'seo tools' },
  { date: '2025-10-08', rank: 11, url: 'example.com', keyword: 'seo tools' },
  { date: '2025-10-15', rank: 10, url: 'example.com', keyword: 'seo tools' },
  { date: '2025-10-22', rank: 9, url: 'example.com', keyword: 'seo tools' },
  { date: '2025-10-29', rank: 8, url: 'example.com', keyword: 'seo tools' },
  { date: '2025-11-05', rank: 8, url: 'example.com', keyword: 'seo tools' },
]

const mockAuditScore: AuditScore = {
  overall: 88,
  performance: 92,
  seo: 95,
  accessibility: 87,
  bestPractices: 83,
}

export default function ProjectDetailPage({
  params,
}: {
  params: { id: string }
}) {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-3xl font-bold">Main Website</h1>
              <Badge className="bg-green-500">Active</Badge>
            </div>
            <p className="text-muted-foreground">example.com</p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline">
              <Pause className="mr-2 h-4 w-4" />
              Pause
            </Button>
            <Button variant="outline">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Total Keywords
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">156</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Avg. Rank</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12.4</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Top 10</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">42</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Visibility</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">68%</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="keywords">Keywords</TabsTrigger>
            <TabsTrigger value="audit">Audit</TabsTrigger>
            <TabsTrigger value="backlinks">Backlinks</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <RankingChart data={mockRankingData} />
            <AuditScoreCard score={mockAuditScore} />
          </TabsContent>

          <TabsContent value="keywords">
            <KeywordTable keywords={mockKeywords} />
          </TabsContent>

          <TabsContent value="audit">
            <AuditScoreCard score={mockAuditScore} />
          </TabsContent>

          <TabsContent value="backlinks">
            <Card>
              <CardHeader>
                <CardTitle>Backlinks</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Backlink data will be displayed here
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
