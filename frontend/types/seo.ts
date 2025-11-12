// frontend/types/seo.ts

export type Trend = 'up' | 'down' | 'stable';

export interface RankingKeyword {
  id: string;
  keyword: string;
  currentPosition: number;
  previousPosition: number;
  searchVolume: number;
  difficulty: number;
  clicks: number;
  impressions: number;
  ctr: number;
  url: string;
  trend: Trend;
  change: number;
  lastUpdated: string;
}

export type KeywordIntent = 'informational' | 'navigational' | 'commercial' | 'transactional';
export type ContentType = 'blog' | 'product' | 'landing' | 'video' | 'tool' | 'forum' | 'news';


export interface KeywordSuggestion {
  keyword: string;
  searchVolume: number;
  difficulty: number;
  cpc: number;
  competition: number;
  intent: KeywordIntent;
  trend: number[];
  serpFeatures: string[];
  opportunityScore: number;
  isTracked: boolean;
}

export interface Competitor {
  id: string;
  domain: string;
  name: string;
  estimatedTraffic: number;
  organicKeywords: number;
  paidKeywords: number;
  backlinks: number;
  referringDomains: number;
  domainRating: number;
  trafficTrend: number; // percentage
  commonKeywords: number;
  keywordGap: number;
  contentGap: number;
  isTracked?: boolean;
}

export type KeywordGapType = 'winning' | 'losing' | 'missing';

export interface CompetitorKeywordOverlap {
  keyword: string;
  yourPosition: number | null;
  competitorPosition: number;
  searchVolume: number;
  difficulty: number;
  gapType: KeywordGapType;
}

export type IssueSeverity = 'critical' | 'warning' | 'info';

export interface ContentIssue {
  id: string;
  category: 'SEO' | 'Readability' | 'Technical' | 'Engagement';
  severity: IssueSeverity;
  message: string;
  recommendation: string;
}

export interface ContentAnalysisResult {
  analyzedUrl: string;
  analyzedTimestamp: string;
  overallScore: number;
  scores: {
    seo: number;
    readability: number;
    engagement: number;
    technical: number;
  };
  readabilityMetrics: {
    fleschReadingEase: number;
    gradeLevel: string;
    wordCount: number;
    sentenceCount: number;
    avgSentenceLength: number;
  };
  keywordDensity: {
    keyword: string;
    count: number;
    density: number;
  }[];
  headingStructure: {
    tag: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
    text: string;
  }[];
  linkAnalysis: {
    internal: number;
    external: number;
    nofollow: number;
    broken: number;
  };
  metaData: {
    title: string;
    titleLength: number;
    description: string;
    descriptionLength: number;
    images: number;
    imagesWithAlt: number;
    imagesMissingAlt: number;
  };
  issues: ContentIssue[];
}

export interface Project {
  id: string;
  name: string;
  domain: string;
  createdAt: string;
  keywordCount: number;
  averagePosition: number;
  trafficEstimate: number;
  status: 'active' | 'paused';
  lastCrawlDate: string;
}

export interface Backlink {
  id: string;
  sourceDomain: string;
  sourceUrl: string;
  targetUrl: string;
  anchorText: string;
  linkType: 'dofollow' | 'nofollow' | 'sponsored' | 'ugc';
  domainRating: number;
  firstSeen: string;
  lastChecked: string;
  status: 'active' | 'lost';
  linkContext: string;
}

// Types for Semantic Keyword Detail View

export interface PositionHistoryData {
  date: string;
  position: number;
  clicks: number;
  impressions: number;
}

export interface FeaturedSnippetData {
  hasSnippet: boolean;
  ownedByYou: boolean;
  snippetType: 'paragraph' | 'list' | 'table' | 'video';
  content?: string;
}

export interface RankingPage {
  title: string;
  metaDescription: string;
  wordCount: number;
  lastUpdated: string;
  internalLinks: number;
  externalLinks: number;
}

export interface KeywordDetail {
  keyword: string;
  searchVolume: number;
  difficulty: number;
  cpc: number;
  competition: number;
  currentPosition: number;
  previousPosition: number;
  trend: Trend;
  clicks: number;
  impressions: number;
  ctr: number;
  positionHistory: PositionHistoryData[];
  primaryIntent: KeywordIntent;
  intentConfidence: number;
  serpFeatures: string[];
  featuredSnippet: FeaturedSnippetData;
  rankingUrl: string;
  rankingPage: RankingPage;
}

// Types for SERP Intent API

export interface SerpResult {
  position: number;
  url: string;
  domain: string;
  title: string;
  description: string;
  detectedIntent: KeywordIntent;
  intentSignals: string[];
  contentType: ContentType;
  hasVideo: boolean;
  hasImages: boolean;
  hasFAQ: boolean;
  hasReviews: boolean;
  hasPricing: boolean;
  domainRating: number;
  pageAuthority: number;
  backlinks: number;
}

export interface SerpIntentData {
  keyword: string;
  topResults: SerpResult[];
  intentDistribution: Record<KeywordIntent, number>;
  contentTypeDistribution: Record<ContentType, number>;
  serpFeaturePresence: {
    featuredSnippet: boolean;
    peopleAlsoAsk: boolean;
    videoCarousel: boolean;
    imagesPack: boolean;
    localPack: boolean;
    knowledgePanel: boolean;
    shoppingResults: boolean;
    topStories: boolean;
    siteLinks: boolean;
    reviews: boolean;
  };
}

// Types for Entity Queries API

export type EntityType = 'brand' | 'person' | 'place' | 'product' | 'concept' | 'organization';
export type EntityQueryRelationship = 'contains_entity' | 'about_entity' | 'entity_attribute' | 'entity_comparison';

export interface EntityQuery {
  query: string;
  searchVolume: number;
  difficulty: number;
  intent: KeywordIntent;
  relationshipType: EntityQueryRelationship;
}

export interface EntityData {
  entity: string;
  entityType: EntityType;
  relevanceScore: number;
  queries: EntityQuery[];
  description: string;
  knowledgeGraphPresence: boolean;
  brandValue?: number;
}

export interface EntityCombination {
  entities: string[];
  query: string;
  searchVolume: number;
}

export interface EntityQueriesData {
    keyword: string;
    entities: EntityData[];
    entityDistribution: Record<EntityType, number>;
    entityCombinations: EntityCombination[];
}
