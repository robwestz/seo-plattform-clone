import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsEnum } from 'class-validator';

export enum AnalyticsTimeframe {
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
  QUARTER = 'quarter',
  YEAR = 'year',
}

/**
 * DTO for analytics queries
 */
export class AnalyticsQueryDto {
  @ApiProperty({
    example: '2024-01-01',
    description: 'Start date',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({
    example: '2024-01-31',
    description: 'End date',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({
    enum: AnalyticsTimeframe,
    example: AnalyticsTimeframe.MONTH,
    description: 'Timeframe for aggregation',
    required: false,
  })
  @IsOptional()
  @IsEnum(AnalyticsTimeframe)
  timeframe?: AnalyticsTimeframe;
}
