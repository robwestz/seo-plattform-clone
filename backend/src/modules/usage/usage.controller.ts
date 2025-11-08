import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UsageTrackingService, UsageEventType } from './usage-tracking.service';
import { UsageReportingService } from './usage-reporting.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentTenant } from '../tenant/decorators/current-tenant.decorator';

/**
 * Usage Controller
 * Provides endpoints for usage tracking and reporting
 */
@ApiTags('usage')
@Controller('usage')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsageController {
  constructor(
    private readonly usageTrackingService: UsageTrackingService,
    private readonly usageReportingService: UsageReportingService,
  ) {}

  /**
   * Track a usage event
   */
  @Post('track')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Track a usage event' })
  @ApiResponse({ status: 201, description: 'Event tracked successfully' })
  async trackEvent(
    @CurrentTenant() tenantId: string,
    @Body() body: {
      eventType: UsageEventType;
      metadata?: Record<string, any>;
      creditsUsed?: number;
    },
  ) {
    await this.usageTrackingService.trackEvent(
      tenantId,
      body.eventType,
      body.metadata,
      body.creditsUsed,
    );

    return { message: 'Event tracked successfully' };
  }

  /**
   * Get current usage
   */
  @Get('current')
  @ApiOperation({ summary: 'Get current usage' })
  @ApiResponse({ status: 200, description: 'Current usage retrieved' })
  async getCurrentUsage(
    @CurrentTenant() tenantId: string,
    @Query('period') period: 'day' | 'month' = 'month',
  ) {
    return this.usageTrackingService.getCurrentUsage(tenantId, period);
  }

  /**
   * Get usage for specific event type
   */
  @Get('type/:eventType')
  @ApiOperation({ summary: 'Get usage for specific event type' })
  @ApiResponse({ status: 200, description: 'Usage retrieved' })
  async getUsageForType(
    @CurrentTenant() tenantId: string,
    @Query() query: { eventType: UsageEventType; period?: 'day' | 'month' },
  ) {
    const usage = await this.usageTrackingService.getUsageForType(
      tenantId,
      query.eventType,
      query.period || 'month',
    );

    return { eventType: query.eventType, usage };
  }

  /**
   * Check quota for event type
   */
  @Get('quota/check/:eventType')
  @ApiOperation({ summary: 'Check if action is allowed based on quota' })
  @ApiResponse({ status: 200, description: 'Quota status retrieved' })
  async checkQuota(
    @CurrentTenant() tenantId: string,
    @Query() query: { eventType: UsageEventType },
  ) {
    const allowed = await this.usageTrackingService.checkQuota(tenantId, query.eventType);

    return { eventType: query.eventType, allowed };
  }

  /**
   * Get usage statistics
   */
  @Get('statistics')
  @ApiOperation({ summary: 'Get usage statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved' })
  async getStatistics(
    @CurrentTenant() tenantId: string,
    @Query('days') days: number = 30,
  ) {
    return this.usageTrackingService.getUsageStatistics(tenantId, days);
  }

  /**
   * Generate usage report
   */
  @Post('reports/generate')
  @ApiOperation({ summary: 'Generate usage report' })
  @ApiResponse({ status: 200, description: 'Report generated' })
  async generateReport(
    @CurrentTenant() tenantId: string,
    @Body() body: { startDate: string; endDate: string },
  ) {
    const startDate = new Date(body.startDate);
    const endDate = new Date(body.endDate);

    return this.usageReportingService.generateReport(tenantId, startDate, endDate);
  }

  /**
   * Get monthly usage report
   */
  @Get('reports/monthly/:year/:month')
  @ApiOperation({ summary: 'Get monthly usage report' })
  @ApiResponse({ status: 200, description: 'Monthly report retrieved' })
  async getMonthlyReport(
    @CurrentTenant() tenantId: string,
    @Query() query: { year: number; month: number },
  ) {
    return this.usageReportingService.generateMonthlyReport(
      tenantId,
      query.year,
      query.month,
    );
  }

  /**
   * Get cost analysis
   */
  @Get('cost-analysis')
  @ApiOperation({ summary: 'Get cost analysis' })
  @ApiResponse({ status: 200, description: 'Cost analysis retrieved' })
  async getCostAnalysis(
    @CurrentTenant() tenantId: string,
    @Query() query: { startDate?: string; endDate?: string },
  ) {
    const startDate = query.startDate
      ? new Date(query.startDate)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = query.endDate ? new Date(query.endDate) : new Date();

    return this.usageReportingService.generateCostAnalysis(tenantId, startDate, endDate);
  }

  /**
   * Get quota status
   */
  @Get('quota/status')
  @ApiOperation({ summary: 'Get quota status for all event types' })
  @ApiResponse({ status: 200, description: 'Quota status retrieved' })
  async getQuotaStatus(@CurrentTenant() tenantId: string) {
    return this.usageReportingService.generateQuotaStatus(tenantId);
  }

  /**
   * Export usage data to CSV
   */
  @Get('export/csv')
  @ApiOperation({ summary: 'Export usage data to CSV' })
  @ApiResponse({ status: 200, description: 'CSV exported' })
  async exportToCSV(
    @CurrentTenant() tenantId: string,
    @Query() query: { startDate?: string; endDate?: string },
  ) {
    const startDate = query.startDate
      ? new Date(query.startDate)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = query.endDate ? new Date(query.endDate) : new Date();

    const csv = await this.usageReportingService.exportToCSV(tenantId, startDate, endDate);

    return { csv };
  }
}

/**
 * Analytics Controller
 * Provides endpoints for business analytics and insights
 */
@ApiTags('analytics')
@Controller('analytics')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AnalyticsController {
  constructor(private readonly analyticsService: any) {}

  /**
   * Get tenant analytics
   */
  @Get('tenant')
  @ApiOperation({ summary: 'Get tenant analytics' })
  @ApiResponse({ status: 200, description: 'Analytics retrieved' })
  async getTenantAnalytics(
    @CurrentTenant() tenantId: string,
    @Query() query: { startDate?: string; endDate?: string },
  ) {
    const startDate = query.startDate
      ? new Date(query.startDate)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = query.endDate ? new Date(query.endDate) : new Date();

    return this.analyticsService.getTenantAnalytics(tenantId, startDate, endDate);
  }

  /**
   * Get churn risk
   */
  @Get('churn-risk')
  @ApiOperation({ summary: 'Get churn risk analysis' })
  @ApiResponse({ status: 200, description: 'Churn risk calculated' })
  async getChurnRisk(@CurrentTenant() tenantId: string) {
    return this.analyticsService.calculateChurnRisk(tenantId);
  }

  /**
   * Get product usage
   */
  @Get('product-usage')
  @ApiOperation({ summary: 'Get product usage analytics' })
  @ApiResponse({ status: 200, description: 'Product usage retrieved' })
  async getProductUsage(@Query('days') days: number = 30) {
    return this.analyticsService.getProductUsageAnalytics(days);
  }

  /**
   * Get LTV
   */
  @Get('ltv')
  @ApiOperation({ summary: 'Get customer lifetime value' })
  @ApiResponse({ status: 200, description: 'LTV calculated' })
  async getLTV(@CurrentTenant() tenantId: string) {
    const ltv = await this.analyticsService.calculateLTV(tenantId);
    return { tenantId, ltv };
  }
}
