import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator';
import { TranslationKey, Translator } from 'infrastructure/i18n';

export type CompareOp = 'gt' | 'gte' | 'lt' | 'lte';

const OP_FN: Record<CompareOp, (a: unknown, b: unknown) => boolean> = {
  gt: (a, b) => (a as never) > (b as never),
  gte: (a, b) => (a as never) >= (b as never),
  lt: (a, b) => (a as never) < (b as never),
  lte: (a, b) => (a as never) <= (b as never),
};

interface ComparePropertyConfig {
  /** Public decorator name surfaced to class-validator's error metadata. */
  decoratorName: string;
  /** Comparison operator applied as `value <op> relatedValue`. */
  op: CompareOp;
  /** Translation key used when the caller does not pass a `message`. */
  defaultMessageKey: TranslationKey;
}

/**
 * Internal factory shared by the `IsGreaterThan` / `IsGreaterThanOrEqual`
 * style decorators. Compares this property's value with another property
 * on the same object using `>`, `>=`, `<` or `<=`. Both sides falling
 * to `null`/`undefined` short-circuit to `true` so callers can compose
 * with `@IsOptional` / `@SkipIfUndefined` without surprise.
 *
 * The operators rely on JavaScript's relational coercion, which also
 * works on lexicographically-ordered strings (ISO dates, `HH:mm` times).
 */
export function comparePropertyDecorator(
  config: ComparePropertyConfig,
  property: string,
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return (object, propertyName) => {
    registerDecorator({
      name: config.decoratorName,
      target: object.constructor,
      propertyName: propertyName as string,
      constraints: [property],
      options: validationOptions,
      validator: {
        validate(value: unknown, args: ValidationArguments): boolean {
          const [relatedPropertyName] = args.constraints;
          const relatedValue = (args.object as Record<string, unknown>)[relatedPropertyName];
          if (value == null || relatedValue == null) return true;
          return OP_FN[config.op](value, relatedValue);
        },
        defaultMessage(args: ValidationArguments): string {
          const [relatedPropertyName] = args.constraints;
          return Translator.trValMsg(config.defaultMessageKey, {
            related: relatedPropertyName,
          })(args);
        },
      },
    });
  };
}
