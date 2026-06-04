import { IsNotEmpty, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { SyriaPhone } from 'core/decorators/syria-phone.decorator';
import { Translator } from 'infrastructure/i18n';

export class PhoneOtpVerifyDto {
  @IsString({ message: Translator.trValMsg('common.validation.string.invalid') })
  @IsNotEmpty({ message: Translator.trValMsg('common.validation.string.empty') })
  @SyriaPhone({ formatToInternational: true })
  phone: string;

  @IsString({ message: Translator.trValMsg('common.validation.string.invalid') })
  @IsNotEmpty({ message: Translator.trValMsg('common.validation.string.empty') })
  @MinLength(4, { message: Translator.trValMsg('common.validation.string.too_short') })
  @MaxLength(10, { message: Translator.trValMsg('common.validation.string.too_long') })
  @Matches(/^\d+$/, { message: Translator.trValMsg('otp.errors.invalid_code') })
  code: string;
}
