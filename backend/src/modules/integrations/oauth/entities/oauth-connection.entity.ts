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
import { User } from '../../../../database/entities/user.entity';

export enum OAuthProvider {
  GOOGLE = 'google',
  GOOGLE_SEARCH_CONSOLE = 'google_search_console',
  GOOGLE_ANALYTICS = 'google_analytics',
  GOOGLE_ADS = 'google_ads',
  AHREFS = 'ahrefs',
  SEMRUSH = 'semrush',
  MOZ = 'moz',
}

/**
 * OAuth Connection Entity
 * Stores OAuth credentials and tokens for external service integrations
 */
@Entity('oauth_connections')
@Index(['tenantId', 'provider'])
@Index(['userId', 'provider'])
export class OAuthConnection {
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
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({
    type: 'enum',
    enum: OAuthProvider,
  })
  provider: OAuthProvider;

  @Column({ type: 'text' })
  accessToken: string;

  @Column({ type: 'text', nullable: true })
  refreshToken: string;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date;

  @Column({ type: 'jsonb', nullable: true })
  scopes: string[];

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ default: true })
  active: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  /**
   * Check if the access token is expired
   */
  isExpired(): boolean {
    if (!this.expiresAt) {
      return false;
    }
    return new Date() >= this.expiresAt;
  }

  /**
   * Check if the token needs refresh (within 5 minutes of expiry)
   */
  needsRefresh(): boolean {
    if (!this.expiresAt) {
      return false;
    }
    const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);
    return fiveMinutesFromNow >= this.expiresAt;
  }
}
