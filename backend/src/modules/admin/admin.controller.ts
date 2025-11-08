import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Query,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiSecurity } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { AdminGuard } from '../../common/guards/admin.guard';
import { FeatureFlagDto } from './dto/feature-flag.dto';

/**
 * Admin Controller
 * Provides admin-only endpoints for system management
 */
@ApiTags('admin')
@ApiBearerAuth()
@ApiSecurity('admin')
@Controller('admin')
@UseGuards(AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  /**
   * Get system statistics
   */
  @Get('stats')
  @ApiOperation({ summary: 'Get system-wide statistics' })
  @ApiResponse({ status: 200, description: 'System statistics' })
  async getSystemStats() {
    return this.adminService.getSystemStats();
  }

  /**
   * Get system health
   */
  @Get('health')
  @ApiOperation({ summary: 'Get system health status' })
  @ApiResponse({ status: 200, description: 'System health' })
  async getSystemHealth() {
    return this.adminService.getSystemHealth();
  }

  /**
   * Get all tenants
   */
  @Get('tenants')
  @ApiOperation({ summary: 'Get all tenants with pagination' })
  @ApiResponse({ status: 200, description: 'List of tenants' })
  async getAllTenants(@Query('page') page = 1, @Query('limit') limit = 50) {
    return this.adminService.getAllTenants(Number(page), Number(limit));
  }

  /**
   * Get tenant details
   */
  @Get('tenants/:id')
  @ApiOperation({ summary: 'Get detailed tenant information' })
  @ApiResponse({ status: 200, description: 'Tenant details' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  async getTenantDetails(@Param('id') tenantId: string) {
    return this.adminService.getTenantDetails(tenantId);
  }

  /**
   * Suspend tenant
   */
  @Post('tenants/:id/suspend')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Suspend a tenant' })
  @ApiResponse({ status: 200, description: 'Tenant suspended' })
  async suspendTenant(@Param('id') tenantId: string, @Body('reason') reason: string) {
    await this.adminService.suspendTenant(tenantId, reason);
    return { message: 'Tenant suspended successfully' };
  }

  /**
   * Reactivate tenant
   */
  @Post('tenants/:id/reactivate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reactivate a suspended tenant' })
  @ApiResponse({ status: 200, description: 'Tenant reactivated' })
  async reactivateTenant(@Param('id') tenantId: string) {
    await this.adminService.reactivateTenant(tenantId);
    return { message: 'Tenant reactivated successfully' };
  }

  /**
   * Get revenue metrics
   */
  @Get('revenue')
  @ApiOperation({ summary: 'Get revenue metrics' })
  @ApiResponse({ status: 200, description: 'Revenue metrics' })
  async getRevenueMetrics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    return this.adminService.getRevenueMetrics(start, end);
  }

  /**
   * Get feature flags
   */
  @Get('feature-flags')
  @ApiOperation({ summary: 'Get all feature flags' })
  @ApiResponse({ status: 200, description: 'Feature flags' })
  async getFeatureFlags() {
    return this.adminService.getFeatureFlags();
  }

  /**
   * Set feature flag
   */
  @Put('feature-flags')
  @ApiOperation({ summary: 'Update feature flag' })
  @ApiResponse({ status: 200, description: 'Feature flag updated' })
  async setFeatureFlag(@Body() featureFlagDto: FeatureFlagDto) {
    this.adminService.setFeatureFlag(featureFlagDto.key, featureFlagDto.enabled);
    return { message: 'Feature flag updated successfully' };
  }

  /**
   * Get recent activity
   */
  @Get('activity')
  @ApiOperation({ summary: 'Get recent system activity' })
  @ApiResponse({ status: 200, description: 'Recent activity' })
  async getRecentActivity(@Query('limit') limit = 50) {
    return this.adminService.getRecentActivity(Number(limit));
  }
}
