import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { UsageEventType } from './usage-event.entity';

/**
 * Aggregation period
 */
export enum AggregationPeriod {
  HOURLY = 'hourly',
  DAILY = 'daily',
  MONTHLY = 'monthly',
}

/**
 * Usage aggregate entity
 * Pre-aggregated usage statistics for performance
 */
@Entity('usage_aggregates')
@Index(['tenantId', 'period', 'periodStart'])
@Index(['eventType', 'periodStart'])
export class UsageAggregate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @Column({
    type: 'enum',
    enum: UsageEventType,
  })
  eventType: UsageEventType;

  @Column({
    type: 'enum',
    enum: AggregationPeriod,
  })
  period: AggregationPeriod;

  @Column({ name: 'period_start', type: 'timestamp' })
  periodStart: Date;

  @Column({ name: 'period_end', type: 'timestamp' })
  periodEnd: Date;

  @Column({ name: 'event_count', type: 'integer', default: 0 })
  eventCount: number;

  @Column({ name: 'total_quantity', type: 'integer', default: 0 })
  totalQuantity: number;

  @Column({ name: 'unique_users', type: 'integer', default: 0 })
  uniqueUsers: number;

  @Column({ name: 'unique_projects', type: 'integer', default: 0 })
  uniqueProjects: number;

  @Column({ name: 'avg_response_time_ms', type: 'decimal', precision: 10, scale: 2, nullable: true })
  avgResponseTimeMs: number;

  @Column({ name: 'success_count', type: 'integer', default: 0 })
  successCount: number;

  @Column({ name: 'error_count', type: 'integer', default: 0 })
  errorCount: number;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
