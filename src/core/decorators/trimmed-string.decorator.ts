import { applyDecorators } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { Translator } from 'infrastructure/i18n';

interface TrimmedStringOptions {
  /**
   * Minimum length AFTER trimming. Defaults to `1` (any non-empty
   * value). Set to `0` together with `allowEmpty: true` to permit
   * empty strings.
   */
  min?: number;
  /** Maximum length AFTER trimming. Omit for no upper bound. */
  max?: number;
  /**
   * When `false`, skips the leading/trailing whitespace trim. Default
   * is `true` — there is essentially no use case in this API for
   * preserving surrounding whitespace, so trimming is opt-out.
   */
  trim?: boolean;
  /**
   * Allow empty strings to pass the non-empty check. Use when the
   * field semantically distinguishes `''` from "absent" — rare. When
   * `true`, the implicit `MinLength(1)` floor is removed as well.
   */
  allowEmpty?: boolean;
}

/**
 * Bundles the recurring "string with bounds" validation chain into a
 * single decorator: trims the input, asserts it is a string, enforces
 * non-empty (unless explicitly allowed), and applies min/max length
 * bounds — all with the project's i18n messages.
 *
 * Replaces this 4-line pattern:
 * ```ts
 * @IsString({ message: Translator.trValMsg('common.validation.string.invalid') })
 * @IsNotEmpty({ message: Translator.trValMsg('common.validation.string.empty') })
 * @MinLength(1, { message: Translator.trValMsg('common.validation.string.too_short') })
 * @MaxLength(100, { message: Translator.trValMsg('common.validation.string.too_long') })
 * firstName: string;
 * ```
 * with:
 * ```ts
 * @TrimmedString({ max: 100 })
 * firstName: string;
 * ```
 *
 * The trim happens at the `class-transformer` stage, so downstream
 * validators (length checks, format checks like `@IsName`) see the
 * cleaned value.
 */
export function TrimmedString(options: TrimmedStringOptions = {}): PropertyDecorator {
  const { min = 1, max, trim = true, allowEmpty = false } = options;
  const effectiveMin = allowEmpty ? 0 : min;

  const decorators: PropertyDecorator[] = [];

  if (trim) {
    decorators.push(
      Transform(({ value }) => (typeof value === 'string' ? value.trim() : value)),
    );
  }

  decorators.push(
    IsString({ message: Translator.trValMsg('common.validation.string.invalid') }),
  );

  if (!allowEmpty) {
    decorators.push(
      IsNotEmpty({ message: Translator.trValMsg('common.validation.string.empty') }),
    );
  }

  if (effectiveMin > 0) {
    decorators.push(
      MinLength(effectiveMin, {
        message: Translator.trValMsg('common.validation.string.too_short'),
      }),
    );
  }

  if (max !== undefined) {
    decorators.push(
      MaxLength(max, {
        message: Translator.trValMsg('common.validation.string.too_long'),
      }),
    );
  }

  return applyDecorators(...decorators);
}
