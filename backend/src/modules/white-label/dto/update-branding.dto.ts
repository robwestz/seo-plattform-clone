import { IsOptional, IsString, IsObject, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { BrandColors } from '../white-label.service';

export class UpdateBrandingDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  brandName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUrl()
  logoUrl?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUrl()
  faviconUrl?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  colors?: BrandColors;
}

export class UpdateEmailConfigDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  emailFromName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  emailFromAddress?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  emailReplyTo?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  customSmtpHost?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  customSmtpPort?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  customSmtpUsername?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  customSmtpPassword?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  customSmtpSecure?: boolean;
}

export class SetCustomDomainDto {
  @ApiProperty()
  @IsString()
  domain: string;
}

export class UpdateFeaturesDto {
  @ApiProperty({ required: false })
  @IsOptional()
  showPoweredBy?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  enableCustomAuth?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  enableCustomSMTP?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  enableCustomDomain?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  enableCustomCss?: boolean;
}

export class UpdateEmailTemplateDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  htmlContent?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  textContent?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  variables?: Record<string, string>;
}
