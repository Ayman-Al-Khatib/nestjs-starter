# Core

Cross-cutting NestJS plumbing: guards, decorators, interceptors,
middlewares, filters, pipes, and pagination. Nothing here knows about
a specific feature — that lives in `modules/`.

```
core/
├── auth/           # AuthUserResolver registry + common-auth module
├── decorators/     # @Protected, @CurrentUser, validation decorators, ...
├── filters/        # Global exception filter + per-error handlers
├── guards/         # JwtAuthGuard, ProfileCompletionGuard
├── interceptors/   # Transform (response envelope), snake-case, UTC dates
├── middlewares/    # camelCase body, parseQuery
├── pagination/     # paginate() util + DTOs + interfaces
└── pipes/          # PositiveIntPipe
```

## Auth — `@Protected()` flow

The whole role-aware auth pipeline lives here so a feature module never
imports another feature's repository to "look up the user."

```
@Protected(Role.USER)
    │
    ▼
JwtAuthGuard
  1. Extract Bearer token
  2. AppJwtService.verifyAccessToken(token)   ── infrastructure/jwt
  3. Coerce payload.role to Role
  4. Assert it's in the controller's allow-list
  5. UserResolverRegistry.get(role).findByIdForAuth(userId)
  6. request.user = <UserEntity | AdminEntity>
```

### Registry pattern

`UserResolverRegistry` (`auth/user-resolver.registry.ts`) is a
process-wide `Map<Role, AuthUserResolver>`. Each role-owning module
registers its service in `onModuleInit`:

```ts
// In UsersModule
onModuleInit() {
  this.userResolvers.register(Role.USER, this.userService);
}
```

The guard reads from the registry, so it never imports a role's
repository or module — one guard serves every role without circular
deps.

### Variants

- `@Protected()` — any authenticated principal.
- `@Protected(Role.X)` / `@Protected(Role.X, Role.Y)` — allow-list.
- `@RequireCompletedProfile()` — stacks `ProfileCompletionGuard` after
  `JwtAuthGuard`. Used for `Role.USER` flows that require a completed
  profile (`isProfileCompleted === true`) before proceeding.

## Pagination

`PaginationQueryDto` + `paginate(qb, opts)` + `mapPaginated(result, fn)`.
The repository owns the query, the service shapes the entity into a
response DTO:

```ts
// repository
findPageForAdmin(query: ListUsersAdminQueryDto) {
  const qb = this.repo.createQueryBuilder('u').orderBy('u.id', 'DESC');
  return paginate(qb, query);
}

// controller
const result = await this.userService.findPageForAdmin(query);
return mapPaginatedAsync(result, (user) => this.userService.buildResponseDto(user));
```

Use `mapPaginatedAsync` when the mapper awaits (e.g. storage URL signing).

`page` / `limit` are clamped to safe bounds (`page >= 1`, `1 <= limit <= MAX_LIMIT`)
inside `paginate()` so seeders and background jobs can call it safely too.

## Filters

`GlobalExceptionFilter` builds the `{ statusCode, error, message, context? }`
envelope and delegates per-error work to a handler picked by
`ErrorHandlerFactory`:

| Handler                   | Catches                                                  |
| ------------------------- | -------------------------------------------------------- |
| `HttpExceptionHandler`    | Nest `HttpException` subclasses                          |
| `I18nValidationErrorHandler` | `class-validator` errors via `nestjs-i18n`            |
| `TypeOrmErrorHandler`     | Postgres constraint violations → domain exceptions       |
| `JwtErrorHandler`         | `jsonwebtoken` errors                                    |
| `MulterErrorHandler`      | Upload errors                                            |
| `FallbackErrorHandler`    | Anything else → safe 500                                 |

The `context` block (path, method, stack) is included only when
`NODE_ENV=development` **and** the request didn't opt out via
`x-developer-mode: false`.

Query strings are stripped before logging — they can carry signed-URL
tokens or OTP codes.

## Interceptors

- `TransformInterceptor` — wraps successful responses as
  `{ data, pagination? }`.
- `SnakeCaseInterceptor` — converts response keys to snake_case.
- `UtcDateSerializerInterceptor` — every `Date` is serialized as a UTC
  ISO-8601 string. The process is forced into UTC in `main.ts`.

## Middlewares

- `CamelCaseMiddleware` — converts request bodies from snake_case to
  camelCase before class-validator runs. Bodies accept either case.
- `ParseQueryMiddleware` — normalizes query parsing (arrays via repeated
  keys, booleans).

## Decorators

A small library of class-validator + Nest helpers. The naming
decorators (`@TrimmedString`, `@SyriaPhone`, `@IsTimeHHMM`, ...) all
emit localized messages via `Translator.trValMsg` so error responses
remain language-aware. See the file names — each is one purpose.

## Adding a new cross-cutting piece

Anything **not feature-specific** belongs here. If you need to import a
feature's service to make it work, it's not core — keep it in that
feature's module.
