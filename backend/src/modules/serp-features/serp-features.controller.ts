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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { SerpFeatureAnalyzerService } from './serp-feature-analyzer.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AnalyzeFeatureDto } from './dto/analyze-feature.dto';
import { SerpFeatureType } from './entities/serp-feature-analysis.entity';

/**
 * SERP Features Controller
 * Analyzes impact of SERP features on visibility and CTR
 */
@ApiTags('serp-features')
@Controller('projects/:projectId/serp-features')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SerpFeaturesController {
  constructor(private readonly analyzer: SerpFeatureAnalyzerService) {}

  @Post('analyze')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Analyze SERP feature impact' })
  @ApiResponse({ status: 200, description: 'Feature analyzed' })
  async analyzeFeature(@Param('projectId') projectId: string, @Body() dto: AnalyzeFeatureDto) {
    return this.analyzer.analyzeFeature(projectId, dto);
  }

  @Get('impact-summary')
  @ApiOperation({ summary: 'Get SERP feature impact summary' })
  @ApiResponse({ status: 200, description: 'Summary retrieved' })
  async getImpactSummary(@Param('projectId') projectId: string) {
    return this.analyzer.getImpactSummary(projectId);
  }

  @Get('optimization-strategies')
  @ApiOperation({ summary: 'Get feature optimization strategies' })
  @ApiResponse({ status: 200, description: 'Strategies retrieved' })
  @ApiQuery({ name: 'limit', type: Number, required: false })
  async getOptimizationStrategies(
    @Param('projectId') projectId: string,
    @Query('limit') limit?: number,
  ) {
    return this.analyzer.getOptimizationStrategies(projectId, limit);
  }

  @Get('by-type/:featureType')
  @ApiOperation({ summary: 'Get features by type' })
  @ApiResponse({ status: 200, description: 'Features retrieved' })
  async getFeaturesByType(
    @Param('projectId') projectId: string,
    @Param('featureType') featureType: SerpFeatureType,
  ) {
    return this.analyzer.getFeaturesByType(projectId, featureType);
  }

  @Get('owned')
  @ApiOperation({ summary: 'Get features you own' })
  @ApiResponse({ status: 200, description: 'Owned features retrieved' })
  async getFeaturesYouOwn(@Param('projectId') projectId: string) {
    return this.analyzer.getFeaturesYouOwn(projectId);
  }

  @Get('opportunities')
  @ApiOperation({ summary: 'Get high-opportunity features' })
  @ApiResponse({ status: 200, description: 'Opportunities retrieved' })
  async getHighOpportunityFeatures(@Param('projectId') projectId: string) {
    return this.analyzer.getHighOpportunityFeatures(projectId);
  }
}
