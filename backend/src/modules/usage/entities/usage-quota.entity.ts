import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { UsageEventType } from '../usage-tracking.service';

/**
 * Usage Quota Entity
 * Stores custom quotas for tenants (overrides subscription defaults)
 */
@Entity('usage_quotas')
@Index(['tenantId', 'eventType'], { unique: true })
export class UsageQuota {
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

  @Column({ type: 'int' })
  quota: number; // -1 for unlimited

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
