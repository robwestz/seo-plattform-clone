import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { SubscriptionPlan, BillingInterval } from '../entities/subscription.entity';

/**
 * DTO for creating a subscription
 */
export class CreateSubscriptionDto {
  @ApiProperty({
    enum: SubscriptionPlan,
    example: SubscriptionPlan.PRO,
    description: 'Subscription plan',
  })
  @IsEnum(SubscriptionPlan)
  plan: SubscriptionPlan;

  @ApiProperty({
    enum: BillingInterval,
    example: BillingInterval.MONTHLY,
    description: 'Billing interval',
  })
  @IsEnum(BillingInterval)
  billingInterval: BillingInterval;

  @ApiProperty({
    example: 'cus_123456789',
    description: 'Stripe customer ID',
    required: false,
  })
  @IsOptional()
  stripeCustomerId?: string;
}
