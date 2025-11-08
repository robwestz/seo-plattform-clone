/**
 * Base SEO Client Interface
 * Unified interface for all third-party SEO tools
 */
export interface ISEOClient {
  /**
   * Get backlinks for a domain or URL
   */
  getBacklinks(target: string, options?: any): Promise<any>;

  /**
   * Get domain metrics (DA, DR, etc.)
   */
  getDomainMetrics(domain: string): Promise<any>;

  /**
   * Get keyword data
   */
  getKeywordData(keyword: string, options?: any): Promise<any>;

  /**
   * Get ranking data
   */
  getRankingData(domain: string, keywords: string[]): Promise<any>;

  /**
   * Get competitor analysis
   */
  getCompetitorAnalysis(domain: string): Promise<any>;
}

/**
 * Common SEO Metrics Interface
 */
export interface SEOMetrics {
  domainRating?: number;
  domainAuthority?: number;
  trustFlow?: number;
  citationFlow?: number;
  backlinksTotal?: number;
  referringDomains?: number;
  organicKeywords?: number;
  organicTraffic?: number;
  organicTrafficValue?: number;
}

/**
 * Backlink Interface
 */
export interface Backlink {
  sourceUrl: string;
  targetUrl: string;
  anchorText: string;
  linkType: 'dofollow' | 'nofollow';
  firstSeen: Date;
  lastSeen: Date;
  domainRating?: number;
  urlRating?: number;
}

/**
 * Keyword Data Interface
 */
export interface KeywordData {
  keyword: string;
  searchVolume: number;
  keywordDifficulty: number;
  cpc?: number;
  competition?: string;
  trend?: number[];
}
