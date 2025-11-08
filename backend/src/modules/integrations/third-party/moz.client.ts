import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { ISEOClient, SEOMetrics, Backlink, KeywordData } from './base-seo-client.interface';
import * as crypto from 'crypto';

/**
 * Moz API Client
 * Integration with Moz API
 */
@Injectable()
export class MozClient implements ISEOClient {
  private readonly logger = new Logger(MozClient.name);
  private readonly client: AxiosInstance;
  private readonly API_BASE = 'https://lsapi.seomoz.com/v2';
  private readonly accessId: string;
  private readonly secretKey: string;

  constructor(private configService: ConfigService) {
    this.accessId = this.configService.get<string>('MOZ_ACCESS_ID');
    this.secretKey = this.configService.get<string>('MOZ_SECRET_KEY');

    this.client = axios.create({
      baseURL: this.API_BASE,
      timeout: 30000,
    });

    // Add authentication interceptor
    this.client.interceptors.request.use(config => {
      const timestamp = Math.floor(Date.now() / 1000);
      const stringToSign = `${this.accessId}\n${timestamp}`;
      const signature = crypto
        .createHmac('sha1', this.secretKey)
        .update(stringToSign)
        .digest('base64');

      config.headers['Authorization'] = `Basic ${Buffer.from(`${this.accessId}:${signature}`).toString('base64')}`;
      config.headers['x-moz-token'] = `${this.accessId}:${timestamp}:${signature}`;

      return config;
    });

    // Add rate limiting interceptor
    this.client.interceptors.response.use(
      response => response,
      async error => {
        if (error.response?.status === 429) {
          this.logger.warn('Moz rate limit exceeded, waiting...');
          await this.sleep(60000);
          return this.client.request(error.config);
        }
        return Promise.reject(error);
      },
    );
  }

  /**
   * Get backlinks for a target URL
   */
  async getBacklinks(target: string, options?: { limit?: number }) {
    this.logger.log(`Fetching Moz backlinks for: ${target}`);

    try {
      const response = await this.client.post('/url-metrics', {
        targets: [target],
      });

      return {
        backlinks: response.data || [],
        total: response.data?.length || 0,
      };
    } catch (error) {
      this.logger.error(`Failed to fetch Moz backlinks: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to fetch backlinks from Moz');
    }
  }

  /**
   * Get domain metrics (Domain Authority, Page Authority, etc.)
   */
  async getDomainMetrics(domain: string): Promise<SEOMetrics> {
    this.logger.log(`Fetching Moz domain metrics for: ${domain}`);

    try {
      const response = await this.client.post('/url-metrics', {
        targets: [domain],
      });

      const data = response.data?.results?.[0];

      return {
        domainAuthority: data?.domain_authority,
        backlinksTotal: data?.external_pages_to_root_domain,
        referringDomains: data?.linking_root_domains,
      };
    } catch (error) {
      this.logger.error(`Failed to fetch Moz domain metrics: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to fetch domain metrics from Moz');
    }
  }

  /**
   * Get keyword data
   * Note: Moz doesn't provide direct keyword data API, this is a placeholder
   */
  async getKeywordData(keyword: string, options?: any): Promise<KeywordData> {
    this.logger.log(`Moz keyword data API not available for: ${keyword}`);

    // Moz doesn't provide keyword volume/difficulty in their API
    // This would need to be supplemented with other data sources
    return {
      keyword,
      searchVolume: 0,
      keywordDifficulty: 0,
    };
  }

  /**
   * Get ranking data
   */
  async getRankingData(domain: string, keywords: string[]) {
    this.logger.log(`Fetching Moz ranking data for: ${domain}`);

    try {
      const response = await this.client.post('/url-metrics', {
        targets: [domain],
      });

      return response.data;
    } catch (error) {
      this.logger.error(`Failed to fetch Moz ranking data: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to fetch ranking data from Moz');
    }
  }

  /**
   * Get competitor analysis using anchor text
   */
  async getCompetitorAnalysis(domain: string) {
    this.logger.log(`Fetching Moz competitor analysis for: ${domain}`);

    try {
      const response = await this.client.post('/anchor-text', {
        target: domain,
        scope: 'phrase_to_subdomain',
        limit: 10,
      });

      return response.data;
    } catch (error) {
      this.logger.error(`Failed to fetch Moz competitor analysis: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to fetch competitor analysis from Moz');
    }
  }

  /**
   * Get link metrics for multiple URLs
   */
  async getBulkMetrics(urls: string[]) {
    this.logger.log(`Fetching Moz bulk metrics for ${urls.length} URLs`);

    try {
      const response = await this.client.post('/url-metrics', {
        targets: urls,
      });

      return response.data?.results || [];
    } catch (error) {
      this.logger.error(`Failed to fetch Moz bulk metrics: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to fetch bulk metrics from Moz');
    }
  }

  /**
   * Get linking root domains
   */
  async getLinkingRootDomains(target: string, limit: number = 100) {
    this.logger.log(`Fetching Moz linking root domains for: ${target}`);

    try {
      const response = await this.client.post('/link-status', {
        target,
        limit,
      });

      return response.data;
    } catch (error) {
      this.logger.error(`Failed to fetch Moz linking domains: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to fetch linking domains from Moz');
    }
  }

  /**
   * Helper: Sleep function for rate limiting
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
