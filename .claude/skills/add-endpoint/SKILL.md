---
name: add-endpoint
description: Add an HTTP endpoint to an existing module — updates the audience-scoped controller (creates one if needed), DTO, service method, and i18n keys for any new error messages. Triggers: "add an endpoint", "expose endpoint X on module Y", "add a route to <module>", "/add-endpoint".
user-invocable: true
argument-hint: <module> <METHOD> <path> [--audience admin|user|public] [--name <handlerName>]
allowed-tools: Read, Grep, Glob, Write, Edit, Bash
---

# Add Endpoint

Add a new endpoint to an existing module without breaking surrounding conventions.

## Arguments
- `<module>` — plural folder under `src/modules/` (kebab-case, `cities`, `users`). Singular form is rewritten to plural.
- `<METHOD>` — `GET | POST | PATCH | PUT | DELETE`.
- `<path>` — full route or suffix appended to the controller base. `:id` placeholders honored.
- `--audience <kind>` — target controller. If omitted, infer from path (`admin/...` → admin).
- `--name <handlerName>` — handler method name. Default: derived from method+path (e.g. `GET /:id` → `findOne`, `POST /` → `create`).

## Phase 1 — Locate the target controller
1. `Glob src/modules/<module>/` — confirm it exists.
2. Read `controllers/`. Match the audience:
   - Matching `<audience>-<module>.controller.ts` exists → reuse it.
   - Otherwise, ask once (or just create if `--audience` was passed).
3. Read one sibling controller for decorator/order/style.

## Phase 2 — Plan inputs and outputs

| Method | Handler | Service call | Body | Response |
|---|---|---|---|---|
| `POST /`            | `create` / domain verb (`book`) | `createFor<Audience>` / `bookByAdmin` | yes | `<Feature>ResponseDto` + `@HttpCode(CREATED)` |
| `POST /:id/<verb>`  | `<verb>` | `<verb>By<Audience>` / `<verb>For<Audience>` | sometimes | `<Feature>ResponseDto` |
| `GET /`             | `findAll` | `findPageFor<Audience>` | no | `IPaginatedResponse<<Feature>ResponseDto>` via `mapPaginated` |
| `GET /:id`          | `findOne` | `findByIdOrFail` / `findOwnedByXOrFail` | no | `<Feature>ResponseDto` |
| `PATCH /:id`        | `update` | `updateFor<Audience>` | yes | `<Feature>ResponseDto` |
| `PATCH /:id/<verb>` | `<verb>` / `update<Verb>` | `<verb>For<Audience>` | yes | `<Feature>ResponseDto` |
| `DELETE /:id`       | `remove` | `deleteFor<Audience>` | no | `void` + `@HttpCode(NO_CONTENT)` |

Handler name never carries the audience (no `adminList`, `publicGetById`) — audience lives in the controller class name and URL prefix. Service methods *do* carry the audience. See @../naming-conventions/SKILL.md.

If a body is needed:
- New action → new DTO file `<verb>-<feature>.dto.ts`.
- Tightening existing input → extend the existing DTO.
- Use `class-validator` + `Translator.trValMsg('common.validation.*')`. List query DTOs extend `PaginationQueryDto` from `core/pagination/dto/`.

## Phase 3 — Update the service
Open the matching service (or facade). Add the new method:
- Name: `<verb>By<Audience>` for role-scoped action; otherwise intent-based.
- Accept primitive IDs + DTO. Never accept the raw Express request.
- Throw `NotFoundException` / `ForbiddenException` / `ConflictException` with `this.translator.tr('<feature>.errors.<key>')` (add the key in Phase 5 if missing).
- Paginated lists: call `this.<feature>Repository.findPageFor<Audience>(...)` and return the envelope.
- If the service is split (booking/query/status), add to the matching sub-service and expose through the facade.

## Phase 4 — Update the controller

```ts
@Get()
async findAll(
  @Query() query: List<Plural>AdminQueryDto,
): Promise<IPaginatedResponse<<Feature>ResponseDto>> {
  const result = await this.<feature>Service.findPageForAdmin(query);
  return mapPaginated(result, <Feature>ResponseDto.fromEntity);
}
```

Rules:
- `@Param('id', PositiveIntPipe) id: number` for ID params.
- `@CurrentUser() <role>: <Role>Entity` only when the audience needs the caller (user scope checks).
- `@HttpCode(HttpStatus.CREATED)` on POST creates.
- Never `@Req()` / `@Res()` — rely on decorators.
- Imports use path aliases.

New controller file (if Phase 1 chose to create one):
- Name: `<audience>-<feature>.controller.ts` (feature is **singular**).
- Class decorators: `@Protected(Role.<AUDIENCE>)`, `@Controller({ path: '<audience>/<plural>', version: '1' })`.
- Add to `controllers:` in `<plural>.module.ts`.

## Phase 5 — i18n keys
For every new `this.translator.tr('<feature>.errors.<key>')`:
- Add to both `infrastructure/i18n/translations/{ar,en}/<feature>.json` (mirrored).
- Run `npm run i18n:sync`.

Prefer existing `common.validation.*` keys over inventing feature-scoped ones.

## Phase 6 — Verify
1. `npm run i18n:sync`
2. `npm run lint`
3. `npm run build`

## Phase 7 — Confirm

```
✓ Added <METHOD> <full route> → <Service>.<method>
✓ Controller: <path-to-controller>
✓ DTO: <path-to-dto>  (or "reused <existing>")
✓ i18n keys added: <feature>.errors.<key> (×N)
✓ lint / build / i18n green

Postman:
- Run /generate-postman-collection <feature> to refresh the collection.
```

## Anti-patterns
- Routes for another entity inside `modules/admin/` — put them in `modules/<that-entity>/controllers/admin-<entity>.controller.ts`.
- Reading another module's repository directly. Go through its service.
- Bypassing DTOs by reading `req.body`.
- Manually throwing English strings without `Translator.tr(...)`.
- `Logger` or `try/catch` not required by a constraint-translation case.
