import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { BacklinkService } from './backlink.service';
import { CreateBacklinkDto } from './dto/create-backlink.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

/**
 * Backlink Controller
 * Handles backlink analysis and management
 */
@Controller('projects/:projectId/backlinks')
@UseGuards(JwtAuthGuard)
export class BacklinkController {
  constructor(private readonly backlinkService: BacklinkService) {}

  /**
   * Create a new backlink
   * POST /projects/:projectId/backlinks
   */
  @Post()
  create(
    @Param('projectId') projectId: string,
    @Body() createBacklinkDto: CreateBacklinkDto,
  ) {
    return this.backlinkService.create(createBacklinkDto, projectId);
  }

  /**
   * Get all backlinks
   * GET /projects/:projectId/backlinks
   */
  @Get()
  findAll(@Param('projectId') projectId: string) {
    return this.backlinkService.findAll(projectId);
  }

  /**
   * Get backlink statistics
   * GET /projects/:projectId/backlinks/statistics
   */
  @Get('statistics')
  getStatistics(@Param('projectId') projectId: string) {
    return this.backlinkService.getStatistics(projectId);
  }
}
