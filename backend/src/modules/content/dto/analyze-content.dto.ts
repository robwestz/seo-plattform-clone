import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

/**
 * DTO for analyzing content
 */
export class AnalyzeContentDto {
  @IsString()
  @IsNotEmpty()
  url: string;

  @IsOptional()
  @IsString()
  targetKeyword?: string;
}
