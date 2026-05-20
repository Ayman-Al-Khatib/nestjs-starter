# Throttle

Global per-IP rate limiting via `@nestjs/throttler` with three named
throttlers — one default budget plus stricter opt-in budgets for auth
and upload endpoints.

## What lives here

- **`app-throttle.module.ts`** — registers `AppThrottlerGuard` globally
  and configures the three named throttlers via `ConfigService`. The 429
  message is translated per request via `Translator.trStatic`.
- **`app-throttler.guard.ts`** — extends `ThrottlerGuard` to enforce
  exactly one named throttler per request based on decorator metadata.
- **`auth-throttle.decorator.ts`** — `@AuthThrottle()` marker. Stack on
  `@Post('login')`, `@Post('refresh')`, `@Post('otp/verify')`, etc.
- **`upload-throttle.decorator.ts`** — `@UploadThrottle()` marker. Stack
  on file-upload handlers.

## Configuration

All limits come from env. No values are hard-coded in decorators — the
guard reads ConfigService at request time via the named throttler config.

| Variable                       | Notes                                |
| ------------------------------ | ------------------------------------ |
| `THROTTLE_TTL_SECONDS`         | Default sliding-window length        |
| `THROTTLE_LIMIT`               | Default requests per window          |
| `AUTH_THROTTLE_TTL_SECONDS`    | Window length for `@AuthThrottle()`  |
| `AUTH_THROTTLE_LIMIT`          | Budget for `@AuthThrottle()`         |
| `UPLOAD_THROTTLE_TTL_SECONDS`  | Window length for `@UploadThrottle()`|
| `UPLOAD_THROTTLE_LIMIT`        | Budget for `@UploadThrottle()`       |

## Usage

```ts
@AuthThrottle()
@Post('login')
async login(@Body() dto: LoginDto) { /* ... */ }

@UploadThrottle()
@Post('photo')
async uploadPhoto(@UploadedFile() file: MulterFile) { /* ... */ }
```

Routes without either marker fall through to the `default` throttler.

## Why a custom guard

`@nestjs/throttler` applies every named throttler to every route by
default. Without `AppThrottlerGuard`, a normal route would also be
gated by the strict auth budget. The guard reads `AUTH_THROTTLE_METADATA`
/ `UPLOAD_THROTTLE_METADATA` and short-circuits `handleRequest` for the
inactive throttlers, leaving exactly one active per route.

## IP resolution

`@nestjs/throttler` keys the bucket on `request.ip`, which Express
derives from the request's TCP socket **or** the `X-Forwarded-For`
header when `trust proxy` is set.

If `TRUST_PROXY` is wrong, all requests will appear to come from the
proxy's IP and the rate limit collapses into a single bucket. The
setting is applied at bootstrap from
[`bootstrap/configure-trust-proxy.ts`](../../bootstrap/configure-trust-proxy.ts).
Set it to:

- `1` (or however many hops) when behind a single reverse proxy.
- A CIDR list for a known upstream.
- `loopback` for a single localhost proxy in dev.
