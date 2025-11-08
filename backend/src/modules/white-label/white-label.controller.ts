import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { WhiteLabelService } from './white-label.service';
import { CreateWhiteLabelDto } from './dto/create-white-label.dto';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { Public } from '../../common/decorators/public.decorator';

/**
 * White Label Controller
 * Manages white label branding and configuration
 */
@ApiTags('white-label')
@ApiBearerAuth()
@Controller('white-label')
export class WhiteLabelController {
  constructor(private readonly whiteLabelService: WhiteLabelService) {}

  /**
   * Get white label configuration
   */
  @Get()
  @ApiOperation({ summary: 'Get white label configuration' })
  @ApiResponse({ status: 200, description: 'White label configuration' })
  @ApiResponse({ status: 404, description: 'Configuration not found' })
  async getConfig(@CurrentTenant() tenantId: string) {
    return this.whiteLabelService.getConfig(tenantId);
  }

  /**
   * Get public white label configuration
   */
  @Public()
  @Get('public/:tenantId')
  @ApiOperation({ summary: 'Get public white label configuration' })
  @ApiResponse({ status: 200, description: 'Public white label configuration' })
  async getPublicConfig(@Param('tenantId') tenantId: string) {
    return this.whiteLabelService.getPublicConfig(tenantId);
  }

  /**
   * Get configuration by custom domain
   */
  @Public()
  @Get('domain/:domain')
  @ApiOperation({ summary: 'Get white label configuration by domain' })
  @ApiResponse({ status: 200, description: 'White label configuration' })
  @ApiResponse({ status: 404, description: 'Configuration not found' })
  async getConfigByDomain(@Param('domain') domain: string) {
    return this.whiteLabelService.getConfigByDomain(domain);
  }

  /**
   * Create or update white label configuration
   */
  @Post()
  @ApiOperation({ summary: 'Create or update white label configuration' })
  @ApiResponse({ status: 200, description: 'Configuration updated successfully' })
  async createOrUpdate(@CurrentTenant() tenantId: string, @Body() createDto: CreateWhiteLabelDto) {
    return this.whiteLabelService.createOrUpdate(tenantId, createDto);
  }

  /**
   * Verify custom domain
   */
  @Post('verify-domain')
  @ApiOperation({ summary: 'Verify custom domain' })
  @ApiResponse({ status: 200, description: 'Domain verified successfully' })
  async verifyDomain(@CurrentTenant() tenantId: string, @Body('domain') domain: string) {
    return this.whiteLabelService.verifyDomain(tenantId, domain);
  }

  /**
   * Update email templates
   */
  @Put('email-templates')
  @ApiOperation({ summary: 'Update email templates' })
  @ApiResponse({ status: 200, description: 'Email templates updated' })
  async updateEmailTemplates(
    @CurrentTenant() tenantId: string,
    @Body() templates: Record<string, string>,
  ) {
    return this.whiteLabelService.updateEmailTemplates(tenantId, templates);
  }

  /**
   * Update brand colors
   */
  @Put('colors')
  @ApiOperation({ summary: 'Update brand colors' })
  @ApiResponse({ status: 200, description: 'Brand colors updated' })
  async updateColors(
    @CurrentTenant() tenantId: string,
    @Body()
    colors: {
      primaryColor?: string;
      secondaryColor?: string;
      accentColor?: string;
    },
  ) {
    return this.whiteLabelService.updateColors(tenantId, colors);
  }

  /**
   * Update social links
   */
  @Put('social-links')
  @ApiOperation({ summary: 'Update social media links' })
  @ApiResponse({ status: 200, description: 'Social links updated' })
  async updateSocialLinks(
    @CurrentTenant() tenantId: string,
    @Body() socialLinks: Record<string, string>,
  ) {
    return this.whiteLabelService.updateSocialLinks(tenantId, socialLinks);
  }

  /**
   * Enable/disable white label
   */
  @Put('toggle')
  @ApiOperation({ summary: 'Enable or disable white label' })
  @ApiResponse({ status: 200, description: 'White label status updated' })
  async toggleEnabled(@CurrentTenant() tenantId: string, @Body('enabled') enabled: boolean) {
    return this.whiteLabelService.toggleEnabled(tenantId, enabled);
  }

  /**
   * Delete white label configuration
   */
  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete white label configuration' })
  @ApiResponse({ status: 204, description: 'Configuration deleted' })
  async delete(@CurrentTenant() tenantId: string) {
    await this.whiteLabelService.delete(tenantId);
  }
}
