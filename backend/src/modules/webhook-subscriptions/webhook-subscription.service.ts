import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Redis } from 'ioredis';
import { InjectRedis } from '@liaoliaots/nestjs-redis';
import { WebhookEndpoint } from '../webhooks/entities/webhook-endpoint.entity';
import { WebhookDelivery } from '../webhooks/entities/webhook-delivery.entity';

/**
 * Webhook Event Type
 */
export enum WebhookEventType {
  RANKING_UPDATED = 'ranking.updated',
  RANKING_DROPPED = 'ranking.dropped',
  RANKING_IMPROVED = 'ranking.improved',
  KEYWORD_ADDED = 'keyword.added',
  KEYWORD_REMOVED = 'keyword.removed',
  CONTENT_ANALYZED = 'content.analyzed',
  GAP_DISCOVERED = 'gap.discovered',
  BACKLINK_GAINED = 'backlink.gained',
  BACKLINK_LOST = 'backlink.lost',
  SUBSCRIPTION_UPGRADED = 'subscription.upgraded',
  SUBSCRIPTION_DOWNGRADED = 'subscription.downgraded',
  USAGE_LIMIT_REACHED = 'usage.limit_reached',
}

/**
 * Enhanced Webhook Subscription Service
 * Advanced webhook management with filtering and batching
 */
@Injectable()
export class WebhookSubscriptionService {
  private readonly logger = new Logger(WebhookSubscriptionService.name);

