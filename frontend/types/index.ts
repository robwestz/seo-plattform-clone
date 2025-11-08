export interface User {
  id: string
  email: string
  name: string
  createdAt: string
  updatedAt: string
}

export interface Tenant {
  id: string
  name: string
  domain: string
  plan: 'free' | 'starter' | 'professional' | 'enterprise'
  subscriptionStatus: 'active' | 'canceled' | 'past_due'
  createdAt: string
  updatedAt: string
}

export interface Project {
  id: string
  name: string
  domain: string
  targetCountry: string
  targetLanguage: string
  keywords: string[]
  competitors: string[]
  status: 'active' | 'paused' | 'archived'
  lastCrawl?: string
  lastAudit?: string
  lastRankCheck?: string
  createdAt: string
  updatedAt: string
}

export interface Keyword {
  id: string
  keyword: string
  searchVolume: number
  difficulty: number
  cpc: number
  currentRank?: number
  previousRank?: number
  url?: string
  bestRank?: number
  averageRank?: number
  updatedAt: string
}

export interface RankingData {
  date: string
  rank: number
  url: string
  keyword: string
}

export interface AuditScore {
  overall: number
  performance: number
  seo: number
  accessibility: number
  bestPractices: number
}

export interface AuditIssue {
  id: string
  severity: 'critical' | 'error' | 'warning' | 'info'
  category: string
  title: string
  description: string
  affectedUrls: string[]
  impact: string
  recommendation: string
}

export interface Backlink {
  id: string
  sourceUrl: string
  sourceDomain: string
  targetUrl: string
  anchorText: string
  doFollow: boolean
  firstSeen: string
  lastSeen: string
  domainAuthority: number
  pageAuthority: number
}

export interface DashboardMetrics {
  totalKeywords: number
  averageRank: number
  organicTraffic: number
  backlinks: number
  domainAuthority: number
  technicalScore: number
  rankingKeywords: number
  topTenKeywords: number
}

export interface ChartData {
  date: string
  [key: string]: string | number
}

export enum UserRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
  VIEWER = 'VIEWER',
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  name: string
  tenantName: string
}
