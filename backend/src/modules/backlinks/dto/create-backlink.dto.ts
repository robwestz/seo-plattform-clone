import { IsString, IsNotEmpty, IsOptional, IsEnum, IsNumber, Min, Max } from 'class-validator';
import { LinkType } from '../entities/backlink.entity';

/**
 * DTO for creating a backlink
 */
export class CreateBacklinkDto {
  @IsString()
  @IsNotEmpty()
  sourceUrl: string;

  @IsString()
  @IsNotEmpty()
  targetUrl: string;

  @IsOptional()
  @IsString()
  anchorText?: string;

  @IsOptional()
  @IsEnum(LinkType)
  type?: LinkType;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  domainAuthority?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  pageAuthority?: number;
}
