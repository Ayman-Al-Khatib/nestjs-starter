export interface WhatsAppDispatchResult {
  messageId: string;
  dispatchedAt: Date;
}

export interface IWhatsAppNotifier {
  sendOtp(phone: string, code: string): Promise<WhatsAppDispatchResult>;
}
