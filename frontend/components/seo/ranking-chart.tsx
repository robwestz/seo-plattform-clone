'use client'

import { LineChart } from '@/components/charts/line-chart'
import type { RankingData } from '@/types'

interface RankingChartProps {
  data: RankingData[]
  title?: string
}

export function RankingChart({ data, title = 'Ranking History' }: RankingChartProps) {
  const chartData = data.map((item) => ({
    date: new Date(item.date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }),
    rank: item.rank,
  }))

  return (
    <LineChart
      title={title}
      data={chartData}
      dataKeys={[{ key: 'rank', color: '#3b82f6', name: 'Rank Position' }]}
      xAxisKey="date"
      height={300}
    />
  )
}
