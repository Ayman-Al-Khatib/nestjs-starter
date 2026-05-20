# Config

Loads the correct `.env` file for the current `NODE_ENV` and validates
**every variable** through a Zod schema. The app refuses to boot on
missing or malformed values, so production never crashes mid-request
because a secret was a typo.

## What lives here

- **`app-config.module.ts`** — wraps `@nestjs/config`. Picks the env
  file by `NODE_ENV`, runs Zod, registers globally.
- **`env.constant.ts`** — `Environment` enum (`development` / `test` /
  `production`) and the `ENV_FILES` map.
- **`env.schema.ts`** — assembles the per-domain schemas (see below)
  into one `environmentSchema` and runs `refineStorageConfig` to
  enforce the local-vs-supabase variable set.
- **`env.validator.ts`** — `safeParse` wrapper that prints a per-issue
  report and throws if anything failed.
- **`schemas/`** — one Zod schema per domain. Add a new one and re-export
  it from `schemas/index.ts`:

  | Schema                  | Owns                                                |
  | ----------------------- | --------------------------------------------------- |
  | `server.schema.ts`      | `APP_PORT`, `APP_URL`, `NODE_ENV`                   |
  | `security.schema.ts`    | `CORS_ORIGINS`, `TRUST_PROXY`, `BODY_LIMIT`         |
  | `throttle.schema.ts`    | `THROTTLE_TTL_SECONDS`, `THROTTLE_LIMIT`            |
  | `database.schema.ts`    | `DB_HOST/PORT/USER/PASSWORD/NAME/SCHEMA`            |
  | `jwt.schema.ts`         | `JWT_ACCESS_SECRET`, expiries, `JWT_ISSUER/AUDIENCE`|
  | `auth.schema.ts`        | `BCRYPT_SALT_ROUNDS`, admin seeder vars             |
  | `otp.schema.ts`         | OTP TTL / cooldown / lock window / attempt limits   |
  | `storage.schema.ts`     | `STORAGE_DRIVER` + local-only & supabase-only vars  |
  | `notifications.schema.ts`| `NOTIFICATIONS_FIREBASE_SERVICE_ACCOUNT`           |
  | `whatsapp.schema.ts`    | `WHATSAPP_DRIVER` + queue tuning                    |

- **`transformers/`** — small helpers used by schemas (e.g. parse
  `"true"`/`"false"` strings into booleans).

## How env files are chosen

```
NODE_ENV=development  →  env/.env.development
NODE_ENV=test         →  env/.env.test
NODE_ENV=production   →  env/.env.production
(unset)               →  env/.env.development   (fallback)
```

`env/.env.production.example` is the committed template. Copy it,
replace every `CHANGE_ME_*`, and never commit the real file.

## Typed access

```ts
constructor(private readonly config: ConfigService<EnvironmentConfig>) {}

// Always use getOrThrow for required vars — the schema guarantees it exists.
const port = this.config.getOrThrow<number>('APP_PORT');
```

`EnvironmentConfig` is `z.infer<typeof environmentSchema>`, so the key
union and value types are derived from the schema — no manual type files.

## Adding a new variable

1. Pick or create the matching domain schema in `schemas/`.
2. Add the field with a Zod type + default if appropriate. Use
   `z.coerce.number()` / `transformers/boolean.transformer.ts` for env
   strings.
3. Add it to `env/.env.development` and `env/.env.production.example`.
4. Re-export from `schemas/index.ts` if it's a new schema file.
5. Done — `ConfigService.getOrThrow('YOUR_KEY')` is now typed.

## Cross-field rules

Some constraints span multiple variables (e.g. *if `STORAGE_DRIVER=local`
then `STORAGE_LOCAL_PATH` is required*). They live in `superRefine`
hooks like `refineStorageConfig` in `schemas/storage.schema.ts`.
