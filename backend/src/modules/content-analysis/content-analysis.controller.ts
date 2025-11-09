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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ContentQualityService } from './content-quality.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentProject } from '../projects/decorators/current-project.decorator';
import { AnalyzeContentDto } from './dto/analyze-content.dto';

/**
 * Content Analysis Controller
 * Provides endpoints for content quality analysis
 */
@ApiTags('content-analysis')
@Controller('projects/:projectId/content-analysis')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ContentAnalysisController {
  constructor(private readonly contentQualityService: ContentQualityService) {}

  /**
   * Analyze content quality
   */
  @Post('analyze')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Analyze content quality' })
  @ApiResponse({ status: 200, description: 'Content analyzed successfully' })
  async analyzeContent(
    @Param('projectId') projectId: string,
    @Body() dto: AnalyzeContentDto,
  ) {
    return this.contentQualityService.analyzeContent({
      content: dto.content,
      title: dto.title,
      metaDescription: dto.metaDescription,
      url: dto.url,
      targetKeyword: dto.targetKeyword,
      html: dto.html,
    });
  }

  /**
   * Get readability analysis only
   */
  @Post('readability')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Analyze readability' })
  @ApiResponse({ status: 200, description: 'Readability analyzed' })
  async analyzeReadability(@Body() dto: { content: string }) {
    return this.contentQualityService.analyzeReadability(dto.content);
  }

  /**
   * Get TF-IDF analysis
   */
  @Post('tf-idf')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Analyze TF-IDF' })
  @ApiResponse({ status: 200, description: 'TF-IDF analyzed' })
  async analyzeTfIdf(
    @Body() dto: { content: string; targetKeyword?: string },
  ) {
    return this.contentQualityService.analyzeTfIdf(dto.content, dto.targetKeyword);
  }

  /**
   * Get content structure analysis
   */
  @Post('structure')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Analyze content structure' })
  @ApiResponse({ status: 200, description: 'Structure analyzed' })
  async analyzeStructure(@Body() dto: { html: string }) {
    return this.contentQualityService.analyzeStructure(dto.html);
  }

  /**
   * Get LSI keyword analysis
   */
  @Post('lsi-keywords')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Analyze LSI keywords' })
  @ApiResponse({ status: 200, description: 'LSI keywords analyzed' })
  async analyzeLsiKeywords(
    @Body() dto: { content: string; targetKeyword?: string },
  ) {
    return this.contentQualityService.analyzeLsiKeywords(
      dto.content,
      dto.targetKeyword,
    );
  }

  /**
   * Get SEO checks
   */
  @Post('seo-checks')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Run SEO checks' })
  @ApiResponse({ status: 200, description: 'SEO checks completed' })
  async analyzeSeoChecks(@Body() dto: AnalyzeContentDto) {
    return this.contentQualityService.analyzeSeoChecks({
      content: dto.content,
      title: dto.title,
      metaDescription: dto.metaDescription,
      url: dto.url,
      targetKeyword: dto.targetKeyword,
      html: dto.html,
    });
  }
}
