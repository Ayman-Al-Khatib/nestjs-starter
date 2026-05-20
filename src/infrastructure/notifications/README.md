# Push Notifications

Driver-agnostic push API. Feature code injects `PushNotificationService`
and never touches the Firebase SDK directly.

## Layers

```
PushNotificationService (facade)
        │
        ▼
INotificationProvider  ──►  FirebaseNotificationProvider
                                     │
                                     ▼
                              FirebaseAdminProvider
                              (initializes admin.app.App from JSON creds)
```

- **`push-notification.service.ts`** — public API.
- **`providers/firebase/`** — concrete Firebase implementation; the only
  file that imports `firebase-admin`.
- **`providers/abstract-notification.provider.ts`** — option validation
  shared by any future driver.
- **`interfaces/`** — `INotificationProvider` contract + option types.
- **`constants/notification.tokens.ts`** — DI tokens (`NOTIFICATION_PROVIDER`,
  `FIREBASE_ADMIN`).

The module is `@Global()` — import it once in `AppModule` and inject
`PushNotificationService` anywhere.

## Configuration

| Variable                                | Notes                                                            |
| --------------------------------------- | ---------------------------------------------------------------- |
| `NOTIFICATIONS_FIREBASE_SERVICE_ACCOUNT`| Firebase service-account JSON. Inline JSON or a path to the file |

## Usage

```ts
constructor(private readonly push: PushNotificationService) {}

// Single device
await this.push.sendToToken({
  token: fcmToken,
  title: 'Appointment confirmed',
  body: 'Your visit is on Sunday at 10:00.',
  data: { appointmentId: '42' },
});

// Many devices (multicast, batched in groups of 500)
const { successCount, failureCount, failures } = await this.push.sendToTokens({
  tokens: doctorDeviceTokens,
  title: 'New booking',
  body: 'Mona just booked a 09:30 slot.',
});

// Broadcast by topic
await this.push.sendToTopic({
  topic: 'announcements',
  title: 'Clinic closed Friday',
  body: 'See you Saturday.',
});

await this.push.subscribeToTopic(tokens, 'announcements');
await this.push.unsubscribeFromTopic(tokens, 'announcements');
```

### Options

All payloads share `BaseNotificationOptions`:

| Field           | Notes                                                            |
| --------------- | ---------------------------------------------------------------- |
| `title`, `body` | Notification surface text                                        |
| `data`          | Flat `Record<string, string>` — Firebase forbids nested data     |
| `sound`         | Defaults to `'default'`                                          |
| `priority`      | `'normal'` (default) or `'high'`                                 |
| `ttlInSeconds`  | Android only; converted to ms internally                         |
| `clickAction`   | Android `notification.click_action`                              |

`sendToTokens` returns a `BatchResponse` with per-index `failures` so the
caller can clean up dead tokens (e.g. delete rows with code
`messaging/registration-token-not-registered`).

## Adding a new driver (APNs direct, OneSignal, …)

1. Implement `INotificationProvider` (`sendToToken`, `sendToTokens`,
   `sendToTopic`, `subscribeToTopic`, `unsubscribeFromTopic`).
2. Bind it to the `NOTIFICATION_PROVIDER` token in
   [push-notification.module.ts](push-notification.module.ts) (factory
   that selects driver by env, mirroring the WhatsApp module).
3. Add any new env vars to
   [../config/schemas/notifications.schema.ts](../config/schemas/notifications.schema.ts).

The service layer never changes.
