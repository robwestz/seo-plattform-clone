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
 * Subscription plan types
 */
export enum SubscriptionPlan {
  FREE = 'free',
  PRO = 'pro',
  BUSINESS = 'business',
  ENTERPRISE = 'enterprise',
  WHITE_LABEL = 'white_label',
}

/**
 * Subscription status
 */
export enum SubscriptionStatus {
  ACTIVE = 'active',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
  TRIAL = 'trial',
  PAST_DUE = 'past_due',
  SUSPENDED = 'suspended',
}

/**
 * Billing interval
 */
export enum BillingInterval {
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
}

/**
 * Subscription entity
 * Tracks current and historical subscription plans for tenants
 */
@Entity('subscriptions')
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @Column({
    type: 'enum',
    enum: SubscriptionPlan,
    default: SubscriptionPlan.FREE,
  })
  plan: SubscriptionPlan;

  @Column({
    type: 'enum',
    enum: SubscriptionStatus,
    default: SubscriptionStatus.ACTIVE,
  })
  status: SubscriptionStatus;

  @Column({
    name: 'billing_interval',
    type: 'enum',
    enum: BillingInterval,
    default: BillingInterval.MONTHLY,
  })
  billingInterval: BillingInterval;

  @Column({ name: 'price_amount', type: 'decimal', precision: 10, scale: 2, default: 0 })
  priceAmount: number;

  @Column({ name: 'currency', default: 'USD', length: 3 })
  currency: string;

  @Column({ name: 'stripe_subscription_id', nullable: true })
  stripeSubscriptionId: string;

  @Column({ name: 'stripe_customer_id', nullable: true })
  stripeCustomerId: string;

  @Column({ name: 'stripe_price_id', nullable: true })
  stripePriceId: string;

  @Column({ name: 'trial_ends_at', type: 'timestamp', nullable: true })
  trialEndsAt: Date;

  @Column({ name: 'current_period_start', type: 'timestamp', nullable: true })
  currentPeriodStart: Date;

  @Column({ name: 'current_period_end', type: 'timestamp', nullable: true })
  currentPeriodEnd: Date;

  @Column({ name: 'cancel_at_period_end', default: false })
  cancelAtPeriodEnd: boolean;

  @Column({ name: 'cancelled_at', type: 'timestamp', nullable: true })
  cancelledAt: Date;

  // Plan limits
  @Column({ name: 'max_users', default: 5 })
  maxUsers: number;

  @Column({ name: 'max_projects', default: 3 })
  maxProjects: number;

  @Column({ name: 'max_keywords', default: 100 })
  maxKeywords: number;

  @Column({ name: 'max_pages', default: 100 })
  maxPages: number;

  @Column({ name: 'max_backlinks', default: 1000 })
  maxBacklinks: number;

  @Column({ name: 'max_competitors', default: 5 })
  maxCompetitors: number;

  @Column({ name: 'max_api_calls_per_month', default: 10000 })
  maxApiCallsPerMonth: number;

  @Column({ name: 'has_white_label', default: false })
  hasWhiteLabel: boolean;

  @Column({ name: 'has_api_access', default: false })
  hasApiAccess: boolean;

  @Column({ name: 'has_priority_support', default: false })
  hasPrioritySupport: boolean;

  @Column({ name: 'has_custom_reports', default: false })
  hasCustomReports: boolean;

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
