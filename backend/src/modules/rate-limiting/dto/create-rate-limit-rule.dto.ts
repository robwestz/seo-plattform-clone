import {
  IsString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsBoolean,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import {
  RateLimitAlgorithm,
  RateLimitScope,
} from '../entities/rate-limit-rule.entity';

export class CreateRateLimitRuleDto {
  @ApiProperty({
    description: 'Rule name',
    example: 'API Rate Limit',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Rule description',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Rate limit scope',
    enum: RateLimitScope,
  })
  @IsEnum(RateLimitScope)
  scope: RateLimitScope;

  @ApiProperty({
    description: 'Scope value (tenant ID, user ID, IP, etc.)',
    required: false,
  })
  @IsOptional()
  @IsString()
  scopeValue?: string;

  @ApiProperty({
    description: 'Endpoint pattern',
    example: '/api/keywords/*',
    required: false,
  })
  @IsOptional()
  @IsString()
  endpoint?: string;

  @ApiProperty({
    description: 'Rate limiting algorithm',
    enum: RateLimitAlgorithm,
    default: RateLimitAlgorithm.TOKEN_BUCKET,
  })
  @IsEnum(RateLimitAlgorithm)
  algorithm: RateLimitAlgorithm;

  @ApiProperty({
    description: 'Maximum requests per window',
    example: 100,
  })
  @IsNumber()
  @Min(1)
  maxRequests: number;

  @ApiProperty({
    description: 'Time window in seconds',
    example: 60,
  })
  @IsNumber()
  @Min(1)
  windowSeconds: number;

  @ApiProperty({
    description: 'Burst size (for token bucket)',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  burstSize?: number;

  @ApiProperty({
    description: 'Refill rate (tokens per second, for token bucket)',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  refillRate?: number;

  @ApiProperty({
    description: 'Rule priority (higher = applied first)',
    required: false,
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  priority?: number;

  @ApiProperty({
    description: 'Custom error message',
    required: false,
  })
  @IsOptional()
  @IsString()
  customMessage?: string;

  @ApiProperty({
    description: 'Suggested retry-after seconds',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  retryAfterSeconds?: number;

  @ApiProperty({
    description: 'Enable/disable rule',
    required: false,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}

export class UpdateRateLimitRuleDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxRequests?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  windowSeconds?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  priority?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  customMessage?: string;
}
