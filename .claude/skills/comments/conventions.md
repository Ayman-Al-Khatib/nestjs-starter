# Comments — Project conventions

## Voice
Present tense, third person, declarative.
- "Loaded only when the query joins it." ✅
- "I load this only when…" ❌
- "TODO: we should load this only when…" ❌

## Section dividers in large files
Files with 3+ distinct sections (Lookup, Mutations, Listing, Transitions) use dashed comments:

```ts
// ---------- Lookup ----------

findByIdOrFail(id: number): Promise<CityEntity> { … }

// ---------- Mutations ----------

createForAdmin(dto: CreateCityDto) { … }
```

Exact form: `// ---------- <Section> ----------` (10 dashes each side, single space, Title Case). Don't decorate small files.

## i18n keys
Never inline-document an i18n key. The translation JSON is the source of truth.

```ts
// ❌
// "City not found" — used when the city id is invalid
throw new NotFoundException(this.translator.tr('city.errors.not_found'));

// ✅
throw new NotFoundException(this.translator.tr('city.errors.not_found'));
```

## Migrations
`up()` may carry one top-of-method block comment, only when the class name isn't self-explanatory. `CreateCities` → none. `AddUserSearchIndexesAndUnifyPhoneLength` → one.

## Decorators
Never paraphrase a decorator stack. `@Protected(Role.ADMIN)` is the comment.

## Tests
- Test name states behaviour: `it('rejects a duplicate city name')`.
- One comment above `arrange` only when setup encodes a non-obvious business scenario.
