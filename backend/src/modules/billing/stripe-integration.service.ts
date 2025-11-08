import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import Stripe from 'stripe';

/**
 * Stripe Integration Service
 * Handles all Stripe API interactions
 * 
 * This service provides full Stripe SDK integration for:
 * - Customer management
 * - Subscription lifecycle
 * - Payment methods
 * - Invoices
 * - Webhooks
 * - Payment intents
 */
@Injectable()
export class StripeIntegrationService {
  private readonly logger = new Logger(StripeIntegrationService.name);
  private readonly stripe: Stripe;

  constructor(
    private configService: ConfigService,
    private eventEmitter: EventEmitter2,
  ) {
    const apiKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    
    if (!apiKey) {
      this.logger.warn('Stripe API key not configured. Billing features will not work.');
    }

    this.stripe = new Stripe(apiKey || 'sk_test_placeholder', {
      apiVersion: '2023-10-16',
      typescript: true,
    });
  }

  /**
   * Customer Management
   */

  async createCustomer(params: {
    email: string;
    name: string;
    tenantId: string;
    metadata?: Record<string, string>;
  }): Promise<Stripe.Customer> {
    this.logger.log(`Creating Stripe customer for ${params.email}`);

    try {
      const customer = await this.stripe.customers.create({
        email: params.email,
        name: params.name,
        metadata: {
          tenantId: params.tenantId,
          ...params.metadata,
        },
      });

      this.logger.log(`Customer created: ${customer.id}`);
      return customer;
    } catch (error) {
      this.logger.error(`Failed to create customer: ${error.message}`);
      throw new BadRequestException(`Failed to create customer: ${error.message}`);
    }
  }

  async updateCustomer(
    customerId: string,
    updates: {
      email?: string;
      name?: string;
      metadata?: Record<string, string>;
    },
  ): Promise<Stripe.Customer> {
    try {
      return await this.stripe.customers.update(customerId, updates);
    } catch (error) {
      this.logger.error(`Failed to update customer: ${error.message}`);
      throw error;
    }
  }

  async getCustomer(customerId: string): Promise<Stripe.Customer> {
    try {
      return await this.stripe.customers.retrieve(customerId) as Stripe.Customer;
    } catch (error) {
      this.logger.error(`Failed to retrieve customer: ${error.message}`);
      throw error;
    }
  }

  async deleteCustomer(customerId: string): Promise<void> {
    try {
      await this.stripe.customers.del(customerId);
      this.logger.log(`Customer deleted: ${customerId}`);
    } catch (error) {
      this.logger.error(`Failed to delete customer: ${error.message}`);
      throw error;
    }
  }

  /**
   * Subscription Management
   */

  async createSubscription(params: {
    customerId: string;
    priceId: string;
    tenantId: string;
    trialDays?: number;
    metadata?: Record<string, string>;
  }): Promise<Stripe.Subscription> {
    this.logger.log(`Creating subscription for customer ${params.customerId}`);

    try {
      const subscription = await this.stripe.subscriptions.create({
        customer: params.customerId,
        items: [{ price: params.priceId }],
        trial_period_days: params.trialDays,
        metadata: {
          tenantId: params.tenantId,
          ...params.metadata,
        },
        payment_behavior: 'default_incomplete',
        payment_settings: {
          save_default_payment_method: 'on_subscription',
        },
        expand: ['latest_invoice.payment_intent'],
      });

      this.logger.log(`Subscription created: ${subscription.id}`);
      return subscription;
    } catch (error) {
      this.logger.error(`Failed to create subscription: ${error.message}`);
      throw new BadRequestException(`Failed to create subscription: ${error.message}`);
    }
  }

