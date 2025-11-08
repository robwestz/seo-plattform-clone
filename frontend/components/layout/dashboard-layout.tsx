'use client'

import { Sidebar } from './sidebar'
import { Header } from './header'
import { Breadcrumbs } from './breadcrumbs'
import { useUiStore } from '@/lib/store/ui-store'
import { cn } from '@/lib/utils'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { sidebarOpen } = useUiStore()

  return (
    <div className="relative min-h-screen">
      <Sidebar />
      <div
        className={cn(
          'min-h-screen transition-all duration-200',
          sidebarOpen ? 'lg:pl-64' : 'lg:pl-0'
        )}
      >
        <Header />
        <main className="p-4 lg:p-6">
          <div className="mb-4">
            <Breadcrumbs />
          </div>
          {children}
        </main>
      </div>
    </div>
  )
}
