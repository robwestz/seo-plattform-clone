import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { WhiteLabelService, EmailTemplateType } from '../white-label/white-label.service';
import { SubscriptionService } from '../subscription/subscription.service';

/**
 * Notification Type
 */
export enum NotificationType {
  EMAIL = 'email',
  IN_APP = 'in_app',
  WEBHOOK = 'webhook',
  SMS = 'sms',
}

/**
 * Notification Priority
 */
export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

/**
 * Notification Payload
 */
export interface NotificationPayload {
  tenantId: string;
  userId?: string;
  type: NotificationType;
  priority: NotificationPriority;
  subject: string;
  message: string;
  data?: Record<string, any>;
  templateType?: EmailTemplateType;
  metadata?: Record<string, any>;
}

/**
 * Notification Service
 * Handles all types of notifications (email, in-app, webhook, SMS)
 */
@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectQueue('notifications') private notificationQueue: Queue,
    private eventEmitter: EventEmitter2,
    private whiteLabelService: WhiteLabelService,
    private subscriptionService: SubscriptionService,
  ) {}

  /**
   * Send notification
   */
  async send(payload: NotificationPayload): Promise<void> {
    this.logger.log(
      `Queuing ${payload.type} notification for tenant ${payload.tenantId}`,
    );

    // Add to queue for processing
    await this.notificationQueue.add(
      'send-notification',
      payload,
      {
        priority: this.getPriorityValue(payload.priority),
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    );
  }

  /**
   * Send email notification
   */
  async sendEmail(params: {
    tenantId: string;
    to: string;
    subject: string;
    message: string;
    templateType?: EmailTemplateType;
    variables?: Record<string, string>;
  }): Promise<void> {
    await this.send({
      tenantId: params.tenantId,
      type: NotificationType.EMAIL,
      priority: NotificationPriority.NORMAL,
      subject: params.subject,
      message: params.message,
      templateType: params.templateType,
      data: {
        to: params.to,
        variables: params.variables,
      },
    });
  }

  /**
   * Send in-app notification
   */
  async sendInApp(params: {
    tenantId: string;
    userId: string;
    title: string;
    message: string;
    link?: string;
    icon?: string;
  }): Promise<void> {
    await this.send({
      tenantId: params.tenantId,
      userId: params.userId,
      type: NotificationType.IN_APP,
      priority: NotificationPriority.NORMAL,
      subject: params.title,
      message: params.message,
      data: {
        link: params.link,
        icon: params.icon,
      },
    });
  }

  /**
   * Send webhook notification
   */
  async sendWebhook(params: {
    tenantId: string;
    url: string;
    event: string;
    payload: Record<string, any>;
  }): Promise<void> {
    await this.send({
      tenantId: params.tenantId,
      type: NotificationType.WEBHOOK,
      priority: NotificationPriority.HIGH,
      subject: params.event,
      message: '',
      data: {
        url: params.url,
        event: params.event,
        payload: params.payload,
      },
    });
  }

  /**
   * Broadcast to all tenant users
   */
  async broadcastToTenant(params: {
    tenantId: string;
    subject: string;
    message: string;
    type?: NotificationType;
  }): Promise<void> {
    this.logger.log(`Broadcasting to all users in tenant ${params.tenantId}`);

    await this.send({
      tenantId: params.tenantId,
      type: params.type || NotificationType.IN_APP,
      priority: NotificationPriority.NORMAL,
      subject: params.subject,
      message: params.message,
      metadata: {
        broadcast: true,
      },
    });
  }

  /**
   * Event Listeners
   */

  @OnEvent('subscription.upgraded')
  async handleSubscriptionUpgraded(payload: {
    tenantId: string;
    oldPlan: string;
    newPlan: string;
  }): Promise<void> {
    await this.sendEmail({
      tenantId: payload.tenantId,
      to: '', // Would get from tenant
      subject: 'Subscription Upgraded',
      message: `Your subscription has been upgraded from ${payload.oldPlan} to ${payload.newPlan}`,
      templateType: EmailTemplateType.WELCOME,
    });
  }

  @OnEvent('subscription.cancelled')
  async handleSubscriptionCancelled(payload: {
    tenantId: string;
    cancelledAt: Date;
  }): Promise<void> {
    await this.sendEmail({
      tenantId: payload.tenantId,
      to: '',
      subject: 'Subscription Cancelled',
      message: 'Your subscription has been cancelled',
    });
  }

  @OnEvent('usage.limit_approaching')
  async handleLimitApproaching(payload: {
    tenantId: string;
    eventType: string;
    percentage: number;
    current: number;
    limit: number;
  }): Promise<void> {
    await this.sendEmail({
      tenantId: payload.tenantId,
      to: '',
      subject: 'Usage Limit Warning',
      message: `You have used ${payload.percentage}% of your ${payload.eventType} limit (${payload.current}/${payload.limit})`,
      templateType: EmailTemplateType.LIMIT_WARNING,
      variables: {
        eventType: payload.eventType,
        percentage: payload.percentage.toString(),
        current: payload.current.toString(),
        limit: payload.limit.toString(),
      },
    });
  }

  @OnEvent('invoice.payment_failed')
  async handlePaymentFailed(payload: {
    tenantId: string;
    invoiceId: string;
    amount: number;
  }): Promise<void> {
    await this.sendEmail({
      tenantId: payload.tenantId,
      to: '',
      subject: 'Payment Failed',
      message: `Your payment of $${payload.amount} failed. Please update your payment method.`,
      templateType: EmailTemplateType.PAYMENT_FAILED,
      variables: {
        amount: payload.amount.toString(),
        invoiceId: payload.invoiceId,
      },
    });
  }

  @OnEvent('churn.high_risk')
  async handleHighChurnRisk(payload: {
    tenantId: string;
    riskScore: number;
    recommendations: string[];
  }): Promise<void> {
    // Notify admin/sales team
    this.logger.warn(`High churn risk detected for tenant ${payload.tenantId}: ${payload.riskScore}`);

    await this.sendInApp({
      tenantId: payload.tenantId,
      userId: '', // Admin user
      title: 'Account Health Warning',
      message: `Your account health score is ${payload.riskScore}. Please review our recommendations.`,
    });
  }

  @OnEvent('stripe.invoice.paid')
  async handleStripInvoicePaid(invoice: any): Promise<void> {
    const tenantId = invoice.metadata?.tenantId;
    if (!tenantId) return;

    await this.sendEmail({
      tenantId,
      to: invoice.customer_email,
      subject: 'Payment Received',
      message: `Your payment of $${invoice.amount_paid / 100} has been received.`,
      templateType: EmailTemplateType.INVOICE,
    });
  }

  /**
   * Get priority value for queue
   */
  private getPriorityValue(priority: NotificationPriority): number {
    const priorityMap = {
      [NotificationPriority.LOW]: 4,
      [NotificationPriority.NORMAL]: 3,
      [NotificationPriority.HIGH]: 2,
      [NotificationPriority.URGENT]: 1,
    };

    return priorityMap[priority];
  }
}
