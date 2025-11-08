import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RankTrackerService } from './rank-tracker.service';
import { SerpAnalyzerService } from './serp-analyzer.service';
import { AlertService } from './alert.service';
import { RankingController } from './ranking.controller';
import { Ranking } from './entities/ranking.entity';
import { RankAlert } from './entities/rank-alert.entity';
import { Keyword } from '../keywords/entities/keyword.entity';
import { Project } from '../../database/entities/project.entity';

/**
 * Ranking Module
 * Provides rank tracking, SERP analysis, and alert functionality
 */
@Module({
  imports: [TypeOrmModule.forFeature([Ranking, RankAlert, Keyword, Project])],
  controllers: [RankingController],
  providers: [RankTrackerService, SerpAnalyzerService, AlertService],
  exports: [RankTrackerService, SerpAnalyzerService, AlertService],
})
export class RankingModule {}
