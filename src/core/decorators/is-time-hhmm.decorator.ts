import { applyDecorators } from '@nestjs/common';
import { IsString, Matches } from 'class-validator';
import { Translator } from 'infrastructure/i18n';

const HHMM_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

/**
 * Validates a 24-hour wall-clock time in `HH:mm` format (range `00:00`
 * to `23:59`). Bundles `@IsString` so the validator handles non-string
 * inputs gracefully. For shifts that may legitimately end at end-of-day
 * use `@IsTimeHHMMOrEndOfDay` on the end-of-range field instead.
 *
 * @example
 *   @IsTimeHHMM()
 *   startTime: string; // e.g. "08:30"
 */
export function IsTimeHHMM() {
  return applyDecorators(
    IsString({ message: Translator.trValMsg('common.validation.string.invalid') }),
    Matches(HHMM_PATTERN, { message: Translator.trValMsg('common.validation.time.invalid_format') }),
  );
}
