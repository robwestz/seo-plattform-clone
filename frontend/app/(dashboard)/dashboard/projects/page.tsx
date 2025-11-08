'use client'

import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { ProjectCard } from '@/components/seo/project-card'
import { Plus } from 'lucide-react'
import type { Project } from '@/types'

// Mock data - replace with real API calls
const mockProjects: Project[] = [
  {
    id: '1',
    name: 'Main Website',
    domain: 'example.com',
    targetCountry: 'US',
    targetLanguage: 'en',
    keywords: ['seo', 'marketing', 'analytics'],
    competitors: ['competitor1.com', 'competitor2.com'],
    status: 'active',
    lastRankCheck: '2025-11-07T10:00:00Z',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-11-07T10:00:00Z',
  },
  {
    id: '2',
    name: 'E-commerce Store',
    domain: 'shop.example.com',
    targetCountry: 'US',
    targetLanguage: 'en',
    keywords: ['ecommerce', 'online store', 'shopping'],
    competitors: ['amazon.com'],
    status: 'active',
    lastRankCheck: '2025-11-07T09:00:00Z',
    createdAt: '2025-02-15T00:00:00Z',
    updatedAt: '2025-11-07T09:00:00Z',
  },
  {
    id: '3',
    name: 'Blog',
    domain: 'blog.example.com',
    targetCountry: 'US',
    targetLanguage: 'en',
    keywords: ['content marketing', 'blogging'],
    competitors: [],
    status: 'paused',
    createdAt: '2025-03-20T00:00:00Z',
    updatedAt: '2025-10-01T00:00:00Z',
  },
]

export default function ProjectsPage() {
  const [projects] = useState<Project[]>(mockProjects)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Projects</h1>
            <p className="text-muted-foreground">
              Manage your SEO projects and websites
            </p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}
