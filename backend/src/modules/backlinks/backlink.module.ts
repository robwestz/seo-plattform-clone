import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BacklinkService } from './backlink.service';
import { BacklinkController } from './backlink.controller';
import { Backlink } from './entities/backlink.entity';
import { Project } from '../../database/entities/project.entity';
import { LinkQualityScorer } from './link-quality.scorer';
import { ToxicLinkDetector } from './toxic-link.detector';

/**
 * Backlink Module
 * Provides backlink analysis functionality
 */
@Module({
  imports: [TypeOrmModule.forFeature([Backlink, Project])],
  controllers: [BacklinkController],
  providers: [BacklinkService, LinkQualityScorer, ToxicLinkDetector],
  exports: [BacklinkService, LinkQualityScorer, ToxicLinkDetector],
})
export class BacklinkModule {}
