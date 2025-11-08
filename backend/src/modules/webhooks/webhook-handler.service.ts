import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { createHmac } from 'crypto';
import axios, { AxiosRequestConfig } from 'axios';

/**
 * Webhook Entity (would be in separate file)
 */
export class WebhookEndpoint {
  id: string;
  tenantId: string;
  url: string;
  secret: string;
  events: string[];
  active: boolean;
  createdAt: Date;
  lastTriggeredAt?: Date;
  failureCount: number;
}

/**
 * Webhook Delivery Log
 */
export class WebhookDelivery {
  id: string;
  webhookEndpointId: string;
  event: string;
  payload: any;
  status: 'pending' | 'delivered' | 'failed';
  responseCode?: number;
  responseBody?: string;
  attempts: number;
  deliveredAt?: Date;
  failedAt?: Date;
  createdAt: Date;
}

/**
 * Webhook Handler Service
 * Manages webhook endpoints and reliable delivery with retries
 */
@Injectable()
export class WebhookHandlerService {
  private readonly logger = new Logger(WebhookHandlerService.name);
  private readonly MAX_RETRIES = 5;

  constructor(
    @InjectRepository(WebhookEndpoint)
    private webhookRepository: Repository<WebhookEndpoint>,
    @InjectRepository(WebhookDelivery)
    private deliveryRepository: Repository<WebhookDelivery>,
    @InjectQueue('webhooks') private webhookQueue: Queue,
    private eventEmitter: EventEmitter2,
  ) {}

  /**
   * Register webhook endpoint
   */
  async registerEndpoint(params: {
    tenantId: string;
    url: string;
    events: string[];
  }): Promise<WebhookEndpoint> {
    this.logger.log(`Registering webhook endpoint for tenant ${params.tenantId}`);

    const secret = this.generateSecret();

    const endpoint = this.webhookRepository.create({
      tenantId: params.tenantId,
      url: params.url,
      secret,
      events: params.events,
      active: true,
      failureCount: 0,
    });

    const saved = await this.webhookRepository.save(endpoint);

    this.eventEmitter.emit('webhook.endpoint_registered', {
      tenantId: params.tenantId,
      endpointId: saved.id,
    });

    return saved;
  }

  /**
   * Trigger webhook event
   */
  async triggerEvent(params: {
    tenantId: string;
    event: string;
    payload: Record<string, any>;
  }): Promise<void> {
    this.logger.log(`Triggering webhook event: ${params.event}`);

    const endpoints = await this.webhookRepository.find({
      where: {
        tenantId: params.tenantId,
        active: true,
      },
    });

    const subscribedEndpoints = endpoints.filter((endpoint) =>
      endpoint.events.includes(params.event) || endpoint.events.includes('*'),
    );

    for (const endpoint of subscribedEndpoints) {
      await this.queueDelivery(endpoint, params.event, params.payload);
    }
  }

  /**
   * Queue webhook delivery
   */
  private async queueDelivery(
    endpoint: WebhookEndpoint,
    event: string,
    payload: Record<string, any>,
  ): Promise<void> {
    const delivery = this.deliveryRepository.create({
      webhookEndpointId: endpoint.id,
      event,
      payload,
      status: 'pending',
      attempts: 0,
    });

    const saved = await this.deliveryRepository.save(delivery);

    await this.webhookQueue.add(
      'deliver-webhook',
      {
        deliveryId: saved.id,
        endpointId: endpoint.id,
        url: endpoint.url,
        secret: endpoint.secret,
        event,
        payload,
      },
      {
        attempts: this.MAX_RETRIES,
        backoff: { type: 'fixed', delay: 2000 },
      },
    );
  }

  /**
   * Deliver webhook
   */
  async deliverWebhook(params: {
    deliveryId: string;
    endpointId: string;
    url: string;
    secret: string;
    event: string;
    payload: Record<string, any>;
    attempt: number;
  }): Promise<void> {
    try {
      const webhookPayload = {
        id: params.deliveryId,
        event: params.event,
        timestamp: new Date().toISOString(),
        data: params.payload,
      };

      const signature = this.generateSignature(webhookPayload, params.secret);

      const response = await axios.post(params.url, webhookPayload, {
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-Event': params.event,
        },
        timeout: 10000,
      });

      await this.markDelivered(params.deliveryId, response.status, response.data);

      await this.webhookRepository.update(params.endpointId, {
        lastTriggeredAt: new Date(),
        failureCount: 0,
      });
    } catch (error) {
      this.logger.error(`Webhook delivery failed: ${error.message}`);

      const endpoint = await this.webhookRepository.findOne({
        where: { id: params.endpointId },
      });

      if (endpoint) {
        endpoint.failureCount++;

        if (endpoint.failureCount >= 10) {
          endpoint.active = false;
          this.logger.warn(`Webhook endpoint disabled: ${params.url}`);
        }

        await this.webhookRepository.save(endpoint);
      }

      await this.markFailed(params.deliveryId, error.response?.status, error.message);
      throw error;
    }
  }

  /**
   * Mark delivery status
   */
  private async markDelivered(
    deliveryId: string,
    statusCode: number,
    responseBody: any,
  ): Promise<void> {
    await this.deliveryRepository.update(deliveryId, {
      status: 'delivered',
      responseCode: statusCode,
      responseBody: JSON.stringify(responseBody),
      deliveredAt: new Date(),
    });
  }

  private async markFailed(
    deliveryId: string,
    statusCode?: number,
    errorMessage?: string,
  ): Promise<void> {
    const delivery = await this.deliveryRepository.findOne({
      where: { id: deliveryId },
    });

    if (delivery) {
      delivery.status = 'failed';
      delivery.responseCode = statusCode;
      delivery.responseBody = errorMessage;
      delivery.failedAt = new Date();
      delivery.attempts++;

      await this.deliveryRepository.save(delivery);
    }
  }

  /**
   * Generate HMAC signature
   */
  private generateSignature(payload: any, secret: string): string {
    const payloadString = JSON.stringify(payload);
    const hmac = createHmac('sha256', secret);
    hmac.update(payloadString);
    return hmac.digest('hex');
  }

  /**
   * Generate secure secret
   */
  private generateSecret(): string {
    const characters =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 64; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  }

  /**
   * Verify webhook signature
   */
  verifySignature(payload: any, signature: string, secret: string): boolean {
    const expectedSignature = this.generateSignature(payload, secret);
    return signature === expectedSignature;
  }

  /**
   * Get delivery logs
   */
  async getDeliveryLogs(tenantId: string, limit: number = 100): Promise<WebhookDelivery[]> {
    const endpoints = await this.webhookRepository.find({
      where: { tenantId },
    });

    const endpointIds = endpoints.map((e) => e.id);

    return this.deliveryRepository.find({
      where: {
        webhookEndpointId: In(endpointIds),
      },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}
