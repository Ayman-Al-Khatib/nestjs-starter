import { ValidationOptions } from 'class-validator';
import { comparePropertyDecorator } from './compare-with-property.util';

/**
 * Validates that this field's value is greater than OR equal to the
 * value of `property` on the same DTO. Mirrors `IsGreaterThan` but
 * uses `>=`, so it accepts equality (useful for range filters where
 * `min === max` is a valid single-point range).
 *
 * Returns `true` whenever either side is `null` / `undefined`.
 *
 * @example
 *   class PriceRangeQueryDto extends PaginationQueryDto {
 *     @IsOptional() minPrice?: number;
 *     @IsOptional()
 *     @IsGreaterThanOrEqual('minPrice') maxPrice?: number;
 *   }
 */
export function IsGreaterThanOrEqual(property: string, validationOptions?: ValidationOptions) {
  return comparePropertyDecorator(
    {
      decoratorName: 'isGreaterThanOrEqual',
      op: 'gte',
      defaultMessageKey: 'common.validation.greater_than_or_equal.invalid',
    },
    property,
    validationOptions,
  );
}
