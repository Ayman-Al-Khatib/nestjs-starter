import { CanActivate, ExecutionContext, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnvironmentConfig } from 'infrastructure/config';
import { Translator } from 'infrastructure/i18n';

/**
 * Blocks all WhatsApp admin endpoints when the driver is not `baileys`.
 * When running in stub mode there is no real socket — QR, send, status, and
 * logout calls would either fail silently or produce misleading responses.
 * Returning a clear 503 at the guard level prevents that confusion entirely.
 */
@Injectable()
export class WhatsappProviderGuard implements CanActivate {
  private readonly isBaileys: boolean;

  constructor(
    config: ConfigService<EnvironmentConfig>,
    private readonly translator: Translator,
  ) {
    this.isBaileys = config.get('WHATSAPP_DRIVER') === 'baileys';
  }

  canActivate(_ctx: ExecutionContext): boolean {
    if (!this.isBaileys) {
      throw new ServiceUnavailableException(this.translator.tr('whatsapp.errors.stub_mode'));
    }
    return true;
  }
}
