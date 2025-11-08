import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for revenue analytics response
 */
export class RevenueAnalyticsDto {
  @ApiProperty({ example: 50000, description: 'Monthly recurring revenue' })
  mrr: number;

  @ApiProperty({ example: 600000, description: 'Annual recurring revenue' })
  arr: number;

  @ApiProperty({ example: 15.5, description: 'MRR growth rate percentage' })
  mrrGrowthRate: number;

  @ApiProperty({ example: 125000, description: 'Total revenue in period' })
  totalRevenue: number;

  @ApiProperty({ example: 45, description: 'New subscriptions' })
  newSubscriptions: number;

  @ApiProperty({ example: 5, description: 'Cancelled subscriptions' })
  cancelledSubscriptions: number;

  @ApiProperty({ example: 2.5, description: 'Churn rate percentage' })
  churnRate: number;

  @ApiProperty({ example: 250, description: 'Average revenue per user' })
  arpu: number;

  @ApiProperty({ example: 5000, description: 'Lifetime value' })
  ltv: number;

  @ApiProperty({ example: {}, description: 'Revenue breakdown by plan' })
  revenueByPlan: Record<string, number>;

  @ApiProperty({ example: [], description: 'Revenue time series' })
  timeSeries: Array<{ date: string; revenue: number; subscriptions: number }>;
}
