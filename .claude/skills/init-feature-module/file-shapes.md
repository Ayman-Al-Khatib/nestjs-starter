# init-feature-module — File shapes

Reserved method/class names: @../naming-conventions/SKILL.md.

## Entity (`<feature>.entity.ts`)
- Class `<Feature>Entity`, `@Entity({ name: '<plural-snake>' })`.
- `@PrimaryGeneratedColumn() id: number;`
- `@CreateDateColumn({ type: 'timestamptz', name: 'created_at' })` + matching `@UpdateDateColumn` (`updated_at`).
- All columns: `snake_case name:`; `timestamptz` for dates.
- FKs: `@ManyToOne(() => Other, { onDelete: 'RESTRICT' })` for record-bearing parents, `'CASCADE'` only for owned children.
- Index hot lookup columns; composite `@Index([...])` for paginated queries.
- Doc comment only for a non-obvious invariant (range semantics, immutability after status X).

## Repository (`<feature>.repository.ts`)
- `@Injectable()`, constructor `@InjectRepository(<Feature>Entity)`.
- Methods: `findById`, `findOneBy<X>`, `findAllBy<X>`, `existsBy<X>`, `create`, `save`, `mergeAndSave`, `deleteById`, `findPageFor<Audience>` / `findPageBy<X>`.
- Never expose raw `Repository<T>`.
- Paginated queries use `paginate(qb, query)` from `core/pagination`.

## Service (`<feature>.service.ts`)
- `@Injectable()`. Inject the repository, `Translator`, cross-feature **services** (never another module's repository).
- Methods: `findByIdOrFail`, `findAllFor<Audience>`, `findPageFor<Audience>`, `createFor<Audience>` / `createBy<Audience>`, `updateFor<Audience>` / `updateBy<Audience>`, `deleteFor<Audience>`, `assert<Constraint>`.
- Never `listFor*` / `getFor*` — see naming-conventions.
- Throw `NotFoundException` / `ForbiddenException` / `ConflictException` with translated messages.
- At ~200 LOC, split by responsibility into focused services — e.g. `<feature>-auth.service.ts` for a login/OTP flow alongside `<feature>.service.ts` for profile/CRUD (see `UserService` / `UserAuthService`).

## DTOs
- `class-validator` + `Translator.trValMsg('common.validation.*')` for messages.
- Numeric IDs: `@Type(() => Number) @IsInt(...) @Min(1, ...)`.
- Strings: `@TrimmedString() @MaxLength(...)` — never raw `@IsString` for names.
- Dates: `@IsUtcIso8601()`.
- `*-response.dto.ts`: plain camelCase fields + `static fromEntity(entity): <Feature>ResponseDto`. Nested DTOs delegate to their own `fromEntity`.
- `list-<plural>-query.dto.ts` extends `PaginationQueryDto` from `core/pagination/dto/`.

## Controllers (`<audience>-<feature>.controller.ts`)
- Class-level `@Protected(Role.<AUDIENCE>)` (or `@Protected()` for any authenticated user; omit for public).
- `@Controller({ path: '<audience>/<plural>', version: '1' })` — `admin/users`, `admin/cities`.
- Inject `<Feature>Service`. Each handler: DTO parse → service call → `<Feature>ResponseDto.fromEntity(result)` (or `mapPaginated(result, ...fromEntity)`).
- Handler names: `findAll(query)`, `findOne(id)`, `create(dto)`, `update(id, dto)`, `remove(id)`. Domain actions use a domain verb (`activate`, `deactivate`, `complete`). Never prefix with `admin*`/`user*`/`public*` — that's in URL + class name.
- `@Post()` → `@HttpCode(HttpStatus.CREATED)`. `@Delete()` → `@HttpCode(HttpStatus.NO_CONTENT)`.
- `@Param('id', PositiveIntPipe)` for ID params.
- User self-data routes that require a completed profile: stack `@RequireCompletedProfile()` above `@Protected(Role.USER)`.

## Module (`<plural>.module.ts`)
- Class `<Plural>Module`.
- `imports: [TypeOrmModule.forFeature([<Feature>Entity]), ...crossFeatureModules]`. Use `forwardRef(() => Other)` only for real circular imports.
- `controllers:` lists every generated controller.
- `providers: [<Feature>Repository, ...services]`.
- `exports:` only if another module will consume `<Feature>Service` / `<Feature>Repository`.
