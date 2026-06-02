import { Injectable, Logger } from '@nestjs/common';
import {
  IWhatsAppNotifier,
  WhatsAppDispatchResult,
} from '../interfaces/whatsapp-notifier.interface';

@Injectable()
export class StubWhatsAppNotifier implements IWhatsAppNotifier {
  private readonly logger = new Logger(StubWhatsAppNotifier.name);

  async sendOtp(phone: string, code: string): Promise<WhatsAppDispatchResult> {
    this.logger.log(`[WA-STUB] otp phone=${phone} code=${code}`);
    return this.dispatchResult();
  }

  private dispatchResult(): WhatsAppDispatchResult {
    return { messageId: `stub-${Date.now()}`, dispatchedAt: new Date() };
  }
}
