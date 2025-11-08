import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Headers,
  HttpCode,
  HttpStatus,
  RawBodyRequest,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { BillingService } from './billing.service';
import { CreatePaymentMethodDto } from './dto/create-payment-method.dto';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { Public } from '../../common/decorators/public.decorator';

/**
 * Billing Controller
 * Manages billing, invoices, and payment methods
 */
@ApiTags('billing')
@ApiBearerAuth()
@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  /**
   * Get all invoices for tenant
   */
  @Get('invoices')
  @ApiOperation({ summary: 'Get all invoices' })
  @ApiResponse({ status: 200, description: 'List of invoices' })
  async getInvoices(@CurrentTenant() tenantId: string) {
    return this.billingService.getInvoices(tenantId);
  }

  /**
   * Get invoice by ID
   */
  @Get('invoices/:id')
  @ApiOperation({ summary: 'Get invoice by ID' })
  @ApiResponse({ status: 200, description: 'Invoice details' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  async getInvoice(@CurrentTenant() tenantId: string, @Param('id') invoiceId: string) {
    return this.billingService.getInvoice(tenantId, invoiceId);
  }

  /**
   * Get all payment methods
   */
  @Get('payment-methods')
  @ApiOperation({ summary: 'Get all payment methods' })
  @ApiResponse({ status: 200, description: 'List of payment methods' })
  async getPaymentMethods(@CurrentTenant() tenantId: string) {
    return this.billingService.getPaymentMethods(tenantId);
  }

  /**
   * Add payment method
   */
  @Post('payment-methods')
  @ApiOperation({ summary: 'Add a new payment method' })
  @ApiResponse({ status: 201, description: 'Payment method added successfully' })
  async addPaymentMethod(
    @CurrentTenant() tenantId: string,
    @Body() createDto: CreatePaymentMethodDto,
  ) {
    return this.billingService.addPaymentMethod(tenantId, createDto);
  }

  /**
   * Set default payment method
   */
  @Post('payment-methods/:id/default')
  @ApiOperation({ summary: 'Set payment method as default' })
  @ApiResponse({ status: 200, description: 'Default payment method updated' })
  async setDefaultPaymentMethod(
    @CurrentTenant() tenantId: string,
    @Param('id') paymentMethodId: string,
  ) {
    return this.billingService.setDefaultPaymentMethod(tenantId, paymentMethodId);
  }

  /**
   * Delete payment method
   */
  @Delete('payment-methods/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete payment method' })
  @ApiResponse({ status: 204, description: 'Payment method deleted' })
  @ApiResponse({ status: 404, description: 'Payment method not found' })
  async deletePaymentMethod(
    @CurrentTenant() tenantId: string,
    @Param('id') paymentMethodId: string,
  ) {
    await this.billingService.deletePaymentMethod(tenantId, paymentMethodId);
  }

  /**
   * Stripe webhook endpoint
   */
  @Public()
  @Post('webhooks/stripe')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Stripe webhook handler' })
  @ApiResponse({ status: 200, description: 'Webhook processed' })
  async handleStripeWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() req: RawBodyRequest<Request>,
  ) {
    await this.billingService.handleWebhook(signature, req.body);
    return { received: true };
  }
}
