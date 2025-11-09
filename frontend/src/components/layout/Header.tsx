import React from 'react';
import { Menu, Search, Bell, Settings, User, LogOut, HelpCircle, Moon, Sun } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { useAuthStore } from '../../stores/authStore';
import { useProjectStore } from '../../stores/projectStore';
import { Dropdown, DropdownItem } from '../ui/Dropdown';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';

export const Header: React.FC = () => {
  const { toggleSidebar, theme, setTheme } = useUIStore();
  const { user, logout } = useAuthStore();
  const { selectedProject, projects, selectProject } = useProjectStore();

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  // User dropdown items
  const userMenuItems: DropdownItem[] = [
    {
      id: 'profile',
      label: 'Profile',
      icon: <User className="h-4 w-4" />,
      onClick: () => console.log('Profile clicked'),
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings className="h-4 w-4" />,
      onClick: () => console.log('Settings clicked'),
    },
    {
      id: 'help',
      label: 'Help & Support',
      icon: <HelpCircle className="h-4 w-4" />,
      onClick: () => console.log('Help clicked'),
    },
    {
      id: 'divider',
      label: '',
      divider: true,
    },
    {
      id: 'logout',
      label: 'Logout',
      icon: <LogOut className="h-4 w-4" />,
      onClick: handleLogout,
    },
  ];

  // Project dropdown items
  const projectMenuItems: DropdownItem[] = projects.map((project) => ({
    id: project.id,
    label: project.name,
    onClick: () => selectProject(project.id),
  }));

  return (
    <header className="fixed top-0 left-0 right-0 z-30 bg-white border-b border-gray-200 h-16">
      <div className="flex items-center justify-between h-full px-4 sm:px-6 lg:px-8">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          {/* Mobile Menu Toggle */}
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors lg:hidden"
            aria-label="Toggle menu"
          >
            <Menu className="h-6 w-6 text-gray-700" />
          </button>

          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">SEO</span>
            </div>
            <span className="hidden sm:block text-lg font-bold text-gray-900">
              SEO Intelligence
            </span>
          </div>

          {/* Project Selector */}
          {selectedProject && (
            <div className="hidden md:block">
              <Dropdown
                trigger={
                  <button className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors">
                    {selectedProject.favicon && (
                      <img
                        src={selectedProject.favicon}
                        alt=""
                        className="h-4 w-4 rounded"
                      />
                    )}
                    <span className="text-sm font-medium text-gray-900 max-w-32 truncate">
                      {selectedProject.name}
                    </span>
                  </button>
                }
                items={projectMenuItems}
                selectedId={selectedProject.id}
                placement="bottom-left"
              />
            </div>
          )}
        </div>

        {/* Center Section - Search */}
        <div className="hidden lg:block flex-1 max-w-lg mx-8">
          <Input
            type="search"
            placeholder="Search keywords, URLs, or pages..."
            leftIcon={<Search className="h-5 w-5" />}
            size="sm"
          />
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2">
          {/* Search Icon (Mobile) */}
          <button
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors lg:hidden"
            aria-label="Search"
          >
            <Search className="h-5 w-5 text-gray-700" />
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? (
              <Moon className="h-5 w-5 text-gray-700" />
            ) : (
              <Sun className="h-5 w-5 text-gray-700" />
            )}
          </button>

          {/* Notifications */}
          <button
            className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5 text-gray-700" />
            <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full" />
          </button>

          {/* Settings */}
          <button
            className="hidden sm:block p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Settings"
          >
            <Settings className="h-5 w-5 text-gray-700" />
          </button>

          {/* User Menu */}
          <Dropdown
            trigger={
              <button className="flex items-center gap-2 p-1 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="h-8 w-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-gray-900">{user?.name || 'User'}</p>
                  <p className="text-xs text-gray-500">
                    <Badge variant="primary" size="sm">
                      {user?.role || 'User'}
                    </Badge>
                  </p>
                </div>
              </button>
            }
            items={userMenuItems}
            placement="bottom-right"
          />
        </div>
      </div>
    </header>
  );
};

export default Header;
