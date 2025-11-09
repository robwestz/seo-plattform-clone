import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * API Version Status
 */
export enum ApiVersionStatus {
  ACTIVE = 'active',
  DEPRECATED = 'deprecated',
  SUNSET = 'sunset',
  BETA = 'beta',
}

/**
 * API Version Entity
 * Tracks API versions and their lifecycle
 */
@Entity('api_versions')
export class ApiVersion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Version information
   */
  @Column({ type: 'varchar', length: 50, unique: true })
  version: string; // e.g., 'v1', 'v2', '1.0.0'

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  /**
   * Status
   */
  @Column({
    type: 'enum',
    enum: ApiVersionStatus,
    default: ApiVersionStatus.ACTIVE,
  })
  status: ApiVersionStatus;

  @Column({ type: 'boolean', default: false })
  isDefault: boolean;

  /**
   * Lifecycle dates
   */
  @Column({ type: 'timestamp', nullable: true })
  releasedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  deprecatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  sunsetAt: Date; // When version will be removed

  /**
   * Migration information
   */
  @Column({ type: 'uuid', nullable: true })
  migrateToVersionId: string; // Recommended upgrade version

  @Column({ type: 'text', nullable: true })
  migrationGuideUrl: string;

  /**
   * Breaking changes
   */
  @Column({ type: 'jsonb', nullable: true })
  breakingChanges: Array<{
    endpoint: string;
    change: string;
    mitigationString;
  }>;

  /**
   * Changelog
   */
  @Column({ type: 'jsonb', nullable: true })
  changelog: Array<{
    date: string;
    type: 'feature' | 'bugfix' | 'breaking' | 'deprecation';
    description: string;
  }>;

  /**
   * Metadata
   */
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  /**
   * Calculated properties
   */
  get isActive(): boolean {
    return this.status === ApiVersionStatus.ACTIVE;
  }

  get isDeprecated(): boolean {
    return this.status === ApiVersionStatus.DEPRECATED;
  }

  get isSunset(): boolean {
    return this.status === ApiVersionStatus.SUNSET;
  }

  get daysUntilSunset(): number | null {
    if (!this.sunsetAt) return null;

    const now = new Date();
    const diff = this.sunsetAt.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }
}
