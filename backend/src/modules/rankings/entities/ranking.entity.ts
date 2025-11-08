import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Keyword } from '../../keywords/entities/keyword.entity';
import { Project } from '../../../database/entities/project.entity';

export enum DeviceType {
  DESKTOP = 'desktop',
  MOBILE = 'mobile',
  TABLET = 'tablet',
}

/**
 * Ranking entity
 * Time-series data for keyword rankings
 * Tracks position changes over time with SERP features
 */
@Entity('rankings')
@Index(['keywordId', 'checkedAt'])
@Index(['projectId', 'checkedAt'])
@Index(['position'])
export class Ranking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'project_id', type: 'uuid' })
  projectId: string;

  @Column({ name: 'keyword_id', type: 'uuid' })
  keywordId: string;

  @Column({ type: 'integer' })
  position: number;

  @Column({ name: 'previous_position', type: 'integer', nullable: true })
  previousPosition: number;

  @Column({ name: 'position_change', type: 'integer', default: 0 })
  positionChange: number;

  @Column({ type: 'text', nullable: true })
  url: string;

  @Column({
    type: 'enum',
    enum: DeviceType,
    default: DeviceType.DESKTOP,
  })
  device: DeviceType;

  @Column({ length: 10, default: 'US' })
  location: string;

  @Column({ length: 10, default: 'en' })
  language: string;

  @Column({ name: 'serp_features', type: 'jsonb', default: {} })
  serpFeatures: {
    featuredSnippet?: boolean;
    peopleAlsoAsk?: boolean;
    localPack?: boolean;
    knowledgePanel?: boolean;
    shopping?: boolean;
    images?: boolean;
    videos?: boolean;
    news?: boolean;
    relatedSearches?: boolean;
  };

  @Column({ name: 'top_10_urls', type: 'text', array: true, default: [] })
  top10Urls: string[];

  @Column({ name: 'top_10_titles', type: 'text', array: true, default: [] })
  top10Titles: string[];

  @Column({ name: 'estimated_traffic', type: 'integer', default: 0 })
  estimatedTraffic: number;

  @Column({ name: 'visibility_score', type: 'decimal', precision: 5, scale: 2, default: 0 })
  visibilityScore: number;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @Column({ name: 'checked_at', type: 'timestamp' })
  checkedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relationships
  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @ManyToOne(() => Keyword, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'keyword_id' })
  keyword: Keyword;

  /**
   * Check if position improved
   */
  get isImproved(): boolean {
    return this.positionChange > 0;
  }

  /**
   * Check if position declined
   */
  get isDeclined(): boolean {
    return this.positionChange < 0;
  }

  /**
   * Get position change as formatted string
   */
  get changeLabel(): string {
    if (this.positionChange > 0) return `+${this.positionChange}`;
    if (this.positionChange < 0) return `${this.positionChange}`;
    return '0';
  }
}
