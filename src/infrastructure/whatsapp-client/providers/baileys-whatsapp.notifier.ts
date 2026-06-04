import { Injectable } from '@nestjs/common';
import { WhatsappQueueService } from 'modules/whatsapp/services/whatsapp-queue.service';
import {
  IWhatsAppNotifier,
  WhatsAppDispatchResult,
} from '../interfaces/whatsapp-notifier.interface';

@Injectable()
export class BaileysWhatsAppNotifier implements IWhatsAppNotifier {
  constructor(private readonly queue: WhatsappQueueService) {}

  async sendOtp(phone: string, code: string): Promise<WhatsAppDispatchResult> {
    const message = `رمز التحقق: *${code}*

هذا الرمز صالح لمرة واحدة فقط ولمدة قصيرة.

لأمان حسابك، لا تشاركه مع أي شخص. وإن لم تطلبه، تجاهل هذه الرسالة.`;
    return this.dispatch(phone, message);
  }

  private dispatch(phone: string, message: string): WhatsAppDispatchResult {
    const result = this.queue.enqueueText(phone, message);
    return { messageId: result.queueId, dispatchedAt: result.enqueuedAt };
  }
}
