<div align="center">

# NestJS Starter — Production-Ready TypeScript + PostgreSQL Boilerplate

**A batteries-included [NestJS](https://nestjs.com) 11 starter template for building secure REST APIs:** JWT auth with refresh-token rotation, role-based access control, bilingual i18n (Arabic/English), file storage, push & WhatsApp notifications, rate limiting, Zod-validated config, and reviewed TypeORM migrations — so you start a new backend on solid foundations instead of from a blank `main.ts`.

[![NestJS](https://img.shields.io/badge/NestJS-11-E0234E?logo=nestjs&logoColor=white)](https://nestjs.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![TypeORM](https://img.shields.io/badge/TypeORM-0.3-FE0803)](https://typeorm.io)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Node](https://img.shields.io/badge/Node-%3E%3D20-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![Tests](https://img.shields.io/badge/tests-409%20passing-success)](#testing)
[![Coverage](https://img.shields.io/badge/coverage-~95%25-success)](#testing)

</div>

> **Reusable base project.** The shipped feature modules (admins, users, cities, areas, OTPs, refresh tokens, WhatsApp) are intentionally small and generic — they demonstrate the conventions for auth, lookups, and CRUD. Replace them with your own domain; the entire `infrastructure/` layer is reusable as-is.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Quick Start](#quick-start)
- [Testing](#testing)
- [Conventions](#conventions)
- [Environment Variables](#environment-variables)
- [Migrations](#migrations)
- [Internationalization](#internationalization)
- [Seeding](#seeding)
- [Scripts](#scripts)
- [Docker](#docker)
- [License](#license)

## Features

- 🔐 **Authentication & sessions** — Admin (username + password) and User (phone + WhatsApp OTP) flows. Short-lived JWT access tokens plus **opaque, DB-backed refresh tokens with rotation and reuse/theft detection**.
- 🛡️ **Role-based access control** — one `@Protected(Role.X)` decorator and a resolver registry; the guard hydrates the principal without any feature module importing another's repository. Fail-closed by default, with a soft `is_active` account gate.
- 🌍 **i18n out of the box** — Arabic + English via `nestjs-i18n`, with a **type-safe, auto-generated translation-key union** and localized validation messages.
- 📦 **File storage abstraction** — local filesystem or Supabase, signed URLs for private files, **magic-byte content validation**, and Sharp-based image processing.
- 🔔 **Notifications** — Firebase Cloud Messaging push + WhatsApp (Baileys) with a dev stub driver.
- 🚦 **Rate limiting** — global per-IP sliding window plus stricter named throttlers for auth and upload routes (Redis-backed in production).
- ✅ **Validated configuration** — every environment variable is parsed and validated by **Zod** at boot; the app refuses to start on missing/malformed values.
- 🗃️ **Reviewed migrations** — `synchronize` is off; schema-scoped TypeORM migrations only.
- 📑 **Consistent API surface** — `{ data, pagination? }` response envelope, snake_case ↔ camelCase negotiation, UTC date serialization, and a global exception filter mapping DB/JWT/Multer errors to clean responses.
- 🧪 **Tested & CI-ready** — 400+ unit tests at ~95% line coverage on the logic layers, an e2e suite, and a GitHub Actions pipeline.
- 🐳 **Deployable** — multi-stage Dockerfile (non-root, healthcheck) and helmet/CORS/compression/body-limit/trust-proxy hardening wired in `bootstrap/`.

## Tech Stack

- **[NestJS 11](https://nestjs.com)** with the Nest CLI build pipeline
- **[TypeORM 0.3](https://typeorm.io)** + **[PostgreSQL](https://www.postgresql.org)** with reviewed migrations
- **[Zod](https://zod.dev)** for environment validation
- **[nestjs-i18n](https://nestjs-i18n.com)** (Arabic + English by default, easy to extend)
- **JWT** access tokens (`jsonwebtoken`, HS256 pinned) + opaque refresh-token rotation
- **[class-validator](https://github.com/typestack/class-validator)** with localized error messages
- **Storage**: local FS or **[Supabase](https://supabase.com)** (signed URLs for private files), **[Sharp](https://sharp.pixelplumbing.com)** image processing
- **Notifications**: **[Firebase Admin](https://firebase.google.com/docs/admin/setup)** push + **WhatsApp ([Baileys](https://github.com/WhiskeySockets/Baileys))** with a stub driver for dev
- **[Helmet](https://helmetjs.github.io) + compression + CORS + body limits + trust-proxy** wired in `bootstrap/`
- **[Jest](https://jestjs.io)** unit + e2e, **[ESLint](https://eslint.org)** + **[Prettier](https://prettier.io)**

## Project Structure

```
src/
├── bootstrap/        # main.ts wiring: security, body limits, routing, DI
├── core/             # Cross-cutting NestJS plumbing: guards, decorators,
│                     # interceptors, middlewares, pagination, filters, pipes,
│                     # auth resolver registry
├── domain/           # Cross-module entities + enums (BaseAccountEntity, Role, ...)
├── infrastructure/   # Reusable platform modules: config, database, i18n,
│                     # jwt, storage, notifications, whatsapp-client, throttle, cache
├── modules/          # Feature modules — each owns its repository,
│                     # entities, DTOs, controllers, and services
├── database/         # TypeORM migrations
├── scripts/          # Operational scripts: i18n key check, seeder pipeline
├── shared/           # Tiny pure utils + ambient types
├── app.module.ts
└── main.ts
test/                 # End-to-end (e2e) test suite
```

Each infrastructure subfolder ships its own short README:

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

## Quick Start

**Prerequisites:** Node.js ≥ 20, PostgreSQL 14+ (Redis optional, only when `CACHE_DRIVER=redis`).

```bash
# 1. Install dependencies
npm install

# 2. Configure environment (committed dev defaults, no real secrets)
#    Edit env/.env.development with your local Postgres credentials.

# 3. Apply database migrations
npm run migration:run

# 4. (Optional) seed the lookup + admin data
npm run seed:dev

# 5. Run in watch mode
npm run start:dev
```

The server listens on `PORT` (honored first, for platforms that inject it) or `APP_PORT` (default `3000`). In development the database and schema are created automatically if missing.

## Testing

The suite is split into fast **unit tests** (co-located `*.spec.ts` next to the source) and an **e2e** suite (`test/`), following the NestJS convention.

```bash
npm test            # unit tests
npm run test:cov    # unit tests + coverage (enforces coverage thresholds)
npm run test:e2e    # e2e tests (infra-free pipeline; DB suite is CI-gated)
```

- **409 unit tests** covering services, guards, the refresh-token rotation/reuse logic, OTP lockout, validators, decorators, interceptors, middlewares, filters, pagination, cache, and utilities.
- **~95% line coverage** on the unit-tested logic layers, enforced by `coverageThreshold` in [package.json](package.json). Pure framework wiring, declarative DTOs/schemas, and integration-only adapters (storage providers, Firebase, Baileys) are scoped out of the unit-coverage gate and exercised by the e2e suite instead.
- **E2E:** an infra-free HTTP-pipeline test runs anywhere; a full **auth-flow** test (admin login → refresh rotation → reuse detection → protected route) runs in CI against a Postgres service (`RUN_DB_E2E=1`).
- **CI:** [.github/workflows/ci.yml](.github/workflows/ci.yml) runs `lint:check`, `build`, `test:cov`, and the Postgres-backed e2e job on every push and pull request.

## Conventions

- Anything entity-specific lives inside the feature module that owns the entity — including admin-facing endpoints. `modules/admins/` is reserved for the Admin entity itself.
- Repositories never cross module boundaries. Cross-feature reads go through the owning module's service.
- All responses are wrapped `{ data, pagination? }` in snake_case.
- Request bodies accept either snake_case or camelCase — middleware normalizes to camelCase before validation.
- Response language resolves from `?lang=ar|en`, `Accept-Language`, or the `X-Lang` header (first match wins).
- Validation errors return `400` with the first error message localized.

See [CLAUDE.md](CLAUDE.md) and `.claude/skills/` for the full conventions and scaffolding guides.

## Environment Variables

Every variable is validated by Zod schemas in [src/infrastructure/config/schemas/](src/infrastructure/config/schemas/). The app refuses to boot on missing or malformed values — see those schemas for the authoritative list, and [`infrastructure/config/`](src/infrastructure/config/README.md) for an overview.

A few that almost always need attention before a fresh deploy:

| Variable        | Purpose                                                                 |
| --------------- | ----------------------------------------------------------------------- |
| `APP_URL`       | Public URL used for absolute links (storage signed URLs, etc.)          |
| `DB_SCHEMA`     | Postgres schema used by all entities and migrations                     |
| `JWT_ACCESS_SECRET` | HS256 signing key (min 32 chars)                                    |
| `CORS_ORIGINS`  | Comma-separated origin allowlist — never `*` in production              |
| `TRUST_PROXY`   | Hops behind a reverse proxy. Must be correct for rate-limit IPs to work |

For production, copy `env/.env.production.example` to `env/.env.production` and replace every `CHANGE_ME_*` placeholder.

## Migrations

```bash
npm run migration:generate -- src/database/migrations/<Name>   # generate from entity diff
npm run migration:run                                          # apply pending
npm run migration:revert                                       # rollback the last
npm run migration:show                                         # list applied / pending
```

Every migration **must** start with `await scopeToConnectionSchema(queryRunner)` in both `up()` and `down()`. See [`infrastructure/database/`](src/infrastructure/database/README.md) for why.

## Internationalization

JSON translation files live under `src/infrastructure/i18n/translations/{ar,en}/`. Add or edit keys there, then:

```bash
npm run i18n:sync
```

This validates parity between locales and regenerates `src/infrastructure/i18n/translation-keys.ts`. **Do not edit `translation-keys.ts` by hand** — it's overwritten on every run. See [`infrastructure/i18n/`](src/infrastructure/i18n/README.md).

## Seeding

```bash
npm run seed:dev    # development DB
npm run seed:prod   # production DB (idempotent admin only by default)
```

The pipeline order is defined in [src/scripts/seed/seed-registry.ts](src/scripts/seed/seed-registry.ts). See [`scripts/`](src/scripts/README.md).

## Docker

A multi-stage [Dockerfile](deploy/docker/Dockerfile) builds a slim, non-root production image with a `/healthz` healthcheck:

```bash
docker build -f deploy/docker/Dockerfile -t nestjs-starter .
docker run -p 3000:3000 --env-file env/.env.production nestjs-starter
```

## Scripts

| Script               | What it does                              |
| -------------------- | ----------------------------------------- |
| `npm run start:dev`  | Watch mode, `NODE_ENV=development`        |
| `npm run start:prod` | Production runtime against `dist/`        |
| `npm run build`      | Nest CLI build                            |
| `npm run lint`       | ESLint + auto-fix                         |
| `npm run format`     | Prettier write                            |
| `npm test`           | Jest unit tests                           |
| `npm run test:cov`   | Unit tests + coverage (enforces gates)    |
| `npm run test:e2e`   | End-to-end tests                          |
| `npm run i18n:sync`  | Validate translations + regenerate types  |
| `npm run seed:dev`   | Run the seed pipeline against dev DB      |

## License

UNLICENSED — see [package.json](package.json). Authored by Ayman Al-Khatib.

---

<sub>**Keywords:** NestJS starter · NestJS boilerplate · NestJS template · TypeScript REST API · NestJS TypeORM PostgreSQL · JWT refresh token rotation · RBAC · NestJS i18n (Arabic/English) · NestJS file upload (Supabase / local) · WhatsApp OTP · Firebase push notifications · rate limiting · Zod env validation · production-ready Node.js API.</sub>
