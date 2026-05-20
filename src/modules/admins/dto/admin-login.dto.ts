import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { Translator } from 'infrastructure/i18n';

export class AdminLoginDto {
  @IsString({ message: Translator.trValMsg('common.validation.string.invalid') })
  @IsNotEmpty({ message: Translator.trValMsg('common.validation.string.empty') })
  @MinLength(3, { message: Translator.trValMsg('common.validation.string.too_short') })
  @MaxLength(64, { message: Translator.trValMsg('common.validation.string.too_long') })
  username: string;

  @IsString({ message: Translator.trValMsg('common.validation.string.invalid') })
  @IsNotEmpty({ message: Translator.trValMsg('common.validation.string.empty') })
  @MinLength(8, { message: Translator.trValMsg('common.validation.string.too_short') })
  @MaxLength(128, { message: Translator.trValMsg('common.validation.string.too_long') })
  password: string;
}
