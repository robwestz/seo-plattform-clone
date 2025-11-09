import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('sync_jobs')
@Index(['tenantId', 'status'])
@Index(['integration', 'operation'])
@Index(['scheduleId'])
export class SyncJob {
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
    default: 'pending',
  })
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

  @Column({
    type: 'varchar',
    length: 20,
    default: 'medium',
  })
  priority: 'low' | 'medium' | 'high' | 'urgent';

  @Column({ type: 'jsonb', nullable: true })
  config: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  result: any;

  @Column({ type: 'text', nullable: true })
  error: string;

  @Column({ type: 'int', default: 0 })
  retryCount: number;

  @Column({ type: 'int', default: 3 })
  maxRetries: number;

  @Column({ type: 'timestamptz', nullable: true })
  nextRetryAt: Date;

  @Column({ type: 'uuid', nullable: true })
  scheduleId: string;

  @Column({ type: 'timestamptz', nullable: true })
  startedAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  completedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
