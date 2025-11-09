import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Modal types
export type ModalType =
  | 'create-project'
  | 'edit-project'
  | 'delete-project'
  | 'add-keyword'
  | 'add-keywords-bulk'
  | 'edit-keyword'
  | 'delete-keyword'
  | 'add-competitor'
  | 'export-data'
  | 'settings'
  | 'help'
  | null;

// Toast notification
export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

// Breadcrumb item
export interface BreadcrumbItem {
  label: string;
  href?: string;
}

// UI state interface
export interface UIState {
  // Theme
  theme: 'light' | 'dark' | 'auto';

  // Layout
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;

  // Modals
  activeModal: ModalType;
  modalData: any;

  // Toasts
  toasts: Toast[];

  // Loading states
  globalLoading: boolean;
  loadingMessage: string | null;

  // Navigation
  breadcrumbs: BreadcrumbItem[];

  // Page state
  pageTitle: string;

  // Filters panel
  filtersOpen: boolean;

  // Actions
  setTheme: (theme: 'light' | 'dark' | 'auto') => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebarCollapsed: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  openModal: (modal: ModalType, data?: any) => void;
  closeModal: () => void;
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
  setGlobalLoading: (loading: boolean, message?: string) => void;
  setBreadcrumbs: (breadcrumbs: BreadcrumbItem[]) => void;
  setPageTitle: (title: string) => void;
  toggleFilters: () => void;
  setFiltersOpen: (open: boolean) => void;
}

// Create UI store
export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      // Initial state
      theme: 'light',
      sidebarOpen: true,
      sidebarCollapsed: false,
      activeModal: null,
      modalData: null,
      toasts: [],
      globalLoading: false,
      loadingMessage: null,
      breadcrumbs: [],
      pageTitle: '',
      filtersOpen: false,

      // Set theme
      setTheme: (theme: 'light' | 'dark' | 'auto') => {
        set({ theme });

        // Apply theme to document
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
      },

      // Toggle sidebar
      toggleSidebar: () => {
        set((state) => ({ sidebarOpen: !state.sidebarOpen }));
      },

      // Set sidebar open
      setSidebarOpen: (open: boolean) => {
        set({ sidebarOpen: open });
      },

      // Toggle sidebar collapsed
      toggleSidebarCollapsed: () => {
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed }));
      },

      // Set sidebar collapsed
      setSidebarCollapsed: (collapsed: boolean) => {
        set({ sidebarCollapsed: collapsed });
      },

      // Open modal
      openModal: (modal: ModalType, data?: any) => {
        set({ activeModal: modal, modalData: data });
      },

      // Close modal
      closeModal: () => {
        set({ activeModal: null, modalData: null });
      },

      // Add toast
      addToast: (toast: Omit<Toast, 'id'>) => {
        const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newToast: Toast = { id, ...toast };

        set((state) => ({
          toasts: [...state.toasts, newToast],
        }));

        // Auto-remove toast after duration
        const duration = toast.duration || 5000;
        setTimeout(() => {
          get().removeToast(id);
        }, duration);
      },

      // Remove toast
      removeToast: (id: string) => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      },

      // Clear all toasts
      clearToasts: () => {
        set({ toasts: [] });
      },

      // Set global loading
      setGlobalLoading: (loading: boolean, message?: string) => {
        set({ globalLoading: loading, loadingMessage: message || null });
      },

      // Set breadcrumbs
      setBreadcrumbs: (breadcrumbs: BreadcrumbItem[]) => {
        set({ breadcrumbs });
      },

      // Set page title
      setPageTitle: (title: string) => {
        set({ pageTitle: title });
        document.title = `${title} | SEO Intelligence Platform`;
      },

      // Toggle filters
      toggleFilters: () => {
        set((state) => ({ filtersOpen: !state.filtersOpen }));
      },

      // Set filters open
      setFiltersOpen: (open: boolean) => {
        set({ filtersOpen: open });
      },
    }),
    {
      name: 'ui-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        theme: state.theme,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
);

// Hook for managing toasts easily
export const useToast = () => {
  const addToast = useUIStore((state) => state.addToast);

  return {
    success: (title: string, message?: string, duration?: number) =>
      addToast({ type: 'success', title, message, duration }),
    error: (title: string, message?: string, duration?: number) =>
      addToast({ type: 'error', title, message, duration }),
    warning: (title: string, message?: string, duration?: number) =>
      addToast({ type: 'warning', title, message, duration }),
    info: (title: string, message?: string, duration?: number) =>
      addToast({ type: 'info', title, message, duration }),
  };
};

export default useUIStore;
