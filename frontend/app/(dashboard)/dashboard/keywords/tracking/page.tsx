'use client'

import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { KeywordTable } from '@/components/seo/keyword-table'
import { RankingChart } from '@/components/seo/ranking-chart'
import { Button } from '@/components/ui/button'
import { Plus, RefreshCw } from 'lucide-react'
import type { Keyword, RankingData } from '@/types'

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
  {
    id: '3',
    keyword: 'backlink analysis',
    searchVolume: 6200,
    difficulty: 58,
    cpc: 4.8,
    currentRank: 15,
    previousRank: 14,
    url: 'https://example.com/backlinks',
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

export default function RankTrackingPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Rank Tracking</h1>
            <p className="text-muted-foreground">
              Monitor your keyword rankings over time
            </p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh Rankings
            </Button>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Keywords
            </Button>
          </div>
        </div>

        <RankingChart data={mockRankingData} title="Average Ranking Trend" />
        <KeywordTable keywords={mockKeywords} />
      </div>
    </DashboardLayout>
  )
}
