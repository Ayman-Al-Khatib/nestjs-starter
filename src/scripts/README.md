# Scripts

Operational scripts that run outside the HTTP server.

```
scripts/
├── i18n/        # Validate translation parity + regenerate typed key union
├── seed/       # Idempotent seed pipeline (boots a real Nest context)
└── shared/     # ANSI + console formatter helpers used by the scripts
```

## `i18n/` — translation validation + types

```bash
npm run i18n:sync
```

Pipeline:

1. **`I18nValidator`** walks `src/infrastructure/i18n/translations/{ar,en}/`,
   loads every JSON file, and checks:
   - AR ↔ EN key parity (no orphans).
   - Identical placeholder sets per key (`{property}` in one must exist
     in the other).
   - JSON parses cleanly.
2. **`I18nReporter`** prints a per-language report. Errors set
   `hasBlockingErrors`.
3. **`I18nTypesGenerator`** writes
   `src/infrastructure/i18n/translation-keys.ts`:
   - `TranslationKey` — string-literal union of every dotted key.
   - `TranslationInterpolations` — required placeholders per key.

   This is **regenerated on every run**. Never edit it by hand.
4. Exits non-zero if validation failed (CI-friendly).

See [`infrastructure/i18n/`](../infrastructure/i18n/README.md) for the
runtime side.

## `seed/` — idempotent seed pipeline

```bash
npm run seed:dev    # development DB
npm run seed:prod   # production DB (admin only by default)
```

Pipeline:

1. **`bootstrap()`** in `seed.script.ts` creates a Nest
   `ApplicationContext` (no HTTP server), so seeders can inject real
   services and repositories.
2. **`DatabaseCleaner`** truncates seeded tables in dev/test to keep
   runs reproducible. **Production is never cleaned.**
3. **`SeedRunner`** walks `SEED_PIPELINE` from
   [`seed-registry.ts`](seed/seed-registry.ts) and runs each step that
   matches the current `runsIn:` filter.

### Adding a seeder

1. Put the seeder next to the entity it owns:
   `src/modules/<feature>/seeders/seed-<thing>.ts`.
2. Export `async function seed<Thing>(app: INestApplicationContext): Promise<void>`.
   Use `app.get(...)` to pull the services it needs.
3. Make it **idempotent** — re-running must not duplicate rows. Check
   for an existing key before insert, or use `ON CONFLICT DO NOTHING`.
4. Register it in
   [`seed-registry.ts`](seed/seed-registry.ts) **at the correct position**:
   parents before children (areas before clinics, appointments before
   ratings, etc.).
5. Pick the right `runsIn:`:
   - `['all']` — always runs (cities, areas, admin).
   - `['development', 'test']` — sample data only, never production.

### Environment selection

`resolveEnvironment()` reads `NODE_ENV`. The seed scripts run a fresh
`npm run build` first because they execute against compiled JS.

## `shared/`

`ConsoleFormatter` + ANSI helpers used by both pipelines for the
status-line output. No business logic.
