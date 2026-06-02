---
name: add-i18n-keys
description: Add mirrored Arabic + English translation keys to src/infrastructure/i18n/translations/{ar,en}/<feature>.json, then regenerate translation-keys.ts via npm run i18n:sync. Triggers: "add a translation", a Translator.tr('<key>') call without a matching JSON key, "/add-i18n-keys".
user-invocable: true
argument-hint: <feature> <dot.path> "<ar-value>" "<en-value>" [...more keys]
allowed-tools: Read, Grep, Glob, Write, Edit, Bash
---

# Add i18n Keys

Add one or more translation keys to the AR and EN files for a feature, then run the validator that regenerates the typed key list.

## Arguments
- `<feature>` — namespace == JSON filename (`city`, `area`, `user`, `common`). Snake_case filenames map to dotted keys (`refresh_token.json` → `refresh_token.<...>`).
- `<dot.path>` — key path inside the namespace (`errors.not_found`, `success.created`, `validation.phone.invalid`).
- `<ar-value>` / `<en-value>` — translated strings. Use `{placeholder}` for nestjs-i18n interpolations.
- Additional `<path> <ar> <en>` triplets are accepted to batch.

If the user gave a free-form list, parse it into triplets and confirm once before writing.

## Phase 1 — Validate
1. Confirm both `src/infrastructure/i18n/translations/{ar,en}/<feature>.json` exist.
   - Only one exists → project bug, stop.
   - Neither exists → create both with `{}` and proceed.
2. For each `<dot.path>`, check it doesn't already resolve in either file. If it does, ask before overwriting.
3. Reject placeholders that don't match between AR and EN (`{property}` in one but not the other).

## Phase 2 — Edit the JSON files
For each key:
- Insert into the deepest matching object, preserving existing key order.
- 4-space indentation (match the file's existing style).
- If the parent is alphabetized, insert alphabetically; otherwise append.

Only the JSON node you touch may change. Never reformat the rest.

## Phase 3 — Run the validator

```bash
npm run i18n:sync
```

Validates AR↔EN parity (no orphan keys, identical placeholder sets) and regenerates `src/infrastructure/i18n/translation-keys.ts` (`TranslationKey` union + `TranslationInterpolations` map).

**Never edit `translation-keys.ts` by hand** — it's overwritten on every run.

If validation fails: read the report, fix the JSON (missing mirror key, placeholder typo, JSON parse error), re-run.

## Phase 4 — Verify usage compiles
If the keys are added to support already-written code:

```bash
npm run build
```

The build now type-checks the `Translator.tr('<feature>.<path>')` calls.

## Phase 5 — Confirm

```
✓ Added <N> key(s):
   - <feature>.<path>  →  AR: "<ar>"   EN: "<en>"
   ...

✓ Regenerated infrastructure/i18n/translation-keys.ts
✓ npm run build green
```

## Placeholder conventions
- Property names in validation messages: `{property}` (camelCase DTO property name).
- Min/max constraints: `{min}`, `{max}` — emitted automatically by `Translator.trValMsg(...)`.
- Entity names in messages: bake the noun into the text (`"City not found."`), not a `{entity}` placeholder.

## Anti-patterns
- Editing `infrastructure/i18n/translation-keys.ts`.
- Inventing a feature-specific key when `common.validation.*` or `common.errors.*` covers it.
- Adding a key only to AR or only to EN.
- English copy inside a service file with a TODO to translate later.
