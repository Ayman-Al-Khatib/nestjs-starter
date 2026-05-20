import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { Translator } from 'infrastructure/i18n';

/**
 * DTO for creating a new city. Both English and Arabic names are required
 * and must be unique across all cities.
 */
export class CreateCityDto {
  @IsString({ message: Translator.trValMsg('common.validation.string.invalid') })
  @IsNotEmpty({ message: Translator.trValMsg('common.validation.string.empty') })
  @MaxLength(128, { message: Translator.trValMsg('common.validation.string.too_long') })
  nameEn: string;

  @IsString({ message: Translator.trValMsg('common.validation.string.invalid') })
  @IsNotEmpty({ message: Translator.trValMsg('common.validation.string.empty') })
  @MaxLength(128, { message: Translator.trValMsg('common.validation.string.too_long') })
  nameAr: string;
}
