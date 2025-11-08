import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { AnalyticsQueryDto } from './dto/analytics-query.dto';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { AdminGuard } from '../../common/guards/admin.guard';

/**
 * Analytics Controller
 * Provides business analytics and metrics
 */
@ApiTags('analytics')
@ApiBearerAuth()
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  /**
   * Get revenue analytics (Admin only)
   */
  @Get('revenue')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Get revenue analytics' })
  @ApiResponse({ status: 200, description: 'Revenue analytics' })
  async getRevenueAnalytics(@Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getRevenueAnalytics(query);
  }

  /**
   * Get growth metrics (Admin only)
   */
  @Get('growth')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Get growth metrics' })
  @ApiResponse({ status: 200, description: 'Growth metrics' })
  async getGrowthMetrics(@Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getGrowthMetrics(query);
  }

  /**
   * Get subscription analytics (Admin only)
   */
  @Get('subscriptions')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Get subscription analytics' })
  @ApiResponse({ status: 200, description: 'Subscription analytics' })
  async getSubscriptionAnalytics(@Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getSubscriptionAnalytics(query);
  }

  /**
   * Get usage analytics for tenant
   */
  @Get('usage')
  @ApiOperation({ summary: 'Get usage analytics for tenant' })
  @ApiResponse({ status: 200, description: 'Usage analytics' })
  async getUsageAnalytics(@CurrentTenant() tenantId: string, @Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getUsageAnalytics(tenantId, query);
  }

  /**
   * Get churn risk for tenant
   */
  @Get('churn-risk')
  @ApiOperation({ summary: 'Get churn risk score for tenant' })
  @ApiResponse({ status: 200, description: 'Churn risk analysis' })
  async getChurnRisk(@CurrentTenant() tenantId: string) {
    return this.analyticsService.calculateChurnRisk(tenantId);
  }
}
