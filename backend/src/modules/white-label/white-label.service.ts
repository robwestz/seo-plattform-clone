import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { WhiteLabelConfig } from './entities/white-label-config.entity';
import { EmailTemplate } from './entities/email-template.entity';
import { SubscriptionService } from '../subscription/subscription.service';
import { SubscriptionPlan } from '../subscription/entities/subscription.entity';

/**
 * Brand Colors Interface
 */
export interface BrandColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
  success: string;
  warning: string;
  error: string;
}

/**
 * Email Template Variables
 */
export enum EmailTemplateType {
  WELCOME = 'welcome',
  PASSWORD_RESET = 'password_reset',
  INVOICE = 'invoice',
  PAYMENT_FAILED = 'payment_failed',
  LIMIT_WARNING = 'limit_warning',
  REPORT_READY = 'report_ready',
  ALERT = 'alert',
}

/**
 * White Label Service
 * Manages white-label configurations, branding, and customization
 */
@Injectable()
export class WhiteLabelService {
  private readonly logger = new Logger(WhiteLabelService.name);
  private readonly CACHE_PREFIX = 'whitelabel';
  private readonly CACHE_TTL = 3600; // 1 hour

  constructor(
    @InjectRepository(WhiteLabelConfig)
    private configRepository: Repository<WhiteLabelConfig>,
    @InjectRepository(EmailTemplate)
    private emailTemplateRepository: Repository<EmailTemplate>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private eventEmitter: EventEmitter2,
    private subscriptionService: SubscriptionService,
  ) {}

  /**
   * Get white-label configuration for tenant
   */
  async getConfig(tenantId: string): Promise<WhiteLabelConfig> {
    // Check cache first
    const cacheKey = `${this.CACHE_PREFIX}:${tenantId}`;
    const cached = await this.cacheManager.get<WhiteLabelConfig>(cacheKey);

    if (cached) {
      return cached;
    }

    // Fetch from database
    let config = await this.configRepository.findOne({ where: { tenantId } });

    if (!config) {
      // Create default config
      config = await this.createDefaultConfig(tenantId);
    }

    // Cache it
    await this.cacheManager.set(cacheKey, config, this.CACHE_TTL);

    return config;
  }

  /**
   * Update white-label branding
   */
  async updateBranding(
    tenantId: string,
    branding: Partial<{
      brandName: string;
      logoUrl: string;
      faviconUrl: string;
      colors: BrandColors;
      customDomain: string;
    }>,
  ): Promise<WhiteLabelConfig> {
    this.logger.log(`Updating branding for tenant ${tenantId}`);

    // Check if tenant has white-label permission
    await this.enforceWhiteLabelPermission(tenantId);

    let config = await this.configRepository.findOne({ where: { tenantId } });

    if (!config) {
      config = this.configRepository.create({
        tenantId,
        ...branding,
      });
    } else {
      Object.assign(config, branding);
    }

    const saved = await this.configRepository.save(config);

    // Clear cache
    await this.invalidateCache(tenantId);

    // Emit event
    this.eventEmitter.emit('whitelabel.branding_updated', {
      tenantId,
      branding,
    });

    return saved;
  }

  /**
   * Update email configuration
   */
  async updateEmailConfig(
    tenantId: string,
    emailConfig: Partial<{
      emailFromName: string;
      emailFromAddress: string;
      emailReplyTo: string;
      customSmtpHost: string;
      customSmtpPort: number;
      customSmtpUsername: string;
      customSmtpPassword: string;
      customSmtpSecure: boolean;
    }>,
  ): Promise<WhiteLabelConfig> {
    this.logger.log(`Updating email config for tenant ${tenantId}`);

    await this.enforceWhiteLabelPermission(tenantId);

    const config = await this.getConfig(tenantId);
    Object.assign(config, emailConfig);

    const saved = await this.configRepository.save(config);
    await this.invalidateCache(tenantId);

    this.eventEmitter.emit('whitelabel.email_config_updated', {
      tenantId,
      emailConfig,
    });

    return saved;
  }

