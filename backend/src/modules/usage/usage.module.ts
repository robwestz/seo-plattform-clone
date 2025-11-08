import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { UsageService } from './usage.service';
import { UsageController } from './usage.controller';
import { UsageEvent } from './entities/usage-event.entity';
import { UsageAggregate } from './entities/usage-aggregate.entity';

/**
 * Usage Module
 * Tracks and aggregates usage events for billing and analytics
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([UsageEvent, UsageAggregate]),
    EventEmitterModule.forRoot(),
  ],
  controllers: [UsageController],
  providers: [UsageService],
  exports: [UsageService],
})
export class UsageModule {}
