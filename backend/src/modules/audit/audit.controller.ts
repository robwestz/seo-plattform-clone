import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { AuditService } from './audit.service';
import { CreateAuditDto } from './dto/create-audit.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

/**
 * Audit Controller
 * Handles technical SEO audits
 */
@Controller('projects/:projectId/audits')
@UseGuards(JwtAuthGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  /**
   * Create and run a new audit
   * POST /projects/:projectId/audits
   */
  @Post()
  create(
    @Param('projectId') projectId: string,
    @Body() createAuditDto: CreateAuditDto,
  ) {
    return this.auditService.create(projectId, createAuditDto);
  }

  /**
   * Get all audits for a project
   * GET /projects/:projectId/audits
   */
  @Get()
  findAll(@Param('projectId') projectId: string) {
    return this.auditService.findAll(projectId);
  }

  /**
   * Get audit statistics
   * GET /projects/:projectId/audits/statistics
   */
  @Get('statistics')
  getStatistics(@Param('projectId') projectId: string) {
    return this.auditService.getStatistics(projectId);
  }

  /**
   * Get a specific audit with issues
   * GET /projects/:projectId/audits/:id
   */
  @Get(':id')
  findOne(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
  ) {
    return this.auditService.findOne(id, projectId);
  }
}
