import apiClient from './client'
import type {
  User,
  Tenant,
  Project,
  Keyword,
  Backlink,
  AuditScore,
  AuditIssue,
  DashboardMetrics,
  LoginCredentials,
  RegisterData,
  AuthTokens,
} from '@/types'

// Auth APIs
export const authApi = {
  login: (credentials: LoginCredentials) =>
    apiClient.post<{ user: User; tokens: AuthTokens; tenantId: string }>(
      '/auth/login',
      credentials
    ),

  register: (data: RegisterData) =>
    apiClient.post<{ user: User; tokens: AuthTokens; tenant: Tenant }>(
      '/auth/register',
      data
    ),

  logout: () => apiClient.post('/auth/logout'),

  refreshToken: (refreshToken: string) =>
    apiClient.post<AuthTokens>('/auth/refresh', { refreshToken }),

  me: () => apiClient.get<User>('/auth/me'),
}

// Tenant APIs
export const tenantApi = {
  getAll: () => apiClient.get<Tenant[]>('/tenants'),
  getById: (id: string) => apiClient.get<Tenant>(`/tenants/${id}`),
  create: (data: Partial<Tenant>) => apiClient.post<Tenant>('/tenants', data),
  update: (id: string, data: Partial<Tenant>) =>
    apiClient.patch<Tenant>(`/tenants/${id}`, data),
  delete: (id: string) => apiClient.delete(`/tenants/${id}`),
  getStatistics: (id: string) =>
    apiClient.get<any>(`/tenants/${id}/statistics`),
}

// Project APIs
export const projectApi = {
  getAll: () => apiClient.get<Project[]>('/projects'),
  getById: (id: string) => apiClient.get<Project>(`/projects/${id}`),
  create: (data: Partial<Project>) =>
    apiClient.post<Project>('/projects', data),
  update: (id: string, data: Partial<Project>) =>
    apiClient.patch<Project>(`/projects/${id}`, data),
  delete: (id: string) => apiClient.delete(`/projects/${id}`),
  getStatistics: (id: string) =>
    apiClient.get<DashboardMetrics>(`/projects/${id}/statistics`),
  pause: (id: string) => apiClient.patch(`/projects/${id}/pause`, {}),
  resume: (id: string) => apiClient.patch(`/projects/${id}/resume`, {}),
  archive: (id: string) => apiClient.patch(`/projects/${id}/archive`, {}),
}

// Keyword APIs
export const keywordApi = {
  getByProject: (projectId: string) =>
    apiClient.get<Keyword[]>(`/projects/${projectId}/keywords`),
  research: (query: string, options?: any) =>
    apiClient.post<Keyword[]>('/keywords/research', { query, ...options }),
  getRankings: (projectId: string, keywordId: string) =>
    apiClient.get<any[]>(
      `/projects/${projectId}/keywords/${keywordId}/rankings`
    ),
}

// Backlink APIs
export const backlinkApi = {
  getByProject: (projectId: string) =>
    apiClient.get<Backlink[]>(`/projects/${projectId}/backlinks`),
  analyze: (domain: string) =>
    apiClient.post<any>('/backlinks/analyze', { domain }),
}

// Audit APIs
export const auditApi = {
  getByProject: (projectId: string) =>
    apiClient.get<{ score: AuditScore; issues: AuditIssue[] }>(
      `/projects/${projectId}/audit`
    ),
  runAudit: (projectId: string) =>
    apiClient.post(`/projects/${projectId}/audit`, {}),
}

// Events APIs
export const eventsApi = {
  requestCrawl: (projectId: string) =>
    apiClient.post('/events/crawl', { projectId }),
  requestAudit: (projectId: string) =>
    apiClient.post('/events/audit', { projectId }),
  requestRankCheck: (projectId: string) =>
    apiClient.post('/events/rank-check', { projectId }),
}

export { apiClient }
