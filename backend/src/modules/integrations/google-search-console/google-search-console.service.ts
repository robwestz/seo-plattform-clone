import {
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OAuthService } from '../oauth/oauth.service';
import { OAuthProvider } from '../oauth/entities/oauth-connection.entity';
import { GSCData, GSCDataType } from './entities/gsc-data.entity';
import { GSCPerformanceQueryDto } from './dto/gsc-performance.dto';
import axios from 'axios';

/**
 * Google Search Console Service
 * Handles integration with Google Search Console API
 */
@Injectable()
export class GoogleSearchConsoleService {
  private readonly logger = new Logger(GoogleSearchConsoleService.name);
  private readonly GSC_API_BASE = 'https://searchconsole.googleapis.com/v1';

  constructor(
    @InjectRepository(GSCData)
    private gscDataRepository: Repository<GSCData>,
    private oauthService: OAuthService,
  ) {}

  /**
   * Get authenticated API client
   */
  private async getAuthenticatedClient(userId: string, tenantId: string) {
    const connection = await this.oauthService.getConnection(
      userId,
      tenantId,
      OAuthProvider.GOOGLE_SEARCH_CONSOLE,
    );

    return axios.create({
      baseURL: this.GSC_API_BASE,
      headers: {
        Authorization: `Bearer ${connection.accessToken}`,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * List all sites/properties in Search Console
   */
  async listSites(userId: string, tenantId: string) {
    this.logger.log(`Listing GSC sites for user: ${userId}`);

    try {
      const client = await this.getAuthenticatedClient(userId, tenantId);
      const response = await client.get('/webmasters/v3/sites');

      return response.data.siteEntry || [];
    } catch (error) {
      this.logger.error(`Failed to list GSC sites: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to fetch Search Console sites');
    }
  }

  /**
   * Fetch performance data from Google Search Console
   */
  async fetchPerformanceData(
    userId: string,
    tenantId: string,
    projectId: string,
    query: GSCPerformanceQueryDto,
  ) {
    this.logger.log(`Fetching GSC performance data for site: ${query.siteUrl}`);

    try {
      const client = await this.getAuthenticatedClient(userId, tenantId);

      const requestBody = {
        startDate: query.startDate,
        endDate: query.endDate,
        dimensions: query.dimensions || ['query', 'page', 'date'],
        searchType: query.searchType || 'web',
        rowLimit: query.rowLimit || 25000,
      };

      const response = await client.post(
        `/webmasters/v3/sites/${encodeURIComponent(query.siteUrl)}/searchAnalytics/query`,
        requestBody,
      );

      const rows = response.data.rows || [];

      // Store data in database
      const gscDataEntries = rows.map(row => {
        const dimensionValues = row.keys || [];
        return this.gscDataRepository.create({
          tenantId,
          projectId,
          dataType: GSCDataType.PERFORMANCE,
          url: dimensionValues[1] || query.siteUrl,
          query: dimensionValues[0] || null,
          date: new Date(dimensionValues[2] || query.startDate),
          clicks: row.clicks || 0,
          impressions: row.impressions || 0,
          ctr: row.ctr ? parseFloat((row.ctr * 100).toFixed(2)) : 0,
          position: row.position ? parseFloat(row.position.toFixed(2)) : 0,
          searchType: query.searchType || 'web',
          metadata: {
            keys: row.keys,
          },
        });
      });

      if (gscDataEntries.length > 0) {
        // Use batch insert for better performance
        await this.gscDataRepository
          .createQueryBuilder()
          .insert()
          .into(GSCData)
          .values(gscDataEntries)
          .orUpdate(['clicks', 'impressions', 'ctr', 'position', 'updatedAt'], ['tenantId', 'projectId', 'url', 'query', 'date'])
          .execute();
      }

      this.logger.log(`Stored ${gscDataEntries.length} GSC performance records`);

      return {
        totalRows: rows.length,
        data: rows,
      };
    } catch (error) {
      this.logger.error(`Failed to fetch GSC performance data: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to fetch performance data');
    }
  }

  /**
   * Fetch index coverage data
   */
  async fetchIndexCoverage(userId: string, tenantId: string, siteUrl: string) {
    this.logger.log(`Fetching GSC index coverage for site: ${siteUrl}`);

    try {
      const client = await this.getAuthenticatedClient(userId, tenantId);

      const response = await client.get(
        `/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/sitemaps`,
      );

      return response.data;
    } catch (error) {
      this.logger.error(`Failed to fetch index coverage: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to fetch index coverage');
    }
  }

  /**
   * Fetch sitemaps data
   */
  async fetchSitemaps(userId: string, tenantId: string, siteUrl: string) {
    this.logger.log(`Fetching GSC sitemaps for site: ${siteUrl}`);

    try {
      const client = await this.getAuthenticatedClient(userId, tenantId);

      const response = await client.get(
        `/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/sitemaps`,
      );

      return response.data.sitemap || [];
    } catch (error) {
      this.logger.error(`Failed to fetch sitemaps: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to fetch sitemaps');
    }
  }

  /**
   * Inspect URL in Google Search Console
   */
  async inspectUrl(userId: string, tenantId: string, siteUrl: string, inspectionUrl: string) {
    this.logger.log(`Inspecting URL in GSC: ${inspectionUrl}`);

    try {
      const client = await this.getAuthenticatedClient(userId, tenantId);

      const response = await client.post(
        '/urlInspection/index:inspect',
        {
          siteUrl,
          inspectionUrl,
        },
      );

      return response.data;
    } catch (error) {
      this.logger.error(`Failed to inspect URL: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to inspect URL');
    }
  }

  /**
   * Get stored GSC performance data
   */
  async getStoredPerformanceData(
    tenantId: string,
    projectId: string,
    startDate: Date,
    endDate: Date,
  ) {
    return this.gscDataRepository
      .createQueryBuilder('gsc')
      .where('gsc.tenantId = :tenantId', { tenantId })
      .andWhere('gsc.projectId = :projectId', { projectId })
      .andWhere('gsc.dataType = :dataType', { dataType: GSCDataType.PERFORMANCE })
      .andWhere('gsc.date BETWEEN :startDate AND :endDate', { startDate, endDate })
      .orderBy('gsc.date', 'DESC')
      .addOrderBy('gsc.clicks', 'DESC')
      .getMany();
  }

  /**
   * Get top queries from stored data
   */
  async getTopQueries(tenantId: string, projectId: string, limit: number = 10) {
    return this.gscDataRepository
      .createQueryBuilder('gsc')
      .select('gsc.query', 'query')
      .addSelect('SUM(gsc.clicks)', 'totalClicks')
      .addSelect('SUM(gsc.impressions)', 'totalImpressions')
      .addSelect('AVG(gsc.ctr)', 'avgCtr')
      .addSelect('AVG(gsc.position)', 'avgPosition')
      .where('gsc.tenantId = :tenantId', { tenantId })
      .andWhere('gsc.projectId = :projectId', { projectId })
      .andWhere('gsc.dataType = :dataType', { dataType: GSCDataType.PERFORMANCE })
      .andWhere('gsc.query IS NOT NULL')
      .groupBy('gsc.query')
      .orderBy('totalClicks', 'DESC')
      .limit(limit)
      .getRawMany();
  }

  /**
   * Get top pages from stored data
   */
  async getTopPages(tenantId: string, projectId: string, limit: number = 10) {
    return this.gscDataRepository
      .createQueryBuilder('gsc')
      .select('gsc.url', 'url')
      .addSelect('SUM(gsc.clicks)', 'totalClicks')
      .addSelect('SUM(gsc.impressions)', 'totalImpressions')
      .addSelect('AVG(gsc.ctr)', 'avgCtr')
      .addSelect('AVG(gsc.position)', 'avgPosition')
      .where('gsc.tenantId = :tenantId', { tenantId })
      .andWhere('gsc.projectId = :projectId', { projectId })
      .andWhere('gsc.dataType = :dataType', { dataType: GSCDataType.PERFORMANCE })
      .groupBy('gsc.url')
      .orderBy('totalClicks', 'DESC')
      .limit(limit)
      .getRawMany();
  }
}
