import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WebhookSubscriptionService } from './webhook-subscription.service';
import { WebhookEndpoint } from '../webhooks/entities/webhook-endpoint.entity';
import { WebhookDelivery } from '../webhooks/entities/webhook-delivery.entity';

/**
 * Webhook Subscriptions Module
 * Enhanced webhook management with filtering and batching
 */
@Module({
  imports: [TypeOrmModule.forFeature([WebhookEndpoint, WebhookDelivery])],
  providers: [WebhookSubscriptionService],
  exports: [WebhookSubscriptionService],
})
export class WebhookSubscriptionsModule {}