  constructor(
    @InjectRepository(WebhookEndpoint)
    private endpointRepository: Repository<WebhookEndpoint>,
    @InjectRepository(WebhookDelivery)
    private deliveryRepository: Repository<WebhookDelivery>,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  /**
   * Subscribe to webhook events
   */
  async subscribe(params: {
    tenantId: string;
    url: string;
    events: WebhookEventType[];
    secret?: string;
    filters?: Record<string, any>;
    batchingEnabled?: boolean;
    batchSize?: number;
    batchTimeoutSeconds?: number;
  }): Promise<WebhookEndpoint> {
    const endpoint = this.endpointRepository.create({
      tenantId: params.tenantId,
      url: params.url,
      events: params.events,
      secret: params.secret || this.generateSecret(),
      metadata: {
        filters: params.filters || {},
        batching: {
          enabled: params.batchingEnabled || false,
          size: params.batchSize || 10,
          timeout: params.batchTimeoutSeconds || 60,
        },
      },
    });

    const saved = await this.endpointRepository.save(endpoint);

    this.logger.log(
      `Webhook subscription created for tenant ${params.tenantId} - ${params.events.length} events`,
    );

    return saved;
  }

  /**
   * Unsubscribe from webhook
   */
  async unsubscribe(endpointId: string): Promise<void> {
    await this.endpointRepository.update(endpointId, {
      isActive: false,
    });

    this.logger.log(`Webhook endpoint ${endpointId} unsubscribed`);
  }

  /**
   * Trigger webhook event
   */
  async triggerEvent(params: {
    tenantId: string;
    eventType: WebhookEventType;
    payload: any;
    metadata?: Record<string, any>;
  }): Promise<void> {
    // Find subscribed endpoints
    const endpoints = await this.findSubscribedEndpoints(
      params.tenantId,
      params.eventType,
    );

    if (endpoints.length === 0) {
      this.logger.debug(
        `No webhook subscribers for ${params.eventType} in tenant ${params.tenantId}`,
      );
      return;
    }

    this.logger.log(
      `Triggering ${params.eventType} for ${endpoints.length} endpoints`,
    );

    // Trigger each endpoint
    for (const endpoint of endpoints) {
      // Apply filters
      if (!this.matchesFilters(params.payload, endpoint.metadata?.filters)) {
        continue;
      }

      // Check if batching is enabled
      if (endpoint.metadata?.batching?.enabled) {
        await this.addToBatch(endpoint, params);
      } else {
        await this.deliverWebhook(endpoint, params);
      }
    }
  }

  /**
   * Get webhook deliveries
   */
  async getDeliveries(params: {
    tenantId?: string;
    endpointId?: string;
    eventType?: string;
    status?: string;
    limit?: number;
  }): Promise<WebhookDelivery[]> {
    const query = this.deliveryRepository.createQueryBuilder('delivery');

    if (params.tenantId) {
      query.andWhere('delivery.tenantId = :tenantId', {
        tenantId: params.tenantId,
      });
    }

    if (params.endpointId) {
      query.andWhere('delivery.endpointId = :endpointId', {
        endpointId: params.endpointId,
      });
    }

    if (params.eventType) {
      query.andWhere('delivery.eventType = :eventType', {
        eventType: params.eventType,
      });
    }

    if (params.status) {
      query.andWhere('delivery.status = :status', { status: params.status });
    }

    query.orderBy('delivery.createdAt', 'DESC');

    if (params.limit) {
      query.take(params.limit);
    }

    return query.getMany();
  }

  /**
   * Retry failed delivery
   */
  async retryDelivery(deliveryId: string): Promise<void> {
    const delivery = await this.deliveryRepository.findOne({
      where: { id: deliveryId },
    });

    if (!delivery) {
      throw new Error(`Delivery ${deliveryId} not found`);
    }

    const endpoint = await this.endpointRepository.findOne({
      where: { id: delivery.endpointId },
    });

    if (!endpoint) {
      throw new Error(`Endpoint not found for delivery ${deliveryId}`);
    }

    // Retry delivery
    await this.deliverWebhook(endpoint, {
      tenantId: delivery.tenantId,
      eventType: delivery.eventType as WebhookEventType,
      payload: delivery.payload,
    });
  }

  // ========================================
  // Private Methods
  // ========================================

  /**
   * Find subscribed endpoints
   */
  private async findSubscribedEndpoints(
    tenantId: string,
    eventType: WebhookEventType,
  ): Promise<WebhookEndpoint[]> {
    return this.endpointRepository
      .createQueryBuilder('endpoint')
      .where('endpoint.tenantId = :tenantId', { tenantId })
      .andWhere('endpoint.isActive = :isActive', { isActive: true })
      .andWhere(':eventType = ANY(endpoint.events)', { eventType })
      .getMany();
  }

  /**
   * Check if payload matches filters
   */
  private matchesFilters(
    payload: any,
    filters: Record<string, any> = {},
  ): boolean {
    for (const [key, value] of Object.entries(filters)) {
      if (payload[key] !== value) {
        return false;
      }
    }

    return true;
  }

  /**
   * Add event to batch
   */
  private async addToBatch(
    endpoint: WebhookEndpoint,
    event: {
      eventType: WebhookEventType;
      payload: any;
      metadata?: Record<string, any>;
    },
  ): Promise<void> {
    const batchKey = `webhook:batch:${endpoint.id}`;

    // Add to batch
    await this.redis.rpush(batchKey, JSON.stringify(event));

    // Get batch config
    const batchConfig = endpoint.metadata?.batching || {
      size: 10,
      timeout: 60,
    };

    // Check if batch is ready
    const batchSize = await this.redis.llen(batchKey);

    if (batchSize >= batchConfig.size) {
      await this.flushBatch(endpoint);
    } else {
      // Set timeout for batch
      await this.redis.expire(batchKey, batchConfig.timeout);
    }
  }

  /**
   * Flush batch of events
   */
  private async flushBatch(endpoint: WebhookEndpoint): Promise<void> {
    const batchKey = `webhook:batch:${endpoint.id}`;

    // Get all events from batch
    const events = await this.redis.lrange(batchKey, 0, -1);

    if (events.length === 0) {
      return;
    }

    // Parse events
    const parsedEvents = events.map((e) => JSON.parse(e));

    // Deliver batched events
    await this.deliverWebhook(endpoint, {
      tenantId: endpoint.tenantId,
      eventType: WebhookEventType.RANKING_UPDATED, // Generic type for batch
      payload: {
        batch: true,
        events: parsedEvents,
      },
    });

    // Clear batch
    await this.redis.del(batchKey);

    this.logger.log(`Flushed batch of ${events.length} events for endpoint ${endpoint.id}`);
  }

  /**
   * Deliver webhook
   */
  private async deliverWebhook(
    endpoint: WebhookEndpoint,
    event: {
      tenantId: string;
      eventType: WebhookEventType;
      payload: any;
      metadata?: Record<string, any>;
    },
  ): Promise<void> {
    // Create delivery record
    const delivery = this.deliveryRepository.create({
      tenantId: event.tenantId,
      endpointId: endpoint.id,
      eventType: event.eventType,
      payload: event.payload,
      url: endpoint.url,
      status: 'pending',
    });

    const saved = await this.deliveryRepository.save(delivery);

    // Queue for delivery (would use Bull queue in production)
    // For now, just log
    this.logger.log(
      `Webhook delivery queued: ${event.eventType} to ${endpoint.url}`,
    );
  }

  /**
   * Generate webhook secret
   */
  private generateSecret(): string {
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let secret = '';
    for (let i = 0; i < 32; i++) {
      secret += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return secret;
  }
}
