---
name: add-entity
description: Add a TypeORM entity to an existing module — entity file, repository, TypeOrmModule.forFeature registration, generated migration. Triggers: "add an entity", "add a table", "add <Entity> to module X", "/add-entity".
user-invocable: true
argument-hint: <module> <EntityName> [--table <table_name>] [--no-migration]
allowed-tools: Read, Grep, Glob, Write, Edit, Bash
---

# Add Entity

Add a TypeORM entity to an existing module with its repository and a generated migration.

## Arguments
- `<module>` — existing folder under `src/modules/` (kebab-case).
- `<EntityName>` — PascalCase root, no `Entity` suffix (`MedicalRecord`). Class becomes `<EntityName>Entity`.
- `--table <name>` — override table name (snake_case, plural). Default: `snake_case(plural(<EntityName>))`.
- `--no-migration` — skip migration generation.

## Phase 1 — Validate
1. `Glob src/modules/<module>/` — if missing, abort and suggest `/init-feature-module <module>`.
2. `Grep "class <EntityName>Entity"` — if defined anywhere, stop.
3. Reference shape: `src/modules/appointment/entities/appointment.entity.ts`.

## Phase 2 — Ask only what you cannot infer
Ask only when:
- A FK target is ambiguous (multiple plausible parents).
- Soft-delete vs hard-delete is unclear. Default: `is_active` boolean for record-bearing entities, no flag for join rows.
- The entity backs an authenticatable account (extend `BaseAccountEntity` / `BasePasswordUserEntity`?).

## Phase 3 — Entity (`src/modules/<module>/entities/<entity-kebab>.entity.ts`)
- `@Entity({ name: '<table>' })` (snake_case plural).
- `@PrimaryGeneratedColumn() id: number;`
- FKs: paired `@Column({ type: 'int', name: '<col>_id' }) <col>Id` + `@ManyToOne(() => <Parent>Entity, { onDelete: '<RESTRICT|CASCADE>' })` + `@JoinColumn({ name: '<col>_id' })`. Default: `RESTRICT` for record-bearing parents (doctor, clinic, patient on history rows), `CASCADE` for owned children (e.g. rating on a deleted appointment).
- Dates: `@Column({ type: 'timestamptz', name: '<col>' })`.
- Enums: feature-scoped enum in `enums/`, `@Column({ type: 'enum', enum: <Enum>, default: <Enum>.<X>, name: '<col>' })`.
- Audit: `@CreateDateColumn({ type: 'timestamptz', name: 'created_at' })` + `@UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })`.
- Indexes: `@Index()` on hot FKs and search columns; `@Index([...])` for composite lookups used by paginated queries.
- Doc comment only for a non-obvious invariant (half-open intervals, immutability, parallel state machines).

## Phase 4 — Repository (`src/modules/<module>/repositories/<entity-kebab>.repository.ts`)

```ts
@Injectable()
export class <EntityName>Repository {
  constructor(
    @InjectRepository(<EntityName>Entity)
    private readonly repo: Repository<<EntityName>Entity>,
  ) {}

  findById(id: number): Promise<<EntityName>Entity | null> {
    return this.repo.findOne({ where: { id } });
  }
  create(data: DeepPartial<<EntityName>Entity>): <EntityName>Entity {
    return this.repo.create(data);
  }
  save(entity: <EntityName>Entity): Promise<<EntityName>Entity> {
    return this.repo.save(entity);
  }
  mergeAndSave(
    entity: <EntityName>Entity,
    changes: DeepPartial<<EntityName>Entity>,
  ): Promise<<EntityName>Entity> {
    this.repo.merge(entity, changes);
    return this.repo.save(entity);
  }
}
```

Add intent-named query methods (`findActiveFor<X>`, `findOverlapping<X>`, `findPageFor<Audience>`) only when the current task needs them.

## Phase 5 — Wire the module (`src/modules/<module>/<module>.module.ts`)
- Add `<EntityName>Entity` to `TypeOrmModule.forFeature([...])`.
- Add `<EntityName>Repository` to `providers:`.
- Add to `exports:` only if another module will consume it.

If this is the primary entity of a fresh module, `init-feature-module` already did this.

## Phase 6 — Generate migration

```bash
npm run migration:generate -- src/database/migrations/Add<EntityName>
```

After it lands:
1. Prepend `await scopeToConnectionSchema(queryRunner);` to **both** `up()` and `down()` (import from `infrastructure/database/migration-utils`).
2. Verify generated SQL: `timestamptz` for dates, `int` for IDs, FK `ON DELETE` clauses, index/enum names.
3. For DB-level invariants beyond column constraints (unique partial indexes, exclusion/check constraints), add raw SQL — see `AppointmentsNoOverlapConstraint`.

Skip Phase 6 entirely on `--no-migration`.

## Phase 7 — Verify
1. `npm run lint`
2. `npm run build`
3. `npm run migration:show` — new migration listed as pending.

Don't run `migration:run` automatically. Ask the user.

## Phase 8 — Confirm

```
✓ Entity:     src/modules/<module>/entities/<entity>.entity.ts
✓ Repository: src/modules/<module>/repositories/<entity>.repository.ts
✓ Module updated: TypeOrmModule.forFeature + providers
✓ Migration:  src/database/migrations/<timestamp>-Add<EntityName>.ts
              (prepended scopeToConnectionSchema in up() and down())

Pending:
- Review the generated SQL.
- Run `npm run migration:run` when ready.
- Add service methods that use <EntityName>Repository.
```

## Anti-patterns
- Hand-writing SQL where TypeORM column metadata would have produced it.
- Skipping `scopeToConnectionSchema(...)` in the migration.
- `synchronize: true` or editing `data-source.ts` to bypass migrations.
- Putting the entity outside the owning module. `domain/entities/` is reserved for cross-module base classes.
- Adding unused fields, indexes, or methods "for future use".
