import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { WebhookService } from './webhook.service';
import { WebhookDeliveryService } from './delivery.service';
import { CurrentTenant } from '../../../common/decorators/current-tenant.decorator';
import { CreateWebhookDto, UpdateWebhookDto, TriggerWebhookDto } from './dto/webhook.dto';

/**
 * Webhook Controller
 * API endpoints for webhook management
 */
@Controller('integrations/webhooks')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(
    private readonly webhookService: WebhookService,
    private readonly deliveryService: WebhookDeliveryService,
  ) {}

  /**
   * Create webhook
   * POST /integrations/webhooks
   */
  @Post()
  async create(
    @CurrentTenant('id') tenantId: string,
    @Body() dto: CreateWebhookDto,
  ) {
    this.logger.log('Creating webhook');

    const webhook = await this.webhookService.create(tenantId, dto);

    return {
      success: true,
      webhook,
    };
  }

  /**
   * List all webhooks
   * GET /integrations/webhooks
   */
  @Get()
  async findAll(
    @CurrentTenant('id') tenantId: string,
    @Query('projectId') projectId?: string,
  ) {
    this.logger.log('Listing webhooks');

    const webhooks = await this.webhookService.findAll(tenantId, projectId);

    return {
      success: true,
      webhooks,
    };
  }

  /**
   * Get webhook by ID
   * GET /integrations/webhooks/:id
   */
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @CurrentTenant('id') tenantId: string,
  ) {
    this.logger.log(`Getting webhook: ${id}`);

    const webhook = await this.webhookService.findOne(id, tenantId);

    return {
      success: true,
      webhook,
    };
  }

  /**
   * Update webhook
   * PUT /integrations/webhooks/:id
   */
  @Put(':id')
  async update(
    @Param('id') id: string,
    @CurrentTenant('id') tenantId: string,
    @Body() dto: UpdateWebhookDto,
  ) {
    this.logger.log(`Updating webhook: ${id}`);

    const webhook = await this.webhookService.update(id, tenantId, dto);

    return {
      success: true,
      webhook,
    };
  }

  /**
   * Delete webhook
   * DELETE /integrations/webhooks/:id
   */
  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @CurrentTenant('id') tenantId: string,
  ) {
    this.logger.log(`Deleting webhook: ${id}`);

    await this.webhookService.remove(id, tenantId);

    return {
      success: true,
      message: 'Webhook deleted successfully',
    };
  }

  /**
   * Get webhook deliveries
   * GET /integrations/webhooks/:id/deliveries
   */
  @Get(':id/deliveries')
  async getDeliveries(
    @Param('id') id: string,
    @CurrentTenant('id') tenantId: string,
  ) {
    this.logger.log(`Getting deliveries for webhook: ${id}`);

    const deliveries = await this.webhookService.getDeliveries(id, tenantId);

    return {
      success: true,
      deliveries,
    };
  }

  /**
   * Get delivery statistics
   * GET /integrations/webhooks/:id/stats
   */
  @Get(':id/stats')
  async getStats(
    @Param('id') id: string,
    @CurrentTenant('id') tenantId: string,
  ) {
    this.logger.log(`Getting stats for webhook: ${id}`);

    const stats = await this.webhookService.getDeliveryStats(id, tenantId);

    return {
      success: true,
      stats,
    };
  }

  /**
   * Test webhook
   * POST /integrations/webhooks/:id/test
   */
  @Post(':id/test')
  async test(
    @Param('id') id: string,
    @CurrentTenant('id') tenantId: string,
  ) {
    this.logger.log(`Testing webhook: ${id}`);

    const delivery = await this.webhookService.testWebhook(id, tenantId);

    // Process delivery immediately
    await this.deliveryService.deliverWebhook(delivery);

    return {
      success: true,
      message: 'Test webhook sent',
      deliveryId: delivery.id,
    };
  }

  /**
   * Regenerate webhook secret
   * POST /integrations/webhooks/:id/regenerate-secret
   */
  @Post(':id/regenerate-secret')
  async regenerateSecret(
    @Param('id') id: string,
    @CurrentTenant('id') tenantId: string,
  ) {
    this.logger.log(`Regenerating secret for webhook: ${id}`);

    const webhook = await this.webhookService.regenerateSecret(id, tenantId);

    return {
      success: true,
      secret: webhook.secret,
    };
  }

  /**
   * Retry failed delivery
   * POST /integrations/webhooks/deliveries/:deliveryId/retry
   */
  @Post('deliveries/:deliveryId/retry')
  async retryDelivery(@Param('deliveryId') deliveryId: string) {
    this.logger.log(`Retrying delivery: ${deliveryId}`);

    await this.deliveryService.retryDelivery(deliveryId);

    return {
      success: true,
      message: 'Delivery retry initiated',
    };
  }

  /**
   * Trigger webhook event (for testing/manual triggers)
   * POST /integrations/webhooks/trigger
   */
  @Post('trigger')
  async trigger(
    @CurrentTenant('id') tenantId: string,
    @Body() dto: TriggerWebhookDto,
  ) {
    this.logger.log(`Manually triggering webhook event: ${dto.event}`);

    await this.webhookService.triggerEvent(
      tenantId,
      dto.event,
      dto.payload,
      dto.projectId,
    );

    return {
      success: true,
      message: 'Webhook event triggered',
    };
  }
}
