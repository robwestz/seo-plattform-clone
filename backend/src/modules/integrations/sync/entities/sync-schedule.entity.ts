import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('sync_schedules')
@Index(['tenantId', 'isActive'])
@Index(['integration', 'operation'])
export class SyncSchedule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  tenantId: string;

  @Column({ type: 'uuid', nullable: true })
  projectId: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ length: 100 })
  integration: string;

  @Column({ length: 100 })
  operation: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'daily',
  })
  frequency: 'hourly' | 'daily' | 'weekly' | 'monthly';

  @Column({
    type: 'varchar',
    length: 20,
    default: 'medium',
  })
  priority: 'low' | 'medium' | 'high' | 'urgent';

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'jsonb', nullable: true })
  config: Record<string, any>;

  @Column({ type: 'timestamptz', nullable: true })
  lastRunAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
