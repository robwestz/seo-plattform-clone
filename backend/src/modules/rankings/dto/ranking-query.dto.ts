import { IsOptional, IsEnum, IsString, IsDateString, IsUUID } from 'class-validator';
import { DeviceType } from '../entities/ranking.entity';

/**
 * DTO for querying ranking history
 */
export class RankingQueryDto {
  @IsOptional()
  @IsUUID()
  keywordId?: string;

  @IsOptional()
  @IsEnum(DeviceType)
  device?: DeviceType;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  groupBy?: 'day' | 'week' | 'month' = 'day';
}
