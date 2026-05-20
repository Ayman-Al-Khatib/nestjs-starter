---
name: generate-postman-collection
description: Generate or update a Postman Collection v2.1.0 JSON for a single module. The collection lives at `src/modules/<module>/postman/<module>.postman_collection.json`. Triggers "generate postman collection for X", "/generate-postman-collection <module>".
user-invocable: true
argument-hint: <module>
allowed-tools: Read, Grep, Glob, Write, Edit
---

# Generate Postman Collection

One collection per module. Output path is fixed:

```
src/modules/<module>/postman/<module>.postman_collection.json
```

If the file exists → update it. If not → create the `postman/` folder and write a new file.

## Phase 1 — Locate the module
1. `Glob src/modules/<module>/` — confirm it exists. If not, stop.
2. Read every `controllers/*.controller.ts` in the module. Each handler = one request.
3. Read the matching DTO for each handler's body / query.

## Phase 2 — Build the collection

- **Collection name:** `<Module>` (PascalCase, e.g. `Appointments`).
- **One folder per controller** (e.g. `Admin`, `Doctor`, `Patient`, `Public`). Folder name = audience prefix.
- **Request name:** action verb in title case (`Create`, `Update`, `Cancel`, `Find One`, `Find All`).
- **Request order inside a folder:** Create → Update → Custom actions → Delete → Find All → Find One. Skip what doesn't exist.

## Phase 3 — Request shape

Every request uses `{{base_url}}` and the controller's full path (`/api/v1/<role>/<plural>`).

### Auth block
- `@Protected(Role.ADMIN)` → `{{admin_access_token}}`
- `@Protected(Role.DOCTOR)` → `{{doctor_access_token}}`
- `@Protected(Role.PATIENT)` → `{{patient_access_token}}`
- `@RequireCompletedProfile()` stacked on top → same token as the role under it.
- No `@Protected` → omit `auth` entirely.

```json
"auth": {
  "type": "bearer",
  "bearer": [{ "key": "token", "value": "{{<role>_access_token}}", "type": "string" }]
}
```

### Body
- `POST` / `PATCH` / `PUT` → `mode: "raw"`, JSON body filled from the DTO. Required fields populated with realistic examples; optional fields explicit `null`. `options: { raw: { language: "json" } }`.
- `GET` / `DELETE` → no `body`.
- File upload DTOs (`@UploadedFile`, `@UploadedFiles`) → `mode: "formdata"`, each file field with `type: "file"`, text fields with `type: "text"`. Add a short `description` per field (allowed mime types, size limit).

### URL
- `url.raw`: `{{base_url}}/api/v1/<full-path>`
- `url.path`: split into segments (array).
- Path params → use the Postman colon style `:<param>` in `url.raw` and `url.path`, plus a matching `url.variable` entry. **Never** use `{{<param>}}` for path params — `{{...}}` is reserved for environment variables (tokens, base_url). The controller's parameter name is the variable name (`:cityId`, not `:id`, when the handler reads `@Param('cityId')`).

- Query DTO fields → `url.query`: `{ "key": "...", "value": "...", "disabled": false }`. Pagination: `?page=1&limit=10`.

### Example values by type
Use realistic examples — never `"string"` or `0`:

| Type | Example |
|---|---|
| `number` ID | `1` |
| `string` name (EN) | `"Downtown Clinic"` |
| `string` name (AR) | `"عيادة وسط البلد"` |
| Phone (SY) | `"+963944123456"` |
| Date / DateTime (ISO-8601) | `"2026-06-15T10:00:00.000Z"` |
| Time-of-day | `"10:30"` |
| `boolean` | `true` |
| Enum | first valid value from the enum file |
| Email | `"user@example.com"` |
| UUID | `"550e8400-e29b-41d4-a716-446655440000"` |
| Coordinate | realistic lat/lng |

### Request description (markdown)

```markdown
### Auth
Bearer `{{<role>_access_token}}` — required ({Role} role)
(or: None — public)

### Input
| Field | Type | Required | Description |
|---|---|---|---|
| ... | ... | YES / Optional / Conditional | ... |

### Validation        <!-- only when class-validator rules are non-trivial -->
| Field | Rule |
|---|---|
| ... | ... |

### Notes             <!-- only when behavior is non-obvious -->
Short paragraph (cascade effects, immutable fields, idempotency, side effects).

### Errors
| Code | Reason |
|---|---|
| 401 | Missing/expired access token |
| 403 | Insufficient role |
| 404 | Not found |
| 409 | Conflict (...) |
| 422 | Validation failed |
```

