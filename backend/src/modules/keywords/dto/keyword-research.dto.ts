import { IsString, IsNotEmpty, IsOptional, IsNumber, Min, Max } from 'class-validator';

/**
 * DTO for keyword research request
 */
export class KeywordResearchDto {
  @IsString()
  @IsNotEmpty()
  seedKeyword: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(200)
  limit?: number = 50;

  @IsOptional()
  @IsString()
  country?: string = 'US';

  @IsOptional()
  @IsString()
  language?: string = 'en';
}

/**
 * Response for keyword suggestions
 */
export interface KeywordSuggestion {
  keyword: string;
  searchVolume: number;
  difficulty: number;
  cpc: number;
  competition: number;
  intent: string;
  relatedKeywords: string[];
}
