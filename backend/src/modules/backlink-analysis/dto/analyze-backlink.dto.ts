import { IsString, IsOptional, IsEnum, IsDate, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { LinkType } from '../entities/backlink-analysis.entity';

export class AnalyzeBacklinkDto {
  @ApiProperty({
    description: 'Source URL (URL linking to you)',
    example: 'https://example.com/article',
  })
  @IsString()
  sourceUrl: string;

  @ApiProperty({
    description: 'Target URL (your URL being linked to)',
    example: 'https://yoursite.com/page',
  })
  @IsString()
  targetUrl: string;

  @ApiProperty({
    description: 'Anchor text of the link',
    example: 'best seo tools',
  })
  @IsString()
  anchorText: string;

  @ApiProperty({
    description: 'Link type',
    enum: LinkType,
    required: false,
    default: LinkType.DOFOLLOW,
  })
  @IsOptional()
  @IsEnum(LinkType)
  linkType?: LinkType;

  @ApiProperty({
    description: 'Date when link was discovered',
    required: false,
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  discoveryDate?: Date;
}

export class AnalyzeBacklinkBatchDto {
  @ApiProperty({
    description: 'Array of backlinks to analyze',
    type: [AnalyzeBacklinkDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnalyzeBacklinkDto)
  backlinks: AnalyzeBacklinkDto[];
}
