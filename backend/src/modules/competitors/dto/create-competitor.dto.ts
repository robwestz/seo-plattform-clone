import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

/**
 * DTO for creating a competitor
 */
export class CreateCompetitorDto {
  @IsString()
  @IsNotEmpty()
  domain: string;

  @IsOptional()
  @IsString()
  name?: string;
}
