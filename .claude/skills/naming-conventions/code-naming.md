# Folders, Files, Classes, Enums, Variables

## Module folders

```
src/modules/<plural-kebab>/
```

Always plural: `clinics`, `appointments`, `doctors`, `medical-records`. Never `clinic/`, never `Clinic/`, never `clinic_module/`. One folder per primary entity.

## Sub-folders

Flat, plural, kebab-case:

```
modules/clinics/
├── clinics.module.ts
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
| Module | `.module.ts` | `clinics.module.ts` |
| Entity | `.entity.ts` | `clinic.entity.ts` |
| Repository | `.repository.ts` | `clinic.repository.ts` |
| Service | `.service.ts` | `clinic.service.ts` |
| Sliced service | `-<slice>.service.ts` | `appointment-booking.service.ts` |
| Controller | `.controller.ts` | `admin-clinic.controller.ts` |
| DTO | `.dto.ts` | `create-clinic.dto.ts` |
| Response DTO | `-response.dto.ts` | `clinic-response.dto.ts` |
| Query DTO | `-query.dto.ts` | `list-clinics-query.dto.ts` |
| Enum | `.enum.ts` | `appointment-status.enum.ts` |
| Interface | `.interface.ts` | `paginated-response.interface.ts` |
| Type alias | `.type.ts` | `slot-instance.type.ts` |
| Pure helper | `.util.ts` | `clinic-time.util.ts` |
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
| Entity | `<Name>Entity` | `ClinicEntity` |
| Repository | `<Name>Repository` | `ClinicRepository` |
| Service (single) | `<Name>Service` | `ClinicService` |
| Service (sliced) | `<Name><Slice>Service` | `AppointmentBookingService` |
| Controller | `<Audience><Name>Controller` | `AdminClinicController` |
| Public controller | `<Name>Controller` (no audience) | only when audience-agnostic |
| DTO (input) | `<Verb><Name>Dto` | `CreateClinicDto` |
| DTO (response) | `<Name>ResponseDto` | `ClinicResponseDto` |
| DTO (query) | `List<NamePlural>QueryDto` | `ListClinicsQueryDto` |
| Module | `<Name>Module` | `ClinicsModule` (matches the **folder**, plural) |
| Pipe | `<Behaviour>Pipe` | `PositiveIntPipe` |
| Guard | `<Reason>Guard` | `JwtAuthGuard`, `RolesGuard` |
| Filter | `<Scope>Filter` | `GlobalExceptionFilter` |
| Interceptor | `<Behaviour>Interceptor` | `TransformInterceptor` |
| Decorator factory | `<Behaviour>` (no suffix) | `Protected`, `CurrentUser` |
| Pure helper | (no class — export functions) | `localDayOf` |

Entity is singular (`Clinic`); list query is collection (`ListClinicsQueryDto`); module matches folder (`ClinicsModule`).

## Interfaces — only for real contracts

- DI/seam contracts: prefix `I` — `IPaginatedResponse`, `IAuthUserResolver`. The `I` signals a swappable seam.
- Shape-only DTOs: no `I` prefix. Use `type`.
- Don't create one-implementation interfaces for testability — `Translator` and `StorageService` are classes.

## Type aliases

- `PascalCase`, no prefix: `MulterFile`, `SlotInstance`, `LocalDay`.
- Use `type` for unions, branded primitives, shape-only DTO inputs.

## Enums

- Enum type: `PascalCase`, singular: `AppointmentStatus`, `Role`, `Gender`.
- Members: `UPPER_SNAKE`: `PENDING`, `WILL_NOT_COME`.
- String values: `snake_case`, matching the PG enum label: `PENDING = 'pending'`.
- Sort enums use `<Domain>Sort` with members like `NEWEST`, `NAME_ASC`, `PRICE_DESC`.

## Variables, parameters, properties

- `camelCase`, descriptive nouns. Avoid one-letter names except loop counters (`i`) or coordinates (`x`, `y`).
- Acronyms: treat as words — `dbHost`, `httpClient`, `jwtPayload`. Not `DBHost`, `HTTPClient`.
- Booleans: `is*` / `has*` / `can*` / `should*` / `was*`.
- Plural for collections: `clinics: ClinicEntity[]`, `slotIds: number[]`.
- Singular for the element: `for (const clinic of clinics)`.
- Unit suffixes when not obvious from type: `durationMs`, `timeoutSeconds`, `priceCents`. (`startTime: Date` doesn't need a suffix.)
- Module-scoped immutable constants: `UPPER_SNAKE`. Locally-scoped consts: `camelCase`.
