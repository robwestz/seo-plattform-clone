import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Audit } from './audit.entity';

export enum IssueSeverity {
  CRITICAL = 'critical',
  WARNING = 'warning',
  INFO = 'info',
}

export enum IssueCategory {
  PERFORMANCE = 'performance',
  SEO = 'seo',
  ACCESSIBILITY = 'accessibility',
  BEST_PRACTICES = 'best_practices',
  SECURITY = 'security',
  MOBILE = 'mobile',
  CONTENT = 'content',
  TECHNICAL = 'technical',
}

export enum IssueStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  IGNORED = 'ignored',
}

/**
 * Audit Issue entity
 * Individual SEO issues found during audit
 */
@Entity('audit_issues')
@Index(['auditId', 'severity'])
@Index(['category', 'status'])
export class AuditIssue {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'audit_id', type: 'uuid' })
  auditId: string;

  @Column({
    type: 'enum',
    enum: IssueSeverity,
  })
  severity: IssueSeverity;

  @Column({
    type: 'enum',
    enum: IssueCategory,
  })
  category: IssueCategory;

  @Column({
    type: 'enum',
    enum: IssueStatus,
    default: IssueStatus.OPEN,
  })
  status: IssueStatus;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'text', nullable: true })
  recommendation: string;

  @Column({ name: 'affected_urls', type: 'text', array: true, default: [] })
  affectedUrls: string[];

  @Column({ name: 'affected_count', type: 'integer', default: 1 })
  affectedCount: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  impact: number;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @Column({ name: 'resolved_at', type: 'timestamp', nullable: true })
  resolvedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relationships
  @ManyToOne(() => Audit, (audit) => audit.issues, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'audit_id' })
  audit: Audit;
}
