import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { WhiteLabelService, EmailTemplateType } from './white-label.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentTenant } from '../tenant/decorators/current-tenant.decorator';

/**
 * White Label Controller
 * Manages tenant-specific branding and customization
 */
@ApiTags('white-label')
@Controller('white-label')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WhiteLabelController {
  constructor(private readonly whiteLabelService: WhiteLabelService) {}

  /**
   * Get current white-label configuration
   */
  @Get('config')
  @ApiOperation({ summary: 'Get white-label configuration' })
  @ApiResponse({ status: 200, description: 'Configuration retrieved' })
  async getConfig(@CurrentTenant() tenantId: string) {
    return this.whiteLabelService.getConfig(tenantId);
  }

  /**
   * Update branding
   */
  @Put('branding')
  @ApiOperation({ summary: 'Update branding' })
  @ApiResponse({ status: 200, description: 'Branding updated' })
  @ApiResponse({ status: 403, description: 'White-label features not available on current plan' })
  async updateBranding(
    @CurrentTenant() tenantId: string,
    @Body() branding: {
      brandName?: string;
      logoUrl?: string;
      faviconUrl?: string;
      colors?: any;
    },
  ) {
    return this.whiteLabelService.updateBranding(tenantId, branding);
  }

  /**
   * Update email configuration
   */
  @Put('email-config')
  @ApiOperation({ summary: 'Update email configuration' })
  @ApiResponse({ status: 200, description: 'Email config updated' })
  async updateEmailConfig(
    @CurrentTenant() tenantId: string,
    @Body() emailConfig: {
      emailFromName?: string;
      emailFromAddress?: string;
      emailReplyTo?: string;
      customSmtpHost?: string;
      customSmtpPort?: number;
      customSmtpUsername?: string;
      customSmtpPassword?: string;
      customSmtpSecure?: boolean;
    },
  ) {
    return this.whiteLabelService.updateEmailConfig(tenantId, emailConfig);
  }

  /**
   * Set custom domain
   */
  @Post('custom-domain')
  @ApiOperation({ summary: 'Set custom domain' })
  @ApiResponse({ status: 200, description: 'Custom domain set' })
  @ApiResponse({ status: 400, description: 'Invalid domain or already in use' })
  async setCustomDomain(
    @CurrentTenant() tenantId: string,
    @Body() body: { domain: string },
  ) {
    return this.whiteLabelService.setCustomDomain(tenantId, body.domain);
  }

  /**
   * Verify custom domain
   */
  @Post('custom-domain/verify')
  @ApiOperation({ summary: 'Verify custom domain' })
  @ApiResponse({ status: 200, description: 'Domain verification status' })
  async verifyCustomDomain(@CurrentTenant() tenantId: string) {
    const verified = await this.whiteLabelService.verifyCustomDomain(tenantId);
    return { verified };
  }

  /**
   * Update feature toggles
   */
  @Put('features')
  @ApiOperation({ summary: 'Update feature toggles' })
  @ApiResponse({ status: 200, description: 'Features updated' })
  async updateFeatures(
    @CurrentTenant() tenantId: string,
    @Body() features: {
      showPoweredBy?: boolean;
      enableCustomAuth?: boolean;
      enableCustomSMTP?: boolean;
      enableCustomDomain?: boolean;
      enableCustomCss?: boolean;
    },
  ) {
    return this.whiteLabelService.updateFeatures(tenantId, features);
  }

  /**
   * Get email template
   */
  @Get('email-templates/:templateType')
  @ApiOperation({ summary: 'Get email template' })
  @ApiResponse({ status: 200, description: 'Email template retrieved' })
  async getEmailTemplate(
    @CurrentTenant() tenantId: string,
    @Body() body: { templateType: EmailTemplateType },
  ) {
    return this.whiteLabelService.getEmailTemplate(tenantId, body.templateType);
  }

  /**
   * Update email template
   */
  @Put('email-templates/:templateType')
  @ApiOperation({ summary: 'Update email template' })
  @ApiResponse({ status: 200, description: 'Email template updated' })
  async updateEmailTemplate(
    @CurrentTenant() tenantId: string,
    @Body() body: {
      templateType: EmailTemplateType;
      subject?: string;
      htmlContent?: string;
      textContent?: string;
      variables?: Record<string, string>;
    },
  ) {
    return this.whiteLabelService.updateEmailTemplate(
      tenantId,
      body.templateType,
      body,
    );
  }

  /**
   * Upload logo
   */
  @Post('upload/logo')
  @ApiOperation({ summary: 'Upload logo' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  @ApiResponse({ status: 200, description: 'Logo uploaded' })
  async uploadLogo(
    @CurrentTenant() tenantId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 2 * 1024 * 1024 }), // 2MB
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|svg)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.whiteLabelService.uploadLogo(tenantId, file);
  }

  /**
   * Preview email template
   */
  @Post('email-templates/:templateType/preview')
  @ApiOperation({ summary: 'Preview email template' })
  @ApiResponse({ status: 200, description: 'Email preview generated' })
  async previewEmail(
    @CurrentTenant() tenantId: string,
    @Body() body: {
      templateType: EmailTemplateType;
      variables: Record<string, string>;
    },
  ) {
    return this.whiteLabelService.renderEmailTemplate(
      tenantId,
      body.templateType,
      body.variables,
    );
  }
}

/**
 * White Label Middleware
 * Injects white-label config into requests based on custom domain
 */
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class WhiteLabelMiddleware implements NestMiddleware {
  constructor(private readonly whiteLabelService: WhiteLabelService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const host = req.get('host');

    if (host) {
      // Check if this is a custom domain
      const config = await this.whiteLabelService.getConfigByDomain(host);

      if (config) {
        // Inject white-label config into request
        (req as any).whiteLabelConfig = config;
        (req as any).tenantId = config.tenantId;
      }
    }

    next();
  }
}
