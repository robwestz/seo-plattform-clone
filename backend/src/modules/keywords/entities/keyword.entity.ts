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

export enum KeywordIntent {
  INFORMATIONAL = 'informational',
  NAVIGATIONAL = 'navigational',
  TRANSACTIONAL = 'transactional',
  COMMERCIAL = 'commercial',
}

export enum KeywordStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  ARCHIVED = 'archived',
}

/**
 * Keyword entity
 * Represents a keyword being tracked for SEO performance
 * Includes search volume, difficulty, CPC, and intent classification
 */
@Entity('keywords')
@Index(['projectId', 'keyword'], { unique: true })
@Index(['projectId', 'status'])
@Index(['difficulty'])
@Index(['searchVolume'])
export class Keyword {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'project_id', type: 'uuid' })
  projectId: string;

  @Column({ length: 500 })
  keyword: string;

  @Column({ name: 'search_volume', type: 'integer', default: 0 })
  searchVolume: number;

  @Column({ name: 'search_volume_trend', type: 'jsonb', default: {} })
  searchVolumeTrend: Record<string, number>;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  difficulty: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, nullable: true })
  cpc: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0, nullable: true })
  competition: number;

  @Column({
    type: 'enum',
    enum: KeywordIntent,
    default: KeywordIntent.INFORMATIONAL,
  })
  intent: KeywordIntent;

  @Column({
    type: 'enum',
    enum: KeywordStatus,
    default: KeywordStatus.ACTIVE,
  })
  status: KeywordStatus;

  @Column({ name: 'current_position', type: 'integer', nullable: true })
  currentPosition: number;

  @Column({ name: 'best_position', type: 'integer', nullable: true })
  bestPosition: number;

  @Column({ name: 'worst_position', type: 'integer', nullable: true })
  worstPosition: number;

  @Column({ name: 'position_change', type: 'integer', default: 0 })
  positionChange: number;

  @Column({ name: 'serp_features', type: 'text', array: true, default: [] })
  serpFeatures: string[];

  @Column({ name: 'related_keywords', type: 'text', array: true, default: [] })
  relatedKeywords: string[];

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ name: 'last_checked_at', type: 'timestamp', nullable: true })
  lastCheckedAt: Date;

  @Column({ name: 'last_ranked_at', type: 'timestamp', nullable: true })
  lastRankedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date;

  // Relationships
  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  /**
   * Check if keyword is ranking (in top 100)
   */
  get isRanking(): boolean {
    return this.currentPosition !== null && this.currentPosition <= 100;
  }

  /**
   * Check if keyword is in top 10
   */
  get isTopTen(): boolean {
    return this.currentPosition !== null && this.currentPosition <= 10;
  }

  /**
   * Get difficulty level as string
   */
  get difficultyLevel(): string {
    if (this.difficulty < 30) return 'Easy';
    if (this.difficulty < 50) return 'Medium';
    if (this.difficulty < 70) return 'Hard';
    return 'Very Hard';
  }
}
