import { z } from 'zod';
import { ENV_BOOLEAN_FALSY, ENV_BOOLEAN_TRUTHY } from '../env.constant';

const ACCEPTED_BOOLEAN_VALUES = [
  ...ENV_BOOLEAN_TRUTHY,
  ...ENV_BOOLEAN_FALSY,
] as const;

/**
 * Parses a string env value into a boolean. Whitelists truthy/falsy
 * keywords (case-insensitive, trimmed) and throws on anything else.
 *
 * Avoids the well-known `z.coerce.boolean()` pitfall where `"false"`
 * coerces to `true` because `Boolean("false") === true` in JavaScript.
 */
export function parseEnvBoolean(value: string): boolean {
  const normalized = value.toLowerCase().trim();
  if ((ENV_BOOLEAN_TRUTHY as readonly string[]).includes(normalized)) return true;
  if ((ENV_BOOLEAN_FALSY as readonly string[]).includes(normalized)) return false;
  throw new Error(
    `Invalid boolean value: "${value}". Expected one of: ${ACCEPTED_BOOLEAN_VALUES.join(', ')}`,
  );
}

/**
 * Zod schema factory for boolean environment variables. Use anywhere
 * a `z.boolean()` is intended for `.env` (which always arrives as a
 * string). Accepts native booleans too, so `.default(false)` works.
 *
 * @example
 *   const schema = z.object({
 *     ENABLE_CACHE: envBoolean(),
 *     DEBUG: envBoolean().default(false),
 *   });
 */
export const envBoolean = () =>
  z.union([z.boolean(), z.string()]).transform((val, ctx) => {
    if (typeof val === 'boolean') return val;
    try {
      return parseEnvBoolean(val);
    } catch (err) {
      ctx.addIssue({
        code: 'custom',
        message: (err as Error).message,
      });
      return z.NEVER;
    }
  });
