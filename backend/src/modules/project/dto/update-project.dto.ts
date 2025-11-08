import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, MinLength, MaxLength, IsArray, IsEnum, IsObject } from 'class-validator';
import { ProjectStatus } from '../../../database/entities/project.entity';

/**
 * Data Transfer Object for updating a project
 */
export class UpdateProjectDto {
  @ApiProperty({ example: 'My SEO Project', description: 'Project name' })
  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(255)
  name?: string;

  @ApiProperty({ example: 'SEO optimization for e-commerce site', description: 'Project description' })
  @IsString()
  @IsOptional()
  description?: string;

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

  @ApiProperty({ example: { crawlFrequency: 'daily' }, description: 'Project settings' })
  @IsObject()
  @IsOptional()
  settings?: Record<string, any>;
}
