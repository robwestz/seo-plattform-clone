import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Webhook } from './entities/webhook.entity';
import { WebhookDelivery, DeliveryStatus } from './entities/webhook-delivery.entity';
import axios from 'axios';
import * as crypto from 'crypto';

/**
 * Webhook Delivery Service
 * Handles webhook delivery with retry logic and signature verification
 */
@Injectable()
export class WebhookDeliveryService {
  private readonly logger = new Logger(WebhookDeliveryService.name);

  constructor(
    @InjectRepository(Webhook)
    private webhookRepository: Repository<Webhook>,
    @InjectRepository(WebhookDelivery)
    private webhookDeliveryRepository: Repository<WebhookDelivery>,
  ) {}

  /**
   * Process pending webhook deliveries
   * Runs every minute
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async processPendingDeliveries() {
    this.logger.log('Processing pending webhook deliveries...');

    // Get pending and retry deliveries
    const deliveries = await this.webhookDeliveryRepository.find({
      where: [
        { status: DeliveryStatus.PENDING },
        {
          status: DeliveryStatus.RETRYING,
          nextRetryAt: LessThan(new Date()),
        },
      ],
      relations: ['webhook'],
      take: 100,
    });

    if (deliveries.length === 0) {
      return;
    }

    this.logger.log(`Found ${deliveries.length} deliveries to process`);

    // Process deliveries in parallel (with concurrency limit)
    const batchSize = 10;
    for (let i = 0; i < deliveries.length; i += batchSize) {
      const batch = deliveries.slice(i, i + batchSize);
      await Promise.all(batch.map(delivery => this.deliverWebhook(delivery)));
    }
  }

  /**
   * Deliver a single webhook
   */
  async deliverWebhook(delivery: WebhookDelivery): Promise<void> {
    this.logger.log(`Delivering webhook: ${delivery.id}`);

    const webhook = delivery.webhook;

    if (!webhook || !webhook.active) {
      this.logger.warn(`Webhook ${delivery.webhookId} is inactive, skipping delivery`);
      delivery.status = DeliveryStatus.FAILED;
      delivery.errorMessage = 'Webhook is inactive';
      await this.webhookDeliveryRepository.save(delivery);
      return;
    }

    // Update delivery status to sending
    delivery.status = DeliveryStatus.SENDING;
    delivery.attempts += 1;
    delivery.sentAt = new Date();
    await this.webhookDeliveryRepository.save(delivery);

    const startTime = Date.now();

    try {
      // Generate signature
      const signature = this.generateSignature(delivery.payload, webhook.secret);

      // Prepare headers
      const headers = {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature,
        'X-Webhook-Event': delivery.event,
        'X-Webhook-Delivery-Id': delivery.id,
        'X-Webhook-Timestamp': new Date().toISOString(),
        ...webhook.headers,
      };

      // Send webhook
      const response = await axios.post(webhook.url, delivery.payload, {
        headers,
        timeout: webhook.timeout,
        validateStatus: () => true, // Don't throw on any status
      });

      const duration = Date.now() - startTime;

      // Update delivery with response
      delivery.responseStatus = response.status;
      delivery.responseBody = JSON.stringify(response.data).substring(0, 1000); // Limit response body size
      delivery.duration = duration;

      // Check if delivery was successful (2xx status codes)
      if (response.status >= 200 && response.status < 300) {
        delivery.status = DeliveryStatus.SUCCESS;
        webhook.successCount += 1;
        webhook.lastTriggeredAt = new Date();

        this.logger.log(`Webhook delivered successfully: ${delivery.id} (${duration}ms)`);
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      delivery.duration = duration;
      delivery.errorMessage = error.message;

      // Determine if we should retry
      if (delivery.attempts < webhook.maxRetries) {
        delivery.status = DeliveryStatus.RETRYING;
        delivery.nextRetryAt = this.calculateNextRetry(delivery.attempts);

        this.logger.warn(
          `Webhook delivery failed, will retry: ${delivery.id} (attempt ${delivery.attempts}/${webhook.maxRetries})`,
        );
      } else {
        delivery.status = DeliveryStatus.FAILED;
        webhook.failureCount += 1;

        this.logger.error(`Webhook delivery failed permanently: ${delivery.id}`, error.stack);
      }
    }

    // Save delivery and webhook
    await this.webhookDeliveryRepository.save(delivery);
    await this.webhookRepository.save(webhook);
  }

  /**
   * Generate HMAC signature for webhook payload
   */
  private generateSignature(payload: any, secret: string): string {
    const payloadString = JSON.stringify(payload);
    return crypto
      .createHmac('sha256', secret)
      .update(payloadString)
      .digest('hex');
  }

  /**
   * Calculate next retry time using exponential backoff
   */
  private calculateNextRetry(attempts: number): Date {
    // Exponential backoff: 1min, 5min, 15min, 60min
    const delayMinutes = Math.min(Math.pow(5, attempts - 1), 60);
    const nextRetry = new Date();
    nextRetry.setMinutes(nextRetry.getMinutes() + delayMinutes);
    return nextRetry;
  }

  /**
   * Verify webhook signature (for incoming webhooks)
   */
  verifySignature(payload: any, signature: string, secret: string): boolean {
    const expectedSignature = this.generateSignature(payload, secret);
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature),
    );
  }

  /**
   * Clean up old deliveries (older than 30 days)
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupOldDeliveries() {
    this.logger.log('Cleaning up old webhook deliveries...');

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await this.webhookDeliveryRepository
      .createQueryBuilder()
      .delete()
      .where('createdAt < :date', { date: thirtyDaysAgo })
      .andWhere('status IN (:...statuses)', {
        statuses: [DeliveryStatus.SUCCESS, DeliveryStatus.FAILED],
      })
      .execute();

    this.logger.log(`Deleted ${result.affected} old webhook deliveries`);
  }

  /**
   * Retry failed delivery manually
   */
  async retryDelivery(deliveryId: string): Promise<void> {
    const delivery = await this.webhookDeliveryRepository.findOne({
      where: { id: deliveryId },
      relations: ['webhook'],
    });

    if (!delivery) {
      throw new Error('Delivery not found');
    }

    if (delivery.status === DeliveryStatus.SUCCESS) {
      throw new Error('Cannot retry successful delivery');
    }

    // Reset delivery for retry
    delivery.status = DeliveryStatus.PENDING;
    delivery.nextRetryAt = null;
    await this.webhookDeliveryRepository.save(delivery);

    // Deliver immediately
    await this.deliverWebhook(delivery);
  }
}
