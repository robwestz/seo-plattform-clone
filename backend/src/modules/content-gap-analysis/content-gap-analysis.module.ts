import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContentGapAnalyzerService } from './content-gap-analyzer.service';
import { ContentGapAnalysisController } from './content-gap-analysis.controller';
import { ContentGap } from './entities/content-gap.entity';
import { KeywordsModule } from '../keywords/keywords.module';
import { RankingsModule } from '../rankings/rankings.module';
import { ContentAnalysisModule } from '../content-analysis/content-analysis.module';

/**
 * Content Gap Analysis Module
 * Provides competitive content gap analysis and opportunity discovery
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([ContentGap]),
    KeywordsModule,
    RankingsModule,
    ContentAnalysisModule,
  ],
  controllers: [ContentGapAnalysisController],
  providers: [ContentGapAnalyzerService],
  exports: [ContentGapAnalyzerService],
})
export class ContentGapAnalysisModule {}
