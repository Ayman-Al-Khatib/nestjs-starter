import { z } from 'zod';

export const databaseSchema = z.object({
  DB_HOST: z.string().min(1),
  DB_PORT: z.coerce.number().int().positive(),
  DB_USER: z.string().min(1),
  DB_PASSWORD: z.string().min(1),
  DB_NAME: z.string().min(1),
  DB_SCHEMA: z.string().min(1),
});

export type DatabaseConfig = z.infer<typeof databaseSchema>;
