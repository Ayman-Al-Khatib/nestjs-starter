# WhatsApp Client

Outbound WhatsApp messaging — OTPs and appointment lifecycle updates.
Feature code injects the `WHATSAPP_NOTIFIER` token and never touches
Baileys directly.

## Layers

```
Feature code (OtpService, AppointmentNotificationService)
        │   IWhatsAppNotifier
        ▼
WHATSAPP_NOTIFIER  ──►  BaileysWhatsAppNotifier  ──►  WhatsappQueueService
                  │                                  (jittered FIFO, 3–8s spacing)
                  └──►  StubWhatsAppNotifier       (dev / no-WhatsApp builds)
```

- **`interfaces/whatsapp-notifier.interface.ts`** — `IWhatsAppNotifier`
  contract: `sendOtp`, `sendAppointment{Accepted,Rejected,Review,NoShow,Cancelled}`.
- **`providers/baileys-whatsapp.notifier.ts`** — real driver. Owns the
  Arabic message copy; enqueues into `WhatsappQueueService`.
- **`providers/stub-whatsapp.notifier.ts`** — logs and returns success;
  no socket required.
- **`constants/whatsapp.token.ts`** — `WHATSAPP_NOTIFIER` DI token.
- **`whatsapp.module.ts`** — `@Global()`. Selects driver by env.

> The Baileys **socket + queue worker + QR pairing controller** live in
> the feature module [`src/modules/whatsapp/`](../../modules/whatsapp/),
> because they own state (auth files, connection lifecycle, admin
> endpoints). This `infrastructure/` layer is the thin notifier facade.

## Configuration

| Variable                       | Notes                                                          |
| ------------------------------ | -------------------------------------------------------------- |
| `WHATSAPP_DRIVER`              | `baileys` (real) or anything else (stub). Default: stub        |
| `WHATSAPP_QUEUE_MIN_DELAY_MS`  | Lower bound of inter-message jitter                            |
| `WHATSAPP_QUEUE_MAX_DELAY_MS`  | Upper bound of inter-message jitter                            |
| `WHATSAPP_QUEUE_MAX_SIZE`      | Hard cap before `ServiceUnavailableException` on enqueue       |

## Usage

```ts
constructor(@Inject(WHATSAPP_NOTIFIER) private readonly whatsapp: IWhatsAppNotifier) {}

await this.whatsapp.sendOtp(phone, code);
await this.whatsapp.sendAppointmentAccepted(phone, doctorName, appointmentDate);
```

Each call returns `{ messageId, dispatchedAt }` — `messageId` is the
queue ID, not a WhatsApp ack. Failures inside the worker are logged and
skipped (no retries); see the service block comment in
[whatsapp-queue.service.ts](../../modules/whatsapp/services/whatsapp-queue.service.ts)
for the rationale.

## Why the queue + jitter

Burst sending gets a WhatsApp number banned. The queue:

- Sends the first message in an idle queue immediately.
- Sleeps a random 3–8s **between** sends (jitter per message — fixed
  cadences look bot-like).
- Honors `lastSentAt` across worker idle/wake cycles so two enqueues
  100ms apart can never skip the spacing rule.
- Pre-checks socket connectivity at enqueue, so callers can surface a
  soft "contact support" warning instead of queueing into the void.

## Pairing a number

The Baileys socket runs inside [`modules/whatsapp/`](../../modules/whatsapp/),
which exposes admin endpoints to fetch the QR code and read connection
status. State is persisted to disk between restarts.

## Swapping the driver (Cloud API, MessageBird, Twilio, …)

1. Implement `IWhatsAppNotifier`.
2. Add a value to `WHATSAPP_DRIVER` in
   [../config/schemas/whatsapp.schema.ts](../config/schemas/whatsapp.schema.ts).
3. Route to the new provider inside the `WHATSAPP_NOTIFIER` factory in
   [whatsapp.module.ts](whatsapp.module.ts).

The interface keeps the message catalogue (OTP + appointment events)
stable so feature code is untouched.
