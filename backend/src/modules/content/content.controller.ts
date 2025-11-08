import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ContentOptimizerService } from './content-optimizer.service';
import { AnalyzeContentDto } from './dto/analyze-content.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

/**
 * Content Controller
 * Handles content optimization and analysis
 */
@Controller('projects/:projectId/content')
@UseGuards(JwtAuthGuard)
export class ContentController {
  constructor(private readonly contentOptimizerService: ContentOptimizerService) {}

  /**
   * Analyze content for a URL
   * POST /projects/:projectId/content/analyze
   */
  @Post('analyze')
  analyze(
    @Param('projectId') projectId: string,
    @Body() analyzeDto: AnalyzeContentDto,
  ) {
    return this.contentOptimizerService.analyze(analyzeDto, projectId);
  }

  /**
   * Get all content scores
   * GET /projects/:projectId/content
   */
  @Get()
  findAll(@Param('projectId') projectId: string) {
    return this.contentOptimizerService.findAll(projectId);
  }

  /**
   * Get content statistics
   * GET /projects/:projectId/content/statistics
   */
  @Get('statistics')
  getStatistics(@Param('projectId') projectId: string) {
    return this.contentOptimizerService.getStatistics(projectId);
  }
}
