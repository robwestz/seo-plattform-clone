import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Tenant } from '../../../database/entities/tenant.entity';

/**
 * Invoice status
 */
export enum InvoiceStatus {
  DRAFT = 'draft',
  OPEN = 'open',
  PAID = 'paid',
  VOID = 'void',
  UNCOLLECTIBLE = 'uncollectible',
}

/**
 * Invoice entity
 * Tracks billing invoices for subscriptions
 */
@Entity('invoices')
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @Column({ name: 'subscription_id', type: 'uuid', nullable: true })
  subscriptionId: string;

  @Column({ name: 'invoice_number', unique: true })
  invoiceNumber: string;

  @Column({ name: 'stripe_invoice_id', nullable: true })
  stripeInvoiceId: string;

  @Column({
    type: 'enum',
    enum: InvoiceStatus,
    default: InvoiceStatus.DRAFT,
  })
  status: InvoiceStatus;

  @Column({ name: 'amount_due', type: 'decimal', precision: 10, scale: 2 })
  amountDue: number;

  @Column({ name: 'amount_paid', type: 'decimal', precision: 10, scale: 2, default: 0 })
  amountPaid: number;

  @Column({ name: 'amount_remaining', type: 'decimal', precision: 10, scale: 2 })
  amountRemaining: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  tax: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  discount: number;

  @Column({ name: 'subtotal', type: 'decimal', precision: 10, scale: 2 })
  subtotal: number;

  @Column({ default: 'USD', length: 3 })
  currency: string;

  @Column({ name: 'billing_reason', nullable: true })
  billingReason: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'invoice_pdf', type: 'text', nullable: true })
  invoicePdf: string;

  @Column({ name: 'hosted_invoice_url', type: 'text', nullable: true })
  hostedInvoiceUrl: string;

  @Column({ name: 'period_start', type: 'timestamp', nullable: true })
  periodStart: Date;

  @Column({ name: 'period_end', type: 'timestamp', nullable: true })
  periodEnd: Date;

  @Column({ name: 'due_date', type: 'timestamp', nullable: true })
  dueDate: Date;

  @Column({ name: 'paid_at', type: 'timestamp', nullable: true })
  paidAt: Date;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;
}
