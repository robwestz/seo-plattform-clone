import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { SubscriptionService } from '../../subscription/subscription.service';
import { BillingService } from '../billing.service';
import { StripeIntegrationService } from '../stripe-integration.service';
import { NotificationService } from '../../notifications/notification.service';
import Stripe from 'stripe';

/**
 * Billing Event Listener
 * Handles all billing-related events from Stripe and internal systems
 */
@Injectable()
export class BillingEventListener {
  private readonly logger = new Logger(BillingEventListener.name);

  constructor(
    private subscriptionService: SubscriptionService,
    private billingService: BillingService,
    private stripeService: StripeIntegrationService,
    private notificationService: NotificationService,
  ) {}

  /**
   * Handle Stripe customer created
   */
  @OnEvent('stripe.customer.created')
  async handleCustomerCreated(customer: Stripe.Customer): Promise<void> {
    this.logger.log(`Stripe customer created: ${customer.id}`);

    const tenantId = customer.metadata?.tenantId;
    if (!tenantId) return;

    // Store Stripe customer ID in tenant record
    // await this.tenantService.updateStripeCustomerId(tenantId, customer.id);
  }

  /**
   * Handle Stripe subscription created
   */
  @OnEvent('stripe.subscription.created')
  async handleSubscriptionCreated(subscription: Stripe.Subscription): Promise<void> {
    this.logger.log(`Stripe subscription created: ${subscription.id}`);

    const tenantId = subscription.metadata?.tenantId;
    if (!tenantId) return;

    // Create or update local subscription record
    // This would sync the Stripe subscription with our database
  }

  /**
   * Handle Stripe subscription updated
   */
  @OnEvent('stripe.subscription.updated')
  async handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
    this.logger.log(`Stripe subscription updated: ${subscription.id}`);

    const tenantId = subscription.metadata?.tenantId;
    if (!tenantId) return;

    // Update local subscription record
    if (subscription.cancel_at_period_end) {
      this.logger.warn(`Subscription set to cancel for tenant ${tenantId}`);

      await this.notificationService.send({
        tenantId,
        type: 'email' as any,
        priority: 'high' as any,
        subject: 'Subscription Cancellation Scheduled',
        message: 'Your subscription is scheduled to cancel at the end of the billing period.',
      });
    }
  }

  /**
   * Handle Stripe subscription deleted
   */
  @OnEvent('stripe.subscription.deleted')
  async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
    this.logger.log(`Stripe subscription deleted: ${subscription.id}`);

    const tenantId = subscription.metadata?.tenantId;
    if (!tenantId) return;

    // Downgrade to free plan
    try {
      await this.subscriptionService.cancel(tenantId, false);
    } catch (error) {
      this.logger.error(`Failed to cancel subscription: ${error.message}`);
    }
  }

  /**
   * Handle invoice paid
   */
  @OnEvent('stripe.invoice.paid')
  async handleInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
    this.logger.log(`Invoice paid: ${invoice.id}`);

    const tenantId = invoice.metadata?.tenantId;
    if (!tenantId) return;

    // Send receipt email
    await this.notificationService.sendEmail({
      tenantId,
      to: invoice.customer_email || '',
      subject: 'Payment Receipt',
      message: `Your payment has been received.`,
    });
  }

  /**
   * Handle invoice payment failed
   */
  @OnEvent('stripe.invoice.payment_failed')
  async handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    this.logger.error(`Invoice payment failed: ${invoice.id}`);

    const tenantId = invoice.metadata?.tenantId;
    if (!tenantId) return;

    // Send payment failed notification
    await this.notificationService.sendEmail({
      tenantId,
      to: invoice.customer_email || '',
      subject: 'Payment Failed',
      message: `Your payment failed. Please update your payment method.`,
    });

    // After 3 failed attempts, downgrade to free plan
    if (invoice.attempt_count && invoice.attempt_count >= 3) {
      this.logger.warn(`Downgrading tenant ${tenantId} due to payment failures`);

      try {
        await this.subscriptionService.cancel(tenantId, false);
      } catch (error) {
        this.logger.error(`Failed to downgrade subscription: ${error.message}`);
      }
    }
  }

  @OnEvent('subscription.created')
  async handleLocalSubscriptionCreated(payload: { subscription: any; tenantId: string }): Promise<void> {
    this.logger.log(`Local subscription created for tenant ${payload.tenantId}`);

    await this.notificationService.sendEmail({
      tenantId: payload.tenantId,
      to: '',
      subject: 'Welcome!',
      message: 'Thank you for subscribing!',
    });
  }
}
