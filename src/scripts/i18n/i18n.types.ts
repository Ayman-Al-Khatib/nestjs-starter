export interface TranslationValue {
  key: string;
  value: string;
  file: string;
  parameters: Set<string>;
}

export interface TranslationStats {
  totalKeys: number;
  missingKeys: string[];
  extraKeys: string[];
  emptyValues: string[];
  identicalAcrossLangs: string[];
  coverage: number;
}

export type LanguageStats = Record<string, TranslationStats>;

export type TranslationsByLanguage = Map<string, Map<string, TranslationValue>>;

export type KeyParameters = Map<string, Set<string>>;

export type JsonObject = { [key: string]: JsonValue };
export type JsonValue = string | number | boolean | null | JsonValue[] | JsonObject;

export interface ValidationResult {
  languageStats: LanguageStats;
  allKeys: Set<string>;
  keyParameters: KeyParameters;
  translations: TranslationsByLanguage;
  availableLanguages: string[];
  referenceLanguage: string;
  isFullyCovered: boolean;
}
