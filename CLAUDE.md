# nestjs-starter

Stack: NestJS 11, TypeORM 0.3, PostgreSQL.
Purpose: reusable base project. TODO(per-project): replace this header and the purpose line with the new project's name and scope.

## Commands
- dev: `npm run start:dev`
- build: `npm run build`
- lint: `npm run lint`
- format: `npm run format`
- test: `npm run test`
- i18n sync: `npm run i18n:sync`
- migration: `npm run migration:{generate,run,revert,show}` (generate takes `-- src/database/migrations/<Name>`)
- seed: `npm run seed:dev`

## Skills
- Scaffold feature module → @.claude/skills/init-feature-module/SKILL.md
- Add endpoint → @.claude/skills/add-endpoint/SKILL.md
- Add entity + repository + migration → @.claude/skills/add-entity/SKILL.md
- Add mirrored ar/en i18n keys → @.claude/skills/add-i18n-keys/SKILL.md
- Add role-scoped controller → @.claude/skills/add-protected-controller/SKILL.md
- Generate Postman collection → @.claude/skills/generate-postman-collection/SKILL.md
- Naming conventions → @.claude/skills/naming-conventions/SKILL.md
- Comments → @.claude/skills/comments/SKILL.md

## Hard rules
- Module ownership: entity X lives in `modules/<x-plural>/`, including its `admin-<x>.controller.ts`. `modules/admins/` is the Admin entity only.
- Module layout: flat `controllers/ dto/ entities/ enums/ repositories/ services/` siblings. Never nest under `api/application/domain/infrastructure`.
- Layering: cross-feature reads go through the owning service, never its repository. Query builders live only in repositories.
- Service split: at ~200 LOC, split by responsibility (see `UserService` for profile/CRUD vs. `UserAuthService` for the phone/OTP login flow; likewise `AdminService` / `AdminAuthService`).
- FK delete: record-bearing tables `RESTRICT`; junction-ish `CASCADE`. Inactive entities use `is_active`, not hard delete.
- Migrations: every migration starts with `await scopeToConnectionSchema(queryRunner);`. `synchronize` is OFF.
- i18n: edit JSON under `src/infrastructure/i18n/translations/{ar,en}/`, then `npm run i18n:sync`. `translation-keys.ts` is auto-generated.
- Errors: throw Nest built-ins with translated messages. Catch only to translate a DB constraint into a domain exception (see `CityService.deleteForAdmin` mapping a Postgres FK violation `23503` to a `ConflictException`).
- Path aliases: `core/* domain/* infrastructure/* modules/* shared/*`. Import order: nest/3rd-party → core → domain → infrastructure → modules → shared → relative.
- English-only identifiers, file names, comments. User-facing strings via i18n.

## Don't
- Don't add `Logger` fields, `console.log`, or defensive `try/catch` in business logic.
  `Logger` is allowed only at four structurally necessary sites:
  1. Infrastructure filters (e.g. `GlobalExceptionFilter`) — last-resort error logging.
  2. External-service catch sites where a soft-failure is architecturally required (e.g. `OtpService` WhatsApp dispatch, `WhatsappQueueService` per-message worker).
  3. Security-event calls (e.g. refresh-token reuse detection in `RefreshTokenService`).
  4. Dev/stub providers (e.g. `StubWhatsAppNotifier`) that replace a real side-effect.
  Never add Logger to plain services, repositories, controllers, or middleware.
- Don't hand-edit `translation-keys.ts`.
- Don't create `admin-x.controller.ts` inside `modules/admin/`.
- Don't reach into another module's repository — go through its service.
- Don't add fields, abstractions, or feature flags the current task doesn't require.
- Don't run destructive git/db commands without explicit user confirmation.
