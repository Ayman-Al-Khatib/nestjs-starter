export interface WhatsAppDispatchResult {
  messageId: string;
  dispatchedAt: Date;
}

export interface IWhatsAppNotifier {
  sendOtp(phone: string, code: string): Promise<WhatsAppDispatchResult>;
  sendAppointmentAccepted(
    phone: string,
    doctorName: string,
    appointmentDate: Date,
  ): Promise<WhatsAppDispatchResult>;
  sendAppointmentRejected(
    phone: string,
    doctorName: string,
    appointmentDate: Date,
  ): Promise<WhatsAppDispatchResult>;
  sendAppointmentReview(
    phone: string,
    doctorName: string,
    appointmentDate: Date,
  ): Promise<WhatsAppDispatchResult>;
  sendAppointmentNoShow(
    phone: string,
    doctorName: string,
    appointmentDate: Date,
  ): Promise<WhatsAppDispatchResult>;
  sendAppointmentCancelled(
    phone: string,
    doctorName: string,
    appointmentDate: Date,
  ): Promise<WhatsAppDispatchResult>;
}
