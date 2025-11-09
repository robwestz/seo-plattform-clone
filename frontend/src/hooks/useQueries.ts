import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, invalidateQueries } from '../lib/queryClient';
import { useAuthStore } from '../stores/authStore';

// API base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

// Fetch helper with auth
const fetchWithAuth = async (endpoint: string, options: RequestInit = {}) => {
  const token = useAuthStore.getState().token;

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
};

// ==================== PROJECT QUERIES ====================

export const useProjects = (filters?: Record<string, any>) => {
  return useQuery({
    queryKey: queryKeys.projects.list(filters),
    queryFn: () => fetchWithAuth('/projects', { method: 'GET' }),
    staleTime: 1000 * 60 * 5,
  });
};

export const useProject = (projectId: string) => {
  return useQuery({
    queryKey: queryKeys.projects.detail(projectId),
    queryFn: () => fetchWithAuth(`/projects/${projectId}`, { method: 'GET' }),
    enabled: !!projectId,
    staleTime: 1000 * 60 * 10,
  });
};

export const useProjectStats = (projectId: string) => {
  return useQuery({
    queryKey: queryKeys.projects.stats(projectId),
    queryFn: () => fetchWithAuth(`/projects/${projectId}/stats`, { method: 'GET' }),
    enabled: !!projectId,
    staleTime: 1000 * 60 * 2,
  });
};

export const useCreateProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => fetchWithAuth('/projects', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries(queryKeys.projects.lists());
    },
    meta: {
      successMessage: 'Project created successfully',
      errorMessage: 'Failed to create project',
    },
  });
};

export const useUpdateProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, data }: { projectId: string; data: any }) =>
      fetchWithAuth(`/projects/${projectId}`, { method: 'PATCH', body: JSON.stringify(data) }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(queryKeys.projects.detail(variables.projectId));
      queryClient.invalidateQueries(queryKeys.projects.lists());
    },
    meta: {
      successMessage: 'Project updated successfully',
      errorMessage: 'Failed to update project',
    },
  });
};

