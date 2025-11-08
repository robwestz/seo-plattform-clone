import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsNumber, IsObject } from 'class-validator';
import { UsageEventType } from '../entities/usage-event.entity';

/**
 * DTO for recording usage event
 */
export class RecordUsageDto {
  @ApiProperty({
    enum: UsageEventType,
    example: UsageEventType.API_CALL,
    description: 'Type of usage event',
  })
  @IsEnum(UsageEventType)
  eventType: UsageEventType;

  @ApiProperty({ example: 'keyword', description: 'Resource type' })
  @IsString()
  resource: string;

  @ApiProperty({ example: 'uuid', description: 'Resource ID', required: false })
  @IsOptional()
  @IsString()
  resourceId?: string;

  @ApiProperty({ example: 1, description: 'Quantity', required: false })
  @IsOptional()
  @IsNumber()
  quantity?: number;

  @ApiProperty({ example: {}, description: 'Additional metadata', required: false })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
