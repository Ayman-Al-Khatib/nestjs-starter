---
name: circular-deps
description: Diagnose and break a circular dependency between NestJS modules or providers — without reaching for forwardRef. Triggers: Nest "circular dependency" / "can't resolve dependencies" startup error, "ModuleA imports ModuleB and back", a new cross-module service injection, "how do I avoid a cycle", "/circular-deps".
user-invocable: true
argument-hint: "[<ModuleA> <ModuleB>] | [check]"
allowed-tools: Read, Grep, Glob, Bash
---

# Break a Circular Dependency

The module graph is a **DAG**: `feature → shared/lookup`, never back (CLAUDE.md "Dependency direction"). A cycle means an edge points the wrong way — re-cut the layering, don't freeze it with `forwardRef`.

One-way edges today: `areas→cities`, `users→{cities,otps,refresh-tokens}`, `admins→refresh-tokens`, `whatsapp` standalone.

## Modes
- `<ModuleA> <ModuleB>` — break the named cycle.
- `check` — scan for existing escapes and back-edges: `Grep "forwardRef"`, then map module `imports:` to spot a backward edge before it ships.

## 1. Recognize
NestJS fails at **startup** (not compile time) with one of:
- **Module-level:** `A circular dependency between modules ... ModuleA -> ModuleB -> ModuleA`.
- **Provider-level:** `Nest can't resolve dependencies of the X (?). ...` — the `?` marks the cyclic provider.

An existing `forwardRef` is a smell, not a fix — treat it as a cycle still waiting to be re-cut.

## 2. Find the edge
Map the imports of both modules (`Grep "imports:" src/modules/<m>/<m>.module.ts`). The offender is the **backward** edge — a shared/lookup module importing a feature that consumes it. Remove that edge; never reinforce it.

## 3. Fix ladder — first that applies; `forwardRef` is last
1. **Re-check direction.** A method likely sits on the wrong service. Relocate it to the side that already owns the dependency — let the user side read cities; never make `CityService` call `UserService`.
2. **Extract a leaf.** Move the shared piece *down* into a module both depend on — a lookup module, or `core/`/`domain/` (which import no feature). Both sides then point downward and the cycle dissolves.
3. **Invert via a seam.** Let the downstream module reach a caller without importing it:
   - **Registry** — this repo's own pattern: `UserResolverRegistry` lets `JwtAuthGuard` resolve any role without importing role modules; each role module self-registers in `onModuleInit`. Mirror it whenever core/a guard needs a feature. See `core/auth/user-resolver.registry.ts`.
   - **Events** — emit a domain event and subscribe on the other side; no import edge either way.
4. **Facade.** A higher module imports both leaves and orchestrates them, so neither leaf imports the other.
5. **`forwardRef` — last resort.** Only for genuinely mutually-recursive providers when 1–4 don't apply. Required on **both** sides:
   ```ts
   imports: [forwardRef(() => OtherModule)]                                           // module
   constructor(@Inject(forwardRef(() => OtherService)) private readonly other: OtherService) {} // provider
   ```
   Pair it with a one-line WHY comment naming the rejected alternative (comments rule). An unexplained `forwardRef` fails review.

## 4. Verify
`npm run build`, then boot once (`npm run start:dev`) — a surviving cycle throws at bootstrap, so compile-green is not enough.

## Anti-patterns
- `forwardRef` as the first move — freezes the layering bug instead of fixing it.
- Escaping the cycle by importing the other module's **repository** — trades a cycle for a boundary violation.
- A "shared" module that imports features — it must stay a leaf.
- Two services mutating each other's state across the boundary — give the shared state its own owner.
