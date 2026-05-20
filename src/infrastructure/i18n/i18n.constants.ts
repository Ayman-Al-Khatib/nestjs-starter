export const SUPPORTED_LANGUAGES = ['en', 'ar'] as const;

export const DEFAULT_LANGUAGE = 'en' as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
  en: 'English',
  ar: 'العربية',
};
