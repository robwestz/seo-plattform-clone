import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { BillingService } from './billing.service';
import { BillingController } from './billing.controller';
import { Invoice } from './entities/invoice.entity';
import { PaymentMethod } from './entities/payment-method.entity';

/**
 * Billing Module
 * Manages billing, invoices, and payment processing via Stripe
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Invoice, PaymentMethod]),
    ConfigModule,
    EventEmitterModule.forRoot(),
  ],
  controllers: [BillingController],
  providers: [BillingService],
  exports: [BillingService],
})
export class BillingModule {}
