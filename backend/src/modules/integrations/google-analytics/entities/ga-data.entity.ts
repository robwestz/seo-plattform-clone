import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Tenant } from '../../../../database/entities/tenant.entity';
import { Project } from '../../../../database/entities/project.entity';

export enum GADataType {
  PAGE_VIEWS = 'page_views',
  SESSIONS = 'sessions',
  EVENTS = 'events',
  CONVERSIONS = 'conversions',
  REAL_TIME = 'real_time',
}

/**
 * Google Analytics Data Entity
 * Stores GA4 metrics and analytics data
 */
@Entity('ga_data')
@Index(['tenantId', 'projectId', 'dataType', 'date'])
@Index(['pagePath', 'date'])
export class GAData {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column({ type: 'uuid' })
  @Index()
  projectId: string;

  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'projectId' })
  project: Project;

  @Column({
    type: 'enum',
    enum: GADataType,
  })
  dataType: GADataType;

  @Column({ type: 'text' })
  propertyId: string;

  @Column({ type: 'date' })
  date: Date;

  @Column({ type: 'text', nullable: true })
  pagePath: string;

  @Column({ type: 'text', nullable: true })
  pageTitle: string;

  @Column({ type: 'integer', default: 0 })
  pageViews: number;

  @Column({ type: 'integer', default: 0 })
  sessions: number;

  @Column({ type: 'integer', default: 0 })
  users: number;

  @Column({ type: 'integer', default: 0 })
  newUsers: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  averageSessionDuration: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  bounceRate: number;

  @Column({ type: 'integer', default: 0 })
  conversions: number;

  @Column({ type: 'text', nullable: true })
  source: string;

  @Column({ type: 'text', nullable: true })
  medium: string;

  @Column({ type: 'text', nullable: true })
  campaign: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
