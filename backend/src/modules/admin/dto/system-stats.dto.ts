import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for system statistics
 */
export class SystemStatsDto {
  @ApiProperty({ example: 150, description: 'Total number of tenants' })
  totalTenants: number;

  @ApiProperty({ example: 1250, description: 'Total number of users' })
  totalUsers: number;

  @ApiProperty({ example: 450, description: 'Total number of projects' })
  totalProjects: number;

  @ApiProperty({ example: 125000, description: 'Total API calls this month' })
  totalApiCalls: number;

  @ApiProperty({ example: 50000, description: 'Monthly recurring revenue' })
  mrr: number;

  @ApiProperty({ example: 600000, description: 'Annual recurring revenue' })
  arr: number;

  @ApiProperty({ example: 45, description: 'Active subscriptions' })
  activeSubscriptions: number;

  @ApiProperty({ example: 5, description: 'Cancelled subscriptions this month' })
  cancelledSubscriptions: number;

  @ApiProperty({ example: 98.5, description: 'System uptime percentage' })
  uptime: number;

  @ApiProperty({ example: 150, description: 'Average response time in ms' })
  avgResponseTime: number;
}
