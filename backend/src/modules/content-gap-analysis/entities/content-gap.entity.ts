import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Project } from '../../projects/entities/project.entity';

/**
 * Content Gap Priority Level
 */
export enum GapPriority {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

/**
 * Gap Type
 */
export enum GapType {
  MISSING_TOPIC = 'missing_topic',
  THIN_CONTENT = 'thin_content',
  KEYWORD_GAP = 'keyword_gap',
  COMPETITOR_ADVANTAGE = 'competitor_advantage',
  OUTDATED_CONTENT = 'outdated_content',
  MISSING_SUBTOPIC = 'missing_subtopic',
}

/**
 * Content Gap Entity
 * Stores discovered content gaps and opportunities
 */
@Entity('content_gaps')
@Index(['projectId', 'gapType'])
@Index(['projectId', 'priority'])
export class ContentGap {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  projectId: string;

  @ManyToOne(() => Project)
  project: Project;

  /**
   * Gap identification
   */
  @Column({
    type: 'enum',
    enum: GapType,
  })
  gapType: GapType;

  @Column({
    type: 'enum',
    enum: GapPriority,
  })
  priority: GapPriority;

  /**
   * Gap details
   */
  @Column({ type: 'varchar', length: 500 })
  topic: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'jsonb', nullable: true })
  missingKeywords: string[];

  @Column({ type: 'jsonb', nullable: true })
  competitorUrls: Array<{
    url: string;
    domain: string;
    wordCount: number;
    rank: number;
  }>;

  /**
   * Metrics
   */
  @Column({ type: 'integer', default: 0 })
  estimatedSearchVolume: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  competitorCoverage: number; // Percentage of competitors covering this

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  opportunityScore: number; // 0-100 score

  @Column({ type: 'integer', nullable: true })
  recommendedWordCount: number;

  /**
   * Analysis metadata
   */
  @Column({ type: 'jsonb', nullable: true })
  competitorAnalysis: {
    totalCompetitors: number;
    averageWordCount: number;
    averageRank: number;
    commonKeywords: string[];
    contentAngles: string[];
  };

  @Column({ type: 'jsonb', nullable: true })
  recommendations: Array<{
    type: string;
    action: string;
    impact: string;
    effort: string;
  }>;

  /**
   * User tracking
   */
  @Column({ type: 'boolean', default: false })
  addressed: boolean;

  @Column({ type: 'uuid', nullable: true })
  relatedContentId: string; // If user created content for this gap

  @Column({ type: 'text', nullable: true })
  userNotes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  /**
   * Calculated properties
   */
  get isCritical(): boolean {
    return this.priority === GapPriority.CRITICAL;
  }

  get isHighOpportunity(): boolean {
    return this.opportunityScore >= 75;
  }

  get needsImmediateAction(): boolean {
    return this.isCritical && !this.addressed;
  }

  get competitorCount(): number {
    return this.competitorUrls?.length || 0;
  }
}
