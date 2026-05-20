import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { Translator } from 'infrastructure/i18n';

/**
 * DTO for updating an existing city. All fields are optional.
 * If provided, names must be unique across all cities.
 */
export class UpdateCityDto {
  @IsOptional()
  @IsString({ message: Translator.trValMsg('common.validation.string.invalid') })
  @IsNotEmpty({ message: Translator.trValMsg('common.validation.string.empty') })
  @MaxLength(128, { message: Translator.trValMsg('common.validation.string.too_long') })
  nameEn?: string;

  @IsOptional()
  @IsString({ message: Translator.trValMsg('common.validation.string.invalid') })
  @IsNotEmpty({ message: Translator.trValMsg('common.validation.string.empty') })
  @MaxLength(128, { message: Translator.trValMsg('common.validation.string.too_long') })
  nameAr?: string;
}
