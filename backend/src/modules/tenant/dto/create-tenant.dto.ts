import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MinLength, MaxLength, IsOptional } from 'class-validator';

/**
 * Data Transfer Object for creating a tenant
 */
export class CreateTenantDto {
  @ApiProperty({ example: 'Acme Corporation', description: 'Tenant name' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'Marketing and SEO agency', description: 'Tenant description' })
  @IsString()
  @IsOptional()
  description?: string;
}
