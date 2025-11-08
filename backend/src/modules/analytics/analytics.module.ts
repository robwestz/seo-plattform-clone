import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from '../usage/usage.controller';
import { Tenant } from '../tenant/entities/tenant.entity';
import { User } from '../user/entities/user.entity';
import { Subscription } from '../subscription/entities/subscription.entity';
import { UsageEvent } from '../usage/entities/usage-event.entity';
import { Invoice } from '../billing/entities/invoice.entity';
import { UsageModule } from '../usage/usage.module';

/**
 * Analytics Module
 * Provides business intelligence and predictive analytics
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Tenant, User, Subscription, UsageEvent, Invoice]),
    CacheModule.register({
      ttl: 1800, // 30 minutes
      max: 500,
    }),
    UsageModule,
  ],
  providers: [AnalyticsService],
  controllers: [AnalyticsController],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
