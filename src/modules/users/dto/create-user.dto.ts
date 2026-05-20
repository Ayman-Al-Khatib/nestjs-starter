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
import { SyriaPhone } from 'core/decorators/syria-phone.decorator';
import { Gender } from 'domain/enums/gender.enum';
import { Translator } from 'infrastructure/i18n';

/**
 * Admin-initiated user creation. Bypasses the OTP flow that user
 * self-serve onboarding goes through, so every profile field is
 * required up-front — the resulting row is created with
 * `isProfileCompleted = true`.
 */
export class CreateUserDto {
  @IsString({ message: Translator.trValMsg('common.validation.string.invalid') })
  @IsNotEmpty({ message: Translator.trValMsg('common.validation.string.empty') })
  @SyriaPhone({ formatToInternational: true })
  phone: string;

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
