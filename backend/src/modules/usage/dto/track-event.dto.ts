import { IsEnum, IsOptional, IsObject, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UsageEventType } from '../usage-tracking.service';

export class TrackEventDto {
  @ApiProperty({
    enum: UsageEventType,
    description: 'Type of usage event',
  })
  @IsEnum(UsageEventType)
  eventType: UsageEventType;

  @ApiProperty({
    description: 'Additional metadata for the event',
    required: false,
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @ApiProperty({
    description: 'Number of credits consumed',
    default: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  creditsUsed?: number;
}

export class UsageReportQueryDto {
  @ApiProperty({ description: 'Start date (ISO 8601)', required: true })
  startDate: string;

  @ApiProperty({ description: 'End date (ISO 8601)', required: true })
  endDate: string;
}

export class MonthlyReportParamsDto {
  @ApiProperty({ description: 'Year', example: 2024 })
  @IsNumber()
  year: number;

  @ApiProperty({ description: 'Month (1-12)', example: 11 })
  @IsNumber()
  @Min(1)
  month: number;
}
