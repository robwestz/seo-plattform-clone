import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum, IsArray, Min, Max } from 'class-validator';
import { KeywordIntent, KeywordStatus } from '../entities/keyword.entity';

/**
 * DTO for creating a new keyword
 */
export class CreateKeywordDto {
  @IsString()
  @IsNotEmpty()
  keyword: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  searchVolume?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  difficulty?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  cpc?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  competition?: number;

  @IsOptional()
  @IsEnum(KeywordIntent)
  intent?: KeywordIntent;

  @IsOptional()
  @IsEnum(KeywordStatus)
  status?: KeywordStatus;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  relatedKeywords?: string[];

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  metadata?: Record<string, any>;
}
