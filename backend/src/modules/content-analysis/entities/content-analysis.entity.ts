import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Project } from '../../projects/entities/project.entity';

/**
 * Content Analysis Entity
 * Stores comprehensive content quality analysis results
 */
@Entity('content_analyses')
@Index(['projectId', 'createdAt'])
@Index(['projectId', 'url'])
export class ContentAnalysis {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  projectId: string;

  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @Column({ type: 'text' })
  url: string;

  @Column({ type: 'text', nullable: true })
  title: string;

  @Column({ type: 'text', nullable: true })
  metaDescription: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'text', nullable: true })
  html: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  targetKeyword: string;

  // Overall Quality Scores
  @Column({ type: 'decimal', precision: 5, scale: 2 })
  overallScore: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  readabilityScore: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  seoOptimizationScore: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  structureScore: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  uniquenessScore: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  semanticRelevanceScore: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  engagementScore: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  technicalSeoScore: number;

  // Readability Metrics
  @Column({ type: 'decimal', precision: 5, scale: 2 })
  fleschReadingEase: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  fleschKincaidGrade: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  smogIndex: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  colemanLiauIndex: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  automatedReadabilityIndex: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  gunningFog: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  averageGradeLevel: number;

  @Column({
    type: 'enum',
    enum: ['very_easy', 'easy', 'medium', 'difficult', 'very_difficult'],
  })
  readabilityLevel: string;

  // Structure Metrics
  @Column({ type: 'int' })
  wordCount: number;

  @Column({ type: 'int' })
  sentenceCount: number;

  @Column({ type: 'int' })
  paragraphCount: number;

  @Column({ type: 'int' })
  h1Count: number;

  @Column({ type: 'int' })
  h2Count: number;

  @Column({ type: 'int' })
  h3Count: number;

  @Column({ type: 'int' })
  imageCount: number;

  @Column({ type: 'int' })
  internalLinkCount: number;

  @Column({ type: 'int' })
  externalLinkCount: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  averageSentenceLength: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  averageParagraphLength: number;

  // TF-IDF Analysis
  @Column({ type: 'jsonb' })
  topKeywords: Array<{
    term: string;
    tfIdf: number;
    frequency: number;
    relevance: number;
  }>;

  @Column({ type: 'boolean', default: false })
  overOptimization: boolean;

  @Column({ type: 'text', array: true, default: [] })
  tfIdfWarnings: string[];

  // LSI Keywords
  @Column({ type: 'varchar', length: 500, nullable: true })
  primaryTopic: string;

  @Column({ type: 'jsonb' })
  relatedTerms: Array<{
    term: string;
    relevance: number;
    category: string;
  }>;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  topicCoverage: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  semanticRichness: number;

  @Column({ type: 'text', array: true, default: [] })
  missingTerms: string[];

  // SEO Checks
  @Column({ type: 'boolean' })
  hasH1: boolean;

  @Column({ type: 'int' })
  titleLength: number;

  @Column({ type: 'int' })
  metaDescriptionLength: number;

  @Column({ type: 'enum', enum: ['excellent', 'good', 'poor'] })
  urlStructure: string;

  @Column({ type: 'boolean' })
  keywordInTitle: boolean;

  @Column({ type: 'boolean' })
  keywordInH1: boolean;

  @Column({ type: 'boolean' })
  keywordInFirstParagraph: boolean;

  @Column({ type: 'boolean' })
  keywordInUrl: boolean;

  @Column({ type: 'int' })
  imageAltTags: number;

  @Column({ type: 'boolean', default: true })
  mobileOptimized: boolean;

  @Column({ type: 'int', default: 0 })
  pageSpeed: number;

  // Recommendations
  @Column({ type: 'text', array: true, default: [] })
  recommendations: string[];

  // Metadata
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Calculated properties
  get qualityLevel(): 'excellent' | 'good' | 'average' | 'poor' {
    if (this.overallScore >= 80) return 'excellent';
    if (this.overallScore >= 60) return 'good';
    if (this.overallScore >= 40) return 'average';
    return 'poor';
  }

  get needsImprovement(): boolean {
    return this.overallScore < 60;
  }

  get seoCompliant(): boolean {
    return (
      this.hasH1 &&
      this.h1Count === 1 &&
      this.keywordInTitle &&
      this.keywordInH1 &&
      this.titleLength >= 50 &&
      this.titleLength <= 60 &&
      this.metaDescriptionLength >= 150 &&
      this.metaDescriptionLength <= 160
    );
  }
}
