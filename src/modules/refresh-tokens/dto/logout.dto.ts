import { IsNotEmpty, IsString } from 'class-validator';
import { Translator } from 'infrastructure/i18n';

export class LogoutDto {
  @IsString({ message: Translator.trValMsg('common.validation.string.invalid') })
  @IsNotEmpty({ message: Translator.trValMsg('common.validation.string.empty') })
  refreshToken: string;
}
