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
import { User } from './user.entity';
import { Tenant } from './tenant.entity';

export enum UserRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
  VIEWER = 'viewer',
}

/**
 * UserTenant entity
 * Junction table for many-to-many relationship between Users and Tenants
 * Stores user roles and permissions within each tenant
 */
@Entity('user_tenants')
@Index(['userId', 'tenantId'], { unique: true })
export class UserTenant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.MEMBER,
  })
  role: UserRole;

  @Column({ type: 'jsonb', default: [] })
  permissions: string[];

  @Column({ default: true })
  active: boolean;

  @Column({ name: 'invited_by', type: 'uuid', nullable: true })
  invitedBy: string;

  @Column({ name: 'invited_at', type: 'timestamp', nullable: true })
  invitedAt: Date;

  @Column({ name: 'joined_at', type: 'timestamp', nullable: true })
  joinedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => User, (user) => user.userTenants, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Tenant, (tenant) => tenant.userTenants, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;
}
