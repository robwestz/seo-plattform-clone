import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { GoogleSearchConsoleService } from './google-search-console.service';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { CurrentTenant } from '../../../common/decorators/current-tenant.decorator';
import {
  GSCPerformanceQueryDto,
  GSCIndexCoverageDto,
  GSCSitemapsDto,
  GSCUrlInspectionDto,
} from './dto/gsc-performance.dto';

/**
 * Google Search Console Controller
 * API endpoints for Google Search Console integration
 */
@Controller('integrations/google-search-console')
export class GoogleSearchConsoleController {
  private readonly logger = new Logger(GoogleSearchConsoleController.name);

  constructor(private readonly gscService: GoogleSearchConsoleService) {}

  /**
   * List all GSC sites/properties
   * GET /integrations/google-search-console/sites
   */
  @Get('sites')
  async listSites(
    @CurrentUser('id') userId: string,
    @CurrentTenant('id') tenantId: string,
  ) {
    this.logger.log('Listing GSC sites');

    const sites = await this.gscService.listSites(userId, tenantId);

    return {
      success: true,
      sites,
    };
  }

  /**
   * Fetch performance data from GSC
   * POST /integrations/google-search-console/performance
   */
  @Post('performance')
  async fetchPerformance(
    @CurrentUser('id') userId: string,
    @CurrentTenant('id') tenantId: string,
    @Body() query: GSCPerformanceQueryDto & { projectId: string },
  ) {
    this.logger.log(`Fetching GSC performance data for site: ${query.siteUrl}`);

    const result = await this.gscService.fetchPerformanceData(
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
   * Get stored performance data
   * GET /integrations/google-search-console/performance/stored
   */
  @Get('performance/stored')
  async getStoredPerformance(
    @CurrentTenant('id') tenantId: string,
    @Query('projectId') projectId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    this.logger.log('Getting stored GSC performance data');

    const data = await this.gscService.getStoredPerformanceData(
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
   * Get top queries
   * GET /integrations/google-search-console/queries/top
   */
  @Get('queries/top')
  async getTopQueries(
    @CurrentTenant('id') tenantId: string,
    @Query('projectId') projectId: string,
    @Query('limit') limit?: number,
  ) {
    this.logger.log('Getting top queries from GSC data');

    const queries = await this.gscService.getTopQueries(
      tenantId,
      projectId,
      limit ? parseInt(limit.toString()) : 10,
    );

    return {
      success: true,
      queries,
    };
  }

  /**
   * Get top pages
   * GET /integrations/google-search-console/pages/top
   */
  @Get('pages/top')
  async getTopPages(
    @CurrentTenant('id') tenantId: string,
    @Query('projectId') projectId: string,
    @Query('limit') limit?: number,
  ) {
    this.logger.log('Getting top pages from GSC data');

    const pages = await this.gscService.getTopPages(
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
   * Fetch index coverage
   * POST /integrations/google-search-console/index-coverage
   */
  @Post('index-coverage')
  async fetchIndexCoverage(
    @CurrentUser('id') userId: string,
    @CurrentTenant('id') tenantId: string,
    @Body() dto: GSCIndexCoverageDto,
  ) {
    this.logger.log(`Fetching index coverage for site: ${dto.siteUrl}`);

    const coverage = await this.gscService.fetchIndexCoverage(userId, tenantId, dto.siteUrl);

    return {
      success: true,
      coverage,
    };
  }

  /**
   * Fetch sitemaps
   * POST /integrations/google-search-console/sitemaps
   */
  @Post('sitemaps')
  async fetchSitemaps(
    @CurrentUser('id') userId: string,
    @CurrentTenant('id') tenantId: string,
    @Body() dto: GSCSitemapsDto,
  ) {
    this.logger.log(`Fetching sitemaps for site: ${dto.siteUrl}`);

    const sitemaps = await this.gscService.fetchSitemaps(userId, tenantId, dto.siteUrl);

    return {
      success: true,
      sitemaps,
    };
  }

  /**
   * Inspect URL
   * POST /integrations/google-search-console/url-inspection
   */
  @Post('url-inspection')
  async inspectUrl(
    @CurrentUser('id') userId: string,
    @CurrentTenant('id') tenantId: string,
    @Body() dto: GSCUrlInspectionDto,
  ) {
    this.logger.log(`Inspecting URL: ${dto.inspectionUrl}`);

    const inspection = await this.gscService.inspectUrl(
      userId,
      tenantId,
      dto.siteUrl,
      dto.inspectionUrl,
    );

    return {
      success: true,
      inspection,
    };
  }
}
