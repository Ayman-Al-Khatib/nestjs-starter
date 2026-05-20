import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator';
import { Translator } from 'infrastructure/i18n';
import { isValidIanaTimezone } from 'shared/utils/timezone.util';

/**
 * Validates that the value is a recognized IANA timezone identifier
 * (e.g. `Asia/Damascus`, `America/New_York`). Probes
 * `Intl.DateTimeFormat({ timeZone })` and treats `RangeError` as a
 * rejection. Pair with `IsString` upstream — this decorator only
 * checks the IANA validity once a string is in hand.
 */
export function IsIanaTimezone(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isIanaTimezone',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown): boolean {
          return typeof value === 'string' && isValidIanaTimezone(value);
        },
        defaultMessage(args: ValidationArguments): string {
          return Translator.trValMsg('common.validation.timezone.invalid')(args);
        },
      },
    });
  };
}
