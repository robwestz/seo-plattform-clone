import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsDateString } from 'class-validator';
import { UsageEventType } from '../entities/usage-event.entity';
import { AggregationPeriod } from '../entities/usage-aggregate.entity';

/**
 * DTO for usage report query
 */
export class UsageReportDto {
  @ApiProperty({
    enum: AggregationPeriod,
    example: AggregationPeriod.DAILY,
    description: 'Aggregation period',
    required: false,
  })
  @IsOptional()
  @IsEnum(AggregationPeriod)
  period?: AggregationPeriod;

  @ApiProperty({
    enum: UsageEventType,
    example: UsageEventType.API_CALL,
    description: 'Filter by event type',
    required: false,
  })
  @IsOptional()
  @IsEnum(UsageEventType)
  eventType?: UsageEventType;

  @ApiProperty({ example: '2024-01-01', description: 'Start date', required: false })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ example: '2024-01-31', description: 'End date', required: false })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
