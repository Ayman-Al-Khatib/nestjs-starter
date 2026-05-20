import { applyDecorators, BadRequestException } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { IsBoolean, ValidationOptions } from 'class-validator';
import { Translator } from 'infrastructure/i18n';

interface BooleanFieldOptions {
  /** Value used when the field is `undefined` (omitted from the payload). */
  default?: boolean;
  /** Overrides the default i18n message used when coercion fails. */
  message?: ValidationOptions['message'];
}

/**
 * Boolean DTO field decorator: coerces a request value into a real
 * `boolean` and validates the result. Accepts the canonical literals
 * (`true`, `false`, `1`, `0`, `'1'`, `'0'`, `'true'`, `'false'`) and
 * rejects everything else — including `null` and `''` — by throwing a
 * translated `BadRequestException` directly from the transform step.
 *
 * Note: this decorator short-circuits inside `@Transform` rather than
 * letting class-validator raise, because the alternative ("`@IsBoolean`
 * with an unforgiving coerce") would silently swallow truthy strings
 * like `'yes'`. The early throw keeps the contract explicit.
 *
 * @example
 *   @BooleanField({ default: false })
 *   includeArchived?: boolean;
 */
export function BooleanField(options?: BooleanFieldOptions) {
  return applyDecorators(
    Transform(({ key, obj }) => {
      const value = obj[key];

      if (value === null || value === '') {
        throw new BadRequestException(
          Translator.trStatic('common.validation.boolean.required', { property: key }),
        );
      }
      if (value === undefined) {
        return options?.default !== undefined ? options.default : undefined;
      }

      if (value === true || value === false) return value;
      if (value === 1 || value === '1' || value === 'true') return true;
      if (value === 0 || value === '0' || value === 'false') return false;

      throw new BadRequestException(
        options?.message ??
          Translator.trStatic('common.validation.boolean.invalid', { property: key }),
      );
    }),
    IsBoolean(),
  );
}
