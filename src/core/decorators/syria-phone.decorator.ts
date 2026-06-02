import { applyDecorators } from '@nestjs/common';
import { Transform } from 'class-transformer';
import {
  isString,
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';
import { Translator } from 'infrastructure/i18n';

interface SyriaPhoneOptions {
  /**
   * Auto-format international numbers to local format.
   * Example: `+963968381624` / `00963968381624` → `0968381624`.
   * @default false
   */
  formatToLocal?: boolean;

  /**
   * Auto-format local numbers to international format.
   * Example: `0968381624` / `00963968381624` → `+963968381624`.
   * @default false
   */
  formatToInternational?: boolean;
}

function transformSyriaPhone(options?: SyriaPhoneOptions) {
  return Transform(({ value }) => {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }

    const phoneNumber = String(value);
    let formatted = phoneNumber;

    // 1. Normalize 00963 to +963 internally for easier processing
    if (formatted.startsWith('00963')) {
      formatted = '+963' + formatted.substring(5);
    }

    // 2. Format to local (remove +963 and add 0)
    if (options?.formatToLocal && formatted.startsWith('+963')) {
      formatted = '0' + formatted.substring(4);
    }

    // 3. Format to international (remove leading 0 and add +963)
    if (options?.formatToInternational && formatted.startsWith('0')) {
      formatted = '+963' + formatted.substring(1);
    }

    return formatted;
  });
}

function isValidSyriaPhone(phone: string): boolean {
  /**
   * Regex Breakdown:
   * ^                        : Start of string
   * (09|(\+|00)9639)         : Prefix: Starts with 09 OR +9639 OR 009639
   * (3|4|5|6|8|9)            : Provider Code (Syriatel: 3,8,9 | MTN: 4,5,6)
   * [0-9]{7}                 : Remaining 7 digits
   * $                        : End of string
   */
  const syriaPhoneRegex = /^(09|(\+|00)9639)(3|4|5|6|8|9)[0-9]{7}$/;
  return syriaPhoneRegex.test(phone);
}

/**
 * Validates a Syrian mobile phone number and (optionally) normalizes it
 * into one canonical shape before validation runs. Accepts three input
 * forms — local `09xxxxxxxx`, dialing-prefix `00963xxxxxxxxx`, and
 * international `+963xxxxxxxxx` — and only allows the four real provider
 * codes (Syriatel 93/98/99 and MTN 94/95/96 — encoded in the regex via
 * the second-digit class `[3-6,8-9]`).
 *
 * @example
 *   // Store as local, accept any form from the client
 *   @SyriaPhone({ formatToLocal: true })
 *   phone: string;
 */
export function SyriaPhone(options?: SyriaPhoneOptions, validationOptions?: ValidationOptions) {
  return applyDecorators(
    transformSyriaPhone(options),
    (target: object, propertyKey: string | symbol) => {
      registerDecorator({
        name: 'SyriaPhone',
        target: target.constructor,
        propertyName: propertyKey as string,
        options: validationOptions,
        validator: {
          validate(value: unknown, _args: ValidationArguments) {
            if (value === undefined || value === null || value === '') {
              return true;
            }
            if (!isString(value)) return false;
            return isValidSyriaPhone(value);
          },
          defaultMessage(args: ValidationArguments) {
            return Translator.trValMsg('common.validation.phone.invalid_syria')(args);
          },
        },
      });
    },
  );
}
