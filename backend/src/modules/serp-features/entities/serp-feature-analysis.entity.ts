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
 * SERP Feature Types
 */
export enum SerpFeatureType {
  FEATURED_SNIPPET = 'featured_snippet',
  PEOPLE_ALSO_ASK = 'people_also_ask',
  LOCAL_PACK = 'local_pack',
  KNOWLEDGE_PANEL = 'knowledge_panel',
  IMAGE_PACK = 'image_pack',
  VIDEO_CAROUSEL = 'video_carousel',
  TOP_STORIES = 'top_stories',
  SHOPPING_RESULTS = 'shopping_results',
  SITELINKS = 'sitelinks',
  REVIEWS = 'reviews',
  JOBS = 'jobs',
  EVENTS = 'events',
}

/**
 * Feature Position
 */
export enum FeaturePosition {
  ABOVE_ORGANIC = 'above_organic',
  WITHIN_ORGANIC = 'within_organic',
  BELOW_ORGANIC = 'below_organic',
  RIGHT_SIDEBAR = 'right_sidebar',
}

/**
 * Opportunity Level
 */
export enum OpportunityLevel {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  NONE = 'none',
}

/**
 * SERP Feature Analysis Entity
 * Tracks SERP features and their impact on visibility
 */
@Entity('serp_feature_analyses')
@Index(['projectId', 'keyword'])
@Index(['projectId', 'featureType'])
export class SerpFeatureAnalysis {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  projectId: string;

  @ManyToOne(() => Project)
  project: Project;

  /**
   * Keyword and search data
   */
  @Column({ type: 'varchar', length: 500 })
  keyword: string;

  @Column({ type: 'integer', default: 0 })
  searchVolume: number;

  /**
   * SERP feature details
   */
  @Column({
    type: 'enum',
    enum: SerpFeatureType,
  })
  featureType: SerpFeatureType;

  @Column({
    type: 'enum',
    enum: FeaturePosition,
  })
  position: FeaturePosition;

  @Column({ type: 'boolean', default: false })
  youOwnFeature: boolean; // Are you the one showing in this feature?

  @Column({ type: 'varchar', length: 2000, nullable: true })
  featureUrl: string; // URL shown in the feature

  @Column({ type: 'varchar', length: 500, nullable: true })
  featureDomain: string;

  @Column({ type: 'text', nullable: true })
  featureContent: string; // Text content of the feature

  /**
   * Impact metrics
   */
  @Column({ type: 'decimal', precision: 5, scale: 2 })
  ctrImpact: number; // Percentage impact on CTR (-50 to +200)

  @Column({ type: 'integer', default: 0 })
  estimatedTrafficLoss: number; // If you don't own the feature

  @Column({ type: 'integer', default: 0 })
  estimatedTrafficGain: number; // If you do own the feature

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  visibilityImpact: number; // 0-100 score

  /**
   * Competitive analysis
   */
  @Column({ type: 'integer', default: 0 })
  competitorCount: number; // How many competitors appear in this feature

  @Column({ type: 'jsonb', nullable: true })
  competitors: Array<{
    domain: string;
    url: string;
    snippet?: string;
  }>;

  /**
   * Opportunity analysis
   */
  @Column({
    type: 'enum',
    enum: OpportunityLevel,
  })
  opportunityLevel: OpportunityLevel;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  opportunityScore: number; // 0-100

  @Column({ type: 'boolean', default: false })
  canWinFeature: boolean;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  winProbability: number; // 0-100

  /**
   * Recommendations
   */
  @Column({ type: 'jsonb', nullable: true })
  recommendations: Array<{
    type: string;
    action: string;
    priority: string;
    estimatedImpact: number;
  }>;

  @Column({ type: 'text', nullable: true })
  optimizationTips: string;

  /**
   * Historical tracking
   */
  @Column({ type: 'boolean', default: true })
  isActive: boolean; // Is this feature still present?

  @Column({ type: 'timestamp', nullable: true })
  firstSeen: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastSeen: Date;

  @Column({ type: 'integer', default: 1 })
  seenCount: number; // How many times observed

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  /**
   * Calculated properties
   */
  get isHighImpact(): boolean {
    return Math.abs(this.ctrImpact) >= 20;
  }

  get isOpportunity(): boolean {
    return (
      !this.youOwnFeature &&
      this.canWinFeature &&
      this.opportunityLevel !== OpportunityLevel.NONE
    );
  }

  get isPriority(): boolean {
    return (
      this.isOpportunity &&
      this.opportunityLevel === OpportunityLevel.HIGH &&
      this.searchVolume >= 500
    );
  }

  get estimatedMonthlyImpact(): number {
    return this.youOwnFeature
      ? this.estimatedTrafficGain
      : -this.estimatedTrafficLoss;
  }
}
