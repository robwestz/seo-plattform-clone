import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Tenant } from '../../../../database/entities/tenant.entity';
import { Project } from '../../../../database/entities/project.entity';

export enum GoogleAdsDataType {
  KEYWORD_IDEAS = 'keyword_ideas',
  SEARCH_VOLUME = 'search_volume',
  CPC_DATA = 'cpc_data',
  CAMPAIGN = 'campaign',
}

/**
 * Google Ads Data Entity
 * Stores keyword planner data, search volume, and CPC information
 */
@Entity('google_ads_data')
@Index(['tenantId', 'projectId', 'dataType'])
@Index(['keyword'])
export class GoogleAdsData {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column({ type: 'uuid' })
  @Index()
  projectId: string;

  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'projectId' })
  project: Project;

  @Column({
    type: 'enum',
    enum: GoogleAdsDataType,
  })
  dataType: GoogleAdsDataType;

  @Column({ type: 'text' })
  keyword: string;

  @Column({ type: 'bigint', default: 0 })
  avgMonthlySearches: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  lowTopOfPageBid: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  highTopOfPageBid: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  avgCpc: number;

  @Column({ type: 'text', nullable: true })
  competition: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  competitionIndex: number;

  @Column({ type: 'jsonb', nullable: true })
  monthlySearchVolumes: Record<string, any>[];

  @Column({ type: 'jsonb', nullable: true })
  keywordAnnotations: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
