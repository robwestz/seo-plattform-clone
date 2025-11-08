import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Patch,
} from '@nestjs/common';
import { RankTrackerService } from './rank-tracker.service';
import { SerpAnalyzerService } from './serp-analyzer.service';
import { AlertService } from './alert.service';
import { TrackRankingDto, BulkTrackRankingDto } from './dto/track-ranking.dto';
import { RankingQueryDto } from './dto/ranking-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AlertStatus } from './entities/rank-alert.entity';

/**
 * Ranking Controller
 * Handles rank tracking, SERP analysis, and alerts
 */
@Controller('projects/:projectId/rankings')
@UseGuards(JwtAuthGuard)
export class RankingController {
  constructor(
    private readonly rankTrackerService: RankTrackerService,
    private readonly serpAnalyzerService: SerpAnalyzerService,
    private readonly alertService: AlertService,
  ) {}

  /**
   * Track a single keyword
   * POST /projects/:projectId/rankings/track
   */
  @Post('track')
  trackKeyword(
    @Param('projectId') projectId: string,
    @Body() trackDto: TrackRankingDto,
  ) {
    return this.rankTrackerService.trackKeyword(
      trackDto.keywordId,
      projectId,
      trackDto.device,
      trackDto.location,
    );
  }

  /**
   * Track multiple keywords in bulk
   * POST /projects/:projectId/rankings/track-bulk
   */
  @Post('track-bulk')
  bulkTrackKeywords(
    @Param('projectId') projectId: string,
    @Body() bulkTrackDto: BulkTrackRankingDto,
  ) {
    return this.rankTrackerService.bulkTrackKeywords(
      bulkTrackDto.keywordIds,
      projectId,
      bulkTrackDto.device,
      bulkTrackDto.location,
    );
  }

  /**
   * Get ranking history for a keyword
   * GET /projects/:projectId/rankings/keyword/:keywordId/history
   */
  @Get('keyword/:keywordId/history')
  getRankingHistory(
    @Param('keywordId') keywordId: string,
    @Query() query: RankingQueryDto,
  ) {
    const startDate = query.startDate ? new Date(query.startDate) : undefined;
    const endDate = query.endDate ? new Date(query.endDate) : undefined;

    return this.rankTrackerService.getRankingHistory(
      keywordId,
      startDate,
      endDate,
      query.device,
    );
  }

  /**
   * Get project ranking overview
   * GET /projects/:projectId/rankings/overview
   */
  @Get('overview')
  getProjectOverview(@Param('projectId') projectId: string) {
    return this.rankTrackerService.getProjectOverview(projectId);
  }

  /**
   * Analyze SERP features for a keyword
   * GET /projects/:projectId/rankings/keyword/:keywordId/serp-features
   */
  @Get('keyword/:keywordId/serp-features')
  analyzeSerpFeatures(
    @Param('keywordId') keywordId: string,
    @Query('days') days?: number,
  ) {
    return this.serpAnalyzerService.analyzeSerpFeatures(keywordId, days || 30);
  }

  /**
   * Analyze competitors for a keyword
   * GET /projects/:projectId/rankings/keyword/:keywordId/competitors
   */
  @Get('keyword/:keywordId/competitors')
  analyzeCompetitors(@Param('keywordId') keywordId: string) {
    return this.serpAnalyzerService.analyzeCompetitors(keywordId);
  }

  /**
   * Analyze SERP volatility
   * GET /projects/:projectId/rankings/keyword/:keywordId/volatility
   */
  @Get('keyword/:keywordId/volatility')
  analyzeSerpVolatility(
    @Param('keywordId') keywordId: string,
    @Query('days') days?: number,
  ) {
    return this.serpAnalyzerService.analyzeSerpVolatility(keywordId, days || 30);
  }

  /**
   * Get SERP feature trends
   * GET /projects/:projectId/rankings/serp-trends
   */
  @Get('serp-trends')
  getSerpFeatureTrends(
    @Param('projectId') projectId: string,
    @Query('days') days?: number,
  ) {
    return this.serpAnalyzerService.getSerpFeatureTrends(projectId, days || 30);
  }

  /**
   * Get project alerts
   * GET /projects/:projectId/rankings/alerts
   */
  @Get('alerts')
  getProjectAlerts(
    @Param('projectId') projectId: string,
    @Query('status') status?: AlertStatus,
  ) {
    return this.alertService.getProjectAlerts(projectId, status);
  }

  /**
   * Get alerts for a keyword
   * GET /projects/:projectId/rankings/keyword/:keywordId/alerts
   */
  @Get('keyword/:keywordId/alerts')
  getKeywordAlerts(@Param('keywordId') keywordId: string) {
    return this.alertService.getKeywordAlerts(keywordId);
  }

  /**
   * Acknowledge an alert
   * PATCH /projects/:projectId/rankings/alerts/:alertId/acknowledge
   */
  @Patch('alerts/:alertId/acknowledge')
  acknowledgeAlert(
    @Param('alertId') alertId: string,
    @CurrentUser() user: any,
  ) {
    return this.alertService.acknowledgeAlert(alertId, user.id);
  }

  /**
   * Resolve an alert
   * PATCH /projects/:projectId/rankings/alerts/:alertId/resolve
   */
  @Patch('alerts/:alertId/resolve')
  resolveAlert(@Param('alertId') alertId: string) {
    return this.alertService.resolveAlert(alertId);
  }

  /**
   * Get alert statistics
   * GET /projects/:projectId/rankings/alerts/statistics
   */
  @Get('alerts/statistics')
  getAlertStatistics(@Param('projectId') projectId: string) {
    return this.alertService.getAlertStatistics(projectId);
  }
}
