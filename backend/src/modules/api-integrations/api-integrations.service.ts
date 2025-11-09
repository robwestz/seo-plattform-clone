import { Injectable, Logger } from '@nestjs/common';
import { DataForSeoClient } from './dataforseo-client.service';
import { SemrushClient } from './semrush-client.service';
import { AhrefsClient } from './ahrefs-client.service';

/**
 * Unified API provider enum
 */
export enum ApiProvider {
  DATAFORSEO = 'dataforseo',
  SEMRUSH = 'semrush',
  AHREFS = 'ahrefs',
  AUTO = 'auto', // Automatically choose best provider
}

/**
 * Unified API Integrations Service
 * Combines DataForSEO, SEMrush, and Ahrefs into single interface
 */
@Injectable()
export class ApiIntegrationsService {
  private readonly logger = new Logger(ApiIntegrationsService.name);

  constructor(
    private dataForSeo: DataForSeoClient,
    private semrush: SemrushClient,
    private ahrefs: AhrefsClient,
  ) {}

  /**
   * Get keyword data from best available source
   */
  async getKeywordData(params: {
    keywords: string[];
    location?: string;
    provider?: ApiProvider;
  }): Promise<any> {
    const provider = params.provider || ApiProvider.DATAFORSEO;

    this.logger.log(
      `Fetching keyword data for ${params.keywords.length} keywords using ${provider}`,
    );

    switch (provider) {
      case ApiProvider.DATAFORSEO:
        return this.dataForSeo.getKeywordData({
          keywords: params.keywords,
          location: params.location,
        });

      case ApiProvider.SEMRUSH:
        // SEMrush requires individual keyword lookups
        const results = [];
        for (const keyword of params.keywords) {
          const data = await this.semrush.getKeywordOverview({
            keyword,
            database: this.mapLocationToDatabase(params.location),
          });
          results.push(data);
        }
        return results;

      case ApiProvider.AUTO:
        // Fallback chain: DataForSEO -> SEMrush -> Ahrefs
        try {
          return await this.dataForSeo.getKeywordData({
            keywords: params.keywords,
            location: params.location,
          });
        } catch (error) {
          this.logger.warn('DataForSEO failed, trying SEMrush...');
          const results = [];
          for (const keyword of params.keywords) {
            const data = await this.semrush.getKeywordOverview({
              keyword,
              database: this.mapLocationToDatabase(params.location),
            });
            results.push(data);
          }
          return results;
        }

      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }

  /**
   * Get keyword difficulty
   */
  async getKeywordDifficulty(params: {
    keywords: string[];
    location?: string;
    provider?: ApiProvider;
  }): Promise<any> {
    const provider = params.provider || ApiProvider.SEMRUSH;

    this.logger.log(
      `Fetching keyword difficulty for ${params.keywords.length} keywords using ${provider}`,
    );

    switch (provider) {
      case ApiProvider.SEMRUSH:
        return this.semrush.getKeywordDifficulty({
          keywords: params.keywords,
          database: this.mapLocationToDatabase(params.location),
        });

      case ApiProvider.AHREFS:
        return this.ahrefs.getKeywordDifficulty({
          keywords: params.keywords,
          country: this.mapLocationToCountry(params.location),
        });

      case ApiProvider.AUTO:
        try {
          return await this.semrush.getKeywordDifficulty({
            keywords: params.keywords,
            database: this.mapLocationToDatabase(params.location),
          });
        } catch (error) {
          this.logger.warn('SEMrush failed, trying Ahrefs...');
          return this.ahrefs.getKeywordDifficulty({
            keywords: params.keywords,
            country: this.mapLocationToCountry(params.location),
          });
        }

      default:
        return this.semrush.getKeywordDifficulty({
          keywords: params.keywords,
          database: this.mapLocationToDatabase(params.location),
        });
    }
  }

  /**
   * Get SERP data
   */
  async getSerpData(params: {
    keyword: string;
    location?: string;
    provider?: ApiProvider;
  }): Promise<any> {
    const provider = params.provider || ApiProvider.DATAFORSEO;

    this.logger.log(`Fetching SERP data for "${params.keyword}" using ${provider}`);

    switch (provider) {
      case ApiProvider.DATAFORSEO:
        return this.dataForSeo.getSerpData({
          keyword: params.keyword,
          location: params.location,
        });

      case ApiProvider.AHREFS:
        return this.ahrefs.getSerpOverview({
          keyword: params.keyword,
          country: this.mapLocationToCountry(params.location),
        });

      default:
        return this.dataForSeo.getSerpData({
          keyword: params.keyword,
          location: params.location,
        });
    }
  }

  /**
   * Get backlink data
   */
  async getBacklinkData(params: {
    target: string;
    limit?: number;
    provider?: ApiProvider;
  }): Promise<any> {
    const provider = params.provider || ApiProvider.AHREFS;

    this.logger.log(`Fetching backlink data for ${params.target} using ${provider}`);

    switch (provider) {
      case ApiProvider.AHREFS:
        return this.ahrefs.getBacklinks({
          target: params.target,
          limit: params.limit,
        });

      case ApiProvider.DATAFORSEO:
        return this.dataForSeo.getBacklinkData({
          target: params.target,
          limit: params.limit,
        });

      case ApiProvider.SEMRUSH:
        return this.semrush.getBacklinks({
          target: params.target,
          limit: params.limit,
        });

      case ApiProvider.AUTO:
        try {
          return await this.ahrefs.getBacklinks({
            target: params.target,
            limit: params.limit,
          });
        } catch (error) {
          this.logger.warn('Ahrefs failed, trying DataForSEO...');
          return this.dataForSeo.getBacklinkData({
            target: params.target,
            limit: params.limit,
          });
        }

      default:
        return this.ahrefs.getBacklinks({
          target: params.target,
          limit: params.limit,
        });
    }
  }

  /**
   * Get domain metrics
   */
  async getDomainMetrics(params: {
    domain: string;
    provider?: ApiProvider;
  }): Promise<any> {
    const provider = params.provider || ApiProvider.AHREFS;

    this.logger.log(`Fetching domain metrics for ${params.domain} using ${provider}`);

    switch (provider) {
      case ApiProvider.AHREFS:
        return this.ahrefs.getDomainMetrics({ target: params.domain });

      case ApiProvider.DATAFORSEO:
        return this.dataForSeo.getDomainAnalytics({ target: params.domain });

      case ApiProvider.SEMRUSH:
        return this.semrush.getDomainOverview({ domain: params.domain });

      default:
        return this.ahrefs.getDomainMetrics({ target: params.domain });
    }
  }

  /**
   * Get competitor analysis
   */
  async getCompetitors(params: {
    domain: string;
    limit?: number;
    provider?: ApiProvider;
  }): Promise<any> {
    const provider = params.provider || ApiProvider.SEMRUSH;

    this.logger.log(`Fetching competitors for ${params.domain} using ${provider}`);

    switch (provider) {
      case ApiProvider.SEMRUSH:
        return this.semrush.getCompetitors({
          domain: params.domain,
          limit: params.limit,
        });

      case ApiProvider.DATAFORSEO:
        return this.dataForSeo.getCompetitorDomains({
          target: params.domain,
          limit: params.limit,
        });

      default:
        return this.semrush.getCompetitors({
          domain: params.domain,
          limit: params.limit,
        });
    }
  }

  /**
   * Get organic keywords for domain
   */
  async getOrganicKeywords(params: {
    domain: string;
    limit?: number;
    provider?: ApiProvider;
  }): Promise<any> {
    const provider = params.provider || ApiProvider.SEMRUSH;

    this.logger.log(`Fetching organic keywords for ${params.domain} using ${provider}`);

    switch (provider) {
      case ApiProvider.SEMRUSH:
        return this.semrush.getOrganicKeywords({
          domain: params.domain,
          limit: params.limit,
        });

      case ApiProvider.AHREFS:
        return this.ahrefs.getOrganicKeywords({
          target: params.domain,
          limit: params.limit,
        });

      case ApiProvider.DATAFORSEO:
        return this.dataForSeo.getRankingKeywords({
          target: params.domain,
          limit: params.limit,
        });

      default:
        return this.semrush.getOrganicKeywords({
          domain: params.domain,
          limit: params.limit,
        });
    }
  }

  /**
   * Get related keywords
   */
  async getRelatedKeywords(params: {
    keyword: string;
    limit?: number;
    provider?: ApiProvider;
  }): Promise<any> {
    const provider = params.provider || ApiProvider.DATAFORSEO;

    this.logger.log(`Fetching related keywords for "${params.keyword}" using ${provider}`);

    switch (provider) {
      case ApiProvider.DATAFORSEO:
        return this.dataForSeo.getRelatedKeywords({
          keyword: params.keyword,
          limit: params.limit,
        });

      case ApiProvider.SEMRUSH:
        return this.semrush.getRelatedKeywords({
          keyword: params.keyword,
          limit: params.limit,
        });

      case ApiProvider.AHREFS:
        return this.ahrefs.getKeywordIdeas({
          keyword: params.keyword,
          limit: params.limit,
        });

      default:
        return this.dataForSeo.getRelatedKeywords({
          keyword: params.keyword,
          limit: params.limit,
        });
    }
  }

  /**
   * Get anchor text distribution
   */
  async getAnchorTexts(params: {
    target: string;
    limit?: number;
    provider?: ApiProvider;
  }): Promise<any> {
    const provider = params.provider || ApiProvider.AHREFS;

    this.logger.log(`Fetching anchor texts for ${params.target} using ${provider}`);

    switch (provider) {
      case ApiProvider.AHREFS:
        return this.ahrefs.getAnchorTexts({
          target: params.target,
          limit: params.limit,
        });

      case ApiProvider.SEMRUSH:
        return this.semrush.getAnchorTexts({
          target: params.target,
          limit: params.limit,
        });

      default:
        return this.ahrefs.getAnchorTexts({
          target: params.target,
          limit: params.limit,
        });
    }
  }

  /**
   * Get top pages for domain
   */
  async getTopPages(params: {
    domain: string;
    limit?: number;
    provider?: ApiProvider;
  }): Promise<any> {
    const provider = params.provider || ApiProvider.AHREFS;

    this.logger.log(`Fetching top pages for ${params.domain} using ${provider}`);

    return this.ahrefs.getTopPages({
      target: params.domain,
      limit: params.limit,
    });
  }

  /**
   * Get keyword suggestions
   */
  async getKeywordSuggestions(params: {
    keyword: string;
    limit?: number;
    provider?: ApiProvider;
  }): Promise<any> {
    const provider = params.provider || ApiProvider.DATAFORSEO;

    this.logger.log(`Fetching keyword suggestions for "${params.keyword}" using ${provider}`);

    return this.dataForSeo.getKeywordSuggestions({
      keyword: params.keyword,
    });
  }

  /**
   * Get referring domains
   */
  async getReferringDomains(params: {
    target: string;
    limit?: number;
    provider?: ApiProvider;
  }): Promise<any> {
    const provider = params.provider || ApiProvider.AHREFS;

    this.logger.log(`Fetching referring domains for ${params.target} using ${provider}`);

    switch (provider) {
      case ApiProvider.AHREFS:
        return this.ahrefs.getReferringDomains({
          target: params.target,
          limit: params.limit,
        });

      case ApiProvider.SEMRUSH:
        return this.semrush.getReferringDomains({
          target: params.target,
          limit: params.limit,
        });

      default:
        return this.ahrefs.getReferringDomains({
          target: params.target,
          limit: params.limit,
        });
    }
  }

  /**
   * Get link intersect (link building opportunities)
   */
  async getLinkIntersect(params: {
    yourDomain: string;
    competitorDomains: string[];
    provider?: ApiProvider;
  }): Promise<any> {
    const provider = params.provider || ApiProvider.AHREFS;

    this.logger.log(
      `Finding link opportunities for ${params.yourDomain} vs ${params.competitorDomains.length} competitors`,
    );

    // Ahrefs link intersect: sites linking to competitors but not you
    return this.ahrefs.getLinkIntersect({
      targets: [params.yourDomain, ...params.competitorDomains],
    });
  }

  /**
   * Get content explorer results
   */
  async getContentExplorer(params: {
    query: string;
    limit?: number;
    sortBy?: 'organic_traffic' | 'domain_rating';
  }): Promise<any> {
    this.logger.log(`Searching content explorer for: ${params.query}`);

    return this.ahrefs.getContentExplorer({
      query: params.query,
      limit: params.limit,
      sortBy: params.sortBy,
    });
  }

  /**
   * Get broken backlinks (link building opportunity)
   */
  async getBrokenBacklinks(params: {
    target: string;
    limit?: number;
  }): Promise<any> {
    this.logger.log(`Finding broken backlinks for ${params.target}`);

    return this.ahrefs.getBrokenBacklinks({
      target: params.target,
      limit: params.limit,
    });
  }

  /**
   * Get keyword questions (for content ideas)
   */
  async getKeywordQuestions(params: {
    keyword: string;
    limit?: number;
    provider?: ApiProvider;
  }): Promise<any> {
    const provider = params.provider || ApiProvider.SEMRUSH;

    this.logger.log(`Fetching keyword questions for: ${params.keyword}`);

    return this.semrush.getKeywordQuestions({
      keyword: params.keyword,
      limit: params.limit,
    });
  }

  /**
   * Get historical search volume
   */
  async getHistoricalSearchVolume(params: {
    keywords: string[];
    location?: string;
  }): Promise<any> {
    this.logger.log(
      `Fetching historical search volume for ${params.keywords.length} keywords`,
    );

    return this.dataForSeo.getHistoricalSearchVolume({
      keywords: params.keywords,
      location: params.location,
    });
  }

  /**
   * Compare domains
   */
  async compareDomains(params: {
    domains: string[];
    provider?: ApiProvider;
  }): Promise<any> {
    const provider = params.provider || ApiProvider.AHREFS;

    this.logger.log(`Comparing ${params.domains.length} domains using ${provider}`);

    switch (provider) {
      case ApiProvider.AHREFS:
        return this.ahrefs.getDomainComparison({ targets: params.domains });

      case ApiProvider.SEMRUSH:
        if (params.domains.length === 2) {
          return this.semrush.getDomainComparison({
            domain1: params.domains[0],
            domain2: params.domains[1],
          });
        }
        throw new Error('SEMrush only supports 2 domain comparison');

      default:
        return this.ahrefs.getDomainComparison({ targets: params.domains });
    }
  }

  /**
   * Get backlinks overview
   */
  async getBacklinksOverview(params: {
    target: string;
    provider?: ApiProvider;
  }): Promise<any> {
    const provider = params.provider || ApiProvider.SEMRUSH;

    this.logger.log(`Fetching backlinks overview for ${params.target} using ${provider}`);

    return this.semrush.getBacklinksOverview({ target: params.target });
  }

  // ========================================
  // Helper Methods
  // ========================================

  /**
   * Map location name to database code for SEMrush
   */
  private mapLocationToDatabase(location?: string): string {
    const mapping: Record<string, string> = {
      'United States': 'us',
      'United Kingdom': 'uk',
      'Canada': 'ca',
      'Australia': 'au',
      'Germany': 'de',
      'France': 'fr',
      'Spain': 'es',
      'Italy': 'it',
      'Sweden': 'se',
      'Norway': 'no',
      'Denmark': 'dk',
      'Finland': 'fi',
    };

    return mapping[location || 'United States'] || 'us';
  }

  /**
   * Map location name to country code for Ahrefs
   */
  private mapLocationToCountry(location?: string): string {
    const mapping: Record<string, string> = {
      'United States': 'us',
      'United Kingdom': 'uk',
      'Canada': 'ca',
      'Australia': 'au',
      'Germany': 'de',
      'France': 'fr',
      'Spain': 'es',
      'Italy': 'it',
      'Sweden': 'se',
      'Norway': 'no',
      'Denmark': 'dk',
      'Finland': 'fi',
    };

    return mapping[location || 'United States'] || 'us';
  }
}
