'use client'

import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { BacklinkList } from '@/components/seo/backlink-list'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RefreshCw, TrendingUp, Link as LinkIcon } from 'lucide-react'
import type { Backlink } from '@/types'

const mockBacklinks: Backlink[] = [
  {
    id: '1',
    sourceUrl: 'https://techblog.com/article',
    sourceDomain: 'techblog.com',
    targetUrl: 'https://example.com',
    anchorText: 'best seo tools',
    doFollow: true,
    firstSeen: '2025-10-15T00:00:00Z',
    lastSeen: '2025-11-07T00:00:00Z',
    domainAuthority: 72,
    pageAuthority: 65,
  },
  {
    id: '2',
    sourceUrl: 'https://marketingpro.com/resources',
    sourceDomain: 'marketingpro.com',
    targetUrl: 'https://example.com',
    anchorText: 'SEO platform',
    doFollow: true,
    firstSeen: '2025-09-20T00:00:00Z',
    lastSeen: '2025-11-07T00:00:00Z',
    domainAuthority: 68,
    pageAuthority: 58,
  },
  {
    id: '3',
    sourceUrl: 'https://forum.example.org/thread',
    sourceDomain: 'forum.example.org',
    targetUrl: 'https://example.com',
    anchorText: 'click here',
    doFollow: false,
    firstSeen: '2025-11-01T00:00:00Z',
    lastSeen: '2025-11-07T00:00:00Z',
    domainAuthority: 45,
    pageAuthority: 42,
  },
]

export default function BacklinksPage() {
  const totalBacklinks = 8921
  const doFollowCount = 6234
  const avgDomainAuthority = 58

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Backlinks</h1>
            <p className="text-muted-foreground">
              Monitor your backlink profile and discover new opportunities
            </p>
          </div>
          <Button>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh Data
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Backlinks
              </CardTitle>
              <LinkIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalBacklinks.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground flex items-center mt-1">
                <TrendingUp className="mr-1 h-3 w-3 text-green-600" />
                <span className="text-green-600">+12%</span>
                <span className="ml-1">from last month</span>
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                DoFollow Links
              </CardTitle>
              <LinkIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{doFollowCount.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {((doFollowCount / totalBacklinks) * 100).toFixed(1)}% of total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Avg. Domain Authority
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgDomainAuthority}</div>
              <p className="text-xs text-muted-foreground mt-1">Out of 100</p>
            </CardContent>
          </Card>
        </div>

        <BacklinkList backlinks={mockBacklinks} />
      </div>
    </DashboardLayout>
  )
}
