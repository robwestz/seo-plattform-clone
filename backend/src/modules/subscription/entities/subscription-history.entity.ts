import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Tenant } from '../../../database/entities/tenant.entity';
import { SubscriptionPlan, SubscriptionStatus } from './subscription.entity';

/**
 * Subscription history event types
 */
export enum SubscriptionEventType {
  CREATED = 'created',
  UPGRADED = 'upgraded',
  DOWNGRADED = 'downgraded',
  RENEWED = 'renewed',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
  REACTIVATED = 'reactivated',
  TRIAL_STARTED = 'trial_started',
  TRIAL_ENDED = 'trial_ended',
  PAYMENT_FAILED = 'payment_failed',
  SUSPENDED = 'suspended',
}

/**
 * Subscription history entity
 * Tracks all changes and events in subscription lifecycle
 */
@Entity('subscription_history')
export class SubscriptionHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @Column({ name: 'subscription_id', type: 'uuid' })
  subscriptionId: string;

  @Column({
    name: 'event_type',
    type: 'enum',
    enum: SubscriptionEventType,
  })
  eventType: SubscriptionEventType;

  @Column({
    name: 'from_plan',
    type: 'enum',
    enum: SubscriptionPlan,
    nullable: true,
  })
  fromPlan: SubscriptionPlan;

  @Column({
    name: 'to_plan',
    type: 'enum',
    enum: SubscriptionPlan,
  })
  toPlan: SubscriptionPlan;

  @Column({
    name: 'from_status',
    type: 'enum',
    enum: SubscriptionStatus,
    nullable: true,
  })
  fromStatus: SubscriptionStatus;

  @Column({
    name: 'to_status',
    type: 'enum',
    enum: SubscriptionStatus,
  })
  toStatus: SubscriptionStatus;

  @Column({ name: 'price_amount', type: 'decimal', precision: 10, scale: 2 })
  priceAmount: number;

  @Column({ name: 'currency', default: 'USD', length: 3 })
  currency: string;

  @Column({ name: 'initiated_by', type: 'uuid', nullable: true })
  initiatedBy: string;

  @Column({ type: 'text', nullable: true })
  reason: string;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relationships
  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;
}
