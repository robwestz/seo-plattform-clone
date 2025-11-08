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

export enum BacklinkStatus {
  ACTIVE = 'active',
  LOST = 'lost',
  BROKEN = 'broken',
  TOXIC = 'toxic',
}

export enum LinkType {
  FOLLOW = 'follow',
  NOFOLLOW = 'nofollow',
}

/**
 * Backlink entity
 * Represents an inbound link to the website
 */
@Entity('backlinks')
@Index(['projectId', 'status'])
@Index(['qualityScore'])
@Index(['firstSeenAt'])
export class Backlink {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'project_id', type: 'uuid' })
  projectId: string;

  @Column({ name: 'source_url', type: 'text' })
  sourceUrl: string;

  @Column({ name: 'source_domain', length: 255 })
  sourceDomain: string;

  @Column({ name: 'target_url', type: 'text' })
  targetUrl: string;

  @Column({ name: 'anchor_text', type: 'text', nullable: true })
  anchorText: string;

  @Column({
    type: 'enum',
    enum: LinkType,
    default: LinkType.FOLLOW,
  })
  type: LinkType;

  @Column({
    type: 'enum',
    enum: BacklinkStatus,
    default: BacklinkStatus.ACTIVE,
  })
  status: BacklinkStatus;

  @Column({ name: 'domain_authority', type: 'integer', default: 0 })
  domainAuthority: number;

  @Column({ name: 'page_authority', type: 'integer', default: 0 })
  pageAuthority: number;

  @Column({ name: 'trust_score', type: 'decimal', precision: 5, scale: 2, default: 0 })
  trustScore: number;

  @Column({ name: 'spam_score', type: 'decimal', precision: 5, scale: 2, default: 0 })
  spamScore: number;

  @Column({ name: 'quality_score', type: 'decimal', precision: 5, scale: 2, default: 0 })
  qualityScore: number;

  @Column({ name: 'is_toxic', type: 'boolean', default: false })
  isToxic: boolean;

  @Column({ name: 'referring_ips', type: 'integer', default: 1 })
  referringIps: number;

  @Column({ name: 'referring_domains', type: 'integer', default: 1 })
  referringDomains: number;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @Column({ name: 'first_seen_at', type: 'timestamp' })
  firstSeenAt: Date;

  @Column({ name: 'last_seen_at', type: 'timestamp' })
  lastSeenAt: Date;

  @Column({ name: 'lost_at', type: 'timestamp', nullable: true })
  lostAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  /**
   * Check if backlink is high quality
   */
  get isHighQuality(): boolean {
    return Number(this.qualityScore) >= 70;
  }

  /**
   * Check if link is dofollow
   */
  get isDofollow(): boolean {
    return this.type === LinkType.FOLLOW;
  }
}
