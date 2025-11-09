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
 * Link Quality Score
 */
export enum LinkQuality {
  EXCELLENT = 'excellent', // 80-100
  GOOD = 'good', // 60-79
  AVERAGE = 'average', // 40-59
  POOR = 'poor', // 20-39
  TOXIC = 'toxic', // 0-19
}

/**
 * Link Type
 */
export enum LinkType {
  DOFOLLOW = 'dofollow',
  NOFOLLOW = 'nofollow',
  UGC = 'ugc',
  SPONSORED = 'sponsored',
}

/**
 * Anchor Text Type
 */
export enum AnchorTextType {
  EXACT_MATCH = 'exact_match',
  PARTIAL_MATCH = 'partial_match',
  BRANDED = 'branded',
  NAKED_URL = 'naked_url',
  GENERIC = 'generic',
  IMAGE = 'image',
}

/**
 * Backlink Analysis Entity
 * Stores comprehensive backlink quality analysis
 */
@Entity('backlink_analyses')
@Index(['projectId', 'sourceUrl'])
@Index(['projectId', 'quality'])
@Index(['projectId', 'isToxic'])
export class BacklinkAnalysis {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  projectId: string;

  @ManyToOne(() => Project)
  project: Project;

  /**
   * Link details
   */
  @Column({ type: 'varchar', length: 2000 })
  sourceUrl: string; // URL linking to you

  @Column({ type: 'varchar', length: 2000 })
  targetUrl: string; // Your URL being linked to

  @Column({ type: 'varchar', length: 500 })
  sourceDomain: string;

  @Column({ type: 'varchar', length: 500 })
  targetDomain: string;

  @Column({ type: 'text' })
  anchorText: string;

  @Column({
    type: 'enum',
    enum: LinkType,
    default: LinkType.DOFOLLOW,
  })
  linkType: LinkType;

  @Column({
    type: 'enum',
    enum: AnchorTextType,
  })
  anchorType: AnchorTextType;

  /**
   * Quality metrics
   */
  @Column({ type: 'decimal', precision: 5, scale: 2 })
  qualityScore: number; // 0-100

  @Column({
    type: 'enum',
    enum: LinkQuality,
  })
  quality: LinkQuality;

  @Column({ type: 'boolean', default: false })
  isToxic: boolean;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  toxicityScore: number; // 0-100, higher = more toxic

  /**
   * Source domain metrics
   */
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  sourceDomainAuthority: number; // 0-100

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  sourcePageAuthority: number; // 0-100

  @Column({ type: 'integer', nullable: true })
  sourceDomainAge: number; // days

  @Column({ type: 'integer', nullable: true })
  sourceBacklinkCount: number;

  @Column({ type: 'integer', nullable: true })
  sourceReferringDomains: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  sourceTrustFlow: number; // Majestic metric

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  sourceCitationFlow: number; // Majestic metric

  /**
   * Link context
   */
  @Column({ type: 'text', nullable: true })
  surroundingText: string; // Text around the link

  @Column({ type: 'integer', default: 0 })
  outboundLinksOnPage: number;

  @Column({ type: 'boolean', default: false })
  isEditorial: boolean; // Link in editorial content vs sidebar/footer

  @Column({ type: 'boolean', default: false })
  isRelevant: boolean; // Topical relevance

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  relevanceScore: number; // 0-100

  /**
   * Spam signals
   */
  @Column({ type: 'jsonb', nullable: true })
  spamSignals: {
    hasExcessiveAds: boolean;
    hasThinContent: boolean;
    hasExactMatchAnchor: boolean;
    hasUnrelatedContent: boolean;
    hasLowQualityDesign: boolean;
    hasSuspiciousTLD: boolean;
    hasNoIndex: boolean;
  };

  @Column({ type: 'integer', default: 0 })
  spamSignalCount: number;

  /**
   * Link discovery
   */
  @Column({ type: 'timestamp', nullable: true })
  firstDiscovered: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastSeen: Date;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  /**
   * Recommendations
   */
  @Column({ type: 'boolean', default: false })
  shouldDisavow: boolean;

  @Column({ type: 'text', nullable: true })
  disavowReason: string;

  @Column({ type: 'jsonb', nullable: true })
  recommendations: Array<{
    type: string;
    action: string;
    priority: string;
  }>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  /**
   * Calculated properties
   */
  get isHighQuality(): boolean {
    return this.quality === LinkQuality.EXCELLENT || this.quality === LinkQuality.GOOD;
  }

  get isDofollow(): boolean {
    return this.linkType === LinkType.DOFOLLOW;
  }

  get passesValue(): boolean {
    return this.isDofollow && !this.isToxic && this.qualityScore >= 40;
  }

  get riskLevel(): 'low' | 'medium' | 'high' {
    if (this.isToxic || this.toxicityScore >= 70) return 'high';
    if (this.toxicityScore >= 40 || this.spamSignalCount >= 3) return 'medium';
    return 'low';
  }
}