  /**
   * Set custom domain
   */
  async setCustomDomain(tenantId: string, domain: string): Promise<WhiteLabelConfig> {
    this.logger.log(`Setting custom domain for tenant ${tenantId}: ${domain}`);

    await this.enforceWhiteLabelPermission(tenantId);

    // Validate domain format
    if (!this.isValidDomain(domain)) {
      throw new BadRequestException('Invalid domain format');
    }

    // Check if domain is already in use
    const existing = await this.configRepository.findOne({
      where: { customDomain: domain },
    });

    if (existing && existing.tenantId !== tenantId) {
      throw new BadRequestException('Domain already in use by another tenant');
    }

    const config = await this.getConfig(tenantId);
    config.customDomain = domain;
    config.customDomainVerified = false; // Requires verification

    const saved = await this.configRepository.save(config);
    await this.invalidateCache(tenantId);

    // Emit event for DNS verification
    this.eventEmitter.emit('whitelabel.custom_domain_requested', {
      tenantId,
      domain,
    });

    return saved;
  }

  /**
   * Verify custom domain (after DNS setup)
   */
  async verifyCustomDomain(tenantId: string): Promise<boolean> {
    this.logger.log(`Verifying custom domain for tenant ${tenantId}`);

    const config = await this.getConfig(tenantId);

    if (!config.customDomain) {
      throw new BadRequestException('No custom domain configured');
    }

    // In production, this would check DNS records
    // For now, we'll simulate verification
    const verified = await this.checkDomainVerification(config.customDomain);

    if (verified) {
      config.customDomainVerified = true;
      await this.configRepository.save(config);
      await this.invalidateCache(tenantId);

      this.eventEmitter.emit('whitelabel.custom_domain_verified', {
        tenantId,
        domain: config.customDomain,
      });
    }

    return verified;
  }

  /**
   * Update feature toggles
   */
  async updateFeatures(
    tenantId: string,
    features: Partial<{
      showPoweredBy: boolean;
      enableCustomAuth: boolean;
      enableCustomSMTP: boolean;
      enableCustomDomain: boolean;
      enableCustomCss: boolean;
    }>,
  ): Promise<WhiteLabelConfig> {
    this.logger.log(`Updating features for tenant ${tenantId}`);

    await this.enforceWhiteLabelPermission(tenantId);

    const config = await this.getConfig(tenantId);
    Object.assign(config, features);

    const saved = await this.configRepository.save(config);
    await this.invalidateCache(tenantId);

    return saved;
  }

  /**
   * Get or create email template
   */
  async getEmailTemplate(
    tenantId: string,
    templateType: EmailTemplateType,
  ): Promise<EmailTemplate> {
    let template = await this.emailTemplateRepository.findOne({
      where: { tenantId, templateType },
    });

    if (!template) {
      // Create from default
      template = await this.createDefaultEmailTemplate(tenantId, templateType);
    }

    return template;
  }

  /**
   * Update email template
   */
  async updateEmailTemplate(
    tenantId: string,
    templateType: EmailTemplateType,
    updates: Partial<{
      subject: string;
      htmlContent: string;
      textContent: string;
      variables: Record<string, string>;
    }>,
  ): Promise<EmailTemplate> {
    this.logger.log(`Updating email template ${templateType} for tenant ${tenantId}`);

    await this.enforceWhiteLabelPermission(tenantId);

    let template = await this.emailTemplateRepository.findOne({
      where: { tenantId, templateType },
    });

    if (!template) {
      template = this.emailTemplateRepository.create({
        tenantId,
        templateType,
        ...updates,
      });
    } else {
      Object.assign(template, updates);
    }

    const saved = await this.emailTemplateRepository.save(template);

    this.eventEmitter.emit('whitelabel.email_template_updated', {
      tenantId,
      templateType,
    });

    return saved;
  }

  /**
   * Render email template with variables
   */
  async renderEmailTemplate(
    tenantId: string,
    templateType: EmailTemplateType,
    variables: Record<string, string>,
  ): Promise<{ subject: string; html: string; text: string }> {
    const template = await this.getEmailTemplate(tenantId, templateType);
    const config = await this.getConfig(tenantId);

    // Merge branding variables
    const allVariables = {
      ...variables,
      brandName: config.brandName,
      logoUrl: config.logoUrl,
      primaryColor: config.colors?.primary || '#3B82F6',
      supportEmail: config.emailFromAddress || 'support@example.com',
    };

    // Replace variables in template
    const subject = this.replaceVariables(template.subject, allVariables);
    const html = this.replaceVariables(template.htmlContent, allVariables);
    const text = this.replaceVariables(template.textContent, allVariables);

    return { subject, html, text };
  }

