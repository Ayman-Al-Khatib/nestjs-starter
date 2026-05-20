import { readdirSync, readFileSync } from 'fs';
import { basename, join } from 'path';

import { ConsoleFormatter } from '../shared';
import { DEFAULT_REFERENCE_LANGUAGE, I18N_PATHS } from './i18n.constants';
import {
  JsonObject,
  JsonValue,
  LanguageStats,
  TranslationStats,
  TranslationValue,
  TranslationsByLanguage,
  ValidationResult,
} from './i18n.types';

const PARAMETER_PATTERN = /\{([^}]+)\}/g;
const JSON_EXTENSION = '.json';

export interface I18nValidatorOptions {
  basePath?: string;
  referenceLanguage?: string;
}

export class I18nValidator {
  private readonly basePath: string;
  private readonly referenceLanguage: string;
  private readonly allKeys = new Set<string>();
  private readonly languageStats: LanguageStats = {};
  private readonly translations: TranslationsByLanguage = new Map();
  private readonly keyParameters = new Map<string, Set<string>>();
  private availableLanguages: string[] = [];

  constructor(options: I18nValidatorOptions = {}) {
    this.basePath = options.basePath ?? I18N_PATHS.translations;
    this.referenceLanguage = options.referenceLanguage ?? DEFAULT_REFERENCE_LANGUAGE;
  }

  validate(): ValidationResult {
    this.discoverLanguages();
    this.loadAllLanguages();
    this.computeStatistics();
    this.computeIdenticalTranslations();

    const isFullyCovered = this.availableLanguages.every(
      (lang) => this.languageStats[lang]?.coverage === 100,
    );

    return {
      languageStats: this.languageStats,
      allKeys: this.allKeys,
      keyParameters: this.keyParameters,
      translations: this.translations,
      availableLanguages: this.availableLanguages,
      referenceLanguage: this.referenceLanguage,
      isFullyCovered,
    };
  }

  private discoverLanguages(): void {
    this.availableLanguages = readdirSync(this.basePath, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name);

    if (!this.availableLanguages.includes(this.referenceLanguage)) {
      throw new Error(
        `Reference language '${this.referenceLanguage}' not found in ${this.basePath}`,
      );
    }
  }

  private loadAllLanguages(): void {
    this.translations.set(this.referenceLanguage, this.loadLanguageData(this.referenceLanguage));
    for (const lang of this.availableLanguages) {
      if (lang !== this.referenceLanguage) {
        this.translations.set(lang, this.loadLanguageData(lang));
      }
    }
  }

  private loadLanguageData(language: string): Map<string, TranslationValue> {
    const langPath = join(this.basePath, language);
    const files = this.collectJsonFiles(langPath);
    const entries = new Map<string, TranslationValue>();

    for (const file of files) {
      try {
        const content = JSON.parse(readFileSync(file, 'utf-8')) as JsonObject;
        const fileEntries = this.extractEntries(content, file);
        fileEntries.forEach((value, key) => entries.set(key, value));
      } catch (error) {
        console.error(
          ConsoleFormatter.formatStatus('error', `Failed to parse ${file}`),
          error,
        );
      }
    }

    return entries;
  }

  private collectJsonFiles(dir: string): string[] {
    const files: string[] = [];
    for (const item of readdirSync(dir, { withFileTypes: true })) {
      const fullPath = join(dir, item.name);
      if (item.isDirectory()) {
        files.push(...this.collectJsonFiles(fullPath));
      } else if (item.isFile() && item.name.endsWith(JSON_EXTENSION)) {
        files.push(fullPath);
      }
    }
    return files;
  }

  private extractEntries(root: JsonObject, file: string): Map<string, TranslationValue> {
    const entries = new Map<string, TranslationValue>();
    const namespace = basename(file, JSON_EXTENSION);

    const traverse = (node: JsonValue, prefix: string): void => {
      if (node === null || typeof node !== 'object' || Array.isArray(node)) {
        return;
      }

      for (const [key, value] of Object.entries(node)) {
        const nestedKey = prefix ? `${prefix}.${key}` : key;

        if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
          traverse(value, nestedKey);
          continue;
        }

        const fullKey = `${namespace}.${nestedKey}`;
        const stringValue = String(value);
        const parameters = this.extractParameters(stringValue);

        this.allKeys.add(fullKey);
        entries.set(fullKey, { key: fullKey, value: stringValue, file, parameters });
        this.registerParameters(fullKey, parameters);
      }
    };

    traverse(root, '');
    return entries;
  }

  private extractParameters(value: string): Set<string> {
    const parameters = new Set<string>();
    const matches = value.match(PARAMETER_PATTERN);
    if (matches) {
      for (const match of matches) {
        parameters.add(match.slice(1, -1).trim());
      }
    }
    return parameters;
  }

  private registerParameters(key: string, parameters: Set<string>): void {
    if (parameters.size === 0) return;
    const bucket = this.keyParameters.get(key) ?? new Set<string>();
    parameters.forEach((p) => bucket.add(p));
    this.keyParameters.set(key, bucket);
  }

  private computeStatistics(): void {
    const referenceKeys = [...(this.translations.get(this.referenceLanguage)?.keys() ?? [])];

    for (const lang of this.availableLanguages) {
      const langTranslations = this.translations.get(lang);
      if (!langTranslations) continue;

      const missingKeys = referenceKeys.filter((key) => !langTranslations.has(key));
      const extraKeys = [...langTranslations.keys()].filter((key) => !referenceKeys.includes(key));
      const emptyValues: string[] = [];

      langTranslations.forEach((translation, key) => {
        if (!translation.value.trim()) emptyValues.push(key);
      });

      const validKeyCount = langTranslations.size - emptyValues.length;
      const rawCoverage = referenceKeys.length === 0 ? 100 : (validKeyCount / referenceKeys.length) * 100;
      const coverage = Math.min(100, Math.max(0, rawCoverage));

      const stats: TranslationStats = {
        totalKeys: langTranslations.size,
        missingKeys,
        extraKeys,
        emptyValues,
        identicalAcrossLangs: [],
        coverage,
      };

      this.languageStats[lang] = stats;
    }
  }

  private computeIdenticalTranslations(): void {
    const identicalKeys: string[] = [];

    for (const key of this.allKeys) {
      const values = new Set<string>();
      let allLanguagesHaveKey = true;

      for (const lang of this.availableLanguages) {
        const value = this.translations.get(lang)?.get(key)?.value;
        if (value === undefined) {
          allLanguagesHaveKey = false;
          break;
        }
        values.add(value);
      }

      if (allLanguagesHaveKey && values.size === 1) {
        identicalKeys.push(key);
      }
    }

    for (const lang of this.availableLanguages) {
      if (this.languageStats[lang]) {
        this.languageStats[lang].identicalAcrossLangs = identicalKeys;
      }
    }
  }
}
