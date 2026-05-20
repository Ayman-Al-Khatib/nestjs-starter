/** Response of `GET /v1/whatsapp/status`. */
export class WhatsappStatusResponseDto {
  /** True when the underlying Baileys socket reports `connection: 'open'`. */
  connected: boolean;
  /** True when a paired session exists on disk (re-attach without QR is possible). */
  paired: boolean;
}
