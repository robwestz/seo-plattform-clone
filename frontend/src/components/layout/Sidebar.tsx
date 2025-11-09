import React from 'react';
import {
  Home,
  TrendingUp,
  Search,
  Users,
  Link as LinkIcon,
  FileText,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Layers,
  Target,
  Zap,
} from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { Badge } from '../ui/Badge';
import { Tooltip } from '../ui/Tooltip';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href: string;
  badge?: number | string;
  active?: boolean;
  subItems?: NavItem[];
}

export const Sidebar: React.FC = () => {
  const { sidebarOpen, sidebarCollapsed, toggleSidebarCollapsed, setSidebarOpen } = useUIStore();

  const navItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <Home className="h-5 w-5" />,
      href: '/dashboard',
      active: true,
    },
    {
      id: 'rankings',
      label: 'Rankings',
      icon: <TrendingUp className="h-5 w-5" />,
      href: '/rankings',
      badge: 12,
    },
    {
      id: 'keywords',
      label: 'Keywords',
      icon: <Search className="h-5 w-5" />,
      href: '/keywords',
      badge: '2.4K',
    },
    {
      id: 'competitors',
      label: 'Competitors',
      icon: <Users className="h-5 w-5" />,
      href: '/competitors',
      badge: 5,
    },
    {
      id: 'backlinks',
      label: 'Backlinks',
      icon: <LinkIcon className="h-5 w-5" />,
      href: '/backlinks',
    },
    {
      id: 'content',
      label: 'Content',
      icon: <FileText className="h-5 w-5" />,
      href: '/content',
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: <BarChart3 className="h-5 w-5" />,
      href: '/analytics',
      subItems: [
        {
          id: 'traffic',
          label: 'Traffic',
          icon: <Target className="h-4 w-4" />,
          href: '/analytics/traffic',
        },
        {
          id: 'conversions',
          label: 'Conversions',
          icon: <Zap className="h-4 w-4" />,
          href: '/analytics/conversions',
        },
      ],
    },
    {
      id: 'integrations',
      label: 'Integrations',
      icon: <Layers className="h-5 w-5" />,
      href: '/integrations',
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings className="h-5 w-5" />,
      href: '/settings',
    },
  ];

  const NavItemComponent: React.FC<{ item: NavItem; depth?: number }> = ({ item, depth = 0 }) => {
    const [isExpanded, setIsExpanded] = React.useState(false);

    const handleClick = (e: React.MouseEvent) => {
      if (item.subItems) {
        e.preventDefault();
        setIsExpanded(!isExpanded);
      }
    };

    const itemContent = (
      <a
        href={item.href}
        onClick={handleClick}
        className={`
          flex items-center gap-3 px-3 py-2 rounded-lg transition-all
          ${depth > 0 ? 'ml-6' : ''}
          ${
            item.active
              ? 'bg-blue-50 text-blue-700 font-medium'
              : 'text-gray-700 hover:bg-gray-100'
          }
          ${sidebarCollapsed ? 'justify-center' : ''}
        `}
      >
        <span className="flex-shrink-0">{item.icon}</span>

        {!sidebarCollapsed && (
          <>
            <span className="flex-1 text-sm">{item.label}</span>
            {item.badge && (
              <Badge variant={item.active ? 'primary' : 'default'} size="sm">
                {item.badge}
              </Badge>
            )}
          </>
        )}
      </a>
    );

    return (
      <div>
        {sidebarCollapsed ? (
          <Tooltip content={item.label} placement="right">
            {itemContent}
          </Tooltip>
        ) : (
          itemContent
        )}

        {item.subItems && isExpanded && !sidebarCollapsed && (
          <div className="mt-1 space-y-1">
            {item.subItems.map((subItem) => (
              <NavItemComponent key={subItem.id} item={subItem} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-20 h-screen bg-white border-r border-gray-200 pt-16 transition-all duration-300
          ${sidebarCollapsed ? 'w-16' : 'w-64'}
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
            {navItems.map((item) => (
              <NavItemComponent key={item.id} item={item} />
            ))}
          </nav>

          {/* Collapse Toggle */}
          <div className="hidden lg:flex items-center justify-center p-4 border-t border-gray-200">
            <button
              onClick={toggleSidebarCollapsed}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {sidebarCollapsed ? (
                <ChevronRight className="h-5 w-5 text-gray-700" />
              ) : (
                <ChevronLeft className="h-5 w-5 text-gray-700" />
              )}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
