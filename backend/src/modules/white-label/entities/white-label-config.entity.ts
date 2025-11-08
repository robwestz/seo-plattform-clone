import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { BrandColors } from '../white-label.service';

@Entity('white_label_configs')
@Index(['tenantId'], { unique: true })
@Index(['customDomain'])
export class WhiteLabelConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'varchar', length: 255 })
  brandName: string;

  @Column({ type: 'text', nullable: true })
  logoUrl: string;

  @Column({ type: 'text', nullable: true })
  faviconUrl: string;

  @Column({ type: 'jsonb' })
  colors: BrandColors;

  @Column({ type: 'varchar', length: 255, nullable: true })
  customDomain: string;

  @Column({ type: 'boolean', default: false })
  customDomainVerified: boolean;

  @Column({ type: 'varchar', length: 255 })
  emailFromName: string;

  @Column({ type: 'varchar', length: 255 })
  emailFromAddress: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  emailReplyTo: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  customSmtpHost: string;

  @Column({ type: 'int', nullable: true })
  customSmtpPort: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  customSmtpUsername: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  customSmtpPassword: string;

  @Column({ type: 'boolean', default: true })
  customSmtpSecure: boolean;

  @Column({ type: 'boolean', default: true })
  showPoweredBy: boolean;

  @Column({ type: 'boolean', default: false })
  enableCustomAuth: boolean;

  @Column({ type: 'boolean', default: false })
  enableCustomSMTP: boolean;

  @Column({ type: 'boolean', default: false })
  enableCustomDomain: boolean;

  @Column({ type: 'boolean', default: false })
  enableCustomCss: boolean;

  @Column({ type: 'text', nullable: true })
  customCss: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
