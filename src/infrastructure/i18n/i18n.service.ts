import { Injectable } from '@nestjs/common';
import { ValidationArguments } from 'class-validator';
import { I18nContext, I18nService, i18nValidationMessage } from 'nestjs-i18n';
import { TranslationInterpolations, TranslationKey } from './translation-keys';

type InterpolationArgs<K extends TranslationKey> =
  TranslationInterpolations[K] extends undefined
    ? []
    : [interpolations: TranslationInterpolations[K]];

/**
 * Singleton translator. Reads the active request's language from
 * `I18nContext` (AsyncLocalStorage) on every call, so it can be
 * injected into singleton-scoped services without forcing them
 * to become request-scoped.
 */
@Injectable()
export class Translator {
  constructor(private readonly i18n: I18nService) {}

  /**
   * Translates a key into the active request's language.
   * Falls back to the configured default language when no
   * `I18nContext` is bound (e.g. seeders, background jobs).
   */
  tr<K extends TranslationKey>(key: K, ...rest: InterpolationArgs<K>): string {
    return this.i18n.translate(key, {
      lang: I18nContext.current()?.lang,
      args: rest[0] as object | undefined,
    });
  }

  /**
   * Static one-shot translation for use inside decorator factories,
   * `Transform` callbacks, and other places where DI is unavailable.
   * Resolves the active request's language via `I18nContext.current()`,
   * or returns the raw key when no context is bound.
   */
  static trStatic<K extends TranslationKey>(key: K, ...rest: InterpolationArgs<K>): string {
    const ctx = I18nContext.current();
    if (!ctx) return key;
    return ctx.translate(key, { args: rest[0] as object | undefined });
  }

  /**
   * Returns a localized validation-message factory for class-validator.
   *
   * Encodes the translation key + args via `i18nValidationMessage` so the
   * single translation pass happens later inside `i18nValidationErrorFactory`
   * (via `formatI18nErrors`). The property label is resolved eagerly because
   * it is itself a translation, not a message template.
   *
   * - Translates the property name via `keys.<property>`, falling back to
   *   the raw camelCase name when no label is defined.
   * - Maps the first class-validator constraint to the named placeholders
   *   `{min}` and `{max}` that templates expect (covers `@Min`/`@Max`/
   *   `@MinLength`/`@MaxLength`/...).
   * - Extra `interpolations` are merged in and override the defaults.
   */
  static trValMsg(
    key: TranslationKey,
    interpolations?: Record<string, unknown>,
  ): (args: ValidationArguments) => string {
    return (args: ValidationArguments) => {
      const property = Translator.resolvePropertyLabel(I18nContext.current(), args.property);
      const [primaryConstraint] = args.constraints ?? [];

      return i18nValidationMessage(key, {
        property,
        min: primaryConstraint,
        max: primaryConstraint,
        ...interpolations,
      })(args);
    };
  }

  // nestjs-i18n returns the lookup key itself when a translation is missing —
  // detect that and use the raw property name so validation messages stay readable.
  private static resolvePropertyLabel(ctx: I18nContext | undefined, property: string): string {
    if (!ctx?.translate) return property;
    const lookupKey = `keys.${property}`;
    const translated = ctx.translate(lookupKey) as string;
    return !translated || translated === lookupKey ? property : translated;
  }
}
