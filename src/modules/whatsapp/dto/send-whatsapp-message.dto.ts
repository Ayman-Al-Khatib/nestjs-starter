import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { SyriaPhone } from 'core/decorators/syria-phone.decorator';
import { Translator } from 'infrastructure/i18n';

/** Body of `POST /v1/whatsapp/send` — admin-issued ad-hoc message. */
export class SendWhatsappMessageDto {
  @IsString({ message: Translator.trValMsg('common.validation.string.invalid') })
  @IsNotEmpty({ message: Translator.trValMsg('common.validation.string.empty') })
  @SyriaPhone({ formatToInternational: true })
  phone: string;

  @IsString({ message: Translator.trValMsg('common.validation.string.invalid') })
  @IsNotEmpty({ message: Translator.trValMsg('common.validation.string.empty') })
  @MaxLength(4096, { message: Translator.trValMsg('common.validation.string.too_long') })
  text: string;
}
