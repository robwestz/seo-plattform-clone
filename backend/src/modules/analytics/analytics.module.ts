import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { Subscription } from '../subscription/entities/subscription.entity';
import { SubscriptionHistory } from '../subscription/entities/subscription-history.entity';
import { Invoice } from '../billing/entities/invoice.entity';
import { UsageEvent } from '../usage/entities/usage-event.entity';
import { Tenant } from '../../database/entities/tenant.entity';
import { AdminGuard } from '../../common/guards/admin.guard';

/**
 * Analytics Module
 * Provides business analytics and metrics
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Subscription, SubscriptionHistory, Invoice, UsageEvent, Tenant]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, AdminGuard],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
