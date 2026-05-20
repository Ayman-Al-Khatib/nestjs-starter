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

  async sendAppointmentAccepted(
    phone: string,
    doctorName: string,
    appointmentDate: Date,
  ): Promise<WhatsAppDispatchResult> {
    this.logger.log(
      `[WA-STUB] accepted phone=${phone} doctor=${doctorName} date=${appointmentDate.toISOString()}`,
    );
    return this.dispatchResult();
  }

  async sendAppointmentRejected(
    phone: string,
    doctorName: string,
    appointmentDate: Date,
  ): Promise<WhatsAppDispatchResult> {
    this.logger.log(
      `[WA-STUB] rejected phone=${phone} doctor=${doctorName} date=${appointmentDate.toISOString()}`,
    );
    return this.dispatchResult();
  }

  async sendAppointmentReview(
    phone: string,
    doctorName: string,
    appointmentDate: Date,
  ): Promise<WhatsAppDispatchResult> {
    this.logger.log(
      `[WA-STUB] review phone=${phone} doctor=${doctorName} date=${appointmentDate.toISOString()}`,
    );
    return this.dispatchResult();
  }

  async sendAppointmentNoShow(
    phone: string,
    doctorName: string,
    appointmentDate: Date,
  ): Promise<WhatsAppDispatchResult> {
    this.logger.log(
      `[WA-STUB] no_show phone=${phone} doctor=${doctorName} date=${appointmentDate.toISOString()}`,
    );
    return this.dispatchResult();
  }

  async sendAppointmentCancelled(
    phone: string,
    doctorName: string,
    appointmentDate: Date,
  ): Promise<WhatsAppDispatchResult> {
    this.logger.log(
      `[WA-STUB] cancelled phone=${phone} doctor=${doctorName} date=${appointmentDate.toISOString()}`,
    );
    return this.dispatchResult();
  }

  private dispatchResult(): WhatsAppDispatchResult {
    return { messageId: `stub-${Date.now()}`, dispatchedAt: new Date() };
  }
}
