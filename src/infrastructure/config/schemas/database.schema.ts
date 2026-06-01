import { z } from 'zod';
import { envBoolean } from '../transformers';

export const databaseSchema = z.object({
  DB_HOST: z.string().min(1),
  DB_PORT: z.coerce.number().int().positive(),
  DB_USER: z.string().min(1),
  DB_PASSWORD: z.string().min(1),
  DB_NAME: z.string().min(1),
  DB_SCHEMA: z.string().min(1),

  // TLS verification for the production DB connection. Defaults to `true`
  // (secure): the server certificate must chain to a trusted CA. Set to
  // `false` ONLY for providers that present a self-signed/private cert and
  // no CA bundle is available — that disables MITM protection.
  DB_SSL_REJECT_UNAUTHORIZED: envBoolean().default(true),

  // Optional CA certificate (PEM contents) used to verify the DB server.
  // Provide this instead of disabling verification when the provider uses a
  // private CA (e.g. managed Postgres root cert).
  DB_SSL_CA: z.string().optional(),
});

export type DatabaseConfig = z.infer<typeof databaseSchema>;
