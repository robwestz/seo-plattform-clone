import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Invoice, InvoiceStatus } from './entities/invoice.entity';
import { PaymentMethod } from './entities/payment-method.entity';
import { CreatePaymentMethodDto } from './dto/create-payment-method.dto';

/**
 * Billing Service
 * Manages Stripe integration, invoices, and payment methods
 *
 * Note: This is a mock implementation. In production, you would integrate
 * with the actual Stripe SDK (stripe package).
 */
@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);
  private readonly stripeSecretKey: string;
  private readonly stripeWebhookSecret: string;

  constructor(
    @InjectRepository(Invoice)
    private invoiceRepository: Repository<Invoice>,
    @InjectRepository(PaymentMethod)
    private paymentMethodRepository: Repository<PaymentMethod>,
    private configService: ConfigService,
    private eventEmitter: EventEmitter2,
  ) {
    this.stripeSecretKey = this.configService.get<string>('STRIPE_SECRET_KEY', '');
    this.stripeWebhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET', '');
  }

  /**
   * Create Stripe customer for tenant
   */
  async createCustomer(tenantId: string, email: string, name: string): Promise<string> {
    this.logger.log(`Creating Stripe customer for tenant ${tenantId}`);

    // In production: const customer = await stripe.customers.create({ email, name, metadata: { tenantId } });
    // Mock implementation
    const customerId = `cus_${tenantId.substring(0, 14)}`;

    this.logger.log(`Created Stripe customer: ${customerId}`);
    return customerId;
  }

  /**
   * Add payment method
   */
  async addPaymentMethod(
    tenantId: string,
    createDto: CreatePaymentMethodDto,
  ): Promise<PaymentMethod> {
    this.logger.log(`Adding payment method for tenant ${tenantId}`);

    // If setting as default, unset other default methods
    if (createDto.isDefault) {
      await this.paymentMethodRepository.update(
        { tenantId, isDefault: true },
        { isDefault: false },
      );
    }

    // In production: Fetch payment method details from Stripe
    // const stripePaymentMethod = await stripe.paymentMethods.retrieve(createDto.stripePaymentMethodId);

    // Mock payment method details
    const paymentMethod = this.paymentMethodRepository.create({
      tenantId,
      stripePaymentMethodId: createDto.stripePaymentMethodId,
      type: 'card' as any,
      isDefault: createDto.isDefault || false,
      cardBrand: 'visa',
      cardLast4: '4242',
      cardExpMonth: 12,
      cardExpYear: 2025,
    });

    const saved = await this.paymentMethodRepository.save(paymentMethod);

    this.eventEmitter.emit('payment_method.added', { paymentMethod: saved, tenantId });

    return saved;
  }

  /**
   * Get payment methods for tenant
   */
  async getPaymentMethods(tenantId: string): Promise<PaymentMethod[]> {
    return this.paymentMethodRepository.find({
      where: { tenantId, deletedAt: null },
      order: { isDefault: 'DESC', createdAt: 'DESC' },
    });
  }

  /**
   * Set default payment method
   */
  async setDefaultPaymentMethod(tenantId: string, paymentMethodId: string): Promise<PaymentMethod> {
    const paymentMethod = await this.paymentMethodRepository.findOne({
      where: { id: paymentMethodId, tenantId },
    });

    if (!paymentMethod) {
      throw new NotFoundException('Payment method not found');
    }

    // Unset other default methods
    await this.paymentMethodRepository.update({ tenantId, isDefault: true }, { isDefault: false });

    paymentMethod.isDefault = true;
    return this.paymentMethodRepository.save(paymentMethod);
  }

  /**
   * Delete payment method
   */
  async deletePaymentMethod(tenantId: string, paymentMethodId: string): Promise<void> {
    const paymentMethod = await this.paymentMethodRepository.findOne({
      where: { id: paymentMethodId, tenantId },
    });

    if (!paymentMethod) {
      throw new NotFoundException('Payment method not found');
    }

    // In production: await stripe.paymentMethods.detach(paymentMethod.stripePaymentMethodId);

    paymentMethod.deletedAt = new Date();
    await this.paymentMethodRepository.save(paymentMethod);

    this.eventEmitter.emit('payment_method.deleted', { paymentMethodId, tenantId });
  }

  /**
   * Create invoice
   */
  async createInvoice(
    tenantId: string,
    subscriptionId: string,
    amount: number,
    description?: string,
  ): Promise<Invoice> {
    this.logger.log(`Creating invoice for tenant ${tenantId}`);

    const invoiceNumber = this.generateInvoiceNumber();

    const invoice = this.invoiceRepository.create({
      tenantId,
      subscriptionId,
      invoiceNumber,
      status: InvoiceStatus.OPEN,
      amountDue: amount,
      amountPaid: 0,
      amountRemaining: amount,
      subtotal: amount,
      currency: 'USD',
      description,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    });

    const saved = await this.invoiceRepository.save(invoice);

    this.eventEmitter.emit('invoice.created', { invoice: saved, tenantId });

    return saved;
  }

  /**
   * Get invoices for tenant
   */
  async getInvoices(tenantId: string): Promise<Invoice[]> {
    return this.invoiceRepository.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get invoice by ID
   */
  async getInvoice(tenantId: string, invoiceId: string): Promise<Invoice> {
    const invoice = await this.invoiceRepository.findOne({
      where: { id: invoiceId, tenantId },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    return invoice;
  }

  /**
   * Mark invoice as paid
   */
  async markInvoicePaid(invoiceId: string, paymentIntentId?: string): Promise<Invoice> {
    const invoice = await this.invoiceRepository.findOne({ where: { id: invoiceId } });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    invoice.status = InvoiceStatus.PAID;
    invoice.amountPaid = invoice.amountDue;
    invoice.amountRemaining = 0;
    invoice.paidAt = new Date();

    if (paymentIntentId) {
      invoice.metadata = { ...invoice.metadata, paymentIntentId };
    }

    const updated = await this.invoiceRepository.save(invoice);

    this.eventEmitter.emit('invoice.paid', { invoice: updated, tenantId: invoice.tenantId });

    return updated;
  }

  /**
   * Handle Stripe webhook events
   */
  async handleWebhook(signature: string, payload: any): Promise<void> {
    this.logger.log('Processing Stripe webhook');

    // In production: Verify webhook signature
    // const event = stripe.webhooks.constructEvent(payload, signature, this.stripeWebhookSecret);

    const event = payload;

    switch (event.type) {
      case 'invoice.paid':
        await this.handleInvoicePaid(event.data.object);
        break;

      case 'invoice.payment_failed':
        await this.handleInvoicePaymentFailed(event.data.object);
        break;

      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object);
        break;

      case 'payment_method.attached':
        await this.handlePaymentMethodAttached(event.data.object);
        break;

      default:
        this.logger.log(`Unhandled webhook event type: ${event.type}`);
    }
  }

  /**
   * Handle invoice paid webhook
   */
  private async handleInvoicePaid(stripeInvoice: any): Promise<void> {
    this.logger.log(`Invoice paid: ${stripeInvoice.id}`);

    const invoice = await this.invoiceRepository.findOne({
      where: { stripeInvoiceId: stripeInvoice.id },
    });

    if (invoice) {
      await this.markInvoicePaid(invoice.id, stripeInvoice.payment_intent);
    }
  }

  /**
   * Handle invoice payment failed webhook
   */
  private async handleInvoicePaymentFailed(stripeInvoice: any): Promise<void> {
    this.logger.log(`Invoice payment failed: ${stripeInvoice.id}`);

    const invoice = await this.invoiceRepository.findOne({
      where: { stripeInvoiceId: stripeInvoice.id },
    });

    if (invoice) {
      this.eventEmitter.emit('invoice.payment_failed', {
        invoice,
        tenantId: invoice.tenantId,
      });
    }
  }

  /**
   * Handle subscription updated webhook
   */
  private async handleSubscriptionUpdated(stripeSubscription: any): Promise<void> {
    this.logger.log(`Subscription updated: ${stripeSubscription.id}`);

    this.eventEmitter.emit('subscription.webhook.updated', {
      stripeSubscriptionId: stripeSubscription.id,
      status: stripeSubscription.status,
    });
  }

  /**
   * Handle subscription deleted webhook
   */
  private async handleSubscriptionDeleted(stripeSubscription: any): Promise<void> {
    this.logger.log(`Subscription deleted: ${stripeSubscription.id}`);

    this.eventEmitter.emit('subscription.webhook.deleted', {
      stripeSubscriptionId: stripeSubscription.id,
    });
  }

  /**
   * Handle payment method attached webhook
   */
  private async handlePaymentMethodAttached(stripePaymentMethod: any): Promise<void> {
    this.logger.log(`Payment method attached: ${stripePaymentMethod.id}`);
  }

  /**
   * Calculate proration for plan changes
   */
  async calculateProration(
    tenantId: string,
    newPlanPrice: number,
    currentPeriodEnd: Date,
  ): Promise<number> {
    const now = new Date();
    const daysRemaining = Math.ceil((currentPeriodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const daysInPeriod = 30; // Assuming monthly billing

    // Calculate prorated amount
    const proratedCredit = (daysRemaining / daysInPeriod) * newPlanPrice;

    return Math.max(0, proratedCredit);
  }

  /**
   * Generate unique invoice number
   */
  private generateInvoiceNumber(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0');

    return `INV-${year}${month}-${random}`;
  }
}
