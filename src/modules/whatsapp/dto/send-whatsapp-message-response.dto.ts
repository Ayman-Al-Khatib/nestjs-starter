/**
 * Response of `POST /v1/whatsapp/send`. The message is enqueued for paced
 * delivery (random 3–8s gap between sends) rather than dispatched inline,
 * so `messageId` is the queue handle — not the eventual WhatsApp message id.
 */
export class SendWhatsappMessageResponseDto {
  /** Queue handle for the enqueued message (not the WhatsApp message id). */
  queueId: string;
  /** Number of messages ahead of this one in the queue at enqueue time (1 = next to be sent). */
  queuePosition: number;
  /** ISO timestamp at which the server accepted the message into the queue. */
  enqueuedAt: string;
}
