import { applyDecorators } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { IsInt, IsNotEmpty, Min } from 'class-validator';
import { Translator } from 'infrastructure/i18n';

interface PositiveIntegerIdOptions {
  /**
   * When `true`, an explicit `null` (or empty / `'null'`) value resolves to
   * `null` and skips the integer validators — use for nullable FK columns
   * where the caller may want to detach the relation. When `false` (default),
   * those same inputs resolve to `undefined`, so an upstream `@IsNotEmpty`
   * still rejects the field.
   */
  nullable?: boolean;
}

/**
 * Body / query primary-key field: coerces the incoming value into a
 * positive integer and runs the standard integer-id validation chain
 * with i18n messages. Accepts numbers as well as numeric strings so it
 * is safe on both JSON bodies and query strings.
 */
export function PositiveIntegerId({ nullable = false }: PositiveIntegerIdOptions = {}) {
  return applyDecorators(
    Transform(({ obj, key }) => {
      const value = obj[key];
      if (value === null || value === undefined || value === '' || value === 'null') {
        return nullable ? null : undefined;
      }
      const num = Number(value);
      return isNaN(num) ? undefined : num;
    }),
    IsNotEmpty({ message: Translator.trValMsg('common.validation.id.empty') }),
    IsInt({ message: Translator.trValMsg('common.validation.id.integer') }),
    Min(1, { message: Translator.trValMsg('common.validation.id.positive') }),
  );
}
