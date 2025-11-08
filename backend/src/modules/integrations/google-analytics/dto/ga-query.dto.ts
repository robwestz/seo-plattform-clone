import { IsString, IsNotEmpty, IsOptional, IsDateString, IsArray } from 'class-validator';

export class GAQueryDto {
  @IsString()
  @IsNotEmpty()
  propertyId: string;

  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @IsDateString()
  @IsNotEmpty()
  endDate: string;

  @IsArray()
  @IsOptional()
  dimensions?: string[];

  @IsArray()
  @IsOptional()
  metrics?: string[];

  @IsOptional()
  limit?: number;
}

export class GARealTimeDto {
  @IsString()
  @IsNotEmpty()
  propertyId: string;

  @IsArray()
  @IsOptional()
  dimensions?: string[];

  @IsArray()
  @IsOptional()
  metrics?: string[];
}

export class GAPropertyDto {
  @IsString()
  @IsNotEmpty()
  propertyId: string;
}
