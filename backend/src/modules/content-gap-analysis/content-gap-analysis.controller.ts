import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Patch,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ContentGapAnalyzerService } from './content-gap-analyzer.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  AnalyzeGapsDto,
  TopicCoverageDto,
  KeywordOpportunitiesDto,
  MarkGapAddressedDto,
} from './dto/analyze-gaps.dto';
import { GapType, GapPriority } from './entities/content-gap.entity';

/**
 * Content Gap Analysis Controller
 * Provides endpoints for competitive content gap analysis
 */
@ApiTags('content-gap-analysis')
@Controller('projects/:projectId/content-gap-analysis')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ContentGapAnalysisController {
  constructor(private readonly gapAnalyzer: ContentGapAnalyzerService) {}

  /**
   * Perform comprehensive gap analysis
   */
  @Post('analyze')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Analyze content gaps',
    description: 'Perform comprehensive content gap analysis against competitors',
  })
  @ApiResponse({ status: 200, description: 'Gap analysis completed' })
  async analyzeGaps(@Param('projectId') projectId: string, @Body() dto: AnalyzeGapsDto) {
    return this.gapAnalyzer.analyzeGaps({
      projectId,
      competitorDomains: dto.competitorDomains,
      targetKeywords: dto.targetKeywords,
      minSearchVolume: dto.minSearchVolume,
      maxCompetitors: dto.maxCompetitors,
    });
  }

  /**
   * Get all gaps for a project
   */
  @Get('gaps')
  @ApiOperation({ summary: 'Get content gaps' })
  @ApiResponse({ status: 200, description: 'Content gaps retrieved' })
  @ApiQuery({ name: 'gapType', enum: GapType, required: false })
  @ApiQuery({ name: 'priority', enum: GapPriority, required: false })
  @ApiQuery({ name: 'addressed', type: Boolean, required: false })
  @ApiQuery({ name: 'minOpportunityScore', type: Number, required: false })
  async getGaps(
    @Param('projectId') projectId: string,
    @Query('gapType') gapType?: GapType,
    @Query('priority') priority?: GapPriority,
    @Query('addressed') addressed?: boolean,
    @Query('minOpportunityScore') minOpportunityScore?: number,
  ) {
    return this.gapAnalyzer.getGaps(projectId, {
      gapType,
      priority,
      addressed,
      minOpportunityScore,
    });
  }

  /**
   * Analyze topic coverage
   */
  @Post('topic-coverage')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Analyze topic coverage',
    description: 'Compare your topic coverage against competitors',
  })
  @ApiResponse({ status: 200, description: 'Topic coverage analyzed' })
  async analyzeTopicCoverage(
    @Param('projectId') projectId: string,
    @Body() dto: TopicCoverageDto,
  ) {
    return this.gapAnalyzer.analyzeTopicCoverage(
      projectId,
      dto.topic,
      dto.competitorDomains,
    );
  }

  /**
   * Find keyword opportunities
   */
  @Post('keyword-opportunities')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Find keyword opportunities',
    description: 'Discover keyword opportunities based on competitor analysis',
  })
  @ApiResponse({ status: 200, description: 'Keyword opportunities found' })
  async findKeywordOpportunities(
    @Param('projectId') projectId: string,
    @Body() dto: KeywordOpportunitiesDto,
  ) {
    return this.gapAnalyzer.findKeywordOpportunities(projectId, dto.competitorDomains, {
      minSearchVolume: dto.minSearchVolume,
      maxDifficulty: dto.maxDifficulty,
      limit: dto.limit,
    });
  }

  /**
   * Generate content strategy
   */
  @Post('content-strategy')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Generate content strategy',
    description: 'Get AI-powered content strategy recommendations based on gap analysis',
  })
  @ApiResponse({ status: 200, description: 'Content strategy generated' })
  async generateContentStrategy(
    @Param('projectId') projectId: string,
    @Body() dto: { competitorDomains: string[] },
  ) {
    return this.gapAnalyzer.generateContentStrategy(projectId, dto.competitorDomains);
  }

  /**
   * Mark gap as addressed
   */
  @Patch('gaps/:gapId/addressed')
  @ApiOperation({ summary: 'Mark gap as addressed' })
  @ApiResponse({ status: 200, description: 'Gap marked as addressed' })
  async markGapAddressed(
    @Param('gapId') gapId: string,
    @Body() dto: MarkGapAddressedDto,
  ) {
    return this.gapAnalyzer.markGapAddressed(gapId, dto.contentId);
  }

  /**
   * Get critical gaps only
   */
  @Get('gaps/critical')
  @ApiOperation({ summary: 'Get critical gaps only' })
  @ApiResponse({ status: 200, description: 'Critical gaps retrieved' })
  async getCriticalGaps(@Param('projectId') projectId: string) {
    return this.gapAnalyzer.getGaps(projectId, {
      priority: GapPriority.CRITICAL,
      addressed: false,
    });
  }

  /**
   * Get high-opportunity gaps
   */
  @Get('gaps/opportunities')
  @ApiOperation({ summary: 'Get high-opportunity gaps' })
  @ApiResponse({ status: 200, description: 'High-opportunity gaps retrieved' })
  async getOpportunities(@Param('projectId') projectId: string) {
    return this.gapAnalyzer.getGaps(projectId, {
      minOpportunityScore: 70,
      addressed: false,
    });
  }
}
