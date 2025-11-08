import { IsString, IsNotEmpty, IsOptional, IsEnum, IsArray, IsUUID } from 'class-validator';
import { DeviceType } from '../entities/ranking.entity';

/**
 * DTO for tracking keyword rankings
 */
export class TrackRankingDto {
  @IsUUID()
  @IsNotEmpty()
  keywordId: string;

  @IsOptional()
  @IsEnum(DeviceType)
  device?: DeviceType;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  language?: string;
}

/**
 * DTO for bulk ranking check
 */
export class BulkTrackRankingDto {
  @IsArray()
  @IsUUID('4', { each: true })
  keywordIds: string[];

  @IsOptional()
  @IsEnum(DeviceType)
  device?: DeviceType;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  language?: string;
}
