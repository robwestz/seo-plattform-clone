import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompetitorService } from './competitor.service';
import { CompetitorController } from './competitor.controller';
import { Competitor } from './entities/competitor.entity';
import { Project } from '../../database/entities/project.entity';
import { ShareOfVoiceCalculator } from './share-of-voice.calculator';

/**
 * Competitor Module
 * Provides competitor analysis functionality
 */
@Module({
  imports: [TypeOrmModule.forFeature([Competitor, Project])],
  controllers: [CompetitorController],
  providers: [CompetitorService, ShareOfVoiceCalculator],
  exports: [CompetitorService, ShareOfVoiceCalculator],
})
export class CompetitorModule {}
