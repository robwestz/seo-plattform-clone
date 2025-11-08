import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

/**
 * DTO for creating a payment method
 */
export class CreatePaymentMethodDto {
  @ApiProperty({
    example: 'pm_1234567890',
    description: 'Stripe payment method ID',
  })
  @IsString()
  @IsNotEmpty()
  stripePaymentMethodId: string;

  @ApiProperty({
    example: true,
    description: 'Set as default payment method',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
