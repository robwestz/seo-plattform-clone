import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

/**
 * DTO for Stripe webhook payload
 */
export class StripeWebhookDto {
  @ApiProperty({ description: 'Stripe event type' })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({ description: 'Event data' })
  data: any;
}
