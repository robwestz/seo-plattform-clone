import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Tenant } from './tenant.entity';

export enum ProjectStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  ARCHIVED = 'archived',
}

/**
 * Project entity
 * Represents an SEO project/website being monitored
 * Each project belongs to a specific tenant
 */
@Entity('projects')
@Index(['tenantId', 'slug'], { unique: true })
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 100 })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ length: 255 })
  domain: string;

  @Column({ length: 10, default: 'https' })
  protocol: string;

  @Column({
    type: 'enum',
    enum: ProjectStatus,
    default: ProjectStatus.ACTIVE,
  })
  status: ProjectStatus;

  @Column({ type: 'jsonb', default: {} })
  settings: Record<string, any>;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @Column({ name: 'target_keywords', type: 'text', array: true, default: [] })
  targetKeywords: string[];

  @Column({ name: 'competitor_domains', type: 'text', array: true, default: [] })
  competitorDomains: string[];

  @Column({ name: 'google_analytics_id', nullable: true })
  googleAnalyticsId: string;

  @Column({ name: 'google_search_console_id', nullable: true })
  googleSearchConsoleId: string;

  @Column({ name: 'last_crawled_at', type: 'timestamp', nullable: true })
  lastCrawledAt: Date;

  @Column({ name: 'last_audit_at', type: 'timestamp', nullable: true })
  lastAuditAt: Date;

  @Column({ name: 'last_rank_check_at', type: 'timestamp', nullable: true })
  lastRankCheckAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date;

  // Relationships
  @ManyToOne(() => Tenant, (tenant) => tenant.projects, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  /**
   * Get full URL of the project
   */
  get url(): string {
    return `${this.protocol}://${this.domain}`;
  }
}
