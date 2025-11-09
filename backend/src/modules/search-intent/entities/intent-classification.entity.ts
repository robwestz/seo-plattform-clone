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
 * Search Intent Type
 */
export enum IntentType {
  INFORMATIONAL = 'informational', // Learn/research
  NAVIGATIONAL = 'navigational', // Find specific site/page
  COMMERCIAL = 'commercial', // Research before buying
  TRANSACTIONAL = 'transactional', // Ready to buy/act
}

/**
 * Intent Confidence Level
 */
export enum ConfidenceLevel {
  HIGH = 'high', // >= 0.8
  MEDIUM = 'medium', // 0.5-0.8
  LOW = 'low', // < 0.5
}

/**
 * Intent Classification Entity
 * Stores ML-predicted search intent for keywords
 */
@Entity('intent_classifications')
@Index(['projectId', 'keyword'])
@Index(['projectId', 'intent'])
export class IntentClassification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  projectId: string;

  @ManyToOne(() => Project)
  project: Project;

  /**
   * Keyword data
   */
  @Column({ type: 'varchar', length: 500 })
  keyword: string;

  @Column({ type: 'integer', default: 0 })
  searchVolume: number;

  /**
   * Intent classification
   */
  @Column({
    type: 'enum',
    enum: IntentType,
  })
  intent: IntentType;

  @Column({ type: 'decimal', precision: 5, scale: 4 })
  confidence: number; // 0-1

  @Column({
    type: 'enum',
    enum: ConfidenceLevel,
  })
  confidenceLevel: ConfidenceLevel;

  /**
   * Intent probability distribution
   */
  @Column({ type: 'jsonb' })
  intentProbabilities: {
    informational: number;
    navigational: number;
    commercial: number;
    transactional: number;
  };

  /**
   * Features used for classification
   */
  @Column({ type: 'jsonb', nullable: true })
  features: {
    keywordLength: number;
    wordCount: number;
    hasQuestionWords: boolean;
    hasActionWords: boolean;
    hasBrandTerms: boolean;
    hasModifiers: string[];
    serpFeatures: string[];
  };

  /**
   * SERP analysis
   */
  @Column({ type: 'jsonb', nullable: true })
  serpSignals: {
    hasShoppingAds: boolean;
    hasKnowledgePanel: boolean;
    hasFeaturedSnippet: boolean;
    hasPeopleAlsoAsk: boolean;
    hasLocalPack: boolean;
    topResultTypes: string[]; // e.g., ['ecommerce', 'blog', 'news']
  };

  /**
   * Content recommendations
   */
  @Column({ type: 'jsonb', nullable: true })
  contentRecommendations: {
    format: string; // guide, listicle, product page, etc.
    tone: string; // educational, persuasive, factual
    cta: string; // subscribe, buy, learn more, etc.
    elements: string[]; // faq, comparison table, pricing, etc.
  };

  /**
   * Model metadata
   */
  @Column({ type: 'varchar', length: 100, nullable: true })
  modelVersion: string;

  @Column({ type: 'boolean', default: false })
  manuallyVerified: boolean;

  @Column({ type: 'varchar', length: 50, nullable: true })
  verifiedBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  /**
   * Calculated properties
   */
  get isHighConfidence(): boolean {
    return this.confidenceLevel === ConfidenceLevel.HIGH;
  }

  get needsReview(): boolean {
    return this.confidenceLevel === ConfidenceLevel.LOW && !this.manuallyVerified;
  }

  get primaryIntent(): IntentType {
    return this.intent;
  }

  get secondaryIntent(): IntentType | null {
    const probs = Object.entries(this.intentProbabilities)
      .filter(([intent]) => intent !== this.intent)
      .sort((a, b) => b[1] - a[1]);

    return probs.length > 0 && probs[0][1] > 0.2 ? (probs[0][0] as IntentType) : null;
  }
}
