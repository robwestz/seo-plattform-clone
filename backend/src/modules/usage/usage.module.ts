import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { CacheModule } from '@nestjs/cache-manager';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { UsageTrackingService } from './usage-tracking.service';
import { UsageReportingService } from './usage-reporting.service';
import { UsageController } from './usage.controller';
import { UsageEvent } from './entities/usage-event.entity';
import { UsageQuota } from './entities/usage-quota.entity';
import { SubscriptionModule } from '../subscription/subscription.module';

/**
 * Usage Module
 * Handles usage tracking, quota management, and reporting
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([UsageEvent, UsageQuota]),
    BullModule.registerQueue({
      name: 'usage-processing',
    }),
    CacheModule.register({
      ttl: 3600, // 1 hour
      max: 1000, // Max items in cache
    }),
    EventEmitterModule.forRoot(),
    ScheduleModule.forRoot(),
    SubscriptionModule,
  ],
  providers: [UsageTrackingService, UsageReportingService],
  controllers: [UsageController],
  exports: [UsageTrackingService, UsageReportingService],
})
export class UsageModule {}
