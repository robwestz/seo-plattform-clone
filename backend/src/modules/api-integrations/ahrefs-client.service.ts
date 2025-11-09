import { Injectable, Logger, HttpException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

/**
 * Ahrefs API Client
 * Real integration with Ahrefs API
 */
@Injectable()
export class AhrefsClient {
  private readonly logger = new Logger(AhrefsClient.name);
  private readonly client: AxiosInstance;
  private readonly baseUrl = 'https://api.ahrefs.com/v3';
  private readonly apiKey: string;

  constructor(private config: ConfigService) {
    this.apiKey = this.config.get<string>('AHREFS_API_KEY') || '';

    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Get domain metrics
   */
  async getDomainMetrics(params: {
    target: string;
    mode?: 'domain' | 'subdomain' | 'prefix' | 'exact';
  }): Promise<any> {
    this.logger.log(`Fetching domain metrics for: ${params.target}`);

    try {
      const response = await this.client.get('/site-explorer/metrics', {
        params: {
          target: params.target,
          mode: params.mode || 'domain',
        },
      });

      return response.data;
    } catch (error) {
      this.handleError('getDomainMetrics', error);
    }
  }

  /**
   * Get backlinks
   */
  async getBacklinks(params: {
    target: string;
    mode?: 'domain' | 'subdomain' | 'prefix' | 'exact';
    limit?: number;
    offset?: number;
  }): Promise<any> {
    this.logger.log(`Fetching backlinks for: ${params.target}`);

    try {
      const response = await this.client.get('/site-explorer/backlinks', {
        params: {
          target: params.target,
          mode: params.mode || 'domain',
          limit: params.limit || 100,
          offset: params.offset || 0,
        },
      });

      return response.data;
    } catch (error) {
      this.handleError('getBacklinks', error);
    }
  }

  /**
   * Get referring domains
   */
  async getReferringDomains(params: {
    target: string;
    mode?: 'domain' | 'subdomain' | 'prefix' | 'exact';
    limit?: number;
  }): Promise<any> {
    this.logger.log(`Fetching referring domains for: ${params.target}`);

    try {
      const response = await this.client.get('/site-explorer/referring-domains', {
        params: {
          target: params.target,
          mode: params.mode || 'domain',
          limit: params.limit || 100,
        },
      });

      return response.data;
    } catch (error) {
      this.handleError('getReferringDomains', error);
    }
  }

  /**
   * Get organic keywords
   */
  async getOrganicKeywords(params: {
    target: string;
    mode?: 'domain' | 'subdomain' | 'prefix' | 'exact';
    country?: string;
    limit?: number;
    offset?: number;
  }): Promise<any> {
    this.logger.log(`Fetching organic keywords for: ${params.target}`);

    try {
      const response = await this.client.get('/site-explorer/organic-keywords', {
        params: {
          target: params.target,
          mode: params.mode || 'domain',
          country: params.country || 'us',
          limit: params.limit || 100,
          offset: params.offset || 0,
        },
      });

      return response.data;
    } catch (error) {
      this.handleError('getOrganicKeywords', error);
    }
  }

  /**
   * Get top pages
   */
  async getTopPages(params: {
    target: string;
    mode?: 'domain' | 'subdomain' | 'prefix';
    country?: string;
    limit?: number;
  }): Promise<any> {
    this.logger.log(`Fetching top pages for: ${params.target}`);

    try {
      const response = await this.client.get('/site-explorer/top-pages', {
        params: {
          target: params.target,
          mode: params.mode || 'domain',
          country: params.country || 'us',
          limit: params.limit || 100,
        },
      });

      return response.data;
    } catch (error) {
      this.handleError('getTopPages', error);
    }
  }

  /**
   * Get anchor texts
   */
  async getAnchorTexts(params: {
    target: string;
    mode?: 'domain' | 'subdomain' | 'prefix' | 'exact';
    limit?: number;
  }): Promise<any> {
    this.logger.log(`Fetching anchor texts for: ${params.target}`);

    try {
      const response = await this.client.get('/site-explorer/anchors', {
        params: {
          target: params.target,
          mode: params.mode || 'domain',
          limit: params.limit || 100,
        },
      });

      return response.data;
    } catch (error) {
      this.handleError('getAnchorTexts', error);
    }
  }

  /**
   * Get broken backlinks
   */
  async getBrokenBacklinks(params: {
    target: string;
    mode?: 'domain' | 'subdomain' | 'prefix';
    limit?: number;
  }): Promise<any> {
    this.logger.log(`Fetching broken backlinks for: ${params.target}`);

    try {
      const response = await this.client.get('/site-explorer/broken-backlinks', {
        params: {
          target: params.target,
          mode: params.mode || 'domain',
          limit: params.limit || 100,
        },
      });

      return response.data;
    } catch (error) {
      this.handleError('getBrokenBacklinks', error);
    }
  }

  /**
   * Get broken links (on your site)
   */
  async getBrokenLinks(params: {
    target: string;
    mode?: 'domain' | 'subdomain' | 'prefix';
    limit?: number;
  }): Promise<any> {
    this.logger.log(`Fetching broken links for: ${params.target}`);

    try {
      const response = await this.client.get('/site-explorer/broken-links', {
        params: {
          target: params.target,
          mode: params.mode || 'domain',
          limit: params.limit || 100,
        },
      });

      return response.data;
    } catch (error) {
      this.handleError('getBrokenLinks', error);
    }
  }

  /**
   * Get link intersect (sites linking to competitors but not you)
   */
  async getLinkIntersect(params: {
    targets: string[];
    mode?: 'domain' | 'subdomain';
    limit?: number;
  }): Promise<any> {
    this.logger.log(`Fetching link intersect for ${params.targets.length} targets`);

    try {
      const response = await this.client.get('/site-explorer/link-intersect', {
        params: {
          targets: params.targets.join(','),
          mode: params.mode || 'domain',
          limit: params.limit || 100,
        },
      });

      return response.data;
    } catch (error) {
      this.handleError('getLinkIntersect', error);
    }
  }

  /**
   * Get domain comparison
   */
  async getDomainComparison(params: {
    targets: string[];
    mode?: 'domain' | 'subdomain';
    country?: string;
  }): Promise<any> {
    this.logger.log(`Comparing ${params.targets.length} domains`);

    try {
      const response = await this.client.get('/site-explorer/metrics-comparison', {
        params: {
          targets: params.targets.join(','),
          mode: params.mode || 'domain',
          country: params.country || 'us',
        },
      });

      return response.data;
    } catch (error) {
      this.handleError('getDomainComparison', error);
    }
  }

  /**
   * Get keyword difficulty
   */
  async getKeywordDifficulty(params: {
    keywords: string[];
    country?: string;
  }): Promise<any> {
    this.logger.log(`Fetching keyword difficulty for ${params.keywords.length} keywords`);

    try {
      const response = await this.client.post('/keywords-explorer/difficulty', {
        keywords: params.keywords,
        country: params.country || 'us',
      });

      return response.data;
    } catch (error) {
      this.handleError('getKeywordDifficulty', error);
    }
  }

  /**
   * Get keyword ideas
   */
  async getKeywordIdeas(params: {
    keyword: string;
    country?: string;
    limit?: number;
  }): Promise<any> {
    this.logger.log(`Fetching keyword ideas for: ${params.keyword}`);

    try {
      const response = await this.client.get('/keywords-explorer/ideas', {
        params: {
          keyword: params.keyword,
          country: params.country || 'us',
          limit: params.limit || 100,
        },
      });

      return response.data;
    } catch (error) {
      this.handleError('getKeywordIdeas', error);
    }
  }

  /**
   * Get SERP overview
   */
  async getSerpOverview(params: {
    keyword: string;
    country?: string;
  }): Promise<any> {
    this.logger.log(`Fetching SERP overview for: ${params.keyword}`);

    try {
      const response = await this.client.get('/keywords-explorer/serp-overview', {
        params: {
          keyword: params.keyword,
          country: params.country || 'us',
        },
      });

      return response.data;
    } catch (error) {
      this.handleError('getSerpOverview', error);
    }
  }

  /**
   * Get content explorer results
   */
  async getContentExplorer(params: {
    query: string;
    mode?: 'title' | 'url' | 'content';
    limit?: number;
    sortBy?: 'organic_traffic' | 'domain_rating' | 'url_rating';
  }): Promise<any> {
    this.logger.log(`Searching content explorer: ${params.query}`);

    try {
      const response = await this.client.get('/content-explorer/search', {
        params: {
          query: params.query,
          mode: params.mode || 'title',
          limit: params.limit || 100,
          order_by: params.sortBy || 'organic_traffic',
        },
      });

      return response.data;
    } catch (error) {
      this.handleError('getContentExplorer', error);
    }
  }

  /**
   * Get rank tracker data
   */
  async getRankTrackerData(params: {
    projectId: string;
    country?: string;
  }): Promise<any> {
    this.logger.log(`Fetching rank tracker data for project: ${params.projectId}`);

    try {
      const response = await this.client.get('/rank-tracker/rankings', {
        params: {
          project_id: params.projectId,
          country: params.country || 'us',
        },
      });

      return response.data;
    } catch (error) {
      this.handleError('getRankTrackerData', error);
    }
  }

  /**
   * Handle API errors
   */
  private handleError(method: string, error: any): never {
    this.logger.error(`Ahrefs ${method} error:`, error.message);

    if (error.response?.data) {
      throw new HttpException(
        error.response.data.error || error.message,
        error.response.status,
      );
    }

    throw new HttpException(error.message || 'Ahrefs API error', 500);
  }
}
