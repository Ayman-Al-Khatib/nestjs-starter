# Database

TypeORM 0.3 + PostgreSQL. Reviewed migrations only — `synchronize` is
**off** in every environment.

## What lives here

- **`app-database.module.ts`** — registers `TypeOrmModule.forRootAsync`
  using config built from the `EnvironmentConfig`. In development it
  calls `ensureDatabaseAndSchemaExist` so a fresh Postgres "just works".
- **`app-database.options.ts`** — builds `TypeOrmModuleOptions` per env:
  entity glob, migrations glob, SSL toggles, logging, etc.
- **`app-database.bootstrap.ts`** — dev-only helper. Connects to the
  `postgres` admin DB and creates `DB_NAME` + `DB_SCHEMA` if missing.
  Never runs in production.
- **`data-source.ts`** — standalone `DataSource` used by the TypeORM
  CLI (`npm run migration:*`). Reads env directly so it works without
  the Nest container.
- **`migration-utils.ts`** — `scopeToConnectionSchema(queryRunner)` and
  `getConnectionSchema(queryRunner)`. **Required at the top of every
  migration.**
- **`app-database.constants.ts`** — DI tokens.

Actual migration files live in
[`src/database/migrations/`](../../database/migrations).

## Configuration

| Variable      | Notes                                                                 |
| ------------- | --------------------------------------------------------------------- |
| `DB_HOST`     |                                                                       |
| `DB_PORT`     | Default `5432`                                                        |
| `DB_USER`     |                                                                       |
| `DB_PASSWORD` |                                                                       |
| `DB_NAME`     | Created automatically in dev if missing                               |
| `DB_SCHEMA`   | Created automatically in dev if missing. All entities live inside it  |

## Why `scopeToConnectionSchema` exists

TypeORM **only** schema-qualifies SQL that it generates from entity
metadata. Raw `queryRunner.query(...)` calls inside migrations resolve
unqualified identifiers via Postgres' `search_path`, which defaults to
`public`. Without scoping, your `CREATE TYPE`, `CREATE INDEX`, or
`ALTER TABLE` lands in the wrong schema.

Every migration **must** begin with:

```ts
import { scopeToConnectionSchema } from 'infrastructure/database/migration-utils';

public async up(queryRunner: QueryRunner): Promise<void> {
  await scopeToConnectionSchema(queryRunner);
  // ... your migration ...
}

public async down(queryRunner: QueryRunner): Promise<void> {
  await scopeToConnectionSchema(queryRunner);
  // ... your rollback ...
}
```

`SET LOCAL search_path` is transaction-scoped — TypeORM wraps each
migration in a transaction, so the change reverts cleanly.

## Migration workflow

```bash
# Generate from entity diff
npm run migration:generate -- src/database/migrations/<Name>

# Apply pending
npm run migration:run

# Roll back the last
npm run migration:revert

# List applied / pending
npm run migration:show
```

After generation, **always** prepend `scopeToConnectionSchema(queryRunner)`
to `up()` and `down()`. Then review the generated SQL:

- `timestamptz` for date columns (never `timestamp`).
- `int` for IDs and FKs.
- FK `ON DELETE`: `RESTRICT` for record-bearing parents, `CASCADE` for
  owned children (see `CLAUDE.md`).
- Index / enum names match the project conventions.

For DB-level invariants beyond column constraints (unique partial
indexes, exclusion / check constraints), append raw SQL — see
[`AppointmentsNoOverlapConstraint`](../../database/migrations/1747600000002-AppointmentsNoOverlapConstraint.ts).

## Anti-patterns

- `synchronize: true` — never. Reviewed migrations only.
- Editing a migration that has already run on a shared environment —
  add a new one instead.
- Skipping `scopeToConnectionSchema` because it "worked locally" — your
  local `search_path` matched by coincidence.
- Putting entity definitions outside the owning feature module.
  `domain/entities/` is reserved for cross-module base classes.
