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

export enum GSCDataType {
  PERFORMANCE = 'performance',
  INDEX_COVERAGE = 'index_coverage',
  SITEMAPS = 'sitemaps',
  URL_INSPECTION = 'url_inspection',
}

/**
 * Google Search Console Data Entity
 * Stores performance metrics and index data from GSC
 */
@Entity('gsc_data')
@Index(['tenantId', 'projectId', 'dataType', 'date'])
@Index(['url', 'date'])
export class GSCData {
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
    enum: GSCDataType,
  })
  dataType: GSCDataType;

  @Column({ type: 'text' })
  url: string;

  @Column({ type: 'text', nullable: true })
  query: string;

  @Column({ type: 'date' })
  date: Date;

  @Column({ type: 'integer', default: 0 })
  clicks: number;

  @Column({ type: 'integer', default: 0 })
  impressions: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  ctr: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  position: number;

  @Column({ type: 'text', nullable: true })
  country: string;

  @Column({ type: 'text', nullable: true })
  device: string;

  @Column({ type: 'text', nullable: true })
  searchType: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
