'use client'

import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { RankingDashboard } from '@/src/components/dashboards/RankingDashboard'

export default function RankingsPage() {
  // Demo project ID - in production this would come from route params or context
  const projectId = 'demo-project'

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Ranking Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor your keyword rankings in real-time
          </p>
        </div>

        <RankingDashboard
          projectId={projectId}
          autoRefresh={true}
          refreshInterval={60000}
        />
      </div>
    </DashboardLayout>
  )
}