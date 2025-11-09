import { IsArray, IsOptional, IsNumber, Min, Max, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AnalyzeGapsDto {
  @ApiProperty({
    description: 'List of competitor domains to analyze',
    example: ['competitor1.com', 'competitor2.com'],
  })
  @IsArray()
  @IsString({ each: true })
  competitorDomains: string[];

  @ApiProperty({
    description: 'Optional list of target keywords to focus on',
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  targetKeywords?: string[];

  @ApiProperty({
    description: 'Minimum search volume to consider',
    required: false,
    default: 100,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minSearchVolume?: number;

  @ApiProperty({
    description: 'Maximum number of competitors to analyze',
    required: false,
    default: 5,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(20)
  maxCompetitors?: number;
}

export class TopicCoverageDto {
  @ApiProperty({
    description: 'Topic to analyze coverage for',
    example: 'SEO best practices',
  })
  @IsString()
  topic: string;

  @ApiProperty({
    description: 'List of competitor domains',
    example: ['competitor1.com', 'competitor2.com'],
  })
  @IsArray()
  @IsString({ each: true })
  competitorDomains: string[];
}

export class KeywordOpportunitiesDto {
  @ApiProperty({
    description: 'List of competitor domains',
    example: ['competitor1.com', 'competitor2.com'],
  })
  @IsArray()
  @IsString({ each: true })
  competitorDomains: string[];

  @ApiProperty({
    description: 'Minimum search volume',
    required: false,
    default: 100,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minSearchVolume?: number;

  @ApiProperty({
    description: 'Maximum keyword difficulty (0-100)',
    required: false,
    default: 70,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  maxDifficulty?: number;

  @ApiProperty({
    description: 'Limit results',
    required: false,
    default: 50,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(200)
  limit?: number;
}

export class MarkGapAddressedDto {
  @ApiProperty({
    description: 'ID of related content created to address this gap',
    required: false,
  })
  @IsOptional()
  @IsString()
  contentId?: string;
}
