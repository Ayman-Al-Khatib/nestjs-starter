import { Transform } from 'class-transformer';
import { registerDecorator, ValidationOptions } from 'class-validator';
import { Translator } from 'infrastructure/i18n';

const UTC_ISO_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z$/;

/**
 * Strict UTC ISO-8601 input. Accepts only strings of the form
 * `YYYY-MM-DDTHH:mm:ss[.sss]Z` and converts them into a `Date`. Any
 * other shape (number, missing `Z`, named offset, plain `Date`) is
 * rejected so the rest of the pipeline only ever sees UTC instants.
 */
export function IsUtcIso8601(validationOptions?: ValidationOptions): PropertyDecorator {
  return (target: object, propertyKey: string | symbol) => {
    Transform(({ value }) => {
      if (typeof value === 'string' && UTC_ISO_RE.test(value)) {
        const d = new Date(value);
        if (!isNaN(d.getTime())) return d;
      }
      return value;
    })(target, propertyKey);

    registerDecorator({
      name: 'IsUtcIso8601',
      target: target.constructor,
      propertyName: propertyKey as string,
      options: validationOptions,
      validator: {
        validate(value: unknown): boolean {
          return value instanceof Date && !isNaN(value.getTime());
        },
        defaultMessage: Translator.trValMsg('common.validation.date.must_be_utc_iso8601'),
      },
    });
  };
}
