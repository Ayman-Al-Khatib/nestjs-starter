import { Type } from 'class-transformer';
import { IsInt, IsString, MaxLength, Min, MinLength } from 'class-validator';
import { SkipIfUndefined } from 'core/decorators/skip-if-undefined.decorator';
import { Translator } from 'infrastructure/i18n';

export class UpdateAreaDto {
  @SkipIfUndefined()
  @Type(() => Number)
  @IsInt({ message: Translator.trValMsg('common.validation.id.integer') })
  @Min(1, { message: Translator.trValMsg('common.validation.id.positive') })
  cityId?: number;

  @SkipIfUndefined()
  @IsString({ message: Translator.trValMsg('common.validation.string.invalid') })
  @MinLength(1, { message: Translator.trValMsg('common.validation.string.too_short') })
  @MaxLength(128, { message: Translator.trValMsg('common.validation.string.too_long') })
  nameEn?: string;

  @SkipIfUndefined()
  @IsString({ message: Translator.trValMsg('common.validation.string.invalid') })
  @MinLength(1, { message: Translator.trValMsg('common.validation.string.too_short') })
  @MaxLength(128, { message: Translator.trValMsg('common.validation.string.too_long') })
  nameAr?: string;
}
