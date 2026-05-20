import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { IsName } from 'core/decorators/is-name.decorator';
import { IsPastDate } from 'core/decorators/is-past-date.decorator';
import { IsUtcIso8601 } from 'core/decorators/is-utc-iso8601.decorator';
import { Gender } from 'domain/enums/gender.enum';
import { Translator } from 'infrastructure/i18n';

export class CompleteUserProfileDto {
  @IsString({ message: Translator.trValMsg('common.validation.string.invalid') })
  @IsNotEmpty({ message: Translator.trValMsg('common.validation.string.empty') })
  @MinLength(1, { message: Translator.trValMsg('common.validation.string.too_short') })
  @MaxLength(100, { message: Translator.trValMsg('common.validation.string.too_long') })
  @IsName()
  firstName: string;

  @IsString({ message: Translator.trValMsg('common.validation.string.invalid') })
  @IsNotEmpty({ message: Translator.trValMsg('common.validation.string.empty') })
  @MinLength(1, { message: Translator.trValMsg('common.validation.string.too_short') })
  @MaxLength(100, { message: Translator.trValMsg('common.validation.string.too_long') })
  @IsName()
  lastName: string;

  @IsEnum(Gender, { message: Translator.trValMsg('common.validation.enum.invalid') })
  gender: Gender;

  @IsUtcIso8601()
  @IsPastDate()
  birthDate: Date;

  @Type(() => Number)
  @IsInt({ message: Translator.trValMsg('common.validation.id.integer') })
  @Min(1, { message: Translator.trValMsg('common.validation.id.positive') })
  cityId: number;

  @IsOptional()
  @IsString({ message: Translator.trValMsg('common.validation.string.invalid') })
  @MaxLength(512, { message: Translator.trValMsg('common.validation.string.too_long') })
  address?: string | null;
}
