import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { UserTenant } from './user-tenant.entity';
import { Project } from './project.entity';

/**
 * Tenant entity
 * Represents an organization or customer in the multi-tenant system
 * Each tenant has isolated data and resources
 */
@Entity('tenants')
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 100 })
  name: string;

  @Column({ unique: true, length: 100 })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'database_schema', unique: true, length: 63, nullable: true })
  databaseSchema: string;

  @Column({ default: true })
  active: boolean;

  @Column({ type: 'jsonb', default: {} })
  settings: Record<string, any>;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @Column({ name: 'subscription_tier', default: 'free' })
  subscriptionTier: string;

  @Column({ name: 'subscription_expires_at', type: 'timestamp', nullable: true })
  subscriptionExpiresAt: Date;

  @Column({ name: 'max_users', default: 5 })
  maxUsers: number;

  @Column({ name: 'max_projects', default: 3 })
  maxProjects: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date;

  // Relationships
  @OneToMany(() => UserTenant, (userTenant) => userTenant.tenant)
  userTenants: UserTenant[];

  @OneToMany(() => Project, (project) => project.tenant)
  projects: Project[];
}
