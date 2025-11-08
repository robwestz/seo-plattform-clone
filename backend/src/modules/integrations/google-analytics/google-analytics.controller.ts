import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { GoogleAnalyticsService } from './google-analytics.service';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { CurrentTenant } from '../../../common/decorators/current-tenant.decorator';
import { GAQueryDto, GARealTimeDto } from './dto/ga-query.dto';

/**
 * Google Analytics Controller
 * API endpoints for Google Analytics 4 integration
 */
@Controller('integrations/google-analytics')
export class GoogleAnalyticsController {
  private readonly logger = new Logger(GoogleAnalyticsController.name);

  constructor(private readonly gaService: GoogleAnalyticsService) {}

  /**
   * List all GA4 properties
   * GET /integrations/google-analytics/properties
   */
  @Get('properties')
  async listProperties(
    @CurrentUser('id') userId: string,
    @CurrentTenant('id') tenantId: string,
  ) {
    this.logger.log('Listing GA4 properties');

    const properties = await this.gaService.listProperties(userId, tenantId);

    return {
      success: true,
      properties,
    };
  }

  /**
   * Run GA4 report
   * POST /integrations/google-analytics/report
   */
  @Post('report')
  async runReport(
    @CurrentUser('id') userId: string,
    @CurrentTenant('id') tenantId: string,
    @Body() query: GAQueryDto & { projectId: string },
  ) {
    this.logger.log(`Running GA4 report for property: ${query.propertyId}`);

    const result = await this.gaService.runReport(
      userId,
      tenantId,
      query.projectId,
      query,
    );

    return {
      success: true,
      ...result,
    };
  }

  /**
   * Get real-time data
   * POST /integrations/google-analytics/realtime
   */
  @Post('realtime')
  async getRealTimeData(
    @CurrentUser('id') userId: string,
    @CurrentTenant('id') tenantId: string,
    @Body() query: GARealTimeDto,
  ) {
    this.logger.log(`Fetching real-time data for property: ${query.propertyId}`);

    const data = await this.gaService.getRealTimeData(userId, tenantId, query);

    return {
      success: true,
      data,
    };
  }

  /**
   * Get stored analytics data
   * GET /integrations/google-analytics/stored
   */
  @Get('stored')
  async getStoredData(
    @CurrentTenant('id') tenantId: string,
    @Query('projectId') projectId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    this.logger.log('Getting stored GA4 data');

    const data = await this.gaService.getStoredData(
      tenantId,
      projectId,
      new Date(startDate),
      new Date(endDate),
    );

    return {
      success: true,
      data,
    };
  }

  /**
   * Get top pages
   * GET /integrations/google-analytics/pages/top
   */
  @Get('pages/top')
  async getTopPages(
    @CurrentTenant('id') tenantId: string,
    @Query('projectId') projectId: string,
    @Query('limit') limit?: number,
  ) {
    this.logger.log('Getting top pages from GA4 data');

    const pages = await this.gaService.getTopPages(
      tenantId,
      projectId,
      limit ? parseInt(limit.toString()) : 10,
    );

    return {
      success: true,
      pages,
    };
  }

  /**
   * Get traffic sources
   * GET /integrations/google-analytics/traffic-sources
   */
  @Get('traffic-sources')
  async getTrafficSources(
    @CurrentTenant('id') tenantId: string,
    @Query('projectId') projectId: string,
  ) {
    this.logger.log('Getting traffic sources from GA4 data');

    const sources = await this.gaService.getTrafficSources(tenantId, projectId);

    return {
      success: true,
      sources,
    };
  }

  /**
   * Get conversions summary
   * GET /integrations/google-analytics/conversions
   */
  @Get('conversions')
  async getConversionsSummary(
    @CurrentTenant('id') tenantId: string,
    @Query('projectId') projectId: string,
  ) {
    this.logger.log('Getting conversions summary from GA4 data');

    const conversions = await this.gaService.getConversionsSummary(tenantId, projectId);

    return {
      success: true,
      conversions,
    };
  }
}
