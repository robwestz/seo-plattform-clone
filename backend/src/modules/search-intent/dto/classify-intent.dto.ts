import { IsString, IsOptional, IsNumber, IsArray, IsEnum, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IntentType } from '../entities/intent-classification.entity';

export class ClassifyIntentDto {
  @ApiProperty({
    description: 'Keyword to classify',
    example: 'best seo tools',
  })
  @IsString()
  keyword: string;

  @ApiProperty({
    description: 'Search volume for the keyword',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  searchVolume?: number;

  @ApiProperty({
    description: 'SERP signals for enhanced classification',
    required: false,
  })
  @IsOptional()
  serpSignals?: any;

  @ApiProperty({
    description: 'Use cached classification if available',
    required: false,
    default: true,
  })
  @IsOptional()
  useCache?: boolean;
}

export class ClassifyBatchDto {
  @ApiProperty({
    description: 'Array of keywords with metadata',
    type: [ClassifyIntentDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ClassifyIntentDto)
  keywords: ClassifyIntentDto[];
}

export class TrainModelDto {
  @ApiProperty({
    description: 'Training data with labeled intents',
    example: [
      { keyword: 'how to do seo', intent: 'informational' },
      { keyword: 'buy seo tools', intent: 'transactional' },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  trainingData: Array<{
    keyword: string;
    intent: IntentType;
  }>;
}

export class VerifyClassificationDto {
  @ApiProperty({
    description: 'Correct intent for the keyword',
    enum: IntentType,
  })
  @IsEnum(IntentType)
  correctIntent: IntentType;

  @ApiProperty({
    description: 'User ID who verified the classification',
  })
  @IsString()
  verifiedBy: string;
}
