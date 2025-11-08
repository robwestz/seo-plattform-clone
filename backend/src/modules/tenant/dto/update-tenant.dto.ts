import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, MinLength, MaxLength, IsBoolean, IsObject } from 'class-validator';

/**
 * Data Transfer Object for updating a tenant
 */
export class UpdateTenantDto {
  @ApiProperty({ example: 'Acme Corporation', description: 'Tenant name' })
  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @ApiProperty({ example: 'Marketing and SEO agency', description: 'Tenant description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: true, description: 'Whether tenant is active' })
  @IsBoolean()
  @IsOptional()
  active?: boolean;

  @ApiProperty({ example: { theme: 'dark' }, description: 'Tenant settings' })
  @IsObject()
  @IsOptional()
  settings?: Record<string, any>;
}
