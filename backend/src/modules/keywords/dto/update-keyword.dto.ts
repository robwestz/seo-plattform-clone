import { PartialType } from '@nestjs/mapped-types';
import { CreateKeywordDto } from './create-keyword.dto';

/**
 * DTO for updating a keyword
 * All fields are optional
 */
export class UpdateKeywordDto extends PartialType(CreateKeywordDto) {}
