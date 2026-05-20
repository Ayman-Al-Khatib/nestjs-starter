import { ValidateIf } from 'class-validator';

/**
 * Skip every subsequent class-validator decorator on this property
 * when the incoming value is `undefined`. Use on PATCH-style fields
 * where the field may be omitted from the body but `null` is not a
 * valid value (i.e. non-nullable types).
 *
 * For nullable fields where `null` is a valid "clear the value" signal,
 * use the built-in `@IsOptional()` instead — it skips on both `null`
 * and `undefined`.
 */
export const SkipIfUndefined = () => ValidateIf((_, value) => value !== undefined);
