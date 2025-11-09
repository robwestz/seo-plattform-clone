import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// Keyword interface
export interface Keyword {
  id: string;
  projectId: string;
  keyword: string;
  searchVolume: number;
  difficulty: number;
  cpc: number;
  intent: 'informational' | 'navigational' | 'commercial' | 'transactional';
  currentPosition?: number;
  previousPosition?: number;
  bestPosition: number;
  url?: string;
  searchEngine: string;
  location: string;
  language: string;
  isTracked: boolean;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Keyword filters
export interface KeywordFilters {
  searchTerm?: string;
  minVolume?: number;
  maxVolume?: number;
  minDifficulty?: number;
  maxDifficulty?: number;
  intents?: string[];
  searchEngines?: string[];
  locations?: string[];
  tags?: string[];
  isTracked?: boolean;
  positionRange?: { min: number; max: number };
}

// Sort options
export interface KeywordSortOptions {
  field: 'keyword' | 'searchVolume' | 'difficulty' | 'currentPosition' | 'createdAt';
  direction: 'asc' | 'desc';
}

// Keyword state interface
export interface KeywordState {
  // State
  keywords: Keyword[];
  filteredKeywords: Keyword[];
  selectedKeywords: Set<string>;
  filters: KeywordFilters;
  sortOptions: KeywordSortOptions;
  isLoading: boolean;
  error: string | null;
  totalCount: number;
  page: number;
  pageSize: number;

  // Actions
  fetchKeywords: (projectId: string, filters?: KeywordFilters) => Promise<void>;
  addKeyword: (keyword: Omit<Keyword, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Keyword>;
  addKeywords: (keywords: Omit<Keyword, 'id' | 'createdAt' | 'updatedAt'>[]) => Promise<void>;
  updateKeyword: (keywordId: string, updates: Partial<Keyword>) => Promise<void>;
  deleteKeyword: (keywordId: string) => Promise<void>;
  deleteKeywords: (keywordIds: string[]) => Promise<void>;
  toggleTracking: (keywordId: string) => Promise<void>;
  bulkToggleTracking: (keywordIds: string[], tracked: boolean) => Promise<void>;
  addTags: (keywordId: string, tags: string[]) => Promise<void>;
  removeTags: (keywordId: string, tags: string[]) => Promise<void>;
  selectKeyword: (keywordId: string) => void;
  deselectKeyword: (keywordId: string) => void;
  selectAll: () => void;
  deselectAll: () => void;
  setFilters: (filters: KeywordFilters) => void;
  setSortOptions: (options: KeywordSortOptions) => void;
  applyFiltersAndSort: () => void;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  clearError: () => void;
  setLoading: (isLoading: boolean) => void;
}

// Create keyword store
export const useKeywordStore = create<KeywordState>()(
  devtools(
    (set, get) => ({
      // Initial state
      keywords: [],
      filteredKeywords: [],
      selectedKeywords: new Set(),
      filters: {},
      sortOptions: { field: 'searchVolume', direction: 'desc' },
      isLoading: false,
      error: null,
      totalCount: 0,
      page: 1,
      pageSize: 50,

      // Fetch keywords
      fetchKeywords: async (projectId: string, filters?: KeywordFilters) => {
        set({ isLoading: true, error: null });

        try {
          const queryParams = new URLSearchParams({
            projectId,
            page: get().page.toString(),
            pageSize: get().pageSize.toString(),
            ...(filters && Object.fromEntries(Object.entries(filters).map(([k, v]) => [k, String(v)]))),
          });

          const response = await fetch(`/api/keywords?${queryParams}`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('auth-token')}`,
            },
          });

          if (!response.ok) {
            throw new Error('Failed to fetch keywords');
          }

          const data = await response.json();

          set({
            keywords: data.keywords,
            totalCount: data.total,
            isLoading: false,
            error: null,
          });

          // Apply filters and sorting
          get().applyFiltersAndSort();
        } catch (error) {
          set({
            error: (error as Error).message,
            isLoading: false,
          });
          throw error;
        }
      },

      // Add keyword
      addKeyword: async (keywordData) => {
        set({ isLoading: true, error: null });

        try {
          const response = await fetch('/api/keywords', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${localStorage.getItem('auth-token')}`,
            },
            body: JSON.stringify(keywordData),
          });

          if (!response.ok) {
            throw new Error('Failed to add keyword');
          }

          const newKeyword = await response.json();

          set((state) => ({
            keywords: [...state.keywords, newKeyword],
            totalCount: state.totalCount + 1,
            isLoading: false,
            error: null,
          }));

          get().applyFiltersAndSort();

          return newKeyword;
        } catch (error) {
          set({
            error: (error as Error).message,
            isLoading: false,
          });
          throw error;
        }
      },

      // Add multiple keywords
      addKeywords: async (keywordsData) => {
        set({ isLoading: true, error: null });

        try {
          const response = await fetch('/api/keywords/bulk', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${localStorage.getItem('auth-token')}`,
            },
            body: JSON.stringify({ keywords: keywordsData }),
          });

          if (!response.ok) {
            throw new Error('Failed to add keywords');
          }

          const newKeywords = await response.json();

          set((state) => ({
            keywords: [...state.keywords, ...newKeywords],
            totalCount: state.totalCount + newKeywords.length,
            isLoading: false,
            error: null,
          }));

          get().applyFiltersAndSort();
        } catch (error) {
          set({
            error: (error as Error).message,
            isLoading: false,
          });
          throw error;
        }
      },

      // Update keyword
      updateKeyword: async (keywordId: string, updates: Partial<Keyword>) => {
        set({ isLoading: true, error: null });

        try {
          const response = await fetch(`/api/keywords/${keywordId}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${localStorage.getItem('auth-token')}`,
            },
            body: JSON.stringify(updates),
          });

          if (!response.ok) {
            throw new Error('Failed to update keyword');
          }

          const updatedKeyword = await response.json();

          set((state) => ({
            keywords: state.keywords.map((k) => (k.id === keywordId ? updatedKeyword : k)),
            isLoading: false,
            error: null,
          }));

          get().applyFiltersAndSort();
        } catch (error) {
          set({
            error: (error as Error).message,
            isLoading: false,
          });
          throw error;
        }
      },

      // Delete keyword
      deleteKeyword: async (keywordId: string) => {
        set({ isLoading: true, error: null });

        try {
          const response = await fetch(`/api/keywords/${keywordId}`, {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${localStorage.getItem('auth-token')}`,
            },
          });

          if (!response.ok) {
            throw new Error('Failed to delete keyword');
          }

          set((state) => ({
            keywords: state.keywords.filter((k) => k.id !== keywordId),
            totalCount: state.totalCount - 1,
            isLoading: false,
            error: null,
          }));

          get().applyFiltersAndSort();
        } catch (error) {
          set({
            error: (error as Error).message,
            isLoading: false,
          });
          throw error;
        }
      },

