---
name: comments
description: Apply when writing, reviewing, or removing comments. Triggers: /comments, "should I comment this", "is this comment good", "explain why this code does X".
user-invocable: true
argument-hint: "[check <path>] | [explain <symbol>]"
allowed-tools: Read, Grep, Glob, Edit
---

# Comments

Default: **no comment**. A comment that explains a *what* readers deduce from names + types must be deleted or replaced by a better name.

> Comments explain WHY. Never WHAT.

## Decision flow
- Obvious from names + types? → no comment
- *What* obvious, *why* hidden? → maybe
- Better name would fix it? → rename instead
- *Why* comes from a hidden constraint (FK choice, race, business rule, workaround)? → comment justified
- Algorithm/semantics genuinely tricky? → comment + tiny example
- Still in doubt? → don't comment

## When a comment IS justified
Six categories. Anything outside → delete.

1. **Non-obvious invariants.** Data property the code relies on but doesn't enforce locally.
   _"endTime is computed at booking time and frozen on the row."_
2. **Choice rationale where the alternative is plausible.** Always pair with the rejected option.
   _"RESTRICT (not CASCADE): hard-deleting a doctor must surface the dependency, not silently wipe history."_
3. **Subtle semantics + tiny example.** Reserve for math/time/concurrency.
   _"Half-open `[start, end)` — 10:00–10:30 and 10:30–11:00 touch but never overlap."_
4. **External / business constraints.** Regulation, partner API, ops decision. Name the constraint, not the ticket.
   _"Wallet operations must run inside a SERIALIZABLE transaction."_
5. **Surprising behaviour readers will misread.**
   _"Returns null (not throws) when the photo key is empty — callers rely on null for default avatar."_
6. **TODO/FIXME with concrete follow-up.** `// TODO(<scope>): <action> after <trigger>` / `// FIXME(<scope>): <symptom>`. Never `// TODO: fix later`.

## Delete on sight
- Restating the code (`// increment counter` above `counter++`).
- Naming the caller or current task (`// used by the patient booking flow`, `// added for ticket NEST-417`).
- History (`// removed legacy retry block`, `// was 30s before`). Git knows.
- Closing-brace labels (`} // end of if`).
- Section banners with no payload (`// ===== HELPERS =====`).
- `@author` / `@since` / `@version` tags.
- Apologies / chatter (`// sorry this is ugly`).
- Commented-out code.
- Arabic gloss of English identifiers.
- Type restatement (`// returns a number` above `: number`).
- Defensive narration (`// this should never happen` — prove it can't and remove the throw).

## Details (load on demand)
- Shape, length, doc comments → @shape.md
- Project-specific conventions (voice, dividers, i18n, migrations, decorators, tests) → @conventions.md
- Review checklist + templates + usage modes → @review.md

## See also
- @../naming-conventions/SKILL.md — better names usually replace comments

Related memory: [[feedback_no_unrequested_logger]], [[feedback_translation_keys]].
