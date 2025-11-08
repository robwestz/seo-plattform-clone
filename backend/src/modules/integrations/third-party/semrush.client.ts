import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { ISEOClient, SEOMetrics, Backlink, KeywordData } from './base-seo-client.interface';

/**
 * SEMrush API Client
 * Integration with SEMrush API
 */
@Injectable()
export class SemrushClient implements ISEOClient {
  private readonly logger = new Logger(SemrushClient.name);
  private readonly client: AxiosInstance;
  private readonly API_BASE = 'https://api.semrush.com';
  private readonly apiKey: string;

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('SEMRUSH_API_KEY');

    this.client = axios.create({
      baseURL: this.API_BASE,
      timeout: 30000,
    });

    // Add rate limiting interceptor
    this.client.interceptors.response.use(
      response => response,
      async error => {
        if (error.response?.status === 429) {
          this.logger.warn('SEMrush rate limit exceeded, waiting...');
          await this.sleep(60000);
          return this.client.request(error.config);
        }
        return Promise.reject(error);
      },
    );
  }

  /**
   * Get backlinks for a target domain
   */
  async getBacklinks(target: string, options?: { limit?: number }) {
    this.logger.log(`Fetching SEMrush backlinks for: ${target}`);

    try {
      const response = await this.client.get('/', {
        params: {
          type: 'backlinks',
          key: this.apiKey,
          target,
          display_limit: options?.limit || 100,
          export_columns: 'source_url,source_title,target_url,anchor,external_num,internal_num,first_seen,last_seen',
        },
      });

      return this.parseCSVResponse(response.data);
    } catch (error) {
      this.logger.error(`Failed to fetch SEMrush backlinks: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to fetch backlinks from SEMrush');
    }
  }

  /**
   * Get domain overview metrics
   */
  async getDomainMetrics(domain: string): Promise<SEOMetrics> {
    this.logger.log(`Fetching SEMrush domain metrics for: ${domain}`);

    try {
      const response = await this.client.get('/', {
        params: {
          type: 'domain_ranks',
          key: this.apiKey,
          domain,
          database: 'us',
        },
      });

      const data = this.parseCSVResponse(response.data)[0];

      return {
        organicKeywords: parseInt(data?.organic_keywords || '0'),
        organicTraffic: parseInt(data?.organic_traffic || '0'),
        organicTrafficValue: parseFloat(data?.organic_cost || '0'),
        backlinksTotal: parseInt(data?.backlinks_num || '0'),
        referringDomains: parseInt(data?.domains_num || '0'),
      };
    } catch (error) {
      this.logger.error(`Failed to fetch SEMrush domain metrics: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to fetch domain metrics from SEMrush');
    }
  }

  /**
   * Get keyword data including volume and difficulty
   */
  async getKeywordData(keyword: string, options?: { database?: string }): Promise<KeywordData> {
    this.logger.log(`Fetching SEMrush keyword data for: ${keyword}`);

    try {
      const response = await this.client.get('/', {
        params: {
          type: 'phrase_all',
          key: this.apiKey,
          phrase: keyword,
          database: options?.database || 'us',
          export_columns: 'Ph,Nq,Cp,Co,Nr,Td',
        },
      });

      const data = this.parseCSVResponse(response.data)[0];

      return {
        keyword,
        searchVolume: parseInt(data?.search_volume || '0'),
        keywordDifficulty: parseFloat(data?.keyword_difficulty || '0'),
        cpc: parseFloat(data?.cpc || '0'),
        competition: data?.competition || 'unknown',
      };
    } catch (error) {
      this.logger.error(`Failed to fetch SEMrush keyword data: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to fetch keyword data from SEMrush');
    }
  }

  /**
   * Get organic search positions for domain
   */
  async getRankingData(domain: string, keywords: string[]) {
    this.logger.log(`Fetching SEMrush ranking data for: ${domain}`);

    try {
      const response = await this.client.get('/', {
        params: {
          type: 'domain_organic',
          key: this.apiKey,
          domain,
          database: 'us',
          display_limit: 100,
          export_columns: 'Ph,Po,Nq,Cp,Ur,Tr,Tc,Co,Nr,Td',
        },
      });

      return this.parseCSVResponse(response.data);
    } catch (error) {
      this.logger.error(`Failed to fetch SEMrush ranking data: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to fetch ranking data from SEMrush');
    }
  }

  /**
   * Get competitor analysis
   */
  async getCompetitorAnalysis(domain: string) {
    this.logger.log(`Fetching SEMrush competitor analysis for: ${domain}`);

    try {
      const response = await this.client.get('/', {
        params: {
          type: 'domain_organic_organic',
          key: this.apiKey,
          domain,
          database: 'us',
          display_limit: 10,
        },
      });

      return this.parseCSVResponse(response.data);
    } catch (error) {
      this.logger.error(`Failed to fetch SEMrush competitor analysis: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to fetch competitor analysis from SEMrush');
    }
  }

  /**
   * Get domain's referring domains
   */
  async getReferringDomains(domain: string, limit: number = 100) {
    this.logger.log(`Fetching SEMrush referring domains for: ${domain}`);

    try {
      const response = await this.client.get('/', {
        params: {
          type: 'backlinks_refdomains',
          key: this.apiKey,
          target: domain,
          display_limit: limit,
        },
      });

      return this.parseCSVResponse(response.data);
    } catch (error) {
      this.logger.error(`Failed to fetch SEMrush referring domains: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to fetch referring domains from SEMrush');
    }
  }

  /**
   * Parse CSV response from SEMrush API
   */
  private parseCSVResponse(csvData: string): any[] {
    const lines = csvData.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(';');
    const results = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(';');
      const row: any = {};

      headers.forEach((header, index) => {
        row[header.toLowerCase().replace(/\s+/g, '_')] = values[index] || '';
      });

      results.push(row);
    }

    return results;
  }

  /**
   * Helper: Sleep function for rate limiting
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
