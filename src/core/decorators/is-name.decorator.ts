import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator';
import { Translator } from 'infrastructure/i18n';

// Pure Arabic words separated by single spaces.
const ARABIC_NAME = /^[؀-ۿ]+(?: [؀-ۿ]+)*$/;

// Pure English words separated by single spaces.
const ENGLISH_NAME = /^[a-zA-Z]+(?: [a-zA-Z]+)*$/;

/**
 * Accepts a name that is either:
 *   - Pure Arabic letters (with single spaces between words), or
 *   - Pure English letters (with single spaces between words).
 *
 * Mixing Arabic and English in the same value is rejected.
 * Leading/trailing spaces and consecutive spaces are rejected.
 */
export function IsName(validationOptions?: ValidationOptions) {
  return (target: object, propertyKey: string) => {
    registerDecorator({
      name: 'IsName',
      target: target.constructor,
      propertyName: propertyKey,
      options: validationOptions,
      validator: {
        validate(value: unknown): boolean {
          if (typeof value !== 'string') return false;
          return ARABIC_NAME.test(value) || ENGLISH_NAME.test(value);
        },
        defaultMessage(args: ValidationArguments): string {
          return Translator.trValMsg('common.validation.name.invalid')(args);
        },
      },
    });
  };
}
