export const CASE_FORMAT_HEADER = 'x-case-format';
export const SNAKE_CASE = 'snake';

type AnyRecord = Record<string, unknown>;

export class CaseConverterUtils {
  static toCamelCase<T = unknown>(input: T): T {
    return convertKeys(input, toCamelKey) as T;
  }

  static toSnakeCase<T = unknown>(input: T): T {
    return convertKeys(input, toSnakeKey) as T;
  }
}

function convertKeys(value: unknown, convertKey: (key: string) => string): unknown {
  if (value === null || typeof value !== 'object') return value;
  if (value instanceof Date) return value;
  if (Array.isArray(value)) return value.map((item) => convertKeys(item, convertKey));

  return Object.keys(value as AnyRecord).reduce<AnyRecord>((result, key) => {
    result[convertKey(key)] = convertKeys((value as AnyRecord)[key], convertKey);
    return result;
  }, {});
}

function toCamelKey(key: string): string {
  return key.replace(/[-_]([a-z])/gi, (_, char: string) => char.toUpperCase());
}

function toSnakeKey(key: string): string {
  return key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}
