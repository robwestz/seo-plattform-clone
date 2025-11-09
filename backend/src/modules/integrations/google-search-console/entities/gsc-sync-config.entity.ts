import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Project } from '../../../project/entities/project.entity';

@Entity('gsc_sync_configs')
@Index(['tenantId', 'projectId'])
@Index(['siteUrl'])
export class GSCSyncConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  tenantId: string;

  @Column({ type: 'uuid' })
  @Index()
  projectId: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ length: 500 })
  siteUrl: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'daily',
  })
  syncFrequency: 'hourly' | 'daily' | 'weekly';

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  lastSyncDate: Date;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  lastSyncStatus: 'pending' | 'success' | 'failed' | 'in_progress';

  @Column({ type: 'text', nullable: true })
  lastSyncError: string;

  @Column({ type: 'int', default: 0 })
  syncCount: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'projectId' })
  project: Project;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
