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

export enum WebhookEvent {
  RANKING_CHANGED = 'ranking.changed',
  KEYWORD_ADDED = 'keyword.added',
  KEYWORD_UPDATED = 'keyword.updated',
  BACKLINK_FOUND = 'backlink.found',
  BACKLINK_LOST = 'backlink.lost',
  COMPETITOR_DETECTED = 'competitor.detected',
  AUDIT_COMPLETED = 'audit.completed',
  CONTENT_ANALYZED = 'content.analyzed',
  PROJECT_CREATED = 'project.created',
  PROJECT_UPDATED = 'project.updated',
}

/**
 * Webhook Entity
 * Stores webhook registrations for external integrations
 */
@Entity('webhooks')
@Index(['tenantId', 'active'])
@Index(['projectId', 'active'])
export class Webhook {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column({ type: 'uuid', nullable: true })
  @Index()
  projectId: string;

  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'projectId' })
  project: Project;

  @Column({ type: 'text' })
  name: string;

  @Column({ type: 'text' })
  url: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: WebhookEvent,
    array: true,
  })
  events: WebhookEvent[];

  @Column({ type: 'text', nullable: true })
  secret: string;

  @Column({ default: true })
  active: boolean;

  @Column({ type: 'jsonb', nullable: true })
  headers: Record<string, string>;

  @Column({ type: 'integer', default: 3 })
  maxRetries: number;

  @Column({ type: 'integer', default: 30000 })
  timeout: number;

  @Column({ type: 'timestamp', nullable: true })
  lastTriggeredAt: Date;

  @Column({ type: 'integer', default: 0 })
  successCount: number;

  @Column({ type: 'integer', default: 0 })
  failureCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