export const useDeleteProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (projectId: string) => fetchWithAuth(`/projects/${projectId}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries(queryKeys.projects.lists());
    },
    meta: {
      successMessage: 'Project deleted successfully',
      errorMessage: 'Failed to delete project',
    },
  });
};

// ==================== KEYWORD QUERIES ====================

export const useKeywords = (projectId: string, filters?: Record<string, any>) => {
  return useQuery({
    queryKey: queryKeys.keywords.list(projectId, filters),
    queryFn: () => {
      const params = new URLSearchParams({ projectId, ...(filters || {}) });
      return fetchWithAuth(`/keywords?${params}`, { method: 'GET' });
    },
    enabled: !!projectId,
    staleTime: 1000 * 60 * 5,
  });
};

export const useKeyword = (keywordId: string) => {
  return useQuery({
    queryKey: queryKeys.keywords.detail(keywordId),
    queryFn: () => fetchWithAuth(`/keywords/${keywordId}`, { method: 'GET' }),
    enabled: !!keywordId,
    staleTime: 1000 * 60 * 10,
  });
};

export const useKeywordSuggestions = (seed: string, filters?: Record<string, any>) => {
  return useQuery({
    queryKey: queryKeys.keywords.suggestions(seed, filters),
    queryFn: () => {
      const params = new URLSearchParams({ seed, ...(filters || {}) });
      return fetchWithAuth(`/keywords/suggestions?${params}`, { method: 'GET' });
    },
    enabled: seed.length >= 2,
    staleTime: 1000 * 60 * 30,
  });
};

export const useAddKeyword = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => fetchWithAuth('/keywords', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: (_, variables) => {
      invalidateQueries.keyword(variables.projectId);
    },
    meta: {
      successMessage: 'Keyword added successfully',
      errorMessage: 'Failed to add keyword',
    },
  });
};

export const useAddKeywordsBulk = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { projectId: string; keywords: any[] }) =>
      fetchWithAuth('/keywords/bulk', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: (_, variables) => {
      invalidateQueries.keyword(variables.projectId);
    },
    meta: {
      successMessage: 'Keywords added successfully',
      errorMessage: 'Failed to add keywords',
    },
  });
};

export const useUpdateKeyword = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ keywordId, data }: { keywordId: string; data: any }) =>
      fetchWithAuth(`/keywords/${keywordId}`, { method: 'PATCH', body: JSON.stringify(data) }),
    onSuccess: (result) => {
      queryClient.invalidateQueries(queryKeys.keywords.detail(result.id));
      invalidateQueries.keyword(result.projectId);
    },
    meta: {
      successMessage: 'Keyword updated successfully',
      errorMessage: 'Failed to update keyword',
    },
  });
};

export const useDeleteKeyword = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ keywordId, projectId }: { keywordId: string; projectId: string }) =>
      fetchWithAuth(`/keywords/${keywordId}`, { method: 'DELETE' }),
    onSuccess: (_, variables) => {
      invalidateQueries.keyword(variables.projectId);
    },
    meta: {
      successMessage: 'Keyword deleted successfully',
      errorMessage: 'Failed to delete keyword',
    },
  });
};

// ==================== RANKING QUERIES ====================

export const useRankings = (projectId: string, filters?: Record<string, any>) => {
  return useQuery({
    queryKey: queryKeys.rankings.list(projectId, filters),
    queryFn: () => {
      const params = new URLSearchParams({ projectId, ...(filters || {}) });
      return fetchWithAuth(`/rankings?${params}`, { method: 'GET' });
    },
    enabled: !!projectId,
    staleTime: 1000 * 60 * 2,
    refetchInterval: 1000 * 60 * 5, // Auto-refresh every 5 minutes
  });
};

export const useRankingHistory = (keywordId: string, dateRange?: { start: Date; end: Date }) => {
  return useQuery({
    queryKey: queryKeys.rankings.history(keywordId, dateRange),
    queryFn: () => {
      const params = new URLSearchParams({
        ...(dateRange && {
          startDate: dateRange.start.toISOString(),
          endDate: dateRange.end.toISOString(),
        }),
      });
      return fetchWithAuth(`/rankings/history/${keywordId}?${params}`, { method: 'GET' });
    },
    enabled: !!keywordId,
    staleTime: 1000 * 60 * 10,
  });
};

export const useRankingChart = (projectId: string, chartType: string, filters?: Record<string, any>) => {
  return useQuery({
    queryKey: queryKeys.rankings.chart(projectId, chartType, filters),
    queryFn: () => {
      const params = new URLSearchParams({ projectId, chartType, ...(filters || {}) });
      return fetchWithAuth(`/rankings/chart?${params}`, { method: 'GET' });
    },
    enabled: !!projectId,
    staleTime: 1000 * 60 * 5,
  });
};

// ==================== COMPETITOR QUERIES ====================

export const useCompetitors = (projectId: string) => {
  return useQuery({
    queryKey: queryKeys.competitors.list(projectId),
    queryFn: () => fetchWithAuth(`/competitors?projectId=${projectId}`, { method: 'GET' }),
    enabled: !!projectId,
    staleTime: 1000 * 60 * 10,
  });
};

export const useCompetitor = (competitorId: string) => {
  return useQuery({
    queryKey: queryKeys.competitors.detail(competitorId),
    queryFn: () => fetchWithAuth(`/competitors/${competitorId}`, { method: 'GET' }),
    enabled: !!competitorId,
    staleTime: 1000 * 60 * 10,
  });
};

export const useCompetitorComparison = (projectId: string, competitorIds: string[]) => {
  return useQuery({
    queryKey: queryKeys.competitors.comparison(projectId, competitorIds),
    queryFn: () =>
      fetchWithAuth(`/competitors/comparison?projectId=${projectId}&ids=${competitorIds.join(',')}`, {
        method: 'GET',
      }),
    enabled: !!projectId && competitorIds.length > 0,
    staleTime: 1000 * 60 * 15,
  });
};

export const useCompetitorOverlap = (projectId: string, competitorId: string) => {
  return useQuery({
    queryKey: queryKeys.competitors.overlap(projectId, competitorId),
    queryFn: () =>
      fetchWithAuth(`/competitors/overlap?projectId=${projectId}&competitorId=${competitorId}`, {
        method: 'GET',
      }),
    enabled: !!projectId && !!competitorId,
    staleTime: 1000 * 60 * 15,
  });
};

export const useAddCompetitor = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) =>
      fetchWithAuth('/competitors', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: (_, variables) => {
      invalidateQueries.competitor(variables.projectId);
    },
    meta: {
      successMessage: 'Competitor added successfully',
      errorMessage: 'Failed to add competitor',
    },
  });
};

export const useDeleteCompetitor = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ competitorId, projectId }: { competitorId: string; projectId: string }) =>
      fetchWithAuth(`/competitors/${competitorId}`, { method: 'DELETE' }),
    onSuccess: (_, variables) => {
      invalidateQueries.competitor(variables.projectId);
    },
    meta: {
      successMessage: 'Competitor removed successfully',
      errorMessage: 'Failed to remove competitor',
    },
  });
};

// ==================== BACKLINK QUERIES ====================

export const useBacklinks = (projectId: string, filters?: Record<string, any>) => {
  return useQuery({
    queryKey: queryKeys.backlinks.list(projectId, filters),
    queryFn: () => {
      const params = new URLSearchParams({ projectId, ...(filters || {}) });
      return fetchWithAuth(`/backlinks?${params}`, { method: 'GET' });
    },
    enabled: !!projectId,
    staleTime: 1000 * 60 * 10,
  });
};

export const useBacklinkStats = (projectId: string) => {
  return useQuery({
    queryKey: queryKeys.backlinks.stats(projectId),
    queryFn: () => fetchWithAuth(`/backlinks/stats?projectId=${projectId}`, { method: 'GET' }),
    enabled: !!projectId,
    staleTime: 1000 * 60 * 5,
  });
};

// ==================== CONTENT QUERIES ====================

export const useContent = (projectId: string, filters?: Record<string, any>) => {
  return useQuery({
    queryKey: queryKeys.content.list(projectId, filters),
    queryFn: () => {
      const params = new URLSearchParams({ projectId, ...(filters || {}) });
      return fetchWithAuth(`/content?${params}`, { method: 'GET' });
    },
    enabled: !!projectId,
    staleTime: 1000 * 60 * 10,
  });
};

export const useContentAnalysis = (contentId: string) => {
  return useQuery({
    queryKey: queryKeys.content.analysis(contentId),
    queryFn: () => fetchWithAuth(`/content/${contentId}/analysis`, { method: 'GET' }),
    enabled: !!contentId,
    staleTime: 1000 * 60 * 10,
  });
};

// ==================== ANALYTICS QUERIES ====================

export const useAnalyticsOverview = (projectId: string, dateRange?: { start: Date; end: Date }) => {
  return useQuery({
    queryKey: queryKeys.analytics.overview(projectId, dateRange),
    queryFn: () => {
      const params = new URLSearchParams({
        projectId,
        ...(dateRange && {
          startDate: dateRange.start.toISOString(),
          endDate: dateRange.end.toISOString(),
        }),
      });
      return fetchWithAuth(`/analytics/overview?${params}`, { method: 'GET' });
    },
    enabled: !!projectId,
    staleTime: 1000 * 60 * 5,
  });
};

export const useTrafficAnalytics = (projectId: string, dateRange?: { start: Date; end: Date }) => {
  return useQuery({
    queryKey: queryKeys.analytics.traffic(projectId, dateRange),
    queryFn: () => {
      const params = new URLSearchParams({
        projectId,
        ...(dateRange && {
          startDate: dateRange.start.toISOString(),
          endDate: dateRange.end.toISOString(),
        }),
      });
      return fetchWithAuth(`/analytics/traffic?${params}`, { method: 'GET' });
    },
    enabled: !!projectId,
    staleTime: 1000 * 60 * 5,
  });
};

// ==================== NOTIFICATION QUERIES ====================

export const useNotifications = (filters?: Record<string, any>) => {
  return useQuery({
    queryKey: queryKeys.notifications.list(filters),
    queryFn: () => {
      const params = new URLSearchParams(filters || {});
      return fetchWithAuth(`/notifications?${params}`, { method: 'GET' });
    },
    staleTime: 1000 * 60 * 1,
    refetchInterval: 1000 * 60 * 2, // Auto-refresh every 2 minutes
  });
};

export const useUnreadNotificationCount = () => {
  return useQuery({
    queryKey: queryKeys.notifications.unreadCount,
    queryFn: () => fetchWithAuth('/notifications/unread-count', { method: 'GET' }),
    staleTime: 1000 * 60 * 1,
    refetchInterval: 1000 * 60 * 1, // Auto-refresh every minute
  });
};

export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) =>
      fetchWithAuth(`/notifications/${notificationId}/read`, { method: 'PATCH' }),
    onSuccess: () => {
      invalidateQueries.notifications();
    },
  });
};

export default {
  // Projects
  useProjects,
  useProject,
  useProjectStats,
  useCreateProject,
  useUpdateProject,
  useDeleteProject,

  // Keywords
  useKeywords,
  useKeyword,
  useKeywordSuggestions,
  useAddKeyword,
  useAddKeywordsBulk,
  useUpdateKeyword,
  useDeleteKeyword,

  // Rankings
  useRankings,
  useRankingHistory,
  useRankingChart,

  // Competitors
  useCompetitors,
  useCompetitor,
  useCompetitorComparison,
  useCompetitorOverlap,
  useAddCompetitor,
  useDeleteCompetitor,

  // Backlinks
  useBacklinks,
  useBacklinkStats,

  // Content
  useContent,
  useContentAnalysis,

  // Analytics
  useAnalyticsOverview,
  useTrafficAnalytics,

  // Notifications
  useNotifications,
  useUnreadNotificationCount,
  useMarkNotificationRead,
};