      // Delete multiple keywords
      deleteKeywords: async (keywordIds: string[]) => {
        set({ isLoading: true, error: null });

        try {
          const response = await fetch('/api/keywords/bulk-delete', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${localStorage.getItem('auth-token')}`,
            },
            body: JSON.stringify({ keywordIds }),
          });

          if (!response.ok) {
            throw new Error('Failed to delete keywords');
          }

          set((state) => ({
            keywords: state.keywords.filter((k) => !keywordIds.includes(k.id)),
            totalCount: state.totalCount - keywordIds.length,
            selectedKeywords: new Set(),
            isLoading: false,
            error: null,
          }));

          get().applyFiltersAndSort();
        } catch (error) {
          set({
            error: (error as Error).message,
            isLoading: false,
          });
          throw error;
        }
      },

      // Toggle tracking
      toggleTracking: async (keywordId: string) => {
        const keyword = get().keywords.find((k) => k.id === keywordId);
        if (keyword) {
          await get().updateKeyword(keywordId, { isTracked: !keyword.isTracked });
        }
      },

      // Bulk toggle tracking
      bulkToggleTracking: async (keywordIds: string[], tracked: boolean) => {
        set({ isLoading: true, error: null });

        try {
          const response = await fetch('/api/keywords/bulk-tracking', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${localStorage.getItem('auth-token')}`,
            },
            body: JSON.stringify({ keywordIds, tracked }),
          });

          if (!response.ok) {
            throw new Error('Failed to update tracking');
          }

          set((state) => ({
            keywords: state.keywords.map((k) =>
              keywordIds.includes(k.id) ? { ...k, isTracked: tracked } : k
            ),
            isLoading: false,
            error: null,
          }));

