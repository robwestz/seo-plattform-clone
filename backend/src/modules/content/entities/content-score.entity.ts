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

/**
 * Content Score entity
 * Stores content optimization scores and recommendations
 */
@Entity('content_scores')
@Index(['projectId', 'url'])
@Index(['overallScore'])
export class ContentScore {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'project_id', type: 'uuid' })
  projectId: string;

  @Column({ type: 'text' })
  url: string;

  @Column({ type: 'text', nullable: true })
  title: string;

  @Column({ name: 'overall_score', type: 'decimal', precision: 5, scale: 2, default: 0 })
  overallScore: number;

  @Column({ name: 'readability_score', type: 'decimal', precision: 5, scale: 2, default: 0 })
  readabilityScore: number;

  @Column({ name: 'seo_score', type: 'decimal', precision: 5, scale: 2, default: 0 })
  seoScore: number;

  @Column({ name: 'keyword_density', type: 'decimal', precision: 5, scale: 2, default: 0 })
  keywordDensity: number;

  @Column({ name: 'word_count', type: 'integer', default: 0 })
  wordCount: number;

  @Column({ name: 'sentence_count', type: 'integer', default: 0 })
  sentenceCount: number;

  @Column({ name: 'paragraph_count', type: 'integer', default: 0 })
  paragraphCount: number;

  @Column({ name: 'avg_sentence_length', type: 'decimal', precision: 5, scale: 2, default: 0 })
  avgSentenceLength: number;

  @Column({ name: 'flesch_reading_ease', type: 'decimal', precision: 5, scale: 2, nullable: true })
  fleschReadingEase: number;

  @Column({ name: 'flesch_kincaid_grade', type: 'decimal', precision: 5, scale: 2, nullable: true })
  fleschKincaidGrade: number;

  @Column({ name: 'has_meta_description', type: 'boolean', default: false })
  hasMetaDescription: boolean;

  @Column({ name: 'meta_description_length', type: 'integer', default: 0 })
  metaDescriptionLength: number;

  @Column({ name: 'has_h1', type: 'boolean', default: false })
  hasH1: boolean;

  @Column({ name: 'h1_count', type: 'integer', default: 0 })
  h1Count: number;

  @Column({ name: 'heading_structure_score', type: 'decimal', precision: 5, scale: 2, default: 0 })
  headingStructureScore: number;

  @Column({ name: 'internal_links', type: 'integer', default: 0 })
  internalLinks: number;

  @Column({ name: 'external_links', type: 'integer', default: 0 })
  externalLinks: number;

  @Column({ name: 'image_count', type: 'integer', default: 0 })
  imageCount: number;

  @Column({ name: 'images_with_alt', type: 'integer', default: 0 })
  imagesWithAlt: number;

  @Column({ name: 'recommendations', type: 'jsonb', default: [] })
  recommendations: Array<{
    type: string;
    priority: 'high' | 'medium' | 'low';
    message: string;
  }>;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  /**
   * Get overall grade (A-F)
   */
  get grade(): string {
    const score = Number(this.overallScore);
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  /**
   * Get readability level
   */
  get readabilityLevel(): string {
    if (!this.fleschReadingEase) return 'Unknown';
    const score = Number(this.fleschReadingEase);
    if (score >= 90) return 'Very Easy';
    if (score >= 80) return 'Easy';
    if (score >= 70) return 'Fairly Easy';
    if (score >= 60) return 'Standard';
    if (score >= 50) return 'Fairly Difficult';
    if (score >= 30) return 'Difficult';
    return 'Very Difficult';
  }
}