  /**
   * Get configuration by custom domain
   */
  async getConfigByDomain(domain: string): Promise<WhiteLabelConfig | null> {
    const config = await this.configRepository.findOne({
      where: { customDomain: domain, customDomainVerified: true },
    });

    return config;
  }

  /**
   * Upload logo/assets (returns URL)
   */
  async uploadLogo(
    tenantId: string,
    file: Express.Multer.File,
  ): Promise<{ url: string }> {
    this.logger.log(`Uploading logo for tenant ${tenantId}`);

    await this.enforceWhiteLabelPermission(tenantId);

    // In production, upload to S3/CloudFront
    // For now, simulate upload
    const url = `https://cdn.example.com/logos/${tenantId}/${file.originalname}`;

    const config = await this.getConfig(tenantId);
    config.logoUrl = url;
    await this.configRepository.save(config);
    await this.invalidateCache(tenantId);

    return { url };
  }

  /**
   * Create default configuration
   */
  private async createDefaultConfig(tenantId: string): Promise<WhiteLabelConfig> {
    const config = this.configRepository.create({
      tenantId,
      brandName: 'SEO Platform',
      logoUrl: 'https://cdn.example.com/default-logo.png',
      faviconUrl: 'https://cdn.example.com/default-favicon.ico',
      colors: {
        primary: '#3B82F6',
        secondary: '#8B5CF6',
        accent: '#10B981',
        background: '#FFFFFF',
        text: '#1F2937',
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
      },
      emailFromName: 'SEO Platform',
      emailFromAddress: 'noreply@seo-platform.com',
      showPoweredBy: true,
      enableCustomAuth: false,
      enableCustomSMTP: false,
      enableCustomDomain: false,
      enableCustomCss: false,
    });

    return this.configRepository.save(config);
  }

  /**
   * Create default email template
   */
  private async createDefaultEmailTemplate(
    tenantId: string,
    templateType: EmailTemplateType,
  ): Promise<EmailTemplate> {
    const templates = {
      [EmailTemplateType.WELCOME]: {
        subject: 'Welcome to {{brandName}}!',
        htmlContent: `
          <h1>Welcome to {{brandName}}!</h1>
          <p>We're excited to have you on board.</p>
          <p>Click below to get started:</p>
          <a href="{{dashboardUrl}}" style="background: {{primaryColor}}; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            Get Started
          </a>
        `,
        textContent: 'Welcome to {{brandName}}! Click here to get started: {{dashboardUrl}}',
      },
      [EmailTemplateType.PASSWORD_RESET]: {
        subject: 'Reset Your Password',
        htmlContent: `
          <h1>Password Reset Request</h1>
          <p>Click the link below to reset your password:</p>
          <a href="{{resetUrl}}">Reset Password</a>
          <p>This link expires in 1 hour.</p>
        `,
        textContent: 'Reset your password: {{resetUrl}}',
      },
      // Add more default templates...
    };

    const defaultTemplate = templates[templateType] || {
      subject: 'Notification from {{brandName}}',
      htmlContent: '<p>{{message}}</p>',
      textContent: '{{message}}',
    };

    const template = this.emailTemplateRepository.create({
      tenantId,
      templateType,
      ...defaultTemplate,
    });

    return this.emailTemplateRepository.save(template);
  }

  /**
   * Replace variables in template string
   */
  private replaceVariables(template: string, variables: Record<string, string>): string {
    let result = template;

    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, value || '');
    });

    return result;
  }

  /**
   * Validate domain format
   */
  private isValidDomain(domain: string): boolean {
    const domainRegex = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i;
    return domainRegex.test(domain);
  }

  /**
   * Check DNS verification (mock)
   */
  private async checkDomainVerification(domain: string): Promise<boolean> {
    // In production, check DNS TXT record
    // For now, simulate verification
    return true;
  }

  /**
   * Enforce white-label permission
   */
  private async enforceWhiteLabelPermission(tenantId: string): Promise<void> {
    const subscription = await this.subscriptionService.getCurrentSubscription(tenantId);

    if (!subscription.hasWhiteLabel) {
      throw new BadRequestException(
        'White-label features require Enterprise or White-Label plan',
      );
    }
  }

  /**
   * Invalidate cache
   */
  private async invalidateCache(tenantId: string): Promise<void> {
    const cacheKey = `${this.CACHE_PREFIX}:${tenantId}`;
    await this.cacheManager.del(cacheKey);
  }
}
