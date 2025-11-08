import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService, TenantQuery } from './admin.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../user/entities/user.entity';

/**
 * Admin Controller
 * Provides administrative endpoints for platform management
 * 
 * NOTE: All endpoints require admin role
 */
@ApiTags('admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly analyticsService: AnalyticsService,
  ) {}

  /**
   * List all tenants with pagination and filtering
   */
  @Get('tenants')
  @ApiOperation({ summary: 'List all tenants' })
  @ApiResponse({ status: 200, description: 'Tenants retrieved successfully' })
  async listTenants(@Query() query: TenantQuery) {
    return this.adminService.listTenants(query);
  }

  /**
   * Get detailed tenant information
   */
  @Get('tenants/:tenantId')
  @ApiOperation({ summary: 'Get tenant details' })
  @ApiResponse({ status: 200, description: 'Tenant details retrieved' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  async getTenantDetails(@Param('tenantId') tenantId: string) {
    return this.adminService.getTenantDetails(tenantId);
  }

  /**
   * Disable a tenant
   */
  @Post('tenants/:tenantId/disable')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Disable a tenant' })
  @ApiResponse({ status: 200, description: 'Tenant disabled successfully' })
  async disableTenant(
    @Param('tenantId') tenantId: string,
    @Body() body: { reason?: string },
  ) {
    await this.adminService.disableTenant(tenantId, body.reason);
    return { message: 'Tenant disabled successfully' };
  }

  /**
   * Enable a tenant
   */
  @Post('tenants/:tenantId/enable')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Enable a tenant' })
  @ApiResponse({ status: 200, description: 'Tenant enabled successfully' })
  async enableTenant(@Param('tenantId') tenantId: string) {
    await this.adminService.enableTenant(tenantId);
    return { message: 'Tenant enabled successfully' };
  }

  /**
   * Get system health
   */
  @Get('system/health')
  @ApiOperation({ summary: 'Get system health status' })
  @ApiResponse({ status: 200, description: 'System health retrieved' })
  async getSystemHealth() {
    return this.adminService.getSystemHealth();
  }

  /**
   * Get platform statistics
   */
  @Get('stats')
  @ApiOperation({ summary: 'Get platform statistics' })
  @ApiResponse({ status: 200, description: 'Platform stats retrieved' })
  async getPlatformStats() {
    return this.adminService.getPlatformStats();
  }

  /**
   * Get revenue analytics
   */
  @Get('analytics/revenue')
  @ApiOperation({ summary: 'Get revenue analytics' })
  @ApiResponse({ status: 200, description: 'Revenue analytics retrieved' })
  async getRevenueAnalytics(@Query('period') period: 'month' | 'quarter' | 'year' = 'month') {
    return this.adminService.getRevenueAnalytics(period);
  }

  /**
   * Get churn risk analysis for a tenant
   */
  @Get('tenants/:tenantId/churn-risk')
  @ApiOperation({ summary: 'Get churn risk analysis' })
  @ApiResponse({ status: 200, description: 'Churn risk analysis retrieved' })
  async getChurnRisk(@Param('tenantId') tenantId: string) {
    return this.analyticsService.calculateChurnRisk(tenantId);
  }

  /**
   * Get tenant analytics
   */
  @Get('tenants/:tenantId/analytics')
  @ApiOperation({ summary: 'Get tenant analytics' })
  @ApiResponse({ status: 200, description: 'Tenant analytics retrieved' })
  async getTenantAnalytics(
    @Param('tenantId') tenantId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    return this.analyticsService.getTenantAnalytics(tenantId, start, end);
  }

  /**
   * Get feature flags
   */
  @Get('feature-flags')
  @ApiOperation({ summary: 'Get all feature flags' })
  @ApiResponse({ status: 200, description: 'Feature flags retrieved' })
  async getFeatureFlags() {
    return this.adminService.getFeatureFlags();
  }

  /**
   * Update feature flag
   */
  @Put('feature-flags/:flagName')
  @ApiOperation({ summary: 'Update a feature flag' })
  @ApiResponse({ status: 200, description: 'Feature flag updated' })
  async updateFeatureFlag(
    @Param('flagName') flagName: string,
    @Body() updates: any,
  ) {
    return this.adminService.updateFeatureFlag(flagName, updates);
  }

  /**
   * Check if feature is enabled for tenant
   */
  @Get('feature-flags/:flagName/check')
  @ApiOperation({ summary: 'Check if feature is enabled' })
  @ApiResponse({ status: 200, description: 'Feature flag status retrieved' })
  async checkFeature(
    @Param('flagName') flagName: string,
    @Query('tenantId') tenantId?: string,
  ) {
    const enabled = await this.adminService.isFeatureEnabled(flagName, tenantId);
    return { flagName, enabled };
  }

  /**
   * Get cohort analysis
   */
  @Get('analytics/cohorts/:cohortMonth')
  @ApiOperation({ summary: 'Get cohort analysis' })
  @ApiResponse({ status: 200, description: 'Cohort analysis retrieved' })
  async getCohortAnalysis(@Param('cohortMonth') cohortMonth: string) {
    return this.analyticsService.performCohortAnalysis(cohortMonth);
  }

  /**
   * Get product usage analytics
   */
  @Get('analytics/product-usage')
  @ApiOperation({ summary: 'Get product usage analytics' })
  @ApiResponse({ status: 200, description: 'Product usage analytics retrieved' })
  async getProductUsage(@Query('days') days: number = 30) {
    return this.analyticsService.getProductUsageAnalytics(days);
  }

  /**
   * Calculate LTV for tenant
   */
  @Get('tenants/:tenantId/ltv')
  @ApiOperation({ summary: 'Calculate customer lifetime value' })
  @ApiResponse({ status: 200, description: 'LTV calculated' })
  async calculateLTV(@Param('tenantId') tenantId: string) {
    const ltv = await this.analyticsService.calculateLTV(tenantId);
    return { tenantId, ltv };
  }

  /**
   * Force subscription renewal
   */
  @Post('tenants/:tenantId/force-renewal')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Force subscription renewal (testing)' })
  @ApiResponse({ status: 200, description: 'Renewal forced' })
  async forceRenewal(@Param('tenantId') tenantId: string) {
    // This would trigger billing cycle
    return { message: 'Renewal forced for tenant' };
  }

  /**
   * Export tenant data
   */
  @Get('tenants/:tenantId/export')
  @ApiOperation({ summary: 'Export tenant data (GDPR)' })
  @ApiResponse({ status: 200, description: 'Data exported' })
  async exportTenantData(@Param('tenantId') tenantId: string) {
    // Would export all tenant data
    return { message: 'Export initiated', tenantId };
  }

  /**
   * Delete tenant data (GDPR)
   */
  @Delete('tenants/:tenantId/data')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete tenant data (GDPR)' })
  @ApiResponse({ status: 200, description: 'Data deletion initiated' })
  async deleteTenantData(@Param('tenantId') tenantId: string) {
    // Would soft delete and queue for permanent deletion
    return { message: 'Data deletion initiated', tenantId };
  }

  /**
   * Impersonate tenant (for support)
   */
  @Post('tenants/:tenantId/impersonate')
  @ApiOperation({ summary: 'Generate impersonation token' })
  @ApiResponse({ status: 200, description: 'Impersonation token generated' })
  async impersonate(@Param('tenantId') tenantId: string) {
    // Would generate special token for support access
    // IMPORTANT: Should log this action for audit
    return {
      message: 'Impersonation token generated',
      token: 'impersonation-token-here',
      expiresIn: '1h',
    };
  }

  /**
   * Send announcement to tenants
   */
  @Post('announcements')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Send announcement to tenants' })
  @ApiResponse({ status: 201, description: 'Announcement sent' })
  async sendAnnouncement(
    @Body() body: {
      title: string;
      message: string;
      targetPlans?: string[];
      targetTenants?: string[];
      sendEmail?: boolean;
    },
  ) {
    // Would send announcement via in-app and/or email
    return {
      message: 'Announcement sent',
      recipients: 0, // Would calculate actual recipients
    };
  }

  /**
   * Get audit logs
   */
  @Get('audit-logs')
  @ApiOperation({ summary: 'Get audit logs' })
  @ApiResponse({ status: 200, description: 'Audit logs retrieved' })
  async getAuditLogs(
    @Query('tenantId') tenantId?: string,
    @Query('action') action?: string,
    @Query('limit') limit: number = 100,
  ) {
    // Would retrieve audit logs
    return {
      logs: [],
      total: 0,
    };
  }

  /**
   * Run database migrations (dangerous!)
   */
  @Post('maintenance/migrate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Run database migrations' })
  @ApiResponse({ status: 200, description: 'Migrations completed' })
  async runMigrations() {
    // Would run pending migrations
    // IMPORTANT: Should require additional confirmation
    return {
      message: 'Migrations completed',
      migrationsRun: [],
    };
  }

  /**
   * Clear caches
   */
  @Post('maintenance/clear-cache')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Clear system caches' })
  @ApiResponse({ status: 200, description: 'Caches cleared' })
  async clearCaches(@Body() body: { cacheType?: string }) {
    // Would clear Redis caches
    return {
      message: 'Caches cleared',
      cacheType: body.cacheType || 'all',
    };
  }
}
