/** Response of `GET /v1/whatsapp/qr`. */
export class WhatsappQrResponseDto {
  /** Data-URL PNG (`data:image/png;base64,...`) ready to render in an `<img>`. */
  qr: string;
}
