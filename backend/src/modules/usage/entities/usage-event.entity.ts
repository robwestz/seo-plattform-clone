import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index } from 'typeorm';
import { UsageEventType } from '../usage-tracking.service';

/**
 * Usage Event Entity
 * Stores historical usage events for analytics
 */
@Entity('usage_events')
@Index(['tenantId', 'timestamp'])
@Index(['tenantId', 'eventType', 'timestamp'])
export class UsageEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  tenantId: string;

  @Column({
    type: 'enum',
    enum: UsageEventType,
  })
  eventType: UsageEventType;

  @Column({ type: 'timestamp' })
  timestamp: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'int', default: 1 })
  creditsUsed: number;

  @CreateDateColumn()
  createdAt: Date;
}
