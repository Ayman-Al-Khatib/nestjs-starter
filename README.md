# NestJS Base Project

A production-ready NestJS + TypeORM (PostgreSQL) starter. Ships with the
plumbing every real backend needs — authentication, role-based access
control, i18n, file storage, push + WhatsApp notifications, validated
configuration, structured pagination, and a reviewed migration workflow —
so a new domain can be built on top instead of from scratch.

The repository currently includes a sample dental-booking domain
(Admin / Doctor / Patient + clinics, appointments, ratings, consultations,
medical records) as a worked example of the conventions. Replace those
feature modules with your own; the infrastructure layer is reusable as-is.

## Stack

- **NestJS 11** with the Nest CLI build pipeline
- **TypeORM 0.3** + **PostgreSQL** with reviewed migrations
- **Zod** for environment validation
- **nestjs-i18n** (Arabic + English by default, easy to extend)
- **JWT** access tokens + opaque refresh-token rotation with theft detection
- **class-validator** with localized error messages
- **Storage abstraction**: local FS or Supabase (signed URLs for private files)
- **Notifications**: Firebase push + WhatsApp (Baileys) with a stub driver for dev
- **Helmet + compression + CORS + body limits + trust-proxy** wired in `bootstrap/`

## Project Structure

```
src/
├── bootstrap/        # main.ts wiring: security, body limits, routing, DI
├── core/             # Cross-cutting NestJS plumbing: guards, decorators,
│                     # interceptors, middlewares, pagination, filters, pipes,
│                     # auth resolver registry
├── domain/           # Cross-module entities + enums (BaseAccountEntity, Role, ...)
├── infrastructure/   # Reusable platform modules: config, database, i18n,
│                     # jwt, storage, notifications, whatsapp-client, throttle
├── modules/          # Feature modules — each owns its repository,
│                     # entities, DTOs, controllers, and services
├── database/         # TypeORM migrations
├── scripts/          # Operational scripts: i18n key check, seeder pipeline
├── shared/           # Tiny pure utils + ambient types
├── app.module.ts
└── main.ts
```

Each infrastructure subfolder ships its own short README. Start here:

- [bootstrap/](src/bootstrap/README.md) — what happens between `NestFactory.create` and `app.listen`
- [core/](src/core/README.md) — `@Protected()`, `JwtAuthGuard`, pagination, response transforms
- [infrastructure/config/](src/infrastructure/config/README.md) — env vars + Zod validation
- [infrastructure/database/](src/infrastructure/database/README.md) — schema scoping, migration utils
- [infrastructure/i18n/](src/infrastructure/i18n/README.md) — `Translator`, key generation, language resolution
- [infrastructure/jwt/](src/infrastructure/jwt/README.md) — access-token signing + verification
- [infrastructure/notifications/](src/infrastructure/notifications/README.md) — Firebase push
- [infrastructure/storage/](src/infrastructure/storage/README.md) — file uploads (local / Supabase)
- [infrastructure/throttle/](src/infrastructure/throttle/README.md) — global + auth rate limiting
- [infrastructure/whatsapp-client/](src/infrastructure/whatsapp-client/README.md) — WhatsApp notifier (Baileys / stub)
- [scripts/](src/scripts/README.md) — i18n validation + seed pipeline

## Conventions

- Anything entity-specific lives inside the feature module that owns the
  entity — including admin-facing endpoints. `modules/admins/` is reserved
  for the Admin entity itself.
- Repositories never cross module boundaries. Cross-feature reads go
  through the owning module's service.
- All responses are wrapped `{ data, pagination? }` in snake_case.
- Request bodies accept either snake_case or camelCase — the middleware
  normalizes to camelCase before validation.
- Response language resolves from `?lang=ar|en`, `Accept-Language`, or
  `X-Lang` header (first match wins).
- Validation errors return `400` with the first error message localized.

## Local Setup

1. Copy `env/.env.development` and edit DB credentials + secrets to
   match your local Postgres.
2. `npm install`
3. `npm run migration:run`
4. `npm run seed:dev` (optional — populates the sample dental dataset)
5. `npm run start:dev`

Server listens on `APP_PORT` (default `3000`). In development the
database + schema are created automatically if missing.

## Environment Variables

Every variable is validated by Zod schemas in
[src/infrastructure/config/schemas/](src/infrastructure/config/schemas/).
The app refuses to boot on missing or malformed values — see those
schemas for the authoritative list, and [`infrastructure/config/`](src/infrastructure/config/README.md)
for an overview.

A few that almost always need attention before a fresh deploy:

| Variable      | Purpose                                                                  |
| ------------- | ------------------------------------------------------------------------ |
| `APP_URL`     | Public URL used for absolute links (storage signed URLs, etc.)           |
| `DB_SCHEMA`   | Postgres schema used by all entities and migrations                      |
| `CORS_ORIGINS`| Comma-separated origin allowlist — never `*` in production               |
| `TRUST_PROXY` | Hops behind a reverse proxy. Must be correct for rate-limit IPs to work  |

For production, copy `env/.env.production.example` to `env/.env.production`
and replace every `CHANGE_ME_*` placeholder.

## Migrations

```bash
npm run migration:generate -- src/database/migrations/<Name>   # generate from entity diff
npm run migration:run                                          # apply pending
npm run migration:revert                                       # rollback the last
npm run migration:show                                         # list applied / pending
```

Every migration **must** start with `await scopeToConnectionSchema(queryRunner)`
in both `up()` and `down()`. See
[`infrastructure/database/`](src/infrastructure/database/README.md) for why.

## Internationalization

JSON translation files live under
`src/infrastructure/i18n/translations/{ar,en}/`. Add or edit keys there,
then:

```bash
npm run i18n:sync
```

This validates parity between locales and regenerates
`src/infrastructure/i18n/translation-keys.ts`. **Do not edit
`translation-keys.ts` by hand** — it's overwritten on every run.
See [`infrastructure/i18n/`](src/infrastructure/i18n/README.md).

## Seeding

```bash
npm run seed:dev    # development DB
npm run seed:prod   # production DB (idempotent admin only by default)
```

The pipeline order is defined in
[src/scripts/seed/seed-registry.ts](src/scripts/seed/seed-registry.ts).
See [`scripts/`](src/scripts/README.md).

## Useful Scripts

| Script                 | What it does                          |
| ---------------------- | ------------------------------------- |
| `npm run start:dev`    | Watch mode, `NODE_ENV=development`    |
| `npm run start:prod`   | Production runtime against `dist/`    |
| `npm run build`        | Nest CLI build                        |
| `npm run lint`         | ESLint + auto-fix                     |
| `npm run format`       | Prettier write                        |
| `npm run test`         | Jest unit tests                       |
| `npm run i18n:sync`    | Validate translations + regenerate types |
| `npm run seed:dev`     | Run the seed pipeline against dev DB  |

## License

UNLICENSED — see `package.json`.
