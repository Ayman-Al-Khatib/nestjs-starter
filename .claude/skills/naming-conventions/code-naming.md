# Folders, Files, Classes, Enums, Variables

## Module folders

```
src/modules/<plural-kebab>/
```

Always plural: `cities`, `areas`, `users`, `refresh-tokens`. Never `city/`, never `City/`, never `city_module/`. One folder per primary entity.

## Sub-folders

Flat, plural, kebab-case:

```
modules/cities/
├── cities.module.ts
├── controllers/
├── dto/
├── entities/
├── enums/
├── policies/        # optional
├── repositories/
├── seeders/         # optional
├── services/
└── utils/           # optional
```

Never nest under `api/`, `application/`, `domain/`, `infrastructure/`.

## File names — kebab-case, singular, role suffix

| Role | Suffix | Example |
|---|---|---|
| Module | `.module.ts` | `cities.module.ts` |
| Entity | `.entity.ts` | `city.entity.ts` |
| Repository | `.repository.ts` | `city.repository.ts` |
| Service | `.service.ts` | `city.service.ts` |
| Sliced service | `-<slice>.service.ts` | `user-auth.service.ts` |
| Controller | `.controller.ts` | `admin-user.controller.ts` |
| DTO | `.dto.ts` | `create-city.dto.ts` |
| Response DTO | `-response.dto.ts` | `city-response.dto.ts` |
| Query DTO | `-query.dto.ts` | `list-users-admin-query.dto.ts` |
| Enum | `.enum.ts` | `otp-purpose.enum.ts` |
| Interface | `.interface.ts` | `paginated-response.interface.ts` |
| Type alias | `.type.ts` | `paginated-result.type.ts` |
| Pure helper | `.util.ts` | `timezone.util.ts` |
| Pipe | `.pipe.ts` | `positive-int.pipe.ts` |
| Guard | `.guard.ts` | `jwt-auth.guard.ts` |
| Decorator | `.decorator.ts` | `current-user.decorator.ts` |
| Filter | `.filter.ts` | `global-exception.filter.ts` |
| Interceptor | `.interceptor.ts` | `transform.interceptor.ts` |
| Middleware | `.middleware.ts` | `camel-case.middleware.ts` |
| Migration | `<ts>-<Name>.ts` | `1747600000001-Init.ts` |
| Seeder | `.seeder.ts` | `city.seeder.ts` |
| Constant module | `.constants.ts` | `i18n.constants.ts` |

Singular file, singular class. Folders are plural; the file inside is singular. Exception: `list-<plural>-query.dto.ts` (the list covers many).

## Classes — PascalCase, singular, role suffix

| Class kind | Pattern | Example |
|---|---|---|
| Entity | `<Name>Entity` | `CityEntity` |
| Repository | `<Name>Repository` | `CityRepository` |
| Service (single) | `<Name>Service` | `CityService` |
| Service (sliced) | `<Name><Slice>Service` | `UserAuthService` |
| Controller | `<Audience><Name>Controller` | `AdminUserController` |
| Public controller | `<Name>Controller` (no audience) | only when audience-agnostic |
| DTO (input) | `<Verb><Name>Dto` | `CreateCityDto` |
| DTO (response) | `<Name>ResponseDto` | `CityResponseDto` |
| DTO (query) | `List<NamePlural>QueryDto` | `ListUsersAdminQueryDto` |
| Module | `<Name>Module` | `CitiesModule` (matches the **folder**, plural) |
| Pipe | `<Behaviour>Pipe` | `PositiveIntPipe` |
| Guard | `<Reason>Guard` | `JwtAuthGuard`, `RolesGuard` |
| Filter | `<Scope>Filter` | `GlobalExceptionFilter` |
| Interceptor | `<Behaviour>Interceptor` | `TransformInterceptor` |
| Decorator factory | `<Behaviour>` (no suffix) | `Protected`, `CurrentUser` |
| Pure helper | (no class — export functions) | `localDayOf` |

Entity is singular (`City`); list query is collection (`ListUsersAdminQueryDto`); module matches folder (`CitiesModule`).

## Interfaces — only for real contracts

- DI/seam contracts: prefix `I` — `IPaginatedResponse`, `IAuthUserResolver`. The `I` signals a swappable seam.
- Shape-only DTOs: no `I` prefix. Use `type`.
- Don't create one-implementation interfaces for testability — `Translator` and `StorageService` are classes.

## Type aliases

- `PascalCase`, no prefix: `MulterFile`, `StoredFile`, `UploadInput`.
- Use `type` for unions, branded primitives, shape-only DTO inputs.

## Enums

- Enum type: `PascalCase`, singular: `Role`, `Gender`, `OtpPurpose`.
- Members: `UPPER_SNAKE`: `ADMIN`, `USER`, `USER_LOGIN`.
- String values: `snake_case`, matching the PG enum label: `USER = 'user'`.
- Sort enums use `<Domain>Sort` with members like `NEWEST`, `NAME_ASC`, `PRICE_DESC`.

## Variables, parameters, properties

- `camelCase`, descriptive nouns. Avoid one-letter names except loop counters (`i`) or coordinates (`x`, `y`).
- Acronyms: treat as words — `dbHost`, `httpClient`, `jwtPayload`. Not `DBHost`, `HTTPClient`.
- Booleans: `is*` / `has*` / `can*` / `should*` / `was*`.
- Plural for collections: `cities: CityEntity[]`, `areaIds: number[]`.
- Singular for the element: `for (const city of cities)`.
- Unit suffixes when not obvious from type: `durationMs`, `timeoutSeconds`, `priceCents`. (`startTime: Date` doesn't need a suffix.)
- Module-scoped immutable constants: `UPPER_SNAKE`. Locally-scoped consts: `camelCase`.
