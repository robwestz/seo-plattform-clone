import { Injectable, Logger, HttpException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

/**
 * SEMrush API Client
 * Real integration with SEMrush API
 */
@Injectable()
export class SemrushClient {
  private readonly logger = new Logger(SemrushClient.name);
  private readonly client: AxiosInstance;
  private readonly baseUrl = 'https://api.semrush.com';
  private readonly apiKey: string;

  constructor(private config: ConfigService) {
    this.apiKey = this.config.get<string>('SEMRUSH_API_KEY') || '';

    this.client = axios.create({
      baseURL: this.baseUrl,
      params: {
        key: this.apiKey,
      },
    });
  }

  /**
   * Get domain overview
   */
  async getDomainOverview(params: {
    domain: string;
    database?: string;
  }): Promise<any> {
    this.logger.log(`Fetching domain overview for: ${params.domain}`);

    try {
      const response = await this.client.get('/', {
        params: {
          type: 'domain_ranks',
          domain: params.domain,
          database: params.database || 'us',
          export_columns: 'Or,Ot,Oc,Ad,At,Ac,Sh,Sv,Rk',
        },
      });

      return this.parseCSVResponse(response.data);
    } catch (error) {
      this.handleError('getDomainOverview', error);
    }
  }

  /**
   * Get organic keywords for domain
   */
  async getOrganicKeywords(params: {
    domain: string;
    database?: string;
    limit?: number;
    offset?: number;
  }): Promise<any> {
    this.logger.log(`Fetching organic keywords for: ${params.domain}`);

    try {
      const response = await this.client.get('/', {
        params: {
          type: 'domain_organic',
          domain: params.domain,
          database: params.database || 'us',
          display_limit: params.limit || 100,
          display_offset: params.offset || 0,
          export_columns: 'Ph,Po,Nq,Cp,Co,Nr,Td,Fp,Fk',
        },
      });

      return this.parseCSVResponse(response.data);
    } catch (error) {
      this.handleError('getOrganicKeywords', error);
    }
  }

  /**
   * Get paid keywords (Adwords) for domain
   */
  async getPaidKeywords(params: {
    domain: string;
    database?: string;
    limit?: number;
  }): Promise<any> {
    this.logger.log(`Fetching paid keywords for: ${params.domain}`);

    try {
      const response = await this.client.get('/', {
        params: {
          type: 'domain_adwords',
          domain: params.domain,
          database: params.database || 'us',
          display_limit: params.limit || 100,
          export_columns: 'Ph,Po,Nq,Cp,Co,Nr,Td',
        },
      });

      return this.parseCSVResponse(response.data);
    } catch (error) {
      this.handleError('getPaidKeywords', error);
    }
  }

  /**
   * Get competitors
   */
  async getCompetitors(params: {
    domain: string;
    database?: string;
    limit?: number;
  }): Promise<any> {
    this.logger.log(`Fetching competitors for: ${params.domain}`);

    try {
      const response = await this.client.get('/', {
        params: {
          type: 'domain_organic_organic',
          domain: params.domain,
          database: params.database || 'us',
          display_limit: params.limit || 20,
          export_columns: 'Dn,Cr,Np,Or,Ot,Oc,Ad',
        },
      });

      return this.parseCSVResponse(response.data);
    } catch (error) {
      this.handleError('getCompetitors', error);
    }
  }

  /**
   * Get keyword overview
   */
  async getKeywordOverview(params: {
    keyword: string;
    database?: string;
  }): Promise<any> {
    this.logger.log(`Fetching keyword overview for: ${params.keyword}`);

    try {
      const response = await this.client.get('/', {
        params: {
          type: 'phrase_all',
          phrase: params.keyword,
          database: params.database || 'us',
          export_columns: 'Ph,Nq,Cp,Co,Nr,Td',
        },
      });

      return this.parseCSVResponse(response.data);
    } catch (error) {
      this.handleError('getKeywordOverview', error);
    }
  }

  /**
   * Get keyword difficulty
   */
  async getKeywordDifficulty(params: {
    keywords: string[];
    database?: string;
  }): Promise<any> {
    this.logger.log(`Fetching keyword difficulty for ${params.keywords.length} keywords`);

    try {
      const response = await this.client.get('/', {
        params: {
          type: 'phrase_kdi',
          phrase: params.keywords.join(';'),
          database: params.database || 'us',
          export_columns: 'Ph,Kd',
        },
      });

      return this.parseCSVResponse(response.data);
    } catch (error) {
      this.handleError('getKeywordDifficulty', error);
    }
  }

  /**
   * Get related keywords
   */
  async getRelatedKeywords(params: {
    keyword: string;
    database?: string;
    limit?: number;
  }): Promise<any> {
    this.logger.log(`Fetching related keywords for: ${params.keyword}`);

    try {
      const response = await this.client.get('/', {
        params: {
          type: 'phrase_related',
          phrase: params.keyword,
          database: params.database || 'us',
          display_limit: params.limit || 100,
          export_columns: 'Ph,Nq,Cp,Co,Nr,Td,Rr',
        },
      });

      return this.parseCSVResponse(response.data);
    } catch (error) {
      this.handleError('getRelatedKeywords', error);
    }
  }

  /**
   * Get backlinks overview
   */
  async getBacklinksOverview(params: { target: string }): Promise<any> {
    this.logger.log(`Fetching backlinks overview for: ${params.target}`);

    try {
      const response = await this.client.get('/', {
        params: {
          type: 'backlinks_overview',
          target: params.target,
          target_type: 'root_domain',
          export_columns: 'total,domains_num,urls_num,ips_num,ipclassc_num,follows_num,nofollows_num,sponsored_num,ugc_num,texts_num,images_num,forms_num,frames_num',
        },
      });

      return this.parseCSVResponse(response.data);
    } catch (error) {
      this.handleError('getBacklinksOverview', error);
    }
  }

  /**
   * Get backlinks
   */
  async getBacklinks(params: {
    target: string;
    limit?: number;
    offset?: number;
  }): Promise<any> {
    this.logger.log(`Fetching backlinks for: ${params.target}`);

    try {
      const response = await this.client.get('/', {
        params: {
          type: 'backlinks',
          target: params.target,
          target_type: 'root_domain',
          display_limit: params.limit || 100,
          display_offset: params.offset || 0,
          export_columns: 'page_ascore,domain_ascore,source_url,source_title,target_url,anchor,external_num,internal_num,redirect_url,last_seen,first_seen,image_url,nofollow,form,frame,sponsored,ugc,sitewide',
        },
      });

      return this.parseCSVResponse(response.data);
    } catch (error) {
      this.handleError('getBacklinks', error);
    }
  }

  /**
   * Get referring domains
   */
  async getReferringDomains(params: {
    target: string;
    limit?: number;
  }): Promise<any> {
    this.logger.log(`Fetching referring domains for: ${params.target}`);

    try {
      const response = await this.client.get('/', {
        params: {
          type: 'backlinks_refdomains',
          target: params.target,
          target_type: 'root_domain',
          display_limit: params.limit || 100,
          export_columns: 'domain,domain_ascore,backlinks_num,ip,country,first_seen,last_seen',
        },
      });

      return this.parseCSVResponse(response.data);
    } catch (error) {
      this.handleError('getReferringDomains', error);
    }
  }

  /**
   * Get anchor texts
   */
  async getAnchorTexts(params: {
    target: string;
    limit?: number;
  }): Promise<any> {
    this.logger.log(`Fetching anchor texts for: ${params.target}`);

    try {
      const response = await this.client.get('/', {
        params: {
          type: 'backlinks_anchors',
          target: params.target,
          target_type: 'root_domain',
          display_limit: params.limit || 100,
          export_columns: 'anchor,backlinks_num,domains_num,first_seen,last_seen',
        },
      });

      return this.parseCSVResponse(response.data);
    } catch (error) {
      this.handleError('getAnchorTexts', error);
    }
  }

  /**
   * Get domain vs domain comparison
   */
  async getDomainComparison(params: {
    domain1: string;
    domain2: string;
    database?: string;
  }): Promise<any> {
    this.logger.log(`Comparing domains: ${params.domain1} vs ${params.domain2}`);

    try {
      const response = await this.client.get('/', {
        params: {
          type: 'domain_domains',
          domains: `${params.domain1};${params.domain2}`,
          database: params.database || 'us',
          export_columns: 'Dn,Rk,Or,Ot,Oc,Ad,At,Ac',
        },
      });

      return this.parseCSVResponse(response.data);
    } catch (error) {
      this.handleError('getDomainComparison', error);
    }
  }

  /**
   * Get keyword suggestions (questions)
   */
  async getKeywordQuestions(params: {
    keyword: string;
    database?: string;
    limit?: number;
  }): Promise<any> {
    this.logger.log(`Fetching keyword questions for: ${params.keyword}`);

    try {
      const response = await this.client.get('/', {
        params: {
          type: 'phrase_questions',
          phrase: params.keyword,
          database: params.database || 'us',
          display_limit: params.limit || 100,
          export_columns: 'Ph,Nq,Cp,Co,Nr',
        },
      });

      return this.parseCSVResponse(response.data);
    } catch (error) {
      this.handleError('getKeywordQuestions', error);
    }
  }

  /**
   * Parse CSV response from SEMrush
   */
  private parseCSVResponse(csv: string): any[] {
    const lines = csv.trim().split('\n');
    if (lines.length === 0) return [];

    const headers = lines[0].split(';');
    const results = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(';');
      const obj: any = {};

      headers.forEach((header, index) => {
        obj[header] = values[index] || '';
      });

      results.push(obj);
    }

    return results;
  }

  /**
   * Handle API errors
   */
  private handleError(method: string, error: any): never {
    this.logger.error(`SEMrush ${method} error:`, error.message);

    if (error.response?.data) {
      throw new HttpException(
        error.response.data.error || error.message,
        error.response.status,
      );
    }

    throw new HttpException(error.message || 'SEMrush API error', 500);
  }
}
