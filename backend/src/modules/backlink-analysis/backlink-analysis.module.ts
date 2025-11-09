import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BacklinkQualityAnalyzerService } from './backlink-quality-analyzer.service';
import { BacklinkAnalysisController } from './backlink-analysis.controller';
import { BacklinkAnalysis } from './entities/backlink-analysis.entity';

/**
 * Backlink Analysis Module
 * Provides backlink quality analysis and toxic link detection
 */
@Module({
  imports: [TypeOrmModule.forFeature([BacklinkAnalysis])],
  controllers: [BacklinkAnalysisController],
  providers: [BacklinkQualityAnalyzerService],
  exports: [BacklinkQualityAnalyzerService],
})
export class BacklinkAnalysisModule {}
