'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { AuditScore } from '@/types'
import { cn } from '@/lib/utils'

interface AuditScoreProps {
  score: AuditScore
}

export function AuditScoreCard({ score }: AuditScoreProps) {
  const getScoreColor = (value: number) => {
    if (value >= 90) return 'text-green-600'
    if (value >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreBg = (value: number) => {
    if (value >= 90) return 'bg-green-100 dark:bg-green-900/20'
    if (value >= 70) return 'bg-yellow-100 dark:bg-yellow-900/20'
    return 'bg-red-100 dark:bg-red-900/20'
  }

  const scores = [
    { label: 'Overall', value: score.overall },
    { label: 'Performance', value: score.performance },
    { label: 'SEO', value: score.seo },
    { label: 'Accessibility', value: score.accessibility },
    { label: 'Best Practices', value: score.bestPractices },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Audit Scores</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {scores.map((item) => (
            <div
              key={item.label}
              className={cn(
                'rounded-lg p-4 text-center',
                getScoreBg(item.value)
              )}
            >
              <p className="text-sm font-medium text-muted-foreground">
                {item.label}
              </p>
              <p className={cn('mt-2 text-3xl font-bold', getScoreColor(item.value))}>
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
