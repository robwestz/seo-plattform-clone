import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { SubscriptionPlan, BillingInterval } from '../entities/subscription.entity';

/**
 * DTO for updating a subscription
 */
export class UpdateSubscriptionDto {
  @ApiProperty({
    enum: SubscriptionPlan,
    example: SubscriptionPlan.BUSINESS,
    description: 'New subscription plan',
    required: false,
  })
  @IsOptional()
  @IsEnum(SubscriptionPlan)
  plan?: SubscriptionPlan;

  @ApiProperty({
    enum: BillingInterval,
    example: BillingInterval.YEARLY,
    description: 'New billing interval',
    required: false,
  })
  @IsOptional()
  @IsEnum(BillingInterval)
  billingInterval?: BillingInterval;
}
