import { IsString, IsNotEmpty, IsOptional, IsDateString, IsEnum, IsArray } from 'class-validator';

export enum GSCDimension {
  QUERY = 'query',
  PAGE = 'page',
  COUNTRY = 'country',
  DEVICE = 'device',
  SEARCH_APPEARANCE = 'searchAppearance',
  DATE = 'date',
}

export enum GSCSearchType {
  WEB = 'web',
  IMAGE = 'image',
  VIDEO = 'video',
  NEWS = 'news',
}

export class GSCPerformanceQueryDto {
  @IsString()
  @IsNotEmpty()
  siteUrl: string;

  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @IsDateString()
  @IsNotEmpty()
  endDate: string;

  @IsArray()
  @IsOptional()
  dimensions?: GSCDimension[];

  @IsEnum(GSCSearchType)
  @IsOptional()
  searchType?: GSCSearchType;

  @IsString()
  @IsOptional()
  dimensionFilterGroups?: string;

  @IsOptional()
  rowLimit?: number;
}

export class GSCIndexCoverageDto {
  @IsString()
  @IsNotEmpty()
  siteUrl: string;
}

export class GSCSitemapsDto {
  @IsString()
  @IsNotEmpty()
  siteUrl: string;
}

export class GSCUrlInspectionDto {
  @IsString()
  @IsNotEmpty()
  siteUrl: string;

  @IsString()
  @IsNotEmpty()
  inspectionUrl: string;
}
