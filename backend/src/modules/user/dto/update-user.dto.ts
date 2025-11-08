import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, MinLength, MaxLength, IsBoolean, IsObject } from 'class-validator';

/**
 * Data Transfer Object for updating a user
 */
export class UpdateUserDto {
  @ApiProperty({ example: 'John', description: 'User first name' })
  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(100)
  firstName?: string;

  @ApiProperty({ example: 'Doe', description: 'User last name' })
  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(100)
  lastName?: string;

  @ApiProperty({ example: '+1234567890', description: 'User phone number' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ example: 'https://example.com/avatar.jpg', description: 'User avatar URL' })
  @IsString()
  @IsOptional()
  avatar?: string;

  @ApiProperty({ example: true, description: 'Whether user is active' })
  @IsBoolean()
  @IsOptional()
  active?: boolean;

  @ApiProperty({ example: { theme: 'dark' }, description: 'User preferences' })
  @IsObject()
  @IsOptional()
  preferences?: Record<string, any>;
}
