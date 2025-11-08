import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { WebhookController } from './webhook.controller';
import { WebhookService } from './webhook.service';
import { WebhookDeliveryService } from './delivery.service';
import { Webhook } from './entities/webhook.entity';
import { WebhookDelivery } from './entities/webhook-delivery.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Webhook, WebhookDelivery]),
    ScheduleModule.forRoot(),
  ],
  controllers: [WebhookController],
  providers: [WebhookService, WebhookDeliveryService],
  exports: [WebhookService, WebhookDeliveryService],
})
export class WebhookModule {}
