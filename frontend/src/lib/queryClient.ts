import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';
import { useToast } from '../stores/uiStore';

// Default options for all queries
const defaultQueryOptions = {
  staleTime: 1000 * 60 * 5, // 5 minutes
  cacheTime: 1000 * 60 * 30, // 30 minutes
  refetchOnWindowFocus: false,
  refetchOnReconnect: true,
  retry: (failureCount: number, error: any) => {
    // Don't retry on 4xx errors
    if (error?.response?.status >= 400 && error?.response?.status < 500) {
      return false;
    }
    // Retry up to 3 times for other errors
    return failureCount < 3;
  },
  retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
};

// Query cache with error handling
const queryCache = new QueryCache({
  onError: (error, query) => {
    console.error('Query error:', error, query);

    // Show error toast for failed queries
    const toast = useToast();
    if (query.meta?.errorMessage) {
      toast.error('Query Failed', query.meta.errorMessage as string);
    }
  },
  onSuccess: (data, query) => {
    // Optional: Log successful queries in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Query success:', query.queryKey, data);
    }
  },
});

// Mutation cache with error handling
const mutationCache = new MutationCache({
  onError: (error, variables, context, mutation) => {
    console.error('Mutation error:', error, variables);

    // Show error toast for failed mutations
    const toast = useToast();
    if (mutation.meta?.errorMessage) {
      toast.error('Mutation Failed', mutation.meta.errorMessage as string);
    } else {
      toast.error('Operation Failed', (error as Error).message);
    }
  },
  onSuccess: (data, variables, context, mutation) => {
    // Show success toast for mutations
    const toast = useToast();
    if (mutation.meta?.successMessage) {
      toast.success('Success', mutation.meta.successMessage as string);
    }
  },
});

// Create query client
export const queryClient = new QueryClient({
  queryCache,
  mutationCache,
  defaultOptions: {
    queries: defaultQueryOptions,
    mutations: {
      retry: false,
      onError: (error) => {
        console.error('Mutation error:', error);
      },
    },
  },
});

// Query key factory for organized cache management
export const queryKeys = {
  // Auth
  auth: {
    user: ['auth', 'user'] as const,
    session: ['auth', 'session'] as const,
  },

  // Projects
  projects: {
    all: ['projects'] as const,
    lists: () => [...queryKeys.projects.all, 'list'] as const,
    list: (filters?: Record<string, any>) => [...queryKeys.projects.lists(), filters] as const,
    details: () => [...queryKeys.projects.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.projects.details(), id] as const,
    stats: (id: string) => [...queryKeys.projects.detail(id), 'stats'] as const,
  },

  // Keywords
  keywords: {
    all: ['keywords'] as const,
    lists: () => [...queryKeys.keywords.all, 'list'] as const,
    list: (projectId: string, filters?: Record<string, any>) =>
      [...queryKeys.keywords.lists(), projectId, filters] as const,
    details: () => [...queryKeys.keywords.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.keywords.details(), id] as const,
    suggestions: (seed: string, filters?: Record<string, any>) =>
      [...queryKeys.keywords.all, 'suggestions', seed, filters] as const,
  },

  // Rankings
  rankings: {
    all: ['rankings'] as const,
    lists: () => [...queryKeys.rankings.all, 'list'] as const,
    list: (projectId: string, filters?: Record<string, any>) =>
      [...queryKeys.rankings.lists(), projectId, filters] as const,
    history: (keywordId: string, dateRange?: { start: Date; end: Date }) =>
      [...queryKeys.rankings.all, 'history', keywordId, dateRange] as const,
    chart: (projectId: string, chartType: string, filters?: Record<string, any>) =>
      [...queryKeys.rankings.all, 'chart', projectId, chartType, filters] as const,
  },

  // Competitors
  competitors: {
    all: ['competitors'] as const,
    lists: () => [...queryKeys.competitors.all, 'list'] as const,
    list: (projectId: string) => [...queryKeys.competitors.lists(), projectId] as const,
    details: () => [...queryKeys.competitors.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.competitors.details(), id] as const,
    comparison: (projectId: string, competitorIds: string[]) =>
      [...queryKeys.competitors.all, 'comparison', projectId, ...competitorIds] as const,
    overlap: (projectId: string, competitorId: string) =>
      [...queryKeys.competitors.all, 'overlap', projectId, competitorId] as const,
  },

  // Backlinks
  backlinks: {
    all: ['backlinks'] as const,
    lists: () => [...queryKeys.backlinks.all, 'list'] as const,
    list: (projectId: string, filters?: Record<string, any>) =>
      [...queryKeys.backlinks.lists(), projectId, filters] as const,
    details: () => [...queryKeys.backlinks.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.backlinks.details(), id] as const,
    stats: (projectId: string) => [...queryKeys.backlinks.all, 'stats', projectId] as const,
  },

  // Content
  content: {
    all: ['content'] as const,
    lists: () => [...queryKeys.content.all, 'list'] as const,
    list: (projectId: string, filters?: Record<string, any>) =>
      [...queryKeys.content.lists(), projectId, filters] as const,
    details: () => [...queryKeys.content.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.content.details(), id] as const,
    analysis: (id: string) => [...queryKeys.content.all, 'analysis', id] as const,
  },

  // Analytics
  analytics: {
    all: ['analytics'] as const,
    overview: (projectId: string, dateRange?: { start: Date; end: Date }) =>
      [...queryKeys.analytics.all, 'overview', projectId, dateRange] as const,
    traffic: (projectId: string, dateRange?: { start: Date; end: Date }) =>
      [...queryKeys.analytics.all, 'traffic', projectId, dateRange] as const,
    conversions: (projectId: string, dateRange?: { start: Date; end: Date }) =>
      [...queryKeys.analytics.all, 'conversions', projectId, dateRange] as const,
  },

  // Integrations
  integrations: {
    all: ['integrations'] as const,
    lists: () => [...queryKeys.integrations.all, 'list'] as const,
    list: (tenantId: string) => [...queryKeys.integrations.lists(), tenantId] as const,
    details: () => [...queryKeys.integrations.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.integrations.details(), id] as const,
    status: (id: string) => [...queryKeys.integrations.all, 'status', id] as const,
  },

  // Sync
  sync: {
    all: ['sync'] as const,
    jobs: (filters?: Record<string, any>) => [...queryKeys.sync.all, 'jobs', filters] as const,
    job: (id: string) => [...queryKeys.sync.all, 'job', id] as const,
    schedules: (filters?: Record<string, any>) =>
      [...queryKeys.sync.all, 'schedules', filters] as const,
    schedule: (id: string) => [...queryKeys.sync.all, 'schedule', id] as const,
  },

  // Reports
  reports: {
    all: ['reports'] as const,
    lists: () => [...queryKeys.reports.all, 'list'] as const,
    list: (projectId: string, filters?: Record<string, any>) =>
      [...queryKeys.reports.lists(), projectId, filters] as const,
    details: () => [...queryKeys.reports.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.reports.details(), id] as const,
  },

  // Notifications
  notifications: {
    all: ['notifications'] as const,
    lists: () => [...queryKeys.notifications.all, 'list'] as const,
    list: (filters?: Record<string, any>) => [...queryKeys.notifications.lists(), filters] as const,
    unreadCount: ['notifications', 'unread-count'] as const,
  },
};

