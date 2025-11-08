import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUrl,
  IsArray,
  IsEnum,
  IsNumber,
  IsBoolean,
  IsObject,
} from 'class-validator';
import { WebhookEvent } from '../entities/webhook.entity';

export class CreateWebhookDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsUrl()
  @IsNotEmpty()
  url: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsEnum(WebhookEvent, { each: true })
  events: WebhookEvent[];

  @IsString()
  @IsOptional()
  projectId?: string;

  @IsString()
  @IsOptional()
  secret?: string;

  @IsObject()
  @IsOptional()
  headers?: Record<string, string>;

  @IsNumber()
  @IsOptional()
  maxRetries?: number;

  @IsNumber()
  @IsOptional()
  timeout?: number;
}

export class UpdateWebhookDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsUrl()
  @IsOptional()
  url?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsEnum(WebhookEvent, { each: true })
  @IsOptional()
  events?: WebhookEvent[];

  @IsBoolean()
  @IsOptional()
  active?: boolean;

  @IsString()
  @IsOptional()
  secret?: string;

  @IsObject()
  @IsOptional()
  headers?: Record<string, string>;

  @IsNumber()
  @IsOptional()
  maxRetries?: number;

  @IsNumber()
  @IsOptional()
  timeout?: number;
}

export class TriggerWebhookDto {
  @IsEnum(WebhookEvent)
  event: WebhookEvent;

  @IsObject()
  payload: Record<string, any>;

  @IsString()
  @IsOptional()
  projectId?: string;
}
