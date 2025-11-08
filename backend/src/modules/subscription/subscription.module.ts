import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { SubscriptionService } from './subscription.service';
import { SubscriptionController } from './subscription.controller';
import { Subscription } from './entities/subscription.entity';
import { SubscriptionHistory } from './entities/subscription-history.entity';

/**
 * Subscription Module
 * Manages subscription plans, limits, and lifecycle
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Subscription, SubscriptionHistory]),
    EventEmitterModule.forRoot(),
  ],
  controllers: [SubscriptionController],
  providers: [SubscriptionService],
  exports: [SubscriptionService],
})
export class SubscriptionModule {}
