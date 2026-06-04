---
name: add-protected-controller
description: Generate a new role-scoped controller for an existing module (e.g. admin-foo.controller.ts next to user-foo.controller.ts). Wires @Protected(Role.X), the path/version, and registers in the module. Triggers: "expose this module to admins/users", "add an admin controller for <module>", "/add-protected-controller".
user-invocable: true
argument-hint: <module> <Role> [--path <segment>] [--public]
allowed-tools: Read, Grep, Glob, Write, Edit, Bash
---

# Add Protected Controller

Generate a new audience-scoped controller for an existing module. Controller is thin — it delegates to the existing service.

## Arguments
- `<module>` — existing folder under `src/modules/` (kebab-case).
- `<Role>` — one of the values in `domain/enums/role.enum.ts` (`ADMIN`, `USER`). Uppercase, even though the enum value is lowercase.
- `--path <segment>` — override the URL prefix. Default: `<role>/<module>s` (`admin/cities`, `admin/users`).
- `--public` — drop `@Protected(...)` for unauthenticated controllers (rare; public listings like cities/areas).

## Phase 1 — Validate
1. `Glob src/modules/<module>/` — confirm it exists.
2. Confirm `Role.<Role>` is defined in `domain/enums/role.enum.ts`. If missing, stop and ask whether to extend the enum.
3. Reference style: `users/controllers/admin-user.controller.ts` (or another sibling).
4. If `<role>-<module>.controller.ts` already exists, abort and suggest `/add-endpoint`.

## Phase 2 — Decide the surface area
Ask once for the endpoint set unless the user specified them. Typical defaults:
- `admin/<module>s` — `POST /`, `GET /`, `GET /:id`, `PATCH /:id`, `DELETE /:id`.
- `user/<module>s` — scoped reads + a single self-service mutation (e.g. `complete-profile`, `update`).

If the existing service has no audience-scoped methods for this role, stop and route to `/add-endpoint` per route — don't fabricate service methods here.

## Phase 3 — Generate the controller

`src/modules/<module>/controllers/<role-lower>-<module>.controller.ts`:

```ts
import { Protected } from 'core/decorators/protected.decorator';
import { CurrentUser } from 'core/decorators/current-user.decorator';
import { Role } from 'domain/enums/role.enum';
import { PositiveIntPipe } from 'core/pipes/positive-int.pipe';
import { mapPaginated } from 'core/pagination/paginate.util';
import { IPaginatedResponse } from 'core/pagination/interfaces/paginated-response.interface';

@Protected(Role.<ROLE>)
@Controller({ path: '<role-lower>/<module>s', version: '1' })
export class <Role><Module>Controller {
  constructor(private readonly <module>Service: <Module>Service) {}

  // handlers delegate to *For<Role> / *By<Role> service methods.
}
```

Rules:
- `Role.USER` routes that need a completed profile: stack `@RequireCompletedProfile()` above `@Protected(Role.USER)`.
- Caller-entity routes: `@CurrentUser() <role>: <Role>Entity`.
- Handlers return DTO instances or `IPaginatedResponse<DTO>` via `mapPaginated(result, <Dto>.fromEntity)`.
- POST creates: `@HttpCode(HttpStatus.CREATED)`.
- ID params: `PositiveIntPipe`.
- `--public`: omit `@Protected(...)` and any `@CurrentUser()` params.

## Phase 4 — Wire the module
Edit `src/modules/<module>/<module>.module.ts`:
- Import the new controller class.
- Append it to `controllers:` (preserve order).

## Phase 5 — i18n stub (if needed)
For role-specific errors, run `/add-i18n-keys <module> errors.<key> "<ar>" "<en>"`. For generic "not allowed" cases, prefer `common.errors.forbidden` / `common.errors.unauthorized`.

## Phase 6 — Verify
1. `npm run lint`
2. `npm run build`

## Phase 7 — Confirm

```
✓ Controller: src/modules/<module>/controllers/<role>-<module>.controller.ts
✓ Path: /api/v1/<role>/<module>s (role-gated by @Protected(Role.<ROLE>))
✓ Wired into <Module>Module.controllers[]
✓ lint / build green

Next:
- Add endpoints via /add-endpoint <module> <METHOD> <path> --audience <role>
- Refresh Postman: /generate-postman-collection <module>
```

## Anti-patterns
- Admin routes inside `modules/admin/`. They belong in the entity's own module.
- Inlining business logic — controller must call the service.
- Forging service methods that don't exist yet — route to `/add-endpoint`.
- Mixing audiences in one controller class via runtime role checks. One controller per audience.
- Skipping `version: '1'` — every API controller is versioned.
