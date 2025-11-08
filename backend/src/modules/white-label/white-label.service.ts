import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { WhiteLabelConfig } from './entities/white-label-config.entity';
import { CreateWhiteLabelDto } from './dto/create-white-label.dto';

/**
 * White Label Service
 * Manages white label branding and configuration
 */
@Injectable()
export class WhiteLabelService {
  private readonly logger = new Logger(WhiteLabelService.name);

  constructor(
    @InjectRepository(WhiteLabelConfig)
    private whiteLabelRepository: Repository<WhiteLabelConfig>,
    private eventEmitter: EventEmitter2,
  ) {}

  /**
   * Create or update white label configuration
   */
  async createOrUpdate(tenantId: string, createDto: CreateWhiteLabelDto): Promise<WhiteLabelConfig> {
    this.logger.log(`Creating/updating white label config for tenant ${tenantId}`);

    let config = await this.whiteLabelRepository.findOne({
      where: { tenantId },
    });

    if (config) {
      // Update existing config
      Object.assign(config, createDto);
    } else {
      // Create new config
      config = this.whiteLabelRepository.create({
        tenantId,
        ...createDto,
        enabled: true,
      });
    }

    const saved = await this.whiteLabelRepository.save(config);

    this.eventEmitter.emit('white_label.updated', { config: saved, tenantId });

    return saved;
  }

  /**
   * Get white label configuration for tenant
   */
  async getConfig(tenantId: string): Promise<WhiteLabelConfig> {
    const config = await this.whiteLabelRepository.findOne({
      where: { tenantId },
    });

    if (!config) {
      throw new NotFoundException('White label configuration not found');
    }

    return config;
  }

  /**
   * Get white label configuration by custom domain
   */
  async getConfigByDomain(domain: string): Promise<WhiteLabelConfig | null> {
    return this.whiteLabelRepository.findOne({
      where: { customDomain: domain, enabled: true },
    });
  }

  /**
   * Verify custom domain
   */
  async verifyDomain(tenantId: string, domain: string): Promise<WhiteLabelConfig> {
    this.logger.log(`Verifying custom domain ${domain} for tenant ${tenantId}`);

    const config = await this.getConfig(tenantId);

    if (config.customDomain !== domain) {
      throw new ForbiddenException('Domain does not match configuration');
    }

    // In production: Verify DNS records, SSL certificate, etc.
    // For now, just mark as verified
    config.customDomainVerified = true;
    config.sslEnabled = true;

    const updated = await this.whiteLabelRepository.save(config);

    this.eventEmitter.emit('white_label.domain_verified', { config: updated, tenantId, domain });

    return updated;
  }

  /**
   * Update email templates
   */
  async updateEmailTemplates(
    tenantId: string,
    templates: Record<string, string>,
  ): Promise<WhiteLabelConfig> {
    this.logger.log(`Updating email templates for tenant ${tenantId}`);

    const config = await this.getConfig(tenantId);

    config.emailTemplates = {
      ...config.emailTemplates,
      ...templates,
    };

    return this.whiteLabelRepository.save(config);
  }

  /**
   * Update branding colors
   */
  async updateColors(
    tenantId: string,
    colors: { primaryColor?: string; secondaryColor?: string; accentColor?: string },
  ): Promise<WhiteLabelConfig> {
    this.logger.log(`Updating brand colors for tenant ${tenantId}`);

    const config = await this.getConfig(tenantId);

    if (colors.primaryColor) config.primaryColor = colors.primaryColor;
    if (colors.secondaryColor) config.secondaryColor = colors.secondaryColor;
    if (colors.accentColor) config.accentColor = colors.accentColor;

    return this.whiteLabelRepository.save(config);
  }

  /**
   * Update social links
   */
  async updateSocialLinks(
    tenantId: string,
    socialLinks: Record<string, string>,
  ): Promise<WhiteLabelConfig> {
    this.logger.log(`Updating social links for tenant ${tenantId}`);

    const config = await this.getConfig(tenantId);

    config.socialLinks = {
      ...config.socialLinks,
      ...socialLinks,
    };

    return this.whiteLabelRepository.save(config);
  }

  /**
   * Enable/disable white label
   */
  async toggleEnabled(tenantId: string, enabled: boolean): Promise<WhiteLabelConfig> {
    this.logger.log(`${enabled ? 'Enabling' : 'Disabling'} white label for tenant ${tenantId}`);

    const config = await this.getConfig(tenantId);
    config.enabled = enabled;

    return this.whiteLabelRepository.save(config);
  }

  /**
   * Delete white label configuration
   */
  async delete(tenantId: string): Promise<void> {
    this.logger.log(`Deleting white label config for tenant ${tenantId}`);

    const config = await this.getConfig(tenantId);
    await this.whiteLabelRepository.remove(config);

    this.eventEmitter.emit('white_label.deleted', { tenantId });
  }

  /**
   * Get public white label configuration (for unauthenticated users)
   */
  async getPublicConfig(tenantId: string): Promise<Partial<WhiteLabelConfig>> {
    const config = await this.getConfig(tenantId);

    // Return only public-facing configuration
    return {
      companyName: config.companyName,
      logoUrl: config.logoUrl,
      logoDarkUrl: config.logoDarkUrl,
      faviconUrl: config.faviconUrl,
      primaryColor: config.primaryColor,
      secondaryColor: config.secondaryColor,
      accentColor: config.accentColor,
      customDomain: config.customDomain,
      termsOfServiceUrl: config.termsOfServiceUrl,
      privacyPolicyUrl: config.privacyPolicyUrl,
      supportEmail: config.supportEmail,
      supportUrl: config.supportUrl,
      socialLinks: config.socialLinks,
      metaTitle: config.metaTitle,
      metaDescription: config.metaDescription,
      hideBranding: config.hideBranding,
    };
  }
}
