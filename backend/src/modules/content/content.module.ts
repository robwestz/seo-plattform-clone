import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContentOptimizerService } from './content-optimizer.service';
import { ContentController } from './content.controller';
import { ContentScore } from './entities/content-score.entity';
import { Project } from '../../database/entities/project.entity';
import { ReadabilityAnalyzer } from './readability.analyzer';

/**
 * Content Module
 * Provides content optimization and analysis functionality
 */
@Module({
  imports: [TypeOrmModule.forFeature([ContentScore, Project])],
  controllers: [ContentController],
  providers: [ContentOptimizerService, ReadabilityAnalyzer],
  exports: [ContentOptimizerService, ReadabilityAnalyzer],
})
export class ContentModule {}
