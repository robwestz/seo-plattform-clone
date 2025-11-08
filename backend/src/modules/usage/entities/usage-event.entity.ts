import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Tenant } from '../../../database/entities/tenant.entity';

/**
 * Usage event types
 */
export enum UsageEventType {
  // API calls
  API_CALL = 'api_call',
  API_CALL_SUCCESS = 'api_call_success',
  API_CALL_ERROR = 'api_call_error',

  // Keyword operations
  KEYWORD_ADDED = 'keyword_added',
  KEYWORD_TRACKED = 'keyword_tracked',
  KEYWORD_RANK_CHECK = 'keyword_rank_check',

  // Page audits
  PAGE_AUDIT = 'page_audit',
  SITE_CRAWL = 'site_crawl',

  // Backlink operations
  BACKLINK_CHECK = 'backlink_check',
  BACKLINK_DISCOVERED = 'backlink_discovered',

  // Competitor tracking
  COMPETITOR_TRACKED = 'competitor_tracked',
  COMPETITOR_ANALYSIS = 'competitor_analysis',

  // Reports and exports
  REPORT_GENERATED = 'report_generated',
  DATA_EXPORT = 'data_export',

  // User actions
  USER_LOGIN = 'user_login',
  PROJECT_CREATED = 'project_created',
}

/**
 * Usage event entity
 * Tracks all usage events for billing and analytics
 */
@Entity('usage_events')
@Index(['tenantId', 'createdAt'])
@Index(['eventType', 'createdAt'])
@Index(['userId', 'createdAt'])
export class UsageEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  @Index()
  tenantId: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string;

  @Column({ name: 'project_id', type: 'uuid', nullable: true })
  projectId: string;

  @Column({
    name: 'event_type',
    type: 'enum',
    enum: UsageEventType,
  })
  eventType: UsageEventType;

  @Column({ type: 'varchar', length: 255 })
  resource: string;

  @Column({ name: 'resource_id', nullable: true })
  resourceId: string;

  @Column({ default: 1 })
  quantity: number;

  @Column({ name: 'api_endpoint', nullable: true })
  apiEndpoint: string;

  @Column({ name: 'http_method', nullable: true })
  httpMethod: string;

  @Column({ name: 'status_code', nullable: true })
  statusCode: number;

  @Column({ name: 'response_time_ms', nullable: true })
  responseTimeMs: number;

  @Column({ name: 'ip_address', nullable: true })
  ipAddress: string;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent: string;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  @Index()
  createdAt: Date;

  // Relationships
  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;
}
