import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Settings, User, LogOut } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { useAuthStore } from '../../stores/authStore';
import { Input } from '../ui/Input';
import { Divider } from '../ui/Divider';

export const MobileMenu: React.FC = () => {
  const { sidebarOpen, setSidebarOpen } = useUIStore();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  const menuItems = [
    {
      id: 'profile',
      label: 'Profile',
      icon: <User className="h-5 w-5" />,
      onClick: () => console.log('Profile'),
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings className="h-5 w-5" />,
      onClick: () => console.log('Settings'),
    },
    {
      id: 'logout',
      label: 'Logout',
      icon: <LogOut className="h-5 w-5" />,
      onClick: handleLogout,
    },
  ];

  return (
    <AnimatePresence>
      {sidebarOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          />

          {/* Menu Panel */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'tween', duration: 0.3 }}
            className="fixed top-0 left-0 bottom-0 z-50 w-80 bg-white shadow-2xl lg:hidden"
          >
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold">SEO</span>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">SEO Intelligence</h2>
                    <p className="text-xs text-gray-500">Platform</p>
                  </div>
                </div>

                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  aria-label="Close menu"
                >
                  <X className="h-6 w-6 text-gray-700" />
                </button>
              </div>

              {/* User Info */}
              <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-lg">
                      {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{user?.name || 'User'}</p>
                    <p className="text-xs text-gray-600 truncate">{user?.email || 'user@example.com'}</p>
                  </div>
                </div>
              </div>

              {/* Search */}
              <div className="p-4">
                <Input
                  type="search"
                  placeholder="Search..."
                  leftIcon={<Search className="h-5 w-5" />}
                  size="sm"
                />
              </div>

              <Divider spacing="none" />

              {/* Navigation - Scrollable */}
              <nav className="flex-1 overflow-y-auto p-4 space-y-1">
                {/* Navigation items would go here - same as Sidebar */}
                <div className="text-sm text-gray-500 text-center py-8">
                  Navigation items...
                </div>
              </nav>

              <Divider spacing="none" />

              {/* Quick Actions */}
              <div className="p-4 space-y-2">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      item.onClick();
                      if (item.id === 'logout') {
                        setSidebarOpen(false);
                      }
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <span>{item.icon}</span>
                    <span className="text-sm font-medium">{item.label}</span>
                  </button>
                ))}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-gray-200 bg-gray-50">
                <p className="text-xs text-gray-500 text-center">
                  © 2024 SEO Intelligence Platform
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default MobileMenu;
