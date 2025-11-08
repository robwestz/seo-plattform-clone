import { Controller, Post, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { EventsService } from './events.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '../../database/entities/user-tenant.entity';

/**
 * Events Controller
 * Provides endpoints for triggering async events
 */
@ApiTags('Events')
@Controller('events')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  /**
   * Request a crawl for a project
   * @param projectId - Project ID
   * @param tenantId - Current tenant ID
   * @param options - Crawl options
   * @returns Success message
   */
  @Post('crawl')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MEMBER)
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Request a crawl for a project' })
  @ApiResponse({ status: 202, description: 'Crawl request accepted' })
  async requestCrawl(
    @Body('projectId') projectId: string,
    @CurrentTenant() tenantId: string,
    @Body('options') options?: any,
  ) {
    await this.eventsService.publishCrawlRequested(projectId, tenantId, options);
    return {
      message: 'Crawl request accepted and queued for processing',
      projectId,
    };
  }

  /**
   * Request an audit for a project
   * @param projectId - Project ID
   * @param tenantId - Current tenant ID
   * @param auditType - Type of audit to run
   * @returns Success message
   */
  @Post('audit')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MEMBER)
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Request an audit for a project' })
  @ApiResponse({ status: 202, description: 'Audit request accepted' })
  async requestAudit(
    @Body('projectId') projectId: string,
    @CurrentTenant() tenantId: string,
    @Body('auditType') auditType: string,
  ) {
    await this.eventsService.publishAuditRequested(projectId, tenantId, auditType);
    return {
      message: 'Audit request accepted and queued for processing',
      projectId,
      auditType,
    };
  }

  /**
   * Request a rank check for a project
   * @param projectId - Project ID
   * @param tenantId - Current tenant ID
   * @param keywords - Keywords to check
   * @returns Success message
   */
  @Post('rank-check')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.MEMBER)
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Request a rank check for a project' })
  @ApiResponse({ status: 202, description: 'Rank check request accepted' })
  async requestRankCheck(
    @Body('projectId') projectId: string,
    @CurrentTenant() tenantId: string,
    @Body('keywords') keywords: string[],
  ) {
    await this.eventsService.publishRankCheckRequested(projectId, tenantId, keywords);
    return {
      message: 'Rank check request accepted and queued for processing',
      projectId,
      keywordCount: keywords.length,
    };
  }
}
