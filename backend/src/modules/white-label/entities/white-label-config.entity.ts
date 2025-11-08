import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Tenant } from '../../../database/entities/tenant.entity';

/**
 * White label configuration entity
 * Stores custom branding and configuration for white label tenants
 */
@Entity('white_label_configs')
export class WhiteLabelConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid', unique: true })
  tenantId: string;

  // Branding
  @Column({ name: 'company_name', nullable: true })
  companyName: string;

  @Column({ name: 'logo_url', type: 'text', nullable: true })
  logoUrl: string;

  @Column({ name: 'logo_dark_url', type: 'text', nullable: true })
  logoDarkUrl: string;

  @Column({ name: 'favicon_url', type: 'text', nullable: true })
  faviconUrl: string;

  @Column({ name: 'primary_color', nullable: true })
  primaryColor: string;

  @Column({ name: 'secondary_color', nullable: true })
  secondaryColor: string;

  @Column({ name: 'accent_color', nullable: true })
  accentColor: string;

  // Custom domain
  @Column({ name: 'custom_domain', nullable: true })
  customDomain: string;

  @Column({ name: 'custom_domain_verified', default: false })
  customDomainVerified: boolean;

  @Column({ name: 'ssl_enabled', default: false })
  sslEnabled: boolean;

  // Email branding
  @Column({ name: 'email_from_name', nullable: true })
  emailFromName: string;

  @Column({ name: 'email_from_address', nullable: true })
  emailFromAddress: string;

  @Column({ name: 'email_reply_to', nullable: true })
  emailReplyTo: string;

  @Column({ name: 'email_footer_text', type: 'text', nullable: true })
  emailFooterText: string;

  @Column({ name: 'email_logo_url', type: 'text', nullable: true })
  emailLogoUrl: string;

  // Custom templates
  @Column({ type: 'jsonb', default: {} })
  emailTemplates: {
    welcome?: string;
    passwordReset?: string;
    reportReady?: string;
    [key: string]: string;
  };

  // UI customization
  @Column({ type: 'jsonb', default: {} })
  customCss: Record<string, any>;

  @Column({ type: 'jsonb', default: {} })
  customJs: Record<string, any>;

  @Column({ name: 'hide_branding', default: false })
  hideBranding: boolean;

  @Column({ name: 'custom_footer', type: 'text', nullable: true })
  customFooter: string;

  // Legal
  @Column({ name: 'terms_of_service_url', type: 'text', nullable: true })
  termsOfServiceUrl: string;

  @Column({ name: 'privacy_policy_url', type: 'text', nullable: true })
  privacyPolicyUrl: string;

  @Column({ name: 'support_email', nullable: true })
  supportEmail: string;

  @Column({ name: 'support_url', type: 'text', nullable: true })
  supportUrl: string;

  // Social media
  @Column({ type: 'jsonb', default: {} })
  socialLinks: {
    twitter?: string;
    facebook?: string;
    linkedin?: string;
    instagram?: string;
    [key: string]: string;
  };

  // SEO meta tags
  @Column({ name: 'meta_title', nullable: true })
  metaTitle: string;

  @Column({ name: 'meta_description', type: 'text', nullable: true })
  metaDescription: string;

  @Column({ name: 'meta_keywords', type: 'text', nullable: true })
  metaKeywords: string;

  // Analytics
  @Column({ name: 'google_analytics_id', nullable: true })
  googleAnalyticsId: string;

  @Column({ name: 'facebook_pixel_id', nullable: true })
  facebookPixelId: string;

  @Column({ type: 'jsonb', default: {} })
  customScripts: {
    header?: string;
    footer?: string;
    [key: string]: string;
  };

  @Column({ default: true })
  enabled: boolean;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relationships
  @OneToOne(() => Tenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;
}
