import { IsString, IsNotEmpty, IsOptional, IsArray, IsNumber } from 'class-validator';

export class KeywordIdeasDto {
  @IsString()
  @IsNotEmpty()
  customerId: string;

  @IsArray()
  @IsOptional()
  keywords?: string[];

  @IsString()
  @IsOptional()
  url?: string;

  @IsString()
  @IsNotEmpty()
  languageCode: string;

  @IsArray()
  @IsNotEmpty()
  locationIds: string[];

  @IsNumber()
  @IsOptional()
  pageSize?: number;
}

export class SearchVolumeDto {
  @IsString()
  @IsNotEmpty()
  customerId: string;

  @IsArray()
  @IsNotEmpty()
  keywords: string[];

  @IsString()
  @IsNotEmpty()
  languageCode: string;

  @IsArray()
  @IsNotEmpty()
  locationIds: string[];
}

export class HistoricalMetricsDto {
  @IsString()
  @IsNotEmpty()
  customerId: string;

  @IsArray()
  @IsNotEmpty()
  keywords: string[];
}