Rules:
- `### Auth` and `### Errors` are mandatory.
- `### Input` mandatory unless the request takes no args (then `None — <reason>`).
- Drop `401` / `403` for public endpoints.
- Include `422` for any request with a body DTO.

## Phase 4 — Event scripts

Attach only to auth-issuing / refresh / logout endpoints.

### Login / OTP verify (saves tokens by role)

```json
"event": [{
  "listen": "test",
  "script": {
    "exec": [
      "const r = pm.response.json();",
      "const p = r?.data || r;",
      "const role = (p?.user?.role || 'user').toString().toLowerCase();",
      "if (p?.accessToken)  pm.environment.set(`${role}_access_token`,  p.accessToken);",
      "if (p?.refreshToken) pm.environment.set(`${role}_refresh_token`, p.refreshToken);"
    ],
    "type": "text/javascript"
  }
}]
```

### Refresh (updates access token only)

```json
"event": [{
  "listen": "test",
  "script": {
    "exec": [
      "const r = pm.response.json();",
      "const p = r?.data || r;",
      "const role = (p?.user?.role || 'user').toString().toLowerCase();",
      "if (p?.accessToken) pm.environment.set(`${role}_access_token`, p.accessToken);"
    ],
    "type": "text/javascript"
  }
}]
```

### Logout (clears tokens for the role)

```json
"event": [{
  "listen": "test",
  "script": {
    "exec": [
      "if (pm.response.code >= 200 && pm.response.code < 300) {",
      "  const role = pm.environment.get('active_role') || 'user';",
      "  pm.environment.unset(`${role}_access_token`);",
      "  pm.environment.unset(`${role}_refresh_token`);",
      "}"
    ],
    "type": "text/javascript"
  }
}]
```

## Phase 5 — Write or update

1. `Glob src/modules/<module>/postman/<module>.postman_collection.json`
2. **Exists:**
   - Read it. Keep its `_postman_id`.
   - Merge: add new requests, remove stale ones, update changed bodies / paths / descriptions.
   - Preserve any user-added `event` scripts on existing requests.
3. **Missing:**
   - Create the `postman/` folder.
   - Generate a fresh `_postman_id` (v4 UUID).
   - Write the full file.

## Collection skeleton

```json
{
  "info": {
    "_postman_id": "<uuid-v4>",
    "name": "<Module>",
    "description": "## <Module>\n\n### Base URL\n`{{base_url}}/api/v1`\n\n### Authentication\nProtected endpoints require `Authorization: Bearer {{<role>_access_token}}`.\n\n### Environment Variables\n| Variable | Description |\n|---|---|\n| `base_url` | API base URL |\n| `admin_access_token` | Admin JWT (auto-set on login) |\n| `doctor_access_token` | Doctor JWT (auto-set on login) |\n| `patient_access_token` | Patient JWT (auto-set on login) |",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Admin",
      "description": "Admin endpoints for <module>.",
      "item": [ /* requests */ ]
    }
  ]
}
```

## Phase 6 — Validate before writing
1. Valid JSON (all strings properly escaped: `\n`, `\"`, `\\`).
2. `_postman_id` is a valid v4 UUID.
3. Every folder has a `description`.
4. Every request description has `### Auth` and `### Errors`.
5. Every protected request has a correct `auth` block; public requests omit `auth`.
6. `header: []` unless a non-auth header is required.
7. Request order inside each folder matches Phase 2.
8. Path params use `:<param>` (with matching `url.variable`), never `{{<param>}}`. Grep the file for `{{` — only `{{base_url}}` and `{{<role>_access_token}}` are allowed inside URLs.

## Phase 7 — Confirm

```
✓ <created|updated>: src/modules/<module>/postman/<module>.postman_collection.json
✓ Folders: <Admin|Doctor|Patient|Public> (N requests total)
```

## Rules
- One collection per module — never a project-wide file.
- Path is always `src/modules/<module>/postman/<module>.postman_collection.json`.
- Never invent endpoints that aren't in the controllers.
- Update existing collections in place; don't rewrite from scratch when a file is already there.
