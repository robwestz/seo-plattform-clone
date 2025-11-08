import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UsageService } from './usage.service';
import { RecordUsageDto } from './dto/record-usage.dto';
import { UsageReportDto } from './dto/usage-report.dto';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

/**
 * Usage Controller
 * Tracks and reports usage events
 */
@ApiTags('usage')
@ApiBearerAuth()
@Controller('usage')
export class UsageController {
  constructor(private readonly usageService: UsageService) {}

  /**
   * Record a usage event
   */
  @Post('record')
  @ApiOperation({ summary: 'Record a usage event' })
  @ApiResponse({ status: 201, description: 'Usage event recorded' })
  async recordEvent(
    @CurrentTenant() tenantId: string,
    @CurrentUser() userId: string,
    @Body() recordDto: RecordUsageDto,
  ) {
    return this.usageService.recordEvent(tenantId, userId, recordDto);
  }

  /**
   * Get usage statistics
   */
  @Get('stats')
  @ApiOperation({ summary: 'Get usage statistics' })
  @ApiResponse({ status: 200, description: 'Usage statistics' })
  async getStats(@CurrentTenant() tenantId: string, @Query('days') days = 30) {
    return this.usageService.getUsageStats(tenantId, Number(days));
  }

  /**
   * Get current month API calls
   */
  @Get('api-calls')
  @ApiOperation({ summary: 'Get current month API calls count' })
  @ApiResponse({ status: 200, description: 'API calls count' })
  async getApiCalls(@CurrentTenant() tenantId: string) {
    const count = await this.usageService.getApiCallsThisMonth(tenantId);
    return { count, month: new Date().toISOString().substring(0, 7) };
  }

  /**
   * Get usage report
   */
  @Get('report')
  @ApiOperation({ summary: 'Get detailed usage report' })
  @ApiResponse({ status: 200, description: 'Usage report' })
  async getReport(@CurrentTenant() tenantId: string, @Query() reportDto: UsageReportDto) {
    return this.usageService.getReport(tenantId, reportDto);
  }
}
