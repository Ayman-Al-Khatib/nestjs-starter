import { IsNotEmpty, IsString } from 'class-validator';
import { SyriaPhone } from 'core/decorators/syria-phone.decorator';
import { Translator } from 'infrastructure/i18n';

export class PhoneOtpRequestDto {
  @IsString({ message: Translator.trValMsg('common.validation.string.invalid') })
  @IsNotEmpty({ message: Translator.trValMsg('common.validation.string.empty') })
  @SyriaPhone({ formatToInternational: true })
  phone: string;
}
