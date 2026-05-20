---
name: naming-conventions
description: Source of truth for naming — folders, files, classes, methods, DTOs, DB tables/columns/indexes, HTTP paths, i18n keys, migrations. Use when creating, renaming, or reviewing names. Triggers "/naming-conventions", "rename", "is this name correct".
user-invocable: true
argument-hint: "[check <path>] | [propose <thing>] | [show <category>]"
allowed-tools: Read, Grep, Glob
---

# Naming Conventions

Source of truth for every name in this codebase. If a rule here conflicts with an older file, **the file is wrong** — open a renaming PR.

## Quick Reference

| Thing | Case | Number | Example |
|---|---|---|---|
| Module folder | `kebab-case` | plural | `src/modules/clinics/` |
| Sub-folder | `kebab-case` | plural | `controllers/`, `dto/`, `entities/` |
| File name | `kebab-case` | singular | `clinic.entity.ts`, `create-clinic.dto.ts` |
| Class | `PascalCase` | singular | `ClinicEntity`, `AdminClinicController` |
| Interface (DI contract) | `PascalCase` + `I` | singular | `IPaginatedResponse`, `IAuthUserResolver` |
| Type alias | `PascalCase` | singular | `MulterFile`, `PaginatedResult` |
| Enum type | `PascalCase` | singular | `AppointmentStatus`, `Role` |
| Enum member | `UPPER_SNAKE` | — | `AppointmentStatus.PENDING` |
| Function / method | `camelCase` | verb | `findById`, `bookForPatient` |
| Variable / property | `camelCase` | noun | `clinicId`, `startTime` |
| Boolean | `camelCase` | `is/has` | `isActive`, `hasRating`, `canBook` |
| Constant (truly global) | `UPPER_SNAKE` | — | `MAX_PAGE_SIZE` |
| DB table | `snake_case` | plural | `clinics`, `clinic_weekly_slots` |
| DB column | `snake_case` | singular | `doctor_id`, `start_time`, `is_active` |
| DB FK column | `<entity>_id` | singular | `patient_id`, `clinic_id` |
| DB enum type | `<col>_enum` | singular | `appointment_status_enum` |
| DB index | `idx_<tbl>_<cols>` | — | `idx_appointments_clinic_start_end` |
| DB unique index | `uq_<tbl>_<cols>` | — | `uq_cities_name_en` |
| i18n namespace | `kebab-case` | singular | `clinic`, `medical-record` |
| i18n key path | `dot.snake_case` | — | `clinic.errors.not_found` |
| Migration class | `PascalCase` | — | `CreateClinics1747600000010` |
| HTTP path segment | `kebab-case` | plural | `/admin/clinics`, `/patient/medical-records` |

The rule: **plural for collections (folders, tables, URL paths); singular for the thing itself (class, file, column).**

## Reserved verbs (do not invent synonyms)

| Concept | Verb | Not |
|---|---|---|
| Read one | `findById`, `findOne` | `get`, `fetch`, `lookup`, `read` |
| Read many | `findAll` | `list`, `getMany`, `index` |
| Read paginated | `findPageFor<Audience>` (svc + repo) | `getPage`, `list`, `paginate*` |
| Read or 404 | `findByIdOrFail` | `getOrThrow`, `requireById` |
| Predicate | `is<State>`, `has<Thing>` | `check`, `verify` |
| Throw-on-failure | `assert<Constraint>` | `validate`, `ensure` |
| Create draft | `create` (repo) | `build`, `make` |
| Persist | `save` (repo) | `store`, `persist` |
| Update | `update` (svc) / `mergeAndSave` (repo) | `edit`, `modify` |
| Remove | `remove` (controller) / `delete` (svc) / `deleteById` (repo) | `destroy`, `purge` |
| Soft-delete | `softDelete*` | `archive`, `disable` |
| Reactivate | `restore*` / `reactivate*` | `revive` |
| Translate | `translator.tr(...)` | `t`, `i18n`, `localize` |
| Domain action | domain verb: `book`, `cancel`, `approve`, `rate`, `complete`, `notify`, `seed` | `process`, `handle` |

## Details

- Folders, files, classes, interfaces, types, enums, variables → @code-naming.md

Other categories (methods, DTOs, DB columns, routes, i18n keys) are covered by the Quick Reference + Reserved verbs tables above.

## When in doubt

1. Find an existing analogous thing in the codebase — copy its shape.
2. Check this document.
3. Open the PR with the proposed name and a one-line rationale.

Prefer **rename now** over **let it accumulate** — every additional caller makes the rename more expensive.

## Skill usage modes

`/naming-conventions [arg]`:

- `check <path>` — read the file, report each name that violates a rule, cite rule + proposed name. No edits.
- `propose <thing>` — given a short description, output the proposed file path, class name, method names, table/column names. No files written.
- `show` — print `code-naming.md` (folders, files, classes, enums, variables).
- No args — print the Quick Reference table and stop.

Never apply renames silently. Renames cascade — run a project-wide report first and confirm scope with the user before editing.
