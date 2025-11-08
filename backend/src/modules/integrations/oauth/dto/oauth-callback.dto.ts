import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class OAuthCallbackDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsNotEmpty()
  state: string;

  @IsString()
  @IsOptional()
  error?: string;

  @IsString()
  @IsOptional()
  error_description?: string;
}

export class OAuthInitiateDto {
  @IsString()
  @IsNotEmpty()
  provider: string;

  @IsString()
  @IsOptional()
  redirectUri?: string;
}

export class OAuthDisconnectDto {
  @IsString()
  @IsNotEmpty()
  provider: string;
}
