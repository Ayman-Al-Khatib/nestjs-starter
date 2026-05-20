import { applyDecorators } from '@nestjs/common';
import { IsString, Matches } from 'class-validator';
import { Translator } from 'infrastructure/i18n';

const HHMM_OR_END_OF_DAY_PATTERN = /^(([01]\d|2[0-3]):[0-5]\d|24:00)$/;

/**
 * Like `IsTimeHHMM`, but additionally accepts the sentinel `'24:00'`
 * meaning "end of the local day" (i.e. the instant that starts the
 * next local day). Use only on the END of a time range — never on
 * the start — since a shift cannot begin at end-of-day.
 *
 * @example
 *   @IsTimeHHMM() startTime: string;
 *   @IsTimeHHMMOrEndOfDay()
 *   @IsGreaterThan('startTime') endTime: string; // accepts "24:00"
 */
export function IsTimeHHMMOrEndOfDay() {
  return applyDecorators(
    IsString({ message: Translator.trValMsg('common.validation.string.invalid') }),
    Matches(HHMM_OR_END_OF_DAY_PATTERN, {
      message: Translator.trValMsg('common.validation.time.invalid_format'),
    }),
  );
}
