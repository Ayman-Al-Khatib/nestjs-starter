import { QueryRunner } from 'typeorm';
import {
  createSchemaIfNotExists,
  getConnectionSchema,
  scopeToConnectionSchema,
} from './migration-utils';

function queryRunner(schema?: string) {
  const query = jest.fn().mockResolvedValue(undefined);
  const qr = {
    connection: { options: schema ? { schema } : {} },
    query,
  } as unknown as QueryRunner;
  return { qr, query };
}

describe('migration-utils', () => {
  describe('getConnectionSchema', () => {
    it('returns the configured schema', () => {
      const { qr } = queryRunner('tenant_a');
      expect(getConnectionSchema(qr)).toBe('tenant_a');
    });
    it('defaults to public when none is configured', () => {
      const { qr } = queryRunner();
      expect(getConnectionSchema(qr)).toBe('public');
    });
  });

  it('createSchemaIfNotExists issues an idempotent CREATE SCHEMA', async () => {
    const { qr, query } = queryRunner('tenant_a');
    await createSchemaIfNotExists(qr);
    expect(query).toHaveBeenCalledWith('CREATE SCHEMA IF NOT EXISTS "tenant_a"');
  });

  it('scopeToConnectionSchema sets the session search_path', async () => {
    const { qr, query } = queryRunner('tenant_a');
    await scopeToConnectionSchema(qr);
    expect(query).toHaveBeenCalledWith('SET LOCAL search_path TO "tenant_a"');
  });
});
