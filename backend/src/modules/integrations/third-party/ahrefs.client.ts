import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { ISEOClient, SEOMetrics, Backlink, KeywordData } from './base-seo-client.interface';

/**
 * Ahrefs API Client
 * Integration with Ahrefs SEO API
 */
@Injectable()
export class AhrefsClient implements ISEOClient {
  private readonly logger = new Logger(AhrefsClient.name);
  private readonly client: AxiosInstance;
  private readonly API_BASE = 'https://api.ahrefs.com/v3';

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('AHREFS_API_KEY');

    this.client = axios.create({
      baseURL: this.API_BASE,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    // Add rate limiting interceptor
    this.client.interceptors.response.use(
      response => response,
      async error => {
        if (error.response?.status === 429) {
          this.logger.warn('Ahrefs rate limit exceeded, waiting...');
          await this.sleep(60000); // Wait 1 minute
          return this.client.request(error.config);
        }
        return Promise.reject(error);
      },
    );
  }

  /**
   * Get backlinks for a target URL or domain
   */
  async getBacklinks(target: string, options?: { limit?: number; mode?: string }) {
    this.logger.log(`Fetching Ahrefs backlinks for: ${target}`);

    try {
      const response = await this.client.get('/site-explorer/backlinks', {
        params: {
          target,
          mode: options?.mode || 'domain',
          limit: options?.limit || 100,
          order_by: 'domain_rating:desc',
        },
      });

      return {
        backlinks: response.data.backlinks || [],
        total: response.data.total || 0,
      };
    } catch (error) {
      this.logger.error(`Failed to fetch Ahrefs backlinks: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to fetch backlinks from Ahrefs');
    }
  }

  /**
   * Get domain metrics (Domain Rating, backlinks, etc.)
   */
  async getDomainMetrics(domain: string): Promise<SEOMetrics> {
    this.logger.log(`Fetching Ahrefs domain metrics for: ${domain}`);

    try {
      const response = await this.client.get('/site-explorer/metrics', {
        params: {
          target: domain,
          mode: 'domain',
        },
      });

      const data = response.data;

      return {
        domainRating: data.domain_rating,
        backlinksTotal: data.backlinks,
        referringDomains: data.referring_domains,
        organicKeywords: data.organic_keywords,
        organicTraffic: data.organic_traffic,
        organicTrafficValue: data.organic_traffic_value,
      };
    } catch (error) {
      this.logger.error(`Failed to fetch Ahrefs domain metrics: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to fetch domain metrics from Ahrefs');
    }
  }

  /**
   * Get keyword data including difficulty and search volume
   */
  async getKeywordData(keyword: string, options?: { country?: string }): Promise<KeywordData> {
    this.logger.log(`Fetching Ahrefs keyword data for: ${keyword}`);

    try {
      const response = await this.client.get('/keywords-explorer/keyword-difficulty', {
        params: {
          keyword,
          country: options?.country || 'us',
        },
      });

      const data = response.data;

      return {
        keyword,
        searchVolume: data.search_volume || 0,
        keywordDifficulty: data.keyword_difficulty || 0,
        cpc: data.cpc,
        trend: data.volume_trend || [],
      };
    } catch (error) {
      this.logger.error(`Failed to fetch Ahrefs keyword data: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to fetch keyword data from Ahrefs');
    }
  }

  /**
   * Get ranking data for domain and keywords
   */
  async getRankingData(domain: string, keywords: string[]) {
    this.logger.log(`Fetching Ahrefs ranking data for: ${domain}`);

    try {
      const response = await this.client.post('/site-explorer/organic-keywords', {
        target: domain,
        keywords,
        mode: 'domain',
      });

      return response.data;
    } catch (error) {
      this.logger.error(`Failed to fetch Ahrefs ranking data: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to fetch ranking data from Ahrefs');
    }
  }

  /**
   * Get competitor analysis
   */
  async getCompetitorAnalysis(domain: string) {
    this.logger.log(`Fetching Ahrefs competitor analysis for: ${domain}`);

    try {
      const response = await this.client.get('/site-explorer/competing-domains', {
        params: {
          target: domain,
          mode: 'domain',
          limit: 10,
        },
      });

      return {
        competitors: response.data.domains || [],
        total: response.data.total || 0,
      };
    } catch (error) {
      this.logger.error(`Failed to fetch Ahrefs competitor analysis: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to fetch competitor analysis from Ahrefs');
    }
  }

  /**
   * Get referring domains
   */
  async getReferringDomains(target: string, limit: number = 100) {
    this.logger.log(`Fetching Ahrefs referring domains for: ${target}`);

    try {
      const response = await this.client.get('/site-explorer/referring-domains', {
        params: {
          target,
          mode: 'domain',
          limit,
          order_by: 'domain_rating:desc',
        },
      });

      return response.data;
    } catch (error) {
      this.logger.error(`Failed to fetch Ahrefs referring domains: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to fetch referring domains from Ahrefs');
    }
  }

  /**
   * Helper: Sleep function for rate limiting
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
