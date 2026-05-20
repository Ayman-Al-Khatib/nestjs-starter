import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator';
import { Translator } from 'infrastructure/i18n';

/**
 * Validates that the field already holds a `Date` instance strictly in
 * the past. Pair with `@IsUtcIso8601()` (which converts the incoming
 * ISO-8601 string into a `Date`) — `IsPastDate` does not perform any
 * coercion of its own, so a raw string will be rejected.
 *
 * @example
 *   @IsUtcIso8601()
 *   @IsPastDate()
 *   birthDate: Date;
 */
export function IsPastDate(validationOptions?: ValidationOptions) {
  return (target: object, propertyKey: string) => {
    registerDecorator({
      name: 'IsPastDate',
      target: target.constructor,
      propertyName: propertyKey,
      options: validationOptions,
      validator: {
        validate(value: unknown): boolean {
          if (!(value instanceof Date) || isNaN(value.getTime())) return false;
          return value < new Date();
        },
        defaultMessage(args: ValidationArguments): string {
          return Translator.trValMsg('common.validation.date.must_be_past')(args);
        },
      },
    });
  };
}
