import { ValidationOptions } from 'class-validator';
import { comparePropertyDecorator } from './compare-with-property.util';

/**
 * Validates that this field's value is strictly greater than the value
 * of `property` on the same DTO. Uses JavaScript's relational `>`, so
 * it works for numbers as well as lexicographically-ordered strings
 * (ISO dates `YYYY-MM-DD`, times `HH:mm`, etc.).
 *
 * Returns `true` whenever either side is `null` / `undefined`, which
 * lets the decorator compose cleanly with `@IsOptional` and
 * `@SkipIfUndefined`.
 *
 * @example
 *   class WeeklySlotDto {
 *     @IsTimeHHMM() startTime: string;
 *     @IsTimeHHMMOrEndOfDay()
 *     @IsGreaterThan('startTime') endTime: string;
 *   }
 */
export function IsGreaterThan(property: string, validationOptions?: ValidationOptions) {
  return comparePropertyDecorator(
    {
      decoratorName: 'isGreaterThan',
      op: 'gt',
      defaultMessageKey: 'common.validation.greater_than.invalid',
    },
    property,
    validationOptions,
  );
}
