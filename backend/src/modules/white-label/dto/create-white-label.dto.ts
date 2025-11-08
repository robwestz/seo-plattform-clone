import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsObject, IsUrl, IsHexColor } from 'class-validator';

/**
 * DTO for creating/updating white label configuration
 */
export class CreateWhiteLabelDto {
  @ApiProperty({ example: 'Acme SEO', description: 'Company name', required: false })
  @IsOptional()
  @IsString()
  companyName?: string;

  @ApiProperty({ example: 'https://example.com/logo.png', description: 'Logo URL', required: false })
  @IsOptional()
  @IsUrl()
  logoUrl?: string;

  @ApiProperty({
    example: 'https://example.com/logo-dark.png',
    description: 'Dark mode logo URL',
    required: false,
  })
  @IsOptional()
  @IsUrl()
  logoDarkUrl?: string;

  @ApiProperty({ example: 'https://example.com/favicon.ico', description: 'Favicon URL', required: false })
  @IsOptional()
  @IsUrl()
  faviconUrl?: string;

  @ApiProperty({ example: '#007bff', description: 'Primary brand color', required: false })
  @IsOptional()
  @IsHexColor()
  primaryColor?: string;

  @ApiProperty({ example: '#6c757d', description: 'Secondary brand color', required: false })
  @IsOptional()
  @IsHexColor()
  secondaryColor?: string;

  @ApiProperty({ example: '#28a745', description: 'Accent color', required: false })
  @IsOptional()
  @IsHexColor()
  accentColor?: string;

  @ApiProperty({ example: 'seo.example.com', description: 'Custom domain', required: false })
  @IsOptional()
  @IsString()
  customDomain?: string;

  @ApiProperty({ example: 'Acme SEO', description: 'Email from name', required: false })
  @IsOptional()
  @IsString()
  emailFromName?: string;

  @ApiProperty({
    example: 'noreply@example.com',
    description: 'Email from address',
    required: false,
  })
  @IsOptional()
  @IsString()
  emailFromAddress?: string;

  @ApiProperty({ example: 'support@example.com', description: 'Email reply-to', required: false })
  @IsOptional()
  @IsString()
  emailReplyTo?: string;

  @ApiProperty({
    example: 'Copyright 2024 Acme SEO',
    description: 'Email footer text',
    required: false,
  })
  @IsOptional()
  @IsString()
  emailFooterText?: string;

  @ApiProperty({ example: {}, description: 'Email templates', required: false })
  @IsOptional()
  @IsObject()
  emailTemplates?: Record<string, string>;

  @ApiProperty({ example: true, description: 'Hide platform branding', required: false })
  @IsOptional()
  @IsBoolean()
  hideBranding?: boolean;

  @ApiProperty({
    example: 'https://example.com/terms',
    description: 'Terms of service URL',
    required: false,
  })
  @IsOptional()
  @IsUrl()
  termsOfServiceUrl?: string;

  @ApiProperty({
    example: 'https://example.com/privacy',
    description: 'Privacy policy URL',
    required: false,
  })
  @IsOptional()
  @IsUrl()
  privacyPolicyUrl?: string;

  @ApiProperty({ example: 'support@example.com', description: 'Support email', required: false })
  @IsOptional()
  @IsString()
  supportEmail?: string;

  @ApiProperty({
    example: 'https://example.com/support',
    description: 'Support URL',
    required: false,
  })
  @IsOptional()
  @IsUrl()
  supportUrl?: string;

  @ApiProperty({ example: {}, description: 'Social media links', required: false })
  @IsOptional()
  @IsObject()
  socialLinks?: Record<string, string>;

  @ApiProperty({ example: 'SEO Platform', description: 'Meta title', required: false })
  @IsOptional()
  @IsString()
  metaTitle?: string;

  @ApiProperty({
    example: 'Advanced SEO intelligence platform',
    description: 'Meta description',
    required: false,
  })
  @IsOptional()
  @IsString()
  metaDescription?: string;

  @ApiProperty({ example: 'G-XXXXXXXXXX', description: 'Google Analytics ID', required: false })
  @IsOptional()
  @IsString()
  googleAnalyticsId?: string;
}
