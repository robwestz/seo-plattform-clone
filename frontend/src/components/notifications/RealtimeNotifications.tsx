import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  X,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Info,
  ExternalLink,
  Trash2,
} from 'lucide-react';
import { useRealtimeNotifications } from '../../hooks/useWebSocket';
import { AlertEvent } from '../../services/websocket/WebSocketService';

interface RealtimeNotificationsProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  maxNotifications?: number;
  autoHideDuration?: number;
}

export const RealtimeNotifications: React.FC<RealtimeNotificationsProps> = ({
  position = 'top-right',
  maxNotifications = 5,
  autoHideDuration,
}) => {
  const { notifications, unreadCount, markAsRead, clearNotifications, removeNotification } =
    useRealtimeNotifications();
  const [showPanel, setShowPanel] = useState(false);
  const [visibleNotifications, setVisibleNotifications] = useState<Set<string>>(new Set());

  // Get position classes
  const getPositionClasses = () => {
    switch (position) {
      case 'top-right':
        return 'top-4 right-4';
      case 'top-left':
        return 'top-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      default:
        return 'top-4 right-4';
    }
  };

  // Get severity icon
  const getSeverityIcon = (severity: 'info' | 'warning' | 'critical') => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'info':
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  // Get severity colors
  const getSeverityColors = (severity: 'info' | 'warning' | 'critical') => {
    switch (severity) {
      case 'critical':
        return 'bg-red-50 border-red-200 text-red-900';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-900';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-900';
    }
  };

  // Handle notification click
  const handleNotificationClick = () => {
    setShowPanel(!showPanel);
    if (!showPanel && unreadCount > 0) {
      markAsRead();
    }
  };

  // Handle notification dismiss
  const handleDismiss = (alertId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    removeNotification(alertId);
    setVisibleNotifications((prev) => {
      const next = new Set(prev);
      next.delete(alertId);
      return next;
    });
  };

  // Auto-hide notifications
  React.useEffect(() => {
    if (autoHideDuration && notifications.length > 0) {
      const latest = notifications[0];
      if (!visibleNotifications.has(latest.alertId)) {
        setVisibleNotifications((prev) => new Set(prev).add(latest.alertId));

        const timer = setTimeout(() => {
          setVisibleNotifications((prev) => {
            const next = new Set(prev);
            next.delete(latest.alertId);
            return next;
          });
        }, autoHideDuration);

        return () => clearTimeout(timer);
      }
    }
  }, [notifications, autoHideDuration, visibleNotifications]);

  // Visible notifications for toasts
  const toastNotifications = notifications
    .filter((n) => visibleNotifications.has(n.alertId))
    .slice(0, maxNotifications);

  return (
    <>
      {/* Notification Bell */}
      <div className="fixed z-50" style={{ top: '1rem', right: '1rem' }}>
        <button
          onClick={handleNotificationClick}
          className="relative p-3 bg-white rounded-full shadow-lg hover:shadow-xl transition-shadow border border-gray-200"
        >
          <Bell className="h-6 w-6 text-gray-700" />
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </motion.span>
          )}
        </button>
      </div>

      {/* Notification Panel */}
      <AnimatePresence>
        {showPanel && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl z-40 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
              <div className="flex items-center gap-2">
                {notifications.length > 0 && (
                  <button
                    onClick={clearNotifications}
                    className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
                  >
                    <Trash2 className="h-4 w-4" />
                    Clear all
                  </button>
                )}
                <button
                  onClick={() => setShowPanel(false)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="h-5 w-5 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Notification List */}
            <div className="flex-1 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <Bell className="h-16 w-16 mb-4 text-gray-300" />
                  <p className="text-sm">No notifications</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {notifications.map((notification) => (
                    <motion.div
                      key={notification.alertId}
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: 100 }}
                      className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">{getSeverityIcon(notification.severity)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="text-sm font-semibold text-gray-900 truncate">
                              {notification.title}
                            </h4>
                            <button
                              onClick={(e) => handleDismiss(notification.alertId, e)}
                              className="flex-shrink-0 p-1 hover:bg-gray-200 rounded"
                            >
                              <X className="h-4 w-4 text-gray-400" />
                            </button>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                          <div className="flex items-center justify-between">
                            <span
                              className={`text-xs px-2 py-1 rounded-full ${
                                notification.severity === 'critical'
                                  ? 'bg-red-100 text-red-700'
                                  : notification.severity === 'warning'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-blue-100 text-blue-700'
                              }`}
                            >
                              {notification.severity}
                            </span>
                            <span className="text-xs text-gray-400">
                              {new Date().toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast Notifications */}
      <div className={`fixed ${getPositionClasses()} z-50 space-y-3 pointer-events-none`}>
        <AnimatePresence>
          {toastNotifications.map((notification, index) => (
            <motion.div
              key={notification.alertId}
              initial={{ opacity: 0, y: -50, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.8 }}
              transition={{ delay: index * 0.1 }}
              className={`pointer-events-auto w-96 rounded-lg shadow-xl border-l-4 p-4 ${getSeverityColors(
                notification.severity
              )}`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">{getSeverityIcon(notification.severity)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-semibold truncate">{notification.title}</h4>
                    <button
                      onClick={(e) => handleDismiss(notification.alertId, e)}
                      className="flex-shrink-0 p-1 hover:bg-white/50 rounded transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-sm mb-2">{notification.message}</p>
                  {notification.data?.url && (
                    <a
                      href={notification.data.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs flex items-center gap-1 hover:underline"
                    >
                      View details <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </>
  );
};

export default RealtimeNotifications;
