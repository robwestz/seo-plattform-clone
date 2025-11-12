'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  FolderKanban,
  Search,
  TrendingUp,
  FileSearch,
  Link as LinkIcon,
  Settings,
  ChevronLeft,
  Users,
  FileText,
  Sparkles,
  BarChart3,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useUiStore } from '@/lib/store/ui-store'

const menuItems = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Projects',
    href: '/dashboard/projects',
    icon: FolderKanban,
  },
  {
    title: 'Keyword Research',
    href: '/dashboard/keywords/research',
    icon: Search,
  },
  {
    title: 'Advanced Research',
    href: '/dashboard/keyword-research-advanced',
    icon: Sparkles,
  },
  {
    title: 'Rank Tracking',
    href: '/dashboard/keywords/tracking',
    icon: TrendingUp,
  },
  {
    title: 'Rankings Dashboard',
    href: '/dashboard/rankings',
    icon: BarChart3,
  },
  {
    title: 'SEO Audit',
    href: '/dashboard/audit',
    icon: FileSearch,
  },
  {
    title: 'Content Analysis',
    href: '/dashboard/content-analysis',
    icon: FileText,
  },
  {
    title: 'Competitor Analysis',
    href: '/dashboard/competitor-analysis',
    icon: Users,
  },
  {
    title: 'Backlinks',
    href: '/dashboard/backlinks',
    icon: LinkIcon,
  },
  {
    title: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const { sidebarOpen, toggleSidebar } = useUiStore()

  return (
    <>
      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-50 h-screen w-64 transform border-r bg-card transition-transform duration-200 ease-in-out lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between border-b px-6">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-primary" />
              <span className="text-lg font-bold">SEO Intel</span>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="lg:hidden"
              aria-label="Close sidebar"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
            {menuItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center space-x-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.title}</span>
                </Link>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="border-t p-4">
            <div className="rounded-lg bg-muted p-3 text-xs">
              <p className="font-semibold">Pro Plan</p>
              <p className="text-muted-foreground">500 keywords tracked</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
