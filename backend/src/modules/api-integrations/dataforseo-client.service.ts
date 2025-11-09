import { Injectable, Logger, HttpException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

/**
 * DataForSEO API Client
 * Real integration with DataForSEO API
 */
@Injectable()
export class DataForSeoClient {
  private readonly logger = new Logger(DataForSeoClient.name);
  private readonly client: AxiosInstance;
  private readonly baseUrl = 'https://api.dataforseo.com/v3';

  constructor(private config: ConfigService) {
    const login = this.config.get<string>('DATAFORSEO_LOGIN');
    const password = this.config.get<string>('DATAFORSEO_PASSWORD');

    this.client = axios.create({
      baseURL: this.baseUrl,
      auth: {
        username: login || '',
        password: password || '',
      },
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Get keyword data
   */
  async getKeywordData(params: {
    keywords: string[];
    location?: string;
    language?: string;
  }): Promise<any> {
    this.logger.log(`Fetching keyword data for ${params.keywords.length} keywords`);

    try {
      const response = await this.client.post('/keywords_data/google/search_volume/live', [
        {
          keywords: params.keywords,
          location_name: params.location || 'United States',
          language_name: params.language || 'English',
        },
      ]);

      return this.parseResponse(response.data);
    } catch (error) {
      this.handleError('getKeywordData', error);
    }
  }

  /**
   * Get keyword suggestions
   */
  async getKeywordSuggestions(params: {
    keyword: string;
    location?: string;
    language?: string;
  }): Promise<any> {
    this.logger.log(`Fetching keyword suggestions for: ${params.keyword}`);

    try {
      const response = await this.client.post(
        '/keywords_data/google/keyword_suggestions/live',
        [
          {
            keyword: params.keyword,
            location_name: params.location || 'United States',
            language_name: params.language || 'English',
          },
        ],
      );

      return this.parseResponse(response.data);
    } catch (error) {
      this.handleError('getKeywordSuggestions', error);
    }
  }

  /**
   * Get SERP data
   */
  async getSerpData(params: {
    keyword: string;
    location?: string;
    language?: string;
    device?: 'desktop' | 'mobile';
    depth?: number;
  }): Promise<any> {
    this.logger.log(`Fetching SERP data for: ${params.keyword}`);

    try {
      const response = await this.client.post('/serp/google/organic/live/advanced', [
        {
          keyword: params.keyword,
          location_name: params.location || 'United States',
          language_name: params.language || 'English',
          device: params.device || 'desktop',
          depth: params.depth || 100,
        },
      ]);

      return this.parseResponse(response.data);
    } catch (error) {
      this.handleError('getSerpData', error);
    }
  }

  /**
   * Get backlink data
   */
  async getBacklinkData(params: {
    target: string;
    mode?: 'domain' | 'subdomain' | 'page';
    limit?: number;
  }): Promise<any> {
    this.logger.log(`Fetching backlink data for: ${params.target}`);

    try {
      const response = await this.client.post('/backlinks/backlinks/live', [
        {
          target: params.target,
          mode: params.mode || 'domain',
          limit: params.limit || 100,
        },
      ]);

      return this.parseResponse(response.data);
    } catch (error) {
      this.handleError('getBacklinkData', error);
    }
  }

  /**
   * Get domain analytics
   */
  async getDomainAnalytics(params: {
    target: string;
    includeSubdomains?: boolean;
  }): Promise<any> {
    this.logger.log(`Fetching domain analytics for: ${params.target}`);

    try {
      const response = await this.client.post('/backlinks/summary/live', [
        {
          target: params.target,
          include_subdomains: params.includeSubdomains || false,
        },
      ]);

      return this.parseResponse(response.data);
    } catch (error) {
      this.handleError('getDomainAnalytics', error);
    }
  }

  /**
   * Get ranking keywords for domain
   */
  async getRankingKeywords(params: {
    target: string;
    location?: string;
    language?: string;
    limit?: number;
  }): Promise<any> {
    this.logger.log(`Fetching ranking keywords for: ${params.target}`);

    try {
      const response = await this.client.post(
        '/dataforseo_labs/google/ranked_keywords/live',
        [
          {
            target: params.target,
            location_name: params.location || 'United States',
            language_name: params.language || 'English',
            limit: params.limit || 100,
          },
        ],
      );

      return this.parseResponse(response.data);
    } catch (error) {
      this.handleError('getRankingKeywords', error);
    }
  }

  /**
   * Get competitor domains
   */
  async getCompetitorDomains(params: {
    target: string;
    location?: string;
    language?: string;
    limit?: number;
  }): Promise<any> {
    this.logger.log(`Fetching competitors for: ${params.target}`);

    try {
      const response = await this.client.post(
        '/dataforseo_labs/google/competitors_domain/live',
        [
          {
            target: params.target,
            location_name: params.location || 'United States',
            language_name: params.language || 'English',
            limit: params.limit || 20,
          },
        ],
      );

      return this.parseResponse(response.data);
    } catch (error) {
      this.handleError('getCompetitorDomains', error);
    }
  }

  /**
   * Get related keywords
   */
  async getRelatedKeywords(params: {
    keyword: string;
    location?: string;
    language?: string;
    limit?: number;
  }): Promise<any> {
    this.logger.log(`Fetching related keywords for: ${params.keyword}`);

    try {
      const response = await this.client.post(
        '/dataforseo_labs/google/related_keywords/live',
        [
          {
            keyword: params.keyword,
            location_name: params.location || 'United States',
            language_name: params.language || 'English',
            limit: params.limit || 100,
          },
        ],
      );

      return this.parseResponse(response.data);
    } catch (error) {
      this.handleError('getRelatedKeywords', error);
    }
  }

  /**
   * Get SERP features
   */
  async getSerpFeatures(params: {
    keyword: string;
    location?: string;
    language?: string;
  }): Promise<any> {
    this.logger.log(`Fetching SERP features for: ${params.keyword}`);

    try {
      const response = await this.client.post(
        '/dataforseo_labs/google/serp_competitors/live',
        [
          {
            keyword: params.keyword,
            location_name: params.location || 'United States',
            language_name: params.language || 'English',
          },
        ],
      );

      return this.parseResponse(response.data);
    } catch (error) {
      this.handleError('getSerpFeatures', error);
    }
  }

  /**
   * Get historical search volume
   */
  async getHistoricalSearchVolume(params: {
    keywords: string[];
    location?: string;
    language?: string;
  }): Promise<any> {
    this.logger.log(`Fetching historical search volume for ${params.keywords.length} keywords`);

    try {
      const response = await this.client.post(
        '/keywords_data/google/search_volume_history/live',
        [
          {
            keywords: params.keywords,
            location_name: params.location || 'United States',
            language_name: params.language || 'English',
          },
        ],
      );

      return this.parseResponse(response.data);
    } catch (error) {
      this.handleError('getHistoricalSearchVolume', error);
    }
  }

  /**
   * Parse DataForSEO response
   */
  private parseResponse(data: any): any {
    if (data.status_code === 20000) {
      // Success
      return data.tasks?.[0]?.result || data.tasks?.[0] || data;
    } else {
      throw new HttpException(
        data.status_message || 'DataForSEO API error',
        data.status_code || 500,
      );
    }
  }

  /**
   * Handle API errors
   */
  private handleError(method: string, error: any): never {
    this.logger.error(`DataForSEO ${method} error:`, error.message);

    if (error.response) {
      throw new HttpException(
        error.response.data?.status_message || error.message,
        error.response.status,
      );
    }

    throw new HttpException(error.message || 'DataForSEO API error', 500);
  }
}
