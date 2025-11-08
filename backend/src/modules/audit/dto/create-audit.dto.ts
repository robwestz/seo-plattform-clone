import { IsOptional, IsNumber, Min, Max, IsBoolean } from 'class-validator';

/**
 * DTO for creating an audit
 */
export class CreateAuditDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(1000)
  maxPages?: number = 100;

  @IsOptional()
  @IsBoolean()
  includePageSpeed?: boolean = true;

  @IsOptional()
  @IsBoolean()
  includeStructuredData?: boolean = true;

  @IsOptional()
  @IsBoolean()
  includeAccessibility?: boolean = true;
}
