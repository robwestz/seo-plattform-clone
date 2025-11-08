import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Webhook, WebhookEvent } from './entities/webhook.entity';
import { WebhookDelivery } from './entities/webhook-delivery.entity';
import { CreateWebhookDto, UpdateWebhookDto } from './dto/webhook.dto';
import { randomBytes } from 'crypto';

/**
 * Webhook Service
 * Manages webhook registrations and triggers
 */
@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    @InjectRepository(Webhook)
    private webhookRepository: Repository<Webhook>,
    @InjectRepository(WebhookDelivery)
    private webhookDeliveryRepository: Repository<WebhookDelivery>,
  ) {}

  /**
   * Create a new webhook
   */
  async create(tenantId: string, dto: CreateWebhookDto): Promise<Webhook> {
    this.logger.log(`Creating webhook for tenant: ${tenantId}`);

    // Generate secret if not provided
    const secret = dto.secret || this.generateSecret();

    const webhook = this.webhookRepository.create({
      tenantId,
      projectId: dto.projectId,
      name: dto.name,
      url: dto.url,
      description: dto.description,
      events: dto.events,
      secret,
      headers: dto.headers,
      maxRetries: dto.maxRetries || 3,
      timeout: dto.timeout || 30000,
      active: true,
    });

    return this.webhookRepository.save(webhook);
  }

  /**
   * Get all webhooks for a tenant
   */
  async findAll(tenantId: string, projectId?: string): Promise<Webhook[]> {
    const query = this.webhookRepository
      .createQueryBuilder('webhook')
      .where('webhook.tenantId = :tenantId', { tenantId });

    if (projectId) {
      query.andWhere('(webhook.projectId = :projectId OR webhook.projectId IS NULL)', { projectId });
    }

    return query.orderBy('webhook.createdAt', 'DESC').getMany();
  }

  /**
   * Get webhook by ID
   */
  async findOne(id: string, tenantId: string): Promise<Webhook> {
    const webhook = await this.webhookRepository.findOne({
      where: { id, tenantId },
    });

    if (!webhook) {
      throw new NotFoundException('Webhook not found');
    }

    return webhook;
  }

  /**
   * Update webhook
   */
  async update(id: string, tenantId: string, dto: UpdateWebhookDto): Promise<Webhook> {
    this.logger.log(`Updating webhook: ${id}`);

    const webhook = await this.findOne(id, tenantId);

    Object.assign(webhook, dto);

    return this.webhookRepository.save(webhook);
  }

  /**
   * Delete webhook
   */
  async remove(id: string, tenantId: string): Promise<void> {
    this.logger.log(`Deleting webhook: ${id}`);

    const webhook = await this.findOne(id, tenantId);
    await this.webhookRepository.remove(webhook);
  }

  /**
   * Trigger webhooks for a specific event
   */
  async triggerEvent(
    tenantId: string,
    event: WebhookEvent,
    payload: Record<string, any>,
    projectId?: string,
  ): Promise<void> {
    this.logger.log(`Triggering webhooks for event: ${event}`);

    // Find all active webhooks for this event
    const query = this.webhookRepository
      .createQueryBuilder('webhook')
      .where('webhook.tenantId = :tenantId', { tenantId })
      .andWhere('webhook.active = :active', { active: true })
      .andWhere(':event = ANY(webhook.events)', { event });

    if (projectId) {
      query.andWhere('(webhook.projectId = :projectId OR webhook.projectId IS NULL)', { projectId });
    }

    const webhooks = await query.getMany();

    if (webhooks.length === 0) {
      this.logger.log(`No active webhooks found for event: ${event}`);
      return;
    }

    // Create delivery records for each webhook
    const deliveries = webhooks.map(webhook =>
      this.webhookDeliveryRepository.create({
        webhookId: webhook.id,
        event,
        payload,
        status: 'pending',
        attempts: 0,
      }),
    );

    await this.webhookDeliveryRepository.save(deliveries);

    this.logger.log(`Created ${deliveries.length} webhook delivery records for event: ${event}`);
  }

  /**
   * Get webhook deliveries
   */
  async getDeliveries(webhookId: string, tenantId: string): Promise<WebhookDelivery[]> {
    const webhook = await this.findOne(webhookId, tenantId);

    return this.webhookDeliveryRepository.find({
      where: { webhookId: webhook.id },
      order: { createdAt: 'DESC' },
      take: 100,
    });
  }

  /**
   * Get delivery statistics
   */
  async getDeliveryStats(webhookId: string, tenantId: string) {
    const webhook = await this.findOne(webhookId, tenantId);

    const [total, pending, success, failed] = await Promise.all([
      this.webhookDeliveryRepository.count({ where: { webhookId: webhook.id } }),
      this.webhookDeliveryRepository.count({ where: { webhookId: webhook.id, status: 'pending' } }),
      this.webhookDeliveryRepository.count({ where: { webhookId: webhook.id, status: 'success' } }),
      this.webhookDeliveryRepository.count({ where: { webhookId: webhook.id, status: 'failed' } }),
    ]);

    return {
      total,
      pending,
      success,
      failed,
      successRate: total > 0 ? ((success / total) * 100).toFixed(2) : 0,
    };
  }

  /**
   * Test webhook by sending a test event
   */
  async testWebhook(id: string, tenantId: string): Promise<WebhookDelivery> {
    this.logger.log(`Testing webhook: ${id}`);

    const webhook = await this.findOne(id, tenantId);

    const testPayload = {
      event: 'webhook.test',
      timestamp: new Date().toISOString(),
      webhook: {
        id: webhook.id,
        name: webhook.name,
      },
      message: 'This is a test webhook delivery',
    };

    const delivery = this.webhookDeliveryRepository.create({
      webhookId: webhook.id,
      event: 'webhook.test',
      payload: testPayload,
      status: 'pending',
      attempts: 0,
    });

    return this.webhookDeliveryRepository.save(delivery);
  }

  /**
   * Generate webhook secret
   */
  private generateSecret(): string {
    return randomBytes(32).toString('hex');
  }

  /**
   * Regenerate webhook secret
   */
  async regenerateSecret(id: string, tenantId: string): Promise<Webhook> {
    this.logger.log(`Regenerating secret for webhook: ${id}`);

    const webhook = await this.findOne(id, tenantId);
    webhook.secret = this.generateSecret();

    return this.webhookRepository.save(webhook);
  }
}
