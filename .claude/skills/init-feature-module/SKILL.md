---
name: init-feature-module
description: Scaffold a feature module under src/modules/<plural>/ — entity, repository, service, audience-scoped controllers, DTOs, i18n stub, AppModule wiring. Triggers: "create a new module", "scaffold feature X", "/init-feature-module", new domain entity with API surface.
user-invocable: true
argument-hint: <FeatureName> [--entity <EntityName>] [--audiences admin,doctor,patient] [--no-controller]
allowed-tools: Read, Grep, Glob, Write, Edit, Bash
---

# Init Feature Module

Output must match existing modules (`appointment`, `clinic`, `patient`) in shape and naming. Naming details: @../naming-conventions/SKILL.md.

## Arguments
- `<FeatureName>` — kebab-case **singular** (`medical-record`). Pluralised for folder/module class (`medical-records/`, `MedicalRecordsModule`); singular for entity/service/controller files.
- `--entity <EntityName>` — primary entity class. Default: `<Feature>Entity`.
- `--audiences <list>` — comma-separated subset of `admin,doctor,patient,public`. Default: `admin`; ask once if ambiguous.
- `--no-controller` — skip controller generation (internal-only module).

## Phase 1 — Validate and plan
1. `Glob src/modules/<plural>/` — if exists, stop and tell the user.
2. Skim 1–2 sibling modules (`appointment`, `rating`): their `*.module.ts`, an entity, a repository, one controller — to mirror current style (decorator order, `version: '1'`, `@HttpCode`, response DTO mapping).
3. Confirm planned file set in one line; ask only if audience scope is ambiguous.

## Phase 2 — Generate files

```
src/modules/<plural>/
├── <plural>.module.ts           # class: <Plural>Module
├── controllers/                 # one per audience
│   ├── admin-<feature>.controller.ts
│   ├── doctor-<feature>.controller.ts
│   └── patient-<feature>.controller.ts
├── dto/
│   ├── create-<feature>.dto.ts
│   ├── update-<feature>.dto.ts
│   ├── list-<plural>-query.dto.ts
│   └── <feature>-response.dto.ts
├── entities/<feature>.entity.ts # class: <Feature>Entity
├── enums/<feature>-status.enum.ts (only if needed)
├── repositories/<feature>.repository.ts
└── services/<feature>.service.ts
```

File-shape rules per file kind: @file-shapes.md.

## Phase 3 — i18n stub
Create `src/infrastructure/i18n/translations/{ar,en}/<feature>.json` (use `appointment.json` as reference):

```json
{ "errors": { "not_found": "{Feature} not found." } }
```

## Phase 4 — Wire AppModule
Edit `src/app.module.ts`:
- Add `import { <Plural>Module } from 'modules/<plural>/<plural>.module';` (alphabetical).
- Add `<Plural>Module` to `imports:` under "Feature modules" (alphabetical).
- Don't touch global pipes/filters/interceptors.

## Phase 5 — Verify
1. `npm run i18n:sync`
2. `npm run lint`
3. `npm run build`

Fix root causes — never skip hooks or weaken types.

## Phase 6 — Confirm

```
✓ Module created: src/modules/<plural>/ (entity, repository, service, <N> controllers, <M> DTOs, i18n stub)
✓ Wired into AppModule
✓ i18n / lint / build green

Next:
- Add columns to <Feature>Entity, then `npm run migration:generate -- src/database/migrations/Create<Feature>`
- Add endpoints via /add-endpoint
- Add real i18n keys via /add-i18n-keys
```

## Anti-patterns
- Nesting under `api/application/domain/infrastructure` inside the module.
- Placing admin-facing endpoints under `modules/admin/` — they belong here.
- `Logger` field, `console.log`, fire-and-forget try/catch.
- Importing another module's repository directly.
- Hand-editing `translation-keys.ts`.
- `synchronize: true` or skipping migrations.