  async updateSubscription(
    subscriptionId: string,
    updates: {
      priceId?: string;
      cancelAtPeriodEnd?: boolean;
      prorationBehavior?: 'create_prorations' | 'none' | 'always_invoice';
      metadata?: Record<string, string>;
    },
  ): Promise<Stripe.Subscription> {
    try {
      const updateParams: Stripe.SubscriptionUpdateParams = {
        cancel_at_period_end: updates.cancelAtPeriodEnd,
        proration_behavior: updates.prorationBehavior,
        metadata: updates.metadata,
      };

      if (updates.priceId) {
        const subscription = await this.getSubscription(subscriptionId);
        const currentItemId = subscription.items.data[0].id;

        updateParams.items = [
          {
            id: currentItemId,
            price: updates.priceId,
          },
        ];
      }

      return await this.stripe.subscriptions.update(subscriptionId, updateParams);
    } catch (error) {
      this.logger.error(`Failed to update subscription: ${error.message}`);
      throw error;
    }
  }

  async getSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    try {
      return await this.stripe.subscriptions.retrieve(subscriptionId);
    } catch (error) {
      this.logger.error(`Failed to retrieve subscription: ${error.message}`);
      throw error;
    }
  }

  async cancelSubscription(
    subscriptionId: string,
    cancelAtPeriodEnd: boolean = true,
  ): Promise<Stripe.Subscription> {
    try {
      if (cancelAtPeriodEnd) {
        return await this.stripe.subscriptions.update(subscriptionId, {
          cancel_at_period_end: true,
        });
      } else {
        return await this.stripe.subscriptions.cancel(subscriptionId);
      }
    } catch (error) {
      this.logger.error(`Failed to cancel subscription: ${error.message}`);
      throw error;
    }
  }

  async reactivateSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    try {
      return await this.stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: false,
      });
    } catch (error) {
      this.logger.error(`Failed to reactivate subscription: ${error.message}`);
      throw error;
    }
  }

  /**
   * Payment Methods
   */

  async attachPaymentMethod(
    paymentMethodId: string,
    customerId: string,
  ): Promise<Stripe.PaymentMethod> {
    try {
      return await this.stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId,
      });
    } catch (error) {
      this.logger.error(`Failed to attach payment method: ${error.message}`);
      throw error;
    }
  }

  async detachPaymentMethod(paymentMethodId: string): Promise<Stripe.PaymentMethod> {
    try {
      return await this.stripe.paymentMethods.detach(paymentMethodId);
    } catch (error) {
      this.logger.error(`Failed to detach payment method: ${error.message}`);
      throw error;
    }
  }

  async setDefaultPaymentMethod(
    customerId: string,
    paymentMethodId: string,
  ): Promise<Stripe.Customer> {
    try {
      return await this.stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to set default payment method: ${error.message}`);
      throw error;
    }
  }

  async listPaymentMethods(customerId: string): Promise<Stripe.PaymentMethod[]> {
    try {
      const paymentMethods = await this.stripe.paymentMethods.list({
        customer: customerId,
        type: 'card',
      });

      return paymentMethods.data;
    } catch (error) {
      this.logger.error(`Failed to list payment methods: ${error.message}`);
      throw error;
    }
  }

  /**
   * Invoices
   */

  async createInvoice(params: {
    customerId: string;
    subscriptionId?: string;
    amount?: number;
    description?: string;
    metadata?: Record<string, string>;
  }): Promise<Stripe.Invoice> {
    try {
      const invoice = await this.stripe.invoices.create({
        customer: params.customerId,
        subscription: params.subscriptionId,
        description: params.description,
        metadata: params.metadata,
        auto_advance: true,
      });

      if (params.amount) {
        await this.stripe.invoiceItems.create({
          customer: params.customerId,
          invoice: invoice.id,
          amount: params.amount,
          currency: 'usd',
          description: params.description,
        });
      }

      return invoice;
    } catch (error) {
      this.logger.error(`Failed to create invoice: ${error.message}`);
      throw error;
    }
  }

  async finalizeInvoice(invoiceId: string): Promise<Stripe.Invoice> {
    try {
      return await this.stripe.invoices.finalizeInvoice(invoiceId);
    } catch (error) {
      this.logger.error(`Failed to finalize invoice: ${error.message}`);
      throw error;
    }
  }

  async payInvoice(invoiceId: string): Promise<Stripe.Invoice> {
    try {
      return await this.stripe.invoices.pay(invoiceId);
    } catch (error) {
      this.logger.error(`Failed to pay invoice: ${error.message}`);
      throw error;
    }
  }

  async voidInvoice(invoiceId: string): Promise<Stripe.Invoice> {
    try {
      return await this.stripe.invoices.voidInvoice(invoiceId);
    } catch (error) {
      this.logger.error(`Failed to void invoice: ${error.message}`);
      throw error;
    }
  }

  async listInvoices(customerId: string, limit: number = 100): Promise<Stripe.Invoice[]> {
    try {
      const invoices = await this.stripe.invoices.list({
        customer: customerId,
        limit,
      });

      return invoices.data;
    } catch (error) {
      this.logger.error(`Failed to list invoices: ${error.message}`);
      throw error;
    }
  }

  async getInvoice(invoiceId: string): Promise<Stripe.Invoice> {
    try {
      return await this.stripe.invoices.retrieve(invoiceId);
    } catch (error) {
      this.logger.error(`Failed to retrieve invoice: ${error.message}`);
      throw error;
    }
  }

  /**
   * Payment Intents
   */

  async createPaymentIntent(params: {
    amount: number;
    currency: string;
    customerId: string;
    metadata?: Record<string, string>;
  }): Promise<Stripe.PaymentIntent> {
    try {
      return await this.stripe.paymentIntents.create({
        amount: params.amount,
        currency: params.currency,
        customer: params.customerId,
        metadata: params.metadata,
        automatic_payment_methods: {
          enabled: true,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to create payment intent: ${error.message}`);
      throw error;
    }
  }

  async confirmPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    try {
      return await this.stripe.paymentIntents.confirm(paymentIntentId);
    } catch (error) {
      this.logger.error(`Failed to confirm payment intent: ${error.message}`);
      throw error;
    }
  }

  async cancelPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    try {
      return await this.stripe.paymentIntents.cancel(paymentIntentId);
    } catch (error) {
      this.logger.error(`Failed to cancel payment intent: ${error.message}`);
      throw error;
    }
  }

  /**
   * Proration & Billing
   */

  async calculateProration(params: {
    subscriptionId: string;
    newPriceId: string;
    prorationDate?: number;
  }): Promise<{
    proratedAmount: number;
    upcomingInvoice: Stripe.Invoice;
  }> {
    try {
      const subscription = await this.getSubscription(params.subscriptionId);
      const currentItemId = subscription.items.data[0].id;

      const upcomingInvoice = await this.stripe.invoices.retrieveUpcoming({
        customer: subscription.customer as string,
        subscription: params.subscriptionId,
        subscription_items: [
          {
            id: currentItemId,
            price: params.newPriceId,
          },
        ],
        subscription_proration_date: params.prorationDate || Math.floor(Date.now() / 1000),
      });

      const proratedAmount = upcomingInvoice.total;

      return {
        proratedAmount,
        upcomingInvoice,
      };
    } catch (error) {
      this.logger.error(`Failed to calculate proration: ${error.message}`);
      throw error;
    }
  }

  async previewUpcomingInvoice(subscriptionId: string): Promise<Stripe.Invoice> {
    try {
      const subscription = await this.getSubscription(subscriptionId);

      return await this.stripe.invoices.retrieveUpcoming({
        customer: subscription.customer as string,
        subscription: subscriptionId,
      });
    } catch (error) {
      this.logger.error(`Failed to preview upcoming invoice: ${error.message}`);
      throw error;
    }
  }

  /**
   * Webhook Handling
   */

  constructWebhookEvent(
    payload: string | Buffer,
    signature: string,
    webhookSecret: string,
  ): Stripe.Event {
    try {
      return this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (error) {
      this.logger.error(`Webhook signature verification failed: ${error.message}`);
      throw new BadRequestException('Invalid webhook signature');
    }
  }

  async handleWebhookEvent(event: Stripe.Event): Promise<void> {
    this.logger.log(`Processing webhook event: ${event.type}`);

    try {
      switch (event.type) {
        case 'customer.created':
          await this.handleCustomerCreated(event.data.object as Stripe.Customer);
          break;

        case 'customer.updated':
          await this.handleCustomerUpdated(event.data.object as Stripe.Customer);
          break;

        case 'customer.deleted':
          await this.handleCustomerDeleted(event.data.object as Stripe.Customer);
          break;

        case 'customer.subscription.created':
          await this.handleSubscriptionCreated(event.data.object as Stripe.Subscription);
          break;

        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
          break;

        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
          break;

        case 'invoice.created':
          await this.handleInvoiceCreated(event.data.object as Stripe.Invoice);
          break;

        case 'invoice.paid':
          await this.handleInvoicePaid(event.data.object as Stripe.Invoice);
          break;

        case 'invoice.payment_failed':
          await this.handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
          break;

        case 'payment_intent.succeeded':
          await this.handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
          break;

        case 'payment_intent.payment_failed':
          await this.handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
          break;

        case 'payment_method.attached':
          await this.handlePaymentMethodAttached(event.data.object as Stripe.PaymentMethod);
          break;

        case 'payment_method.detached':
          await this.handlePaymentMethodDetached(event.data.object as Stripe.PaymentMethod);
          break;

        default:
          this.logger.warn(`Unhandled webhook event type: ${event.type}`);
      }
    } catch (error) {
      this.logger.error(`Error processing webhook event: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Webhook event handlers
   */

  private async handleCustomerCreated(customer: Stripe.Customer): Promise<void> {
    this.eventEmitter.emit('stripe.customer.created', customer);
  }

  private async handleCustomerUpdated(customer: Stripe.Customer): Promise<void> {
    this.eventEmitter.emit('stripe.customer.updated', customer);
  }

  private async handleCustomerDeleted(customer: Stripe.Customer): Promise<void> {
    this.eventEmitter.emit('stripe.customer.deleted', customer);
  }

  private async handleSubscriptionCreated(subscription: Stripe.Subscription): Promise<void> {
    this.eventEmitter.emit('stripe.subscription.created', subscription);
  }

  private async handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
    this.eventEmitter.emit('stripe.subscription.updated', subscription);
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
    this.eventEmitter.emit('stripe.subscription.deleted', subscription);
  }

  private async handleInvoiceCreated(invoice: Stripe.Invoice): Promise<void> {
    this.eventEmitter.emit('stripe.invoice.created', invoice);
  }

  private async handleInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
    this.eventEmitter.emit('stripe.invoice.paid', invoice);
  }

  private async handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    this.eventEmitter.emit('stripe.invoice.payment_failed', invoice);
  }

  private async handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    this.eventEmitter.emit('stripe.payment_intent.succeeded', paymentIntent);
  }

  private async handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    this.eventEmitter.emit('stripe.payment_intent.failed', paymentIntent);
  }

  private async handlePaymentMethodAttached(paymentMethod: Stripe.PaymentMethod): Promise<void> {
    this.eventEmitter.emit('stripe.payment_method.attached', paymentMethod);
  }

  private async handlePaymentMethodDetached(paymentMethod: Stripe.PaymentMethod): Promise<void> {
    this.eventEmitter.emit('stripe.payment_method.detached', paymentMethod);
  }

  /**
   * Utility methods
   */

  async createCheckoutSession(params: {
    customerId?: string;
    priceId: string;
    successUrl: string;
    cancelUrl: string;
    trialDays?: number;
    metadata?: Record<string, string>;
  }): Promise<Stripe.Checkout.Session> {
    try {
      return await this.stripe.checkout.sessions.create({
        customer: params.customerId,
        mode: 'subscription',
        line_items: [
          {
            price: params.priceId,
            quantity: 1,
          },
        ],
        success_url: params.successUrl,
        cancel_url: params.cancelUrl,
        subscription_data: {
          trial_period_days: params.trialDays,
          metadata: params.metadata,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to create checkout session: ${error.message}`);
      throw error;
    }
  }

  async createBillingPortalSession(params: {
    customerId: string;
    returnUrl: string;
  }): Promise<Stripe.BillingPortal.Session> {
    try {
      return await this.stripe.billingPortal.sessions.create({
        customer: params.customerId,
        return_url: params.returnUrl,
      });
    } catch (error) {
      this.logger.error(`Failed to create billing portal session: ${error.message}`);
      throw error;
    }
  }
}
