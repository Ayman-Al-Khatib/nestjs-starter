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
- **`providers/disabled-notification.provider.ts`** — null-object notifier
  bound when no service account is configured; keeps boot working and fails
  loudly only on an actual send.
- **`interfaces/`** — `INotificationProvider` contract + option types.
- **`constants/notification.tokens.ts`** — DI tokens (`NOTIFICATION_PROVIDER`,
  `FIREBASE_ADMIN`).

The module is `@Global()` and is already wired into `AppModule` — inject
`PushNotificationService` anywhere. It is **safe by default**: when
`NOTIFICATIONS_FIREBASE_SERVICE_ACCOUNT` is unset or not valid JSON, the app
still boots and the disabled notifier is bound instead. Supply a valid
service-account JSON to activate Firebase.

## Configuration

| Variable                                | Notes                                                            |
| --------------------------------------- | ---------------------------------------------------------------- |
| `NOTIFICATIONS_FIREBASE_SERVICE_ACCOUNT`| Firebase service-account JSON (inline or a path). Optional — when absent or unparseable, push is disabled and any send rejects with a 503. The message is not translated: push errors are third-party and handled at the call site, never returned verbatim to the client. |

## Usage

```ts
constructor(private readonly push: PushNotificationService) {}

// Single device
await this.push.sendToToken({
  token: fcmToken,
  title: 'Welcome',
  body: 'Your account is ready.',
  data: { userId: '42' },
});

// Many devices (multicast, batched in groups of 500)
const { successCount, failureCount, failures } = await this.push.sendToTokens({
  tokens: deviceTokens,
  title: 'New update available',
  body: 'Tap to learn more.',
});

// Broadcast by topic
await this.push.sendToTopic({
  topic: 'announcements',
  title: 'Scheduled maintenance',
  body: 'The service will be briefly unavailable on Friday.',
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
