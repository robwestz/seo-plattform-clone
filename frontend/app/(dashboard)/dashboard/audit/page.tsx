'use client'

import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { AuditScoreCard } from '@/components/seo/audit-score'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, AlertCircle, AlertTriangle, Info } from 'lucide-react'
import type { AuditScore, AuditIssue } from '@/types'

const mockAuditScore: AuditScore = {
  overall: 88,
  performance: 92,
  seo: 95,
  accessibility: 87,
  bestPractices: 83,
}

const mockIssues: AuditIssue[] = [
  {
    id: '1',
    severity: 'critical',
    category: 'SEO',
    title: 'Missing meta descriptions',
    description: '15 pages are missing meta descriptions',
    affectedUrls: ['/page1', '/page2', '/page3'],
    impact: 'High - Affects click-through rates from search results',
    recommendation: 'Add unique meta descriptions to all pages',
  },
  {
    id: '2',
    severity: 'error',
    category: 'Performance',
    title: 'Large images not optimized',
    description: 'Several images exceed 500KB',
    affectedUrls: ['/blog/post1', '/products'],
    impact: 'Medium - Slows page load time',
    recommendation: 'Compress images and use WebP format',
  },
  {
    id: '3',
    severity: 'warning',
    category: 'Accessibility',
    title: 'Missing alt text on images',
    description: '8 images missing alt attributes',
    affectedUrls: ['/about', '/team'],
    impact: 'Medium - Affects screen reader users',
    recommendation: 'Add descriptive alt text to all images',
  },
]

export default function AuditPage() {
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="h-5 w-5 text-red-600" />
      case 'error':
        return <AlertCircle className="h-5 w-5 text-orange-600" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />
      default:
        return <Info className="h-5 w-5 text-blue-600" />
    }
  }

  const getSeverityBadge = (severity: string) => {
    const variants = {
      critical: 'bg-red-500',
      error: 'bg-orange-500',
      warning: 'bg-yellow-500',
      info: 'bg-blue-500',
    }
    return (
      <Badge className={variants[severity as keyof typeof variants]}>
        {severity}
      </Badge>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">SEO Audit</h1>
            <p className="text-muted-foreground">
              Technical SEO analysis and recommendations
            </p>
          </div>
          <Button>
            <RefreshCw className="mr-2 h-4 w-4" />
            Run New Audit
          </Button>
        </div>

        <AuditScoreCard score={mockAuditScore} />

        <Card>
          <CardHeader>
            <CardTitle>Issues Found ({mockIssues.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockIssues.map((issue) => (
                <div
                  key={issue.id}
                  className="rounded-lg border p-4 space-y-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      {getSeverityIcon(issue.severity)}
                      <div>
                        <h3 className="font-semibold">{issue.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {issue.description}
                        </p>
                      </div>
                    </div>
                    {getSeverityBadge(issue.severity)}
                  </div>

                  <div className="pl-8 space-y-2">
                    <div>
                      <p className="text-sm font-medium">Category</p>
                      <Badge variant="outline">{issue.category}</Badge>
                    </div>

                    <div>
                      <p className="text-sm font-medium">Impact</p>
                      <p className="text-sm text-muted-foreground">
                        {issue.impact}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm font-medium">Recommendation</p>
                      <p className="text-sm text-muted-foreground">
                        {issue.recommendation}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm font-medium">
                        Affected URLs ({issue.affectedUrls.length})
                      </p>
                      <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                        {issue.affectedUrls.slice(0, 3).map((url, i) => (
                          <li key={i} className="font-mono">
                            {url}
                          </li>
                        ))}
                        {issue.affectedUrls.length > 3 && (
                          <li className="text-primary">
                            +{issue.affectedUrls.length - 3} more
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
