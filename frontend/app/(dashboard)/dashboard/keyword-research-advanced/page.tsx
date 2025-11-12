'use client'

import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { KeywordResearchInterface } from '@/src/components/keyword/KeywordResearchInterface'

export default function AdvancedKeywordResearchPage() {
  // Demo project ID - in production this would come from route params or context
  const projectId = 'demo-project'

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Advanced Keyword Research</h1>
          <p className="text-muted-foreground">
            Discover keyword opportunities with AI-powered suggestions
          </p>
        </div>

        <KeywordResearchInterface
          projectId={projectId}
          onKeywordAdd={(keyword) => console.log('Added keyword:', keyword)}
        />
      </div>
    </DashboardLayout>
  )
}