// Helper function to invalidate related queries
export const invalidateQueries = {
  project: (projectId: string) => {
    queryClient.invalidateQueries(queryKeys.projects.detail(projectId));
    queryClient.invalidateQueries(queryKeys.keywords.list(projectId));
    queryClient.invalidateQueries(queryKeys.rankings.list(projectId));
    queryClient.invalidateQueries(queryKeys.competitors.list(projectId));
    queryClient.invalidateQueries(queryKeys.backlinks.list(projectId));
    queryClient.invalidateQueries(queryKeys.content.list(projectId));
    queryClient.invalidateQueries(queryKeys.analytics.overview(projectId));
  },

  keyword: (projectId: string) => {
    queryClient.invalidateQueries(queryKeys.keywords.list(projectId));
    queryClient.invalidateQueries(queryKeys.rankings.list(projectId));
    queryClient.invalidateQueries(queryKeys.projects.stats(projectId));
  },

  ranking: (projectId: string, keywordId?: string) => {
    queryClient.invalidateQueries(queryKeys.rankings.list(projectId));
    if (keywordId) {
      queryClient.invalidateQueries(queryKeys.rankings.history(keywordId));
    }
    queryClient.invalidateQueries(queryKeys.projects.stats(projectId));
  },

  competitor: (projectId: string) => {
    queryClient.invalidateQueries(queryKeys.competitors.list(projectId));
    queryClient.invalidateQueries(queryKeys.rankings.list(projectId));
  },

  backlink: (projectId: string) => {
    queryClient.invalidateQueries(queryKeys.backlinks.list(projectId));
    queryClient.invalidateQueries(queryKeys.backlinks.stats(projectId));
    queryClient.invalidateQueries(queryKeys.projects.stats(projectId));
  },

  content: (projectId: string) => {
    queryClient.invalidateQueries(queryKeys.content.list(projectId));
  },

  integration: (tenantId: string) => {
    queryClient.invalidateQueries(queryKeys.integrations.list(tenantId));
  },

  sync: () => {
    queryClient.invalidateQueries(queryKeys.sync.jobs());
    queryClient.invalidateQueries(queryKeys.sync.schedules());
  },

  notifications: () => {
    queryClient.invalidateQueries(queryKeys.notifications.lists());
    queryClient.invalidateQueries(queryKeys.notifications.unreadCount);
  },
};

export default queryClient;