          get().applyFiltersAndSort();
        } catch (error) {
          set({
            error: (error as Error).message,
            isLoading: false,
          });
          throw error;
        }
      },

      // Add tags
      addTags: async (keywordId: string, tags: string[]) => {
        const keyword = get().keywords.find((k) => k.id === keywordId);
        if (keyword) {
          const newTags = Array.from(new Set([...keyword.tags, ...tags]));
          await get().updateKeyword(keywordId, { tags: newTags });
        }
      },

      // Remove tags
      removeTags: async (keywordId: string, tags: string[]) => {
        const keyword = get().keywords.find((k) => k.id === keywordId);
        if (keyword) {
          const newTags = keyword.tags.filter((t) => !tags.includes(t));
          await get().updateKeyword(keywordId, { tags: newTags });
        }
      },

      // Select keyword
      selectKeyword: (keywordId: string) => {
        set((state) => ({
          selectedKeywords: new Set(state.selectedKeywords).add(keywordId),
        }));
      },

      // Deselect keyword
      deselectKeyword: (keywordId: string) => {
        set((state) => {
          const newSelection = new Set(state.selectedKeywords);
          newSelection.delete(keywordId);
          return { selectedKeywords: newSelection };
        });
      },

      // Select all
      selectAll: () => {
        set((state) => ({
          selectedKeywords: new Set(state.filteredKeywords.map((k) => k.id)),
        }));
      },

      // Deselect all
      deselectAll: () => {
        set({ selectedKeywords: new Set() });
      },

      // Set filters
      setFilters: (filters: KeywordFilters) => {
        set({ filters });
        get().applyFiltersAndSort();
      },

      // Set sort options
      setSortOptions: (options: KeywordSortOptions) => {
        set({ sortOptions: options });
        get().applyFiltersAndSort();
      },

      // Apply filters and sorting
      applyFiltersAndSort: () => {
        const { keywords, filters, sortOptions } = get();

        let filtered = [...keywords];

        // Apply filters
        if (filters.searchTerm) {
          const term = filters.searchTerm.toLowerCase();
          filtered = filtered.filter((k) => k.keyword.toLowerCase().includes(term));
        }

        if (filters.minVolume !== undefined) {
          filtered = filtered.filter((k) => k.searchVolume >= filters.minVolume!);
        }

        if (filters.maxVolume !== undefined) {
          filtered = filtered.filter((k) => k.searchVolume <= filters.maxVolume!);
        }

        if (filters.minDifficulty !== undefined) {
          filtered = filtered.filter((k) => k.difficulty >= filters.minDifficulty!);
        }

        if (filters.maxDifficulty !== undefined) {
          filtered = filtered.filter((k) => k.difficulty <= filters.maxDifficulty!);
        }

        if (filters.intents && filters.intents.length > 0) {
          filtered = filtered.filter((k) => filters.intents!.includes(k.intent));
        }

        if (filters.searchEngines && filters.searchEngines.length > 0) {
          filtered = filtered.filter((k) => filters.searchEngines!.includes(k.searchEngine));
        }

        if (filters.locations && filters.locations.length > 0) {
          filtered = filtered.filter((k) => filters.locations!.includes(k.location));
        }

        if (filters.tags && filters.tags.length > 0) {
          filtered = filtered.filter((k) => filters.tags!.some((t) => k.tags.includes(t)));
        }

        if (filters.isTracked !== undefined) {
          filtered = filtered.filter((k) => k.isTracked === filters.isTracked);
        }

        if (filters.positionRange) {
          filtered = filtered.filter(
            (k) =>
              k.currentPosition !== undefined &&
              k.currentPosition >= filters.positionRange!.min &&
              k.currentPosition <= filters.positionRange!.max
          );
        }

        // Apply sorting
        filtered.sort((a, b) => {
          const aVal = a[sortOptions.field];
          const bVal = b[sortOptions.field];

          if (aVal === undefined || aVal === null) return 1;
          if (bVal === undefined || bVal === null) return -1;

          const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
          return sortOptions.direction === 'asc' ? comparison : -comparison;
        });

        set({ filteredKeywords: filtered });
      },

      // Set page
      setPage: (page: number) => {
        set({ page });
      },

      // Set page size
      setPageSize: (pageSize: number) => {
        set({ pageSize, page: 1 });
      },

      // Clear error
      clearError: () => set({ error: null }),

      // Set loading
      setLoading: (isLoading: boolean) => set({ isLoading }),
    }),
    { name: 'keyword-store' }
  )
);

export default useKeywordStore;
