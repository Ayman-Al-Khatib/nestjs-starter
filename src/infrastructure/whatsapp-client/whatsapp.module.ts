import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WhatsappModule } from 'modules/whatsapp/whatsapp.module';
import { WHATSAPP_NOTIFIER } from './constants/whatsapp.token';
import { BaileysWhatsAppNotifier } from './providers/baileys-whatsapp.notifier';
import { StubWhatsAppNotifier } from './providers/stub-whatsapp.notifier';

@Global()
@Module({
  imports: [WhatsappModule],
  providers: [
    BaileysWhatsAppNotifier,
    StubWhatsAppNotifier,
    {
      provide: WHATSAPP_NOTIFIER,
      inject: [ConfigService, BaileysWhatsAppNotifier, StubWhatsAppNotifier],
      useFactory: (
        config: ConfigService,
        baileys: BaileysWhatsAppNotifier,
        stub: StubWhatsAppNotifier,
      ) => (config.get('WHATSAPP_DRIVER') === 'baileys' ? baileys : stub),
    },
  ],
  exports: [WHATSAPP_NOTIFIER],
})
export class WhatsAppModule {}
