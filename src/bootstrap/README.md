# Bootstrap

Everything that happens between `NestFactory.create` and `app.listen`.
Each function does one thing and is called from `main.ts` in order.

## Pipeline

```
main.ts
  process.env.TZ = 'UTC'              ← must run before any other import
  NestFactory.create<NestExpressApplication>(AppModule)
        │
        ▼
  enableClassValidatorDI(app)         ← class-validator can inject Nest providers
  configureTrustProxy(app, config)    ← Express trust-proxy from TRUST_PROXY env
  configureBodyLimits(app, config)    ← JSON / urlencoded body size cap
  configureSecurity(app, config)      ← helmet, compression, CORS
  configureRouting(app)               ← /api prefix + URI versioning
  app.enableShutdownHooks()
  app.listen(APP_PORT)
```

## Functions

### `enableClassValidatorDI(app)`
Wires `class-validator` to Nest's IoC so custom validators with
`@Injectable()` deps work. Required by validators that inject
repositories.

### `configureTrustProxy(app, config)`
Applies the value from `TRUST_PROXY` to Express. Critical for
correct client-IP resolution behind a reverse proxy — the rate
limiter, signed-URL guards, and access logs all read `request.ip`.
See [`infrastructure/throttle/`](../infrastructure/throttle/README.md#ip-resolution).

### `configureBodyLimits(app, config)`
Caps JSON + urlencoded body sizes at `BODY_LIMIT` (e.g. `1mb`).
File uploads bypass this — Multer enforces its own limit per upload
route (see [`infrastructure/storage/`](../infrastructure/storage/README.md)).

### `configureSecurity(app, config)`
- **helmet** — sane HTTP security headers + 180-day HSTS,
  `referrerPolicy: no-referrer`, `cross-origin-resource-policy: cross-origin`
  so the storage endpoints can be embedded.
- **compression** — gzip for responses.
- **CORS** — origin allowlist from `CORS_ORIGINS` (comma-separated).
  `*` is honoured only if explicitly listed; never use `*` in production.

### `configureRouting(app)`
- Sets the global `/api` prefix.
- Excludes `/` (health) and the local-storage stream route
  (`LOCAL_STORAGE_ROUTE/*`) so signed file URLs don't need `/api/v1/...`.
- Enables URI versioning — every controller declares `version: '1'`.

## Why TZ is set at the top of `main.ts`

```ts
process.env.TZ = 'UTC';
```

Runs **before any other import** so no module captures a local TZ.
Affects `Date.toString()`, `getHours()`, `Intl`, etc. Without it,
timezone arithmetic inside the app silently depends on the host's
locale.

## Adding a new bootstrap step

1. Add a `configure-<thing>.ts` with a single function:
   `export function configureThing(app, config?) { ... }`.
2. Re-export it from `index.ts`.
3. Call it from `main.ts` at the right point in the order (security
   middleware before routing, validators before any guard that might
   need them).
