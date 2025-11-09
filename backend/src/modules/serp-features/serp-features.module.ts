import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SerpFeatureAnalyzerService } from './serp-feature-analyzer.service';
import { SerpFeaturesController } from './serp-features.controller';
import { SerpFeatureAnalysis } from './entities/serp-feature-analysis.entity';

/**
 * SERP Features Module
 * Analyzes impact of SERP features on visibility and CTR
 */
@Module({
  imports: [TypeOrmModule.forFeature([SerpFeatureAnalysis])],
  controllers: [SerpFeaturesController],
  providers: [SerpFeatureAnalyzerService],
  exports: [SerpFeatureAnalyzerService],
})
export class SerpFeaturesModule {}
