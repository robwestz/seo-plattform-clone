import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { CompetitorService } from './competitor.service';
import { CreateCompetitorDto } from './dto/create-competitor.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

/**
 * Competitor Controller
 * Handles competitor analysis and gap detection
 */
@Controller('projects/:projectId/competitors')
@UseGuards(JwtAuthGuard)
export class CompetitorController {
  constructor(private readonly competitorService: CompetitorService) {}

  /**
   * Add a new competitor
   * POST /projects/:projectId/competitors
   */
  @Post()
  create(
    @Param('projectId') projectId: string,
    @Body() createCompetitorDto: CreateCompetitorDto,
  ) {
    return this.competitorService.create(createCompetitorDto, projectId);
  }

  /**
   * Get all competitors
   * GET /projects/:projectId/competitors
   */
  @Get()
  findAll(@Param('projectId') projectId: string) {
    return this.competitorService.findAll(projectId);
  }

  /**
   * Perform gap analysis
   * GET /projects/:projectId/competitors/gap-analysis
   */
  @Get('gap-analysis')
  performGapAnalysis(@Param('projectId') projectId: string) {
    return this.competitorService.performGapAnalysis(projectId);
  }
}
