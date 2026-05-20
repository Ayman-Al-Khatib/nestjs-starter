import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { IsName } from 'core/decorators/is-name.decorator';
import { SyriaPhone } from 'core/decorators/syria-phone.decorator';
import { SkipIfUndefined } from 'core/decorators/skip-if-undefined.decorator';
import { Translator } from 'infrastructure/i18n';

export class UpdateMeDto {
  @SkipIfUndefined()
  @IsString({ message: Translator.trValMsg('common.validation.string.invalid') })
  @MinLength(1, { message: Translator.trValMsg('common.validation.string.too_short') })
  @MaxLength(100, { message: Translator.trValMsg('common.validation.string.too_long') })
  @IsName()
  firstName?: string;

  @SkipIfUndefined()
  @IsString({ message: Translator.trValMsg('common.validation.string.invalid') })
  @MinLength(1, { message: Translator.trValMsg('common.validation.string.too_short') })
  @MaxLength(100, { message: Translator.trValMsg('common.validation.string.too_long') })
  @IsName()
  lastName?: string;

  @IsOptional()
  @SyriaPhone({ formatToInternational: true })
  phone?: string | null;

  @SkipIfUndefined()
  @IsString({ message: Translator.trValMsg('common.validation.string.invalid') })
  @MinLength(3, { message: Translator.trValMsg('common.validation.string.too_short') })
  @MaxLength(64, { message: Translator.trValMsg('common.validation.string.too_long') })
  username?: string;

  @SkipIfUndefined()
  @IsString({ message: Translator.trValMsg('common.validation.string.invalid') })
  @MinLength(8, { message: Translator.trValMsg('common.validation.string.too_short') })
  @MaxLength(128, { message: Translator.trValMsg('common.validation.string.too_long') })
  password?: string;

  // Required only when the request changes username or password.
  @ValidateIf((o: UpdateMeDto) => o.username !== undefined || o.password !== undefined)
  @IsString({ message: Translator.trValMsg('admin.errors.current_password_required') })
  @IsNotEmpty({ message: Translator.trValMsg('admin.errors.current_password_required') })
  currentPassword?: string;
}
