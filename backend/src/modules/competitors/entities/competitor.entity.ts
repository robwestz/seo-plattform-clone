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
import { Project } from '../../../database/entities/project.entity';

export enum CompetitorStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

/**
 * Competitor entity
 * Represents a competitor website being tracked
 */
@Entity('competitors')
@Index(['projectId', 'domain'], { unique: true })
export class Competitor {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'project_id', type: 'uuid' })
  projectId: string;

  @Column({ length: 255 })
  domain: string;

  @Column({ length: 255, nullable: true })
  name: string;

  @Column({
    type: 'enum',
    enum: CompetitorStatus,
    default: CompetitorStatus.ACTIVE,
  })
  status: CompetitorStatus;

  @Column({ name: 'domain_authority', type: 'integer', default: 0 })
  domainAuthority: number;

  @Column({ name: 'organic_traffic', type: 'integer', default: 0 })
  organicTraffic: number;

  @Column({ name: 'organic_keywords', type: 'integer', default: 0 })
  organicKeywords: number;

  @Column({ name: 'backlinks_count', type: 'integer', default: 0 })
  backlinksCount: number;

  @Column({ name: 'referring_domains', type: 'integer', default: 0 })
  referringDomains: number;

  @Column({ name: 'share_of_voice', type: 'decimal', precision: 5, scale: 2, default: 0 })
  shareOfVoice: number;

  @Column({ name: 'common_keywords', type: 'integer', default: 0 })
  commonKeywords: number;

  @Column({ name: 'keyword_gaps', type: 'integer', default: 0 })
  keywordGaps: number;

  @Column({ name: 'content_gap_score', type: 'decimal', precision: 5, scale: 2, default: 0 })
  contentGapScore: number;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @Column({ name: 'last_analyzed_at', type: 'timestamp', nullable: true })
  lastAnalyzedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  /**
   * Get competitive strength (0-100)
   */
  get competitiveStrength(): number {
    return Math.min(
      Math.round(
        (this.domainAuthority * 0.3 +
          (this.organicKeywords / 1000) * 0.3 +
          (this.backlinksCount / 10000) * 0.4) *
          100,
      ),
      100,
    );
  }
}
