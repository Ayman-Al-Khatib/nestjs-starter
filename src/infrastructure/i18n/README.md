# i18n

Localized error/success/validation strings, with a generated key union
so missing translations fail the TypeScript build, not production.

## Layers

```
translations/{ar,en}/<namespace>.json    ← source of truth
              │
              ▼  npm run i18n:sync
translation-keys.ts                       ← generated TranslationKey union
              │
              ▼
Translator (DI)                           ← reads I18nContext, picks language
        ▲
        │
nestjs-i18n                               ← QueryResolver | AcceptLanguage | x-lang
```

- **`app-i18n.module.ts`** — `@Global()`. Registers `Translator` and
  wires the three resolvers (in order):
  1. `?lang=ar|en`
  2. `Accept-Language` header
  3. `x-lang` header
- **`i18n.service.ts`** — the `Translator` class. The only thing
  feature code injects.
- **`translation-keys.ts`** — **auto-generated**. Never edit by hand.
- **`translations/{ar,en}/<namespace>.json`** — mirrored AR + EN files.
  One namespace per feature plus `common`, `auth`, `notification`, etc.

## Configuration

No env vars. Default language is `'en'` (see `i18n.constants.ts`).

## Translator API

```ts
constructor(private readonly translator: Translator) {}

// Plain key
this.translator.tr('city.errors.not_found');

// With placeholders — the second arg is type-checked against the key
this.translator.tr('otp.errors.resend_cooldown', { seconds: 30 });

// In code without DI (Transform callbacks, decorators)
Translator.trStatic('common.errors.unauthorized');

// Validation messages for class-validator
@MinLength(3, { message: Translator.trValMsg('common.validation.min_length') })
firstName: string;
```

`trValMsg` injects `{property}`, `{min}`, and `{max}` automatically from
the class-validator arguments and resolves `{property}` via the `keys.*`
namespace so DTO field labels stay localized.

## Adding keys

Use the [`/add-i18n-keys`](../../../.claude/skills/add-i18n-keys/SKILL.md)
skill, or by hand:

1. Edit **both** `translations/ar/<feature>.json` and
   `translations/en/<feature>.json`. Keys, placeholders, and structure
   must mirror exactly.
2. Run:

   ```bash
   npm run i18n:sync
   ```

3. Build: the new `'<feature>.<path>'` literal will now type-check in
   `Translator.tr(...)` calls.

If parity is broken (orphan key, mismatched `{placeholder}`, JSON parse
error), the script fails with a per-language report and a non-zero exit.

## Why `translation-keys.ts` is generated

Hand-written union types drift. The generator scans every JSON file and
produces:

- `TranslationKey` — exhaustive string-literal union of every dotted key.
- `TranslationInterpolations` — per-key required placeholder map (so
  `tr('otp.errors.resend_cooldown')` without `{seconds}` is a type
  error).

Editing the file by hand is overwritten on every `i18n:sync`. See
[`../../scripts/`](../../scripts/README.md) for the generator internals.
