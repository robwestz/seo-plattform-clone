import React, { useEffect } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Breadcrumbs } from './Breadcrumbs';
import { MobileMenu } from './MobileMenu';
import { ToastContainer } from '../ui/Toast';
import { RealtimeNotifications } from '../notifications/RealtimeNotifications';
import { useUIStore } from '../../stores/uiStore';

export interface AppLayoutProps {
  children: React.ReactNode;
  showSidebar?: boolean;
  showHeader?: boolean;
  showBreadcrumbs?: boolean;
  maxWidth?: 'full' | '7xl' | '6xl' | '5xl' | '4xl';
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  showSidebar = true,
  showHeader = true,
  showBreadcrumbs = true,
  maxWidth = '7xl',
}) => {
  const { sidebarOpen, sidebarCollapsed, theme } = useUIStore();

  // Apply theme on mount and when it changes
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      // Auto mode - use system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  }, [theme]);

  const maxWidthStyles = {
    full: 'max-w-full',
    '7xl': 'max-w-7xl',
    '6xl': 'max-w-6xl',
    '5xl': 'max-w-5xl',
    '4xl': 'max-w-4xl',
  };

  // Calculate sidebar width
  const sidebarWidth = sidebarCollapsed ? 'w-16' : 'w-64';
  const sidebarMargin = showSidebar && sidebarOpen ? sidebarWidth : 'ml-0';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      {showHeader && <Header />}

      {/* Sidebar */}
      {showSidebar && <Sidebar />}

      {/* Mobile Menu */}
      <MobileMenu />

      {/* Main Content */}
      <div
        className={`
          transition-all duration-300
          ${sidebarMargin}
          ${showHeader ? 'pt-16' : ''}
        `}
      >
        <main className="min-h-screen">
          {/* Breadcrumbs */}
          {showBreadcrumbs && (
            <div className="bg-white border-b border-gray-200">
              <div className={`${maxWidthStyles[maxWidth]} mx-auto px-4 sm:px-6 lg:px-8 py-3`}>
                <Breadcrumbs />
              </div>
            </div>
          )}

          {/* Page Content */}
          <div className={`${maxWidthStyles[maxWidth]} mx-auto px-4 sm:px-6 lg:px-8 py-6`}>
            {children}
          </div>
        </main>
      </div>

      {/* Toast Notifications */}
      <ToastContainer />

      {/* Real-time Notifications */}
      <RealtimeNotifications />
    </div>
  );
};

export default AppLayout;
