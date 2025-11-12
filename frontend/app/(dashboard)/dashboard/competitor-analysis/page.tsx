'use client'

import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { CompetitorAnalysisDashboard } from '@/src/components/competitor/CompetitorAnalysisDashboard'

export default function CompetitorAnalysisPage() {
  // Demo project ID - in production this would come from route params or context
  const projectId = 'demo-project'
  const domain = 'example.com'

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Competitor Analysis</h1>
          <p className="text-muted-foreground">
            Analyze your competitors and discover opportunities
          </p>
        </div>

        <CompetitorAnalysisDashboard projectId={projectId} domain={domain} />
      </div>
    </DashboardLayout>
  )
}