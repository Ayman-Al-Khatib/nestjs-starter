import { writeFileSync } from 'fs';

import { GENERATED_FILE_HEADER, I18N_PATHS } from './i18n.constants';
import { KeyParameters } from './i18n.types';

export interface TypesGeneratorInput {
  allKeys: Set<string>;
  keyParameters: KeyParameters;
}

export class I18nTypesGenerator {
  constructor(private readonly outputPath: string = I18N_PATHS.generatedTypesFile) {}

  generate(input: TypesGeneratorInput): string {
    const sortedKeys = [...input.allKeys].sort();
    const parameterInterfaces = this.buildParameterInterfaces(sortedKeys, input.keyParameters);
    const translationKeysConst = this.buildTranslationKeysConstant(sortedKeys);
    const interpolationsInterface = this.buildInterpolationsInterface(
      sortedKeys,
      input.keyParameters,
    );

    return [
      GENERATED_FILE_HEADER,
      parameterInterfaces,
      translationKeysConst,
      'export type TranslationKey = keyof typeof TranslationKeys;\n',
      '// Type definitions for interpolation parameters',
      'type NoParams = undefined;\n',
      '// Placeholder type for type-safe interpolation',
      interpolationsInterface,
    ].join('\n');
  }

  write(input: TypesGeneratorInput): string {
    const content = this.generate(input);
    writeFileSync(this.outputPath, content, 'utf-8');
    return this.outputPath;
  }

  private buildParameterInterfaces(sortedKeys: string[], keyParameters: KeyParameters): string {
    return sortedKeys
      .map((key) => {
        const params = keyParameters.get(key);
        if (!params || params.size === 0) return null;
        const fields = [...params]
          .map((param) => `  ${this.normalizeParameter(param)}: string | number;`)
          .join('\n');
        return `interface ${this.toInterfaceName(key)} {\n${fields}\n}`;
      })
      .filter((entry): entry is string => entry !== null)
      .join('\n\n');
  }

  private buildTranslationKeysConstant(sortedKeys: string[]): string {
    const body = sortedKeys.map((key) => `  '${key}': '${key}',`).join('\n');
    return `const TranslationKeys = {\n${body}\n} as const;\n`;
  }

  private buildInterpolationsInterface(
    sortedKeys: string[],
    keyParameters: KeyParameters,
  ): string {
    const body = sortedKeys
      .map((key) => {
        const params = keyParameters.get(key);
        const valueType = params && params.size > 0 ? this.toInterfaceName(key) : 'NoParams';
        return `  '${key}': ${valueType};`;
      })
      .join('\n');
    return `export interface TranslationInterpolations {\n${body}\n}\n`;
  }

  private toInterfaceName(key: string): string {
    const pascal = key
      .split('.')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join('')
      .replace(/[^a-zA-Z0-9]/g, '');
    return `${pascal}Params`;
  }

  private normalizeParameter(param: string): string {
    return param.replace(/\.(\d+)/g, '_$1');
  }
}
