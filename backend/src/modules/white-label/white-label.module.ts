import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { WhiteLabelService } from './white-label.service';
import { WhiteLabelController } from './white-label.controller';
import { WhiteLabelConfig } from './entities/white-label-config.entity';

/**
 * White Label Module
 * Manages white label branding and customization
 */
@Module({
  imports: [TypeOrmModule.forFeature([WhiteLabelConfig]), EventEmitterModule.forRoot()],
  controllers: [WhiteLabelController],
  providers: [WhiteLabelService],
  exports: [WhiteLabelService],
})
export class WhiteLabelModule {}
