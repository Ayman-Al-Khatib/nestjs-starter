import { Module } from '@nestjs/common';
import { WhatsappController } from './controllers/whatsapp.controller';
import { WhatsappProviderGuard } from './guards/whatsapp-provider.guard';
import { WhatsappAuthService } from './services/whatsapp-auth.service';
import { WhatsappQueueService } from './services/whatsapp-queue.service';
import { WhatsappService } from './services/whatsapp.service';

@Module({
  controllers: [WhatsappController],
  providers: [WhatsappAuthService, WhatsappService, WhatsappQueueService, WhatsappProviderGuard],
  exports: [WhatsappService, WhatsappQueueService],
})
export class WhatsappModule {}
