'use client'

import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { ContentAnalysisInterface } from '@/src/components/content/ContentAnalysisInterface'

export default function ContentAnalysisPage() {
  // Demo project ID - in production this would come from route params or context
  const projectId = 'demo-project'

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Content Analysis</h1>
          <p className="text-muted-foreground">
            Analyze your content for SEO, readability, and engagement
          </p>
        </div>

        <ContentAnalysisInterface
          projectId={projectId}
          autoRefresh={false}
        />
      </div>
    </DashboardLayout>
  )
}