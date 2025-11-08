import { IsOptional, IsString, IsEnum, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class TenantQueryDto {
  @ApiProperty({ required: false, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiProperty({ required: false, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  plan?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({ required: false, enum: ['createdAt', 'name', 'revenue'] })
  @IsOptional()
  @IsEnum(['createdAt', 'name', 'revenue'])
  sortBy?: 'createdAt' | 'name' | 'revenue';

  @ApiProperty({ required: false, enum: ['ASC', 'DESC'] })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC';
}

export class DisableTenantDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class UpdateFeatureFlagDto {
  @ApiProperty({ required: false })
  @IsOptional()
  enabled?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  rolloutPercentage?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  tenantIds?: string[];
}

export class SendAnnouncementDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  message: string;

  @ApiProperty({ required: false })
  @IsOptional()
  targetPlans?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  targetTenants?: string[];

  @ApiProperty({ required: false, default: false })
  @IsOptional()
  sendEmail?: boolean;
}
