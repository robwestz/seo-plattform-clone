import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OAuthService } from '../oauth/oauth.service';
import { OAuthProvider } from '../oauth/entities/oauth-connection.entity';
import { GAData, GADataType } from './entities/ga-data.entity';
import { GAQueryDto, GARealTimeDto } from './dto/ga-query.dto';
import axios from 'axios';

/**
 * Google Analytics Service
 * Handles integration with Google Analytics 4 API
 */
@Injectable()
export class GoogleAnalyticsService {
  private readonly logger = new Logger(GoogleAnalyticsService.name);
  private readonly GA_API_BASE = 'https://analyticsdata.googleapis.com/v1beta';
  private readonly GA_ADMIN_API_BASE = 'https://analyticsadmin.googleapis.com/v1beta';

  constructor(
    @InjectRepository(GAData)
    private gaDataRepository: Repository<GAData>,
    private oauthService: OAuthService,
  ) {}

  /**
   * Get authenticated API client
   */
  private async getAuthenticatedClient(userId: string, tenantId: string) {
    const connection = await this.oauthService.getConnection(
      userId,
      tenantId,
      OAuthProvider.GOOGLE_ANALYTICS,
    );

    return axios.create({
      baseURL: this.GA_API_BASE,
      headers: {
        Authorization: `Bearer ${connection.accessToken}`,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Get authenticated admin API client
   */
  private async getAdminClient(userId: string, tenantId: string) {
    const connection = await this.oauthService.getConnection(
      userId,
      tenantId,
      OAuthProvider.GOOGLE_ANALYTICS,
    );

    return axios.create({
      baseURL: this.GA_ADMIN_API_BASE,
      headers: {
        Authorization: `Bearer ${connection.accessToken}`,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * List all GA4 properties
   */
  async listProperties(userId: string, tenantId: string) {
    this.logger.log(`Listing GA4 properties for user: ${userId}`);

    try {
      const client = await this.getAdminClient(userId, tenantId);
      const response = await client.get('/accountSummaries');

      return response.data.accountSummaries || [];
    } catch (error) {
      this.logger.error(`Failed to list GA4 properties: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to fetch GA4 properties');
    }
  }

  /**
   * Run GA4 report query
   */
  async runReport(
    userId: string,
    tenantId: string,
    projectId: string,
    query: GAQueryDto,
  ) {
    this.logger.log(`Running GA4 report for property: ${query.propertyId}`);

    try {
      const client = await this.getAuthenticatedClient(userId, tenantId);

      const requestBody = {
        dateRanges: [
          {
            startDate: query.startDate,
            endDate: query.endDate,
          },
        ],
        dimensions: (query.dimensions || ['pagePath', 'pageTitle']).map(name => ({ name })),
        metrics: (query.metrics || ['screenPageViews', 'sessions', 'totalUsers']).map(name => ({ name })),
        limit: query.limit || 10000,
      };

      const response = await client.post(
        `/properties/${query.propertyId}:runReport`,
        requestBody,
      );

      const rows = response.data.rows || [];

      // Store data in database
      const gaDataEntries = rows.map(row => {
        const dimensionValues = row.dimensionValues || [];
        const metricValues = row.metricValues || [];

        return this.gaDataRepository.create({
          tenantId,
          projectId,
          dataType: GADataType.PAGE_VIEWS,
          propertyId: query.propertyId,
          date: new Date(query.startDate),
          pagePath: dimensionValues[0]?.value || null,
          pageTitle: dimensionValues[1]?.value || null,
          pageViews: parseInt(metricValues[0]?.value || '0'),
          sessions: parseInt(metricValues[1]?.value || '0'),
          users: parseInt(metricValues[2]?.value || '0'),
          metadata: {
            dimensions: dimensionValues,
            metrics: metricValues,
          },
        });
      });

      if (gaDataEntries.length > 0) {
        await this.gaDataRepository
          .createQueryBuilder()
          .insert()
          .into(GAData)
          .values(gaDataEntries)
          .orUpdate(['pageViews', 'sessions', 'users', 'updatedAt'], ['tenantId', 'projectId', 'propertyId', 'pagePath', 'date'])
          .execute();
      }

      this.logger.log(`Stored ${gaDataEntries.length} GA4 records`);

      return {
        totalRows: rows.length,
        data: response.data,
      };
    } catch (error) {
      this.logger.error(`Failed to run GA4 report: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to run GA4 report');
    }
  }

  /**
   * Get real-time data from GA4
   */
  async getRealTimeData(userId: string, tenantId: string, query: GARealTimeDto) {
    this.logger.log(`Fetching real-time data for property: ${query.propertyId}`);

    try {
      const client = await this.getAuthenticatedClient(userId, tenantId);

      const requestBody = {
        dimensions: (query.dimensions || ['unifiedScreenName']).map(name => ({ name })),
        metrics: (query.metrics || ['activeUsers']).map(name => ({ name })),
      };

      const response = await client.post(
        `/properties/${query.propertyId}:runRealtimeReport`,
        requestBody,
      );

      return response.data;
    } catch (error) {
      this.logger.error(`Failed to fetch real-time data: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to fetch real-time data');
    }
  }

  /**
   * Get stored analytics data
   */
  async getStoredData(
    tenantId: string,
    projectId: string,
    startDate: Date,
    endDate: Date,
  ) {
    return this.gaDataRepository
      .createQueryBuilder('ga')
      .where('ga.tenantId = :tenantId', { tenantId })
      .andWhere('ga.projectId = :projectId', { projectId })
      .andWhere('ga.date BETWEEN :startDate AND :endDate', { startDate, endDate })
      .orderBy('ga.date', 'DESC')
      .addOrderBy('ga.pageViews', 'DESC')
      .getMany();
  }

  /**
   * Get top pages by page views
   */
  async getTopPages(tenantId: string, projectId: string, limit: number = 10) {
    return this.gaDataRepository
      .createQueryBuilder('ga')
      .select('ga.pagePath', 'pagePath')
      .addSelect('ga.pageTitle', 'pageTitle')
      .addSelect('SUM(ga.pageViews)', 'totalPageViews')
      .addSelect('SUM(ga.sessions)', 'totalSessions')
      .addSelect('SUM(ga.users)', 'totalUsers')
      .where('ga.tenantId = :tenantId', { tenantId })
      .andWhere('ga.projectId = :projectId', { projectId })
      .andWhere('ga.pagePath IS NOT NULL')
      .groupBy('ga.pagePath')
      .addGroupBy('ga.pageTitle')
      .orderBy('totalPageViews', 'DESC')
      .limit(limit)
      .getRawMany();
  }

  /**
   * Get traffic sources
   */
  async getTrafficSources(tenantId: string, projectId: string) {
    return this.gaDataRepository
      .createQueryBuilder('ga')
      .select('ga.source', 'source')
      .addSelect('ga.medium', 'medium')
      .addSelect('SUM(ga.sessions)', 'totalSessions')
      .addSelect('SUM(ga.users)', 'totalUsers')
      .where('ga.tenantId = :tenantId', { tenantId })
      .andWhere('ga.projectId = :projectId', { projectId })
      .andWhere('ga.source IS NOT NULL')
      .groupBy('ga.source')
      .addGroupBy('ga.medium')
      .orderBy('totalSessions', 'DESC')
      .getRawMany();
  }

  /**
   * Get conversions summary
   */
  async getConversionsSummary(tenantId: string, projectId: string) {
    return this.gaDataRepository
      .createQueryBuilder('ga')
      .select('ga.date', 'date')
      .addSelect('SUM(ga.conversions)', 'totalConversions')
      .addSelect('SUM(ga.sessions)', 'totalSessions')
      .where('ga.tenantId = :tenantId', { tenantId })
      .andWhere('ga.projectId = :projectId', { projectId })
      .andWhere('ga.dataType = :dataType', { dataType: GADataType.CONVERSIONS })
      .groupBy('ga.date')
      .orderBy('ga.date', 'DESC')
      .getRawMany();
  }
}
