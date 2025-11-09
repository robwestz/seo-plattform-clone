import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Notification interface
export interface Notification {
  id: string;
  type: 'ranking_change' | 'keyword_discovery' | 'competitor_alert' | 'backlink_change' | 'sync_status' | 'system';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  data?: any;
  isRead: boolean;
  isArchived: boolean;
  actionUrl?: string;
  actionLabel?: string;
  createdAt: Date;
  readAt?: Date;
}

// Notification preferences
export interface NotificationPreferences {
  enabled: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  desktopNotifications: boolean;
  types: {
    rankingChange: boolean;
    keywordDiscovery: boolean;
    competitorAlert: boolean;
    backlinkChange: boolean;
    syncStatus: boolean;
    system: boolean;
  };
  severities: {
    info: boolean;
    warning: boolean;
    critical: boolean;
  };
  quietHours: {
    enabled: boolean;
    start: string; // HH:mm format
    end: string; // HH:mm format
  };
}

// Notification filters
export interface NotificationFilters {
  types?: string[];
  severities?: string[];
  isRead?: boolean;
  isArchived?: boolean;
  dateRange?: { start: Date; end: Date };
}

// Notification state interface
export interface NotificationState {
  // State
  notifications: Notification[];
  filteredNotifications: Notification[];
  unreadCount: number;
  filters: NotificationFilters;
  preferences: NotificationPreferences;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchNotifications: () => Promise<void>;
  addNotification: (notification: Omit<Notification, 'id' | 'isRead' | 'isArchived' | 'createdAt'>) => void;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  archiveNotification: (notificationId: string) => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  clearAll: () => Promise<void>;
  setFilters: (filters: NotificationFilters) => void;
  applyFilters: () => void;
  updatePreferences: (preferences: Partial<NotificationPreferences>) => Promise<void>;
  requestPermission: () => Promise<boolean>;
  showDesktopNotification: (notification: Notification) => void;
  clearError: () => void;
  setLoading: (isLoading: boolean) => void;
}

// Default preferences
const defaultPreferences: NotificationPreferences = {
  enabled: true,
  emailNotifications: true,
  pushNotifications: true,
  desktopNotifications: false,
  types: {
    rankingChange: true,
    keywordDiscovery: true,
    competitorAlert: true,
    backlinkChange: true,
    syncStatus: true,
    system: true,
  },
  severities: {
    info: true,
    warning: true,
    critical: true,
  },
  quietHours: {
    enabled: false,
    start: '22:00',
    end: '08:00',
  },
};

