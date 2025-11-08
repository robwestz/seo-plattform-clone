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
 * Payment method type
 */
export enum PaymentMethodType {
  CARD = 'card',
  BANK_ACCOUNT = 'bank_account',
  PAYPAL = 'paypal',
}

/**
 * Payment method entity
 * Stores customer payment methods
 */
@Entity('payment_methods')
export class PaymentMethod {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @Column({ name: 'stripe_payment_method_id', nullable: true })
  stripePaymentMethodId: string;

  @Column({
    type: 'enum',
    enum: PaymentMethodType,
    default: PaymentMethodType.CARD,
  })
  type: PaymentMethodType;

  @Column({ name: 'is_default', default: false })
  isDefault: boolean;

  // Card details (last 4 digits, brand, etc.)
  @Column({ name: 'card_brand', nullable: true })
  cardBrand: string;

  @Column({ name: 'card_last4', nullable: true })
  cardLast4: string;

  @Column({ name: 'card_exp_month', nullable: true })
  cardExpMonth: number;

  @Column({ name: 'card_exp_year', nullable: true })
  cardExpYear: number;

  // Bank account details
  @Column({ name: 'bank_name', nullable: true })
  bankName: string;

  @Column({ name: 'bank_last4', nullable: true })
  bankLast4: string;

  @Column({ name: 'billing_email', nullable: true })
  billingEmail: string;

  @Column({ type: 'jsonb', default: {} })
  billingAddress: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date;

  // Relationships
  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;
}
