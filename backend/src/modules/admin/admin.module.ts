import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { Tenant } from '../tenant/entities/tenant.entity';
import { User } from '../user/entities/user.entity';
import { Subscription } from '../subscription/entities/subscription.entity';
import { UsageEvent } from '../usage/entities/usage-event.entity';
import { Invoice } from '../billing/entities/invoice.entity';
import { SubscriptionModule } from '../subscription/subscription.module';
import { UsageModule } from '../usage/usage.module';
import { AnalyticsModule } from '../analytics/analytics.module';

/**
 * Admin Module
 * Provides administrative tools and platform management
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Tenant, User, Subscription, UsageEvent, Invoice]),
    SubscriptionModule,
    UsageModule,
    AnalyticsModule,
  ],
  providers: [AdminService],
  controllers: [AdminController],
  exports: [AdminService],
})
export class AdminModule {}
