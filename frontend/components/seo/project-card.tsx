'use client'

import Link from 'next/link'
import { MoreVertical, Globe, Calendar, Activity } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Project } from '@/types'
import { formatDate } from '@/lib/utils'

interface ProjectCardProps {
  project: Project
  onEdit?: (project: Project) => void
  onDelete?: (project: Project) => void
  onArchive?: (project: Project) => void
}

export function ProjectCard({
  project,
  onEdit,
  onDelete,
  onArchive,
}: ProjectCardProps) {
  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'bg-green-500',
      paused: 'bg-yellow-500',
      archived: 'bg-gray-500',
    }
    return (
      <Badge className={variants[status as keyof typeof variants] || 'bg-gray-500'}>
        {status}
      </Badge>
    )
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <Link
            href={`/dashboard/projects/${project.id}`}
            className="text-lg font-semibold hover:underline"
          >
            {project.name}
          </Link>
          {getStatusBadge(project.status)}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit?.(project)}>
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onArchive?.(project)}>
              Archive
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete?.(project)}
              className="text-destructive"
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 text-sm">
          <div className="flex items-center text-muted-foreground">
            <Globe className="mr-2 h-4 w-4" />
            <span>{project.domain}</span>
          </div>
          <div className="flex items-center text-muted-foreground">
            <Activity className="mr-2 h-4 w-4" />
            <span>{project.keywords.length} keywords tracked</span>
          </div>
          <div className="flex items-center text-muted-foreground">
            <Calendar className="mr-2 h-4 w-4" />
            <span>Created {formatDate(project.createdAt)}</span>
          </div>
          {project.lastRankCheck && (
            <div className="text-xs text-muted-foreground">
              Last rank check: {formatDate(project.lastRankCheck)}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
