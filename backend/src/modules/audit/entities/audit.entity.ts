import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { Project } from '../../../database/entities/project.entity';
import { AuditIssue } from './audit-issue.entity';

export enum AuditStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

/**
 * Audit entity
 * Represents a technical SEO audit run
 */
@Entity('audits')
@Index(['projectId', 'createdAt'])
@Index(['status'])
export class Audit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'project_id', type: 'uuid' })
  projectId: string;

  @Column({
    type: 'enum',
    enum: AuditStatus,
    default: AuditStatus.PENDING,
  })
  status: AuditStatus;

  @Column({ name: 'overall_score', type: 'decimal', precision: 5, scale: 2, default: 0 })
  overallScore: number;

  @Column({ name: 'performance_score', type: 'decimal', precision: 5, scale: 2, default: 0 })
  performanceScore: number;

  @Column({ name: 'seo_score', type: 'decimal', precision: 5, scale: 2, default: 0 })
  seoScore: number;

  @Column({ name: 'accessibility_score', type: 'decimal', precision: 5, scale: 2, default: 0 })
  accessibilityScore: number;

  @Column({ name: 'best_practices_score', type: 'decimal', precision: 5, scale: 2, default: 0 })
  bestPracticesScore: number;

  @Column({ name: 'pages_crawled', type: 'integer', default: 0 })
  pagesCrawled: number;

  @Column({ name: 'total_issues', type: 'integer', default: 0 })
  totalIssues: number;

  @Column({ name: 'critical_issues', type: 'integer', default: 0 })
  criticalIssues: number;

  @Column({ name: 'warnings', type: 'integer', default: 0 })
  warnings: number;

  @Column({ name: 'info_items', type: 'integer', default: 0 })
  infoItems: number;

  @Column({ name: 'page_speed_metrics', type: 'jsonb', default: {} })
  pageSpeedMetrics: {
    fcp?: number; // First Contentful Paint
    lcp?: number; // Largest Contentful Paint
    fid?: number; // First Input Delay
    cls?: number; // Cumulative Layout Shift
    ttfb?: number; // Time to First Byte
    tti?: number; // Time to Interactive
  };

  @Column({ name: 'technical_metrics', type: 'jsonb', default: {} })
  technicalMetrics: {
    robotsTxt?: boolean;
    sitemap?: boolean;
    ssl?: boolean;
    mobileOptimized?: boolean;
    canonicalTags?: boolean;
    structuredData?: boolean;
    metaTags?: boolean;
    h1Tags?: boolean;
    altTags?: number;
    brokenLinks?: number;
    redirectChains?: number;
  };

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @Column({ name: 'started_at', type: 'timestamp', nullable: true })
  startedAt: Date;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relationships
  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @OneToMany(() => AuditIssue, (issue) => issue.audit)
  issues: AuditIssue[];

  /**
   * Get overall grade (A-F)
   */
  get grade(): string {
    if (this.overallScore >= 90) return 'A';
    if (this.overallScore >= 80) return 'B';
    if (this.overallScore >= 70) return 'C';
    if (this.overallScore >= 60) return 'D';
    return 'F';
  }

  /**
   * Get duration in seconds
   */
  get durationSeconds(): number | null {
    if (!this.startedAt || !this.completedAt) return null;
    return Math.round((this.completedAt.getTime() - this.startedAt.getTime()) / 1000);
  }
}
