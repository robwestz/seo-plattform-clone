import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import * as bcrypt from 'bcrypt';
import { UserTenant } from './user-tenant.entity';

/**
 * User entity
 * Represents a user in the system
 * Users can belong to multiple tenants with different roles
 */
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 255 })
  email: string;

  @Column({ length: 100 })
  firstName: string;

  @Column({ length: 100 })
  lastName: string;

  @Column({ select: false })
  @Exclude()
  password: string;

  @Column({ nullable: true, length: 20 })
  phone: string;

  @Column({ nullable: true, length: 255 })
  avatar: string;

  @Column({ default: true })
  active: boolean;

  @Column({ name: 'email_verified', default: false })
  emailVerified: boolean;

  @Column({ name: 'email_verified_at', type: 'timestamp', nullable: true })
  emailVerifiedAt: Date;

  @Column({ name: 'last_login_at', type: 'timestamp', nullable: true })
  lastLoginAt: Date;

  @Column({ name: 'password_changed_at', type: 'timestamp', nullable: true })
  passwordChangedAt: Date;

  @Column({ type: 'jsonb', default: {} })
  preferences: Record<string, any>;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @Column({ name: 'refresh_token', type: 'text', nullable: true, select: false })
  @Exclude()
  refreshToken: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date;

  // Relationships
  @OneToMany(() => UserTenant, (userTenant) => userTenant.user)
  userTenants: UserTenant[];

  // Virtual field for full name
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  /**
   * Hash password before insert
   */
  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.password && !this.password.startsWith('$2')) {
      const saltRounds = parseInt(process.env.BCRYPT_ROUNDS, 10) || 10;
      this.password = await bcrypt.hash(this.password, saltRounds);
    }
  }

  /**
   * Validate password against hash
   * @param password - Plain text password to validate
   * @returns True if password matches
   */
  async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }

  /**
   * Hash and set refresh token
   * @param token - Refresh token to hash and store
   */
  async setRefreshToken(token: string): Promise<void> {
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS, 10) || 10;
    this.refreshToken = await bcrypt.hash(token, saltRounds);
  }

  /**
   * Validate refresh token
   * @param token - Refresh token to validate
   * @returns True if token matches
   */
  async validateRefreshToken(token: string): Promise<boolean> {
    if (!this.refreshToken) return false;
    return bcrypt.compare(token, this.refreshToken);
  }
}
