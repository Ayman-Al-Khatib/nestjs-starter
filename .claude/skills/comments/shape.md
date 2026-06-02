# Comments — Shape and length

## Inline (single line)
- One short line, ≤ ~100 chars.
- Sentence case, no trailing period unless the line wraps.
- Above the code, not end-of-line — unless truly trailing context (e.g. labelling a magic number).

```ts
// RESTRICT surfaces the dependency when a referenced city is removed.
@ManyToOne(() => CityEntity, { onDelete: 'RESTRICT' })
city: CityEntity;
```

## Block (multi-line)
- 3–10 lines. More → belongs in a doc comment on the surrounding class.
- Wrap at ~80 chars. Plain prose, no markdown.
- Use `/**` only for doc comments on classes/methods/exports. Use `//` otherwise.

## Doc comments (`/** ... */`)
Allowed on:
- Classes / entities with non-obvious lifecycle or state machine (see `RefreshTokenEntity`).
- Public service methods whose contract has a precondition or ordering requirement.
- Exported utils with subtle input/output shape (e.g. `localDayBoundsToUtc`).

Not allowed on:
- DTO classes — the shape is the contract.
- Controllers — the decorator + path is the contract.
- Trivial getters, 1:1 repo wrappers, self-evident service methods.

## Examples inside comments
One tiny example, ≤4 lines:

```ts
/**
 * Anchors the booking grid to each gap's left edge.
 *
 * Example: gap = [09:00, 11:00), averageVisitMinutes = 30
 *   bookable starts: 09:00, 09:30, 10:00, 10:30
 *   not bookable:    09:15, 09:45 (off-grid)
 */
```

If the example grows, write a spec elsewhere.
