import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsOptional,
  IsUrl,
  IsArray,
  IsEnum,
} from 'class-validator';
import { ProjectStatus } from '../../../database/entities/project.entity';

/**
 * Data Transfer Object for creating a project
 */
export class CreateProjectDto {
  @ApiProperty({ example: 'My SEO Project', description: 'Project name' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(255)
  name: string;

  @ApiProperty({ example: 'SEO optimization for e-commerce site', description: 'Project description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 'example.com', description: 'Project domain' })
  @IsString()
  @IsNotEmpty()
  domain: string;

  @ApiProperty({ example: 'https', description: 'Protocol (http or https)' })
  @IsString()
  @IsOptional()
  protocol?: string;

  @ApiProperty({ example: 'active', enum: ProjectStatus, description: 'Project status' })
  @IsEnum(ProjectStatus)
  @IsOptional()
  status?: ProjectStatus;

  @ApiProperty({
    example: ['seo', 'keyword research', 'backlinks'],
    description: 'Target keywords',
  })
  @IsArray()
  @IsOptional()
  targetKeywords?: string[];

  @ApiProperty({
    example: ['competitor1.com', 'competitor2.com'],
    description: 'Competitor domains',
  })
  @IsArray()
  @IsOptional()
  competitorDomains?: string[];

  @ApiProperty({ example: 'UA-123456789-1', description: 'Google Analytics ID' })
  @IsString()
  @IsOptional()
  googleAnalyticsId?: string;

  @ApiProperty({ example: 'sc-domain:example.com', description: 'Google Search Console ID' })
  @IsString()
  @IsOptional()
  googleSearchConsoleId?: string;
}
