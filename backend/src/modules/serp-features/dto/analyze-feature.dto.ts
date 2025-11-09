import { IsString, IsNumber, IsEnum, IsOptional, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { SerpFeatureType, FeaturePosition } from '../entities/serp-feature-analysis.entity';

export class AnalyzeFeatureDto {
  @ApiProperty({
    description: 'Keyword being analyzed',
    example: 'best seo tools 2024',
  })
  @IsString()
  keyword: string;

  @ApiProperty({
    description: 'Monthly search volume',
    example: 5000,
  })
  @IsNumber()
  @Min(0)
  searchVolume: number;

  @ApiProperty({
    description: 'Type of SERP feature',
    enum: SerpFeatureType,
  })
  @IsEnum(SerpFeatureType)
  featureType: SerpFeatureType;

  @ApiProperty({
    description: 'Position of the feature in SERP',
    enum: FeaturePosition,
  })
  @IsEnum(FeaturePosition)
  position: FeaturePosition;

  @ApiProperty({
    description: 'URL shown in the feature',
    required: false,
  })
  @IsOptional()
  @IsString()
  featureUrl?: string;

  @ApiProperty({
    description: 'Content/text of the feature',
    required: false,
  })
  @IsOptional()
  @IsString()
  featureContent?: string;

  @ApiProperty({
    description: 'Your domain (to check ownership)',
    example: 'yoursite.com',
  })
  @IsString()
  yourDomain: string;

  @ApiProperty({
    description: 'Your current organic rank for this keyword',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  yourCurrentRank?: number;
}
