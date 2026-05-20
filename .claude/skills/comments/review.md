# Comments — Review, templates, usage modes

## Review checklist
For every comment in a PR:
1. Removable without breaking readability? → delete.
2. Restates the code? → delete.
3. References git history, ticket, caller, or self? → delete.
4. Restates a type? → delete.
5. Explains a WHY not encoded elsewhere? → keep.
6. Says "should never happen" without proof? → fix the code, not the comment.
7. Longer than 3 sentences in a block? → trim.

A typical PR removes more comments than it adds.

## Templates

Invariant:
```ts
// <Subject> is <invariant>. <One-sentence consequence if violated.>
```

Choice rationale:
```ts
// <Choice> (not <alternative>): <one-sentence reason tied to a real consequence>.
```

Subtle semantics with example:
```ts
/**
 * <Short statement of the rule.>
 *
 * Example: <input> → <output>
 */
```

TODO:
```ts
// TODO(<scope>): <action> after <trigger / date / condition>.
```

FIXME:
```ts
// FIXME(<scope>): <symptom> — <leading hypothesis or workaround>.
```

## Skill usage modes
- `check <path>` — list every comment that violates a rule, with rule number and recommendation (`delete`, `shorten`, `rewrite as WHY`, `move to docstring`). No edits.
- `explain <symbol>` — propose the minimum comment (or rename) that would have prevented the question.
- No args — print decision flow + when-justified, stop.

Never add comments silently while doing other work. If a reviewer suggests a comment, run it through the decision flow first.
