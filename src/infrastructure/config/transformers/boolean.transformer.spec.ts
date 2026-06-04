import { z } from 'zod';
import { envBoolean, parseEnvBoolean } from './boolean.transformer';

describe('parseEnvBoolean', () => {
  it.each(['true', 'YES', '1', 'on', ' On '])('treats %s as true', (value) => {
    expect(parseEnvBoolean(value)).toBe(true);
  });

  it.each(['false', 'NO', '0', 'off', ' Off '])('treats %s as false', (value) => {
    expect(parseEnvBoolean(value)).toBe(false);
  });

  it('does NOT coerce the string "false" to true (the classic JS pitfall)', () => {
    expect(parseEnvBoolean('false')).toBe(false);
  });

  it('throws on an unrecognized value', () => {
    expect(() => parseEnvBoolean('maybe')).toThrow(/Invalid boolean value/);
  });
});

describe('envBoolean', () => {
  const schema = z.object({ flag: envBoolean(), withDefault: envBoolean().default(false) });

  it('parses string env values into booleans', () => {
    expect(schema.parse({ flag: 'true' }).flag).toBe(true);
    expect(schema.parse({ flag: 'off' }).flag).toBe(false);
  });

  it('passes native booleans through (so .default works)', () => {
    expect(schema.parse({ flag: true }).flag).toBe(true);
    expect(schema.parse({ flag: 'yes' }).withDefault).toBe(false);
  });

  it('reports a validation issue for invalid values', () => {
    const result = schema.safeParse({ flag: 'nope' });
    expect(result.success).toBe(false);
  });
});
