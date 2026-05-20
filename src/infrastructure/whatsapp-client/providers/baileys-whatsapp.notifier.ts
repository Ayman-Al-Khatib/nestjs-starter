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
    const message = `Eldar Dental | نظام الأمان

تم طلب رمز تحقق لتسجيل الدخول إلى حسابك.

رمز التحقق: *${code}*

هذا الرمز صالح لمرة واحدة فقط ولمدة قصيرة.

لأمان حسابك، لا تقم بمشاركته مع أي شخص.

في حال لم تقم بهذا الطلب، يمكنك تجاهل الرسالة.`;
    return this.dispatch(phone, message);
  }

  async sendAppointmentAccepted(
    phone: string,
    doctorName: string,
    appointmentDate: Date,
  ): Promise<WhatsAppDispatchResult> {
    const dateStr = this.formatDate(appointmentDate);
    const message = `Eldar Dental | تأكيد الموعد

تم تأكيد موعدك مع *${doctorName}* بتاريخ *${dateStr}*.

نتطلع لرؤيتك في الموعد المحدد.

شكراً لثقتك بنا 💙`;
    return this.dispatch(phone, message);
  }

  async sendAppointmentRejected(
    phone: string,
    doctorName: string,
    appointmentDate: Date,
  ): Promise<WhatsAppDispatchResult> {
    const dateStr = this.formatDate(appointmentDate);
    const message = `Eldar Dental | اعتذار عن الموعد

نأسف لإبلاغك بأنه تعذّر تأكيد موعدك مع *${doctorName}* بتاريخ *${dateStr}*.

يمكنك حجز موعد جديد في وقت يناسبك من خلال التطبيق.

شكراً لتفهمك 💙`;
    return this.dispatch(phone, message);
  }

  async sendAppointmentReview(
    phone: string,
    doctorName: string,
    appointmentDate: Date,
  ): Promise<WhatsAppDispatchResult> {
    const dateStr = this.formatDate(appointmentDate);
    const message = `Eldar Dental | تقييم الزيارة

نشكرك على زيارتك بتاريخ *${dateStr}*.

نأمل أن تكون تجربتك مع *${doctorName}* كانت مميزة.

يمكنك تقييم الطبيب من خلال قسم *البروفايل الخاص بك* في التطبيق.

شكراً لثقتك بنا 💙`;
    return this.dispatch(phone, message);
  }

  async sendAppointmentNoShow(
    phone: string,
    doctorName: string,
    appointmentDate: Date,
  ): Promise<WhatsAppDispatchResult> {
    const dateStr = this.formatDate(appointmentDate);
    const message = `Eldar Dental | فاتك الموعد

لاحظنا عدم حضورك لموعدك مع *${doctorName}* بتاريخ *${dateStr}*.

في حال رغبت بإعادة الحجز، يمكنك ذلك من خلال التطبيق.

نتمنى لك دوام الصحة 💙`;
    return this.dispatch(phone, message);
  }

  async sendAppointmentCancelled(
    phone: string,
    doctorName: string,
    appointmentDate: Date,
  ): Promise<WhatsAppDispatchResult> {
    const dateStr = this.formatDate(appointmentDate);
    const message = `Eldar Dental | إلغاء الموعد

تم إلغاء موعدك مع *${doctorName}* بتاريخ *${dateStr}*.

يمكنك حجز موعد جديد في أي وقت من خلال التطبيق.

شكراً 💙`;
    return this.dispatch(phone, message);
  }

  private dispatch(phone: string, message: string): WhatsAppDispatchResult {
    const result = this.queue.enqueueText(phone, message);
    return { messageId: result.queueId, dispatchedAt: result.enqueuedAt };
  }

  private formatDate(date: Date): string {
    return date.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
}
