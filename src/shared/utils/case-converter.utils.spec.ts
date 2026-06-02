import { CaseConverterUtils } from './case-converter.utils';

describe('CaseConverterUtils', () => {
  describe('toCamelCase', () => {
    it('converts snake_case keys to camelCase recursively', () => {
      const input = { first_name: 'a', nested_obj: { created_at: 1 } };
      expect(CaseConverterUtils.toCamelCase(input)).toEqual({
        firstName: 'a',
        nestedObj: { createdAt: 1 },
      });
    });

    it('converts kebab-case keys to camelCase', () => {
      expect(CaseConverterUtils.toCamelCase({ 'x-case-format': 1 })).toEqual({
        xCaseFormat: 1,
      });
    });

    it('maps over arrays of objects', () => {
      const input = [{ user_id: 1 }, { user_id: 2 }];
      expect(CaseConverterUtils.toCamelCase(input)).toEqual([
        { userId: 1 },
        { userId: 2 },
      ]);
    });

    it('preserves Date instances by reference (does not recurse into them)', () => {
      const date = new Date('2026-01-01T00:00:00.000Z');
      const result = CaseConverterUtils.toCamelCase<Record<string, Date>>({
        created_at: date,
      });
      expect(result).toEqual({ createdAt: date });
      expect(result.createdAt).toBe(date);
    });

    it('passes primitives and null through unchanged', () => {
      expect(CaseConverterUtils.toCamelCase(null)).toBeNull();
      expect(CaseConverterUtils.toCamelCase(42)).toBe(42);
      expect(CaseConverterUtils.toCamelCase('snake_value')).toBe('snake_value');
    });
  });

  describe('toSnakeCase', () => {
    it('converts camelCase keys to snake_case recursively', () => {
      const input = { firstName: 'a', nestedObj: { createdAt: 1 } };
      expect(CaseConverterUtils.toSnakeCase(input)).toEqual({
        first_name: 'a',
        nested_obj: { created_at: 1 },
      });
    });

    it('maps over arrays', () => {
      expect(CaseConverterUtils.toSnakeCase([{ userId: 1 }])).toEqual([{ user_id: 1 }]);
    });

    it('is the inverse of toCamelCase for round-trippable keys', () => {
      const camel = { firstName: 'a', lastName: 'b' };
      const snake = CaseConverterUtils.toSnakeCase(camel);
      expect(CaseConverterUtils.toCamelCase(snake)).toEqual(camel);
    });
  });
});
