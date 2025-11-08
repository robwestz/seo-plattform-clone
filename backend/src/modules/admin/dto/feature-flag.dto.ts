import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsBoolean, IsOptional } from 'class-validator';

/**
 * DTO for feature flag
 */
export class FeatureFlagDto {
  @ApiProperty({ example: 'new-dashboard', description: 'Feature flag key' })
  @IsString()
  key: string;

  @ApiProperty({ example: true, description: 'Feature enabled' })
  @IsBoolean()
  enabled: boolean;

  @ApiProperty({ example: 'New dashboard UI', description: 'Feature description', required: false })
  @IsOptional()
  @IsString()
  description?: string;
}