// Create notification store
export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      // Initial state
      notifications: [],
      filteredNotifications: [],
      unreadCount: 0,
      filters: {},
      preferences: defaultPreferences,
      isLoading: false,
      error: null,

      // Fetch notifications
      fetchNotifications: async () => {
        set({ isLoading: true, error: null });

        try {
          const response = await fetch('/api/notifications', {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('auth-token')}`,
            },
          });

          if (!response.ok) {
            throw new Error('Failed to fetch notifications');
          }

          const notifications = await response.json();

          set({
            notifications,
            unreadCount: notifications.filter((n: Notification) => !n.isRead).length,
            isLoading: false,
            error: null,
          });

          get().applyFilters();
        } catch (error) {
          set({
            error: (error as Error).message,
            isLoading: false,
          });
          throw error;
        }
      },

      // Add notification
      addNotification: (notificationData) => {
        const notification: Notification = {
          id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          isRead: false,
          isArchived: false,
          createdAt: new Date(),
          ...notificationData,
        };

        set((state) => ({
          notifications: [notification, ...state.notifications],
          unreadCount: state.unreadCount + 1,
        }));

        get().applyFilters();

        // Show desktop notification if enabled
        const { preferences } = get();
        if (
          preferences.desktopNotifications &&
          preferences.types[notificationData.type as keyof typeof preferences.types] &&
          preferences.severities[notificationData.severity]
        ) {
          get().showDesktopNotification(notification);
        }
      },

      // Mark as read
      markAsRead: async (notificationId: string) => {
        try {
          const response = await fetch(`/api/notifications/${notificationId}/read`, {
            method: 'PATCH',
            headers: {
              Authorization: `Bearer ${localStorage.getItem('auth-token')}`,
            },
          });

          if (!response.ok) {
            throw new Error('Failed to mark notification as read');
          }

          set((state) => {
            const notification = state.notifications.find((n) => n.id === notificationId);
            const wasUnread = notification && !notification.isRead;

            return {
              notifications: state.notifications.map((n) =>
                n.id === notificationId ? { ...n, isRead: true, readAt: new Date() } : n
              ),
              unreadCount: wasUnread ? state.unreadCount - 1 : state.unreadCount,
            };
          });

          get().applyFilters();
        } catch (error) {
          set({ error: (error as Error).message });
          throw error;
        }
      },

      // Mark all as read
      markAllAsRead: async () => {
        try {
          const response = await fetch('/api/notifications/read-all', {
            method: 'PATCH',
            headers: {
              Authorization: `Bearer ${localStorage.getItem('auth-token')}`,
            },
          });

          if (!response.ok) {
            throw new Error('Failed to mark all notifications as read');
          }

          set((state) => ({
            notifications: state.notifications.map((n) => ({
              ...n,
              isRead: true,
              readAt: n.readAt || new Date(),
            })),
            unreadCount: 0,
          }));

          get().applyFilters();
        } catch (error) {
          set({ error: (error as Error).message });
          throw error;
        }
      },

      // Archive notification
      archiveNotification: async (notificationId: string) => {
        try {
          const response = await fetch(`/api/notifications/${notificationId}/archive`, {
            method: 'PATCH',
            headers: {
              Authorization: `Bearer ${localStorage.getItem('auth-token')}`,
            },
          });

          if (!response.ok) {
            throw new Error('Failed to archive notification');
          }

          set((state) => ({
            notifications: state.notifications.map((n) =>
              n.id === notificationId ? { ...n, isArchived: true } : n
            ),
          }));

          get().applyFilters();
        } catch (error) {
          set({ error: (error as Error).message });
          throw error;
        }
      },

      // Delete notification
      deleteNotification: async (notificationId: string) => {
        try {
          const response = await fetch(`/api/notifications/${notificationId}`, {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${localStorage.getItem('auth-token')}`,
            },
          });

          if (!response.ok) {
            throw new Error('Failed to delete notification');
          }

          set((state) => {
            const notification = state.notifications.find((n) => n.id === notificationId);
            const wasUnread = notification && !notification.isRead;

            return {
              notifications: state.notifications.filter((n) => n.id !== notificationId),
              unreadCount: wasUnread ? state.unreadCount - 1 : state.unreadCount,
            };
          });

          get().applyFilters();
        } catch (error) {
          set({ error: (error as Error).message });
          throw error;
        }
      },

      // Clear all notifications
      clearAll: async () => {
        try {
          const response = await fetch('/api/notifications/clear', {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${localStorage.getItem('auth-token')}`,
            },
          });

          if (!response.ok) {
            throw new Error('Failed to clear notifications');
          }

          set({
            notifications: [],
            filteredNotifications: [],
            unreadCount: 0,
          });
        } catch (error) {
          set({ error: (error as Error).message });
          throw error;
        }
      },

      // Set filters
      setFilters: (filters: NotificationFilters) => {
        set({ filters });
        get().applyFilters();
      },

      // Apply filters
      applyFilters: () => {
        const { notifications, filters } = get();

        let filtered = [...notifications];

        // Filter by type
        if (filters.types && filters.types.length > 0) {
          filtered = filtered.filter((n) => filters.types!.includes(n.type));
        }

        // Filter by severity
        if (filters.severities && filters.severities.length > 0) {
          filtered = filtered.filter((n) => filters.severities!.includes(n.severity));
        }

        // Filter by read status
        if (filters.isRead !== undefined) {
          filtered = filtered.filter((n) => n.isRead === filters.isRead);
        }

        // Filter by archived status
        if (filters.isArchived !== undefined) {
          filtered = filtered.filter((n) => n.isArchived === filters.isArchived);
        }

        // Filter by date range
        if (filters.dateRange) {
          filtered = filtered.filter(
            (n) =>
              new Date(n.createdAt) >= filters.dateRange!.start &&
              new Date(n.createdAt) <= filters.dateRange!.end
          );
        }

        set({ filteredNotifications: filtered });
      },

      // Update preferences
      updatePreferences: async (preferences: Partial<NotificationPreferences>) => {
        set((state) => ({
          preferences: { ...state.preferences, ...preferences },
        }));

        // Persist to API
        try {
          await fetch('/api/users/notification-preferences', {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${localStorage.getItem('auth-token')}`,
            },
            body: JSON.stringify(preferences),
          });
        } catch (error) {
          console.error('Failed to update notification preferences:', error);
        }
      },

      // Request desktop notification permission
      requestPermission: async () => {
        if (!('Notification' in window)) {
          return false;
        }

        const permission = await Notification.requestPermission();
        const granted = permission === 'granted';

        if (granted) {
          get().updatePreferences({ desktopNotifications: true });
        }

        return granted;
      },

      // Show desktop notification
      showDesktopNotification: (notification: Notification) => {
        if (!('Notification' in window) || Notification.permission !== 'granted') {
          return;
        }

        // Check quiet hours
        const { preferences } = get();
        if (preferences.quietHours.enabled) {
          const now = new Date();
          const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

          if (currentTime >= preferences.quietHours.start || currentTime <= preferences.quietHours.end) {
            return; // In quiet hours
          }
        }

        const desktopNotif = new Notification(notification.title, {
          body: notification.message,
          icon: '/favicon.ico',
          badge: '/badge.png',
          tag: notification.id,
          requireInteraction: notification.severity === 'critical',
        });

        desktopNotif.onclick = () => {
          window.focus();
          if (notification.actionUrl) {
            window.location.href = notification.actionUrl;
          }
          desktopNotif.close();
        };
      },

      // Clear error
      clearError: () => set({ error: null }),

      // Set loading
      setLoading: (isLoading: boolean) => set({ isLoading }),
    }),
    {
      name: 'notification-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        preferences: state.preferences,
      }),
    }
  )
);

export default useNotificationStore;
