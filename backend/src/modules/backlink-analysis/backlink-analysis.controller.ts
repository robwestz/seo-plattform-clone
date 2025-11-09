import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { BacklinkQualityAnalyzerService } from './backlink-quality-analyzer.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AnalyzeBacklinkDto, AnalyzeBacklinkBatchDto } from './dto/analyze-backlink.dto';

/**
 * Backlink Analysis Controller
 * Provides backlink quality analysis and toxic link detection
 */
@ApiTags('backlink-analysis')
@Controller('projects/:projectId/backlink-analysis')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BacklinkAnalysisController {
  constructor(private readonly analyzer: BacklinkQualityAnalyzerService) {}

  /**
   * Analyze single backlink
   */
  @Post('analyze')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Analyze backlink quality',
    description: 'Analyze quality and toxicity of a single backlink',
  })
  @ApiResponse({ status: 200, description: 'Backlink analyzed' })
  async analyzeBacklink(
    @Param('projectId') projectId: string,
    @Body() dto: AnalyzeBacklinkDto,
  ) {
    return this.analyzer.analyzeBacklink(projectId, {
      sourceUrl: dto.sourceUrl,
      targetUrl: dto.targetUrl,
      anchorText: dto.anchorText,
      linkType: dto.linkType,
      discoveryDate: dto.discoveryDate,
    });
  }

  /**
   * Analyze multiple backlinks in batch
   */
  @Post('analyze-batch')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Batch analyze backlinks',
    description: 'Analyze multiple backlinks at once',
  })
  @ApiResponse({ status: 200, description: 'Backlinks analyzed' })
  async analyzeBatch(
    @Param('projectId') projectId: string,
    @Body() dto: AnalyzeBacklinkBatchDto,
  ) {
    return this.analyzer.analyzeBatch(projectId, dto.backlinks);
  }

  /**
   * Get backlink profile summary
   */
  @Get('profile')
  @ApiOperation({
    summary: 'Get backlink profile',
    description: 'Get comprehensive backlink profile with quality distribution',
  })
  @ApiResponse({ status: 200, description: 'Profile retrieved' })
  async getProfile(@Param('projectId') projectId: string) {
    return this.analyzer.getBacklinkProfile(projectId);
  }

  /**
   * Analyze anchor text distribution
   */
  @Get('anchor-text-analysis')
  @ApiOperation({
    summary: 'Analyze anchor text',
    description: 'Analyze anchor text distribution and detect over-optimization',
  })
  @ApiResponse({ status: 200, description: 'Anchor text analyzed' })
  async analyzeAnchorText(@Param('projectId') projectId: string) {
    return this.analyzer.analyzeAnchorText(projectId);
  }

  /**
   * Analyze link velocity
   */
  @Get('velocity-analysis')
  @ApiOperation({
    summary: 'Analyze link velocity',
    description: 'Analyze link acquisition velocity and detect anomalies',
  })
  @ApiResponse({ status: 200, description: 'Velocity analyzed' })
  async analyzeLinkVelocity(@Param('projectId') projectId: string) {
    return this.analyzer.analyzeLinkVelocity(projectId);
  }

  /**
   * Generate disavow recommendations
   */
  @Get('disavow-recommendations')
  @ApiOperation({
    summary: 'Get disavow recommendations',
    description: 'Generate Google disavow file for toxic links',
  })
  @ApiResponse({ status: 200, description: 'Recommendations generated' })
  async getDisavowRecommendations(@Param('projectId') projectId: string) {
    return this.analyzer.generateDisavowRecommendations(projectId);
  }

  /**
   * Get toxic backlinks
   */
  @Get('toxic')
  @ApiOperation({
    summary: 'Get toxic backlinks',
    description: 'Get all backlinks flagged as toxic',
  })
  @ApiResponse({ status: 200, description: 'Toxic backlinks retrieved' })
  async getToxicBacklinks(@Param('projectId') projectId: string) {
    return this.analyzer.getToxicBacklinks(projectId);
  }

  /**
   * Get high-quality backlinks
   */
  @Get('high-quality')
  @ApiOperation({
    summary: 'Get high-quality backlinks',
    description: 'Get top high-quality backlinks',
  })
  @ApiResponse({ status: 200, description: 'High-quality backlinks retrieved' })
  async getHighQualityBacklinks(@Param('projectId') projectId: string) {
    return this.analyzer.getHighQualityBacklinks(projectId);
  }
}
