import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for subscription limits and features
 */
export class SubscriptionLimitsDto {
  @ApiProperty({ example: 10, description: 'Maximum users allowed' })
  maxUsers: number;

  @ApiProperty({ example: 10, description: 'Maximum projects allowed' })
  maxProjects: number;

  @ApiProperty({ example: 1000, description: 'Maximum keywords allowed' })
  maxKeywords: number;

  @ApiProperty({ example: 1000, description: 'Maximum pages to audit' })
  maxPages: number;

  @ApiProperty({ example: 10000, description: 'Maximum backlinks to track' })
  maxBacklinks: number;

  @ApiProperty({ example: 10, description: 'Maximum competitors to track' })
  maxCompetitors: number;

  @ApiProperty({ example: 100000, description: 'Maximum API calls per month' })
  maxApiCallsPerMonth: number;

  @ApiProperty({ example: true, description: 'White label branding available' })
  hasWhiteLabel: boolean;

  @ApiProperty({ example: true, description: 'API access enabled' })
  hasApiAccess: boolean;

  @ApiProperty({ example: true, description: 'Priority support included' })
  hasPrioritySupport: boolean;

  @ApiProperty({ example: true, description: 'Custom reports available' })
  hasCustomReports: boolean;
}
