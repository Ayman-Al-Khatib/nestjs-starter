import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsString, MaxLength, Min } from 'class-validator';
import { Translator } from 'infrastructure/i18n';

export class CreateAreaDto {
  @Type(() => Number)
  @IsInt({ message: Translator.trValMsg('common.validation.id.integer') })
  @Min(1, { message: Translator.trValMsg('common.validation.id.positive') })
  cityId: number;

  @IsString({ message: Translator.trValMsg('common.validation.string.invalid') })
  @IsNotEmpty({ message: Translator.trValMsg('common.validation.string.empty') })
  @MaxLength(128, { message: Translator.trValMsg('common.validation.string.too_long') })
  nameEn: string;

  @IsString({ message: Translator.trValMsg('common.validation.string.invalid') })
  @IsNotEmpty({ message: Translator.trValMsg('common.validation.string.empty') })
  @MaxLength(128, { message: Translator.trValMsg('common.validation.string.too_long') })
  nameAr: string;
}
