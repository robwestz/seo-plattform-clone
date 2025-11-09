import { IsString, IsOptional, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AnalyzeContentDto {
  @ApiProperty({ description: 'Content text to analyze' })
  @IsString()
  content: string;

  @ApiProperty({ description: 'Page title', required: false })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ description: 'Meta description', required: false })
  @IsOptional()
  @IsString()
  metaDescription?: string;

  @ApiProperty({ description: 'Page URL', required: false })
  @IsOptional()
  @IsString()
  url?: string;

  @ApiProperty({ description: 'Target keyword for SEO', required: false })
  @IsOptional()
  @IsString()
  targetKeyword?: string;

  @ApiProperty({ description: 'Full HTML content', required: false })
  @IsOptional()
  @IsString()
  html?: string;
}
